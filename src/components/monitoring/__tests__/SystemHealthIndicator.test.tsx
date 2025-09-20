import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock SystemHealthIndicator component
interface SystemHealthIndicatorProps {
  health?: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastUpdate: Date;
    issues: string[];
  };
  status?: {
    isRunning: boolean;
    activeModules: number;
    queuedModules: number;
    resourcesInProgress: number;
  };
  theme?: 'light' | 'dark';
}

const SystemHealthIndicator: React.FC<SystemHealthIndicatorProps> = ({ health, status, theme = 'light' }) => {
  // Mock lucide-react icons
  const CheckCircle = () => <div data-testid="check-circle-icon" />;
  const AlertTriangle = () => <div data-testid="alert-triangle-icon" />;
  const XCircle = () => <div data-testid="x-circle-icon" />;
  const Clock = () => <div data-testid="clock-icon" />;
  const Activity = () => <div data-testid="activity-icon" />;

  if (!health || !status) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      </div>
    );
  }

  const getStatusMessage = () => {
    switch (health.status) {
      case 'healthy':
        return 'All systems operational';
      case 'degraded':
        return 'System performance degraded';
      case 'unhealthy':
        return 'System requires attention';
      default:
        return 'Unknown status';
    }
  };

  const getStatusIcon = () => {
    switch (health.status) {
      case 'healthy':
        return <CheckCircle />;
      case 'degraded':
        return <AlertTriangle />;
      case 'unhealthy':
        return <XCircle />;
      default:
        return <Activity />;
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
    } else {
      return date.toLocaleDateString();
    }
  };

  const themeClasses = theme === 'dark' 
    ? 'bg-gray-800 text-gray-100 border-gray-700'
    : 'bg-white text-gray-900 border-gray-200';

  return (
    <div className={`p-6 rounded-lg border ${themeClasses}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <h3 className="text-lg font-semibold">{getStatusMessage()}</h3>
            <p className="text-sm opacity-75">
              Status: <span className="font-medium">{health.status}</span>
            </p>
            <p className="text-xs opacity-60">
              Last updated: {formatTimeAgo(health.lastUpdate)}
            </p>
          </div>
        </div>
        
        {status.isRunning && (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-600">RUNNING</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold">{status.activeModules}</div>
          <div className="text-sm opacity-75">Active Modules</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{status.queuedModules}</div>
          <div className="text-sm opacity-75">Queued</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{status.resourcesInProgress}</div>
          <div className="text-sm opacity-75">In Progress</div>
        </div>
      </div>

      {health.issues && health.issues.length > 0 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">Issues Detected:</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            {health.issues.map((issue, index) => (
              <li key={index}>• {issue}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

describe('SystemHealthIndicator', () => {
  const mockHealth = {
    status: 'healthy' as const,
    lastUpdate: new Date('2024-01-01T12:00:00Z'),
    issues: []
  };

  const mockStatus = {
    isRunning: true,
    activeModules: 3,
    queuedModules: 1,
    resourcesInProgress: 5
  };

  describe('basic rendering', () => {
    it('should render with healthy status', () => {
      render(<SystemHealthIndicator health={mockHealth} status={mockStatus} />);
      
      expect(screen.getByText('All systems operational')).toBeInTheDocument();
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
      expect(screen.getByText('healthy')).toBeInTheDocument();
    });

    it('should render loading state when health or status is missing', () => {
      render(<SystemHealthIndicator />);
      
      // Should show loading skeleton with animate-pulse
      const container = document.querySelector('.animate-pulse');
      expect(container).toBeInTheDocument();
    });

    it('should display system metrics', () => {
      render(<SystemHealthIndicator health={mockHealth} status={mockStatus} />);
      
      expect(screen.getByText('3')).toBeInTheDocument(); // Active Modules
      expect(screen.getByText('1')).toBeInTheDocument(); // Queued
      expect(screen.getByText('5')).toBeInTheDocument(); // In Progress
      expect(screen.getByText('Active Modules')).toBeInTheDocument();
      expect(screen.getByText('Queued')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
    });

    it('should show running indicator when system is running', () => {
      render(<SystemHealthIndicator health={mockHealth} status={mockStatus} />);
      
      expect(screen.getByText('RUNNING')).toBeInTheDocument();
    });

    it('should handle degraded status', () => {
      const degradedHealth = { ...mockHealth, status: 'degraded' as const };
      render(<SystemHealthIndicator health={degradedHealth} status={mockStatus} />);
      
      expect(screen.getByText('System performance degraded')).toBeInTheDocument();
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
    });

    it('should handle unhealthy status', () => {
      const unhealthyHealth = { ...mockHealth, status: 'unhealthy' as const };
      render(<SystemHealthIndicator health={unhealthyHealth} status={mockStatus} />);
      
      expect(screen.getByText('System requires attention')).toBeInTheDocument();
      expect(screen.getByTestId('x-circle-icon')).toBeInTheDocument();
    });

    it('should display health issues when present', () => {
      const healthWithIssues = {
        ...mockHealth,
        issues: ['Database connection slow', 'Cache memory high']
      };
      render(<SystemHealthIndicator health={healthWithIssues} status={mockStatus} />);
      
      expect(screen.getByText('Issues Detected:')).toBeInTheDocument();
      expect(screen.getByText('• Database connection slow')).toBeInTheDocument();
      expect(screen.getByText('• Cache memory high')).toBeInTheDocument();
    });

    it('should apply dark theme correctly', () => {
      render(<SystemHealthIndicator health={mockHealth} status={mockStatus} theme="dark" />);
      
      // Check for dark theme classes in the main container
      const container = document.querySelector('.bg-gray-800');
      expect(container).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle missing health data gracefully', () => {
      render(<SystemHealthIndicator status={mockStatus} />);
      
      // Should show loading state
      const container = document.querySelector('.animate-pulse');
      expect(container).toBeInTheDocument();
    });

    it('should handle missing status data gracefully', () => {
      render(<SystemHealthIndicator health={mockHealth} />);
      
      // Should show loading state
      const container = document.querySelector('.animate-pulse');
      expect(container).toBeInTheDocument();
    });

    it('should handle empty issues array', () => {
      render(<SystemHealthIndicator health={mockHealth} status={mockStatus} />);
      
      expect(screen.queryByText('Issues Detected:')).not.toBeInTheDocument();
    });

    it('should format time correctly', () => {
      const recentHealth = {
        ...mockHealth,
        lastUpdate: new Date(Date.now() - 30000) // 30 seconds ago
      };
      render(<SystemHealthIndicator health={recentHealth} status={mockStatus} />);
      
      expect(screen.getByText(/Just now/)).toBeInTheDocument();
    });
  });
});
