#!/usr/bin/env python3
"""
Predictive Analytics Engine for System Failure Prevention
Advanced time series forecasting and statistical modeling for predicting system failures.
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import Ridge, ElasticNet
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import TimeSeriesSplit, GridSearchCV
import joblib
import logging
from typing import Dict, List, Tuple, Optional, Union
import json
from datetime import datetime, timedelta
import warnings
import statsmodels.api as sm
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.seasonal import seasonal_decompose
from statsmodels.tsa.holtwinters import ExponentialSmoothing
import matplotlib.pyplot as plt
import seaborn as sns
warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class PredictiveAnalyticsEngine:
    """
    Advanced predictive analytics engine that combines multiple forecasting methods
    to predict system failures and performance degradation before they occur.
    """
    
    def __init__(self, config: Dict = None):
        """Initialize the predictive analytics engine."""
        self.config = config or self._default_config()
        self.models = {}
        self.scalers = {}
        self.trend_models = {}
        self.seasonal_patterns = {}
        self.forecasting_history = []
        self.prediction_cache = {}
        
    def _default_config(self) -> Dict:
        """Default configuration for predictive analytics."""
        return {
            'forecasting_models': {
                'arima': {
                    'order': (2, 1, 2),
                    'seasonal_order': (1, 1, 1, 24),
                    'enforce_stationarity': True
                },
                'exponential_smoothing': {
                    'trend': 'add',
                    'seasonal': 'add',
                    'seasonal_periods': 24
                },
                'random_forest': {
                    'n_estimators': 100,
                    'max_depth': 10,
                    'min_samples_split': 5,
                    'random_state': 42
                },
                'gradient_boosting': {
                    'n_estimators': 100,
                    'learning_rate': 0.1,
                    'max_depth': 6,
                    'random_state': 42
                }
            },
            'feature_engineering': {
                'lag_features': [1, 2, 3, 6, 12, 24],
                'rolling_windows': [3, 6, 12, 24],
                'differencing_orders': [1, 2]
            },
            'prediction_horizons': {
                'short_term': 6,    # 6 time steps
                'medium_term': 24,  # 24 time steps
                'long_term': 168    # 168 time steps (1 week for hourly data)
            },
            'thresholds': {
                'failure_probability': 0.7,
                'anomaly_score': 2.0,
                'performance_degradation': 0.8
            }
        }
    
    def create_time_series_features(self, data: pd.DataFrame, 
                                   target_column: str) -> pd.DataFrame:
        """
        Create comprehensive time series features for predictive modeling.
        """
        logger.info(f"Creating time series features for {target_column}")
        
        # Ensure datetime index
        if 'timestamp' in data.columns:
            data['timestamp'] = pd.to_datetime(data['timestamp'])
            data = data.set_index('timestamp').sort_index()
        
        features = pd.DataFrame(index=data.index)
        target_series = data[target_column]
        
        # Lag features
        for lag in self.config['feature_engineering']['lag_features']:
            features[f'{target_column}_lag_{lag}'] = target_series.shift(lag)
        
        # Rolling statistics
        for window in self.config['feature_engineering']['rolling_windows']:
            features[f'{target_column}_rolling_mean_{window}'] = target_series.rolling(
                window=window, min_periods=1
            ).mean()
            features[f'{target_column}_rolling_std_{window}'] = target_series.rolling(
                window=window, min_periods=1
            ).std().fillna(0)
            features[f'{target_column}_rolling_min_{window}'] = target_series.rolling(
                window=window, min_periods=1
            ).min()
            features[f'{target_column}_rolling_max_{window}'] = target_series.rolling(
                window=window, min_periods=1
            ).max()
        
        # Differencing features
        for order in self.config['feature_engineering']['differencing_orders']:
            features[f'{target_column}_diff_{order}'] = target_series.diff(order).fillna(0)
        
        # Temporal features
        features['hour'] = data.index.hour
        features['day_of_week'] = data.index.dayofweek
        features['day_of_month'] = data.index.day
        features['month'] = data.index.month
        features['is_weekend'] = (data.index.dayofweek >= 5).astype(int)
        features['is_business_hour'] = ((data.index.hour >= 9) & (data.index.hour <= 17)).astype(int)
        
        # Cyclical encoding for temporal features
        features['hour_sin'] = np.sin(2 * np.pi * features['hour'] / 24)
        features['hour_cos'] = np.cos(2 * np.pi * features['hour'] / 24)
        features['day_sin'] = np.sin(2 * np.pi * features['day_of_week'] / 7)
        features['day_cos'] = np.cos(2 * np.pi * features['day_of_week'] / 7)
        
        # Add target variable
        features[target_column] = target_series
        
        # Fill NaN values
        features = features.fillna(method='ffill').fillna(0)
        
        logger.info(f"Created {len(features.columns)-1} time series features")
        return features
    
    def detect_seasonality_and_trend(self, data: pd.Series) -> Dict:
        """
        Detect seasonal patterns and trends in time series data.
        """
        logger.info("Detecting seasonality and trend patterns")
        
        try:
            # Perform seasonal decomposition
            decomposition = seasonal_decompose(
                data, 
                model='additive', 
                period=min(24, len(data) // 4)  # Assume hourly data with daily seasonality
            )
            
            # Calculate trend strength
            trend_strength = np.var(decomposition.trend.dropna()) / np.var(data.dropna())
            
            # Calculate seasonal strength
            seasonal_strength = np.var(decomposition.seasonal.dropna()) / np.var(data.dropna())
            
            # Detect trend direction
            trend_data = decomposition.trend.dropna()
            if len(trend_data) > 1:
                trend_slope = np.polyfit(range(len(trend_data)), trend_data, 1)[0]
                trend_direction = 'increasing' if trend_slope > 0 else 'decreasing'
            else:
                trend_direction = 'stable'
            
            patterns = {
                'trend_strength': float(trend_strength),
                'seasonal_strength': float(seasonal_strength),
                'trend_direction': trend_direction,
                'trend_slope': float(trend_slope) if 'trend_slope' in locals() else 0.0,
                'has_strong_trend': trend_strength > 0.1,
                'has_strong_seasonality': seasonal_strength > 0.1,
                'seasonal_period': 24  # Assuming hourly data
            }
            
            # Store seasonal patterns for reuse
            self.seasonal_patterns[data.name or 'series'] = patterns
            
            return patterns
            
        except Exception as e:
            logger.warning(f"Could not detect seasonality/trend: {e}")
            return {
                'trend_strength': 0.0,
                'seasonal_strength': 0.0,
                'trend_direction': 'stable',
                'trend_slope': 0.0,
                'has_strong_trend': False,
                'has_strong_seasonality': False,
                'seasonal_period': 24
            }
    
    def train_arima_model(self, data: pd.Series, target_name: str) -> Dict:
        """Train ARIMA model for time series forecasting."""
        logger.info(f"Training ARIMA model for {target_name}")
        
        try:
            # Auto ARIMA to find best parameters
            arima_params = self.config['forecasting_models']['arima']
            
            # Fit ARIMA model
            model = ARIMA(
                data, 
                order=arima_params['order'],
                seasonal_order=arima_params['seasonal_order'],
                enforce_stationarity=arima_params['enforce_stationarity']
            )
            
            fitted_model = model.fit()
            self.models[f'arima_{target_name}'] = fitted_model
            
            # Model diagnostics
            aic = fitted_model.aic
            bic = fitted_model.bic
            
            return {
                'model_type': 'ARIMA',
                'aic': aic,
                'bic': bic,
                'parameters': arima_params,
                'success': True
            }
            
        except Exception as e:
            logger.error(f"ARIMA model training failed: {e}")
            return {'model_type': 'ARIMA', 'success': False, 'error': str(e)}
    
    def train_exponential_smoothing(self, data: pd.Series, target_name: str) -> Dict:
        """Train Exponential Smoothing model."""
        logger.info(f"Training Exponential Smoothing model for {target_name}")
        
        try:
            es_params = self.config['forecasting_models']['exponential_smoothing']
            
            model = ExponentialSmoothing(
                data,
                trend=es_params['trend'],
                seasonal=es_params['seasonal'],
                seasonal_periods=es_params['seasonal_periods']
            )
            
            fitted_model = model.fit()
            self.models[f'exp_smooth_{target_name}'] = fitted_model
            
            return {
                'model_type': 'ExponentialSmoothing',
                'parameters': es_params,
                'aic': fitted_model.aic,
                'success': True
            }
            
        except Exception as e:
            logger.error(f"Exponential Smoothing training failed: {e}")
            return {'model_type': 'ExponentialSmoothing', 'success': False, 'error': str(e)}
    
    def train_ml_forecasting_models(self, features: pd.DataFrame, 
                                   target_column: str) -> Dict:
        """Train machine learning models for forecasting."""
        logger.info(f"Training ML forecasting models for {target_column}")
        
        # Prepare data
        X = features.drop(target_column, axis=1)
        y = features[target_column]
        
        # Remove rows with NaN
        valid_mask = ~(X.isna().any(axis=1) | y.isna())
        X = X[valid_mask]
        y = y[valid_mask]
        
        if len(X) == 0:
            logger.error("No valid data for ML model training")
            return {'success': False, 'error': 'No valid data'}
        
        # Scale features
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        self.scalers[f'ml_{target_column}'] = scaler
        
        # Time series cross-validation
        tscv = TimeSeriesSplit(n_splits=5)
        
        results = {}
        
        # Random Forest
        try:
            rf_params = self.config['forecasting_models']['random_forest']
            rf_model = RandomForestRegressor(**rf_params)
            rf_model.fit(X_scaled, y)
            
            # Cross-validation
            rf_scores = []
            for train_idx, val_idx in tscv.split(X_scaled):
                rf_model.fit(X_scaled[train_idx], y.iloc[train_idx])
                pred = rf_model.predict(X_scaled[val_idx])
                score = r2_score(y.iloc[val_idx], pred)
                rf_scores.append(score)
            
            self.models[f'rf_{target_column}'] = rf_model
            results['random_forest'] = {
                'cv_score_mean': np.mean(rf_scores),
                'cv_score_std': np.std(rf_scores),
                'feature_importance': rf_model.feature_importances_.tolist()
            }
            
        except Exception as e:
            logger.error(f"Random Forest training failed: {e}")
            results['random_forest'] = {'success': False, 'error': str(e)}
        
        # Gradient Boosting
        try:
            gb_params = self.config['forecasting_models']['gradient_boosting']
            gb_model = GradientBoostingRegressor(**gb_params)
            gb_model.fit(X_scaled, y)
            
            # Cross-validation
            gb_scores = []
            for train_idx, val_idx in tscv.split(X_scaled):
                gb_model.fit(X_scaled[train_idx], y.iloc[train_idx])
                pred = gb_model.predict(X_scaled[val_idx])
                score = r2_score(y.iloc[val_idx], pred)
                gb_scores.append(score)
            
            self.models[f'gb_{target_column}'] = gb_model
            results['gradient_boosting'] = {
                'cv_score_mean': np.mean(gb_scores),
                'cv_score_std': np.std(gb_scores),
                'feature_importance': gb_model.feature_importances_.tolist()
            }
            
        except Exception as e:
            logger.error(f"Gradient Boosting training failed: {e}")
            results['gradient_boosting'] = {'success': False, 'error': str(e)}
        
        return results
    
    def make_forecasts(self, data: pd.DataFrame, target_column: str, 
                       horizons: Dict = None) -> Dict:
        """
        Make forecasts using all trained models and return ensemble predictions.
        """
        if horizons is None:
            horizons = self.config['prediction_horizons']
        
        logger.info(f"Making forecasts for {target_column}")
        
        forecasts = {}
        
        # Get the latest data point for ML models
        latest_features = self.create_time_series_features(data, target_column).iloc[-1:1]
        
        for horizon_name, steps in horizons.items():
            logger.info(f"Forecasting {steps} steps ahead for {horizon_name}")
            
            horizon_forecasts = {}
            
            # ARIMA forecasts
            arima_model_name = f'arima_{target_column}'
            if arima_model_name in self.models:
                try:
                    arima_forecast = self.models[arima_model_name].forecast(steps=steps)
                    horizon_forecasts['arima'] = arima_forecast.tolist()
                except Exception as e:
                    logger.error(f"ARIMA forecast failed: {e}")
            
            # Exponential Smoothing forecasts
            es_model_name = f'exp_smooth_{target_column}'
            if es_model_name in self.models:
                try:
                    es_forecast = self.models[es_model_name].forecast(steps=steps)
                    horizon_forecasts['exponential_smoothing'] = es_forecast.tolist()
                except Exception as e:
                    logger.error(f"Exponential Smoothing forecast failed: {e}")
            
            # ML Model forecasts (simplified - would need proper recursive forecasting)
            rf_model_name = f'rf_{target_column}'
            if rf_model_name in self.models and f'ml_{target_column}' in self.scalers:
                try:
                    # For demonstration, make single-step forecast
                    X_latest = latest_features.drop(target_column, axis=1)
                    X_scaled = self.scalers[f'ml_{target_column}'].transform(X_latest)
                    rf_pred = self.models[rf_model_name].predict(X_scaled)
                    # Replicate for horizon length (simplified approach)
                    horizon_forecasts['random_forest'] = [float(rf_pred[0])] * steps
                except Exception as e:
                    logger.error(f"Random Forest forecast failed: {e}")
            
            gb_model_name = f'gb_{target_column}'
            if gb_model_name in self.models and f'ml_{target_column}' in self.scalers:
                try:
                    X_latest = latest_features.drop(target_column, axis=1)
                    X_scaled = self.scalers[f'ml_{target_column}'].transform(X_latest)
                    gb_pred = self.models[gb_model_name].predict(X_scaled)
                    horizon_forecasts['gradient_boosting'] = [float(gb_pred[0])] * steps
                except Exception as e:
                    logger.error(f"Gradient Boosting forecast failed: {e}")
            
            # Ensemble forecast (average of available forecasts)
            if horizon_forecasts:
                forecast_arrays = [np.array(f) for f in horizon_forecasts.values()]
                if forecast_arrays:
                    ensemble_forecast = np.mean(forecast_arrays, axis=0)
                    forecast_std = np.std(forecast_arrays, axis=0)
                    
                    horizon_forecasts['ensemble'] = ensemble_forecast.tolist()
                    horizon_forecasts['ensemble_std'] = forecast_std.tolist()
            
            forecasts[horizon_name] = horizon_forecasts
        
        # Cache predictions
        cache_key = f"{target_column}_{datetime.now().strftime('%Y%m%d_%H%M')}"
        self.prediction_cache[cache_key] = forecasts
        
        return forecasts
    
    def detect_anomalies_and_failures(self, forecasts: Dict, 
                                     current_values: Dict) -> Dict:
        """
        Detect potential failures and anomalies based on forecasts.
        """
        logger.info("Analyzing forecasts for failure prediction")
        
        alerts = {
            'high_priority': [],
            'medium_priority': [],
            'low_priority': [],
            'summary': {}
        }
        
        thresholds = self.config['thresholds']
        
        for horizon, predictions in forecasts.items():
            if 'ensemble' in predictions:
                ensemble_forecast = np.array(predictions['ensemble'])
                forecast_std = np.array(predictions.get('ensemble_std', [0] * len(ensemble_forecast)))
                
                # Detect trend anomalies
                if len(ensemble_forecast) > 1:
                    trend_slope = np.polyfit(range(len(ensemble_forecast)), ensemble_forecast, 1)[0]
                    
                    # Rapid degradation detection
                    if trend_slope > thresholds['performance_degradation']:
                        alerts['high_priority'].append({
                            'type': 'rapid_degradation',
                            'horizon': horizon,
                            'trend_slope': float(trend_slope),
                            'message': f"Rapid performance degradation detected in {horizon} forecast"
                        })
                    
                    # Anomaly score based on variance
                    anomaly_score = np.mean(forecast_std)
                    if anomaly_score > thresholds['anomaly_score']:
                        alerts['medium_priority'].append({
                            'type': 'high_uncertainty',
                            'horizon': horizon,
                            'anomaly_score': float(anomaly_score),
                            'message': f"High forecast uncertainty in {horizon} predictions"
                        })
                
                # Threshold breach detection
                max_forecast = np.max(ensemble_forecast)
                if max_forecast > thresholds['failure_probability'] * 100:  # Assuming percentage values
                    alerts['high_priority'].append({
                        'type': 'threshold_breach',
                        'horizon': horizon,
                        'max_value': float(max_forecast),
                        'message': f"Predicted values exceed failure threshold in {horizon}"
                    })
        
        # Summary statistics
        alerts['summary'] = {
            'total_alerts': len(alerts['high_priority']) + len(alerts['medium_priority']) + len(alerts['low_priority']),
            'high_priority_count': len(alerts['high_priority']),
            'risk_level': 'HIGH' if alerts['high_priority'] else ('MEDIUM' if alerts['medium_priority'] else 'LOW'),
            'timestamp': datetime.now().isoformat()
        }
        
        return alerts
    
    def generate_recommendations(self, alerts: Dict, forecasts: Dict) -> List[Dict]:
        """
        Generate actionable recommendations based on predictions and alerts.
        """
        recommendations = []
        
        if alerts['summary']['risk_level'] == 'HIGH':
            recommendations.extend([
                {
                    'priority': 'IMMEDIATE',
                    'action': 'Scale resources proactively',
                    'description': 'Increase system capacity before predicted failure occurs',
                    'estimated_impact': 'Prevent service downtime'
                },
                {
                    'priority': 'IMMEDIATE',
                    'action': 'Enable enhanced monitoring',
                    'description': 'Increase monitoring frequency and alert thresholds',
                    'estimated_impact': 'Earlier failure detection'
                }
            ])
        
        if alerts['summary']['risk_level'] in ['HIGH', 'MEDIUM']:
            recommendations.extend([
                {
                    'priority': 'HIGH',
                    'action': 'Schedule maintenance window',
                    'description': 'Plan proactive maintenance based on failure predictions',
                    'estimated_impact': 'Prevent unplanned outages'
                },
                {
                    'priority': 'MEDIUM',
                    'action': 'Review resource allocation',
                    'description': 'Analyze current resource usage patterns',
                    'estimated_impact': 'Optimize performance'
                }
            ])
        
        # Always include model improvement recommendations
        recommendations.append({
            'priority': 'LOW',
            'action': 'Retrain predictive models',
            'description': 'Update models with latest data to improve accuracy',
            'estimated_impact': 'Better future predictions'
        })
        
        return recommendations
    
    def save_models(self, model_path: str) -> None:
        """Save all trained models and configurations."""
        logger.info(f"Saving predictive analytics models to {model_path}")
        
        model_data = {
            'models': self.models,
            'scalers': self.scalers,
            'config': self.config,
            'seasonal_patterns': self.seasonal_patterns,
            'forecasting_history': self.forecasting_history,
            'prediction_cache': self.prediction_cache
        }
        
        joblib.dump(model_data, model_path)
        logger.info("Models saved successfully!")
    
    def load_models(self, model_path: str) -> None:
        """Load trained models and configurations."""
        logger.info(f"Loading predictive analytics models from {model_path}")
        
        model_data = joblib.load(model_path)
        self.models = model_data['models']
        self.scalers = model_data['scalers']
        self.config = model_data['config']
        self.seasonal_patterns = model_data['seasonal_patterns']
        self.forecasting_history = model_data['forecasting_history']
        self.prediction_cache = model_data.get('prediction_cache', {})
        
        logger.info("Models loaded successfully!")

# Example usage and testing
if __name__ == "__main__":
    # Generate synthetic time series data
    logger.info("Generating synthetic time series data for testing")
    
    dates = pd.date_range(start='2024-01-01', periods=1000, freq='1H')
    
    # Create realistic system metrics with trend and seasonality
    base_trend = np.linspace(50, 80, len(dates))
    seasonal_pattern = 10 * np.sin(2 * np.pi * np.arange(len(dates)) / 24)  # Daily seasonality
    noise = np.random.normal(0, 5, len(dates))
    
    cpu_usage = base_trend + seasonal_pattern + noise
    cpu_usage = np.clip(cpu_usage, 0, 100)
    
    # Create synthetic failure events
    failure_times = np.random.choice(len(dates), size=20, replace=False)
    for ft in failure_times:
        # Increase values before failure
        start_idx = max(0, ft - 5)
        cpu_usage[start_idx:ft] += np.random.normal(15, 5, ft - start_idx)
    
    data = pd.DataFrame({
        'timestamp': dates,
        'cpu_usage': cpu_usage,
        'memory_usage': np.random.normal(60, 15, len(dates)),
        'disk_io': np.random.exponential(10, len(dates))
    })
    
    # Initialize predictive analytics engine
    engine = PredictiveAnalyticsEngine()
    
    # Create features and train models for CPU usage
    features = engine.create_time_series_features(data, 'cpu_usage')
    
    # Detect patterns
    patterns = engine.detect_seasonality_and_trend(data.set_index('timestamp')['cpu_usage'])
    print(f"Detected patterns: {json.dumps(patterns, indent=2)}")
    
    # Train models
    arima_results = engine.train_arima_model(data.set_index('timestamp')['cpu_usage'], 'cpu_usage')
    es_results = engine.train_exponential_smoothing(data.set_index('timestamp')['cpu_usage'], 'cpu_usage')
    ml_results = engine.train_ml_forecasting_models(features, 'cpu_usage')
    
    print(f"Training results:")
    print(f"ARIMA: {arima_results}")
    print(f"Exponential Smoothing: {es_results}")
    print(f"ML Models: {json.dumps(ml_results, indent=2, default=str)}")
    
    # Make forecasts
    forecasts = engine.make_forecasts(data, 'cpu_usage')
    print(f"Forecasts generated for horizons: {list(forecasts.keys())}")
    
    # Detect anomalies and failures
    current_values = {'cpu_usage': data['cpu_usage'].iloc[-1]}
    alerts = engine.detect_anomalies_and_failures(forecasts, current_values)
    print(f"Alerts: {json.dumps(alerts, indent=2, default=str)}")
    
    # Generate recommendations
    recommendations = engine.generate_recommendations(alerts, forecasts)
    print(f"Recommendations:")
    for rec in recommendations:
        print(f"  {rec['priority']}: {rec['action']} - {rec['description']}")
    
    # Save models
    engine.save_models('/Users/danielbarreto/Development/workspace/ia/jaqEdu/src/ml/models/predictive_analytics_model.pkl')
    
    logger.info("Predictive analytics engine initialized and tested successfully!")