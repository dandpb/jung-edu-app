import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: 'up' | 'down';
  trendValue?: string;
  theme?: 'light' | 'dark';
  color?: 'green' | 'blue' | 'purple' | 'indigo' | 'red' | 'yellow';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  theme = 'light',
  color = 'blue'
}) => {
  const colorClasses = {
    green: {
      icon: 'text-green-600',
      iconBg: theme === 'dark' ? 'bg-green-900/20' : 'bg-green-100',
      trend: 'text-green-600'
    },
    blue: {
      icon: 'text-blue-600',
      iconBg: theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-100',
      trend: 'text-blue-600'
    },
    purple: {
      icon: 'text-purple-600',
      iconBg: theme === 'dark' ? 'bg-purple-900/20' : 'bg-purple-100',
      trend: 'text-purple-600'
    },
    indigo: {
      icon: 'text-indigo-600',
      iconBg: theme === 'dark' ? 'bg-indigo-900/20' : 'bg-indigo-100',
      trend: 'text-indigo-600'
    },
    red: {
      icon: 'text-red-600',
      iconBg: theme === 'dark' ? 'bg-red-900/20' : 'bg-red-100',
      trend: 'text-red-600'
    },
    yellow: {
      icon: 'text-yellow-600',
      iconBg: theme === 'dark' ? 'bg-yellow-900/20' : 'bg-yellow-100',
      trend: 'text-yellow-600'
    }
  };

  const cardClasses = theme === 'dark' 
    ? 'bg-gray-800 border-gray-700' 
    : 'bg-white border-gray-200';

  const textClasses = theme === 'dark' 
    ? 'text-gray-300' 
    : 'text-gray-600';

  return (
    <div className={`p-6 rounded-lg border shadow-lg transition-all duration-200 hover:shadow-xl ${cardClasses}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color].iconBg}`}>
          <Icon className={`h-6 w-6 ${colorClasses[color].icon}`} />
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 ${
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend === 'up' ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <h3 className={`text-sm font-medium ${textClasses}`}>
          {title}
        </h3>
        <div className="flex items-baseline justify-between">
          <p className="text-2xl font-bold">
            {value}
          </p>
        </div>
        {trendValue && (
          <p className={`text-xs ${
            trend === 'up' ? 'text-green-600' : 
            trend === 'down' ? 'text-red-600' : 
            textClasses
          }`}>
            {trendValue}
          </p>
        )}
      </div>
    </div>
  );
};

export default MetricCard;