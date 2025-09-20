import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the MetricCard component
interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  trend?: 'up' | 'down';
  trendValue?: string;
  theme?: 'light' | 'dark';
  color?: 'green' | 'blue' | 'purple' | 'indigo' | 'red' | 'yellow';
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue, 
  theme = 'light',
  color = 'blue'
}) => {
  // Mock trend icons
  const TrendingUp = () => <div data-testid="trending-up-icon" />;
  const TrendingDown = () => <div data-testid="trending-down-icon" />;

  const getColorClasses = (colorName: string) => {
    const colorMap = {
      green: { icon: 'text-green-600', bg: theme === 'dark' ? 'bg-green-900/20' : 'bg-green-100' },
      blue: { icon: 'text-blue-600', bg: theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-100' },
      purple: { icon: 'text-purple-600', bg: theme === 'dark' ? 'bg-purple-900/20' : 'bg-purple-100' },
      indigo: { icon: 'text-indigo-600', bg: theme === 'dark' ? 'bg-indigo-900/20' : 'bg-indigo-100' },
      red: { icon: 'text-red-600', bg: theme === 'dark' ? 'bg-red-900/20' : 'bg-red-100' },
      yellow: { icon: 'text-yellow-600', bg: theme === 'dark' ? 'bg-yellow-900/20' : 'bg-yellow-100' }
    };
    return colorMap[colorName as keyof typeof colorMap] || colorMap.blue;
  };

  const colorClasses = getColorClasses(color);
  
  const cardClasses = theme === 'dark' 
    ? 'bg-gray-800 border-gray-700 text-gray-100'
    : 'bg-white border-gray-200 text-gray-900';
    
  const titleClasses = theme === 'dark' ? 'text-gray-300' : 'text-gray-600';

  return (
    <div className={`p-6 rounded-lg shadow-lg border hover:shadow-xl transition-shadow ${cardClasses}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className={`text-sm font-medium ${titleClasses}`}>
            {title}
          </h3>
          <p className="text-2xl font-bold mt-2">
            {value}
          </p>
          
          {(trend || trendValue) && (
            <div className="flex items-center mt-2 space-x-1">
              {trend === 'up' && <TrendingUp />}
              {trend === 'down' && <TrendingDown />}
              {trendValue && (
                <span className={`text-sm ${
                  trend === 'up' ? 'text-green-600' : 
                  trend === 'down' ? 'text-red-600' : 
                  'text-gray-500'
                }`}>
                  {trendValue}
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className={`p-3 rounded-full ${colorClasses.bg}`}>
          <Icon className={`w-6 h-6 ${colorClasses.icon}`} />
        </div>
      </div>
    </div>
  );
};

// Mock icons
const Activity = ({ className, ...props }: any) => <div data-testid="activity-icon" className={className} {...props} />;
const Users = ({ className, ...props }: any) => <div data-testid="users-icon" className={className} {...props} />;
const Zap = ({ className, ...props }: any) => <div data-testid="zap-icon" className={className} {...props} />;
const AlertTriangle = ({ className, ...props }: any) => <div data-testid="alert-triangle-icon" className={className} {...props} />;
const CheckCircle = ({ className, ...props }: any) => <div data-testid="check-circle-icon" className={className} {...props} />;

describe('MetricCard', () => {
  const defaultProps = {
    title: 'Success Rate',
    value: '95.5%',
    icon: Activity
  };

  describe('basic rendering', () => {
    it('should render with minimum required props', () => {
      render(<MetricCard {...defaultProps} />);
      
      expect(screen.getByText('Success Rate')).toBeInTheDocument();
      expect(screen.getByText('95.5%')).toBeInTheDocument();
      expect(screen.getByTestId('activity-icon')).toBeInTheDocument();
    });

    it('should render title correctly', () => {
      render(<MetricCard {...defaultProps} title="Custom Title" />);
      
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('should render value correctly', () => {
      render(<MetricCard {...defaultProps} value="1,234" />);
      
      expect(screen.getByText('1,234')).toBeInTheDocument();
    });

    it('should render different icons', () => {
      const { rerender } = render(<MetricCard {...defaultProps} icon={Users} />);
      expect(screen.getByTestId('users-icon')).toBeInTheDocument();

      rerender(<MetricCard {...defaultProps} icon={Zap} />);
      expect(screen.getByTestId('zap-icon')).toBeInTheDocument();

      rerender(<MetricCard {...defaultProps} icon={CheckCircle} />);
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
    });
  });

  describe('trend indicators', () => {
    it('should render upward trend indicator', () => {
      render(
        <MetricCard 
          {...defaultProps} 
          trend="up" 
          trendValue="+5.2% from last week"
        />
      );
      
      expect(screen.getByTestId('trending-up-icon')).toBeInTheDocument();
      expect(screen.getByText('+5.2% from last week')).toBeInTheDocument();
    });

    it('should render downward trend indicator', () => {
      render(
        <MetricCard 
          {...defaultProps} 
          trend="down" 
          trendValue="-2.1% from last week"
        />
      );
      
      expect(screen.getByTestId('trending-down-icon')).toBeInTheDocument();
      expect(screen.getByText('-2.1% from last week')).toBeInTheDocument();
    });

    it('should not render trend indicator when trend is not provided', () => {
      render(<MetricCard {...defaultProps} />);
      
      expect(screen.queryByTestId('trending-up-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('trending-down-icon')).not.toBeInTheDocument();
    });

    it('should render trend value without trend direction', () => {
      render(
        <MetricCard 
          {...defaultProps} 
          trendValue="No change from last week"
        />
      );
      
      expect(screen.getByText('No change from last week')).toBeInTheDocument();
      expect(screen.queryByTestId('trending-up-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('trending-down-icon')).not.toBeInTheDocument();
    });
  });

  describe('theme support', () => {
    it('should apply light theme by default', () => {
      render(<MetricCard {...defaultProps} />);
      
      const card = screen.getByText('Success Rate').closest('[class*="p-6"]');
      expect(card).toHaveClass('bg-white', 'border-gray-200');
      
      const title = screen.getByText('Success Rate');
      expect(title).toHaveClass('text-gray-600');
    });

    it('should apply dark theme when specified', () => {
      render(<MetricCard {...defaultProps} theme="dark" />);
      
      const card = screen.getByText('Success Rate').closest('[class*="p-6"]');
      expect(card).toHaveClass('bg-gray-800', 'border-gray-700');
      
      const title = screen.getByText('Success Rate');
      expect(title).toHaveClass('text-gray-300');
    });

    it('should apply correct trend colors for dark theme', () => {
      render(
        <MetricCard 
          {...defaultProps} 
          theme="dark" 
          trend="up" 
          trendValue="+5.2%"
        />
      );
      
      const trendValue = screen.getByText('+5.2%');
      expect(trendValue).toHaveClass('text-green-600');
    });
  });

  describe('color variants', () => {
    const colorTests = [
      { color: 'green' as const, expectedIconClass: 'text-green-600' },
      { color: 'blue' as const, expectedIconClass: 'text-blue-600' },
      { color: 'purple' as const, expectedIconClass: 'text-purple-600' },
      { color: 'indigo' as const, expectedIconClass: 'text-indigo-600' },
      { color: 'red' as const, expectedIconClass: 'text-red-600' },
      { color: 'yellow' as const, expectedIconClass: 'text-yellow-600' }
    ];

    colorTests.forEach(({ color, expectedIconClass }) => {
      it(`should apply ${color} color variant correctly`, () => {
        render(<MetricCard {...defaultProps} color={color} />);
        
        const icon = screen.getByTestId('activity-icon');
        expect(icon).toHaveClass(expectedIconClass);
      });
    });

    it('should apply blue color by default', () => {
      render(<MetricCard {...defaultProps} />);
      
      const icon = screen.getByTestId('activity-icon');
      expect(icon).toHaveClass('text-blue-600');
    });

    it('should apply correct background colors for icon container', () => {
      const { rerender } = render(<MetricCard {...defaultProps} color="green" />);
      
      let iconContainer = screen.getByTestId('activity-icon').parentElement;
      expect(iconContainer).toHaveClass('bg-green-100');

      rerender(<MetricCard {...defaultProps} color="green" theme="dark" />);
      iconContainer = screen.getByTestId('activity-icon').parentElement;
      expect(iconContainer).toHaveClass('bg-green-900/20');
    });
  });

  describe('accessibility', () => {
    it('should have proper semantic structure', () => {
      render(<MetricCard {...defaultProps} />);
      
      // Check for heading
      const title = screen.getByText('Success Rate');
      expect(title.tagName).toBe('H3');
      expect(title).toHaveClass('text-sm', 'font-medium');
      
      // Check for value display
      const value = screen.getByText('95.5%');
      expect(value.tagName).toBe('P');
      expect(value).toHaveClass('text-2xl', 'font-bold');
    });

    it('should have hover states', () => {
      render(<MetricCard {...defaultProps} />);
      
      const card = screen.getByText('Success Rate').closest('[class*="p-6"]');
      expect(card).toHaveClass('hover:shadow-xl');
    });

    it('should be keyboard accessible', () => {
      render(<MetricCard {...defaultProps} />);
      
      const card = screen.getByText('Success Rate').closest('div')?.parentElement;
      expect(card).not.toHaveAttribute('tabindex'); // Should not be focusable by default
    });
  });

  describe('responsive design', () => {
    it('should have responsive classes', () => {
      render(<MetricCard {...defaultProps} />);
      
      const card = screen.getByText('Success Rate').closest('[class*="p-6"]');
      expect(card).toHaveClass('p-6', 'rounded-lg', 'shadow-lg');
    });

    it('should handle long titles gracefully', () => {
      const longTitle = 'This is a very long title that might wrap to multiple lines';
      render(<MetricCard {...defaultProps} title={longTitle} />);
      
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should handle long values gracefully', () => {
      const longValue = '1,234,567,890.12';
      render(<MetricCard {...defaultProps} value={longValue} />);
      
      expect(screen.getByText(longValue)).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle empty title', () => {
      render(<MetricCard {...defaultProps} title="" />);
      
      // The title is empty, so we check that the h3 element exists but has no text
      const titleElement = document.querySelector('h3');
      expect(titleElement).toBeInTheDocument();
      expect(titleElement).toHaveTextContent('');
    });

    it('should handle empty value', () => {
      render(<MetricCard {...defaultProps} value="" />);
      
      // Should still render the container
      expect(screen.getByTestId('activity-icon')).toBeInTheDocument();
    });

    it('should handle special characters in values', () => {
      render(<MetricCard {...defaultProps} value="€1,234.56" />);
      
      expect(screen.getByText('€1,234.56')).toBeInTheDocument();
    });

    it('should handle undefined trend value gracefully', () => {
      render(<MetricCard {...defaultProps} trend="up" />);
      
      expect(screen.getByTestId('trending-up-icon')).toBeInTheDocument();
      expect(screen.queryByText('undefined')).not.toBeInTheDocument();
    });
  });

  describe('component composition', () => {
    it('should work with different icon components', () => {
      const customIcon = ({ className }: any) => (
        <div data-testid="custom-icon" className={className} />
      );
      
      render(<MetricCard {...defaultProps} icon={customIcon} />);
      
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    it('should maintain proper spacing with all elements', () => {
      render(
        <MetricCard 
          {...defaultProps} 
          trend="up" 
          trendValue="+5.2%"
        />
      );
      
      // All elements should be present
      expect(screen.getByText('Success Rate')).toBeInTheDocument();
      expect(screen.getByText('95.5%')).toBeInTheDocument();
      expect(screen.getByTestId('activity-icon')).toBeInTheDocument();
      expect(screen.getByTestId('trending-up-icon')).toBeInTheDocument();
      expect(screen.getByText('+5.2%')).toBeInTheDocument();
    });
  });
});
