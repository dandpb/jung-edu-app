/**
 * Component Tests for Workflow Progress Visualization
 * Tests progress tracking, visualization components, and Jung-specific progress indicators
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock WorkflowProgressVisualization component
interface WorkflowProgressVisualizationProps {
  execution: {
    id: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    variables: any;
    started_at: Date;
    execution_history: any[];
  };
  workflowType: 'student_progress' | 'learning_path' | 'assessment' | 'adaptive_content';
  showDetailed?: boolean;
  realTimeUpdates?: boolean;
  onMilestoneReached?: (milestone: string) => void;
}

const WorkflowProgressVisualization: React.FC<WorkflowProgressVisualizationProps> = ({
  execution,
  workflowType,
  showDetailed = false,
  realTimeUpdates = false,
  onMilestoneReached
}) => {
  const [selectedView, setSelectedView] = React.useState<'overview' | 'detailed' | 'timeline'>('overview');
  const [currentProgress, setCurrentProgress] = React.useState<number>(0);

  React.useEffect(() => {
    if (workflowType === 'student_progress') {
      setCurrentProgress(execution.variables.progress || 0);
    } else if (workflowType === 'learning_path') {
      const totalModules = (execution.variables.completedModules?.length || 0) + (execution.variables.recommendedModules?.length || 0);
      const completedPercentage = totalModules > 0 ? (execution.variables.completedModules?.length || 0) / totalModules * 100 : 0;
      setCurrentProgress(Math.round(completedPercentage));
    }
  }, [execution.variables, workflowType]);

  const getJungianStage = (progress: number): string => {
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

  const milestones = React.useMemo(() => {
    const result = [];
    if (currentProgress >= 25) result.push('Foundation Understanding');
    if (currentProgress >= 50) result.push('Intermediate Concepts');
    if (currentProgress >= 75) result.push('Advanced Mastery');
    if (currentProgress === 100) result.push('Complete Mastery');
    return result;
  }, [currentProgress]);

  const achievements = execution.variables.achievements || [];

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
          <div className="progress-content">
            <div className="progress-percentage" data-testid="progress-percentage">
              {Math.round(currentProgress)}%
            </div>
            <div className="progress-label">Complete</div>
            {workflowType === 'student_progress' && (
              <div className="jungian-stage" data-testid="jungian-stage">
                {getJungianStage(currentProgress)}
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
        {execution.error_message && (
          <div className="error-message" data-testid="error-message">
            Error: {execution.error_message}
          </div>
        )}
      </div>

      {/* Time Information */}
      <div className="time-info" data-testid="time-info">
        <div className="time-item">
          <span className="label">Time Spent:</span>
          <span className="value" data-testid="time-spent">
            {formatDuration(execution.variables.timeSpent || 0)}
          </span>
        </div>
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
              {achievements.map((achievement: any) => (
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
                  <span className="concept-percentage">
                    {Math.min(Math.round(currentProgress * 1.2), 100)}%
                  </span>
                </div>
                <div className="concept-progress">
                  <span className="concept-name">Archetypes</span>
                  <span className="concept-percentage">
                    {Math.min(Math.round(currentProgress * 0.9), 100)}%
                  </span>
                </div>
                <div className="concept-progress">
                  <span className="concept-name">Shadow Work</span>
                  <span className="concept-percentage">
                    {Math.min(Math.round(currentProgress * 0.8), 100)}%
                  </span>
                </div>
                <div className="concept-progress">
                  <span className="concept-name">Individuation</span>
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
            {execution.execution_history.map((event: any, index: number) => (
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
  let mockExecution: any;
  let mockStudentProgressData: any;
  let mockLearningPathData: any;

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
          rarity: 'common'
        }
      ],
      performanceMetrics: {
        accuracy: 0.85,
        speed: 0.75,
        consistency: 0.90,
        engagement: 0.95,
        retention: 0.80
      }
    };

    mockLearningPathData = {
      userId: 'user-1',
      pathId: 'analytical-psychology-path',
      currentModule: 'shadow-work-advanced',
      completedModules: ['psychology-foundations', 'jung-intro', 'collective-unconscious'],
      recommendedModules: ['anima-animus', 'individuation-practice']
    };

    mockExecution = {
      id: 'execution-1',
      status: 'running',
      variables: mockStudentProgressData,
      execution_history: [
        {
          event_type: 'workflow.started',
          event_data: { initialProgress: 0 },
          timestamp: new Date(Date.now() - 2400000)
        },
        {
          event_type: 'section.completed',
          event_data: { section: 'introduction', progress: 25 },
          timestamp: new Date(Date.now() - 1800000)
        }
      ],
      started_at: new Date(Date.now() - 2400000)
    };
  });

  describe('Basic Rendering', () => {
    test('should render progress visualization with main elements', () => {
      render(
        <WorkflowProgressVisualization 
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
        <WorkflowProgressVisualization 
          execution={mockExecution} 
          workflowType="student_progress" 
        />
      );

      expect(screen.getByTestId('progress-percentage')).toHaveTextContent('65%');
    });

    test('should show Jungian stage for student progress workflow', () => {
      render(
        <WorkflowProgressVisualization 
          execution={mockExecution} 
          workflowType="student_progress" 
        />
      );

      expect(screen.getByTestId('jungian-stage')).toHaveTextContent('Anima/Animus Integration');
    });

    test('should display execution status correctly', () => {
      render(
        <WorkflowProgressVisualization 
          execution={mockExecution} 
          workflowType="student_progress" 
        />
      );

      const statusBadge = screen.getByTestId('execution-status');
      expect(statusBadge).toHaveTextContent('RUNNING');
    });

    test('should show error message for failed executions', () => {
      const failedExecution = {
        ...mockExecution,
        status: 'failed',
        error_message: 'Plugin timeout occurred'
      };

      render(
        <WorkflowProgressVisualization 
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
        <WorkflowProgressVisualization 
          execution={mockExecution} 
          workflowType="student_progress" 
        />
      );

      expect(screen.getByTestId('time-spent')).toHaveTextContent('40m 0s');
    });

    test('should display start time', () => {
      render(
        <WorkflowProgressVisualization 
          execution={mockExecution} 
          workflowType="student_progress" 
        />
      );

      expect(screen.getByTestId('start-time')).toBeInTheDocument();
    });
  });

  describe('View Switching', () => {
    test('should switch to detailed view when detailed button is clicked', () => {
      render(
        <WorkflowProgressVisualization 
          execution={mockExecution} 
          workflowType="student_progress" 
        />
      );

      fireEvent.click(screen.getByTestId('detailed-view'));

      expect(screen.getByTestId('detailed-section')).toBeInTheDocument();
      expect(screen.queryByTestId('overview-section')).not.toBeInTheDocument();
    });

    test('should switch to timeline view when timeline button is clicked', () => {
      render(
        <WorkflowProgressVisualization 
          execution={mockExecution} 
          workflowType="student_progress" 
        />
      );

      fireEvent.click(screen.getByTestId('timeline-view'));

      expect(screen.getByTestId('timeline-section')).toBeInTheDocument();
      expect(screen.queryByTestId('overview-section')).not.toBeInTheDocument();
    });

    test('should highlight active view button', () => {
      render(
        <WorkflowProgressVisualization 
          execution={mockExecution} 
          workflowType="student_progress" 
        />
      );

      const detailedButton = screen.getByTestId('detailed-view');
      fireEvent.click(detailedButton);

      expect(detailedButton).toHaveClass('active');
      expect(screen.getByTestId('overview-view')).not.toHaveClass('active');
    });
  });

  describe('Overview Section', () => {
    test('should display milestones in overview', () => {
      render(
        <WorkflowProgressVisualization 
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
        <WorkflowProgressVisualization 
          execution={mockExecution} 
          workflowType="student_progress" 
        />
      );

      expect(screen.getByTestId('achievements-list')).toBeInTheDocument();
      expect(screen.getByTestId('achievement-midway-achiever')).toBeInTheDocument();
    });
  });

  describe('Detailed Section', () => {
    test('should show student progress details', () => {
      render(
        <WorkflowProgressVisualization 
          execution={mockExecution} 
          workflowType="student_progress" 
        />
      );

      fireEvent.click(screen.getByTestId('detailed-view'));

      expect(screen.getByTestId('completed-sections')).toHaveTextContent('3');
      expect(screen.getByTestId('current-section')).toHaveTextContent('shadow-work');
    });

    test('should display performance metrics', () => {
      render(
        <WorkflowProgressVisualization 
          execution={mockExecution} 
          workflowType="student_progress" 
        />
      );

      fireEvent.click(screen.getByTestId('detailed-view'));

      expect(screen.getByTestId('performance-metrics')).toBeInTheDocument();
      expect(screen.getByTestId('performance-metrics')).toHaveTextContent('85%'); // Accuracy
      expect(screen.getByTestId('performance-metrics')).toHaveTextContent('95%'); // Engagement
    });

    test('should show learning path details for learning path workflow', () => {
      const pathExecution = {
        ...mockExecution,
        variables: mockLearningPathData
      };

      render(
        <WorkflowProgressVisualization 
          execution={pathExecution} 
          workflowType="learning_path" 
        />
      );

      fireEvent.click(screen.getByTestId('detailed-view'));

      expect(screen.getByTestId('current-module')).toHaveTextContent('shadow-work-advanced');
      expect(screen.getByTestId('completed-modules')).toHaveTextContent('3');
      expect(screen.getByTestId('recommended-modules')).toHaveTextContent('2 modules');
    });

    test('should display Jung-specific progress indicators', () => {
      render(
        <WorkflowProgressVisualization 
          execution={mockExecution} 
          workflowType="student_progress" 
        />
      );

      fireEvent.click(screen.getByTestId('detailed-view'));

      expect(screen.getByTestId('jung-indicators')).toBeInTheDocument();
      expect(screen.getByTestId('jung-indicators')).toHaveTextContent('Collective Unconscious');
      expect(screen.getByTestId('jung-indicators')).toHaveTextContent('Archetypes');
      expect(screen.getByTestId('jung-indicators')).toHaveTextContent('Shadow Work');
      expect(screen.getByTestId('jung-indicators')).toHaveTextContent('Individuation');
    });
  });

  describe('Timeline Section', () => {
    test('should display execution history in timeline', () => {
      render(
        <WorkflowProgressVisualization 
          execution={mockExecution} 
          workflowType="student_progress" 
        />
      );

      fireEvent.click(screen.getByTestId('timeline-view'));

      expect(screen.getByTestId('timeline-section')).toBeInTheDocument();
      expect(screen.getByTestId('timeline-item-0')).toHaveTextContent('workflow.started');
      expect(screen.getByTestId('timeline-item-1')).toHaveTextContent('section.completed');
    });

    test('should show event data in timeline items', () => {
      render(
        <WorkflowProgressVisualization 
          execution={mockExecution} 
          workflowType="student_progress" 
        />
      );

      fireEvent.click(screen.getByTestId('timeline-view'));

      const timelineItem = screen.getByTestId('timeline-item-1');
      expect(timelineItem).toHaveTextContent('"section": "introduction"');
      expect(timelineItem).toHaveTextContent('"progress": 25');
    });
  });

  describe('Real-time Updates', () => {
    test('should show real-time indicator when enabled', () => {
      render(
        <WorkflowProgressVisualization 
          execution={mockExecution} 
          workflowType="student_progress" 
          realTimeUpdates 
        />
      );

      expect(screen.getByTestId('real-time-indicator')).toBeInTheDocument();
      expect(screen.getByTestId('real-time-indicator')).toHaveTextContent('Live Updates');
    });

    test('should not show real-time indicator when disabled', () => {
      render(
        <WorkflowProgressVisualization 
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
        <WorkflowProgressVisualization 
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
        <WorkflowProgressVisualization 
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
        <WorkflowProgressVisualization 
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
          <WorkflowProgressVisualization 
            execution={stageExecution} 
            workflowType="student_progress" 
          />
        );

        expect(screen.getByTestId('jungian-stage')).toHaveTextContent(stage);
        unmount(); // Clean up to avoid multiple elements
      });
    });

    test('should display Jung-specific concept progress bars', () => {
      render(
        <WorkflowProgressVisualization 
          execution={mockExecution} 
          workflowType="student_progress" 
        />
      );

      fireEvent.click(screen.getByTestId('detailed-view'));

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
  });

  describe('Error Handling', () => {
    test('should handle missing performance metrics gracefully', () => {
      const noMetricsExecution = {
        ...mockExecution,
        variables: { 
          ...mockStudentProgressData, 
          performanceMetrics: undefined 
        }
      };

      render(
        <WorkflowProgressVisualization 
          execution={noMetricsExecution} 
          workflowType="student_progress" 
        />
      );

      fireEvent.click(screen.getByTestId('detailed-view'));

      // Should not crash and should not show performance metrics
      expect(screen.queryByTestId('performance-metrics')).not.toBeInTheDocument();
    });

    test('should handle empty execution history', () => {
      const emptyHistoryExecution = {
        ...mockExecution,
        execution_history: []
      };

      render(
        <WorkflowProgressVisualization 
          execution={emptyHistoryExecution} 
          workflowType="student_progress" 
        />
      );

      fireEvent.click(screen.getByTestId('timeline-view'));

      // Should not crash with empty history
      expect(screen.getByTestId('timeline-section')).toBeInTheDocument();
    });

    test('should handle undefined time spent', () => {
      const noTimeExecution = {
        ...mockExecution,
        variables: { ...mockStudentProgressData, timeSpent: undefined }
      };

      render(
        <WorkflowProgressVisualization 
          execution={noTimeExecution} 
          workflowType="student_progress" 
        />
      );

      expect(screen.getByTestId('time-spent')).toHaveTextContent('0s');
    });
  });
});
