#!/usr/bin/env python3
"""
Self-Healing Orchestrator with Reinforcement Learning
Intelligent system that learns optimal failure responses and continuously improves healing strategies.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional, Any, Callable
import json
import logging
from datetime import datetime, timedelta
import warnings
import time
import threading
from queue import Queue, PriorityQueue
from enum import Enum
from dataclasses import dataclass, field
import joblib
from collections import defaultdict, deque
import random

# Simple Q-learning implementation (avoiding external RL dependencies)
class QLearningAgent:
    """Simple Q-learning agent for self-healing decisions."""
    
    def __init__(self, n_states: int, n_actions: int, learning_rate: float = 0.1,
                 discount_factor: float = 0.9, epsilon: float = 0.1):
        self.n_states = n_states
        self.n_actions = n_actions
        self.learning_rate = learning_rate
        self.discount_factor = discount_factor
        self.epsilon = epsilon
        self.q_table = np.zeros((n_states, n_actions))
        self.state_action_counts = np.zeros((n_states, n_actions))
    
    def choose_action(self, state: int) -> int:
        """Choose action using epsilon-greedy policy."""
        if np.random.random() < self.epsilon:
            return np.random.randint(self.n_actions)
        else:
            return np.argmax(self.q_table[state])
    
    def update_q_value(self, state: int, action: int, reward: float, next_state: int) -> None:
        """Update Q-value using Q-learning update rule."""
        best_next_action = np.argmax(self.q_table[next_state])
        td_target = reward + self.discount_factor * self.q_table[next_state][best_next_action]
        td_error = td_target - self.q_table[state][action]
        self.q_table[state][action] += self.learning_rate * td_error
        self.state_action_counts[state][action] += 1
    
    def decay_epsilon(self, decay_rate: float = 0.995) -> None:
        """Decay exploration rate over time."""
        self.epsilon = max(0.01, self.epsilon * decay_rate)

warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class FailureType(Enum):
    """Types of system failures."""
    CPU_OVERLOAD = "cpu_overload"
    MEMORY_LEAK = "memory_leak"
    DISK_FULL = "disk_full"
    NETWORK_TIMEOUT = "network_timeout"
    SERVICE_CRASH = "service_crash"
    DATABASE_ERROR = "database_error"
    API_RATE_LIMIT = "api_rate_limit"
    UNKNOWN = "unknown"

class HealingAction(Enum):
    """Types of healing actions."""
    RESTART_SERVICE = "restart_service"
    SCALE_UP = "scale_up"
    SCALE_DOWN = "scale_down"
    CLEAR_CACHE = "clear_cache"
    RESTART_COMPONENT = "restart_component"
    FAILOVER = "failover"
    THROTTLE_REQUESTS = "throttle_requests"
    ALLOCATE_RESOURCES = "allocate_resources"
    NO_ACTION = "no_action"

class Priority(Enum):
    """Priority levels for healing actions."""
    CRITICAL = 1
    HIGH = 2
    MEDIUM = 3
    LOW = 4

@dataclass
class FailureEvent:
    """Represents a failure event in the system."""
    failure_type: FailureType
    severity: float  # 0.0 to 1.0
    affected_components: List[str]
    metrics: Dict[str, float]
    timestamp: datetime = field(default_factory=datetime.now)
    event_id: str = field(default_factory=lambda: f"failure_{int(time.time())}")

@dataclass
class HealingResponse:
    """Represents a healing response to a failure."""
    action: HealingAction
    parameters: Dict[str, Any]
    priority: Priority
    estimated_duration: float  # seconds
    success_probability: float  # 0.0 to 1.0
    resource_cost: float  # relative cost
    response_id: str = field(default_factory=lambda: f"response_{int(time.time())}")

@dataclass
class HealingResult:
    """Results of a healing action."""
    response_id: str
    success: bool
    actual_duration: float
    improvement_metrics: Dict[str, float]
    side_effects: List[str]
    timestamp: datetime = field(default_factory=datetime.now)

class SelfHealingOrchestrator:
    """
    Advanced self-healing orchestrator that uses reinforcement learning to optimize
    failure responses and continuously improve healing strategies.
    """
    
    def __init__(self, config: Dict = None):
        """Initialize the self-healing orchestrator."""
        self.config = config or self._default_config()
        self.failure_history = deque(maxlen=1000)
        self.healing_history = deque(maxlen=1000)
        self.performance_metrics = {}
        
        # Reinforcement Learning Agent
        n_states = len(FailureType) * 5  # 5 severity levels per failure type
        n_actions = len(HealingAction)
        self.rl_agent = QLearningAgent(
            n_states=n_states,
            n_actions=n_actions,
            learning_rate=self.config['rl_config']['learning_rate'],
            discount_factor=self.config['rl_config']['discount_factor'],
            epsilon=self.config['rl_config']['epsilon']
        )
        
        # Action execution queue
        self.action_queue = PriorityQueue()
        self.execution_threads = []
        self.running = False
        
        # Pattern recognition
        self.failure_patterns = defaultdict(list)
        self.healing_strategies = {}
        
        # Performance tracking
        self.healing_success_rates = defaultdict(lambda: {'successes': 0, 'attempts': 0})
        self.response_times = defaultdict(list)
        self.resource_usage = defaultdict(list)
        
        # Learning from failures
        self.failure_learning_data = []
        self.improvement_tracking = {}
        
    def _default_config(self) -> Dict:
        """Default configuration for the self-healing orchestrator."""
        return {
            'rl_config': {
                'learning_rate': 0.1,
                'discount_factor': 0.9,
                'epsilon': 0.2,
                'epsilon_decay': 0.995,
                'min_epsilon': 0.01
            },
            'healing_strategies': {
                FailureType.CPU_OVERLOAD: [
                    HealingAction.SCALE_UP,
                    HealingAction.THROTTLE_REQUESTS,
                    HealingAction.RESTART_SERVICE
                ],
                FailureType.MEMORY_LEAK: [
                    HealingAction.RESTART_SERVICE,
                    HealingAction.CLEAR_CACHE,
                    HealingAction.SCALE_UP
                ],
                FailureType.DISK_FULL: [
                    HealingAction.CLEAR_CACHE,
                    HealingAction.ALLOCATE_RESOURCES,
                    HealingAction.SCALE_UP
                ],
                FailureType.NETWORK_TIMEOUT: [
                    HealingAction.RESTART_COMPONENT,
                    HealingAction.FAILOVER,
                    HealingAction.THROTTLE_REQUESTS
                ],
                FailureType.SERVICE_CRASH: [
                    HealingAction.RESTART_SERVICE,
                    HealingAction.FAILOVER,
                    HealingAction.SCALE_UP
                ],
                FailureType.DATABASE_ERROR: [
                    HealingAction.RESTART_COMPONENT,
                    HealingAction.FAILOVER,
                    HealingAction.CLEAR_CACHE
                ],
                FailureType.API_RATE_LIMIT: [
                    HealingAction.THROTTLE_REQUESTS,
                    HealingAction.SCALE_UP,
                    HealingAction.NO_ACTION
                ]
            },
            'action_parameters': {
                HealingAction.RESTART_SERVICE: {
                    'timeout': 30,
                    'graceful': True,
                    'max_attempts': 3
                },
                HealingAction.SCALE_UP: {
                    'scale_factor': 1.5,
                    'max_instances': 10,
                    'cooldown': 300
                },
                HealingAction.SCALE_DOWN: {
                    'scale_factor': 0.7,
                    'min_instances': 1,
                    'cooldown': 300
                },
                HealingAction.CLEAR_CACHE: {
                    'cache_types': ['memory', 'disk'],
                    'preserve_critical': True
                },
                HealingAction.FAILOVER: {
                    'target_region': 'backup',
                    'health_check_timeout': 60
                },
                HealingAction.THROTTLE_REQUESTS: {
                    'throttle_rate': 0.5,
                    'duration': 300,
                    'prioritize_critical': True
                }
            },
            'thresholds': {
                'critical_severity': 0.8,
                'high_severity': 0.6,
                'medium_severity': 0.4,
                'response_timeout': 300,  # seconds
                'success_rate_threshold': 0.7
            },
            'learning': {
                'pattern_window': 100,
                'min_pattern_frequency': 3,
                'adaptation_rate': 0.1,
                'retraining_interval': 3600  # 1 hour
            }
        }
    
    def start_orchestrator(self) -> None:
        """Start the self-healing orchestrator background threads."""
        if self.running:
            logger.warning("Orchestrator is already running")
            return
        
        self.running = True
        
        # Start action execution thread
        execution_thread = threading.Thread(target=self._execute_actions, daemon=True)
        execution_thread.start()
        self.execution_threads.append(execution_thread)
        
        # Start learning thread
        learning_thread = threading.Thread(target=self._continuous_learning, daemon=True)
        learning_thread.start()
        self.execution_threads.append(learning_thread)
        
        logger.info("Self-healing orchestrator started successfully")
    
    def stop_orchestrator(self) -> None:
        """Stop the self-healing orchestrator."""
        self.running = False
        logger.info("Self-healing orchestrator stopping...")
        
        # Wait for threads to finish
        for thread in self.execution_threads:
            thread.join(timeout=5)
        
        logger.info("Self-healing orchestrator stopped")
    
    def encode_state(self, failure_event: FailureEvent) -> int:
        """Encode failure event into state for RL agent."""
        failure_type_idx = list(FailureType).index(failure_event.failure_type)
        severity_level = min(4, int(failure_event.severity * 5))  # 5 levels: 0-4
        return failure_type_idx * 5 + severity_level
    
    def decode_action(self, action_idx: int) -> HealingAction:
        """Decode action index to HealingAction."""
        return list(HealingAction)[action_idx]
    
    def calculate_reward(self, healing_result: HealingResult, 
                        failure_severity: float) -> float:
        """Calculate reward for reinforcement learning."""
        base_reward = 1.0 if healing_result.success else -1.0
        
        # Adjust reward based on severity (more reward for fixing severe issues)
        severity_bonus = failure_severity * 0.5
        
        # Penalize long response times
        time_penalty = min(0.5, healing_result.actual_duration / 300.0)
        
        # Bonus for improvement in metrics
        improvement_bonus = sum(healing_result.improvement_metrics.values()) * 0.1
        
        # Penalty for side effects
        side_effect_penalty = len(healing_result.side_effects) * 0.1
        
        reward = base_reward + severity_bonus - time_penalty + improvement_bonus - side_effect_penalty
        return max(-2.0, min(2.0, reward))  # Clip reward to [-2, 2]
    
    def detect_failure_patterns(self, failure_event: FailureEvent) -> List[Dict]:
        """Detect patterns in failure history."""
        patterns = []
        
        # Add current failure to history
        self.failure_patterns[failure_event.failure_type].append({
            'timestamp': failure_event.timestamp,
            'severity': failure_event.severity,
            'metrics': failure_event.metrics,
            'components': failure_event.affected_components
        })
        
        # Analyze recent failures for patterns
        recent_failures = list(self.failure_history)[-self.config['learning']['pattern_window']:]
        
        # Time-based patterns
        failure_times = [f.timestamp for f in recent_failures if f.failure_type == failure_event.failure_type]
        if len(failure_times) >= self.config['learning']['min_pattern_frequency']:
            time_intervals = []
            for i in range(1, len(failure_times)):
                interval = (failure_times[i] - failure_times[i-1]).total_seconds()
                time_intervals.append(interval)
            
            if time_intervals:
                avg_interval = np.mean(time_intervals)
                if avg_interval < 3600:  # Less than 1 hour
                    patterns.append({
                        'type': 'recurring_failure',
                        'failure_type': failure_event.failure_type,
                        'average_interval': avg_interval,
                        'frequency': len(failure_times)
                    })
        
        # Component correlation patterns
        component_failures = defaultdict(int)
        for failure in recent_failures:
            for component in failure.affected_components:
                component_failures[component] += 1
        
        for component, count in component_failures.items():
            if count >= self.config['learning']['min_pattern_frequency']:
                patterns.append({
                    'type': 'component_hotspot',
                    'component': component,
                    'failure_count': count,
                    'failure_types': list(set(f.failure_type for f in recent_failures 
                                            if component in f.affected_components))
                })
        
        return patterns
    
    def generate_healing_response(self, failure_event: FailureEvent) -> HealingResponse:
        """Generate intelligent healing response using RL and heuristics."""
        # Encode state for RL agent
        state = self.encode_state(failure_event)
        
        # Get action from RL agent
        action_idx = self.rl_agent.choose_action(state)
        suggested_action = self.decode_action(action_idx)
        
        # Get fallback actions from configuration
        fallback_actions = self.config['healing_strategies'].get(
            failure_event.failure_type, [HealingAction.NO_ACTION]
        )
        
        # Choose best action considering both RL suggestion and heuristics
        if suggested_action in fallback_actions or len(self.failure_history) < 10:
            chosen_action = suggested_action
        else:
            # Use success rate to choose from fallback actions
            best_action = fallback_actions[0]
            best_success_rate = 0.0
            
            for action in fallback_actions:
                strategy_key = f"{failure_event.failure_type}_{action}"
                success_data = self.healing_success_rates[strategy_key]
                if success_data['attempts'] > 0:
                    success_rate = success_data['successes'] / success_data['attempts']
                    if success_rate > best_success_rate:
                        best_success_rate = success_rate
                        best_action = action
            
            chosen_action = best_action
        
        # Get action parameters
        parameters = self.config['action_parameters'].get(chosen_action, {}).copy()
        
        # Adjust parameters based on failure severity
        if chosen_action == HealingAction.SCALE_UP:
            scale_factor = parameters.get('scale_factor', 1.5)
            parameters['scale_factor'] = min(3.0, scale_factor * (1 + failure_event.severity))
        elif chosen_action == HealingAction.THROTTLE_REQUESTS:
            throttle_rate = parameters.get('throttle_rate', 0.5)
            parameters['throttle_rate'] = max(0.1, throttle_rate * (1 - failure_event.severity * 0.5))
        
        # Determine priority
        if failure_event.severity >= self.config['thresholds']['critical_severity']:
            priority = Priority.CRITICAL
            success_prob = 0.9
        elif failure_event.severity >= self.config['thresholds']['high_severity']:
            priority = Priority.HIGH
            success_prob = 0.8
        elif failure_event.severity >= self.config['thresholds']['medium_severity']:
            priority = Priority.MEDIUM
            success_prob = 0.7
        else:
            priority = Priority.LOW
            success_prob = 0.6
        
        # Estimate duration based on action type and historical data
        duration_estimates = {
            HealingAction.RESTART_SERVICE: 30,
            HealingAction.SCALE_UP: 120,
            HealingAction.SCALE_DOWN: 60,
            HealingAction.CLEAR_CACHE: 10,
            HealingAction.RESTART_COMPONENT: 45,
            HealingAction.FAILOVER: 180,
            HealingAction.THROTTLE_REQUESTS: 5,
            HealingAction.ALLOCATE_RESOURCES: 90,
            HealingAction.NO_ACTION: 1
        }
        
        estimated_duration = duration_estimates.get(chosen_action, 60)
        
        # Adjust success probability based on historical performance
        strategy_key = f"{failure_event.failure_type}_{chosen_action}"
        success_data = self.healing_success_rates[strategy_key]
        if success_data['attempts'] > 5:
            historical_success_rate = success_data['successes'] / success_data['attempts']
            success_prob = (success_prob + historical_success_rate) / 2
        
        response = HealingResponse(
            action=chosen_action,
            parameters=parameters,
            priority=priority,
            estimated_duration=estimated_duration,
            success_probability=success_prob,
            resource_cost=failure_event.severity * 0.5
        )
        
        return response
    
    def execute_healing_action(self, response: HealingResponse, 
                              failure_event: FailureEvent) -> HealingResult:
        """
        Execute healing action (simulated implementation).
        In a real system, this would interface with infrastructure APIs.
        """
        start_time = time.time()
        
        logger.info(f"Executing healing action: {response.action} for failure: {failure_event.failure_type}")
        
        # Simulate action execution
        time.sleep(min(5, response.estimated_duration / 10))  # Accelerated for demo
        
        actual_duration = time.time() - start_time
        
        # Simulate success/failure based on probability
        success = np.random.random() < response.success_probability
        
        # Simulate improvement metrics
        improvement_metrics = {}
        if success:
            if failure_event.failure_type == FailureType.CPU_OVERLOAD:
                improvement_metrics['cpu_usage'] = np.random.uniform(0.2, 0.5)
            elif failure_event.failure_type == FailureType.MEMORY_LEAK:
                improvement_metrics['memory_usage'] = np.random.uniform(0.1, 0.4)
            elif failure_event.failure_type == FailureType.NETWORK_TIMEOUT:
                improvement_metrics['response_time'] = np.random.uniform(0.3, 0.6)
        
        # Simulate potential side effects
        side_effects = []
        if response.action == HealingAction.RESTART_SERVICE and np.random.random() < 0.1:
            side_effects.append("brief_service_interruption")
        elif response.action == HealingAction.SCALE_UP and np.random.random() < 0.05:
            side_effects.append("increased_resource_cost")
        
        result = HealingResult(
            response_id=response.response_id,
            success=success,
            actual_duration=actual_duration,
            improvement_metrics=improvement_metrics,
            side_effects=side_effects
        )
        
        logger.info(f"Healing action completed. Success: {success}, Duration: {actual_duration:.2f}s")
        
        return result
    
    def handle_failure(self, failure_event: FailureEvent) -> Dict:
        """
        Main entry point for handling system failures.
        """
        logger.info(f"Handling failure: {failure_event.failure_type} (severity: {failure_event.severity})")
        
        # Add to failure history
        self.failure_history.append(failure_event)
        
        # Detect patterns
        patterns = self.detect_failure_patterns(failure_event)
        
        # Generate healing response
        response = self.generate_healing_response(failure_event)
        
        # Execute healing action
        result = self.execute_healing_action(response, failure_event)
        
        # Record healing attempt
        self.healing_history.append({
            'failure_event': failure_event,
            'healing_response': response,
            'healing_result': result,
            'patterns_detected': patterns,
            'timestamp': datetime.now()
        })
        
        # Update RL agent
        state = self.encode_state(failure_event)
        action = list(HealingAction).index(response.action)
        reward = self.calculate_reward(result, failure_event.severity)
        next_state = state  # Simplified - in real system, would be post-healing state
        
        self.rl_agent.update_q_value(state, action, reward, next_state)
        
        # Update success rates
        strategy_key = f"{failure_event.failure_type}_{response.action}"
        self.healing_success_rates[strategy_key]['attempts'] += 1
        if result.success:
            self.healing_success_rates[strategy_key]['successes'] += 1
        
        # Track performance metrics
        self.response_times[response.action].append(result.actual_duration)
        self.resource_usage[response.action].append(response.resource_cost)
        
        # Learn from this experience
        learning_data = {
            'failure_type': failure_event.failure_type,
            'severity': failure_event.severity,
            'action_taken': response.action,
            'success': result.success,
            'improvement': sum(result.improvement_metrics.values()),
            'patterns': patterns,
            'timestamp': datetime.now().isoformat()
        }
        self.failure_learning_data.append(learning_data)
        
        return {
            'failure_handled': True,
            'healing_action': response.action,
            'success': result.success,
            'duration': result.actual_duration,
            'patterns_detected': patterns,
            'improvement_metrics': result.improvement_metrics,
            'side_effects': result.side_effects
        }
    
    def _execute_actions(self) -> None:
        """Background thread for executing healing actions."""
        while self.running:
            try:
                # Check for actions in queue (simplified - would implement priority queue properly)
                time.sleep(1)  # Prevent busy waiting
            except Exception as e:
                logger.error(f"Error in action execution thread: {e}")
    
    def _continuous_learning(self) -> None:
        """Background thread for continuous learning and improvement."""
        last_learning_time = time.time()
        
        while self.running:
            try:
                current_time = time.time()
                
                # Check if it's time for retraining
                if current_time - last_learning_time >= self.config['learning']['retraining_interval']:
                    self._retrain_models()
                    self._update_strategies()
                    last_learning_time = current_time
                    
                    # Decay exploration rate
                    self.rl_agent.decay_epsilon(self.config['rl_config']['epsilon_decay'])
                
                time.sleep(60)  # Check every minute
                
            except Exception as e:
                logger.error(f"Error in continuous learning thread: {e}")
    
    def _retrain_models(self) -> None:
        """Retrain models based on recent experience."""
        logger.info("Retraining models based on recent experience")
        
        if len(self.failure_learning_data) < 10:
            logger.info("Insufficient data for retraining")
            return
        
        # Analyze success patterns
        success_patterns = defaultdict(list)
        failure_patterns = defaultdict(list)
        
        for data in self.failure_learning_data[-100:]:  # Last 100 experiences
            key = (data['failure_type'], data['action_taken'])
            if data['success']:
                success_patterns[key].append(data)
            else:
                failure_patterns[key].append(data)
        
        # Update strategy effectiveness
        for key, successes in success_patterns.items():
            failure_type, action = key
            total_attempts = len(successes) + len(failure_patterns.get(key, []))
            success_rate = len(successes) / total_attempts if total_attempts > 0 else 0
            
            strategy_key = f"{failure_type}_{action}"
            if strategy_key not in self.improvement_tracking:
                self.improvement_tracking[strategy_key] = {'history': []}
            
            self.improvement_tracking[strategy_key]['history'].append({
                'timestamp': datetime.now().isoformat(),
                'success_rate': success_rate,
                'attempts': total_attempts
            })
        
        logger.info("Model retraining completed")
    
    def _update_strategies(self) -> None:
        """Update healing strategies based on learned patterns."""
        logger.info("Updating healing strategies based on learned patterns")
        
        # Analyze most effective strategies for each failure type
        for failure_type in FailureType:
            best_actions = []
            
            for action in HealingAction:
                strategy_key = f"{failure_type}_{action}"
                success_data = self.healing_success_rates[strategy_key]
                
                if success_data['attempts'] >= 5:  # Minimum attempts for statistical significance
                    success_rate = success_data['successes'] / success_data['attempts']
                    avg_response_time = np.mean(self.response_times.get(action, [60]))
                    
                    # Score based on success rate and response time
                    score = success_rate * 0.8 + (1 / (1 + avg_response_time / 60)) * 0.2
                    
                    best_actions.append((action, score))
            
            # Update strategy if we have learned data
            if best_actions:
                best_actions.sort(key=lambda x: x[1], reverse=True)
                new_strategy = [action for action, _ in best_actions[:3]]  # Top 3 actions
                
                if new_strategy != self.config['healing_strategies'].get(failure_type, []):
                    logger.info(f"Updated strategy for {failure_type}: {new_strategy}")
                    self.config['healing_strategies'][failure_type] = new_strategy
    
    def get_system_health_report(self) -> Dict:
        """Generate comprehensive system health and learning report."""
        total_failures = len(self.failure_history)
        recent_failures = [f for f in self.failure_history if 
                          (datetime.now() - f.timestamp).total_seconds() < 3600]  # Last hour
        
        total_healing_attempts = len(self.healing_history)
        successful_healings = sum(1 for h in self.healing_history if h['healing_result'].success)
        
        overall_success_rate = successful_healings / total_healing_attempts if total_healing_attempts > 0 else 0
        
        # Strategy performance
        strategy_performance = {}
        for strategy_key, data in self.healing_success_rates.items():
            if data['attempts'] > 0:
                success_rate = data['successes'] / data['attempts']
                strategy_performance[strategy_key] = {
                    'success_rate': success_rate,
                    'attempts': data['attempts']
                }
        
        # Learning progress
        learning_progress = {
            'q_table_entries_updated': np.sum(self.rl_agent.state_action_counts > 0),
            'total_q_table_entries': self.rl_agent.q_table.size,
            'exploration_rate': self.rl_agent.epsilon,
            'experiences_collected': len(self.failure_learning_data)
        }
        
        report = {
            'timestamp': datetime.now().isoformat(),
            'total_failures_handled': total_failures,
            'recent_failures': len(recent_failures),
            'total_healing_attempts': total_healing_attempts,
            'overall_success_rate': overall_success_rate,
            'strategy_performance': strategy_performance,
            'learning_progress': learning_progress,
            'improvement_tracking': dict(self.improvement_tracking),
            'system_status': 'HEALTHY' if overall_success_rate > 0.8 else 'DEGRADED' if overall_success_rate > 0.5 else 'CRITICAL'
        }
        
        return report
    
    def save_state(self, filepath: str) -> None:
        """Save orchestrator state and learning data."""
        logger.info(f"Saving self-healing orchestrator state to {filepath}")
        
        state_data = {
            'config': self.config,
            'rl_agent_q_table': self.rl_agent.q_table,
            'rl_agent_state_action_counts': self.rl_agent.state_action_counts,
            'rl_agent_epsilon': self.rl_agent.epsilon,
            'healing_success_rates': dict(self.healing_success_rates),
            'response_times': {k: list(v) for k, v in self.response_times.items()},
            'resource_usage': {k: list(v) for k, v in self.resource_usage.items()},
            'failure_learning_data': self.failure_learning_data,
            'improvement_tracking': self.improvement_tracking,
            'timestamp': datetime.now().isoformat()
        }
        
        joblib.dump(state_data, filepath)
        logger.info("State saved successfully!")
    
    def load_state(self, filepath: str) -> None:
        """Load orchestrator state and learning data."""
        logger.info(f"Loading self-healing orchestrator state from {filepath}")
        
        state_data = joblib.load(filepath)
        
        self.config = state_data['config']
        self.rl_agent.q_table = state_data['rl_agent_q_table']
        self.rl_agent.state_action_counts = state_data['rl_agent_state_action_counts']
        self.rl_agent.epsilon = state_data['rl_agent_epsilon']
        self.healing_success_rates = defaultdict(lambda: {'successes': 0, 'attempts': 0})
        self.healing_success_rates.update(state_data['healing_success_rates'])
        self.response_times = defaultdict(list)
        self.response_times.update({k: deque(v, maxlen=100) for k, v in state_data['response_times'].items()})
        self.resource_usage = defaultdict(list)
        self.resource_usage.update({k: deque(v, maxlen=100) for k, v in state_data['resource_usage'].items()})
        self.failure_learning_data = state_data['failure_learning_data']
        self.improvement_tracking = state_data['improvement_tracking']
        
        logger.info("State loaded successfully!")

# Example usage and testing
if __name__ == "__main__":
    # Initialize self-healing orchestrator
    orchestrator = SelfHealingOrchestrator()
    
    # Start the orchestrator
    orchestrator.start_orchestrator()
    
    try:
        # Simulate various failure scenarios
        logger.info("Simulating failure scenarios for testing")
        
        # CPU overload scenario
        cpu_failure = FailureEvent(
            failure_type=FailureType.CPU_OVERLOAD,
            severity=0.8,
            affected_components=["web-server", "api-gateway"],
            metrics={"cpu_usage": 95.0, "response_time": 2000}
        )
        
        result1 = orchestrator.handle_failure(cpu_failure)
        print(f"CPU overload handling result: {result1}")
        
        # Memory leak scenario
        memory_failure = FailureEvent(
            failure_type=FailureType.MEMORY_LEAK,
            severity=0.6,
            affected_components=["application-server"],
            metrics={"memory_usage": 90.0, "gc_frequency": 15}
        )
        
        result2 = orchestrator.handle_failure(memory_failure)
        print(f"Memory leak handling result: {result2}")
        
        # Database error scenario
        db_failure = FailureEvent(
            failure_type=FailureType.DATABASE_ERROR,
            severity=0.9,
            affected_components=["database", "connection-pool"],
            metrics={"connection_errors": 50, "query_timeout": 30000}
        )
        
        result3 = orchestrator.handle_failure(db_failure)
        print(f"Database error handling result: {result3}")
        
        # Simulate learning over time with repeated failures
        for i in range(10):
            # Create variations of the same failure type to enable learning
            failure = FailureEvent(
                failure_type=random.choice(list(FailureType)),
                severity=random.uniform(0.3, 0.9),
                affected_components=[f"component-{random.randint(1, 5)}"],
                metrics={"error_rate": random.uniform(0.1, 0.5)}
            )
            
            orchestrator.handle_failure(failure)
            time.sleep(0.1)  # Brief pause between failures
        
        # Generate health report
        health_report = orchestrator.get_system_health_report()
        print(f"\n=== System Health Report ===")
        print(f"Overall Success Rate: {health_report['overall_success_rate']:.4f}")
        print(f"Total Failures Handled: {health_report['total_failures_handled']}")
        print(f"Learning Progress: {health_report['learning_progress']['experiences_collected']} experiences")
        print(f"System Status: {health_report['system_status']}")
        
        # Save state
        orchestrator.save_state('/Users/danielbarreto/Development/workspace/ia/jaqEdu/src/ml/models/self_healing_state.pkl')
        
        logger.info("Self-healing orchestrator testing completed successfully!")
        
    finally:
        # Stop the orchestrator
        orchestrator.stop_orchestrator()