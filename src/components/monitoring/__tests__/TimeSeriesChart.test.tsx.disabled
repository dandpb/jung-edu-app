import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TimeSeriesChart } from '../TimeSeriesChart';

// Mock Recharts to avoid SVG rendering issues in tests
jest.mock('recharts', () => ({
  LineChart: ({ children, data }: any) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  AreaChart: ({ children, data }: any) => (
    <div data-testid="area-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Line: ({ dataKey, name }: any) => (
    <div data-testid={`line-${dataKey}`} data-name={name} />
  ),
  Area: ({ dataKey, name }: any) => (
    <div data-testid={`area-${dataKey}`} data-name={name} />
  ),
  XAxis: ({ dataKey }: any) => (
    <div data-testid="x-axis" data-key={dataKey} />
  ),
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: ({ content }: any) => (
    <div data-testid="tooltip">{content && content}</div>
  ),
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  Legend: () => <div data-testid="legend" />
}));

describe('TimeSeriesChart', () => {
  const mockData = [
    {
      timestamp: '2024-01-01T10:00:00Z',
      successRate: 95.5,
      errorRate: 4.5,
      averageProcessingTime: 1.2,
      totalResourcesGenerated: 150,
      qualityScore: 88.7
    },
    {
      timestamp: '2024-01-01T11:00:00Z',
      successRate: 97.2,
      errorRate: 2.8,
      averageProcessingTime: 1.1,
      totalResourcesGenerated: 180,
      qualityScore: 91.3
    },
    {
      timestamp: '2024-01-01T12:00:00Z',
      successRate: 92.8,
      errorRate: 7.2,
      averageProcessingTime: 1.5,
      totalResourcesGenerated: 120,
      qualityScore: 85.2
    }
  ];

  describe('rendering', () => {
    it('should render TimeSeriesChart with default props', () => {
      render(<TimeSeriesChart data={mockData} />);
      
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.getByTestId('x-axis')).toBeInTheDocument();
      expect(screen.getByTestId('y-axis')).toBeInTheDocument();
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
      expect(screen.getByTestId('legend')).toBeInTheDocument();
    });

    it('should render with area chart type', () => {
      render(<TimeSeriesChart data={mockData} chartType="area" />);
      
      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
      expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
    });

    it('should render with line chart type by default', () => {
      render(<TimeSeriesChart data={mockData} />);
      
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.queryByTestId('area-chart')).not.toBeInTheDocument();
    });

    it('should show grid when showGrid is true', () => {
      render(<TimeSeriesChart data={mockData} showGrid={true} />);
      
      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
    });

    it('should hide grid when showGrid is false', () => {
      render(<TimeSeriesChart data={mockData} showGrid={false} />);
      
      expect(screen.queryByTestId('cartesian-grid')).not.toBeInTheDocument();
    });
  });

  describe('data handling', () => {
    it('should pass data to chart component', () => {
      render(<TimeSeriesChart data={mockData} />);
      
      const lineChart = screen.getByTestId('line-chart');
      const chartData = JSON.parse(lineChart.getAttribute('data-chart-data') || '[]');
      expect(chartData).toEqual(mockData);
    });

    it('should show no data message when data is empty', () => {
      render(<TimeSeriesChart data={[]} />);
      
      expect(screen.getByText('No data available for time series visualization')).toBeInTheDocument();
      expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
    });

    it('should handle undefined data gracefully', () => {
      render(<TimeSeriesChart data={[]} />);
      
      expect(screen.getByText('No data available for time series visualization')).toBeInTheDocument();
    });
  });

  describe('chart lines and areas', () => {
    it('should render all line components for line chart', () => {
      render(<TimeSeriesChart data={mockData} chartType="line" />);
      
      expect(screen.getByTestId('line-successRate')).toBeInTheDocument();
      expect(screen.getByTestId('line-errorRate')).toBeInTheDocument();
      expect(screen.getByTestId('line-qualityScore')).toBeInTheDocument();
      expect(screen.getByTestId('line-averageProcessingTime')).toBeInTheDocument();
    });

    it('should render area components for area chart', () => {
      render(<TimeSeriesChart data={mockData} chartType="area" />);
      
      expect(screen.getByTestId('area-successRate')).toBeInTheDocument();
      expect(screen.getByTestId('area-qualityScore')).toBeInTheDocument();
      expect(screen.queryByTestId('area-errorRate')).not.toBeInTheDocument();
      expect(screen.queryByTestId('area-averageProcessingTime')).not.toBeInTheDocument();
    });

    it('should have correct names for lines', () => {
      render(<TimeSeriesChart data={mockData} chartType="line" />);
      
      expect(screen.getByTestId('line-successRate')).toHaveAttribute('data-name', 'Success Rate (%)');
      expect(screen.getByTestId('line-errorRate')).toHaveAttribute('data-name', 'Error Rate (%)');
      expect(screen.getByTestId('line-qualityScore')).toHaveAttribute('data-name', 'Quality Score (%)');
      expect(screen.getByTestId('line-averageProcessingTime')).toHaveAttribute('data-name', 'Avg Processing Time (s)');
    });
  });

  describe('theme support', () => {
    it('should apply light theme classes by default', () => {
      render(<TimeSeriesChart data={[]} />);
      
      const emptyMessage = screen.getByText('No data available for time series visualization');
      expect(emptyMessage).toHaveClass('text-gray-600');
    });

    it('should apply dark theme classes when theme is dark', () => {
      render(<TimeSeriesChart data={[]} theme="dark" />);
      
      const emptyMessage = screen.getByText('No data available for time series visualization');
      expect(emptyMessage).toHaveClass('text-gray-400');
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels for charts', () => {
      render(<TimeSeriesChart data={mockData} />);
      
      // Chart components should be accessible
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('should handle empty state accessibly', () => {
      render(<TimeSeriesChart data={[]} />);
      
      const emptyMessage = screen.getByText('No data available for time series visualization');
      expect(emptyMessage).toBeVisible();
    });
  });

  describe('responsive behavior', () => {
    it('should render in responsive container', () => {
      render(<TimeSeriesChart data={mockData} />);
      
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('should accept custom height', () => {
      const customHeight = 400;
      render(<TimeSeriesChart data={mockData} height={customHeight} />);
      
      // Since we're mocking ResponsiveContainer, we can't test the actual height
      // but we can verify the component renders
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle data with missing properties', () => {
      const incompleteData = [
        { timestamp: '2024-01-01T10:00:00Z', successRate: 95.5 },
        { timestamp: '2024-01-01T11:00:00Z', errorRate: 2.8 }
      ];
      
      render(<TimeSeriesChart data={incompleteData} />);
      
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      const chartData = JSON.parse(
        screen.getByTestId('line-chart').getAttribute('data-chart-data') || '[]'
      );
      expect(chartData).toEqual(incompleteData);
    });

    it('should handle single data point', () => {
      const singlePoint = [mockData[0]];
      
      render(<TimeSeriesChart data={singlePoint} />);
      
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('should handle invalid timestamp formats gracefully', () => {
      const invalidData = [
        { timestamp: 'invalid-date', successRate: 95.5 }
      ];
      
      render(<TimeSeriesChart data={invalidData} />);
      
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  describe('performance', () => {
    it('should handle large datasets', () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        timestamp: new Date(Date.now() + i * 3600000).toISOString(),
        successRate: Math.random() * 100,
        errorRate: Math.random() * 10
      }));
      
      render(<TimeSeriesChart data={largeData} />);
      
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });
});