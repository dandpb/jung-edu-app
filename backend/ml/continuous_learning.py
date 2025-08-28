#!/usr/bin/env python3
"""
Continuous Learning System for ML-Powered Self-Healing Intelligence
System that continuously learns and improves from each failure and success.
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
from abc import ABC, abstractmethod
import sqlite3
import hashlib

warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class LearningExperience:
    """Represents a learning experience from system operations."""
    experience_id: str
    experience_type: str  # 'failure', 'success', 'pattern', 'optimization'
    timestamp: datetime
    context: Dict[str, Any]
    action_taken: str
    outcome: Dict[str, Any]
    metrics_before: Dict[str, float]
    metrics_after: Dict[str, float]
    learned_patterns: List[Dict]
    confidence_score: float

class LearningStrategy(ABC):
    """Abstract base class for learning strategies."""
    
    @abstractmethod
    def learn_from_experience(self, experience: LearningExperience) -> Dict[str, Any]:
        """Learn from a single experience."""
        pass
    
    @abstractmethod
    def get_recommendations(self, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get recommendations based on learned knowledge."""
        pass

class PatternBasedLearning(LearningStrategy):
    """Learning strategy based on pattern recognition."""
    
    def __init__(self):
        self.patterns = defaultdict(list)
        self.pattern_confidence = defaultdict(float)
        self.pattern_success_rates = defaultdict(lambda: {'successes': 0, 'attempts': 0})
    
    def learn_from_experience(self, experience: LearningExperience) -> Dict[str, Any]:
        """Learn patterns from experience."""
        pattern_key = self._extract_pattern_key(experience)
        
        self.patterns[pattern_key].append(experience)
        
        # Update success rates
        if 'success' in experience.outcome:
            self.pattern_success_rates[pattern_key]['attempts'] += 1
            if experience.outcome['success']:
                self.pattern_success_rates[pattern_key]['successes'] += 1
        
        # Update confidence based on frequency and recency
        pattern_frequency = len(self.patterns[pattern_key])
        recency_weight = 1.0  # More recent experiences have higher weight
        self.pattern_confidence[pattern_key] = min(1.0, pattern_frequency * 0.1 * recency_weight)
        
        return {
            'pattern_key': pattern_key,
            'pattern_frequency': pattern_frequency,
            'confidence': self.pattern_confidence[pattern_key]
        }
    
    def _extract_pattern_key(self, experience: LearningExperience) -> str:
        """Extract a key that represents the pattern from experience."""
        # Create a pattern key based on context and action
        context_str = f"{experience.experience_type}_{experience.action_taken}"
        
        # Add relevant context information
        if 'failure_type' in experience.context:
            context_str += f"_{experience.context['failure_type']}"
        if 'severity' in experience.context:
            severity_level = 'high' if experience.context['severity'] > 0.7 else 'medium' if experience.context['severity'] > 0.4 else 'low'
            context_str += f"_{severity_level}"
        
        return context_str
    
    def get_recommendations(self, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get recommendations based on learned patterns."""
        recommendations = []
        
        # Find relevant patterns
        for pattern_key, experiences in self.patterns.items():
            if self._is_relevant_pattern(pattern_key, context):
                success_data = self.pattern_success_rates[pattern_key]
                if success_data['attempts'] > 0:
                    success_rate = success_data['successes'] / success_data['attempts']
                    confidence = self.pattern_confidence[pattern_key]
                    
                    # Extract common action from successful experiences
                    successful_experiences = [e for e in experiences if e.outcome.get('success', False)]
                    if successful_experiences:
                        most_common_action = max(set(e.action_taken for e in successful_experiences), 
                                               key=lambda x: sum(1 for e in successful_experiences if e.action_taken == x))
                        
                        recommendations.append({
                            'action': most_common_action,
                            'success_rate': success_rate,
                            'confidence': confidence,
                            'pattern_key': pattern_key,
                            'supporting_experiences': len(successful_experiences)
                        })
        
        # Sort by success rate and confidence
        recommendations.sort(key=lambda x: x['success_rate'] * x['confidence'], reverse=True)
        return recommendations[:5]  # Top 5 recommendations
    
    def _is_relevant_pattern(self, pattern_key: str, context: Dict[str, Any]) -> bool:
        """Check if a pattern is relevant to the current context."""
        if 'failure_type' in context and str(context['failure_type']) in pattern_key:
            return True
        if 'experience_type' in context and context['experience_type'] in pattern_key:
            return True
        return False

class MetaLearning(LearningStrategy):
    """Meta-learning strategy that learns how to learn better."""
    
    def __init__(self):
        self.learning_strategies_performance = defaultdict(lambda: {'successes': 0, 'attempts': 0})
        self.adaptation_history = []
        self.meta_patterns = defaultdict(list)
    
    def learn_from_experience(self, experience: LearningExperience) -> Dict[str, Any]:
        """Learn meta-patterns about learning effectiveness."""
        # Track which learning strategies work best for different types of experiences
        strategy_used = experience.context.get('learning_strategy', 'unknown')
        
        self.learning_strategies_performance[strategy_used]['attempts'] += 1
        if experience.outcome.get('success', False):
            self.learning_strategies_performance[strategy_used]['successes'] += 1
        
        # Extract meta-patterns
        meta_pattern = {
            'experience_type': experience.experience_type,
            'context_complexity': len(experience.context),
            'outcome_quality': experience.confidence_score,
            'strategy_used': strategy_used,
            'timestamp': experience.timestamp.isoformat()
        }
        
        self.meta_patterns[experience.experience_type].append(meta_pattern)
        
        return {
            'meta_learning': True,
            'strategy_performance': dict(self.learning_strategies_performance)
        }
    
    def get_recommendations(self, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get meta-learning recommendations."""
        recommendations = []
        
        experience_type = context.get('experience_type', 'unknown')
        
        # Recommend best learning strategy for this type of experience
        best_strategy = None
        best_success_rate = 0.0
        
        for strategy, performance in self.learning_strategies_performance.items():
            if performance['attempts'] > 5:  # Minimum attempts for statistical significance
                success_rate = performance['successes'] / performance['attempts']
                if success_rate > best_success_rate:
                    best_success_rate = success_rate
                    best_strategy = strategy
        
        if best_strategy:
            recommendations.append({
                'recommendation_type': 'learning_strategy',
                'suggested_strategy': best_strategy,
                'expected_success_rate': best_success_rate,
                'confidence': min(1.0, self.learning_strategies_performance[best_strategy]['attempts'] / 20.0)
            })
        
        return recommendations

class ContinuousLearningSystem:
    """
    Main continuous learning system that orchestrates different learning strategies
    and maintains a persistent knowledge base.
    """
    
    def __init__(self, config: Dict = None):
        """Initialize the continuous learning system."""
        self.config = config or self._default_config()
        self.learning_strategies = {
            'pattern_based': PatternBasedLearning(),
            'meta_learning': MetaLearning()
        }
        
        # Knowledge base
        self.knowledge_base = {}
        self.experience_database = None
        self.learning_history = deque(maxlen=10000)
        
        # Performance tracking
        self.learning_metrics = defaultdict(list)
        self.adaptation_events = []
        
        # Threading for background learning
        self.learning_thread = None
        self.running = False
        
        # Initialize database
        self._initialize_database()
        
    def _default_config(self) -> Dict:
        """Default configuration for continuous learning."""
        return {
            'learning_strategies': ['pattern_based', 'meta_learning'],
            'adaptation_intervals': {
                'fast': 300,    # 5 minutes
                'medium': 1800, # 30 minutes
                'slow': 3600    # 1 hour
            },
            'knowledge_retention': {
                'max_experiences': 50000,
                'experience_ttl_days': 90,
                'pattern_decay_rate': 0.1
            },
            'learning_thresholds': {
                'min_experiences_for_pattern': 5,
                'confidence_threshold': 0.7,
                'success_rate_threshold': 0.6
            },
            'database': {
                'path': '/Users/danielbarreto/Development/workspace/ia/jaqEdu/src/ml/models/learning_knowledge.db',
                'batch_size': 100
            }
        }
    
    def _initialize_database(self) -> None:
        """Initialize SQLite database for persistent knowledge storage."""
        db_path = self.config['database']['path']
        
        try:
            self.experience_database = sqlite3.connect(db_path, check_same_thread=False)
            cursor = self.experience_database.cursor()
            
            # Create experiences table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS experiences (
                    id TEXT PRIMARY KEY,
                    experience_type TEXT,
                    timestamp TEXT,
                    context TEXT,
                    action_taken TEXT,
                    outcome TEXT,
                    metrics_before TEXT,
                    metrics_after TEXT,
                    learned_patterns TEXT,
                    confidence_score REAL
                )
            ''')
            
            # Create patterns table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS patterns (
                    pattern_key TEXT PRIMARY KEY,
                    pattern_data TEXT,
                    frequency INTEGER,
                    success_rate REAL,
                    confidence REAL,
                    last_updated TEXT
                )
            ''')
            
            # Create knowledge table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS knowledge (
                    knowledge_id TEXT PRIMARY KEY,
                    knowledge_type TEXT,
                    content TEXT,
                    confidence REAL,
                    created_at TEXT,
                    last_accessed TEXT
                )
            ''')
            
            self.experience_database.commit()
            logger.info("Learning database initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize learning database: {e}")
            self.experience_database = None
    
    def start_continuous_learning(self) -> None:
        """Start background continuous learning process."""
        if self.running:
            logger.warning("Continuous learning already running")
            return
        
        self.running = True
        self.learning_thread = threading.Thread(target=self._learning_loop, daemon=True)
        self.learning_thread.start()
        
        logger.info("Continuous learning system started")
    
    def stop_continuous_learning(self) -> None:
        """Stop background continuous learning process."""
        self.running = False
        if self.learning_thread:
            self.learning_thread.join(timeout=5)
        
        if self.experience_database:
            self.experience_database.close()
        
        logger.info("Continuous learning system stopped")
    
    def record_experience(self, experience: LearningExperience) -> Dict[str, Any]:
        """Record a new learning experience."""
        # Add to in-memory history
        self.learning_history.append(experience)
        
        # Store in database
        if self.experience_database:
            self._store_experience_in_db(experience)
        
        # Learn from this experience using all strategies
        learning_results = {}
        for strategy_name, strategy in self.learning_strategies.items():
            try:
                if strategy_name in self.config['learning_strategies']:
                    result = strategy.learn_from_experience(experience)
                    learning_results[strategy_name] = result
            except Exception as e:
                logger.error(f"Error in learning strategy {strategy_name}: {e}")
                learning_results[strategy_name] = {'error': str(e)}
        
        # Update knowledge base
        self._update_knowledge_base(experience, learning_results)
        
        # Track learning metrics
        self.learning_metrics['experiences_recorded'].append(datetime.now())
        self.learning_metrics['confidence_scores'].append(experience.confidence_score)
        
        return {
            'experience_recorded': True,
            'learning_results': learning_results,
            'experience_id': experience.experience_id
        }
    
    def _store_experience_in_db(self, experience: LearningExperience) -> None:
        """Store experience in SQLite database."""
        try:
            cursor = self.experience_database.cursor()
            
            cursor.execute('''
                INSERT OR REPLACE INTO experiences 
                (id, experience_type, timestamp, context, action_taken, outcome, 
                 metrics_before, metrics_after, learned_patterns, confidence_score)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                experience.experience_id,
                experience.experience_type,
                experience.timestamp.isoformat(),
                json.dumps(experience.context),
                experience.action_taken,
                json.dumps(experience.outcome),
                json.dumps(experience.metrics_before),
                json.dumps(experience.metrics_after),
                json.dumps(experience.learned_patterns),
                experience.confidence_score
            ))
            
            self.experience_database.commit()
            
        except Exception as e:
            logger.error(f"Failed to store experience in database: {e}")
    
    def _update_knowledge_base(self, experience: LearningExperience, learning_results: Dict) -> None:
        """Update the knowledge base with new learning."""
        knowledge_id = hashlib.md5(
            f"{experience.experience_type}_{experience.action_taken}".encode()
        ).hexdigest()
        
        # Create or update knowledge entry
        if knowledge_id not in self.knowledge_base:
            self.knowledge_base[knowledge_id] = {
                'knowledge_type': 'experiential',
                'experiences': [],
                'patterns': [],
                'confidence': 0.0,
                'success_rate': 0.0,
                'last_updated': datetime.now()
            }
        
        knowledge = self.knowledge_base[knowledge_id]
        knowledge['experiences'].append(experience.experience_id)
        knowledge['last_updated'] = datetime.now()
        
        # Update patterns from learning results
        for strategy_name, results in learning_results.items():
            if 'pattern_key' in results:
                pattern_info = {
                    'strategy': strategy_name,
                    'pattern_key': results['pattern_key'],
                    'confidence': results.get('confidence', 0.0),
                    'frequency': results.get('pattern_frequency', 1)
                }
                knowledge['patterns'].append(pattern_info)
        
        # Calculate overall confidence and success rate
        related_experiences = [e for e in self.learning_history 
                              if e.experience_id in knowledge['experiences'][-20:]]  # Last 20
        
        if related_experiences:
            knowledge['confidence'] = np.mean([e.confidence_score for e in related_experiences])
            successful_experiences = [e for e in related_experiences if e.outcome.get('success', False)]
            knowledge['success_rate'] = len(successful_experiences) / len(related_experiences)
        
        # Store in database
        if self.experience_database:
            self._store_knowledge_in_db(knowledge_id, knowledge)
    
    def _store_knowledge_in_db(self, knowledge_id: str, knowledge: Dict) -> None:
        """Store knowledge in database."""
        try:
            cursor = self.experience_database.cursor()
            
            cursor.execute('''
                INSERT OR REPLACE INTO knowledge 
                (knowledge_id, knowledge_type, content, confidence, created_at, last_accessed)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                knowledge_id,
                knowledge['knowledge_type'],
                json.dumps(knowledge),
                knowledge['confidence'],
                knowledge['last_updated'].isoformat(),
                datetime.now().isoformat()
            ))
            
            self.experience_database.commit()
            
        except Exception as e:
            logger.error(f"Failed to store knowledge in database: {e}")
    
    def get_recommendations(self, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get learning-based recommendations for a given context."""
        all_recommendations = []
        
        # Get recommendations from all learning strategies
        for strategy_name, strategy in self.learning_strategies.items():
            if strategy_name in self.config['learning_strategies']:
                try:
                    recommendations = strategy.get_recommendations(context)
                    for rec in recommendations:
                        rec['source_strategy'] = strategy_name
                    all_recommendations.extend(recommendations)
                except Exception as e:
                    logger.error(f"Error getting recommendations from {strategy_name}: {e}")
        
        # Get recommendations from knowledge base
        kb_recommendations = self._get_knowledge_base_recommendations(context)
        all_recommendations.extend(kb_recommendations)
        
        # Sort by confidence and success rate
        all_recommendations.sort(
            key=lambda x: x.get('confidence', 0.0) * x.get('success_rate', 0.0), 
            reverse=True
        )
        
        return all_recommendations[:10]  # Top 10 recommendations
    
    def _get_knowledge_base_recommendations(self, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get recommendations from the knowledge base."""
        recommendations = []
        
        experience_type = context.get('experience_type', '')
        failure_type = context.get('failure_type', '')
        
        for knowledge_id, knowledge in self.knowledge_base.items():
            # Check relevance
            if knowledge['success_rate'] >= self.config['learning_thresholds']['success_rate_threshold']:
                if knowledge['confidence'] >= self.config['learning_thresholds']['confidence_threshold']:
                    # Extract action recommendation from patterns
                    if knowledge['patterns']:
                        pattern = knowledge['patterns'][-1]  # Most recent pattern
                        
                        recommendations.append({
                            'recommendation_type': 'knowledge_base',
                            'knowledge_id': knowledge_id,
                            'confidence': knowledge['confidence'],
                            'success_rate': knowledge['success_rate'],
                            'pattern_info': pattern,
                            'supporting_experiences': len(knowledge['experiences'])
                        })
        
        return recommendations
    
    def adapt_system_based_on_learning(self) -> Dict[str, Any]:
        """Adapt system parameters based on continuous learning."""
        logger.info("Adapting system based on continuous learning")
        
        adaptations = []
        
        # Analyze recent learning metrics
        recent_confidence_scores = self.learning_metrics['confidence_scores'][-100:]  # Last 100
        if recent_confidence_scores:
            avg_confidence = np.mean(recent_confidence_scores)
            
            # If confidence is low, suggest more exploration
            if avg_confidence < 0.5:
                adaptations.append({
                    'type': 'exploration_increase',
                    'current_avg_confidence': avg_confidence,
                    'recommendation': 'Increase exploration rate in learning algorithms',
                    'priority': 'high'
                })
        
        # Analyze pattern success rates
        pattern_strategy = self.learning_strategies.get('pattern_based')
        if pattern_strategy:
            low_success_patterns = []
            for pattern_key, success_data in pattern_strategy.pattern_success_rates.items():
                if success_data['attempts'] > 10:  # Sufficient data
                    success_rate = success_data['successes'] / success_data['attempts']
                    if success_rate < 0.4:  # Low success rate
                        low_success_patterns.append((pattern_key, success_rate))
            
            if low_success_patterns:
                adaptations.append({
                    'type': 'pattern_strategy_adjustment',
                    'low_success_patterns': low_success_patterns,
                    'recommendation': 'Review and adjust strategies for low-performing patterns',
                    'priority': 'medium'
                })
        
        # Store adaptation event
        adaptation_event = {
            'timestamp': datetime.now().isoformat(),
            'adaptations': adaptations,
            'system_state': {
                'total_experiences': len(self.learning_history),
                'knowledge_base_size': len(self.knowledge_base),
                'avg_confidence': np.mean(recent_confidence_scores) if recent_confidence_scores else 0.0
            }
        }
        self.adaptation_events.append(adaptation_event)
        
        return adaptation_event
    
    def _learning_loop(self) -> None:
        """Main learning loop that runs in background."""
        last_adaptation_time = time.time()
        
        while self.running:
            try:
                current_time = time.time()
                
                # Periodic adaptation
                if current_time - last_adaptation_time >= self.config['adaptation_intervals']['medium']:
                    self.adapt_system_based_on_learning()
                    last_adaptation_time = current_time
                
                # Cleanup old experiences
                self._cleanup_old_experiences()
                
                # Update pattern confidences (decay over time)
                self._decay_pattern_confidences()
                
                time.sleep(60)  # Check every minute
                
            except Exception as e:
                logger.error(f"Error in learning loop: {e}")
                time.sleep(60)  # Continue after error
    
    def _cleanup_old_experiences(self) -> None:
        """Clean up old experiences to manage memory."""
        if not self.experience_database:
            return
        
        try:
            cutoff_date = datetime.now() - timedelta(days=self.config['knowledge_retention']['experience_ttl_days'])
            
            cursor = self.experience_database.cursor()
            cursor.execute(
                'DELETE FROM experiences WHERE timestamp < ?',
                (cutoff_date.isoformat(),)
            )
            self.experience_database.commit()
            
            deleted_count = cursor.rowcount
            if deleted_count > 0:
                logger.info(f"Cleaned up {deleted_count} old experiences")
                
        except Exception as e:
            logger.error(f"Error cleaning up old experiences: {e}")
    
    def _decay_pattern_confidences(self) -> None:
        """Apply decay to pattern confidences over time."""
        decay_rate = self.config['knowledge_retention']['pattern_decay_rate']
        
        # Decay pattern-based learning confidences
        pattern_strategy = self.learning_strategies.get('pattern_based')
        if pattern_strategy:
            for pattern_key in pattern_strategy.pattern_confidence:
                pattern_strategy.pattern_confidence[pattern_key] *= (1 - decay_rate)
    
    def get_learning_report(self) -> Dict[str, Any]:
        """Generate comprehensive learning progress report."""
        recent_experiences = list(self.learning_history)[-100:]  # Last 100 experiences
        
        # Calculate learning metrics
        learning_effectiveness = 0.0
        if recent_experiences:
            successful_experiences = [e for e in recent_experiences if e.outcome.get('success', False)]
            learning_effectiveness = len(successful_experiences) / len(recent_experiences)
        
        # Pattern analysis
        pattern_strategy = self.learning_strategies.get('pattern_based')
        pattern_stats = {}
        if pattern_strategy:
            pattern_stats = {
                'total_patterns': len(pattern_strategy.patterns),
                'high_confidence_patterns': sum(1 for conf in pattern_strategy.pattern_confidence.values() if conf > 0.7),
                'avg_pattern_confidence': np.mean(list(pattern_strategy.pattern_confidence.values())) if pattern_strategy.pattern_confidence else 0.0
            }
        
        # Knowledge base stats
        kb_stats = {
            'total_knowledge_entries': len(self.knowledge_base),
            'high_confidence_knowledge': sum(1 for k in self.knowledge_base.values() if k['confidence'] > 0.7),
            'avg_success_rate': np.mean([k['success_rate'] for k in self.knowledge_base.values()]) if self.knowledge_base else 0.0
        }
        
        report = {
            'timestamp': datetime.now().isoformat(),
            'total_experiences': len(self.learning_history),
            'learning_effectiveness': learning_effectiveness,
            'pattern_statistics': pattern_stats,
            'knowledge_base_statistics': kb_stats,
            'recent_adaptations': len(self.adaptation_events),
            'learning_strategies_active': list(self.learning_strategies.keys()),
            'system_status': 'LEARNING' if learning_effectiveness > 0.7 else 'ADAPTING' if learning_effectiveness > 0.4 else 'STRUGGLING'
        }
        
        return report
    
    def save_learning_state(self, filepath: str) -> None:
        """Save complete learning state."""
        logger.info(f"Saving continuous learning state to {filepath}")
        
        # Prepare state data (excluding database connection)
        state_data = {
            'config': self.config,
            'knowledge_base': self.knowledge_base,
            'learning_history_sample': list(self.learning_history)[-1000:],  # Last 1000 for size management
            'learning_metrics': {k: list(v)[-1000:] for k, v in self.learning_metrics.items()},
            'adaptation_events': self.adaptation_events[-100:],  # Last 100 events
            'timestamp': datetime.now().isoformat()
        }
        
        # Save learning strategy states
        strategy_states = {}
        for name, strategy in self.learning_strategies.items():
            if hasattr(strategy, 'patterns'):
                strategy_states[name] = {
                    'patterns': dict(strategy.patterns),
                    'pattern_confidence': dict(strategy.pattern_confidence),
                    'pattern_success_rates': dict(strategy.pattern_success_rates)
                }
            elif hasattr(strategy, 'learning_strategies_performance'):
                strategy_states[name] = {
                    'learning_strategies_performance': dict(strategy.learning_strategies_performance),
                    'adaptation_history': strategy.adaptation_history,
                    'meta_patterns': dict(strategy.meta_patterns)
                }
        
        state_data['learning_strategies'] = strategy_states
        
        joblib.dump(state_data, filepath)
        logger.info("Learning state saved successfully!")
    
    def load_learning_state(self, filepath: str) -> None:
        """Load complete learning state."""
        logger.info(f"Loading continuous learning state from {filepath}")
        
        state_data = joblib.load(filepath)
        
        self.config = state_data['config']
        self.knowledge_base = state_data['knowledge_base']
        # Note: learning_history is not restored to avoid memory issues with large histories
        self.learning_metrics = defaultdict(list)
        for k, v in state_data['learning_metrics'].items():
            self.learning_metrics[k] = deque(v, maxlen=1000)
        self.adaptation_events = state_data['adaptation_events']
        
        # Restore learning strategy states
        if 'learning_strategies' in state_data:
            for name, strategy_state in state_data['learning_strategies'].items():
                if name == 'pattern_based' and 'patterns' in strategy_state:
                    strategy = self.learning_strategies['pattern_based']
                    strategy.patterns = defaultdict(list, strategy_state['patterns'])
                    strategy.pattern_confidence = defaultdict(float, strategy_state['pattern_confidence'])
                    strategy.pattern_success_rates = defaultdict(
                        lambda: {'successes': 0, 'attempts': 0},
                        strategy_state['pattern_success_rates']
                    )
                elif name == 'meta_learning' and 'learning_strategies_performance' in strategy_state:
                    strategy = self.learning_strategies['meta_learning']
                    strategy.learning_strategies_performance = defaultdict(
                        lambda: {'successes': 0, 'attempts': 0},
                        strategy_state['learning_strategies_performance']
                    )
                    strategy.adaptation_history = strategy_state['adaptation_history']
                    strategy.meta_patterns = defaultdict(list, strategy_state['meta_patterns'])
        
        logger.info("Learning state loaded successfully!")

# Example usage and testing
if __name__ == "__main__":
    # Initialize continuous learning system
    learning_system = ContinuousLearningSystem()
    
    # Start continuous learning
    learning_system.start_continuous_learning()
    
    try:
        # Simulate learning experiences
        logger.info("Simulating learning experiences")
        
        for i in range(20):
            # Create diverse learning experiences
            experience = LearningExperience(
                experience_id=f"exp_{i:04d}",
                experience_type=np.random.choice(['failure_recovery', 'optimization', 'pattern_detection']),
                timestamp=datetime.now(),
                context={
                    'failure_type': np.random.choice(['cpu_overload', 'memory_leak', 'network_timeout']),
                    'severity': np.random.uniform(0.3, 0.9),
                    'component': f"component_{np.random.randint(1, 5)}",
                    'learning_strategy': np.random.choice(['pattern_based', 'meta_learning'])
                },
                action_taken=np.random.choice(['restart', 'scale_up', 'failover', 'throttle']),
                outcome={
                    'success': np.random.random() > 0.3,  # 70% success rate
                    'improvement': np.random.uniform(0.0, 0.8)
                },
                metrics_before={
                    'cpu_usage': np.random.uniform(60, 95),
                    'response_time': np.random.uniform(100, 2000)
                },
                metrics_after={
                    'cpu_usage': np.random.uniform(30, 70),
                    'response_time': np.random.uniform(50, 500)
                },
                learned_patterns=[],
                confidence_score=np.random.uniform(0.4, 0.9)
            )
            
            result = learning_system.record_experience(experience)
            print(f"Experience {i}: {result['experience_recorded']}")
            
            time.sleep(0.1)  # Brief pause
        
        # Test recommendations
        test_context = {
            'experience_type': 'failure_recovery',
            'failure_type': 'cpu_overload',
            'severity': 0.8
        }
        
        recommendations = learning_system.get_recommendations(test_context)
        print(f"\nRecommendations for {test_context}:")
        for rec in recommendations[:3]:
            print(f"  - {rec}")
        
        # Force adaptation
        adaptation_result = learning_system.adapt_system_based_on_learning()
        print(f"\nAdaptation result: {len(adaptation_result['adaptations'])} adaptations made")
        
        # Generate learning report
        report = learning_system.get_learning_report()
        print(f"\n=== Learning Report ===")
        print(f"Total Experiences: {report['total_experiences']}")
        print(f"Learning Effectiveness: {report['learning_effectiveness']:.4f}")
        print(f"Knowledge Base Size: {report['knowledge_base_statistics']['total_knowledge_entries']}")
        print(f"System Status: {report['system_status']}")
        
        # Save learning state
        learning_system.save_learning_state('/Users/danielbarreto/Development/workspace/ia/jaqEdu/src/ml/models/continuous_learning_state.pkl')
        
        logger.info("Continuous learning system testing completed successfully!")
        
    finally:
        # Stop continuous learning
        learning_system.stop_continuous_learning()