#!/usr/bin/env python3
"""
Advanced Anomaly Detection System for Self-Healing Intelligence
Implements multiple unsupervised learning algorithms for detecting system anomalies.
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.cluster import DBSCAN, KMeans
from sklearn.neighbors import LocalOutlierFactor
from sklearn.preprocessing import StandardScaler, RobustScaler
from sklearn.decomposition import PCA
from sklearn.covariance import EllipticEnvelope
from sklearn.svm import OneClassSVM
import tensorflow as tf
from tensorflow.keras.models import Model, Sequential
from tensorflow.keras.layers import Dense, Input, Dropout, LSTM
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping
import joblib
import logging
from typing import Dict, List, Tuple, Optional, Union
import json
from datetime import datetime, timedelta
import warnings
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats
warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AnomalyDetectionSystem:
    """
    Comprehensive anomaly detection system using multiple unsupervised learning algorithms.
    Combines statistical methods, machine learning, and deep learning approaches.
    """
    
    def __init__(self, config: Dict = None):
        """Initialize the anomaly detection system."""
        self.config = config or self._default_config()
        self.models = {}
        self.scalers = {}
        self.thresholds = {}
        self.baseline_statistics = {}
        self.detection_history = []
        self.model_performance = {}
        
    def _default_config(self) -> Dict:
        """Default configuration for anomaly detection."""
        return {
            'algorithms': {
                'isolation_forest': {
                    'n_estimators': 200,
                    'contamination': 0.1,
                    'random_state': 42,
                    'max_features': 1.0
                },
                'lof': {
                    'n_neighbors': 20,
                    'contamination': 0.1,
                    'novelty': True
                },
                'one_class_svm': {
                    'kernel': 'rbf',
                    'gamma': 'scale',
                    'nu': 0.1
                },
                'elliptic_envelope': {
                    'contamination': 0.1,
                    'random_state': 42
                },
                'dbscan': {
                    'eps': 0.5,
                    'min_samples': 5,
                    'metric': 'euclidean'
                }
            },
            'autoencoder': {
                'encoding_dim': 32,
                'hidden_layers': [64, 32, 16],
                'dropout_rate': 0.2,
                'epochs': 100,
                'batch_size': 32,
                'validation_split': 0.2,
                'learning_rate': 0.001
            },
            'lstm_autoencoder': {
                'sequence_length': 10,
                'encoding_dim': 50,
                'epochs': 50,
                'batch_size': 32,
                'validation_split': 0.2
            },
            'statistical_methods': {
                'zscore_threshold': 3.0,
                'iqr_multiplier': 1.5,
                'modified_zscore_threshold': 3.5
            },
            'ensemble': {
                'voting_threshold': 0.3,  # Fraction of models that must agree
                'weight_by_performance': True
            }
        }
    
    def prepare_features(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Prepare and engineer features for anomaly detection.
        """
        logger.info("Preparing features for anomaly detection")
        
        # Ensure datetime index if timestamp exists
        if 'timestamp' in data.columns:
            data['timestamp'] = pd.to_datetime(data['timestamp'])
            data = data.set_index('timestamp').sort_index()
        
        # Select numeric columns
        numeric_data = data.select_dtypes(include=[np.number])
        
        # Create additional features
        features = numeric_data.copy()
        
        # Rate of change features
        for col in numeric_data.columns:
            features[f'{col}_rate_of_change'] = numeric_data[col].pct_change().fillna(0)
            features[f'{col}_diff'] = numeric_data[col].diff().fillna(0)
        
        # Rolling statistics features
        for col in numeric_data.columns:
            features[f'{col}_rolling_mean_5'] = numeric_data[col].rolling(5, min_periods=1).mean()
            features[f'{col}_rolling_std_5'] = numeric_data[col].rolling(5, min_periods=1).std().fillna(0)
            features[f'{col}_rolling_mean_10'] = numeric_data[col].rolling(10, min_periods=1).mean()
            features[f'{col}_rolling_std_10'] = numeric_data[col].rolling(10, min_periods=1).std().fillna(0)
        
        # Cross-feature interactions
        numeric_cols = list(numeric_data.columns)
        for i, col1 in enumerate(numeric_cols):
            for j, col2 in enumerate(numeric_cols[i+1:], i+1):
                if len(numeric_cols) <= 10:  # Limit interactions for large datasets
                    features[f'{col1}_{col2}_ratio'] = (numeric_data[col1] / (numeric_data[col2] + 1e-6))
                    features[f'{col1}_{col2}_product'] = numeric_data[col1] * numeric_data[col2]
        
        # Fill any remaining NaN values
        features = features.fillna(0)
        
        # Remove infinite values
        features = features.replace([np.inf, -np.inf], 0)
        
        logger.info(f"Feature preparation complete. Shape: {features.shape}")
        return features
    
    def calculate_baseline_statistics(self, data: pd.DataFrame) -> Dict:
        """
        Calculate baseline statistics for statistical anomaly detection methods.
        """
        logger.info("Calculating baseline statistics")
        
        stats_dict = {}
        
        for column in data.select_dtypes(include=[np.number]).columns:
            col_data = data[column].dropna()
            
            if len(col_data) > 0:
                stats_dict[column] = {
                    'mean': float(col_data.mean()),
                    'std': float(col_data.std()),
                    'median': float(col_data.median()),
                    'q25': float(col_data.quantile(0.25)),
                    'q75': float(col_data.quantile(0.75)),
                    'iqr': float(col_data.quantile(0.75) - col_data.quantile(0.25)),
                    'mad': float(stats.median_abs_deviation(col_data)),
                    'min': float(col_data.min()),
                    'max': float(col_data.max())
                }
        
        self.baseline_statistics = stats_dict
        return stats_dict
    
    def detect_statistical_anomalies(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Detect anomalies using statistical methods (Z-score, IQR, Modified Z-score).
        """
        logger.info("Detecting statistical anomalies")
        
        anomaly_scores = pd.DataFrame(index=data.index)
        
        for column in data.select_dtypes(include=[np.number]).columns:
            if column in self.baseline_statistics:
                col_data = data[column]
                baseline = self.baseline_statistics[column]
                
                # Z-score anomalies
                if baseline['std'] > 0:
                    z_scores = np.abs((col_data - baseline['mean']) / baseline['std'])
                    anomaly_scores[f'{column}_zscore'] = z_scores
                    anomaly_scores[f'{column}_zscore_anomaly'] = (
                        z_scores > self.config['statistical_methods']['zscore_threshold']
                    ).astype(int)
                
                # IQR anomalies
                iqr_lower = baseline['q25'] - self.config['statistical_methods']['iqr_multiplier'] * baseline['iqr']
                iqr_upper = baseline['q75'] + self.config['statistical_methods']['iqr_multiplier'] * baseline['iqr']
                anomaly_scores[f'{column}_iqr_anomaly'] = (
                    (col_data < iqr_lower) | (col_data > iqr_upper)
                ).astype(int)
                
                # Modified Z-score (using MAD)
                if baseline['mad'] > 0:
                    modified_z_scores = 0.6745 * (col_data - baseline['median']) / baseline['mad']
                    anomaly_scores[f'{column}_modified_zscore'] = np.abs(modified_z_scores)
                    anomaly_scores[f'{column}_modified_zscore_anomaly'] = (
                        np.abs(modified_z_scores) > self.config['statistical_methods']['modified_zscore_threshold']
                    ).astype(int)
        
        return anomaly_scores
    
    def train_isolation_forest(self, X: np.ndarray) -> Dict:
        """Train Isolation Forest for anomaly detection."""
        logger.info("Training Isolation Forest")
        
        params = self.config['algorithms']['isolation_forest']
        model = IsolationForest(**params)
        model.fit(X)
        
        self.models['isolation_forest'] = model
        
        # Calculate training scores for threshold determination
        train_scores = model.decision_function(X)
        threshold = np.percentile(train_scores, params['contamination'] * 100)
        self.thresholds['isolation_forest'] = threshold
        
        return {
            'model_type': 'IsolationForest',
            'threshold': float(threshold),
            'contamination': params['contamination'],
            'n_estimators': params['n_estimators']
        }
    
    def train_local_outlier_factor(self, X: np.ndarray) -> Dict:
        """Train Local Outlier Factor for anomaly detection."""
        logger.info("Training Local Outlier Factor")
        
        params = self.config['algorithms']['lof']
        model = LocalOutlierFactor(**params)
        
        self.models['lof'] = model
        
        return {
            'model_type': 'LocalOutlierFactor',
            'n_neighbors': params['n_neighbors'],
            'contamination': params['contamination']
        }
    
    def train_one_class_svm(self, X: np.ndarray) -> Dict:
        """Train One-Class SVM for anomaly detection."""
        logger.info("Training One-Class SVM")
        
        params = self.config['algorithms']['one_class_svm']
        model = OneClassSVM(**params)
        model.fit(X)
        
        self.models['one_class_svm'] = model
        
        return {
            'model_type': 'OneClassSVM',
            'kernel': params['kernel'],
            'nu': params['nu']
        }
    
    def train_elliptic_envelope(self, X: np.ndarray) -> Dict:
        """Train Elliptic Envelope for anomaly detection."""
        logger.info("Training Elliptic Envelope")
        
        params = self.config['algorithms']['elliptic_envelope']
        model = EllipticEnvelope(**params)
        model.fit(X)
        
        self.models['elliptic_envelope'] = model
        
        return {
            'model_type': 'EllipticEnvelope',
            'contamination': params['contamination']
        }
    
    def create_autoencoder(self, input_dim: int) -> Model:
        """
        Create a deep autoencoder for anomaly detection.
        """
        config = self.config['autoencoder']
        
        # Encoder
        input_layer = Input(shape=(input_dim,))
        encoded = input_layer
        
        for hidden_dim in config['hidden_layers']:
            encoded = Dense(hidden_dim, activation='relu')(encoded)
            encoded = Dropout(config['dropout_rate'])(encoded)
        
        # Bottleneck
        encoded = Dense(config['encoding_dim'], activation='relu', name='bottleneck')(encoded)
        
        # Decoder
        decoded = encoded
        for hidden_dim in reversed(config['hidden_layers']):
            decoded = Dense(hidden_dim, activation='relu')(decoded)
            decoded = Dropout(config['dropout_rate'])(decoded)
        
        decoded = Dense(input_dim, activation='linear')(decoded)
        
        # Create and compile model
        autoencoder = Model(input_layer, decoded)
        autoencoder.compile(
            optimizer=Adam(learning_rate=config['learning_rate']),
            loss='mse',
            metrics=['mae']
        )
        
        return autoencoder
    
    def train_autoencoder(self, X: np.ndarray) -> Dict:
        """Train autoencoder for anomaly detection."""
        logger.info("Training Deep Autoencoder")
        
        config = self.config['autoencoder']
        
        # Create and train autoencoder
        autoencoder = self.create_autoencoder(X.shape[1])
        
        early_stopping = EarlyStopping(
            monitor='val_loss', 
            patience=10, 
            restore_best_weights=True
        )
        
        history = autoencoder.fit(
            X, X,
            epochs=config['epochs'],
            batch_size=config['batch_size'],
            validation_split=config['validation_split'],
            callbacks=[early_stopping],
            verbose=0
        )
        
        self.models['autoencoder'] = autoencoder
        
        # Calculate reconstruction error threshold
        reconstructions = autoencoder.predict(X, verbose=0)
        reconstruction_errors = np.mean(np.square(X - reconstructions), axis=1)
        threshold = np.percentile(reconstruction_errors, 95)  # Top 5% as anomalies
        self.thresholds['autoencoder'] = threshold
        
        return {
            'model_type': 'Autoencoder',
            'final_train_loss': float(history.history['loss'][-1]),
            'final_val_loss': float(history.history['val_loss'][-1]),
            'threshold': float(threshold),
            'input_dim': X.shape[1],
            'encoding_dim': config['encoding_dim']
        }
    
    def create_lstm_autoencoder(self, sequence_length: int, n_features: int) -> Model:
        """
        Create LSTM autoencoder for time series anomaly detection.
        """
        config = self.config['lstm_autoencoder']
        
        model = Sequential([
            LSTM(config['encoding_dim'], activation='relu', input_shape=(sequence_length, n_features), 
                 return_sequences=True),
            LSTM(config['encoding_dim']//2, activation='relu', return_sequences=False),
            Dense(config['encoding_dim']//4, activation='relu'),
            Dense(config['encoding_dim']//2, activation='relu'),
            Dense(config['encoding_dim'], activation='relu'),
            tf.keras.layers.RepeatVector(sequence_length),
            LSTM(config['encoding_dim'], activation='relu', return_sequences=True),
            LSTM(n_features, activation='linear', return_sequences=True)
        ])
        
        model.compile(optimizer=Adam(), loss='mse', metrics=['mae'])
        return model
    
    def prepare_lstm_sequences(self, data: np.ndarray, sequence_length: int) -> np.ndarray:
        """Prepare sequences for LSTM autoencoder."""
        sequences = []
        for i in range(len(data) - sequence_length + 1):
            sequences.append(data[i:(i + sequence_length)])
        return np.array(sequences)
    
    def train_lstm_autoencoder(self, X: np.ndarray) -> Dict:
        """Train LSTM autoencoder for time series anomaly detection."""
        logger.info("Training LSTM Autoencoder")
        
        config = self.config['lstm_autoencoder']
        sequence_length = config['sequence_length']
        
        if len(X) < sequence_length:
            logger.warning(f"Not enough data for LSTM autoencoder (need at least {sequence_length} samples)")
            return {'model_type': 'LSTM_Autoencoder', 'error': 'Insufficient data'}
        
        # Prepare sequences
        X_sequences = self.prepare_lstm_sequences(X, sequence_length)
        
        # Create and train model
        lstm_autoencoder = self.create_lstm_autoencoder(sequence_length, X.shape[1])
        
        early_stopping = EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True)
        
        history = lstm_autoencoder.fit(
            X_sequences, X_sequences,
            epochs=config['epochs'],
            batch_size=config['batch_size'],
            validation_split=config['validation_split'],
            callbacks=[early_stopping],
            verbose=0
        )
        
        self.models['lstm_autoencoder'] = lstm_autoencoder
        
        # Calculate threshold
        reconstructions = lstm_autoencoder.predict(X_sequences, verbose=0)
        reconstruction_errors = np.mean(np.square(X_sequences - reconstructions), axis=(1, 2))
        threshold = np.percentile(reconstruction_errors, 95)
        self.thresholds['lstm_autoencoder'] = threshold
        
        return {
            'model_type': 'LSTM_Autoencoder',
            'final_train_loss': float(history.history['loss'][-1]),
            'final_val_loss': float(history.history['val_loss'][-1]),
            'threshold': float(threshold),
            'sequence_length': sequence_length,
            'n_features': X.shape[1]
        }
    
    def train_all_models(self, data: pd.DataFrame) -> Dict:
        """
        Train all anomaly detection models on the provided data.
        """
        logger.info("Training all anomaly detection models")
        
        # Prepare features
        features = self.prepare_features(data)
        
        # Calculate baseline statistics
        self.calculate_baseline_statistics(features)
        
        # Scale features
        scaler = RobustScaler()  # More robust to outliers than StandardScaler
        X_scaled = scaler.fit_transform(features)
        self.scalers['features'] = scaler
        
        training_results = {}
        
        # Train traditional ML models
        training_results['isolation_forest'] = self.train_isolation_forest(X_scaled)
        training_results['lof'] = self.train_local_outlier_factor(X_scaled)
        training_results['one_class_svm'] = self.train_one_class_svm(X_scaled)
        training_results['elliptic_envelope'] = self.train_elliptic_envelope(X_scaled)
        
        # Train deep learning models
        training_results['autoencoder'] = self.train_autoencoder(X_scaled)
        training_results['lstm_autoencoder'] = self.train_lstm_autoencoder(X_scaled)
        
        logger.info("All models trained successfully")
        return training_results
    
    def detect_anomalies(self, data: pd.DataFrame) -> Dict:
        """
        Detect anomalies using all trained models and return ensemble results.
        """
        logger.info("Detecting anomalies with ensemble approach")
        
        if not self.models:
            raise ValueError("No models trained. Please call train_all_models first.")
        
        # Prepare features
        features = self.prepare_features(data)
        
        # Scale features
        if 'features' in self.scalers:
            X_scaled = self.scalers['features'].transform(features)
        else:
            raise ValueError("Feature scaler not found. Please train models first.")
        
        anomaly_results = {
            'individual_models': {},
            'statistical_methods': {},
            'ensemble_score': np.zeros(len(data)),
            'ensemble_anomaly': np.zeros(len(data)),
            'metadata': {
                'timestamp': datetime.now().isoformat(),
                'n_samples': len(data),
                'n_features': X_scaled.shape[1]
            }
        }
        
        model_scores = []
        
        # Statistical methods
        statistical_anomalies = self.detect_statistical_anomalies(features)
        anomaly_results['statistical_methods'] = statistical_anomalies.to_dict()
        
        # Isolation Forest
        if 'isolation_forest' in self.models:
            if_scores = self.models['isolation_forest'].decision_function(X_scaled)
            if_anomalies = (if_scores < self.thresholds['isolation_forest']).astype(int)
            anomaly_results['individual_models']['isolation_forest'] = {
                'scores': if_scores.tolist(),
                'anomalies': if_anomalies.tolist()
            }
            model_scores.append(if_anomalies)
        
        # Local Outlier Factor
        if 'lof' in self.models:
            lof_scores = self.models['lof'].decision_function(X_scaled)
            lof_anomalies = (lof_scores < -1.5).astype(int)  # Typically negative scores
            anomaly_results['individual_models']['lof'] = {
                'scores': lof_scores.tolist(),
                'anomalies': lof_anomalies.tolist()
            }
            model_scores.append(lof_anomalies)
        
        # One-Class SVM
        if 'one_class_svm' in self.models:
            svm_predictions = self.models['one_class_svm'].predict(X_scaled)
            svm_anomalies = (svm_predictions == -1).astype(int)
            anomaly_results['individual_models']['one_class_svm'] = {
                'predictions': svm_predictions.tolist(),
                'anomalies': svm_anomalies.tolist()
            }
            model_scores.append(svm_anomalies)
        
        # Elliptic Envelope
        if 'elliptic_envelope' in self.models:
            ee_predictions = self.models['elliptic_envelope'].predict(X_scaled)
            ee_anomalies = (ee_predictions == -1).astype(int)
            anomaly_results['individual_models']['elliptic_envelope'] = {
                'predictions': ee_predictions.tolist(),
                'anomalies': ee_anomalies.tolist()
            }
            model_scores.append(ee_anomalies)
        
        # Autoencoder
        if 'autoencoder' in self.models:
            reconstructions = self.models['autoencoder'].predict(X_scaled, verbose=0)
            ae_errors = np.mean(np.square(X_scaled - reconstructions), axis=1)
            ae_anomalies = (ae_errors > self.thresholds['autoencoder']).astype(int)
            anomaly_results['individual_models']['autoencoder'] = {
                'reconstruction_errors': ae_errors.tolist(),
                'anomalies': ae_anomalies.tolist()
            }
            model_scores.append(ae_anomalies)
        
        # LSTM Autoencoder
        if 'lstm_autoencoder' in self.models and len(X_scaled) >= self.config['lstm_autoencoder']['sequence_length']:
            sequence_length = self.config['lstm_autoencoder']['sequence_length']
            X_sequences = self.prepare_lstm_sequences(X_scaled, sequence_length)
            lstm_reconstructions = self.models['lstm_autoencoder'].predict(X_sequences, verbose=0)
            lstm_errors = np.mean(np.square(X_sequences - lstm_reconstructions), axis=(1, 2))
            lstm_anomalies_seq = (lstm_errors > self.thresholds['lstm_autoencoder']).astype(int)
            
            # Pad to match original length
            lstm_anomalies = np.zeros(len(X_scaled))
            lstm_anomalies[sequence_length-1:] = lstm_anomalies_seq
            
            anomaly_results['individual_models']['lstm_autoencoder'] = {
                'reconstruction_errors': lstm_errors.tolist(),
                'anomalies': lstm_anomalies.tolist()
            }
            model_scores.append(lstm_anomalies)
        
        # Ensemble scoring
        if model_scores:
            model_scores_array = np.array(model_scores)
            
            # Ensemble score as fraction of models detecting anomaly
            ensemble_score = np.mean(model_scores_array, axis=0)
            
            # Binary ensemble decision
            voting_threshold = self.config['ensemble']['voting_threshold']
            ensemble_anomaly = (ensemble_score >= voting_threshold).astype(int)
            
            anomaly_results['ensemble_score'] = ensemble_score.tolist()
            anomaly_results['ensemble_anomaly'] = ensemble_anomaly.tolist()
            
            # Summary statistics
            anomaly_results['summary'] = {
                'total_anomalies_detected': int(np.sum(ensemble_anomaly)),
                'anomaly_rate': float(np.mean(ensemble_anomaly)),
                'models_used': len(model_scores),
                'avg_ensemble_score': float(np.mean(ensemble_score)),
                'max_ensemble_score': float(np.max(ensemble_score))
            }
        
        # Store detection history
        detection_record = {
            'timestamp': datetime.now().isoformat(),
            'n_samples': len(data),
            'n_anomalies': int(np.sum(anomaly_results['ensemble_anomaly'])),
            'anomaly_rate': float(np.mean(anomaly_results['ensemble_anomaly']))
        }
        self.detection_history.append(detection_record)
        
        return anomaly_results
    
    def save_models(self, model_path: str) -> None:
        """Save all trained models and configurations."""
        logger.info(f"Saving anomaly detection models to {model_path}")
        
        # Separate TensorFlow models from scikit-learn models
        sklearn_models = {}
        tf_model_paths = {}
        
        for name, model in self.models.items():
            if hasattr(model, 'save'):  # TensorFlow model
                tf_path = model_path.replace('.pkl', f'_{name}.h5')
                model.save(tf_path)
                tf_model_paths[name] = tf_path
            else:  # scikit-learn model
                sklearn_models[name] = model
        
        model_data = {
            'sklearn_models': sklearn_models,
            'tf_model_paths': tf_model_paths,
            'scalers': self.scalers,
            'thresholds': self.thresholds,
            'baseline_statistics': self.baseline_statistics,
            'config': self.config,
            'detection_history': self.detection_history,
            'model_performance': self.model_performance
        }
        
        joblib.dump(model_data, model_path)
        logger.info("Models saved successfully!")
    
    def load_models(self, model_path: str) -> None:
        """Load all trained models and configurations."""
        logger.info(f"Loading anomaly detection models from {model_path}")
        
        model_data = joblib.load(model_path)
        
        # Load scikit-learn models
        self.models = model_data['sklearn_models']
        
        # Load TensorFlow models
        for name, tf_path in model_data['tf_model_paths'].items():
            try:
                self.models[name] = tf.keras.models.load_model(tf_path)
            except Exception as e:
                logger.warning(f"Could not load TensorFlow model {name}: {e}")
        
        self.scalers = model_data['scalers']
        self.thresholds = model_data['thresholds']
        self.baseline_statistics = model_data['baseline_statistics']
        self.config = model_data['config']
        self.detection_history = model_data['detection_history']
        self.model_performance = model_data['model_performance']
        
        logger.info("Models loaded successfully!")

# Example usage and testing
if __name__ == "__main__":
    # Generate synthetic data with anomalies
    logger.info("Generating synthetic data with anomalies")
    
    np.random.seed(42)
    n_samples = 1000
    n_normal = int(n_samples * 0.9)
    n_anomalies = n_samples - n_normal
    
    # Normal data
    normal_data = np.random.multivariate_normal(
        mean=[50, 60, 10], 
        cov=[[100, 20, 5], [20, 150, 10], [5, 10, 25]], 
        size=n_normal
    )
    
    # Anomalous data
    anomaly_data = np.random.multivariate_normal(
        mean=[80, 90, 50], 
        cov=[[200, 50, 20], [50, 300, 30], [20, 30, 100]], 
        size=n_anomalies
    )
    
    # Combine data
    all_data = np.vstack([normal_data, anomaly_data])
    true_labels = np.hstack([np.zeros(n_normal), np.ones(n_anomalies)])
    
    # Shuffle
    indices = np.random.permutation(len(all_data))
    all_data = all_data[indices]
    true_labels = true_labels[indices]
    
    # Create DataFrame
    timestamps = pd.date_range(start='2024-01-01', periods=n_samples, freq='5min')
    data = pd.DataFrame({
        'timestamp': timestamps,
        'cpu_usage': all_data[:, 0],
        'memory_usage': all_data[:, 1],
        'disk_io': all_data[:, 2]
    })
    
    # Initialize anomaly detection system
    detector = AnomalyDetectionSystem()
    
    # Train models
    training_results = detector.train_all_models(data)
    print(f"Training completed. Results summary:")
    for model_name, results in training_results.items():
        if 'error' not in results:
            print(f"  {model_name}: Successfully trained")
        else:
            print(f"  {model_name}: Training failed - {results.get('error', 'Unknown error')}")
    
    # Detect anomalies
    anomaly_results = detector.detect_anomalies(data)
    
    print(f"\n=== Anomaly Detection Results ===")
    print(f"Summary: {json.dumps(anomaly_results['summary'], indent=2)}")
    
    # Evaluate performance if we have true labels
    ensemble_predictions = np.array(anomaly_results['ensemble_anomaly'])
    
    # Calculate metrics
    from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
    
    print(f"\nPerformance Evaluation:")
    print(f"Classification Report:\n{classification_report(true_labels, ensemble_predictions)}")
    print(f"Confusion Matrix:\n{confusion_matrix(true_labels, ensemble_predictions)}")
    
    if len(np.unique(true_labels)) > 1:
        auc_score = roc_auc_score(true_labels, anomaly_results['ensemble_score'])
        print(f"AUC Score: {auc_score:.4f}")
    
    # Save models
    detector.save_models('/Users/danielbarreto/Development/workspace/ia/jaqEdu/src/ml/models/anomaly_detection_model.pkl')
    
    logger.info("Anomaly detection system initialized and tested successfully!")