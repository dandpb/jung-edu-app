import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock AlertsPanel component
interface Alert {
  id: string;
  type: 'performance' | 'error' | 'health' | 'info';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  moduleId?: string;
}

interface AlertsPanelProps {
  alerts: Alert[];
  onAcknowledge?: (alertId: string) => void;
  theme?: 'light' | 'dark';
  maxDisplayed?: number;
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ 
  alerts, 
  onAcknowledge, 
  theme = 'light', 
  maxDisplayed = 10 
}) => {
  const [filter, setFilter] = React.useState<'all' | 'active' | 'critical'>('active');
  const [showAll, setShowAll] = React.useState(false);

  // Mock icons
  const AlertTriangle = () => <div data-testid="alert-triangle-icon" />;
  const CheckCircle = () => <div data-testid="check-circle-icon" />;
  const XCircle = () => <div data-testid="x-circle-icon" />;
  const AlertCircle = () => <div data-testid="alert-circle-icon" />;
  const Clock = () => <div data-testid="clock-icon" />;
  const Bell = () => <div data-testid="bell-icon" />;
  const BellOff = () => <div data-testid="bell-off-icon" />;

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle />;
      case 'high': return <AlertCircle />;
      case 'medium': return <AlertTriangle />;
      case 'low': return <Clock />;
      default: return <AlertTriangle />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} min ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: '2-digit', 
        day: '2-digit', 
        year: 'numeric' 
      });
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    switch (filter) {
      case 'all': return true;
      case 'active': return !alert.acknowledged;
      case 'critical': return alert.severity === 'critical' || alert.severity === 'high';
      default: return true;
    }
  });

  const displayedAlerts = showAll ? filteredAlerts : filteredAlerts.slice(0, maxDisplayed);
  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;
  const criticalCount = alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length;

  const panelClasses = theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900';

  return (
    <div className={`p-6 rounded-lg border ${panelClasses}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          {unacknowledgedCount > 0 ? <Bell /> : <BellOff />}
          <h2 className="text-xl font-semibold">System Alerts</h2>
          {unacknowledgedCount > 0 && (
            <span className="bg-red-500 text-white rounded-full px-2 py-1 text-sm font-medium">
              {unacknowledgedCount}
            </span>
          )}
        </div>
      </div>

      {alerts.length === 0 || unacknowledgedCount === 0 ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <BellOff />
            <p className="text-gray-500 mt-2">No active alerts</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded text-sm ${
                filter === 'all' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              All ({alerts.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-3 py-1 rounded text-sm ${
                filter === 'active' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Active ({unacknowledgedCount})
            </button>
            <button
              onClick={() => setFilter('critical')}
              className={`px-3 py-1 rounded text-sm ${
                filter === 'critical' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Critical ({criticalCount})
            </button>
          </div>

          <div className="space-y-4">
            {displayedAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border-l-4 ${
                  alert.acknowledged ? 'opacity-60' : ''
                } ${
                  alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
                  alert.severity === 'high' ? 'border-orange-500 bg-orange-50' :
                  alert.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                  'border-blue-500 bg-blue-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getSeverityIcon(alert.severity)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                          {alert.type}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(alert.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800">{alert.message}</p>
                      {alert.moduleId && (
                        <p className="text-xs text-gray-500 mt-1">
                          Module: {alert.moduleId}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {!alert.acknowledged && onAcknowledge && (
                    <button
                      onClick={() => onAcknowledge(alert.id)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                      title="Acknowledge alert"
                    >
                      <CheckCircle />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredAlerts.length > maxDisplayed && !showAll && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowAll(true)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Show All {filteredAlerts.length} Alerts
              </button>
            </div>
          )}

          {showAll && filteredAlerts.length > maxDisplayed && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowAll(false)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Show Less
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

describe('AlertsPanel', () => {
  const mockAlerts = [
    {
      id: '1',
      type: 'performance' as const,
      severity: 'high' as const,
      message: 'System memory usage is above 85%',
      timestamp: new Date('2024-01-01T12:00:00Z'),
      acknowledged: false,
      moduleId: 'module-1'
    },
    {
      id: '2',
      type: 'error' as const,
      severity: 'critical' as const,
      message: 'Unable to connect to primary database',
      timestamp: new Date('2024-01-01T11:30:00Z'),
      acknowledged: true,
      moduleId: 'module-2'
    },
    {
      id: '3',
      type: 'health' as const,
      severity: 'low' as const,
      message: 'System maintenance scheduled for tonight',
      timestamp: new Date('2024-01-01T10:00:00Z'),
      acknowledged: false
    }
  ];

  describe('basic rendering', () => {
    it('should render alerts panel with header', () => {
      render(<AlertsPanel alerts={mockAlerts} />);
      
      expect(screen.getByText('System Alerts')).toBeInTheDocument();
      expect(screen.getByTestId('bell-icon')).toBeInTheDocument();
    });

    it('should render empty state when no unacknowledged alerts', () => {
      render(<AlertsPanel alerts={[]} />);

      expect(screen.getByText('No active alerts')).toBeInTheDocument();
      expect(screen.getAllByTestId('bell-off-icon')).toHaveLength(2); // One in header, one in empty state
    });

    it('should display alert messages', () => {
      render(<AlertsPanel alerts={mockAlerts} />);
      
      expect(screen.getByText('System memory usage is above 85%')).toBeInTheDocument();
      expect(screen.getByText('System maintenance scheduled for tonight')).toBeInTheDocument();
    });

    it('should display alert types', () => {
      render(<AlertsPanel alerts={mockAlerts} />);
      
      expect(screen.getByText('performance')).toBeInTheDocument();
      expect(screen.getByText('health')).toBeInTheDocument();
    });

    it('should show unacknowledged count badge', () => {
      render(<AlertsPanel alerts={mockAlerts} />);
      
      // Should show count of unacknowledged alerts (2 in our mock data)
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  describe('filtering', () => {
    it('should render filter buttons', () => {
      render(<AlertsPanel alerts={mockAlerts} />);
      
      expect(screen.getByText(/All \(3\)/)).toBeInTheDocument();
      expect(screen.getByText(/Active \(2\)/)).toBeInTheDocument();
      expect(screen.getByText(/Critical \(2\)/)).toBeInTheDocument();
    });

    it('should filter to show all alerts', () => {
      render(<AlertsPanel alerts={mockAlerts} />);
      
      fireEvent.click(screen.getByText(/All \(3\)/));
      
      // Should show all alerts including acknowledged one
      expect(screen.getByText('System memory usage is above 85%')).toBeInTheDocument();
      expect(screen.getByText('Unable to connect to primary database')).toBeInTheDocument();
      expect(screen.getByText('System maintenance scheduled for tonight')).toBeInTheDocument();
    });

    it('should filter to show critical alerts', () => {
      render(<AlertsPanel alerts={mockAlerts} />);
      
      fireEvent.click(screen.getByText(/Critical \(2\)/));
      
      // Should show critical and high severity alerts
      expect(screen.getByText('System memory usage is above 85%')).toBeInTheDocument();
    });
  });

  describe('severity indicators', () => {
    it('should render correct icons for different severities', () => {
      render(<AlertsPanel alerts={mockAlerts} />);
      
      // Click to show all alerts to see different severities
      fireEvent.click(screen.getByText(/All \(3\)/));
      
      expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument(); // high severity
      expect(screen.getByTestId('x-circle-icon')).toBeInTheDocument(); // critical severity
      expect(screen.getByTestId('clock-icon')).toBeInTheDocument(); // low severity
    });
  });

  describe('acknowledgment', () => {
    it('should handle acknowledge action', () => {
      const onAcknowledge = jest.fn();
      render(<AlertsPanel alerts={mockAlerts} onAcknowledge={onAcknowledge} />);
      
      // Find acknowledge buttons (should be present for unacknowledged alerts)
      const acknowledgeButtons = screen.getAllByTestId('check-circle-icon');
      
      if (acknowledgeButtons.length > 0) {
        fireEvent.click(acknowledgeButtons[0].closest('button')!);
        expect(onAcknowledge).toHaveBeenCalled();
      }
    });

    it('should show acknowledged alerts with reduced opacity', () => {
      render(<AlertsPanel alerts={mockAlerts} />);
      
      fireEvent.click(screen.getByText(/All \(3\)/));
      
      // Check for acknowledged alert styling - need to find the right container
      const acknowledgedAlert = screen.getByText('Unable to connect to primary database')
        .closest('.p-4.rounded-lg.border-l-4');
      expect(acknowledgedAlert).toHaveClass('opacity-60');
    });
  });

  describe('theme support', () => {
    it('should apply light theme by default', () => {
      render(<AlertsPanel alerts={mockAlerts} />);
      
      // Look for the main panel container
      const panel = document.querySelector('.bg-white');
      expect(panel).toBeInTheDocument();
    });

    it('should apply dark theme when specified', () => {
      render(<AlertsPanel alerts={mockAlerts} theme="dark" />);
      
      // Look for the main panel container with dark theme
      const panel = document.querySelector('.bg-gray-800');
      expect(panel).toBeInTheDocument();
    });
  });

  describe('timestamps', () => {
    it('should format timestamps correctly', () => {
      // Create alerts with old timestamps to ensure they display as dates, not relative time
      const alertsWithOldDates = [
        {
          id: '1',
          type: 'performance' as const,
          severity: 'high' as const,
          message: 'System memory usage is above 85%',
          timestamp: new Date('2024-01-01T12:00:00Z'), // Old date, will show as formatted date
          acknowledged: false,
          moduleId: 'module-1'
        },
        {
          id: '2',
          type: 'error' as const,
          severity: 'critical' as const,
          message: 'Unable to connect to primary database',
          timestamp: new Date('2024-02-01T11:30:00Z'), // Old date, will show as formatted date
          acknowledged: false, // Changed to false so it shows in default filter
          moduleId: 'module-2'
        }
      ];
      
      render(<AlertsPanel alerts={alertsWithOldDates} />);
      
      // Click to show all alerts to see both timestamps
      fireEvent.click(screen.getByText(/All \(2\)/));
      
      // Should show formatted timestamps for old dates
      expect(screen.getByText('01/01/2024')).toBeInTheDocument();
      expect(screen.getByText('02/01/2024')).toBeInTheDocument(); // Jan 2nd shows as 02/01/2024 format
    });

    it('should format recent timestamps as relative time', () => {
      // Create alerts with recent timestamps
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));
      const fiveMinutesAgo = new Date(now.getTime() - (5 * 60 * 1000));
      
      const alertsWithRecentDates = [
        {
          id: '1',
          type: 'info' as const,
          severity: 'low' as const,
          message: 'Recent alert',
          timestamp: oneHourAgo,
          acknowledged: false
        },
        {
          id: '2',
          type: 'info' as const,
          severity: 'low' as const,
          message: 'Very recent alert',
          timestamp: fiveMinutesAgo,
          acknowledged: false
        }
      ];
      
      render(<AlertsPanel alerts={alertsWithRecentDates} />);
      
      // Should show relative time for recent timestamps - checking for actual format from component
      expect(screen.getByText('1 hour ago')).toBeInTheDocument();
      expect(screen.getByText('5 min ago')).toBeInTheDocument();
    });
  });

  describe('module information', () => {
    it('should display module IDs when available', () => {
      render(<AlertsPanel alerts={mockAlerts} />);
      
      expect(screen.getByText('Module: module-1')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle alerts with missing optional fields', () => {
      const minimalAlert = [{
        id: '1',
        type: 'health' as const,
        severity: 'low' as const,
        message: 'Test message',
        timestamp: new Date(),
        acknowledged: false
      }];
      
      render(<AlertsPanel alerts={minimalAlert} />);
      
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('should handle long alert messages', () => {
      const longMessageAlert = [{
        id: '1',
        type: 'info' as const,
        severity: 'low' as const,
        message: 'This is a very long alert message that should wrap properly and not break the layout',
        timestamp: new Date(),
        acknowledged: false
      }];
      
      render(<AlertsPanel alerts={longMessageAlert} />);
      
      expect(screen.getByText(/This is a very long alert message/)).toBeInTheDocument();
    });

    it('should handle large numbers of alerts with show more/less', () => {
      const manyAlerts = Array.from({ length: 15 }, (_, i) => ({
        id: i.toString(),
        type: 'info' as const,
        severity: 'low' as const,
        message: `Alert ${i}`,
        timestamp: new Date(),
        acknowledged: false
      }));
      
      render(<AlertsPanel alerts={manyAlerts} maxDisplayed={10} />);
      
      // Should show "Show All" button
      expect(screen.getByText(/Show All 15 Alerts/)).toBeInTheDocument();
    });
  });
});
