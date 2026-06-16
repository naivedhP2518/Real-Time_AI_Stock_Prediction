import os
import json
import numpy as np

PERFORMANCE_FILE = "trained_models/performance.json"

def load_performance_metrics():
    """
    Loads saved model training and forecast evaluation parameters from JSON DB.
    """
    if os.path.exists(PERFORMANCE_FILE):
        try:
            with open(PERFORMANCE_FILE, "r") as f:
                return json.load(f)
        except Exception as e:
            print(f"[Ensemble Engine] Warning loading metrics DB: {e}")
            
    # Default placeholder tracking metrics for each model
    return {
        "LSTM": {"mae": 0.0142, "rmse": 0.0195, "latency_ms": 12.0, "success_rate": 86.5},
        "GRU": {"mae": 0.0135, "rmse": 0.0188, "latency_ms": 9.5, "success_rate": 87.2},
        "RandomForest": {"mae": 0.0165, "rmse": 0.0225, "latency_ms": 4.2, "success_rate": 84.1},
        "XGBoost": {"mae": 0.0118, "rmse": 0.0152, "latency_ms": 5.8, "success_rate": 89.4},
        "ARIMA": {"mae": 0.0208, "rmse": 0.0285, "latency_ms": 2.1, "success_rate": 78.5},
        "Prophet": {"mae": 0.0195, "rmse": 0.0264, "latency_ms": 35.0, "success_rate": 80.2},
        "CNN-LSTM": {"mae": 0.0125, "rmse": 0.0171, "latency_ms": 15.2, "success_rate": 88.6},
        "LinearRegression": {"mae": 0.0242, "rmse": 0.0315, "latency_ms": 1.2, "success_rate": 75.0}
    }

def save_performance_metrics(metrics):
    """
    Persists tracking parameter metrics to JSON DB.
    """
    os.makedirs(os.path.dirname(PERFORMANCE_FILE), exist_ok=True)
    try:
        with open(PERFORMANCE_FILE, "w") as f:
            json.dump(metrics, f, indent=4)
    except Exception as e:
        print(f"[Ensemble Engine] Error saving metrics DB: {e}")

def update_model_latency(model_name, latency_ms):
    """
    Updates prediction execution duration metric for leaderboard rankings.
    """
    metrics = load_performance_metrics()
    if model_name in metrics:
        # Rolling average latency
        prev_latency = metrics[model_name].get("latency_ms", 10.0)
        metrics[model_name]["latency_ms"] = round(prev_latency * 0.8 + latency_ms * 0.2, 2)
        save_performance_metrics(metrics)

class EnsemblePredictionEngine:
    """
    Institutional-grade prediction combiner aggregating multiple time-series
    models and machine learning forecasts using performance-weighted consensus algorithms.
    """
    def __init__(self):
        self.metrics = load_performance_metrics()
        
    def calculate_ensemble_weights(self, active_models):
        """
        Computes dynamic combination weights based on recent Mean Absolute Error (MAE).
        Inverse MAE formulation ensures more accurate models dominate prediction.
        """
        weights = {}
        total_inv_mae = 0.0
        
        # Calculate inverse MAE
        for model in active_models:
            model_mae = self.metrics.get(model, {}).get("mae", 0.02)
            # Avoid division by zero
            inv_mae = 1.0 / max(1e-6, model_mae)
            weights[model] = inv_mae
            total_inv_mae += inv_mae
            
        # Normalize weights
        for model in active_models:
            weights[model] = round(weights[model] / total_inv_mae, 4)
            
        return weights

    def generate_consensus_forecast(self, model_predictions, change_pcts, confidences):
        """
        Aggregates individual forecast inputs into a unified target consensus profile.
        
        Parameters:
        - model_predictions: dict mapping model name to future price projection array
        - change_pcts: dict mapping model name to next-day percentage drift prediction
        - confidences: dict mapping model name to confidence score
        """
        active_models = list(model_predictions.keys())
        if not active_models:
            raise ValueError("[Ensemble] No model predictions provided for combining consensus.")
            
        weights = self.calculate_ensemble_weights(active_models)
        print(f"[Ensemble Engine] Combining {active_models} using weights: {weights}")
        
        # 1. Weighted next-day price projection
        weighted_pred = 0.0
        weighted_change = 0.0
        weighted_confidence = 0.0
        
        for model in active_models:
            w = weights[model]
            weighted_pred += model_predictions[model][0]["price"] * w
            weighted_change += change_pcts[model] * w
            weighted_confidence += confidences[model] * w
            
        # 2. Weighted multi-day projection sequence (typically 7 days)
        forecast_length = len(model_predictions[active_models[0]])
        weighted_future_series = []
        
        for day_idx in range(forecast_length):
            day_price = 0.0
            day_upper = 0.0
            day_lower = 0.0
            
            for model in active_models:
                w = weights[model]
                model_fut = model_predictions[model][day_idx]
                
                # Extract components
                price = model_fut.get("price", 0.0)
                upper = model_fut.get("upper", price * 1.01)
                lower = model_fut.get("lower", price * 0.99)
                
                day_price += price * w
                day_upper += upper * w
                day_lower += lower * w
                
            weighted_future_series.append({
                "price": round(day_price, 2),
                "upper": round(day_upper, 2),
                "lower": round(day_lower, 2)
            })
            
        # 3. Consensus Direction trend signal
        # BULLISH if change > 1.0%, BEARISH if < -1.0%, CONSOLIDATING/NEUTRAL otherwise
        if weighted_change >= 1.0:
            trend = "BULLISH"
        elif weighted_change <= -1.0:
            trend = "BEARISH"
        else:
            trend = "NEUTRAL"
            
        return {
            "ensemblePrediction": round(weighted_pred, 2),
            "changePercent": round(weighted_change, 2),
            "trend": trend,
            "confidence": round(weighted_confidence, 1),
            "weights": weights,
            "modelsUsed": active_models,
            "futurePrices": weighted_future_series
        }
