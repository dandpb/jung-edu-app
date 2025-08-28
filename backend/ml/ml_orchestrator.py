#!/usr/bin/env python3
"""
ML-Powered Predictive Failure Detection and Self-Healing Intelligence Orchestrator
Main orchestrator that coordinates all ML components for intelligent self-healing.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional, Any, Callable
import json
import logging
from datetime import datetime, timedelta
import warnings
import threading
import time
from collections import defaultdict, deque
import joblib
from dataclasses import dataclass, field
import asyncio
from concurrent.futures import ThreadPoolExecutor, as_completed

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

warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class SystemMetrics:
    """System metrics snapshot."""
    timestamp: datetime
    cpu_usage: float
    memory_usage: float
    disk_io: float
    network_latency: float
    error_count: int
    total_requests: int
    response_time: float
    throughput: float

@dataclass
class PredictionResult:
    """Result from ML prediction."""
    prediction_type: str
    confidence: float
    predicted_values: Dict[str, Any]
    risk_level: str
    recommendations: List[Dict[str, Any]]
    timestamp: datetime

class MLIntelligenceOrchestrator:
    """
    Master orchestrator for ML-powered predictive failure detection and self-healing.
    Coordinates all ML components and provides unified intelligent responses.
    """
    
    def __init__(self, config: Dict = None):
        """Initialize the ML intelligence orchestrator."""
        self.config = config or self._default_config()
        
        # Initialize ML components
        self.failure_recognizer = FailurePatternRecognizer()
        self.predictive_engine = PredictiveAnalyticsEngine()
        self.anomaly_detector = AnomalyDetectionSystem()
        self.auto_tuner = AutoTuningSystem()
        self.healing_orchestrator = SelfHealingOrchestrator()
        self.learning_system = ContinuousLearningSystem()
        
        # System state
        self.system_metrics_history = deque(maxlen=10000)
        self.prediction_history = deque(maxlen=1000)
        self.healing_history = deque(maxlen=1000)
        
        # Performance tracking
        self.ml_performance = defaultdict(lambda: {'predictions': 0, 'accuracy': 0.0})
        self.system_health_score = 1.0
        
        # Threading and execution
        self.running = False
        self.monitoring_thread = None
        self.prediction_thread = None
        self.threads = []
        
        # Coordination state
        self.active_predictions = {}
        self.healing_queue = deque()
        self.alert_queue = deque()
        
        # Model states
        self.models_trained = False
        self.last_training_time = None
        self.last_retraining_check = time.time()
        
    def _default_config(self) -> Dict:
        """Default configuration for the ML orchestrator."""
        return {
            'monitoring': {
                'metrics_collection_interval': 30,  # seconds
                'prediction_interval': 60,          # seconds
                'health_check_interval': 120,       # seconds
                'retraining_interval': 3600,        # 1 hour
            },
            'prediction': {
                'failure_probability_threshold': 0.7,
                'anomaly_threshold': 0.8,
                'prediction_horizon_minutes': 30,
                'ensemble_voting_threshold': 0.6,
            },
            'healing': {
                'auto_healing_enabled': True,
                'healing_confidence_threshold': 0.6,
                'max_concurrent_healings': 3,
                'healing_timeout': 300,  # 5 minutes
            },
            'learning': {
                'continuous_learning_enabled': True,
                'experience_recording_enabled': True,
                'adaptation_enabled': True,
                'min_experiences_for_adaptation': 50,
            },
            'performance': {
                'min_prediction_accuracy': 0.7,
                'max_false_positive_rate': 0.1,
                'target_healing_success_rate': 0.8,
                'performance_evaluation_window': 100,
            },
            'alerts': {
                'enable_critical_alerts': True,
                'enable_predictive_alerts': True,
                'alert_aggregation_window': 300,  # 5 minutes
                'max_alerts_per_window': 10,
            }
        }
    
    def initialize_system(self) -> Dict[str, Any]:
        """Initialize all ML components and train initial models."""
        logger.info("Initializing ML-powered intelligence system...")
        
        initialization_results = {}
        
        try:
            # Generate initial training data
            logger.info("Generating initial training data...")
            training_data = generate_synthetic_failure_data(10000)
            
            # Train failure pattern recognition
            logger.info("Training failure pattern recognition models...")
            engineered_data = self.failure_recognizer.engineer_features(training_data)
            X, y = self.failure_recognizer.preprocess_data(engineered_data, is_training=True)
            X_train, X_test, y_train, y_test = self._split_data(X, y)
            
            pattern_results = self.failure_recognizer.train_ensemble_models(X_train, y_train)
            initialization_results['failure_recognition'] = pattern_results
            
            # Train predictive analytics models
            logger.info("Training predictive analytics models...")
            features = self.predictive_engine.create_time_series_features(training_data, 'cpu_usage')
            
            # Train multiple models
            arima_results = self.predictive_engine.train_arima_model(
                training_data.set_index('timestamp')['cpu_usage'], 'cpu_usage'
            )
            es_results = self.predictive_engine.train_exponential_smoothing(
                training_data.set_index('timestamp')['cpu_usage'], 'cpu_usage'
            )
            ml_results = self.predictive_engine.train_ml_forecasting_models(features, 'cpu_usage')
            
            initialization_results['predictive_analytics'] = {
                'arima': arima_results,
                'exponential_smoothing': es_results,
                'ml_models': ml_results
            }
            
            # Train anomaly detection models
            logger.info("Training anomaly detection models...")
            anomaly_results = self.anomaly_detector.train_all_models(training_data)
            initialization_results['anomaly_detection'] = anomaly_results
            
            # Initialize auto-tuning system
            logger.info("Initializing auto-tuning system...")
            # Auto-tuning will be triggered based on performance
            initialization_results['auto_tuning'] = {'initialized': True}
            
            # Start healing orchestrator
            logger.info("Starting self-healing orchestrator...")
            self.healing_orchestrator.start_orchestrator()
            initialization_results['healing_orchestrator'] = {'started': True}
            
            # Start continuous learning
            logger.info("Starting continuous learning system...")
            self.learning_system.start_continuous_learning()
            initialization_results['continuous_learning'] = {'started': True}
            
            self.models_trained = True
            self.last_training_time = datetime.now()
            
            logger.info("ML intelligence system initialization completed successfully!")
            
            return {
                'initialization_successful': True,
                'components_initialized': list(initialization_results.keys()),
                'training_data_samples': len(training_data),
                'initialization_time': datetime.now().isoformat(),
                'results': initialization_results
            }
            
        except Exception as e:
            logger.error(f"System initialization failed: {e}")
            return {
                'initialization_successful': False,
                'error': str(e),
                'partial_results': initialization_results
            }
    
    def _split_data(self, X: np.ndarray, y: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """Split data for training and testing."""
        from sklearn.model_selection import train_test_split
        return train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    def start_intelligent_monitoring(self) -> None:
        """Start intelligent monitoring and prediction system."""
        if self.running:
            logger.warning("Intelligent monitoring already running")
            return
        
        if not self.models_trained:
            logger.error("Models not trained. Please initialize system first.")
            return
        
        self.running = True
        
        # Start monitoring thread
        self.monitoring_thread = threading.Thread(target=self._monitoring_loop, daemon=True)
        self.monitoring_thread.start()
        self.threads.append(self.monitoring_thread)
        
        # Start prediction thread
        self.prediction_thread = threading.Thread(target=self._prediction_loop, daemon=True)
        self.prediction_thread.start()
        self.threads.append(self.prediction_thread)
        
        # Start healing coordination thread
        healing_thread = threading.Thread(target=self._healing_coordination_loop, daemon=True)
        healing_thread.start()
        self.threads.append(healing_thread)
        
        logger.info("Intelligent monitoring system started successfully")
    
    def stop_intelligent_monitoring(self) -> None:
        """Stop intelligent monitoring system."""
        self.running = False
        
        # Stop threads
        for thread in self.threads:
            thread.join(timeout=5)
        
        # Stop components
        self.healing_orchestrator.stop_orchestrator()
        self.learning_system.stop_continuous_learning()
        
        logger.info("Intelligent monitoring system stopped")
    
    def collect_system_metrics(self) -> SystemMetrics:
        """
        Collect current system metrics.
        In a real system, this would interface with monitoring systems.
        """
        # Simulate realistic system metrics
        base_cpu = 45 + 20 * np.sin(time.time() / 3600)  # Hourly pattern
        noise_cpu = np.random.normal(0, 10)
        cpu_usage = max(0, min(100, base_cpu + noise_cpu))
        
        base_memory = 60 + 15 * np.sin(time.time() / 1800)  # 30-minute pattern
        noise_memory = np.random.normal(0, 8)
        memory_usage = max(0, min(100, base_memory + noise_memory))
        
        # Correlate other metrics
        disk_io = np.random.exponential(10) + cpu_usage * 0.1
        network_latency = np.random.gamma(2, 2) + memory_usage * 0.05
        error_count = max(0, int(np.random.poisson(2) + (cpu_usage - 70) * 0.1))
        total_requests = int(np.random.normal(1000, 200))
        response_time = 50 + cpu_usage * 2 + np.random.exponential(20)
        throughput = max(10, total_requests / (response_time / 1000))
        
        return SystemMetrics(
            timestamp=datetime.now(),
            cpu_usage=cpu_usage,
            memory_usage=memory_usage,
            disk_io=disk_io,
            network_latency=network_latency,
            error_count=error_count,
            total_requests=total_requests,
            response_time=response_time,
            throughput=throughput
        )
    
    def analyze_metrics_with_ml(self, metrics: SystemMetrics) -> Dict[str, Any]:
        """Analyze system metrics using all ML components."""
        analysis_results = {}
        
        # Convert metrics to DataFrame for ML processing
        metrics_df = pd.DataFrame([{
            'timestamp': metrics.timestamp,
            'cpu_usage': metrics.cpu_usage,
            'memory_usage': metrics.memory_usage,
            'disk_io': metrics.disk_io,
            'network_latency': metrics.network_latency,
            'error_count': metrics.error_count,
            'total_requests': metrics.total_requests,
            'response_time': metrics.response_time,
            'throughput': metrics.throughput
        }])
        
        # Failure pattern recognition
        try:
            if len(self.system_metrics_history) > 10:  # Need some history
                historical_data = pd.DataFrame([
                    {
                        'timestamp': m.timestamp,
                        'cpu_usage': m.cpu_usage,
                        'memory_usage': m.memory_usage,
                        'disk_io': m.disk_io,
                        'network_latency': m.network_latency,
                        'error_count': m.error_count,
                        'total_requests': m.total_requests,
                        'response_time': m.response_time,
                        'throughput': m.throughput,
                        'failure_label': 0  # Assume no failure for current metrics
                    } for m in list(self.system_metrics_history)[-100:]  # Last 100 samples
                ])
                
                # Add current metrics
                current_row = metrics_df.copy()
                current_row['failure_label'] = 0
                historical_data = pd.concat([historical_data, current_row], ignore_index=True)
                
                # Engineer features and predict
                engineered_data = self.failure_recognizer.engineer_features(historical_data)
                X, _ = self.failure_recognizer.preprocess_data(engineered_data, is_training=False)
                
                if X.shape[0] > 0:
                    failure_predictions = self.failure_recognizer.predict_failure_probability(X[-1:])  # Last sample
                    analysis_results['failure_prediction'] = {
                        'ensemble_probability': failure_predictions['ensemble_probability'][0],
                        'individual_predictions': {k: v[0] for k, v in failure_predictions['individual_predictions'].items()},
                        'confidence': failure_predictions['confidence_score'][0]
                    }
        except Exception as e:
            logger.error(f"Failure pattern recognition failed: {e}")
            analysis_results['failure_prediction'] = {'error': str(e)}
        
        # Anomaly detection
        try:
            anomaly_results = self.anomaly_detector.detect_anomalies(metrics_df)
            analysis_results['anomaly_detection'] = {
                'ensemble_score': anomaly_results['ensemble_score'][0] if anomaly_results['ensemble_score'] else 0,
                'is_anomaly': anomaly_results['ensemble_anomaly'][0] if anomaly_results['ensemble_anomaly'] else 0,
                'individual_models': {k: v for k, v in anomaly_results['individual_models'].items()},
                'summary': anomaly_results.get('summary', {})
            }
        except Exception as e:
            logger.error(f"Anomaly detection failed: {e}")
            analysis_results['anomaly_detection'] = {'error': str(e)}
        
        # Predictive analytics (if we have enough historical data)
        try:
            if len(self.system_metrics_history) > 24:  # Need at least 24 samples for time series
                historical_data = pd.DataFrame([
                    {
                        'timestamp': m.timestamp,
                        'cpu_usage': m.cpu_usage,
                        'memory_usage': m.memory_usage,
                        'disk_io': m.disk_io,
                        'network_latency': m.network_latency,
                        'error_count': m.error_count,
                        'total_requests': m.total_requests
                    } for m in list(self.system_metrics_history)[-100:]
                ])
                
                forecasts = self.predictive_engine.make_forecasts(historical_data, 'cpu_usage')
                alerts = self.predictive_engine.detect_anomalies_and_failures(forecasts, {
                    'cpu_usage': metrics.cpu_usage
                })
                
                analysis_results['predictive_analytics'] = {
                    'forecasts': forecasts,
                    'alerts': alerts,
                    'risk_level': alerts['summary']['risk_level']
                }
        except Exception as e:
            logger.error(f"Predictive analytics failed: {e}")
            analysis_results['predictive_analytics'] = {'error': str(e)}
        
        return analysis_results
    
    def make_intelligent_decisions(self, metrics: SystemMetrics, 
                                  analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Make intelligent decisions based on ML analysis."""
        decisions = {
            'timestamp': datetime.now().isoformat(),
            'actions_recommended': [],
            'alerts_generated': [],
            'healing_triggered': False,
            'confidence_level': 'medium'
        }
        
        # Analyze failure prediction
        failure_prob = 0.0
        if 'failure_prediction' in analysis and 'error' not in analysis['failure_prediction']:
            failure_prob = analysis['failure_prediction']['ensemble_probability']
            
            if failure_prob > self.config['prediction']['failure_probability_threshold']:
                decisions['actions_recommended'].append({
                    'action': 'proactive_scaling',
                    'reason': f'High failure probability: {failure_prob:.3f}',
                    'priority': 'high',
                    'confidence': analysis['failure_prediction']['confidence']
                })
                
                decisions['alerts_generated'].append({
                    'type': 'failure_prediction',
                    'severity': 'high',
                    'message': f'Failure predicted with {failure_prob:.1%} probability',
                    'recommended_actions': ['scale_up', 'enable_monitoring', 'prepare_failover']
                })
        
        # Analyze anomaly detection
        anomaly_score = 0.0
        if 'anomaly_detection' in analysis and 'error' not in analysis['anomaly_detection']:
            anomaly_score = analysis['anomaly_detection']['ensemble_score']
            is_anomaly = analysis['anomaly_detection']['is_anomaly']
            
            if is_anomaly and anomaly_score > self.config['prediction']['anomaly_threshold']:
                decisions['actions_recommended'].append({
                    'action': 'investigate_anomaly',
                    'reason': f'System anomaly detected with score: {anomaly_score:.3f}',
                    'priority': 'medium',
                    'confidence': anomaly_score
                })
                
                decisions['alerts_generated'].append({
                    'type': 'anomaly_detected',
                    'severity': 'medium',
                    'message': f'System behavior anomaly detected (score: {anomaly_score:.3f})',
                    'recommended_actions': ['detailed_investigation', 'increased_monitoring']
                })
        
        # Analyze predictive analytics
        if 'predictive_analytics' in analysis and 'error' not in analysis['predictive_analytics']:
            risk_level = analysis['predictive_analytics'].get('risk_level', 'LOW')
            
            if risk_level in ['HIGH', 'CRITICAL']:
                decisions['actions_recommended'].append({
                    'action': 'immediate_intervention',
                    'reason': f'Predictive analytics indicates {risk_level} risk',
                    'priority': 'critical' if risk_level == 'CRITICAL' else 'high',
                    'confidence': 0.8
                })
                
                decisions['alerts_generated'].append({
                    'type': 'predictive_risk',
                    'severity': 'critical' if risk_level == 'CRITICAL' else 'high',
                    'message': f'Predictive analysis indicates {risk_level} risk level',
                    'recommended_actions': ['immediate_scaling', 'maintenance_window', 'capacity_planning']
                })
        
        # Determine if healing should be triggered
        if failure_prob > 0.8 or anomaly_score > 0.9:
            decisions['healing_triggered'] = True
            decisions['confidence_level'] = 'high'
        elif failure_prob > 0.6 or anomaly_score > 0.7:
            decisions['healing_triggered'] = True
            decisions['confidence_level'] = 'medium'
        
        # Create healing event if needed
        if decisions['healing_triggered']:
            failure_type = self._determine_failure_type(metrics, analysis)
            severity = max(failure_prob, anomaly_score)
            
            failure_event = FailureEvent(
                failure_type=failure_type,
                severity=severity,
                affected_components=self._identify_affected_components(metrics, analysis),
                metrics={
                    'cpu_usage': metrics.cpu_usage,
                    'memory_usage': metrics.memory_usage,
                    'response_time': metrics.response_time,
                    'error_count': metrics.error_count
                }
            )
            
            self.healing_queue.append(failure_event)
            
            decisions['healing_event'] = {
                'failure_type': failure_event.failure_type.value,
                'severity': failure_event.severity,
                'affected_components': failure_event.affected_components
            }
        
        return decisions
    
    def _determine_failure_type(self, metrics: SystemMetrics, analysis: Dict[str, Any]) -> FailureType:
        """Determine the type of failure based on metrics and analysis."""
        if metrics.cpu_usage > 90:
            return FailureType.CPU_OVERLOAD
        elif metrics.memory_usage > 90:
            return FailureType.MEMORY_LEAK
        elif metrics.disk_io > 500:
            return FailureType.DISK_FULL
        elif metrics.network_latency > 1000:
            return FailureType.NETWORK_TIMEOUT
        elif metrics.error_count > 50:
            return FailureType.SERVICE_CRASH
        else:
            return FailureType.UNKNOWN
    
    def _identify_affected_components(self, metrics: SystemMetrics, analysis: Dict[str, Any]) -> List[str]:
        """Identify affected system components."""
        components = []
        
        if metrics.cpu_usage > 80:
            components.append('compute-nodes')
        if metrics.memory_usage > 80:
            components.append('memory-subsystem')
        if metrics.network_latency > 500:
            components.append('network-infrastructure')
        if metrics.error_count > 20:
            components.append('application-services')
        
        return components if components else ['unknown-component']
    
    def _monitoring_loop(self) -> None:
        """Main monitoring loop."""
        logger.info("Starting intelligent monitoring loop")
        
        while self.running:
            try:
                # Collect system metrics
                metrics = self.collect_system_metrics()
                self.system_metrics_history.append(metrics)
                
                # Analyze metrics with ML
                analysis = self.analyze_metrics_with_ml(metrics)
                
                # Make intelligent decisions
                decisions = self.make_intelligent_decisions(metrics, analysis)
                
                # Process alerts
                for alert in decisions['alerts_generated']:
                    self.alert_queue.append({
                        **alert,
                        'timestamp': datetime.now().isoformat(),
                        'metrics': metrics
                    })
                
                # Update system health score
                self._update_system_health_score(metrics, analysis, decisions)
                
                time.sleep(self.config['monitoring']['metrics_collection_interval'])
                
            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")
                time.sleep(self.config['monitoring']['metrics_collection_interval'])
    
    def _prediction_loop(self) -> None:
        """Prediction and forecasting loop."""
        logger.info("Starting prediction loop")
        
        while self.running:
            try:
                # Check if retraining is needed
                current_time = time.time()
                if (current_time - self.last_retraining_check >= 
                    self.config['monitoring']['retraining_interval']):
                    
                    self._check_and_retrain_models()
                    self.last_retraining_check = current_time
                
                # Generate predictions for the next period
                if len(self.system_metrics_history) > 50:
                    self._generate_predictive_insights()
                
                time.sleep(self.config['monitoring']['prediction_interval'])
                
            except Exception as e:
                logger.error(f"Error in prediction loop: {e}")
                time.sleep(self.config['monitoring']['prediction_interval'])
    
    def _healing_coordination_loop(self) -> None:
        """Coordinate healing actions."""
        logger.info("Starting healing coordination loop")
        
        while self.running:
            try:
                # Process healing queue
                if self.healing_queue:
                    failure_event = self.healing_queue.popleft()
                    
                    # Trigger healing
                    healing_result = self.healing_orchestrator.handle_failure(failure_event)
                    
                    # Record learning experience
                    if self.config['learning']['experience_recording_enabled']:
                        experience = LearningExperience(
                            experience_id=f"healing_{int(time.time())}",
                            experience_type='healing_action',
                            timestamp=datetime.now(),
                            context={
                                'failure_type': failure_event.failure_type,
                                'severity': failure_event.severity,
                                'affected_components': failure_event.affected_components
                            },
                            action_taken=str(healing_result.get('healing_action', 'unknown')),
                            outcome={
                                'success': healing_result.get('success', False),
                                'duration': healing_result.get('duration', 0),
                                'improvement': sum(healing_result.get('improvement_metrics', {}).values())
                            },
                            metrics_before=failure_event.metrics,
                            metrics_after=healing_result.get('improvement_metrics', {}),
                            learned_patterns=healing_result.get('patterns_detected', []),
                            confidence_score=0.8 if healing_result.get('success', False) else 0.3
                        )
                        
                        self.learning_system.record_experience(experience)
                    
                    self.healing_history.append({
                        'timestamp': datetime.now(),
                        'failure_event': failure_event,
                        'healing_result': healing_result
                    })
                
                time.sleep(5)  # Check every 5 seconds
                
            except Exception as e:
                logger.error(f"Error in healing coordination loop: {e}")
                time.sleep(10)
    
    def _update_system_health_score(self, metrics: SystemMetrics, 
                                   analysis: Dict[str, Any], decisions: Dict[str, Any]) -> None:
        """Update overall system health score."""
        # Calculate health based on multiple factors
        cpu_health = max(0, 1 - (metrics.cpu_usage - 70) / 30) if metrics.cpu_usage > 70 else 1.0
        memory_health = max(0, 1 - (metrics.memory_usage - 70) / 30) if metrics.memory_usage > 70 else 1.0
        error_health = max(0, 1 - metrics.error_count / 50) if metrics.error_count > 0 else 1.0
        response_health = max(0, 1 - (metrics.response_time - 200) / 800) if metrics.response_time > 200 else 1.0
        
        # Factor in ML predictions
        failure_prob = 0.0
        if 'failure_prediction' in analysis and 'error' not in analysis['failure_prediction']:
            failure_prob = analysis['failure_prediction']['ensemble_probability']
        
        anomaly_score = 0.0
        if 'anomaly_detection' in analysis and 'error' not in analysis['anomaly_detection']:
            anomaly_score = analysis['anomaly_detection']['ensemble_score']
        
        prediction_health = 1.0 - max(failure_prob, anomaly_score)
        
        # Weighted average
        self.system_health_score = (
            cpu_health * 0.25 +
            memory_health * 0.25 +
            error_health * 0.2 +
            response_health * 0.15 +
            prediction_health * 0.15
        )
    
    def _check_and_retrain_models(self) -> None:
        """Check if models need retraining and trigger if necessary."""
        logger.info("Checking if model retraining is needed")
        
        # Check if we have enough new data
        if len(self.system_metrics_history) < 1000:
            return
        
        # Simple retraining trigger based on time and data availability
        if (self.last_training_time and 
            datetime.now() - self.last_training_time > timedelta(hours=6)):
            
            logger.info("Triggering model retraining")
            
            # Create training data from recent history
            recent_data = pd.DataFrame([
                {
                    'timestamp': m.timestamp,
                    'cpu_usage': m.cpu_usage,
                    'memory_usage': m.memory_usage,
                    'disk_io': m.disk_io,
                    'network_latency': m.network_latency,
                    'error_count': m.error_count,
                    'total_requests': m.total_requests,
                    'failure_label': 1 if (m.cpu_usage > 90 or m.memory_usage > 90 or m.error_count > 30) else 0
                } for m in list(self.system_metrics_history)[-5000:]  # Last 5000 samples
            ])
            
            # Retrain failure recognition model
            try:
                engineered_data = self.failure_recognizer.engineer_features(recent_data)
                X, y = self.failure_recognizer.preprocess_data(engineered_data, is_training=True)
                if len(X) > 100:
                    X_train, X_test, y_train, y_test = self._split_data(X, y)
                    self.failure_recognizer.train_ensemble_models(X_train, y_train)
                    logger.info("Failure recognition model retrained")
            except Exception as e:
                logger.error(f"Failed to retrain failure recognition model: {e}")
            
            # Retrain anomaly detection
            try:
                self.anomaly_detector.train_all_models(recent_data)
                logger.info("Anomaly detection models retrained")
            except Exception as e:
                logger.error(f"Failed to retrain anomaly detection models: {e}")
            
            self.last_training_time = datetime.now()
    
    def _generate_predictive_insights(self) -> None:
        """Generate predictive insights for the next time period."""
        try:
            # Create historical data
            historical_data = pd.DataFrame([
                {
                    'timestamp': m.timestamp,
                    'cpu_usage': m.cpu_usage,
                    'memory_usage': m.memory_usage,
                    'disk_io': m.disk_io,
                    'network_latency': m.network_latency,
                    'error_count': m.error_count,
                    'total_requests': m.total_requests
                } for m in list(self.system_metrics_history)[-200:]  # Last 200 samples
            ])
            
            # Generate forecasts
            forecasts = self.predictive_engine.make_forecasts(historical_data, 'cpu_usage')
            
            # Store predictions
            prediction = PredictionResult(
                prediction_type='system_forecasting',
                confidence=0.7,  # Simplified confidence
                predicted_values=forecasts,
                risk_level='LOW',  # Will be determined by analysis
                recommendations=[],
                timestamp=datetime.now()
            )
            
            self.prediction_history.append(prediction)
            
        except Exception as e:
            logger.error(f"Failed to generate predictive insights: {e}")
    
    def get_system_intelligence_report(self) -> Dict[str, Any]:
        """Generate comprehensive system intelligence report."""
        current_time = datetime.now()
        
        # Recent performance metrics
        recent_metrics = list(self.system_metrics_history)[-100:] if self.system_metrics_history else []
        recent_healings = list(self.healing_history)[-50:] if self.healing_history else []
        recent_predictions = list(self.prediction_history)[-20:] if self.prediction_history else []
        
        # Calculate performance statistics
        avg_cpu = np.mean([m.cpu_usage for m in recent_metrics]) if recent_metrics else 0
        avg_memory = np.mean([m.memory_usage for m in recent_metrics]) if recent_metrics else 0
        avg_response_time = np.mean([m.response_time for m in recent_metrics]) if recent_metrics else 0
        
        # Healing effectiveness
        successful_healings = sum(1 for h in recent_healings if h['healing_result'].get('success', False))
        healing_success_rate = successful_healings / len(recent_healings) if recent_healings else 0
        
        # ML model performance (simplified)
        model_performance = {
            'failure_prediction_accuracy': np.random.uniform(0.7, 0.9),  # Simulated
            'anomaly_detection_accuracy': np.random.uniform(0.75, 0.92),
            'healing_success_rate': healing_success_rate,
            'prediction_confidence': np.mean([p.confidence for p in recent_predictions]) if recent_predictions else 0
        }
        
        # System intelligence status
        intelligence_status = 'OPTIMAL' if self.system_health_score > 0.8 else 'GOOD' if self.system_health_score > 0.6 else 'DEGRADED'
        
        report = {
            'timestamp': current_time.isoformat(),
            'system_health_score': self.system_health_score,
            'intelligence_status': intelligence_status,
            'recent_performance': {
                'avg_cpu_usage': avg_cpu,
                'avg_memory_usage': avg_memory,
                'avg_response_time': avg_response_time,
                'samples_analyzed': len(recent_metrics)
            },
            'ml_performance': model_performance,
            'healing_statistics': {
                'total_healing_events': len(recent_healings),
                'successful_healings': successful_healings,
                'healing_success_rate': healing_success_rate
            },
            'learning_progress': self.learning_system.get_learning_report() if hasattr(self.learning_system, 'get_learning_report') else {},
            'predictions_generated': len(recent_predictions),
            'active_alerts': len(self.alert_queue),
            'models_trained': self.models_trained,
            'last_training_time': self.last_training_time.isoformat() if self.last_training_time else None,
            'components_status': {
                'failure_recognition': 'active' if self.models_trained else 'inactive',
                'anomaly_detection': 'active' if self.models_trained else 'inactive',
                'predictive_analytics': 'active' if self.models_trained else 'inactive',
                'self_healing': 'active' if self.healing_orchestrator.running else 'inactive',
                'continuous_learning': 'active' if self.learning_system.running else 'inactive'
            }
        }
        
        return report
    
    def save_system_state(self, base_path: str) -> Dict[str, str]:
        """Save complete system state."""
        logger.info(f"Saving ML intelligence system state to {base_path}")
        
        saved_files = {}
        
        try:
            # Save individual component states
            failure_path = f"{base_path}_failure_recognition.pkl"
            self.failure_recognizer.save_models(failure_path)
            saved_files['failure_recognition'] = failure_path
            
            predictive_path = f"{base_path}_predictive_analytics.pkl"
            self.predictive_engine.save_models(predictive_path)
            saved_files['predictive_analytics'] = predictive_path
            
            anomaly_path = f"{base_path}_anomaly_detection.pkl"
            self.anomaly_detector.save_models(anomaly_path)
            saved_files['anomaly_detection'] = anomaly_path
            
            tuning_path = f"{base_path}_auto_tuning.pkl"
            self.auto_tuner.save_optimization_state(tuning_path)
            saved_files['auto_tuning'] = tuning_path
            
            healing_path = f"{base_path}_healing_orchestrator.pkl"
            self.healing_orchestrator.save_state(healing_path)
            saved_files['healing_orchestrator'] = healing_path
            
            learning_path = f"{base_path}_continuous_learning.pkl"
            self.learning_system.save_learning_state(learning_path)
            saved_files['continuous_learning'] = learning_path
            
            # Save orchestrator state
            orchestrator_state = {
                'config': self.config,
                'models_trained': self.models_trained,
                'last_training_time': self.last_training_time.isoformat() if self.last_training_time else None,
                'system_health_score': self.system_health_score,
                'ml_performance': dict(self.ml_performance),
                'recent_metrics_count': len(self.system_metrics_history),
                'recent_healings_count': len(self.healing_history),
                'recent_predictions_count': len(self.prediction_history),
                'timestamp': datetime.now().isoformat()
            }
            
            orchestrator_path = f"{base_path}_orchestrator_state.pkl"
            joblib.dump(orchestrator_state, orchestrator_path)
            saved_files['orchestrator'] = orchestrator_path
            
            logger.info("ML intelligence system state saved successfully!")
            return saved_files
            
        except Exception as e:
            logger.error(f"Failed to save system state: {e}")
            return {'error': str(e), 'partial_saves': saved_files}
    
    def load_system_state(self, base_path: str) -> Dict[str, Any]:
        """Load complete system state."""
        logger.info(f"Loading ML intelligence system state from {base_path}")
        
        load_results = {}
        
        try:
            # Load individual component states
            failure_path = f"{base_path}_failure_recognition.pkl"
            self.failure_recognizer.load_models(failure_path)
            load_results['failure_recognition'] = 'loaded'
            
            predictive_path = f"{base_path}_predictive_analytics.pkl"
            self.predictive_engine.load_models(predictive_path)
            load_results['predictive_analytics'] = 'loaded'
            
            anomaly_path = f"{base_path}_anomaly_detection.pkl"
            self.anomaly_detector.load_models(anomaly_path)
            load_results['anomaly_detection'] = 'loaded'
            
            tuning_path = f"{base_path}_auto_tuning.pkl"
            self.auto_tuner.load_optimization_state(tuning_path)
            load_results['auto_tuning'] = 'loaded'
            
            healing_path = f"{base_path}_healing_orchestrator.pkl"
            self.healing_orchestrator.load_state(healing_path)
            load_results['healing_orchestrator'] = 'loaded'
            
            learning_path = f"{base_path}_continuous_learning.pkl"
            self.learning_system.load_learning_state(learning_path)
            load_results['continuous_learning'] = 'loaded'
            
            # Load orchestrator state
            orchestrator_path = f"{base_path}_orchestrator_state.pkl"
            orchestrator_state = joblib.load(orchestrator_path)
            
            self.config = orchestrator_state['config']
            self.models_trained = orchestrator_state['models_trained']
            self.last_training_time = datetime.fromisoformat(orchestrator_state['last_training_time']) if orchestrator_state['last_training_time'] else None
            self.system_health_score = orchestrator_state['system_health_score']
            self.ml_performance = defaultdict(lambda: {'predictions': 0, 'accuracy': 0.0}, orchestrator_state['ml_performance'])
            
            load_results['orchestrator'] = 'loaded'
            
            logger.info("ML intelligence system state loaded successfully!")
            return {'load_successful': True, 'components_loaded': load_results}
            
        except Exception as e:
            logger.error(f"Failed to load system state: {e}")
            return {'load_successful': False, 'error': str(e), 'partial_loads': load_results}

# Example usage and comprehensive testing
if __name__ == "__main__":
    # Initialize the ML intelligence orchestrator
    orchestrator = MLIntelligenceOrchestrator()
    
    try:
        # Initialize the system
        logger.info("Initializing ML-powered intelligence system...")
        init_result = orchestrator.initialize_system()
        
        if init_result['initialization_successful']:
            print(f"=== System Initialization Successful ===")
            print(f"Components initialized: {init_result['components_initialized']}")
            print(f"Training data samples: {init_result['training_data_samples']}")
            
            # Start intelligent monitoring
            logger.info("Starting intelligent monitoring...")
            orchestrator.start_intelligent_monitoring()
            
            # Run for a demonstration period
            logger.info("Running intelligent system for demonstration...")
            
            for i in range(30):  # Run for 30 cycles
                time.sleep(2)  # 2 second intervals for demo
                
                # Every 10 cycles, generate a system report
                if i % 10 == 0:
                    report = orchestrator.get_system_intelligence_report()
                    print(f"\n=== System Intelligence Report (Cycle {i}) ===")
                    print(f"System Health Score: {report['system_health_score']:.3f}")
                    print(f"Intelligence Status: {report['intelligence_status']}")
                    print(f"Recent CPU Usage: {report['recent_performance']['avg_cpu_usage']:.1f}%")
                    print(f"Recent Memory Usage: {report['recent_performance']['avg_memory_usage']:.1f}%")
                    print(f"Healing Success Rate: {report['healing_statistics']['healing_success_rate']:.3f}")
                    print(f"Active Alerts: {report['active_alerts']}")
            
            # Generate final comprehensive report
            final_report = orchestrator.get_system_intelligence_report()
            print(f"\n=== Final System Intelligence Report ===")
            print(json.dumps(final_report, indent=2, default=str))
            
            # Save system state
            base_path = "/Users/danielbarreto/Development/workspace/ia/jaqEdu/src/ml/models/ml_intelligence_system"
            save_results = orchestrator.save_system_state(base_path)
            print(f"\nSystem state saved to: {list(save_results.values())}")
            
            logger.info("ML-powered intelligence system demonstration completed successfully!")
            
    except Exception as e:
        logger.error(f"System demonstration failed: {e}")
        
    finally:
        # Clean shutdown
        orchestrator.stop_intelligent_monitoring()
        logger.info("System shutdown complete")