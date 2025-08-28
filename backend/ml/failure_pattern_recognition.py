#!/usr/bin/env python3
"""
ML-Powered Failure Pattern Recognition System
Implements ensemble methods for identifying failure patterns in system logs and metrics.
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, IsolationForest, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
from sklearn.pipeline import Pipeline
import joblib
import logging
from typing import Dict, List, Tuple, Optional
import json
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class FailurePatternRecognizer:
    """
    Advanced failure pattern recognition using ensemble machine learning methods.
    Designed to learn from historical failure data and predict future failures.
    """
    
    def __init__(self, config: Dict = None):
        """Initialize the failure pattern recognizer with configuration."""
        self.config = config or self._default_config()
        self.models = {}
        self.scalers = {}
        self.encoders = {}
        self.feature_importance = {}
        self.training_history = []
        
    def _default_config(self) -> Dict:
        """Default configuration for the failure pattern recognizer."""
        return {
            'ensemble_models': {
                'random_forest': {
                    'n_estimators': 200,
                    'max_depth': 15,
                    'min_samples_split': 5,
                    'min_samples_leaf': 2,
                    'random_state': 42
                },
                'gradient_boosting': {
                    'n_estimators': 150,
                    'learning_rate': 0.1,
                    'max_depth': 8,
                    'random_state': 42
                },
                'isolation_forest': {
                    'n_estimators': 100,
                    'contamination': 0.1,
                    'random_state': 42
                }
            },
            'feature_engineering': {
                'time_windows': [1, 5, 15, 30],  # minutes
                'statistical_features': ['mean', 'std', 'min', 'max', 'percentile_95'],
                'temporal_features': ['hour', 'day_of_week', 'is_weekend']
            },
            'training': {
                'test_size': 0.2,
                'validation_size': 0.2,
                'cross_validation_folds': 5,
                'random_state': 42
            }
        }
    
    def engineer_features(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Advanced feature engineering for failure prediction.
        Creates temporal, statistical, and domain-specific features.
        """
        logger.info("Engineering features for failure pattern recognition...")
        
        # Ensure timestamp column exists
        if 'timestamp' in data.columns:
            data['timestamp'] = pd.to_datetime(data['timestamp'])
            data = data.sort_values('timestamp')
        
        engineered_features = data.copy()
        
        # Temporal features
        if 'timestamp' in data.columns:
            engineered_features['hour'] = data['timestamp'].dt.hour
            engineered_features['day_of_week'] = data['timestamp'].dt.dayofweek
            engineered_features['is_weekend'] = (data['timestamp'].dt.dayofweek >= 5).astype(int)
            engineered_features['month'] = data['timestamp'].dt.month
        
        # Statistical features for numeric columns
        numeric_columns = data.select_dtypes(include=[np.number]).columns
        for col in numeric_columns:
            if col != 'failure_label':
                # Rolling statistics
                for window in self.config['feature_engineering']['time_windows']:
                    engineered_features[f'{col}_mean_{window}min'] = data[col].rolling(
                        window=window, min_periods=1
                    ).mean()
                    engineered_features[f'{col}_std_{window}min'] = data[col].rolling(
                        window=window, min_periods=1
                    ).std().fillna(0)
                    engineered_features[f'{col}_max_{window}min'] = data[col].rolling(
                        window=window, min_periods=1
                    ).max()
                
                # Rate of change
                engineered_features[f'{col}_rate_of_change'] = data[col].pct_change().fillna(0)
                
                # Z-score (anomaly indicator)
                mean_val = data[col].mean()
                std_val = data[col].std()
                if std_val > 0:
                    engineered_features[f'{col}_zscore'] = (data[col] - mean_val) / std_val
        
        # Error pattern features
        if 'error_count' in data.columns:
            engineered_features['error_rate'] = data['error_count'] / (data.get('total_requests', 1) + 1)
            engineered_features['error_trend'] = data['error_count'].diff().fillna(0)
        
        # Resource utilization patterns
        if 'cpu_usage' in data.columns and 'memory_usage' in data.columns:
            engineered_features['resource_pressure'] = (
                data['cpu_usage'] * data['memory_usage'] / 10000
            )
        
        # Fill any remaining NaN values
        engineered_features = engineered_features.fillna(0)
        
        logger.info(f"Feature engineering complete. Original features: {len(data.columns)}, "
                   f"Engineered features: {len(engineered_features.columns)}")
        
        return engineered_features
    
    def preprocess_data(self, data: pd.DataFrame, is_training: bool = True) -> Tuple[np.ndarray, np.ndarray]:
        """
        Preprocess data for machine learning models.
        Handles encoding, scaling, and feature selection.
        """
        logger.info("Preprocessing data for ML models...")
        
        # Separate features and target
        if 'failure_label' in data.columns:
            X = data.drop('failure_label', axis=1)
            y = data['failure_label']
        else:
            X = data
            y = None
        
        # Handle categorical variables
        categorical_columns = X.select_dtypes(include=['object']).columns
        for col in categorical_columns:
            if is_training:
                self.encoders[col] = LabelEncoder()
                X[col] = self.encoders[col].fit_transform(X[col].astype(str))
            else:
                if col in self.encoders:
                    # Handle unseen categories
                    unique_values = set(self.encoders[col].classes_)
                    X[col] = X[col].apply(
                        lambda x: x if x in unique_values else 'unknown'
                    )
                    X[col] = self.encoders[col].transform(X[col].astype(str))
        
        # Scale features
        if is_training:
            self.scalers['features'] = StandardScaler()
            X_scaled = self.scalers['features'].fit_transform(X)
        else:
            if 'features' in self.scalers:
                X_scaled = self.scalers['features'].transform(X)
            else:
                X_scaled = X.values
        
        return X_scaled, y
    
    def train_ensemble_models(self, X_train: np.ndarray, y_train: np.ndarray, 
                             X_val: np.ndarray = None, y_val: np.ndarray = None) -> Dict:
        """
        Train ensemble of machine learning models for failure prediction.
        """
        logger.info("Training ensemble models for failure pattern recognition...")
        
        results = {}
        
        # Random Forest Classifier
        logger.info("Training Random Forest...")
        rf_params = self.config['ensemble_models']['random_forest']
        rf_model = RandomForestClassifier(**rf_params)
        rf_model.fit(X_train, y_train)
        self.models['random_forest'] = rf_model
        
        # Cross-validation score
        rf_cv_scores = cross_val_score(
            rf_model, X_train, y_train, 
            cv=self.config['training']['cross_validation_folds']
        )
        results['random_forest'] = {
            'cv_score_mean': rf_cv_scores.mean(),
            'cv_score_std': rf_cv_scores.std(),
            'feature_importance': rf_model.feature_importances_
        }
        
        # Gradient Boosting Classifier
        logger.info("Training Gradient Boosting...")
        gb_params = self.config['ensemble_models']['gradient_boosting']
        gb_model = GradientBoostingClassifier(**gb_params)
        gb_model.fit(X_train, y_train)
        self.models['gradient_boosting'] = gb_model
        
        gb_cv_scores = cross_val_score(
            gb_model, X_train, y_train, 
            cv=self.config['training']['cross_validation_folds']
        )
        results['gradient_boosting'] = {
            'cv_score_mean': gb_cv_scores.mean(),
            'cv_score_std': gb_cv_scores.std(),
            'feature_importance': gb_model.feature_importances_
        }
        
        # Isolation Forest (for anomaly detection)
        logger.info("Training Isolation Forest...")
        iso_params = self.config['ensemble_models']['isolation_forest']
        iso_model = IsolationForest(**iso_params)
        iso_model.fit(X_train[y_train == 0])  # Train only on normal samples
        self.models['isolation_forest'] = iso_model
        
        results['isolation_forest'] = {
            'anomaly_score_threshold': iso_model.decision_function(X_train).min()
        }
        
        # Store feature importance
        self.feature_importance = {
            'random_forest': results['random_forest']['feature_importance'],
            'gradient_boosting': results['gradient_boosting']['feature_importance']
        }
        
        # Record training history
        training_record = {
            'timestamp': datetime.now().isoformat(),
            'models_trained': list(self.models.keys()),
            'training_samples': len(X_train),
            'results': results
        }
        self.training_history.append(training_record)
        
        logger.info("Ensemble model training completed successfully!")
        return results
    
    def predict_failure_probability(self, X: np.ndarray) -> Dict:
        """
        Predict failure probability using ensemble models.
        Returns aggregated predictions and individual model scores.
        """
        if not self.models:
            raise ValueError("Models not trained yet. Please call train_ensemble_models first.")
        
        predictions = {}
        
        # Random Forest predictions
        if 'random_forest' in self.models:
            rf_proba = self.models['random_forest'].predict_proba(X)[:, 1]
            predictions['random_forest'] = rf_proba
        
        # Gradient Boosting predictions
        if 'gradient_boosting' in self.models:
            gb_proba = self.models['gradient_boosting'].predict_proba(X)[:, 1]
            predictions['gradient_boosting'] = gb_proba
        
        # Isolation Forest anomaly scores
        if 'isolation_forest' in self.models:
            iso_scores = self.models['isolation_forest'].decision_function(X)
            # Convert to probability-like scores (0-1)
            iso_proba = 1 / (1 + np.exp(iso_scores))
            predictions['isolation_forest'] = iso_proba
        
        # Ensemble prediction (weighted average)
        weights = {'random_forest': 0.4, 'gradient_boosting': 0.4, 'isolation_forest': 0.2}
        ensemble_prediction = np.zeros(len(X))
        
        for model_name, weight in weights.items():
            if model_name in predictions:
                ensemble_prediction += weight * predictions[model_name]
        
        return {
            'ensemble_probability': ensemble_prediction,
            'individual_predictions': predictions,
            'confidence_score': np.std(list(predictions.values()), axis=0) if len(predictions) > 1 else np.ones(len(X))
        }
    
    def get_feature_importance_analysis(self) -> Dict:
        """
        Analyze and return feature importance across models.
        """
        if not self.feature_importance:
            return {}
        
        # Average importance across models
        feature_names = [f'feature_{i}' for i in range(len(self.feature_importance['random_forest']))]
        avg_importance = np.mean([
            self.feature_importance['random_forest'],
            self.feature_importance['gradient_boosting']
        ], axis=0)
        
        # Sort by importance
        importance_pairs = list(zip(feature_names, avg_importance))
        importance_pairs.sort(key=lambda x: x[1], reverse=True)
        
        return {
            'top_features': importance_pairs[:20],
            'individual_models': self.feature_importance,
            'feature_count': len(feature_names)
        }
    
    def save_models(self, model_path: str) -> None:
        """Save trained models and preprocessors to disk."""
        logger.info(f"Saving models to {model_path}")
        
        model_data = {
            'models': self.models,
            'scalers': self.scalers,
            'encoders': self.encoders,
            'config': self.config,
            'feature_importance': self.feature_importance,
            'training_history': self.training_history
        }
        
        joblib.dump(model_data, model_path)
        logger.info("Models saved successfully!")
    
    def load_models(self, model_path: str) -> None:
        """Load trained models and preprocessors from disk."""
        logger.info(f"Loading models from {model_path}")
        
        model_data = joblib.load(model_path)
        self.models = model_data['models']
        self.scalers = model_data['scalers']
        self.encoders = model_data['encoders']
        self.config = model_data['config']
        self.feature_importance = model_data['feature_importance']
        self.training_history = model_data['training_history']
        
        logger.info("Models loaded successfully!")

def generate_synthetic_failure_data(n_samples: int = 10000) -> pd.DataFrame:
    """
    Generate synthetic failure data for testing and demonstration.
    """
    np.random.seed(42)
    
    # Time series
    timestamps = pd.date_range(start='2024-01-01', periods=n_samples, freq='1min')
    
    # Base metrics
    cpu_usage = np.random.normal(50, 15, n_samples)
    memory_usage = np.random.normal(60, 20, n_samples)
    disk_io = np.random.exponential(10, n_samples)
    network_latency = np.random.gamma(2, 2, n_samples)
    error_count = np.random.poisson(2, n_samples)
    total_requests = np.random.normal(1000, 200, n_samples)
    
    # Introduce failure patterns
    failure_indices = np.random.choice(n_samples, size=int(n_samples * 0.1), replace=False)
    failure_label = np.zeros(n_samples)
    failure_label[failure_indices] = 1
    
    # Make failures correlate with high resource usage
    cpu_usage[failure_indices] += np.random.normal(30, 10, len(failure_indices))
    memory_usage[failure_indices] += np.random.normal(25, 8, len(failure_indices))
    error_count[failure_indices] += np.random.poisson(10, len(failure_indices))
    
    # Clip values to realistic ranges
    cpu_usage = np.clip(cpu_usage, 0, 100)
    memory_usage = np.clip(memory_usage, 0, 100)
    disk_io = np.clip(disk_io, 0, 1000)
    network_latency = np.clip(network_latency, 1, 1000)
    error_count = np.clip(error_count, 0, 100)
    total_requests = np.clip(total_requests, 100, 2000)
    
    data = pd.DataFrame({
        'timestamp': timestamps,
        'cpu_usage': cpu_usage,
        'memory_usage': memory_usage,
        'disk_io': disk_io,
        'network_latency': network_latency,
        'error_count': error_count,
        'total_requests': total_requests,
        'failure_label': failure_label
    })
    
    return data

# Example usage and testing
if __name__ == "__main__":
    # Generate synthetic data
    logger.info("Generating synthetic failure data...")
    data = generate_synthetic_failure_data(10000)
    
    # Initialize recognizer
    recognizer = FailurePatternRecognizer()
    
    # Feature engineering
    engineered_data = recognizer.engineer_features(data)
    
    # Preprocess data
    X, y = recognizer.preprocess_data(engineered_data, is_training=True)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Train models
    training_results = recognizer.train_ensemble_models(X_train, y_train)
    
    # Make predictions
    predictions = recognizer.predict_failure_probability(X_test)
    
    # Evaluate performance
    ensemble_pred = predictions['ensemble_probability']
    binary_pred = (ensemble_pred > 0.5).astype(int)
    
    print("\n=== Failure Pattern Recognition Results ===")
    print(f"Training Results: {json.dumps(training_results, indent=2, default=str)}")
    print(f"Test AUC Score: {roc_auc_score(y_test, ensemble_pred):.4f}")
    print(f"Classification Report:\n{classification_report(y_test, binary_pred)}")
    
    # Feature importance analysis
    importance_analysis = recognizer.get_feature_importance_analysis()
    print(f"\nTop 10 Most Important Features:")
    for feature, importance in importance_analysis['top_features'][:10]:
        print(f"  {feature}: {importance:.4f}")
    
    # Save models
    recognizer.save_models('/Users/danielbarreto/Development/workspace/ia/jaqEdu/src/ml/models/failure_pattern_model.pkl')
    
    logger.info("Failure pattern recognition system initialized and tested successfully!")