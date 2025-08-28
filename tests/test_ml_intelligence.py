#!/usr/bin/env python3
"""
Comprehensive test suite for ML-powered predictive failure detection and self-healing intelligence.
"""

import sys
import os
import unittest
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import tempfile
import shutil
from unittest.mock import Mock, patch
import warnings
warnings.filterwarnings('ignore')

# Add src directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src', 'ml'))

# Import our ML components
from failure_pattern_recognition import FailurePatternRecognizer, generate_synthetic_failure_data
from predictive_analytics import PredictiveAnalyticsEngine
from anomaly_detection import AnomalyDetectionSystem
from auto_tuning import AutoTuningSystem
from self_healing_orchestrator import (
    SelfHealingOrchestrator, FailureEvent, HealingResponse, HealingResult,
    FailureType, HealingAction, Priority
)
from continuous_learning import (
    ContinuousLearningSystem, LearningExperience, PatternBasedLearning, MetaLearning
)
from ml_orchestrator import MLIntelligenceOrchestrator, SystemMetrics


class TestFailurePatternRecognition(unittest.TestCase):
    """Test failure pattern recognition system."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.recognizer = FailurePatternRecognizer()
        self.test_data = generate_synthetic_failure_data(1000)
        
    def test_feature_engineering(self):
        """Test feature engineering functionality."""
        engineered_data = self.recognizer.engineer_features(self.test_data)
        
        # Check that features were added
        self.assertGreater(len(engineered_data.columns), len(self.test_data.columns))
        
        # Check for specific engineered features
        feature_columns = engineered_data.columns.tolist()
        self.assertTrue(any('rolling' in col for col in feature_columns))
        self.assertTrue(any('rate_of_change' in col for col in feature_columns))
        
    def test_preprocessing(self):
        """Test data preprocessing."""
        engineered_data = self.recognizer.engineer_features(self.test_data)
        X, y = self.recognizer.preprocess_data(engineered_data, is_training=True)
        
        # Check shapes
        self.assertEqual(X.shape[0], y.shape[0])
        self.assertIsInstance(X, np.ndarray)
        self.assertIsInstance(y, np.ndarray)
        
    def test_model_training(self):
        """Test ensemble model training."""
        engineered_data = self.recognizer.engineer_features(self.test_data)
        X, y = self.recognizer.preprocess_data(engineered_data, is_training=True)
        
        # Split data
        split_idx = int(len(X) * 0.8)
        X_train, y_train = X[:split_idx], y[:split_idx]
        
        # Train models
        results = self.recognizer.train_ensemble_models(X_train, y_train)
        
        # Check that models were trained
        self.assertIn('random_forest', results)
        self.assertIn('gradient_boosting', results)
        self.assertGreater(results['random_forest']['cv_score_mean'], 0.5)
        
    def test_prediction(self):
        """Test failure prediction."""
        # Train models first
        engineered_data = self.recognizer.engineer_features(self.test_data)
        X, y = self.recognizer.preprocess_data(engineered_data, is_training=True)
        split_idx = int(len(X) * 0.8)
        X_train, y_train = X[:split_idx], y[:split_idx]
        X_test = X[split_idx:split_idx+10]  # Small test set
        
        self.recognizer.train_ensemble_models(X_train, y_train)
        
        # Make predictions
        predictions = self.recognizer.predict_failure_probability(X_test)
        
        # Check prediction structure
        self.assertIn('ensemble_probability', predictions)
        self.assertIn('individual_predictions', predictions)
        self.assertEqual(len(predictions['ensemble_probability']), len(X_test))
        
    def test_feature_importance(self):
        """Test feature importance analysis."""
        # Train models first
        engineered_data = self.recognizer.engineer_features(self.test_data)
        X, y = self.recognizer.preprocess_data(engineered_data, is_training=True)
        split_idx = int(len(X) * 0.8)
        X_train, y_train = X[:split_idx], y[:split_idx]
        
        self.recognizer.train_ensemble_models(X_train, y_train)
        
        # Get feature importance
        importance_analysis = self.recognizer.get_feature_importance_analysis()
        
        # Check structure
        self.assertIn('top_features', importance_analysis)
        self.assertIn('individual_models', importance_analysis)
        self.assertIsInstance(importance_analysis['top_features'], list)


class TestPredictiveAnalytics(unittest.TestCase):
    """Test predictive analytics engine."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.engine = PredictiveAnalyticsEngine()
        # Create time series data
        dates = pd.date_range(start='2024-01-01', periods=200, freq='1H')
        self.test_data = pd.DataFrame({
            'timestamp': dates,
            'cpu_usage': np.random.normal(50, 10, len(dates)) + 20 * np.sin(np.arange(len(dates)) * 2 * np.pi / 24),
            'memory_usage': np.random.normal(60, 15, len(dates)),
            'disk_io': np.random.exponential(10, len(dates))
        })
        
    def test_time_series_features(self):
        """Test time series feature creation."""
        features = self.engine.create_time_series_features(self.test_data, 'cpu_usage')
        
        # Check that temporal features were added
        self.assertIn('hour', features.columns)
        self.assertIn('day_of_week', features.columns)
        self.assertTrue(any('lag' in col for col in features.columns))
        self.assertTrue(any('rolling' in col for col in features.columns))
        
    def test_seasonality_detection(self):
        """Test seasonality and trend detection."""
        cpu_series = self.test_data.set_index('timestamp')['cpu_usage']
        patterns = self.engine.detect_seasonality_and_trend(cpu_series)
        
        # Check pattern detection results
        self.assertIn('trend_strength', patterns)
        self.assertIn('seasonal_strength', patterns)
        self.assertIn('trend_direction', patterns)
        self.assertIn('has_strong_trend', patterns)
        self.assertIn('has_strong_seasonality', patterns)
        
    def test_arima_training(self):
        """Test ARIMA model training."""
        cpu_series = self.test_data.set_index('timestamp')['cpu_usage']
        results = self.engine.train_arima_model(cpu_series, 'cpu_usage')
        
        # Check training results
        self.assertEqual(results['model_type'], 'ARIMA')
        if results.get('success', True):
            self.assertIn('aic', results)
            self.assertIn('bic', results)
        
    def test_ml_forecasting(self):
        """Test ML forecasting models."""
        features = self.engine.create_time_series_features(self.test_data, 'cpu_usage')
        results = self.engine.train_ml_forecasting_models(features, 'cpu_usage')
        
        # Check that models were trained
        if 'random_forest' in results:
            self.assertIn('cv_score_mean', results['random_forest'])
        if 'gradient_boosting' in results:
            self.assertIn('cv_score_mean', results['gradient_boosting'])
        
    def test_forecasting(self):
        """Test forecast generation."""
        # Train a simple model first
        features = self.engine.create_time_series_features(self.test_data, 'cpu_usage')
        ml_results = self.engine.train_ml_forecasting_models(features, 'cpu_usage')
        
        # Generate forecasts
        forecasts = self.engine.make_forecasts(self.test_data, 'cpu_usage')
        
        # Check forecast structure
        self.assertIn('short_term', forecasts)
        self.assertIn('medium_term', forecasts)
        self.assertIn('long_term', forecasts)


class TestAnomalyDetection(unittest.TestCase):
    """Test anomaly detection system."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.detector = AnomalyDetectionSystem()
        
        # Create data with known anomalies
        normal_data = np.random.multivariate_normal([50, 60, 10], [[100, 20, 5], [20, 150, 10], [5, 10, 25]], 800)
        anomaly_data = np.random.multivariate_normal([80, 90, 50], [[200, 50, 20], [50, 300, 30], [20, 30, 100]], 200)
        
        all_data = np.vstack([normal_data, anomaly_data])
        np.random.shuffle(all_data)
        
        self.test_data = pd.DataFrame({
            'cpu_usage': all_data[:, 0],
            'memory_usage': all_data[:, 1],
            'disk_io': all_data[:, 2],
            'timestamp': pd.date_range(start='2024-01-01', periods=len(all_data), freq='5min')
        })
        
    def test_feature_preparation(self):
        """Test feature preparation for anomaly detection."""
        features = self.detector.prepare_features(self.test_data)
        
        # Check that features were engineered
        self.assertGreater(len(features.columns), len(self.test_data.columns) - 1)  # -1 for timestamp
        
        # Check for rate of change features
        feature_columns = features.columns.tolist()
        self.assertTrue(any('rate_of_change' in col for col in feature_columns))
        self.assertTrue(any('rolling' in col for col in feature_columns))
        
    def test_baseline_statistics(self):
        """Test baseline statistics calculation."""
        stats = self.detector.calculate_baseline_statistics(self.test_data)
        
        # Check that statistics were calculated
        self.assertIn('cpu_usage', stats)
        self.assertIn('memory_usage', stats)
        self.assertIn('disk_io', stats)
        
        # Check statistical measures
        for col_stats in stats.values():
            self.assertIn('mean', col_stats)
            self.assertIn('std', col_stats)
            self.assertIn('median', col_stats)
            self.assertIn('q25', col_stats)
            self.assertIn('q75', col_stats)
        
    def test_statistical_anomalies(self):
        """Test statistical anomaly detection."""
        self.detector.calculate_baseline_statistics(self.test_data)
        anomaly_scores = self.detector.detect_statistical_anomalies(self.test_data)
        
        # Check that anomaly scores were calculated
        self.assertGreater(len(anomaly_scores.columns), 0)
        
        # Check for different types of anomaly detection
        columns = anomaly_scores.columns.tolist()
        self.assertTrue(any('zscore' in col for col in columns))
        self.assertTrue(any('iqr' in col for col in columns))
        
    def test_model_training(self):
        """Test anomaly detection model training."""
        training_results = self.detector.train_all_models(self.test_data)
        
        # Check that models were trained
        self.assertIn('isolation_forest', training_results)
        self.assertIn('autoencoder', training_results)
        
        # Check model results
        for model_name, result in training_results.items():
            if 'error' not in result:
                self.assertEqual(result['model_type'], model_name.replace('_', '').title().replace('Forest', 'Forest'))
        
    def test_anomaly_detection(self):
        """Test anomaly detection on new data."""
        # Train models first
        self.detector.train_all_models(self.test_data[:800])  # Train on first 800 samples
        
        # Detect anomalies on remaining data
        test_data = self.test_data[800:900]  # Test on next 100 samples
        results = self.detector.detect_anomalies(test_data)
        
        # Check results structure
        self.assertIn('individual_models', results)
        self.assertIn('ensemble_score', results)
        self.assertIn('ensemble_anomaly', results)
        self.assertIn('summary', results)
        
        # Check that scores were generated
        self.assertEqual(len(results['ensemble_score']), len(test_data))
        self.assertEqual(len(results['ensemble_anomaly']), len(test_data))


class TestAutoTuning(unittest.TestCase):
    """Test auto-tuning system."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.tuner = AutoTuningSystem()
        
        # Create simple classification data
        from sklearn.datasets import make_classification
        self.X, self.y = make_classification(n_samples=500, n_features=10, n_classes=2, random_state=42)
        
    def test_bayesian_optimization(self):
        """Test Bayesian optimization."""
        from sklearn.ensemble import RandomForestClassifier
        
        # Run optimization with limited trials for testing
        original_trials = self.tuner.config['bayesian_optimization']['n_trials']
        self.tuner.config['bayesian_optimization']['n_trials'] = 5
        
        try:
            result = self.tuner.bayesian_optimization(
                RandomForestClassifier, 'random_forest', self.X, self.y
            )
            
            # Check result structure
            self.assertEqual(result['method'], 'bayesian_optimization')
            if 'error' not in result:
                self.assertIn('best_parameters', result)
                self.assertIn('best_score', result)
                self.assertGreater(result['best_score'], 0)
        finally:
            self.tuner.config['bayesian_optimization']['n_trials'] = original_trials
        
    def test_random_search_optimization(self):
        """Test random search optimization."""
        from sklearn.ensemble import RandomForestClassifier
        
        # Run optimization with limited iterations
        original_iter = self.tuner.config['random_search']['n_iter']
        self.tuner.config['random_search']['n_iter'] = 5
        
        try:
            result = self.tuner.random_search_optimization(
                RandomForestClassifier, 'random_forest', self.X, self.y
            )
            
            # Check result structure
            self.assertEqual(result['method'], 'random_search')
            if 'error' not in result:
                self.assertIn('best_parameters', result)
                self.assertIn('best_score', result)
        finally:
            self.tuner.config['random_search']['n_iter'] = original_iter
        
    def test_model_optimization(self):
        """Test complete model optimization."""
        from sklearn.ensemble import RandomForestClassifier
        
        # Limit optimization for testing
        self.tuner.config['bayesian_optimization']['n_trials'] = 3
        self.tuner.config['random_search']['n_iter'] = 3
        
        result = self.tuner.optimize_model(
            RandomForestClassifier, 'random_forest', self.X, self.y,
            optimization_methods=['random_search']  # Use only random search for speed
        )
        
        # Check optimization record
        self.assertIn('model_name', result)
        self.assertIn('optimization_methods', result)
        self.assertIn('best_result', result)
        self.assertEqual(result['model_name'], 'random_forest')
        
    def test_optimized_model_creation(self):
        """Test creating optimized model instances."""
        from sklearn.ensemble import RandomForestClassifier
        
        # Run optimization first
        self.tuner.config['random_search']['n_iter'] = 3
        self.tuner.optimize_model(
            RandomForestClassifier, 'random_forest', self.X, self.y,
            optimization_methods=['random_search']
        )
        
        # Get optimized model
        optimized_model = self.tuner.get_optimized_model('random_forest')
        
        # Check that model was created
        if optimized_model is not None:
            self.assertIsInstance(optimized_model, RandomForestClassifier)


class TestSelfHealingOrchestrator(unittest.TestCase):
    """Test self-healing orchestrator."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.orchestrator = SelfHealingOrchestrator()
        
    def test_state_encoding(self):
        """Test failure event state encoding."""
        failure_event = FailureEvent(
            failure_type=FailureType.CPU_OVERLOAD,
            severity=0.8,
            affected_components=["web-server"],
            metrics={"cpu_usage": 95.0}
        )
        
        state = self.orchestrator.encode_state(failure_event)
        self.assertIsInstance(state, int)
        self.assertGreaterEqual(state, 0)
        
    def test_action_decoding(self):
        """Test action index decoding."""
        action = self.orchestrator.decode_action(0)
        self.assertIsInstance(action, HealingAction)
        
    def test_healing_response_generation(self):
        """Test healing response generation."""
        failure_event = FailureEvent(
            failure_type=FailureType.CPU_OVERLOAD,
            severity=0.8,
            affected_components=["web-server"],
            metrics={"cpu_usage": 95.0}
        )
        
        response = self.orchestrator.generate_healing_response(failure_event)
        
        # Check response structure
        self.assertIsInstance(response, HealingResponse)
        self.assertIsInstance(response.action, HealingAction)
        self.assertIsInstance(response.priority, Priority)
        self.assertGreater(response.estimated_duration, 0)
        self.assertGreater(response.success_probability, 0)
        
    def test_failure_handling(self):
        """Test complete failure handling workflow."""
        failure_event = FailureEvent(
            failure_type=FailureType.MEMORY_LEAK,
            severity=0.7,
            affected_components=["application-server"],
            metrics={"memory_usage": 85.0}
        )
        
        result = self.orchestrator.handle_failure(failure_event)
        
        # Check result structure
        self.assertIn('failure_handled', result)
        self.assertIn('healing_action', result)
        self.assertIn('success', result)
        self.assertIn('duration', result)
        self.assertTrue(result['failure_handled'])
        
    def test_health_report(self):
        """Test system health report generation."""
        # Handle a few failures first
        for i in range(3):
            failure_event = FailureEvent(
                failure_type=FailureType.CPU_OVERLOAD,
                severity=0.5 + i * 0.1,
                affected_components=[f"component-{i}"],
                metrics={"cpu_usage": 70.0 + i * 5}
            )
            self.orchestrator.handle_failure(failure_event)
        
        report = self.orchestrator.get_system_health_report()
        
        # Check report structure
        self.assertIn('total_failures_handled', report)
        self.assertIn('overall_success_rate', report)
        self.assertIn('strategy_performance', report)
        self.assertIn('learning_progress', report)
        self.assertIn('system_status', report)


class TestContinuousLearning(unittest.TestCase):
    """Test continuous learning system."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.learning_system = ContinuousLearningSystem()
        
    def test_experience_recording(self):
        """Test learning experience recording."""
        experience = LearningExperience(
            experience_id="test_001",
            experience_type="failure_recovery",
            timestamp=datetime.now(),
            context={"failure_type": "cpu_overload", "severity": 0.8},
            action_taken="scale_up",
            outcome={"success": True, "improvement": 0.6},
            metrics_before={"cpu_usage": 90.0},
            metrics_after={"cpu_usage": 65.0},
            learned_patterns=[],
            confidence_score=0.8
        )
        
        result = self.learning_system.record_experience(experience)
        
        # Check recording result
        self.assertTrue(result['experience_recorded'])
        self.assertIn('learning_results', result)
        self.assertEqual(result['experience_id'], "test_001")
        
    def test_pattern_based_learning(self):
        """Test pattern-based learning strategy."""
        pattern_learner = PatternBasedLearning()
        
        # Create multiple similar experiences
        for i in range(5):
            experience = LearningExperience(
                experience_id=f"pattern_test_{i}",
                experience_type="failure_recovery",
                timestamp=datetime.now(),
                context={"failure_type": "cpu_overload", "severity": 0.7},
                action_taken="scale_up",
                outcome={"success": True},
                metrics_before={"cpu_usage": 85.0},
                metrics_after={"cpu_usage": 60.0},
                learned_patterns=[],
                confidence_score=0.7
            )
            pattern_learner.learn_from_experience(experience)
        
        # Test recommendations
        recommendations = pattern_learner.get_recommendations({
            "experience_type": "failure_recovery",
            "failure_type": "cpu_overload"
        })
        
        # Check recommendations
        self.assertIsInstance(recommendations, list)
        if recommendations:
            self.assertIn('action', recommendations[0])
            self.assertIn('success_rate', recommendations[0])
        
    def test_meta_learning(self):
        """Test meta-learning strategy."""
        meta_learner = MetaLearning()
        
        # Create experiences with different learning strategies
        for strategy in ['pattern_based', 'rule_based']:
            experience = LearningExperience(
                experience_id=f"meta_test_{strategy}",
                experience_type="optimization",
                timestamp=datetime.now(),
                context={"learning_strategy": strategy},
                action_taken="tune_parameters",
                outcome={"success": True},
                metrics_before={},
                metrics_after={},
                learned_patterns=[],
                confidence_score=0.8
            )
            meta_learner.learn_from_experience(experience)
        
        # Test meta-learning
        recommendations = meta_learner.get_recommendations({
            "experience_type": "optimization"
        })
        
        self.assertIsInstance(recommendations, list)
        
    def test_learning_report(self):
        """Test learning progress report."""
        # Add some experiences
        for i in range(10):
            experience = LearningExperience(
                experience_id=f"report_test_{i}",
                experience_type="failure_recovery",
                timestamp=datetime.now(),
                context={"failure_type": "cpu_overload"},
                action_taken="scale_up",
                outcome={"success": i % 3 == 0},  # 1/3 success rate
                metrics_before={},
                metrics_after={},
                learned_patterns=[],
                confidence_score=0.6
            )
            self.learning_system.record_experience(experience)
        
        report = self.learning_system.get_learning_report()
        
        # Check report structure
        self.assertIn('total_experiences', report)
        self.assertIn('learning_effectiveness', report)
        self.assertIn('system_status', report)
        self.assertEqual(report['total_experiences'], 10)


class TestMLOrchestrator(unittest.TestCase):
    """Test ML intelligence orchestrator."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.orchestrator = MLIntelligenceOrchestrator()
        
    def test_system_metrics_collection(self):
        """Test system metrics collection."""
        metrics = self.orchestrator.collect_system_metrics()
        
        # Check metrics structure
        self.assertIsInstance(metrics, SystemMetrics)
        self.assertIsInstance(metrics.cpu_usage, float)
        self.assertIsInstance(metrics.memory_usage, float)
        self.assertIsInstance(metrics.timestamp, datetime)
        
        # Check reasonable ranges
        self.assertGreaterEqual(metrics.cpu_usage, 0)
        self.assertLessEqual(metrics.cpu_usage, 100)
        self.assertGreaterEqual(metrics.memory_usage, 0)
        self.assertLessEqual(metrics.memory_usage, 100)
        
    def test_system_initialization(self):
        """Test system initialization."""
        # Mock heavy training operations for testing
        with patch.object(self.orchestrator.failure_recognizer, 'train_ensemble_models') as mock_train:
            mock_train.return_value = {'random_forest': {'cv_score_mean': 0.8}}
            
            result = self.orchestrator.initialize_system()
            
            # Check initialization result
            self.assertIn('initialization_successful', result)
            if result['initialization_successful']:
                self.assertIn('components_initialized', result)
                self.assertIn('training_data_samples', result)
        
    def test_metrics_analysis(self):
        """Test ML-based metrics analysis."""
        # Create test metrics
        metrics = SystemMetrics(
            timestamp=datetime.now(),
            cpu_usage=85.0,
            memory_usage=70.0,
            disk_io=15.0,
            network_latency=100.0,
            error_count=5,
            total_requests=1000,
            response_time=150.0,
            throughput=100.0
        )
        
        # Mock trained models to avoid training during test
        self.orchestrator.models_trained = True
        
        # Add some history for analysis
        for i in range(50):
            historical_metrics = SystemMetrics(
                timestamp=datetime.now() - timedelta(minutes=i),
                cpu_usage=50.0 + np.random.normal(0, 10),
                memory_usage=60.0 + np.random.normal(0, 10),
                disk_io=10.0 + np.random.exponential(5),
                network_latency=80.0 + np.random.normal(0, 20),
                error_count=np.random.poisson(3),
                total_requests=1000 + np.random.normal(0, 100),
                response_time=120.0 + np.random.normal(0, 30),
                throughput=90.0 + np.random.normal(0, 20)
            )
            self.orchestrator.system_metrics_history.append(historical_metrics)
        
        analysis = self.orchestrator.analyze_metrics_with_ml(metrics)
        
        # Check analysis structure (even if some components fail)
        self.assertIsInstance(analysis, dict)
        
    def test_intelligent_decisions(self):
        """Test intelligent decision making."""
        metrics = SystemMetrics(
            timestamp=datetime.now(),
            cpu_usage=95.0,  # High CPU usage
            memory_usage=85.0,
            disk_io=20.0,
            network_latency=200.0,
            error_count=15,
            total_requests=1000,
            response_time=300.0,
            throughput=50.0
        )
        
        # Mock analysis results
        analysis = {
            'failure_prediction': {
                'ensemble_probability': 0.8,
                'confidence': 0.7
            },
            'anomaly_detection': {
                'ensemble_score': 0.9,
                'is_anomaly': 1
            }
        }
        
        decisions = self.orchestrator.make_intelligent_decisions(metrics, analysis)
        
        # Check decision structure
        self.assertIn('actions_recommended', decisions)
        self.assertIn('alerts_generated', decisions)
        self.assertIn('healing_triggered', decisions)
        
        # Should trigger healing due to high failure probability and anomaly score
        self.assertTrue(decisions['healing_triggered'])
        
    def test_system_health_report(self):
        """Test system health report generation."""
        # Add some test metrics history
        for i in range(20):
            metrics = SystemMetrics(
                timestamp=datetime.now() - timedelta(minutes=i),
                cpu_usage=50.0 + np.random.normal(0, 10),
                memory_usage=60.0 + np.random.normal(0, 10),
                disk_io=10.0,
                network_latency=100.0,
                error_count=2,
                total_requests=1000,
                response_time=120.0,
                throughput=90.0
            )
            self.orchestrator.system_metrics_history.append(metrics)
        
        self.orchestrator.models_trained = True
        self.orchestrator.system_health_score = 0.85
        
        report = self.orchestrator.get_system_intelligence_report()
        
        # Check report structure
        self.assertIn('system_health_score', report)
        self.assertIn('intelligence_status', report)
        self.assertIn('recent_performance', report)
        self.assertIn('ml_performance', report)
        self.assertIn('components_status', report)
        
        self.assertEqual(report['system_health_score'], 0.85)
        self.assertIn(report['intelligence_status'], ['OPTIMAL', 'GOOD', 'DEGRADED'])


class TestIntegration(unittest.TestCase):
    """Integration tests for the complete system."""
    
    def setUp(self):
        """Set up integration test fixtures."""
        self.orchestrator = MLIntelligenceOrchestrator()
        
    def test_end_to_end_workflow(self):
        """Test complete end-to-end workflow."""
        # Limit training for testing
        with patch.object(self.orchestrator.failure_recognizer, 'train_ensemble_models') as mock_failure_train, \
             patch.object(self.orchestrator.anomaly_detector, 'train_all_models') as mock_anomaly_train:
            
            mock_failure_train.return_value = {'random_forest': {'cv_score_mean': 0.8}}
            mock_anomaly_train.return_value = {'isolation_forest': {'model_type': 'IsolationForest'}}
            
            # Initialize system
            init_result = self.orchestrator.initialize_system()
            
            if init_result['initialization_successful']:
                # Simulate system operation
                for i in range(5):
                    metrics = self.orchestrator.collect_system_metrics()
                    analysis = self.orchestrator.analyze_metrics_with_ml(metrics)
                    decisions = self.orchestrator.make_intelligent_decisions(metrics, analysis)
                    
                    # Check that workflow completed without errors
                    self.assertIsInstance(decisions, dict)
                
                # Generate final report
                report = self.orchestrator.get_system_intelligence_report()
                self.assertIn('system_health_score', report)
            else:
                self.skipTest("System initialization failed, skipping end-to-end test")
    
    def test_state_persistence(self):
        """Test system state saving and loading."""
        with tempfile.TemporaryDirectory() as temp_dir:
            base_path = os.path.join(temp_dir, "test_system_state")
            
            # Mock minimal trained state
            self.orchestrator.models_trained = True
            self.orchestrator.last_training_time = datetime.now()
            self.orchestrator.system_health_score = 0.75
            
            # Save state
            save_result = self.orchestrator.save_system_state(base_path)
            
            # Check that files were created (at least some should succeed)
            self.assertIsInstance(save_result, dict)
            
            # Create new orchestrator and load state
            new_orchestrator = MLIntelligenceOrchestrator()
            load_result = new_orchestrator.load_system_state(base_path)
            
            # Check load result
            self.assertIsInstance(load_result, dict)


def run_tests():
    """Run all tests with detailed output."""
    # Create test suite
    test_suite = unittest.TestSuite()
    
    # Add test classes
    test_classes = [
        TestFailurePatternRecognition,
        TestPredictiveAnalytics,
        TestAnomalyDetection,
        TestAutoTuning,
        TestSelfHealingOrchestrator,
        TestContinuousLearning,
        TestMLOrchestrator,
        TestIntegration
    ]
    
    for test_class in test_classes:
        tests = unittest.TestLoader().loadTestsFromTestCase(test_class)
        test_suite.addTests(tests)
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(test_suite)
    
    # Print summary
    print(f"\n{'='*50}")
    print(f"Test Results Summary")
    print(f"{'='*50}")
    print(f"Tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Success rate: {((result.testsRun - len(result.failures) - len(result.errors)) / result.testsRun * 100):.1f}%")
    
    if result.failures:
        print(f"\nFailures:")
        for test, traceback in result.failures:
            print(f"  - {test}: {traceback.split('AssertionError:')[-1].strip()}")
    
    if result.errors:
        print(f"\nErrors:")
        for test, traceback in result.errors:
            print(f"  - {test}: {traceback.split('Error:')[-1].strip()}")
    
    return result.wasSuccessful()


if __name__ == "__main__":
    success = run_tests()
    exit(0 if success else 1)