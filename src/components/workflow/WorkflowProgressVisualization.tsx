/**
 * WorkflowProgressVisualization Component
 * Visualizes workflow execution progress with progress tracking, milestones, and Jung-specific indicators
 */

import React, { useState, useEffect } from 'react';
import { 
  WorkflowExecution, 
  StudentProgressWorkflowData, 
  LearningPathWorkflowData,
  Achievement 
} from '../../types/workflow';

interface WorkflowProgressVisualizationProps {
  execution: WorkflowExecution;
  workflowType: 'student_progress' | 'learning_path' | 'assessment' | 'adaptive_content';
  showDetailed?: boolean;
  realTimeUpdates?: boolean;
  onMilestoneReached?: (milestone: string) => void;
}

export const WorkflowProgressVisualization: React.FC<WorkflowProgressVisualizationProps> = ({
  execution,
  workflowType,
  showDetailed = false,
  realTimeUpdates = false,
  onMilestoneReached
}) => {
  const [currentProgress, setCurrentProgress] = useState<number>(0);
  const [milestones, setMilestones] = useState<string[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number>(0);
  const [selectedView, setSelectedView] = useState<'overview' | 'detailed' | 'timeline'>('overview');

  // Calculate progress based on workflow type and execution data
  useEffect(() => {
    const calculateProgress = () => {
      switch (workflowType) {
        case 'student_progress':
          const studentData = execution.variables as StudentProgressWorkflowData;
          setCurrentProgress(studentData.progress || 0);
          break;
        case 'learning_path':
          const pathData = execution.variables as LearningPathWorkflowData;
          const totalModules = pathData.completedModules.length + pathData.recommendedModules.length;
          const completedPercentage = totalModules > 0 ? (pathData.completedModules.length / totalModules) * 100 : 0;
          setCurrentProgress(Math.round(completedPercentage));
          break;
        default:
          setCurrentProgress(50); // Default progress
      }
    };

    calculateProgress();

    // Mock milestones and achievements based on progress
    const mockMilestones = [];
    const mockAchievements = (execution.variables.achievements || []) as Achievement[];

    if (currentProgress >= 25) {
      mockMilestones.push('Foundation Understanding');
    }
    if (currentProgress >= 50) {
      mockMilestones.push('Intermediate Concepts');
    }
    if (currentProgress >= 75) {
      mockMilestones.push('Advanced Mastery');
    }
    if (currentProgress === 100) {
      mockMilestones.push('Complete Mastery');
    }

    setMilestones(mockMilestones);
    setAchievements(mockAchievements);

    // Calculate estimated time remaining
    const timeSpent = execution.variables.timeSpent || 0;
    const avgTimePerPercent = timeSpent / Math.max(currentProgress, 1);
    const remainingProgress = 100 - currentProgress;
    setEstimatedTimeRemaining(Math.round(avgTimePerPercent * remainingProgress));
  }, [currentProgress, workflowType, execution.variables]);

  // Real-time updates simulation
  useEffect(() => {
    if (!realTimeUpdates) return;

    const interval = setInterval(() => {
      setCurrentProgress(prev => {
        const newProgress = Math.min(prev + Math.random() * 5, 100);
        
        // Check for milestone reached
        if (Math.floor(newProgress / 25) > Math.floor(prev / 25)) {
          const milestoneIndex = Math.floor(newProgress / 25) - 1;
          const milestoneName = ['Foundation Understanding', 'Intermediate Concepts', 'Advanced Mastery', 'Complete Mastery'][milestoneIndex];
          if (milestoneName && onMilestoneReached) {
            onMilestoneReached(milestoneName);
          }
        }
        
        return newProgress;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [realTimeUpdates, onMilestoneReached]);

  const getProgressColor = (progress: number): string => {
    if (progress < 25) return '#ef4444'; // red
    if (progress < 50) return '#f97316'; // orange
    if (progress < 75) return '#eab308'; // yellow
    if (progress < 100) return '#22c55e'; // green
    return '#8b5cf6'; // purple for complete
  };

  const getJungianStageFromProgress = (progress: number): string => {
    if (progress < 25) return 'Unconscious Exploration';
    if (progress < 50) return 'Shadow Recognition';
    if (progress < 75) return 'Anima/Animus Integration';
    return 'Individuation Realization';
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  return (
    <div className="workflow-progress-visualization" data-testid="progress-visualization">
      <div className="progress-header">
        <h3>Learning Progress</h3>
        <div className="view-toggles">
          <button
            className={selectedView === 'overview' ? 'active' : ''}
            onClick={() => setSelectedView('overview')}
            data-testid="overview-view"
          >
            Overview
          </button>
          <button
            className={selectedView === 'detailed' ? 'active' : ''}
            onClick={() => setSelectedView('detailed')}
            data-testid="detailed-view"
          >
            Detailed
          </button>
          <button
            className={selectedView === 'timeline' ? 'active' : ''}
            onClick={() => setSelectedView('timeline')}
            data-testid="timeline-view"
          >
            Timeline
          </button>
        </div>
      </div>

      {/* Main Progress Circle */}
      <div className="main-progress-container" data-testid="main-progress">
        <div className="progress-circle">
          <svg width="200" height="200" viewBox="0 0 200 200">
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="12"
            />
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke={getProgressColor(currentProgress)}
              strokeWidth="12"
              strokeDasharray={`${(currentProgress / 100) * 502.4} 502.4`}
              strokeDashoffset="125.6"
              transform="rotate(-90 100 100)"
              data-testid="progress-arc"
            />
          </svg>
          <div className="progress-content">
            <div className="progress-percentage" data-testid="progress-percentage">
              {Math.round(currentProgress)}%
            </div>
            <div className="progress-label">Complete</div>
            {workflowType === 'student_progress' && (
              <div className="jungian-stage" data-testid="jungian-stage">
                {getJungianStageFromProgress(currentProgress)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Execution Status */}
      <div className="execution-status" data-testid="execution-status">
        <div className={`status-badge status-${execution.status}`}>
          {execution.status.toUpperCase()}
        </div>
        <div className="status-details">
          <div>Current State: {execution.current_state || 'Unknown'}</div>
          {execution.error_message && (
            <div className="error-message" data-testid="error-message">
              Error: {execution.error_message}
            </div>
          )}
        </div>
      </div>

      {/* Time Information */}
      <div className="time-info" data-testid="time-info">
        <div className="time-item">
          <span className="label">Time Spent:</span>
          <span className="value" data-testid="time-spent">
            {formatDuration(execution.variables.timeSpent || 0)}
          </span>
        </div>
        {estimatedTimeRemaining > 0 && currentProgress < 100 && (
          <div className="time-item">
            <span className="label">Estimated Remaining:</span>
            <span className="value" data-testid="estimated-remaining">
              {formatDuration(estimatedTimeRemaining)}
            </span>
          </div>
        )}
        <div className="time-item">
          <span className="label">Started:</span>
          <span className="value" data-testid="start-time">
            {execution.started_at.toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Progress Views */}
      {selectedView === 'overview' && (
        <div className="overview-section" data-testid="overview-section">
          {/* Milestones */}
          <div className="milestones-container">
            <h4>Milestones Reached</h4>
            <div className="milestones-list" data-testid="milestones-list">
              {milestones.map((milestone, index) => (
                <div key={index} className="milestone-item" data-testid={`milestone-${index}`}>
                  <div className="milestone-icon">✓</div>
                  <div className="milestone-name">{milestone}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Achievements */}
          <div className="achievements-container">
            <h4>Achievements Unlocked</h4>
            <div className="achievements-list" data-testid="achievements-list">
              {achievements.map((achievement) => (
                <div 
                  key={achievement.id} 
                  className={`achievement-item achievement-${achievement.rarity}`}
                  data-testid={`achievement-${achievement.id}`}
                >
                  <div className="achievement-icon">{achievement.icon}</div>
                  <div className="achievement-info">
                    <div className="achievement-title">{achievement.title}</div>
                    <div className="achievement-description">{achievement.description}</div>
                    <div className="achievement-points">+{achievement.points} points</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedView === 'detailed' && (
        <div className="detailed-section" data-testid="detailed-section">
          {workflowType === 'student_progress' && (
            <div className="student-progress-details">
              <h4>Progress Breakdown</h4>
              <div className="progress-details">
                <div className="detail-item">
                  <span className="label">Completed Sections:</span>
                  <span className="value" data-testid="completed-sections">
                    {execution.variables.completedSections?.length || 0}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">Current Section:</span>
                  <span className="value" data-testid="current-section">
                    {execution.variables.currentSection || 'N/A'}
                  </span>
                </div>
                {execution.variables.performanceMetrics && (
                  <div className="performance-metrics" data-testid="performance-metrics">
                    <h5>Performance Metrics</h5>
                    <div className="metrics-grid">
                      <div className="metric">
                        <span className="metric-label">Accuracy:</span>
                        <span className="metric-value">
                          {Math.round(execution.variables.performanceMetrics.accuracy * 100)}%
                        </span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Engagement:</span>
                        <span className="metric-value">
                          {Math.round(execution.variables.performanceMetrics.engagement * 100)}%
                        </span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Retention:</span>
                        <span className="metric-value">
                          {Math.round(execution.variables.performanceMetrics.retention * 100)}%
                        </span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Consistency:</span>
                        <span className="metric-value">
                          {Math.round(execution.variables.performanceMetrics.consistency * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {workflowType === 'learning_path' && (
            <div className="learning-path-details">
              <h4>Learning Path Progress</h4>
              <div className="path-details">
                <div className="detail-item">
                  <span className="label">Current Module:</span>
                  <span className="value" data-testid="current-module">
                    {execution.variables.currentModule || 'N/A'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">Completed Modules:</span>
                  <span className="value" data-testid="completed-modules">
                    {execution.variables.completedModules?.length || 0}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">Recommended Next:</span>
                  <span className="value" data-testid="recommended-modules">
                    {execution.variables.recommendedModules?.length || 0} modules
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Jung-specific progress indicators */}
          {workflowType === 'student_progress' && (
            <div className="jung-progress-indicators" data-testid="jung-indicators">
              <h4>Analytical Psychology Progress</h4>
              <div className="jung-concepts">
                <div className="concept-progress">
                  <span className="concept-name">Collective Unconscious</span>
                  <div className="concept-bar">
                    <div 
                      className="concept-fill"
                      style={{ width: `${Math.min(currentProgress * 1.2, 100)}%` }}
                    />
                  </div>
                  <span className="concept-percentage">
                    {Math.min(Math.round(currentProgress * 1.2), 100)}%
                  </span>
                </div>
                <div className="concept-progress">
                  <span className="concept-name">Archetypes</span>
                  <div className="concept-bar">
                    <div 
                      className="concept-fill"
                      style={{ width: `${Math.min(currentProgress * 0.9, 100)}%` }}
                    />
                  </div>
                  <span className="concept-percentage">
                    {Math.min(Math.round(currentProgress * 0.9), 100)}%
                  </span>
                </div>
                <div className="concept-progress">
                  <span className="concept-name">Shadow Work</span>
                  <div className="concept-bar">
                    <div 
                      className="concept-fill"
                      style={{ width: `${Math.min(currentProgress * 0.8, 100)}%` }}
                    />
                  </div>
                  <span className="concept-percentage">
                    {Math.min(Math.round(currentProgress * 0.8), 100)}%
                  </span>
                </div>
                <div className="concept-progress">
                  <span className="concept-name">Individuation</span>
                  <div className="concept-bar">
                    <div 
                      className="concept-fill"
                      style={{ width: `${Math.min(currentProgress * 0.6, 100)}%` }}
                    />
                  </div>
                  <span className="concept-percentage">
                    {Math.min(Math.round(currentProgress * 0.6), 100)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedView === 'timeline' && (
        <div className="timeline-section" data-testid="timeline-section">
          <h4>Progress Timeline</h4>
          <div className="timeline-container">
            {execution.execution_history.map((event, index) => (
              <div key={index} className="timeline-item" data-testid={`timeline-item-${index}`}>
                <div className="timeline-dot" />
                <div className="timeline-content">
                  <div className="timeline-event">{event.event_type}</div>
                  <div className="timeline-time">{event.timestamp.toLocaleString()}</div>
                  {event.event_data && Object.keys(event.event_data).length > 0 && (
                    <div className="timeline-data">
                      <pre>{JSON.stringify(event.event_data, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real-time indicator */}
      {realTimeUpdates && (
        <div className="real-time-indicator" data-testid="real-time-indicator">
          <div className="pulse-dot" />
          <span>Live Updates</span>
        </div>
      )}
    </div>
  );
};

export default WorkflowProgressVisualization;