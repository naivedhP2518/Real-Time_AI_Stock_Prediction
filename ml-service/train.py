import os
import argparse
import pickle
import numpy as np
import matplotlib
matplotlib.use('Agg') # Non-interactive backend for server environments
import matplotlib.pyplot as plt

from utils.data_processor import fetch_stock_history, calculate_technical_indicators, preprocess_for_lstm
from models.lstm_model import build_lstm_model, HAS_TENSORFLOW
from models.gru_model import build_gru_model
from models.random_forest import build_random_forest_model
from models.xgboost_model import build_xgboost_model
from models.arima_model import build_arima_model
from models.prophet_model import build_prophet_model
from models.cnn_lstm_model import build_cnn_lstm_model
from models.linear_regression import build_linear_regression_model

def train_stock_prediction(symbol, epochs=10, batch_size=32):
    """
    Orchestrates historical data download, technical features computations,
    and trains all 8 forecasting models (LSTM, GRU, RF, XGB, ARIMA, Prophet,
    CNN-LSTM, Linear Regression) for the selected symbol, updating performance scores.
    """
    print(f"==================================================")
    print(f"Starting Multi-Model Training Pipeline for: {symbol}")
    print(f"==================================================")
    
    # Ensure directories exist
    os.makedirs("datasets", exist_ok=True)
    os.makedirs("trained_models", exist_ok=True)
    
    # 1. Fetch data
    try:
        df = fetch_stock_history(symbol, period="2y")
    except Exception as e:
        print(f"Error fetching history: {e}")
        return False
        
    # 2. Indicators
    df_with_indicators = calculate_technical_indicators(df)
    
    # Save processed dataset to csv
    dataset_path = f"datasets/{symbol}_history.csv"
    df_with_indicators.to_csv(dataset_path, index=False)
    print(f"[Train] Saved engineered dataset to {dataset_path}")
    
    # 3. Preprocess for LSTM / Sequence Models
    X, y, scaler, _ = preprocess_for_lstm(df_with_indicators)
    
    if len(X) == 0:
        print("[Error] No training sequences generated. Not enough data points.")
        return False
        
    print(f"[Train] Generated X matrix shape: {X.shape}, y shape: {y.shape}")
    
    # Save the scaler so we can decode predictions during inference
    scaler_path = f"trained_models/{symbol}_scaler.pkl"
    with open(scaler_path, "wb") as f:
        pickle.dump(scaler, f)
    print(f"[Train] Scaler serialized and saved to {scaler_path}")
    
    # Define models dictionary
    models_to_train = {
        "lstm": build_lstm_model((X.shape[1], X.shape[2])),
        "gru": build_gru_model((X.shape[1], X.shape[2])),
        "random_forest": build_random_forest_model((X.shape[1], X.shape[2])),
        "xgboost": build_xgboost_model((X.shape[1], X.shape[2])),
        "arima": build_arima_model((X.shape[1], X.shape[2])),
        "prophet": build_prophet_model((X.shape[1], X.shape[2])),
        "cnn_lstm": build_cnn_lstm_model((X.shape[1], X.shape[2])),
        "linear_regression": build_linear_regression_model((X.shape[1], X.shape[2]))
    }
    
    # Train each model
    for model_name, model in models_to_train.items():
        print(f"\n--- Training Model: {model_name.upper()} ---")
        try:
            # Statsmodels/Prophet wrap differently internally, but follow standard .fit()
            history = model.fit(
                X, y, 
                epochs=epochs, 
                batch_size=batch_size, 
                validation_split=0.15,
                verbose=0
            )
            
            # Save model
            model_path = f"trained_models/{symbol}_{model_name}_model"
            model.save(model_path)
            
            # Also save default lstm model path to maintain backward compatibility!
            if model_name == "lstm":
                default_path = f"trained_models/{symbol}_model"
                model.save(default_path)
                print(f"[Train] Saved LSTM model to backward-compatible path: {default_path}")
                
            print(f"[Train] Successfully trained and saved model: {model_name}")
        except Exception as e:
            print(f"[Train Error] Failed training model {model_name}: {e}")
            
    print(f"==================================================")
    print(f"Multi-Model Training Pipeline Successfully Completed for: {symbol}")
    print(f"==================================================")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="QUANTUMSTOCKS Multi-Model training pipeline command line utility")
    parser.add_argument("--symbol", type=str, default="AAPL", help="Stock symbol (e.g. AAPL, TSLA)")
    parser.add_argument("--epochs", type=int, default=5, help="Number of training epochs")
    parser.add_argument("--batch_size", type=int, default=32, help="Batch size")
    args = parser.parse_args()
    
    train_stock_prediction(args.symbol.upper(), epochs=args.epochs, batch_size=args.batch_size)
