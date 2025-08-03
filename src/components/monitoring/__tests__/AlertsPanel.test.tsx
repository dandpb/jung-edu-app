import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AlertsPanel } from '../AlertsPanel';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  AlertTriangle: ({ className, ...props }: any) => <div data-testid="alert-triangle-icon" className={className} {...props} />,
  CheckCircle: ({ className, ...props }: any) => <div data-testid="check-circle-icon" className={className} {...props} />,
  XCircle: ({ className, ...props }: any) => <div data-testid="x-circle-icon" className={className} {...props} />,
  AlertCircle: ({ className, ...props }: any) => <div data-testid="alert-circle-icon" className={className} {...props} />,
  Clock: ({ className, ...props }: any) => <div data-testid="clock-icon" className={className} {...props} />,
  Bell: ({ className, ...props }: any) => <div data-testid="bell-icon" className={className} {...props} />,
  BellOff: ({ className, ...props }: any) => <div data-testid="bell-off-icon" className={className} {...props} />
}));

// Mock the monitoring types
jest.mock('../../../services/resourcePipeline/monitoring', () => ({
  PerformanceAlert: {}
}));

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
      expect(screen.getByTestId('bell-off-icon')).toBeInTheDocument();
    });

    it('should display alert messages', () => {
      render(<AlertsPanel alerts={mockAlerts} />);
      
      expect(screen.getByText('System memory usage is above 85%')).toBeInTheDocument();
      expect(screen.getByText('System maintenance scheduled for tonight')).toBeInTheDocument();
    });

    it('should display alert types', () => {
      render(<AlertsPanel alerts={mockAlerts} />);
      
      expect(screen.getByText('PERFORMANCE')).toBeInTheDocument();
      expect(screen.getByText('HEALTH')).toBeInTheDocument();
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
      expect(screen.getByText(/Critical \(1\)/)).toBeInTheDocument();
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
      
      fireEvent.click(screen.getByText(/Critical \(1\)/));
      
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
          timestamp: new Date('2024-01-02T11:30:00Z'), // Old date, will show as formatted date
          acknowledged: false, // Changed to false so it shows in default filter
          moduleId: 'module-2'
        }
      ];
      
      render(<AlertsPanel alerts={alertsWithOldDates} />);
      
      // Click to show all alerts to see both timestamps
      fireEvent.click(screen.getByText(/All \(2\)/));
      
      // Should show formatted timestamps for old dates
      expect(screen.getByText('1/1/2024')).toBeInTheDocument();
      expect(screen.getByText('1/2/2024')).toBeInTheDocument(); // Jan 2nd shows as 1/2/2024 format
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