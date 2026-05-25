import os
import pickle
import numpy as np

# Change directory to ensure smooth relative imports if executed directly
os.chdir(os.path.dirname(os.path.abspath(__file__)))

from utils.data_processor import (
    fetch_stock_history, 
    calculate_technical_indicators, 
    preprocess_for_lstm,
    prepare_latest_sequence
)
from models.lstm_model import build_lstm_model

def run_local_validation():
    print("--- STARTING LOCAL PIPELINE VALIDATION ---")
    
    symbol = "AAPL"
    
    # 1. Fetch History
    print("\n[Step 1] Fetching AAPL historical data...")
    try:
        df = fetch_stock_history(symbol, period="1mo")
        print(f"Success! Retrieved {len(df)} daily bars.")
        print(f"Columns: {list(df.columns)}")
    except Exception as e:
        print(f"Error fetching history: {e}")
        return
        
    # 2. Indicators
    print("\n[Step 2] Calculating technical indicators (RSI, Moving Average, MACD)...")
    df_ind = calculate_technical_indicators(df)
    print(f"Success! New Columns: {list(df_ind.columns)}")
    
    # 3. Preprocess
    print("\n[Step 3] Transforming datasets for LSTM...")
    X, y, scaler, _ = preprocess_for_lstm(df_ind, sequence_length=10) # use 10 days for quick test
    print(f"Success! X Shape: {X.shape}, y Shape: {y.shape}")
    
    # 4. Instantiate Model
    print("\n[Step 4] Building LSTM model network...")
    model = build_lstm_model((X.shape[1], X.shape[2]))
    print(f"Success! Model compiled.")
    
    # 5. Fast Training Cycle
    print("\n[Step 5] Executing rapid validation training (1 epoch)...")
    model.fit(X, y, epochs=1, batch_size=4, verbose=1)
    
    # 6. Predict inference
    print("\n[Step 6] Running model prediction target...")
    latest_seq, _ = prepare_latest_sequence(df_ind, sequence_length=10, scaler=scaler)
    scaled_pred = model.predict(latest_seq)
    
    # De-normalize predicted price
    dummy_row = np.zeros((1, X.shape[2]))
    dummy_row[0, 0] = scaled_pred[0, 0]
    actual_pred = scaler.inverse_transform(dummy_row)[0, 0]
    
    print(f"\n[Result] Tomorrow's Predicted AAPL Price: ${actual_pred:.2f}")
    print(f"Current Closing Price: ${df_ind['close'].iloc[-1]:.2f}")
    print("\n--- PIPELINE VALIDATION COMPLETED SUCCESSFULLY ---")

if __name__ == "__main__":
    run_local_validation()
