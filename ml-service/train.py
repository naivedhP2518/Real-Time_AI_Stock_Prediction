import os
import argparse
import pickle
import numpy as np
import matplotlib
matplotlib.use('Agg') # Non-interactive backend for server environments
import matplotlib.pyplot as plt

from utils.data_processor import fetch_stock_history, calculate_technical_indicators, preprocess_for_lstm
from models.lstm_model import build_lstm_model, HAS_TENSORFLOW

def train_stock_prediction(symbol, epochs=10, batch_size=32):
    """
    Orchestrates historical data download, technical features computations,
    and trains an LSTM prediction model for the selected symbol.
    """
    print(f"==================================================")
    print(f"Starting ML Training Pipeline for: {symbol}")
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
    
    # 3. Preprocess for LSTM
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
    
    # 4. Instantiate and Train LSTM Model
    # input_shape: (sequence_length, features) -> X.shape[1], X.shape[2]
    model = build_lstm_model((X.shape[1], X.shape[2]))
    
    # Train
    validation_split = 0.15
    history = model.fit(
        X, y, 
        epochs=epochs, 
        batch_size=batch_size, 
        validation_split=validation_split,
        verbose=1
    )
    
    # 5. Save model
    model_path = f"trained_models/{symbol}_model"
    if HAS_TENSORFLOW:
        # Standard Keras model saving
        model.save(model_path)
        print(f"[Train] Model saved successfully via TensorFlow/Keras to {model_path}")
    else:
        # Fallback NumPy model weights saving
        model.save(model_path)
        print(f"[Train] Model weights saved successfully via Numerical Fallback to {model_path}")
        
    # 6. Plot and Save training history graph
    try:
        plt.figure(figsize=(10, 5))
        plt.plot(history.history['loss'], label='Training Loss')
        plt.plot(history.history['val_loss'], label='Validation Loss')
        plt.title(f'LSTM Model Training Loss: {symbol}')
        plt.xlabel('Epochs')
        plt.ylabel('Mean Squared Error')
        plt.legend()
        plt.grid(True)
        
        plot_path = f"trained_models/{symbol}_loss.png"
        plt.savefig(plot_path)
        plt.close()
        print(f"[Train] Loss metrics graph successfully saved to {plot_path}")
    except Exception as graph_err:
        print(f"[Warning] Failed to generate loss graph: {graph_err}")
        
    print(f"==================================================")
    print(f"ML Training Pipeline Successfully Completed for: {symbol}")
    print(f"==================================================")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="QUANTUMSTOCKS LSTM training pipeline command line utility")
    parser.add_argument("--symbol", type=str, default="AAPL", help="Stock symbol (e.g. AAPL, TSLA)")
    parser.add_argument("--epochs", type=int, default=10, help="Number of training epochs")
    parser.add_argument("--batch_size", type=int, default=32, help="Batch size")
    args = parser.parse_args()
    
    train_stock_prediction(args.symbol.upper(), epochs=args.epochs, batch_size=args.batch_size)
