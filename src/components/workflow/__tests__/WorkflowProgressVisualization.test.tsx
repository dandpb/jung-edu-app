/**
 * Component Tests for Workflow Progress Visualization
 * Tests progress tracking, visualization components, and Jung-specific progress indicators
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { 
  WorkflowExecution,
  ExecutionStatus,
  StudentProgressWorkflowData,
  LearningPathWorkflowData,
  Achievement 
} from '../../../types/workflow';

// Mock the progress visualization component
const MockWorkflowProgressVisualization: React.FC<{
  execution: WorkflowExecution;
  workflowType: 'student_progress' | 'learning_path' | 'assessment' | 'adaptive_content';
  showDetailed?: boolean;
  realTimeUpdates?: boolean;
  onMilestoneReached?: (milestone: string) => void;
}> = ({ 
  execution, 
  workflowType, 
  showDetailed = false, 
  realTimeUpdates = false,
  onMilestoneReached 
}) => {
  const [currentProgress, setCurrentProgress] = React.useState<number>(0);
  const [milestones, setMilestones] = React.useState<string[]>([]);
  const [achievements, setAchievements] = React.useState<Achievement[]>([]);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = React.useState<number>(0);
  const [selectedView, setSelectedView] = React.useState<'overview' | 'detailed' | 'timeline'>('overview');

  // Calculate progress based on workflow type and execution data
  React.useEffect(() => {
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
  React.useEffect(() => {
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

describe('WorkflowProgressVisualization Component', () => {
  let mockExecution: WorkflowExecution;
  let mockStudentProgressData: StudentProgressWorkflowData;
  let mockLearningPathData: LearningPathWorkflowData;

  beforeEach(() => {
    mockStudentProgressData = {
      userId: 'user-1',
      moduleId: 'jung-psychology-101',
      progress: 65,
      timeSpent: 2400, // 40 minutes
      completedSections: ['introduction', 'collective-unconscious', 'archetypes'],
      currentSection: 'shadow-work',
      achievements: [
        {
          id: 'midway-achiever',
          title: 'Halfway There',
          description: 'Completed 50% of the learning journey',
          icon: '🎯',
          category: 'progress',
          points: 150,
          rarity: 'common',
          unlockedAt: new Date(),
          requirements: []
        },
        {
          id: 'advanced-scholar',
          title: 'Advanced Scholar',
          description: 'Demonstrated deep understanding of concepts',
          icon: '🎓',
          category: 'mastery',
          points: 300,
          rarity: 'rare',
          unlockedAt: new Date(),
          requirements: []
        }
      ],
      performanceMetrics: {
        accuracy: 0.85,
        speed: 0.75,
        consistency: 0.90,
        engagement: 0.95,
        retention: 0.80,
        difficulty_preference: 0.70
      }
    };

    mockLearningPathData = {
      userId: 'user-1',
      pathId: 'analytical-psychology-path',
      currentModule: 'shadow-work-advanced',
      completedModules: ['psychology-foundations', 'jung-intro', 'collective-unconscious'],
      recommendedModules: ['anima-animus', 'individuation-practice'],
      adaptationTriggers: [],
      personalizations: []
    };

    mockExecution = {
      id: 'execution-1',
      workflow_id: 'student-progress-workflow',
      user_id: 'user-1',
      status: 'running',
      current_state: 'tracking-progress',
      variables: mockStudentProgressData,
      execution_history: [
        {
          id: 'event-1',
          execution_id: 'execution-1',
          event_type: 'workflow.started',
          event_data: { initialProgress: 0 },
          timestamp: new Date(Date.now() - 2400000) // 40 minutes ago
        },
        {
          id: 'event-2',
          execution_id: 'execution-1',
          event_type: 'section.completed',
          event_data: { section: 'introduction', progress: 25 },
          timestamp: new Date(Date.now() - 1800000) // 30 minutes ago
        },
        {
          id: 'event-3',
          execution_id: 'execution-1',
          event_type: 'milestone.reached',
          event_data: { milestone: 'Foundation Understanding', progress: 50 },
          timestamp: new Date(Date.now() - 600000) // 10 minutes ago
        }
      ],
      retry_count: 0,
      started_at: new Date(Date.now() - 2400000),
      created_at: new Date(Date.now() - 2400000),
      updated_at: new Date(Date.now() - 300000)
    };
  });

  describe('Basic Rendering', () => {
    test('should render progress visualization with main elements', () => {
      render(
        <MockWorkflowProgressVisualization 
          execution={mockExecution} 
          workflowType="student_progress" 
        />
      );

      expect(screen.getByTestId('progress-visualization')).toBeInTheDocument();
      expect(screen.getByTestId('main-progress')).toBeInTheDocument();
      expect(screen.getByTestId('execution-status')).toBeInTheDocument();
      expect(screen.getByTestId('time-info')).toBeInTheDocument();
    });

    test('should display correct progress percentage', () => {
      render(
        <MockWorkflowProgressVisualization 
          execution={mockExecution} 
          workflowType="student_progress" 
        />
      );

      expect(screen.getByTestId('progress-percentage')).toHaveTextContent('65%');
    });

    test('should show Jungian stage for student progress workflow', () => {
      render(
        <MockWorkflowProgressVisualization 
          execution={mockExecution} 
          workflowType="student_progress" 
        />
      );

      expect(screen.getByTestId('jungian-stage')).toHaveTextContent('Anima/Animus Integration');
    });

    test('should display execution status correctly', () => {
      render(
        <MockWorkflowProgressVisualization 
          execution={mockExecution} 
          workflowType="student_progress" 
        />
      );

      const statusBadge = screen.getByTestId('execution-status');
      expect(statusBadge).toHaveTextContent('RUNNING');
      expect(statusBadge).toHaveTextContent('tracking-progress');
    });

    test('should show error message for failed executions', () => {
      const failedExecution = {
        ...mockExecution,
        status: 'failed' as const,
        error_message: 'Plugin timeout occurred'
      };

      render(
        <MockWorkflowProgressVisualization 
          execution={failedExecution} 
          workflowType="student_progress" 
        />
      );

      expect(screen.getByTestId('error-message')).toHaveTextContent('Error: Plugin timeout occurred');
    });
  });

  describe('Time Information', () => {
    test('should display time spent correctly', () => {
      render(
        <MockWorkflowProgressVisualization 
          execution={mockExecution} 
          workflowType="student_progress" 
        />
      );

      expect(screen.getByTestId('time-spent')).toHaveTextContent('40m 0s');
    });

    test('should show estimated remaining time', () => {
      render(
        <MockWorkflowProgressVisualization 
          execution={mockExecution} 
          workflowType="student_progress" 
        />
      );

      expect(screen.getByTestId('estimated-remaining')).toBeInTheDocument();
    });

    test('should display start time', () => {
      render(
        <MockWorkflowProgressVisualization 
          execution={mockExecution} 
          workflowType="student_progress" 
        />
      );

      expect(screen.getByTestId('start-time')).toBeInTheDocument();
    });

    test('should format hours correctly for long durations', () => {
      const longExecution = {
        ...mockExecution,
        variables: { ...mockStudentProgressData, timeSpent: 7200 } // 2 hours
      };

      render(
        <MockWorkflowProgressVisualization 
          execution={longExecution} 
          workflowType="student_progress" 
        />
      );

      expect(screen.getByTestId('time-spent')).toHaveTextContent('2h 0m');
    });
  });

  describe('View Switching', () => {
    test('should switch to detailed view when detailed button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <MockWorkflowProgressVisualization 
          execution={mockExecution} 
          workflowType="student_progress" 
        />
      );

      await user.click(screen.getByTestId('detailed-view'));

      expect(screen.getByTestId('detailed-section')).toBeInTheDocument();
      expect(screen.queryByTestId('overview-section')).not.toBeInTheDocument();
    });

    test('should switch to timeline view when timeline button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <MockWorkflowProgressVisualization 
          execution={mockExecution} 
          workflowType="student_progress" 
        />
      );

      await user.click(screen.getByTestId('timeline-view'));

      expect(screen.getByTestId('timeline-section')).toBeInTheDocument();
      expect(screen.queryByTestId('overview-section')).not.toBeInTheDocument();
    });

    test('should highlight active view button', async () => {
      const user = userEvent.setup();
      render(
        <MockWorkflowProgressVisualization 
          execution={mockExecution} 
          workflowType="student_progress" 
        />
      );

      const detailedButton = screen.getByTestId('detailed-view');
      await user.click(detailedButton);

      expect(detailedButton).toHaveClass('active');
      expect(screen.getByTestId('overview-view')).not.toHaveClass('active');
    });
  });

  describe('Overview Section', () => {
    test('should display milestones in overview', () => {
      render(
        <MockWorkflowProgressVisualization 
          execution={mockExecution} 
          workflowType="student_progress" 
        />
      );

      expect(screen.getByTestId('milestones-list')).toBeInTheDocument();
      expect(screen.getByTestId('milestone-0')).toHaveTextContent('Foundation Understanding');
      expect(screen.getByTestId('milestone-1')).toHaveTextContent('Intermediate Concepts');
    });

    test('should display achievements in overview', () => {
      render(
        <MockWorkflowProgressVisualization 
          execution={mockExecution} 
          workflowType="student_progress" 
        />
      );

      expect(screen.getByTestId('achievements-list')).toBeInTheDocument();
      expect(screen.getByTestId('achievement-midway-achiever')).toBeInTheDocument();
      expect(screen.getByTestId('achievement-advanced-scholar')).toBeInTheDocument();
    });

    test('should show different milestones based on progress level', () => {
      const lowProgressExecution = {
        ...mockExecution,
        variables: { ...mockStudentProgressData, progress: 15 }
      };

      render(
        <MockWorkflowProgressVisualization 
          execution={lowProgressExecution} 
          workflowType="student_progress" 
        />
      );

      // Should not show intermediate milestones for low progress
      expect(screen.queryByTestId('milestone-1')).not.toBeInTheDocument();
    });
  });

  describe('Detailed Section', () => {
    test('should show student progress details', async () => {
      const user = userEvent.setup();
      render(
        <MockWorkflowProgressVisualization 
          execution={mockExecution} 
          workflowType="student_progress" 
        />
      );

      await user.click(screen.getByTestId('detailed-view'));

      expect(screen.getByTestId('completed-sections')).toHaveTextContent('3');
      expect(screen.getByTestId('current-section')).toHaveTextContent('shadow-work');
    });

    test('should display performance metrics', async () => {
      const user = userEvent.setup();
      render(
        <MockWorkflowProgressVisualization 
          execution={mockExecution} 
          workflowType="student_progress" 
        />
      );

      await user.click(screen.getByTestId('detailed-view'));

      expect(screen.getByTestId('performance-metrics')).toBeInTheDocument();
      // Performance metrics should be displayed as percentages
      expect(screen.getByTestId('performance-metrics')).toHaveTextContent('85%'); // Accuracy
      expect(screen.getByTestId('performance-metrics')).toHaveTextContent('95%'); // Engagement
    });

    test('should show learning path details for learning path workflow', async () => {
      const user = userEvent.setup();
      const pathExecution = {
        ...mockExecution,
        variables: mockLearningPathData
      };

      render(
        <MockWorkflowProgressVisualization 
          execution={pathExecution} 
          workflowType="learning_path" 
        />
      );

      await user.click(screen.getByTestId('detailed-view'));

      expect(screen.getByTestId('current-module')).toHaveTextContent('shadow-work-advanced');
      expect(screen.getByTestId('completed-modules')).toHaveTextContent('3');
      expect(screen.getByTestId('recommended-modules')).toHaveTextContent('2 modules');
    });

    test('should display Jung-specific progress indicators', async () => {
      const user = userEvent.setup();
      render(
        <MockWorkflowProgressVisualization 
          execution={mockExecution} 
          workflowType="student_progress" 
        />
      );

      await user.click(screen.getByTestId('detailed-view'));

      expect(screen.getByTestId('jung-indicators')).toBeInTheDocument();
      expect(screen.getByTestId('jung-indicators')).toHaveTextContent('Collective Unconscious');
      expect(screen.getByTestId('jung-indicators')).toHaveTextContent('Archetypes');
      expect(screen.getByTestId('jung-indicators')).toHaveTextContent('Shadow Work');
      expect(screen.getByTestId('jung-indicators')).toHaveTextContent('Individuation');
    });
  });

  describe('Timeline Section', () => {
    test('should display execution history in timeline', async () => {
      const user = userEvent.setup();
      render(
        <MockWorkflowProgressVisualization 
          execution={mockExecution} 
          workflowType="student_progress" 
        />
      );

      await user.click(screen.getByTestId('timeline-view'));

      expect(screen.getByTestId('timeline-section')).toBeInTheDocument();
      expect(screen.getByTestId('timeline-item-0')).toHaveTextContent('workflow.started');
      expect(screen.getByTestId('timeline-item-1')).toHaveTextContent('section.completed');
      expect(screen.getByTestId('timeline-item-2')).toHaveTextContent('milestone.reached');
    });

    test('should show event data in timeline items', async () => {
      const user = userEvent.setup();
      render(
        <MockWorkflowProgressVisualization 
          execution={mockExecution} 
          workflowType="student_progress" 
        />
      );

      await user.click(screen.getByTestId('timeline-view'));

      const timelineItem = screen.getByTestId('timeline-item-1');
      expect(timelineItem).toHaveTextContent('"section": "introduction"');
      expect(timelineItem).toHaveTextContent('"progress": 25');
    });

    test('should format timeline timestamps correctly', async () => {
      const user = userEvent.setup();
      render(
        <MockWorkflowProgressVisualization 
          execution={mockExecution} 
          workflowType="student_progress" 
        />
      );

      await user.click(screen.getByTestId('timeline-view'));

      // Should display formatted timestamps
      expect(screen.getByTestId('timeline-item-0')).toHaveTextContent('/');
      expect(screen.getByTestId('timeline-item-0')).toHaveTextContent(':');
    });
  });

  describe('Real-time Updates', () => {
    test('should show real-time indicator when enabled', () => {
      render(
        <MockWorkflowProgressVisualization 
          execution={mockExecution} 
          workflowType="student_progress" 
          realTimeUpdates 
        />
      );

      expect(screen.getByTestId('real-time-indicator')).toBeInTheDocument();
      expect(screen.getByTestId('real-time-indicator')).toHaveTextContent('Live Updates');
    });

    test('should call milestone callback when milestone is reached', async () => {
      const onMilestoneReached = jest.fn();
      
      render(
        <MockWorkflowProgressVisualization 
          execution={mockExecution} 
          workflowType="student_progress" 
          realTimeUpdates 
          onMilestoneReached={onMilestoneReached}
        />
      );

      // Wait for real-time updates to trigger
      await waitFor(() => {
        expect(onMilestoneReached).toHaveBeenCalled();
      }, { timeout: 5000 });
    });

    test('should not show real-time indicator when disabled', () => {
      render(
        <MockWorkflowProgressVisualization 
          execution={mockExecution} 
          workflowType="student_progress" 
        />
      );

      expect(screen.queryByTestId('real-time-indicator')).not.toBeInTheDocument();
    });
  });

  describe('Progress Calculations', () => {
    test('should calculate progress correctly for learning path workflow', () => {
      const pathExecution = {
        ...mockExecution,
        variables: mockLearningPathData
      };

      render(
        <MockWorkflowProgressVisualization 
          execution={pathExecution} 
          workflowType="learning_path" 
        />
      );

      // Should calculate based on completed vs total modules
      // 3 completed / 5 total = 60%
      expect(screen.getByTestId('progress-percentage')).toHaveTextContent('60%');
    });

    test('should handle zero progress gracefully', () => {
      const zeroProgressExecution = {
        ...mockExecution,
        variables: { ...mockStudentProgressData, progress: 0 }
      };

      render(
        <MockWorkflowProgressVisualization 
          execution={zeroProgressExecution} 
          workflowType="student_progress" 
        />
      );

      expect(screen.getByTestId('progress-percentage')).toHaveTextContent('0%');
      expect(screen.getByTestId('jungian-stage')).toHaveTextContent('Unconscious Exploration');
    });

    test('should handle complete progress correctly', () => {
      const completeExecution = {
        ...mockExecution,
        variables: { ...mockStudentProgressData, progress: 100 }
      };

      render(
        <MockWorkflowProgressVisualization 
          execution={completeExecution} 
          workflowType="student_progress" 
        />
      );

      expect(screen.getByTestId('progress-percentage')).toHaveTextContent('100%');
      expect(screen.getByTestId('jungian-stage')).toHaveTextContent('Individuation Realization');
    });
  });

  describe('Jungian Psychology Features', () => {
    test('should show appropriate Jungian stages based on progress', () => {
      const stages = [
        { progress: 10, stage: 'Unconscious Exploration' },
        { progress: 35, stage: 'Shadow Recognition' },
        { progress: 60, stage: 'Anima/Animus Integration' },
        { progress: 95, stage: 'Individuation Realization' }
      ];

      stages.forEach(({ progress, stage }) => {
        const stageExecution = {
          ...mockExecution,
          variables: { ...mockStudentProgressData, progress }
        };

        const { unmount } = render(
          <MockWorkflowProgressVisualization 
            execution={stageExecution} 
            workflowType="student_progress" 
          />
        );

        expect(screen.getByTestId('jungian-stage')).toHaveTextContent(stage);
        unmount(); // Clean up to avoid multiple elements
      });
    });

    test('should display Jung-specific concept progress bars', async () => {
      const user = userEvent.setup();
      render(
        <MockWorkflowProgressVisualization 
          execution={mockExecution} 
          workflowType="student_progress" 
        />
      );

      await user.click(screen.getByTestId('detailed-view'));

      const jungIndicators = screen.getByTestId('jung-indicators');
      expect(jungIndicators).toHaveTextContent('Collective Unconscious');
      expect(jungIndicators).toHaveTextContent('Archetypes');
      expect(jungIndicators).toHaveTextContent('Shadow Work');
      expect(jungIndicators).toHaveTextContent('Individuation');

      // Should show percentage progress for each concept
      expect(jungIndicators).toHaveTextContent('78%'); // 65 * 1.2 = 78%
      expect(jungIndicators).toHaveTextContent('59%'); // 65 * 0.9 = 58.5% rounds to 59%
      expect(jungIndicators).toHaveTextContent('52%'); // 65 * 0.8 = 52%
      expect(jungIndicators).toHaveTextContent('39%'); // 65 * 0.6 = 39%
    });

    test('should show Jung-specific achievements', () => {
      const jungianExecution = {
        ...mockExecution,
        variables: { ...mockStudentProgressData, progress: 100 }
      };

      render(
        <MockWorkflowProgressVisualization 
          execution={jungianExecution} 
          workflowType="student_progress" 
        />
      );

      expect(screen.getByTestId('achievement-jungian-master')).toBeInTheDocument();
      expect(screen.getByTestId('achievement-jungian-master')).toHaveTextContent('Jungian Psychology Master');
      expect(screen.getByTestId('achievement-jungian-master')).toHaveTextContent('🏆');
    });
  });

  describe('Error Handling', () => {
    test('should handle missing performance metrics gracefully', async () => {
      const user = userEvent.setup();
      const noMetricsExecution = {
        ...mockExecution,
        variables: { 
          ...mockStudentProgressData, 
          performanceMetrics: undefined 
        }
      };

      render(
        <MockWorkflowProgressVisualization 
          execution={noMetricsExecution} 
          workflowType="student_progress" 
        />
      );

      await user.click(screen.getByTestId('detailed-view'));

      // Should not crash and should not show performance metrics
      expect(screen.queryByTestId('performance-metrics')).not.toBeInTheDocument();
    });

    test('should handle empty execution history', async () => {
      const user = userEvent.setup();
      const emptyHistoryExecution = {
        ...mockExecution,
        execution_history: []
      };

      render(
        <MockWorkflowProgressVisualization 
          execution={emptyHistoryExecution} 
          workflowType="student_progress" 
        />
      );

      await user.click(screen.getByTestId('timeline-view'));

      // Should not crash with empty history
      expect(screen.getByTestId('timeline-section')).toBeInTheDocument();
    });

    test('should handle undefined time spent', () => {
      const noTimeExecution = {
        ...mockExecution,
        variables: { ...mockStudentProgressData, timeSpent: undefined }
      };

      render(
        <MockWorkflowProgressVisualization 
          execution={noTimeExecution} 
          workflowType="student_progress" 
        />
      );

      expect(screen.getByTestId('time-spent')).toHaveTextContent('0s');
    });
  });
});