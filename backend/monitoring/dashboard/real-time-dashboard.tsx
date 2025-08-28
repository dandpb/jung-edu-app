import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Line, Area, Bar, Gauge } from 'recharts';
import { 
  SystemMetrics, 
  HealthCheckResult, 
  Alert, 
  AnomalyResult, 
  DashboardData, 
  DashboardConfig,
  ChartConfig 
} from '../types/monitoring';
import { WebSocketManager } from './websocket-manager';
import { ChartRenderer } from './chart-renderer';
import { AlertPanel } from './alert-panel';
import { MetricsGrid } from './metrics-grid';

interface RealTimeDashboardProps {
  config: DashboardConfig;
  websocketUrl: string;
  onConfigChange?: (config: DashboardConfig) => void;
}

export const RealTimeDashboard: React.FC<RealTimeDashboardProps> = ({
  config,
  websocketUrl,
  onConfigChange
}) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [historicalData, setHistoricalData] = useState<DashboardData[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState(config.metrics.timeRange);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // WebSocket connection management
  const wsManager = useMemo(() => new WebSocketManager(websocketUrl), [websocketUrl]);

  useEffect(() => {
    // Setup WebSocket event handlers
    wsManager.on('connected', () => setConnectionStatus('connected'));
    wsManager.on('disconnected', () => setConnectionStatus('disconnected'));
    wsManager.on('data', handleWebSocketData);
    wsManager.on('error', handleWebSocketError);

    // Connect to WebSocket
    wsManager.connect();

    return () => {
      wsManager.disconnect();
    };
  }, [wsManager]);

  const handleWebSocketData = useCallback((data: DashboardData) => {
    setDashboardData(data);
    
    // Update historical data (keep last 100 entries)
    setHistoricalData(prev => {
      const updated = [...prev, data];
      return updated.slice(-100);
    });

    // Update alerts
    if (data.alerts) {
      setAlerts(data.alerts.filter(alert => alert.status === 'active'));
    }
  }, []);

  const handleWebSocketError = useCallback((error: Error) => {
    console.error('WebSocket error:', error);
    setConnectionStatus('disconnected');
  }, []);

  // Auto-refresh mechanism
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (connectionStatus === 'connected' && dashboardData) {
        // Request fresh data
        wsManager.send({ type: 'requestUpdate' });
      }
    }, config.refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, config.refreshInterval, connectionStatus, dashboardData, wsManager]);

  // Memoized calculations for performance
  const overallHealthStatus = useMemo(() => {
    if (!dashboardData?.healthStatus) return 'unknown';
    return dashboardData.healthStatus.overall;
  }, [dashboardData?.healthStatus]);

  const criticalAlerts = useMemo(() => {
    return alerts.filter(alert => alert.severity === 'critical').length;
  }, [alerts]);

  const warningAlerts = useMemo(() => {
    return alerts.filter(alert => alert.severity === 'high' || alert.severity === 'medium').length;
  }, [alerts]);

  // Chart data preparation
  const prepareChartData = useCallback((chart: ChartConfig) => {
    if (!historicalData.length) return [];

    const timeRangeMinutes = parseInt(selectedTimeRange.replace(/[^0-9]/g, '')) || 60;
    const cutoff = new Date(Date.now() - timeRangeMinutes * 60 * 1000);
    
    return historicalData
      .filter(data => data.timestamp >= cutoff)
      .map(data => {
        const result: any = {
          timestamp: data.timestamp.toISOString(),
          time: data.timestamp.toLocaleTimeString()
        };

        chart.metrics.forEach(metricPath => {
          const value = extractMetricValue(data.metrics, metricPath);
          result[metricPath] = value;
        });

        return result;
      });
  }, [historicalData, selectedTimeRange]);

  const extractMetricValue = (metrics: SystemMetrics, path: string): number => {
    const parts = path.split('.');
    let value: any = metrics;
    
    for (const part of parts) {
      value = value?.[part];
    }

    if (typeof value === 'number') return value;
    if (typeof value === 'object' && value !== null) {
      if ('usage' in value) return value.usage;
      if ('used' in value && 'total' in value) return (value.used / value.total) * 100;
    }
    
    return 0;
  };

  // Event handlers
  const handleTimeRangeChange = (range: string) => {
    setSelectedTimeRange(range);
    if (onConfigChange) {
      onConfigChange({
        ...config,
        metrics: { ...config.metrics, timeRange: range }
      });
    }
  };

  const handleChartConfigChange = (chartId: string, newConfig: Partial<ChartConfig>) => {
    if (!onConfigChange) return;

    const updatedCharts = config.charts.map(chart => 
      chart.id === chartId ? { ...chart, ...newConfig } : chart
    );

    onConfigChange({
      ...config,
      charts: updatedCharts
    });
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#10B981';
      case 'warning': return '#F59E0B';
      case 'critical': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'critical': return '🚨';
      default: return '❓';
    }
  };

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading monitoring data...</p>
          <p className="text-sm text-gray-400 mt-2">Status: {connectionStatus}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`monitoring-dashboard ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">System Health Monitor</h1>
            <div className="flex items-center space-x-2">
              <div 
                className={`w-3 h-3 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500' : 
                  connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
                }`}
              ></div>
              <span className="text-sm text-gray-600 capitalize">{connectionStatus}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Time Range Selector */}
            <select 
              value={selectedTimeRange}
              onChange={(e) => handleTimeRangeChange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="1h">Last Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
            </select>

            {/* Auto Refresh Toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1 text-sm rounded-md border ${
                autoRefresh 
                  ? 'bg-blue-50 border-blue-300 text-blue-700' 
                  : 'bg-gray-50 border-gray-300 text-gray-700'
              }`}
            >
              Auto Refresh: {autoRefresh ? 'On' : 'Off'}
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md"
            >
              {isFullscreen ? '📐' : '🔳'}
            </button>
          </div>
        </div>

        {/* Status Overview */}
        <div className="mt-4 grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overall Health</p>
                <p className="text-lg font-semibold flex items-center">
                  {getHealthStatusIcon(overallHealthStatus)}
                  <span className="ml-2 capitalize" style={{ color: getHealthStatusColor(overallHealthStatus) }}>
                    {overallHealthStatus}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div>
              <p className="text-sm text-gray-600">Critical Alerts</p>
              <p className="text-2xl font-bold text-red-600">{criticalAlerts}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div>
              <p className="text-sm text-gray-600">Warnings</p>
              <p className="text-2xl font-bold text-yellow-600">{warningAlerts}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div>
              <p className="text-sm text-gray-600">Last Update</p>
              <p className="text-sm font-medium text-gray-900">
                {dashboardData.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="grid grid-cols-12 gap-6 h-full">
          {/* Metrics Grid - Left Column */}
          <div className="col-span-8">
            <MetricsGrid 
              metrics={dashboardData.metrics}
              historicalData={historicalData}
              config={config}
            />

            {/* Charts */}
            <div className="mt-6 grid grid-cols-2 gap-6">
              {config.charts.map(chart => (
                <div key={chart.id} className="bg-white rounded-lg shadow border p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">{chart.title}</h3>
                    <button className="text-gray-400 hover:text-gray-600">
                      ⚙️
                    </button>
                  </div>
                  <ChartRenderer 
                    config={chart}
                    data={prepareChartData(chart)}
                    onConfigChange={(newConfig) => handleChartConfigChange(chart.id, newConfig)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Alerts Panel - Right Column */}
          <div className="col-span-4">
            <AlertPanel 
              alerts={alerts}
              anomalies={dashboardData.anomalies}
              healthResults={dashboardData.healthStatus.services}
              maxItems={config.alerts.maxItems}
              showActive={config.alerts.showActive}
              showHistory={config.alerts.showHistory}
            />
          </div>
        </div>
      </div>
    </div>
  );
};