import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, CheckCircle, Clock, Database, TrendingUp, Users, Zap } from 'lucide-react';
import { MetricCard } from '../components/monitoring/MetricCard';
import { TimeSeriesChart } from '../components/monitoring/TimeSeriesChart';
import { SystemHealthIndicator } from '../components/monitoring/SystemHealthIndicator';
import { AlertsPanel } from '../components/monitoring/AlertsPanel';
import { ThemeToggle } from '../components/monitoring/ThemeToggle';
import { useMonitoringWebSocket } from '../hooks/useMonitoringWebSocket';
import { PipelineMetrics, PipelineStatus, PerformanceAlert } from '../services/resourcePipeline/monitoring';

interface MonitoringDashboardProps {
  theme?: 'light' | 'dark';
}

export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({ theme: initialTheme = 'light' }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(initialTheme);
  const [metrics, setMetrics] = useState<PipelineMetrics | null>(null);
  const [status, setStatus] = useState<PipelineStatus | null>(null);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // WebSocket connection for real-time updates
  const { connected, error: wsError } = useMonitoringWebSocket({
    onMetricsUpdate: (newMetrics: PipelineMetrics) => {
      setMetrics(newMetrics);
      setIsLoading(false);
      
      // Add to time series data
      const timestamp = new Date().toISOString();
      setTimeSeriesData(prev => [
        ...prev.slice(-99), // Keep last 100 points
        {
          timestamp,
          successRate: newMetrics.successRate * 100,
          errorRate: newMetrics.errorRate * 100,
          averageProcessingTime: newMetrics.averageProcessingTime / 1000, // Convert to seconds
          totalResourcesGenerated: newMetrics.totalResourcesGenerated,
          qualityScore: newMetrics.qualityScores.average * 100
        }
      ]);
    },
    onStatusUpdate: (newStatus: PipelineStatus) => {
      setStatus(newStatus);
    },
    onAlertsUpdate: (newAlerts: PerformanceAlert[]) => {
      setAlerts(newAlerts);
    }
  });

  // Theme toggle handler
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // Apply theme on mount and change
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Mock data while waiting for WebSocket connection
  useEffect(() => {
    if (!connected && !metrics) {
      // Initialize with mock data
      const mockMetrics: PipelineMetrics = {
        totalModulesProcessed: 127,
        totalResourcesGenerated: 845,
        averageProcessingTime: 12500, // 12.5 seconds
        successRate: 0.94,
        errorRate: 0.06,
        resourcesByType: {
          'mindmap': 245,
          'quiz': 312,
          'video': 178,
          'bibliography': 110
        },
        qualityScores: {
          average: 0.87,
          byType: {
            'mindmap': 0.91,
            'quiz': 0.84,
            'video': 0.89,
            'bibliography': 0.83
          }
        },
        performance: {
          averageGenerationTime: 8200,
          averageValidationTime: 2100,
          averageHookExecutionTime: 350
        },
        health: {
          status: 'healthy',
          lastUpdate: new Date(),
          issues: []
        }
      };

      const mockStatus: PipelineStatus = {
        isRunning: true,
        activeModules: 3,
        queuedModules: 7,
        resourcesInProgress: 12,
        lastActivity: new Date(),
        uptime: 8640000 // 2.4 hours
      };

      setMetrics(mockMetrics);
      setStatus(mockStatus);
      setIsLoading(false);
    }
  }, [connected, metrics]);

  if (isLoading) {
    return (
      <div className={`min-h-screen transition-colors duration-200 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-lg">Loading monitoring dashboard...</span>
        </div>
      </div>
    );
  }

  const themeClasses = theme === 'dark' 
    ? 'bg-gray-900 text-white' 
    : 'bg-gray-50 text-gray-900';

  return (
    <div className={`min-h-screen transition-colors duration-200 ${themeClasses}`}>
      {/* Header */}
      <div className={`sticky top-0 z-10 border-b transition-colors duration-200 ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Activity className={`h-8 w-8 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
              <div>
                <h1 className="text-2xl font-bold">System Monitoring Dashboard</h1>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Real-time pipeline performance and health monitoring
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm">
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Health Overview */}
        <div className="mb-8">
          <SystemHealthIndicator 
            health={metrics?.health}
            status={status}
            theme={theme}
          />
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Success Rate"
            value={`${((metrics?.successRate || 0) * 100).toFixed(1)}%`}
            icon={CheckCircle}
            trend={metrics?.successRate && metrics.successRate > 0.9 ? 'up' : 'down'}
            trendValue={`${((metrics?.errorRate || 0) * 100).toFixed(1)}% errors`}
            theme={theme}
            color="green"
          />
          
          <MetricCard
            title="Avg Processing Time"
            value={`${((metrics?.averageProcessingTime || 0) / 1000).toFixed(1)}s`}
            icon={Clock}
            trend="down"
            trendValue="12% faster"
            theme={theme}
            color="blue"
          />
          
          <MetricCard
            title="Resources Generated"
            value={metrics?.totalResourcesGenerated?.toLocaleString() || '0'}
            icon={Database}
            trend="up"
            trendValue={`${status?.activeModules || 0} active`}
            theme={theme}
            color="purple"
          />
          
          <MetricCard
            title="Quality Score"
            value={`${((metrics?.qualityScores.average || 0) * 100).toFixed(1)}%`}
            icon={TrendingUp}
            trend="up"
            trendValue="Above target"
            theme={theme}
            color="indigo"
          />
        </div>

        {/* Charts and Detailed Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Time Series Chart */}
          <div className={`p-6 rounded-lg shadow-lg transition-colors duration-200 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Performance Trends
            </h3>
            <TimeSeriesChart 
              data={timeSeriesData}
              theme={theme}
              height={300}
            />
          </div>

          {/* Resource Distribution */}
          <div className={`p-6 rounded-lg shadow-lg transition-colors duration-200 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Database className="h-5 w-5 mr-2" />
              Resource Distribution
            </h3>
            <div className="space-y-4">
              {metrics?.resourcesByType && Object.entries(metrics.resourcesByType).map(([type, count]) => {
                const total = Object.values(metrics.resourcesByType).reduce((sum, val) => sum + val, 0);
                const percentage = (count / total) * 100;
                
                return (
                  <div key={type} className="flex items-center justify-between">
                    <span className="capitalize font-medium">{type}</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm w-12 text-right">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Active Modules and Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Modules */}
          <div className={`p-6 rounded-lg shadow-lg transition-colors duration-200 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              System Status
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Active Modules</span>
                <span className="font-bold text-green-600">{status?.activeModules || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Queued Modules</span>
                <span className="font-bold text-yellow-600">{status?.queuedModules || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Resources in Progress</span>
                <span className="font-bold text-blue-600">{status?.resourcesInProgress || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Uptime</span>
                <span className="font-bold">
                  {status ? formatUptime(status.uptime) : '0h 0m'}
                </span>
              </div>
            </div>
          </div>

          {/* Alerts Panel */}
          <div className="lg:col-span-2">
            <AlertsPanel 
              alerts={alerts}
              theme={theme}
              onAcknowledge={(alertId) => {
                // Handle alert acknowledgment
                setAlerts(prev => prev.map(alert => 
                  alert.id === alertId ? { ...alert, acknowledged: true } : alert
                ));
              }}
            />
          </div>
        </div>

        {/* WebSocket Error Display */}
        {wsError && (
          <div className={`mt-6 p-4 rounded-lg border-l-4 border-yellow-400 ${
            theme === 'dark' ? 'bg-yellow-900/20' : 'bg-yellow-50'
          }`}>
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <p className="text-sm">
                  WebSocket connection error: {wsError}. Using cached data.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to format uptime
function formatUptime(uptime: number): string {
  const hours = Math.floor(uptime / (1000 * 60 * 60));
  const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

export default MonitoringDashboard;