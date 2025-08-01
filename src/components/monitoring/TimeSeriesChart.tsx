import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart
} from 'recharts';

interface TimeSeriesChartProps {
  data: Array<{
    timestamp: string;
    successRate?: number;
    errorRate?: number;
    averageProcessingTime?: number;
    totalResourcesGenerated?: number;
    qualityScore?: number;
  }>;
  theme?: 'light' | 'dark';
  height?: number;
  showGrid?: boolean;
  chartType?: 'line' | 'area';
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  data,
  theme = 'light',
  height = 300,
  showGrid = true,
  chartType = 'line'
}) => {
  const isDark = theme === 'dark';
  
  const chartColors = {
    successRate: '#10B981', // green-500
    errorRate: '#EF4444',   // red-500
    qualityScore: '#8B5CF6', // violet-500
    averageProcessingTime: '#3B82F6', // blue-500
    totalResourcesGenerated: '#F59E0B' // amber-500
  };

  const axisStyle = {
    fontSize: 12,
    fill: isDark ? '#9CA3AF' : '#6B7280'
  };

  const gridStyle = {
    stroke: isDark ? '#374151' : '#E5E7EB',
    strokeDasharray: '3 3'
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3 rounded-lg shadow-lg border ${
          isDark 
            ? 'bg-gray-800 border-gray-600 text-white' 
            : 'bg-white border-gray-200 text-gray-900'
        }`}>
          <p className="font-medium mb-2">
            {new Date(label).toLocaleString()}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              <span className="font-medium">{entry.name}:</span>{' '}
              {typeof entry.value === 'number' 
                ? entry.value.toFixed(2) 
                : entry.value}
              {entry.dataKey === 'successRate' || entry.dataKey === 'errorRate' || entry.dataKey === 'qualityScore' ? '%' : ''}
              {entry.dataKey === 'averageProcessingTime' ? 's' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const ChartComponent = chartType === 'area' ? AreaChart : LineChart;

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          No data available for time series visualization
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ChartComponent data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        {showGrid && <CartesianGrid {...gridStyle} />}
        <XAxis 
          dataKey="timestamp"
          tickFormatter={formatTimestamp}
          style={axisStyle}
          interval="preserveStartEnd"
        />
        <YAxis style={axisStyle} />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          wrapperStyle={{
            fontSize: '12px',
            color: isDark ? '#9CA3AF' : '#6B7280'
          }}
        />
        
        {chartType === 'area' ? (
          <>
            <Area
              type="monotone"
              dataKey="successRate"
              stackId="1"
              stroke={chartColors.successRate}
              fill={chartColors.successRate}
              fillOpacity={0.3}
              name="Success Rate (%)"
            />
            <Area
              type="monotone"
              dataKey="qualityScore"
              stackId="2"
              stroke={chartColors.qualityScore}
              fill={chartColors.qualityScore}
              fillOpacity={0.3}
              name="Quality Score (%)"
            />
          </>
        ) : (
          <>
            <Line
              type="monotone"
              dataKey="successRate"
              stroke={chartColors.successRate}
              strokeWidth={2}
              dot={{ r: 3 }}
              name="Success Rate (%)"
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="errorRate"
              stroke={chartColors.errorRate}
              strokeWidth={2}
              dot={{ r: 3 }}
              name="Error Rate (%)"
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="qualityScore"
              stroke={chartColors.qualityScore}
              strokeWidth={2}
              dot={{ r: 3 }}
              name="Quality Score (%)"
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="averageProcessingTime"
              stroke={chartColors.averageProcessingTime}
              strokeWidth={2}
              dot={{ r: 3 }}
              name="Avg Processing Time (s)"
              connectNulls={false}
            />
          </>
        )}
      </ChartComponent>
    </ResponsiveContainer>
  );
};

export default TimeSeriesChart;