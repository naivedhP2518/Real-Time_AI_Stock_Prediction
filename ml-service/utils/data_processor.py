import os
import numpy as np
import pandas as pd
import yfinance as yf
from sklearn.preprocessing import MinMaxScaler

def fetch_stock_history(symbol, period="2y", interval="1d"):
    """
    Fetch historical stock data using yfinance.
    Default: 2 years of daily data.
    """
    print(f"Fetching history for {symbol} ({period})...")
    ticker = yf.Ticker(symbol)
    df = ticker.history(period=period, interval=interval)
    
    if df.empty:
        raise ValueError(f"No historical data found for symbol {symbol}")
        
    df = df.reset_index()
    # Normalize column names to lowercase
    df.columns = [col.lower() for col in df.columns]
    
    # Ensure Date is string or standardized format
    if 'date' in df.columns:
        df['date'] = df['date'].dt.strftime('%Y-%m-%d')
    
    return df

def calculate_technical_indicators(df):
    """
    Calculate RSI, SMA, MACD, Bollinger Bands, EMA, VWAP, and ATR technical indicators.
    """
    df = df.copy()
    
    # 1. Simple Moving Average (SMA 20)
    df['sma_20'] = df['close'].rolling(window=20).mean()
    df['sma_20'] = df['sma_20'].bfill()
    
    # 2. Relative Strength Index (RSI 14)
    delta = df['close'].diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    
    avg_gain = gain.rolling(window=14).mean()
    avg_loss = loss.rolling(window=14).mean()
    
    avg_gain = avg_gain.fillna(0)
    avg_loss = avg_loss.fillna(0)
    
    rs = avg_gain / np.where(avg_loss == 0, 1e-9, avg_loss)
    df['rsi'] = 100 - (100 / (1 + rs))
    df['rsi'] = df['rsi'].fillna(50)
    
    # 3. MACD (EMA 12, EMA 26, Signal 9)
    ema_12 = df['close'].ewm(span=12, adjust=False).mean()
    ema_26 = df['close'].ewm(span=26, adjust=False).mean()
    df['macd'] = ema_12 - ema_26
    df['macd_signal'] = df['macd'].ewm(span=9, adjust=False).mean()
    
    df['macd'] = df['macd'].fillna(0)
    df['macd_signal'] = df['macd_signal'].fillna(0)

    # 4. Bollinger Bands (20-day, 2x StdDev)
    bb_std = df['close'].rolling(window=20).std()
    df['bb_upper'] = df['sma_20'] + (2 * bb_std)
    df['bb_lower'] = df['sma_20'] - (2 * bb_std)
    df['bb_upper'] = df['bb_upper'].bfill()
    df['bb_lower'] = df['bb_lower'].bfill()
    
    # 5. EMA overlays (12, 26)
    df['ema_12'] = ema_12
    df['ema_26'] = ema_26

    # 6. VWAP (Rolling 20-day Volume Weighted Average Price)
    typical_price = (df['high'] + df['low'] + df['close']) / 3.0
    vol_sum = df['volume'].rolling(window=20).sum()
    df['vwap'] = (typical_price * df['volume']).rolling(window=20).sum() / np.where(vol_sum == 0, 1e-9, vol_sum)
    df['vwap'] = df['vwap'].fillna(df['close']).bfill()

    # 7. ATR (Average True Range 14-day)
    high_low = df['high'] - df['low']
    high_pc = (df['high'] - df['close'].shift(1)).abs()
    low_pc = (df['low'] - df['close'].shift(1)).abs()
    tr = pd.concat([high_low, high_pc, low_pc], axis=1).max(axis=1)
    df['atr'] = tr.rolling(window=14).mean()
    df['atr'] = df['atr'].fillna(0.0).bfill()
    
    return df

def preprocess_for_lstm(df, sequence_length=60, feature_cols=None):
    """
    Normalize features and generate 3D sequence arrays for LSTM training.
    Returns: X (samples, sequence_length, features), y (samples,), scaler
    """
    if feature_cols is None:
        feature_cols = ['close', 'open', 'high', 'low', 'volume', 'sma_20', 'rsi', 'macd']
        
    # Drop rows with NaN if any remain
    df_clean = df.dropna(subset=feature_cols).copy()
    
    data = df_clean[feature_cols].values
    
    # Normalize features
    scaler = MinMaxScaler(feature_range=(0, 1))
    scaled_data = scaler.fit_transform(data)
    
    X, y = [], []
    for i in range(sequence_length, len(scaled_data)):
        X.append(scaled_data[i-sequence_length:i])
        # We target prediction of close price (index 0 in feature_cols)
        y.append(scaled_data[i, 0])
        
    return np.array(X), np.array(y), scaler, scaled_data

def prepare_latest_sequence(df, sequence_length=60, feature_cols=None, scaler=None):
    """
    Prepares the absolute latest window sequence for tomorrow's prediction inference.
    """
    if feature_cols is None:
        feature_cols = ['close', 'open', 'high', 'low', 'volume', 'sma_20', 'rsi', 'macd']
        
    df_clean = df.dropna(subset=feature_cols).copy()
    
    if len(df_clean) < sequence_length:
        raise ValueError(f"Insufficient history ({len(df_clean)} rows) to extract a {sequence_length}-day window.")
        
    latest_data = df_clean[feature_cols].tail(sequence_length).values
    
    if scaler is not None:
        scaled_latest = scaler.transform(latest_data)
    else:
        scaler = MinMaxScaler(feature_range=(0, 1))
        scaled_latest = scaler.fit_transform(latest_data)
        
    # Reshape for LSTM: (1, sequence_length, features)
    sequence = np.reshape(scaled_latest, (1, sequence_length, len(feature_cols)))
    return sequence, scaler
