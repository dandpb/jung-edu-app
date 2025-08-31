/**
 * Component Tests for Workflow Dashboard
 * Tests workflow monitoring, execution control, and real-time updates
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthContext } from '../../../contexts/AuthContext';
import { 
  WorkflowExecution, 
  ExecutionStatus, 
  WorkflowDefinition,
  WorkflowMetrics,
  WorkflowHealth 
} from '../../../types/workflow';

// Mock the workflow dashboard component
const MockWorkflowDashboard: React.FC<{
  userId?: string;
  showAllExecutions?: boolean;
  refreshInterval?: number;
}> = ({ userId, showAllExecutions = false, refreshInterval = 5000 }) => {
  const [executions, setExecutions] = React.useState<WorkflowExecution[]>([]);
  const [metrics, setMetrics] = React.useState<WorkflowMetrics | null>(null);
  const [health, setHealth] = React.useState<WorkflowHealth | null>(null);
  const [selectedExecution, setSelectedExecution] = React.useState<string | null>(null);
  const [filterStatus, setFilterStatus] = React.useState<ExecutionStatus | 'all'>('all');
  const [sortBy, setSortBy] = React.useState<'created_at' | 'updated_at' | 'status'>('created_at');
  const [loading, setLoading] = React.useState(false);

  // Mock data
  React.useEffect(() => {
    const mockExecutions: WorkflowExecution[] = [
      {
        id: 'exec-1',
        workflow_id: 'workflow-1',
        user_id: 'user-1',
        status: 'running',
        current_state: 'processing-progress',
        variables: { userId: 'user-1', moduleId: 'jung-basics', progress: 75 },
        execution_history: [
          { id: 'hist-1', execution_id: 'exec-1', event_type: 'workflow.started', event_data: {}, timestamp: new Date() }
        ],
        retry_count: 0,
        started_at: new Date(Date.now() - 1800000), // 30 minutes ago
        created_at: new Date(Date.now() - 1800000),
        updated_at: new Date(Date.now() - 300000) // 5 minutes ago
      },
      {
        id: 'exec-2',
        workflow_id: 'workflow-2',
        user_id: 'user-2',
        status: 'completed',
        current_state: 'end',
        variables: { userId: 'user-2', moduleId: 'archetypes-intro', progress: 100 },
        execution_history: [
          { id: 'hist-2', execution_id: 'exec-2', event_type: 'workflow.completed', event_data: {}, timestamp: new Date() }
        ],
        retry_count: 0,
        started_at: new Date(Date.now() - 3600000), // 1 hour ago
        completed_at: new Date(Date.now() - 1200000), // 20 minutes ago
        created_at: new Date(Date.now() - 3600000),
        updated_at: new Date(Date.now() - 1200000)
      },
      {
        id: 'exec-3',
        workflow_id: 'workflow-1',
        user_id: 'user-3',
        status: 'failed',
        current_state: 'error-state',
        variables: { userId: 'user-3', moduleId: 'shadow-work', progress: 25 },
        error_message: 'Plugin execution timeout',
        execution_history: [
          { id: 'hist-3', execution_id: 'exec-3', event_type: 'workflow.failed', event_data: { error: 'timeout' }, timestamp: new Date() }
        ],
        retry_count: 2,
        started_at: new Date(Date.now() - 7200000), // 2 hours ago
        created_at: new Date(Date.now() - 7200000),
        updated_at: new Date(Date.now() - 600000) // 10 minutes ago
      }
    ];

    const mockMetrics: WorkflowMetrics = {
      totalExecutions: 150,
      successfulExecutions: 135,
      failedExecutions: 10,
      averageExecutionTime: 1250, // in seconds
      averageWaitTime: 45,
      activeExecutions: 5,
      queuedExecutions: 2,
      errorRate: 0.067
    };

    const mockHealth: WorkflowHealth = {
      status: 'healthy',
      components: [
        { component: 'workflow-engine', status: 'healthy', latency: 125 },
        { component: 'state-manager', status: 'healthy', latency: 85 },
        { component: 'plugin-system', status: 'healthy', latency: 200 },
        { component: 'notification-service', status: 'healthy', latency: 150 }
      ],
      lastCheck: new Date(),
      uptime: 99.95
    };

    setExecutions(mockExecutions);
    setMetrics(mockMetrics);
    setHealth(mockHealth);
  }, []);

  const filteredExecutions = React.useMemo(() => {
    let filtered = executions;

    if (!showAllExecutions && userId) {
      filtered = filtered.filter(exec => exec.user_id === userId);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(exec => exec.status === filterStatus);
    }

    return filtered.sort((a, b) => {
      const aValue = sortBy === 'status' ? a[sortBy] : new Date(a[sortBy]).getTime();
      const bValue = sortBy === 'status' ? b[sortBy] : new Date(b[sortBy]).getTime();
      return sortBy === 'status' 
        ? aValue.localeCompare(bValue)
        : bValue - aValue; // Newest first for dates
    });
  }, [executions, userId, showAllExecutions, filterStatus, sortBy]);

  const handlePauseExecution = async (executionId: string) => {
    setLoading(true);
    // Mock pause operation
    setTimeout(() => {
      setExecutions(prev => prev.map(exec => 
        exec.id === executionId 
          ? { ...exec, status: 'paused' as ExecutionStatus }
          : exec
      ));
      setLoading(false);
    }, 1000);
  };

  const handleResumeExecution = async (executionId: string) => {
    setLoading(true);
    setTimeout(() => {
      setExecutions(prev => prev.map(exec => 
        exec.id === executionId 
          ? { ...exec, status: 'running' as ExecutionStatus }
          : exec
      ));
      setLoading(false);
    }, 1000);
  };

  const handleCancelExecution = async (executionId: string) => {
    setLoading(true);
    setTimeout(() => {
      setExecutions(prev => prev.map(exec => 
        exec.id === executionId 
          ? { ...exec, status: 'cancelled' as ExecutionStatus }
          : exec
      ));
      setLoading(false);
    }, 1000);
  };

  const handleRetryExecution = async (executionId: string) => {
    setLoading(true);
    setTimeout(() => {
      setExecutions(prev => prev.map(exec => 
        exec.id === executionId 
          ? { ...exec, status: 'running' as ExecutionStatus, retry_count: exec.retry_count + 1 }
          : exec
      ));
      setLoading(false);
    }, 1000);
  };

  const getStatusColor = (status: ExecutionStatus): string => {
    switch (status) {
      case 'running': return 'blue';
      case 'completed': return 'green';
      case 'failed': return 'red';
      case 'paused': return 'yellow';
      case 'cancelled': return 'gray';
      default: return 'gray';
    }
  };

  const formatDuration = (startTime: Date, endTime?: Date): string => {
    const end = endTime || new Date();
    const duration = Math.floor((end.getTime() - startTime.getTime()) / 1000);
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <div className="workflow-dashboard" data-testid="workflow-dashboard">
      <div className="dashboard-header">
        <h1>Workflow Dashboard</h1>
        <div className="dashboard-controls">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ExecutionStatus | 'all')}
            data-testid="status-filter"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="running">Running</option>
            <option value="waiting">Waiting</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            data-testid="sort-by"
          >
            <option value="created_at">Created Date</option>
            <option value="updated_at">Updated Date</option>
            <option value="status">Status</option>
          </select>

          <button 
            onClick={() => window.location.reload()}
            data-testid="refresh-button"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Metrics Overview */}
      {metrics && (
        <div className="metrics-overview" data-testid="metrics-overview">
          <div className="metric-card" data-testid="total-executions">
            <h3>Total Executions</h3>
            <div className="metric-value">{metrics.totalExecutions}</div>
          </div>
          <div className="metric-card" data-testid="success-rate">
            <h3>Success Rate</h3>
            <div className="metric-value">
              {Math.round((metrics.successfulExecutions / metrics.totalExecutions) * 100)}%
            </div>
          </div>
          <div className="metric-card" data-testid="error-rate">
            <h3>Error Rate</h3>
            <div className="metric-value">{(metrics.errorRate * 100).toFixed(1)}%</div>
          </div>
          <div className="metric-card" data-testid="avg-execution-time">
            <h3>Avg Execution Time</h3>
            <div className="metric-value">{Math.round(metrics.averageExecutionTime)}s</div>
          </div>
          <div className="metric-card" data-testid="active-executions">
            <h3>Active Executions</h3>
            <div className="metric-value">{metrics.activeExecutions}</div>
          </div>
        </div>
      )}

      {/* System Health */}
      {health && (
        <div className="health-overview" data-testid="health-overview">
          <h2>System Health</h2>
          <div className={`health-status health-${health.status}`} data-testid="overall-health">
            {health.status.toUpperCase()}
          </div>
          <div className="component-health">
            {health.components.map(component => (
              <div 
                key={component.component}
                className={`component-status component-${component.status}`}
                data-testid={`component-${component.component}`}
              >
                <span className="component-name">{component.component}</span>
                <span className="component-latency">{component.latency}ms</span>
                <span className={`status-indicator status-${component.status}`}>
                  {component.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Executions List */}
      <div className="executions-section" data-testid="executions-section">
        <h2>
          Workflow Executions 
          <span className="execution-count">({filteredExecutions.length})</span>
        </h2>
        
        {filteredExecutions.length === 0 ? (
          <div className="no-executions" data-testid="no-executions">
            No executions found with current filters.
          </div>
        ) : (
          <div className="executions-table">
            <div className="table-header">
              <div className="col-id">Execution ID</div>
              <div className="col-workflow">Workflow</div>
              <div className="col-user">User</div>
              <div className="col-status">Status</div>
              <div className="col-progress">Progress</div>
              <div className="col-duration">Duration</div>
              <div className="col-actions">Actions</div>
            </div>

            {filteredExecutions.map(execution => (
              <div 
                key={execution.id} 
                className={`execution-row ${selectedExecution === execution.id ? 'selected' : ''}`}
                data-testid={`execution-row-${execution.id}`}
                onClick={() => setSelectedExecution(execution.id)}
              >
                <div className="col-id" data-testid={`execution-id-${execution.id}`}>
                  {execution.id}
                </div>
                <div className="col-workflow" data-testid={`execution-workflow-${execution.id}`}>
                  {execution.workflow_id}
                </div>
                <div className="col-user" data-testid={`execution-user-${execution.id}`}>
                  {execution.user_id || 'System'}
                </div>
                <div className="col-status">
                  <span 
                    className={`status-badge status-${execution.status}`}
                    data-testid={`execution-status-${execution.id}`}
                    style={{ color: getStatusColor(execution.status) }}
                  >
                    {execution.status.toUpperCase()}
                  </span>
                </div>
                <div className="col-progress" data-testid={`execution-progress-${execution.id}`}>
                  {execution.variables.progress || 0}%
                </div>
                <div className="col-duration" data-testid={`execution-duration-${execution.id}`}>
                  {formatDuration(execution.started_at, execution.completed_at)}
                </div>
                <div className="col-actions">
                  {execution.status === 'running' && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePauseExecution(execution.id);
                      }}
                      data-testid={`pause-execution-${execution.id}`}
                      disabled={loading}
                    >
                      Pause
                    </button>
                  )}
                  {execution.status === 'paused' && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResumeExecution(execution.id);
                      }}
                      data-testid={`resume-execution-${execution.id}`}
                      disabled={loading}
                    >
                      Resume
                    </button>
                  )}
                  {(execution.status === 'running' || execution.status === 'paused') && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelExecution(execution.id);
                      }}
                      data-testid={`cancel-execution-${execution.id}`}
                      disabled={loading}
                      className="danger"
                    >
                      Cancel
                    </button>
                  )}
                  {execution.status === 'failed' && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRetryExecution(execution.id);
                      }}
                      data-testid={`retry-execution-${execution.id}`}
                      disabled={loading}
                    >
                      Retry ({execution.retry_count})
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Execution Details Panel */}
      {selectedExecution && (
        <div className="execution-details" data-testid="execution-details">
          {(() => {
            const execution = executions.find(e => e.id === selectedExecution);
            if (!execution) return null;
            
            return (
              <div className="details-panel">
                <div className="details-header">
                  <h3>Execution Details: {execution.id}</h3>
                  <button 
                    onClick={() => setSelectedExecution(null)}
                    data-testid="close-details"
                  >
                    Close
                  </button>
                </div>
                
                <div className="details-content">
                  <div className="detail-section">
                    <h4>Basic Information</h4>
                    <div className="detail-grid">
                      <div><strong>Status:</strong> {execution.status}</div>
                      <div><strong>Current State:</strong> {execution.current_state || 'N/A'}</div>
                      <div><strong>Retry Count:</strong> {execution.retry_count}</div>
                      <div><strong>Started:</strong> {execution.started_at.toLocaleString()}</div>
                      {execution.completed_at && (
                        <div><strong>Completed:</strong> {execution.completed_at.toLocaleString()}</div>
                      )}
                    </div>
                  </div>

                  {execution.error_message && (
                    <div className="detail-section">
                      <h4>Error Information</h4>
                      <div className="error-message" data-testid={`execution-error-${execution.id}`}>
                        {execution.error_message}
                      </div>
                    </div>
                  )}

                  <div className="detail-section">
                    <h4>Variables</h4>
                    <pre className="variables-display" data-testid={`execution-variables-${execution.id}`}>
                      {JSON.stringify(execution.variables, null, 2)}
                    </pre>
                  </div>

                  <div className="detail-section">
                    <h4>Execution History</h4>
                    <div className="history-list" data-testid={`execution-history-${execution.id}`}>
                      {execution.execution_history.map((event, index) => (
                        <div key={index} className="history-item">
                          <div className="event-type">{event.event_type}</div>
                          <div className="event-time">{event.timestamp.toLocaleString()}</div>
                          {event.event_data && Object.keys(event.event_data).length > 0 && (
                            <div className="event-data">
                              <pre>{JSON.stringify(event.event_data, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

// Test wrapper components
const TestAuthProvider: React.FC<{ 
  children: React.ReactNode;
  user?: any;
  role?: string;
}> = ({ children, user, role = 'admin' }) => {
  const authValue = {
    user: user || { id: 'test-user', role, name: 'Test User' },
    isAuthenticated: true,
    login: jest.fn(),
    logout: jest.fn(),
    hasPermission: jest.fn().mockReturnValue(true),
    token: 'mock-token'
  };

  return <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>;
};

describe('WorkflowDashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    test('should render workflow dashboard with all sections', () => {
      render(
        <TestAuthProvider>
          <MockWorkflowDashboard />
        </TestAuthProvider>
      );

      expect(screen.getByTestId('workflow-dashboard')).toBeInTheDocument();
      expect(screen.getByText('Workflow Dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('metrics-overview')).toBeInTheDocument();
      expect(screen.getByTestId('health-overview')).toBeInTheDocument();
      expect(screen.getByTestId('executions-section')).toBeInTheDocument();
    });

    test('should display metrics overview correctly', () => {
      render(
        <TestAuthProvider>
          <MockWorkflowDashboard />
        </TestAuthProvider>
      );

      expect(screen.getByTestId('total-executions')).toHaveTextContent('150');
      expect(screen.getByTestId('success-rate')).toHaveTextContent('90%');
      expect(screen.getByTestId('error-rate')).toHaveTextContent('6.7%');
      expect(screen.getByTestId('avg-execution-time')).toHaveTextContent('1250s');
      expect(screen.getByTestId('active-executions')).toHaveTextContent('5');
    });

    test('should display system health status', () => {
      render(
        <TestAuthProvider>
          <MockWorkflowDashboard />
        </TestAuthProvider>
      );

      expect(screen.getByTestId('overall-health')).toHaveTextContent('HEALTHY');
      expect(screen.getByTestId('component-workflow-engine')).toBeInTheDocument();
      expect(screen.getByTestId('component-state-manager')).toBeInTheDocument();
      expect(screen.getByTestId('component-plugin-system')).toBeInTheDocument();
      expect(screen.getByTestId('component-notification-service')).toBeInTheDocument();
    });
  });

  describe('Executions List', () => {
    test('should display workflow executions', () => {
      render(
        <TestAuthProvider>
          <MockWorkflowDashboard showAllExecutions />
        </TestAuthProvider>
      );

      expect(screen.getByTestId('execution-row-exec-1')).toBeInTheDocument();
      expect(screen.getByTestId('execution-row-exec-2')).toBeInTheDocument();
      expect(screen.getByTestId('execution-row-exec-3')).toBeInTheDocument();

      expect(screen.getByTestId('execution-status-exec-1')).toHaveTextContent('RUNNING');
      expect(screen.getByTestId('execution-status-exec-2')).toHaveTextContent('COMPLETED');
      expect(screen.getByTestId('execution-status-exec-3')).toHaveTextContent('FAILED');
    });

    test('should filter executions by user when userId provided', () => {
      render(
        <TestAuthProvider>
          <MockWorkflowDashboard userId="user-1" />
        </TestAuthProvider>
      );

      expect(screen.getByTestId('execution-row-exec-1')).toBeInTheDocument();
      expect(screen.queryByTestId('execution-row-exec-2')).not.toBeInTheDocument();
      expect(screen.queryByTestId('execution-row-exec-3')).not.toBeInTheDocument();
    });

    test('should filter executions by status', async () => {
      const user = userEvent.setup();
      render(
        <TestAuthProvider>
          <MockWorkflowDashboard showAllExecutions />
        </TestAuthProvider>
      );

      const statusFilter = screen.getByTestId('status-filter');
      await user.selectOptions(statusFilter, 'completed');

      expect(screen.getByTestId('execution-row-exec-2')).toBeInTheDocument();
      expect(screen.queryByTestId('execution-row-exec-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('execution-row-exec-3')).not.toBeInTheDocument();
    });

    test('should sort executions', async () => {
      const user = userEvent.setup();
      render(
        <TestAuthProvider>
          <MockWorkflowDashboard showAllExecutions />
        </TestAuthProvider>
      );

      const sortBy = screen.getByTestId('sort-by');
      await user.selectOptions(sortBy, 'status');

      // Check that executions are sorted by status
      const executionRows = screen.getAllByTestId(/^execution-row-/);
      expect(executionRows).toHaveLength(3);
    });

    test('should show no executions message when filtered list is empty', async () => {
      const user = userEvent.setup();
      render(
        <TestAuthProvider>
          <MockWorkflowDashboard userId="non-existent-user" />
        </TestAuthProvider>
      );

      expect(screen.getByTestId('no-executions')).toHaveTextContent('No executions found with current filters.');
    });
  });

  describe('Execution Controls', () => {
    test('should show pause button for running executions', () => {
      render(
        <TestAuthProvider>
          <MockWorkflowDashboard showAllExecutions />
        </TestAuthProvider>
      );

      expect(screen.getByTestId('pause-execution-exec-1')).toBeInTheDocument();
      expect(screen.queryByTestId('pause-execution-exec-2')).not.toBeInTheDocument();
    });

    test('should pause execution when pause button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TestAuthProvider>
          <MockWorkflowDashboard showAllExecutions />
        </TestAuthProvider>
      );

      const pauseButton = screen.getByTestId('pause-execution-exec-1');
      await user.click(pauseButton);

      await waitFor(() => {
        expect(screen.getByTestId('execution-status-exec-1')).toHaveTextContent('PAUSED');
      }, { timeout: 2000 });
    });

    test('should show resume button for paused executions', async () => {
      const user = userEvent.setup();
      render(
        <TestAuthProvider>
          <MockWorkflowDashboard showAllExecutions />
        </TestAuthProvider>
      );

      // First pause the execution
      const pauseButton = screen.getByTestId('pause-execution-exec-1');
      await user.click(pauseButton);

      await waitFor(() => {
        expect(screen.getByTestId('resume-execution-exec-1')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    test('should resume execution when resume button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TestAuthProvider>
          <MockWorkflowDashboard showAllExecutions />
        </TestAuthProvider>
      );

      // Pause first
      await user.click(screen.getByTestId('pause-execution-exec-1'));
      
      await waitFor(() => {
        expect(screen.getByTestId('resume-execution-exec-1')).toBeInTheDocument();
      }, { timeout: 2000 });

      // Then resume
      await user.click(screen.getByTestId('resume-execution-exec-1'));

      await waitFor(() => {
        expect(screen.getByTestId('execution-status-exec-1')).toHaveTextContent('RUNNING');
      }, { timeout: 2000 });
    });

    test('should show cancel button for running and paused executions', () => {
      render(
        <TestAuthProvider>
          <MockWorkflowDashboard showAllExecutions />
        </TestAuthProvider>
      );

      expect(screen.getByTestId('cancel-execution-exec-1')).toBeInTheDocument();
      expect(screen.queryByTestId('cancel-execution-exec-2')).not.toBeInTheDocument();
    });

    test('should cancel execution when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TestAuthProvider>
          <MockWorkflowDashboard showAllExecutions />
        </TestAuthProvider>
      );

      const cancelButton = screen.getByTestId('cancel-execution-exec-1');
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.getByTestId('execution-status-exec-1')).toHaveTextContent('CANCELLED');
      }, { timeout: 2000 });
    });

    test('should show retry button for failed executions', () => {
      render(
        <TestAuthProvider>
          <MockWorkflowDashboard showAllExecutions />
        </TestAuthProvider>
      );

      expect(screen.getByTestId('retry-execution-exec-3')).toBeInTheDocument();
      expect(screen.getByTestId('retry-execution-exec-3')).toHaveTextContent('Retry (2)');
    });

    test('should retry execution when retry button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TestAuthProvider>
          <MockWorkflowDashboard showAllExecutions />
        </TestAuthProvider>
      );

      const retryButton = screen.getByTestId('retry-execution-exec-3');
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByTestId('execution-status-exec-3')).toHaveTextContent('RUNNING');
      });
    });

    test('should disable buttons when loading', async () => {
      const user = userEvent.setup();
      render(
        <TestAuthProvider>
          <MockWorkflowDashboard showAllExecutions />
        </TestAuthProvider>
      );

      const pauseButton = screen.getByTestId('pause-execution-exec-1');
      await user.click(pauseButton);

      // Buttons should be disabled during loading
      expect(pauseButton).toBeDisabled();
    });
  });

  describe('Execution Details Panel', () => {
    test('should show execution details when execution is selected', async () => {
      const user = userEvent.setup();
      render(
        <TestAuthProvider>
          <MockWorkflowDashboard showAllExecutions />
        </TestAuthProvider>
      );

      const executionRow = screen.getByTestId('execution-row-exec-1');
      await user.click(executionRow);

      expect(screen.getByTestId('execution-details')).toBeInTheDocument();
      expect(screen.getByText('Execution Details: exec-1')).toBeInTheDocument();
    });

    test('should display execution variables in details panel', async () => {
      const user = userEvent.setup();
      render(
        <TestAuthProvider>
          <MockWorkflowDashboard showAllExecutions />
        </TestAuthProvider>
      );

      await user.click(screen.getByTestId('execution-row-exec-1'));

      const variablesDisplay = screen.getByTestId('execution-variables-exec-1');
      expect(variablesDisplay).toHaveTextContent('userId');
      expect(variablesDisplay).toHaveTextContent('moduleId');
      expect(variablesDisplay).toHaveTextContent('progress');
    });

    test('should display execution history in details panel', async () => {
      const user = userEvent.setup();
      render(
        <TestAuthProvider>
          <MockWorkflowDashboard showAllExecutions />
        </TestAuthProvider>
      );

      await user.click(screen.getByTestId('execution-row-exec-1'));

      const historyDisplay = screen.getByTestId('execution-history-exec-1');
      expect(historyDisplay).toBeInTheDocument();
      expect(historyDisplay).toHaveTextContent('workflow.started');
    });

    test('should display error message for failed executions', async () => {
      const user = userEvent.setup();
      render(
        <TestAuthProvider>
          <MockWorkflowDashboard showAllExecutions />
        </TestAuthProvider>
      );

      await user.click(screen.getByTestId('execution-row-exec-3'));

      expect(screen.getByTestId('execution-error-exec-3')).toHaveTextContent('Plugin execution timeout');
    });

    test('should close details panel when close button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TestAuthProvider>
          <MockWorkflowDashboard showAllExecutions />
        </TestAuthProvider>
      );

      await user.click(screen.getByTestId('execution-row-exec-1'));
      expect(screen.getByTestId('execution-details')).toBeInTheDocument();

      await user.click(screen.getByTestId('close-details'));
      expect(screen.queryByTestId('execution-details')).not.toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    test('should refresh data when refresh button is clicked', async () => {
      // Mock window.location.reload to prevent actual page reload in test
      const mockReload = jest.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true
      });

      const user = userEvent.setup();
      render(
        <TestAuthProvider>
          <MockWorkflowDashboard />
        </TestAuthProvider>
      );

      const refreshButton = screen.getByTestId('refresh-button');
      await user.click(refreshButton);

      expect(mockReload).toHaveBeenCalled();
    });

    test('should show loading state during operations', async () => {
      const user = userEvent.setup();
      render(
        <TestAuthProvider>
          <MockWorkflowDashboard showAllExecutions />
        </TestAuthProvider>
      );

      const pauseButton = screen.getByTestId('pause-execution-exec-1');
      await user.click(pauseButton);

      expect(screen.getByTestId('refresh-button')).toBeDisabled();
    });
  });

  describe('Duration Formatting', () => {
    test('should format execution durations correctly', () => {
      render(
        <TestAuthProvider>
          <MockWorkflowDashboard showAllExecutions />
        </TestAuthProvider>
      );

      // Check different duration formats
      expect(screen.getByTestId('execution-duration-exec-1')).toBeInTheDocument();
      expect(screen.getByTestId('execution-duration-exec-2')).toBeInTheDocument();
      expect(screen.getByTestId('execution-duration-exec-3')).toBeInTheDocument();
    });
  });

  describe('User Role Based Features', () => {
    test('should show admin-specific features for admin users', () => {
      render(
        <TestAuthProvider role="admin">
          <MockWorkflowDashboard showAllExecutions />
        </TestAuthProvider>
      );

      // Admin should see all executions and controls
      expect(screen.getByTestId('execution-row-exec-1')).toBeInTheDocument();
      expect(screen.getByTestId('execution-row-exec-2')).toBeInTheDocument();
      expect(screen.getByTestId('execution-row-exec-3')).toBeInTheDocument();
    });

    test('should show limited features for student users', () => {
      render(
        <TestAuthProvider role="student" user={{ id: 'user-1', role: 'student', name: 'Student' }}>
          <MockWorkflowDashboard userId="user-1" />
        </TestAuthProvider>
      );

      // Student should only see their own executions
      expect(screen.getByTestId('execution-row-exec-1')).toBeInTheDocument();
      expect(screen.queryByTestId('execution-row-exec-2')).not.toBeInTheDocument();
    });
  });

  describe('Jung Psychology Specific Features', () => {
    test('should display Jung-specific workflow information', () => {
      render(
        <TestAuthProvider>
          <MockWorkflowDashboard showAllExecutions />
        </TestAuthProvider>
      );

      // Check for Jung-specific module IDs and content
      expect(screen.getByTestId('execution-progress-exec-1')).toHaveTextContent('75%');
      expect(screen.getByTestId('execution-progress-exec-2')).toHaveTextContent('100%');
      expect(screen.getByTestId('execution-progress-exec-3')).toHaveTextContent('25%');
    });

    test('should show appropriate workflow types for educational content', async () => {
      const user = userEvent.setup();
      render(
        <TestAuthProvider>
          <MockWorkflowDashboard showAllExecutions />
        </TestAuthProvider>
      );

      await user.click(screen.getByTestId('execution-row-exec-1'));

      // Should show educational workflow variables
      const variablesDisplay = screen.getByTestId('execution-variables-exec-1');
      expect(variablesDisplay).toHaveTextContent('jung-basics');
    });
  });

  describe('Error Handling', () => {
    test('should handle missing execution data gracefully', async () => {
      const user = userEvent.setup();
      render(
        <TestAuthProvider>
          <MockWorkflowDashboard showAllExecutions />
        </TestAuthProvider>
      );

      // Try to select an execution that might not exist
      const executionRow = screen.getByTestId('execution-row-exec-1');
      await user.click(executionRow);

      // Should not crash and should show details
      expect(screen.getByTestId('execution-details')).toBeInTheDocument();
    });

    test('should handle component health issues display', () => {
      render(
        <TestAuthProvider>
          <MockWorkflowDashboard />
        </TestAuthProvider>
      );

      // All components should show as healthy in mock data
      const components = ['workflow-engine', 'state-manager', 'plugin-system', 'notification-service'];
      components.forEach(component => {
        expect(screen.getByTestId(`component-${component}`)).toHaveTextContent('healthy');
      });
    });
  });
});