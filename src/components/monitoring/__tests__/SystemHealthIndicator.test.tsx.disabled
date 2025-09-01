import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SystemHealthIndicator } from '../SystemHealthIndicator';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  CheckCircle: ({ className, ...props }: any) => <div data-testid="check-circle-icon" className={className} {...props} />,
  AlertTriangle: ({ className, ...props }: any) => <div data-testid="alert-triangle-icon" className={className} {...props} />,
  XCircle: ({ className, ...props }: any) => <div data-testid="x-circle-icon" className={className} {...props} />,
  Clock: ({ className, ...props }: any) => <div data-testid="clock-icon" className={className} {...props} />,
  Activity: ({ className, ...props }: any) => <div data-testid="activity-icon" className={className} {...props} />
}));

// Mock the monitoring types
jest.mock('../../../services/resourcePipeline/monitoring', () => ({
  PipelineMetrics: {},
  PipelineStatus: {}
}));

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
      expect(screen.getByText('Database connection slow')).toBeInTheDocument();
      expect(screen.getByText('Cache memory high')).toBeInTheDocument();
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
      
      expect(screen.getByText('Just now')).toBeInTheDocument();
    });
  });
});