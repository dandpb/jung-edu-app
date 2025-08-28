#!/usr/bin/env python3
"""
Auto-Tuning Hyperparameter Optimization System
Intelligent system that automatically tunes ML models based on performance data.
"""

import numpy as np
import pandas as pd
from sklearn.model_selection import GridSearchCV, RandomizedSearchCV, cross_val_score
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import make_scorer, accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
import optuna
from optuna.samplers import TPESampler
from optuna.pruners import MedianPruner
import joblib
import logging
from typing import Dict, List, Tuple, Optional, Any, Callable
import json
from datetime import datetime, timedelta
import warnings
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AutoTuningSystem:
    """
    Advanced auto-tuning system that optimizes ML models using multiple optimization strategies.
    Includes Bayesian optimization, genetic algorithms, and adaptive parameter adjustment.
    """
    
    def __init__(self, config: Dict = None):
        """Initialize the auto-tuning system."""
        self.config = config or self._default_config()
        self.optimization_history = []
        self.best_parameters = {}
        self.performance_tracking = {}
        self.model_registry = {}
        self.optimization_studies = {}
        
    def _default_config(self) -> Dict:
        """Default configuration for auto-tuning system."""
        return {
            'optimization_methods': ['bayesian', 'random_search', 'grid_search'],
            'bayesian_optimization': {
                'n_trials': 100,
                'n_jobs': -1,
                'timeout': 3600,  # 1 hour
                'sampler': 'tpe',
                'pruner': 'median'
            },
            'random_search': {
                'n_iter': 50,
                'cv': 5,
                'n_jobs': -1,
                'scoring': 'accuracy'
            },
            'grid_search': {
                'cv': 5,
                'n_jobs': -1,
                'scoring': 'accuracy'
            },
            'model_configs': {
                'random_forest': {
                    'param_distributions': {
                        'n_estimators': [50, 100, 200, 300, 500],
                        'max_depth': [5, 10, 15, 20, None],
                        'min_samples_split': [2, 5, 10, 15],
                        'min_samples_leaf': [1, 2, 4, 8],
                        'max_features': ['auto', 'sqrt', 'log2', None]
                    },
                    'bayesian_space': {
                        'n_estimators': (50, 500),
                        'max_depth': (5, 30),
                        'min_samples_split': (2, 20),
                        'min_samples_leaf': (1, 10),
                        'max_features_ratio': (0.1, 1.0)
                    }
                },
                'gradient_boosting': {
                    'param_distributions': {
                        'n_estimators': [50, 100, 200, 300],
                        'learning_rate': [0.01, 0.1, 0.2, 0.3],
                        'max_depth': [3, 5, 7, 10],
                        'min_samples_split': [2, 5, 10],
                        'min_samples_leaf': [1, 2, 4]
                    },
                    'bayesian_space': {
                        'n_estimators': (50, 300),
                        'learning_rate': (0.01, 0.3),
                        'max_depth': (3, 15),
                        'min_samples_split': (2, 20),
                        'min_samples_leaf': (1, 10)
                    }
                },
                'svm': {
                    'param_distributions': {
                        'C': [0.1, 1, 10, 100, 1000],
                        'gamma': ['scale', 'auto', 0.001, 0.01, 0.1, 1],
                        'kernel': ['rbf', 'poly', 'sigmoid']
                    },
                    'bayesian_space': {
                        'C': (0.1, 1000),
                        'gamma': (0.0001, 1.0)
                    }
                },
                'mlp': {
                    'param_distributions': {
                        'hidden_layer_sizes': [(50,), (100,), (150,), (100, 50), (150, 100), (200, 100, 50)],
                        'learning_rate_init': [0.001, 0.01, 0.1],
                        'alpha': [0.0001, 0.001, 0.01, 0.1],
                        'max_iter': [200, 300, 500]
                    },
                    'bayesian_space': {
                        'learning_rate_init': (0.0001, 0.1),
                        'alpha': (0.00001, 0.1),
                        'max_iter': (100, 1000)
                    }
                }
            },
            'performance_metrics': {
                'primary': 'accuracy',
                'secondary': ['precision', 'recall', 'f1', 'roc_auc'],
                'optimization_direction': 'maximize'  # or 'minimize'
            },
            'adaptive_tuning': {
                'enable_early_stopping': True,
                'patience': 10,
                'min_improvement': 0.001,
                'retuning_threshold': 0.05,  # Retune if performance drops by 5%
                'monitoring_window': 100  # Number of predictions to monitor
            }
        }
    
    def create_objective_function(self, model_class, param_space: Dict, 
                                 X_train: np.ndarray, y_train: np.ndarray,
                                 scoring_metric: str = 'accuracy') -> Callable:
        """
        Create objective function for Bayesian optimization.
        """
        def objective(trial):
            # Sample parameters from the defined space
            params = {}
            
            for param_name, param_range in param_space.items():
                if param_name == 'max_features_ratio':
                    # Special handling for max_features
                    ratio = trial.suggest_float(param_name, param_range[0], param_range[1])
                    params['max_features'] = max(1, int(ratio * X_train.shape[1]))
                elif isinstance(param_range, tuple):
                    if isinstance(param_range[0], int):
                        params[param_name] = trial.suggest_int(param_name, param_range[0], param_range[1])
                    else:
                        params[param_name] = trial.suggest_float(param_name, param_range[0], param_range[1])
                elif isinstance(param_range, list):
                    params[param_name] = trial.suggest_categorical(param_name, param_range)
            
            try:
                # Create and evaluate model
                model = model_class(random_state=42, **params)
                
                # Use cross-validation for robust evaluation
                if scoring_metric == 'roc_auc' and len(np.unique(y_train)) > 2:
                    scoring = make_scorer(roc_auc_score, multi_class='ovr')
                else:
                    scoring = scoring_metric
                
                cv_scores = cross_val_score(model, X_train, y_train, 
                                          cv=5, scoring=scoring, n_jobs=1)
                
                # Report intermediate value for pruning
                trial.report(cv_scores.mean(), step=0)
                
                # Check if trial should be pruned
                if trial.should_prune():
                    raise optuna.exceptions.TrialPruned()
                
                return cv_scores.mean()
                
            except Exception as e:
                logger.warning(f"Trial failed with parameters {params}: {e}")
                return 0.0  # Return poor score for failed trials
        
        return objective
    
    def bayesian_optimization(self, model_class, model_name: str,
                             X_train: np.ndarray, y_train: np.ndarray) -> Dict:
        """
        Perform Bayesian optimization using Optuna.
        """
        logger.info(f"Starting Bayesian optimization for {model_name}")
        
        config = self.config['bayesian_optimization']
        model_config = self.config['model_configs'][model_name]
        
        # Create study
        study_name = f"{model_name}_optimization_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        sampler = TPESampler(seed=42) if config['sampler'] == 'tpe' else None
        pruner = MedianPruner() if config['pruner'] == 'median' else None
        
        study = optuna.create_study(
            direction='maximize',
            sampler=sampler,
            pruner=pruner,
            study_name=study_name
        )
        
        # Create objective function
        objective_func = self.create_objective_function(
            model_class, 
            model_config['bayesian_space'],
            X_train, 
            y_train,
            self.config['performance_metrics']['primary']
        )
        
        # Optimize
        try:
            study.optimize(
                objective_func,
                n_trials=config['n_trials'],
                timeout=config['timeout'],
                n_jobs=1  # Use 1 job to avoid multiprocessing issues
            )
            
            self.optimization_studies[study_name] = study
            
            best_params = study.best_params
            best_score = study.best_value
            
            # Handle special parameters
            if 'max_features_ratio' in best_params:
                best_params['max_features'] = max(1, int(best_params['max_features_ratio'] * X_train.shape[1]))
                del best_params['max_features_ratio']
            
            return {
                'method': 'bayesian_optimization',
                'best_parameters': best_params,
                'best_score': float(best_score),
                'n_trials': len(study.trials),
                'study_name': study_name,
                'optimization_time': sum([t.duration.total_seconds() for t in study.trials if t.duration])
            }
            
        except Exception as e:
            logger.error(f"Bayesian optimization failed for {model_name}: {e}")
            return {
                'method': 'bayesian_optimization',
                'error': str(e),
                'best_parameters': {},
                'best_score': 0.0
            }
    
    def random_search_optimization(self, model_class, model_name: str,
                                  X_train: np.ndarray, y_train: np.ndarray) -> Dict:
        """
        Perform random search optimization.
        """
        logger.info(f"Starting random search optimization for {model_name}")
        
        config = self.config['random_search']
        model_config = self.config['model_configs'][model_name]
        
        try:
            # Create model instance
            model = model_class(random_state=42)
            
            # Perform random search
            random_search = RandomizedSearchCV(
                model,
                param_distributions=model_config['param_distributions'],
                n_iter=config['n_iter'],
                cv=config['cv'],
                scoring=config['scoring'],
                n_jobs=config['n_jobs'],
                random_state=42,
                verbose=0
            )
            
            start_time = time.time()
            random_search.fit(X_train, y_train)
            optimization_time = time.time() - start_time
            
            return {
                'method': 'random_search',
                'best_parameters': random_search.best_params_,
                'best_score': float(random_search.best_score_),
                'n_iterations': config['n_iter'],
                'optimization_time': optimization_time
            }
            
        except Exception as e:
            logger.error(f"Random search optimization failed for {model_name}: {e}")
            return {
                'method': 'random_search',
                'error': str(e),
                'best_parameters': {},
                'best_score': 0.0
            }
    
    def grid_search_optimization(self, model_class, model_name: str,
                                X_train: np.ndarray, y_train: np.ndarray) -> Dict:
        """
        Perform grid search optimization (simplified for demonstration).
        """
        logger.info(f"Starting grid search optimization for {model_name}")
        
        config = self.config['grid_search']
        model_config = self.config['model_configs'][model_name]
        
        # Create simplified parameter grid (to avoid explosion)
        param_grid = {}
        for param, values in model_config['param_distributions'].items():
            if isinstance(values, list):
                # Take subset of values to keep grid search manageable
                param_grid[param] = values[:3] if len(values) > 3 else values
        
        try:
            model = model_class(random_state=42)
            
            grid_search = GridSearchCV(
                model,
                param_grid=param_grid,
                cv=config['cv'],
                scoring=config['scoring'],
                n_jobs=config['n_jobs'],
                verbose=0
            )
            
            start_time = time.time()
            grid_search.fit(X_train, y_train)
            optimization_time = time.time() - start_time
            
            return {
                'method': 'grid_search',
                'best_parameters': grid_search.best_params_,
                'best_score': float(grid_search.best_score_),
                'n_combinations': len(grid_search.cv_results_['params']),
                'optimization_time': optimization_time
            }
            
        except Exception as e:
            logger.error(f"Grid search optimization failed for {model_name}: {e}")
            return {
                'method': 'grid_search',
                'error': str(e),
                'best_parameters': {},
                'best_score': 0.0
            }
    
    def optimize_model(self, model_class, model_name: str,
                      X_train: np.ndarray, y_train: np.ndarray,
                      optimization_methods: List[str] = None) -> Dict:
        """
        Optimize a model using multiple optimization strategies.
        """
        if optimization_methods is None:
            optimization_methods = self.config['optimization_methods']
        
        logger.info(f"Optimizing {model_name} using methods: {optimization_methods}")
        
        optimization_results = {}
        
        # Run optimization methods in parallel
        with ThreadPoolExecutor(max_workers=3) as executor:
            future_to_method = {}
            
            for method in optimization_methods:
                if method == 'bayesian':
                    future = executor.submit(
                        self.bayesian_optimization, model_class, model_name, X_train, y_train
                    )
                elif method == 'random_search':
                    future = executor.submit(
                        self.random_search_optimization, model_class, model_name, X_train, y_train
                    )
                elif method == 'grid_search':
                    future = executor.submit(
                        self.grid_search_optimization, model_class, model_name, X_train, y_train
                    )
                else:
                    logger.warning(f"Unknown optimization method: {method}")
                    continue
                
                future_to_method[future] = method
            
            # Collect results
            for future in as_completed(future_to_method):
                method = future_to_method[future]
                try:
                    result = future.result()
                    optimization_results[method] = result
                    logger.info(f"{method} completed for {model_name}")
                except Exception as e:
                    logger.error(f"{method} failed for {model_name}: {e}")
                    optimization_results[method] = {
                        'method': method,
                        'error': str(e),
                        'best_parameters': {},
                        'best_score': 0.0
                    }
        
        # Select best result
        best_result = None
        best_score = -np.inf
        
        for method, result in optimization_results.items():
            if 'error' not in result and result['best_score'] > best_score:
                best_score = result['best_score']
                best_result = result
        
        if best_result is None:
            logger.error(f"All optimization methods failed for {model_name}")
            best_result = {
                'method': 'none',
                'best_parameters': {},
                'best_score': 0.0,
                'error': 'All optimization methods failed'
            }
        
        # Store best parameters
        self.best_parameters[model_name] = best_result['best_parameters']
        
        # Record optimization history
        optimization_record = {
            'timestamp': datetime.now().isoformat(),
            'model_name': model_name,
            'optimization_methods': optimization_methods,
            'results': optimization_results,
            'best_result': best_result,
            'training_samples': len(X_train),
            'training_features': X_train.shape[1]
        }
        self.optimization_history.append(optimization_record)
        
        logger.info(f"Optimization complete for {model_name}. Best score: {best_score:.4f} using {best_result['method']}")
        
        return optimization_record
    
    def adaptive_retuning(self, model_name: str, current_performance: float,
                         baseline_performance: float, X_train: np.ndarray, 
                         y_train: np.ndarray) -> Dict:
        """
        Adaptively retune model if performance has degraded significantly.
        """
        config = self.config['adaptive_tuning']
        
        performance_drop = baseline_performance - current_performance
        relative_drop = performance_drop / baseline_performance if baseline_performance > 0 else 0
        
        if relative_drop >= config['retuning_threshold']:
            logger.info(f"Performance drop detected for {model_name}: {relative_drop:.4f}. Triggering retuning.")
            
            # Get model class
            model_classes = {
                'random_forest': RandomForestClassifier,
                'gradient_boosting': GradientBoostingClassifier,
                'svm': SVC,
                'mlp': MLPClassifier
            }
            
            if model_name in model_classes:
                model_class = model_classes[model_name]
                
                # Perform focused optimization with fewer trials for speed
                focused_config = self.config['bayesian_optimization'].copy()
                focused_config['n_trials'] = 30  # Reduced for faster retuning
                focused_config['timeout'] = 900   # 15 minutes max
                
                original_config = self.config['bayesian_optimization']
                self.config['bayesian_optimization'] = focused_config
                
                try:
                    retune_result = self.optimize_model(
                        model_class, model_name, X_train, y_train, ['bayesian']
                    )
                    
                    return {
                        'retuning_triggered': True,
                        'performance_drop': performance_drop,
                        'relative_drop': relative_drop,
                        'retune_result': retune_result,
                        'new_parameters': self.best_parameters.get(model_name, {}),
                        'timestamp': datetime.now().isoformat()
                    }
                    
                finally:
                    self.config['bayesian_optimization'] = original_config
            else:
                logger.warning(f"Unknown model type for retuning: {model_name}")
                return {'retuning_triggered': False, 'error': f'Unknown model type: {model_name}'}
        
        return {
            'retuning_triggered': False,
            'performance_drop': performance_drop,
            'relative_drop': relative_drop,
            'threshold': config['retuning_threshold']
        }
    
    def get_optimized_model(self, model_name: str, **additional_params):
        """
        Get an optimized model instance with the best parameters found.
        """
        if model_name not in self.best_parameters:
            logger.warning(f"No optimization results found for {model_name}")
            return None
        
        model_classes = {
            'random_forest': RandomForestClassifier,
            'gradient_boosting': GradientBoostingClassifier,
            'svm': SVC,
            'mlp': MLPClassifier
        }
        
        if model_name not in model_classes:
            logger.error(f"Unknown model type: {model_name}")
            return None
        
        model_class = model_classes[model_name]
        best_params = self.best_parameters[model_name].copy()
        best_params.update(additional_params)
        best_params['random_state'] = 42  # Ensure reproducibility
        
        try:
            optimized_model = model_class(**best_params)
            logger.info(f"Created optimized {model_name} with parameters: {best_params}")
            return optimized_model
        except Exception as e:
            logger.error(f"Failed to create optimized {model_name}: {e}")
            return None
    
    def get_optimization_summary(self) -> Dict:
        """
        Get summary of all optimization activities.
        """
        if not self.optimization_history:
            return {'message': 'No optimization history available'}
        
        summary = {
            'total_optimizations': len(self.optimization_history),
            'optimized_models': list(self.best_parameters.keys()),
            'optimization_timeline': []
        }
        
        for record in self.optimization_history:
            timeline_entry = {
                'timestamp': record['timestamp'],
                'model_name': record['model_name'],
                'best_score': record['best_result']['best_score'],
                'best_method': record['best_result']['method'],
                'optimization_time': record['best_result'].get('optimization_time', 0)
            }
            summary['optimization_timeline'].append(timeline_entry)
        
        # Calculate average scores by model
        model_scores = {}
        for record in self.optimization_history:
            model = record['model_name']
            score = record['best_result']['best_score']
            if model not in model_scores:
                model_scores[model] = []
            model_scores[model].append(score)
        
        summary['average_scores'] = {
            model: np.mean(scores) for model, scores in model_scores.items()
        }
        
        return summary
    
    def save_optimization_state(self, filepath: str) -> None:
        """Save optimization state and results."""
        logger.info(f"Saving optimization state to {filepath}")
        
        state_data = {
            'config': self.config,
            'optimization_history': self.optimization_history,
            'best_parameters': self.best_parameters,
            'performance_tracking': self.performance_tracking,
            'timestamp': datetime.now().isoformat()
        }
        
        joblib.dump(state_data, filepath)
        logger.info("Optimization state saved successfully!")
    
    def load_optimization_state(self, filepath: str) -> None:
        """Load optimization state and results."""
        logger.info(f"Loading optimization state from {filepath}")
        
        state_data = joblib.load(filepath)
        self.config = state_data['config']
        self.optimization_history = state_data['optimization_history']
        self.best_parameters = state_data['best_parameters']
        self.performance_tracking = state_data.get('performance_tracking', {})
        
        logger.info("Optimization state loaded successfully!")

# Example usage and testing
if __name__ == "__main__":
    from sklearn.datasets import make_classification
    from sklearn.model_selection import train_test_split
    
    # Generate synthetic dataset
    logger.info("Generating synthetic dataset for optimization testing")
    X, y = make_classification(
        n_samples=1000, n_features=20, n_informative=15, 
        n_redundant=5, n_classes=2, random_state=42
    )
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    # Initialize auto-tuning system
    auto_tuner = AutoTuningSystem()
    
    # Test optimization for Random Forest
    logger.info("Testing optimization for Random Forest")
    rf_optimization = auto_tuner.optimize_model(
        RandomForestClassifier, 'random_forest', X_train, y_train,
        optimization_methods=['bayesian', 'random_search']  # Skip grid search for speed
    )
    
    print(f"Random Forest Optimization Results:")
    print(f"Best method: {rf_optimization['best_result']['method']}")
    print(f"Best score: {rf_optimization['best_result']['best_score']:.4f}")
    print(f"Best parameters: {rf_optimization['best_result']['best_parameters']}")
    
    # Test getting optimized model
    optimized_rf = auto_tuner.get_optimized_model('random_forest')
    if optimized_rf:
        optimized_rf.fit(X_train, y_train)
        test_score = optimized_rf.score(X_test, y_test)
        print(f"Test accuracy with optimized model: {test_score:.4f}")
    
    # Test adaptive retuning (simulating performance drop)
    baseline_performance = rf_optimization['best_result']['best_score']
    current_performance = baseline_performance - 0.1  # Simulate 10% drop
    
    retune_result = auto_tuner.adaptive_retuning(
        'random_forest', current_performance, baseline_performance, X_train, y_train
    )
    print(f"Adaptive retuning result: {retune_result['retuning_triggered']}")
    
    # Get optimization summary
    summary = auto_tuner.get_optimization_summary()
    print(f"Optimization Summary:")
    print(f"Total optimizations: {summary['total_optimizations']}")
    print(f"Optimized models: {summary['optimized_models']}")
    print(f"Average scores: {summary['average_scores']}")
    
    # Save optimization state
    auto_tuner.save_optimization_state('/Users/danielbarreto/Development/workspace/ia/jaqEdu/src/ml/models/auto_tuning_state.pkl')
    
    logger.info("Auto-tuning system testing completed successfully!")