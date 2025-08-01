/**
 * Health Check Dashboard
 * 
 * Provides a visual interface for monitoring system health
 * and deployment validation status.
 */

import React, { useState, useEffect } from 'react';
import { HealthService, SystemHealth, HealthCheckResult } from '../services/health/healthService';

const HealthCheck: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const healthService = HealthService.getInstance();

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const healthData = await healthService.checkSystemHealth();
      setHealth(healthData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch health data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (autoRefresh) {
      interval = setInterval(fetchHealth, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [autoRefresh]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return '✅';
      case 'degraded':
        return '⚠️';
      case 'unhealthy':
        return '❌';
      default:
        return '❓';
    }
  };

  const formatResponseTime = (responseTime: number) => {
    if (responseTime < 1000) {
      return `${responseTime}ms`;
    }
    return `${(responseTime / 1000).toFixed(2)}s`;
  };

  const ServiceCard: React.FC<{ service: HealthCheckResult }> = ({ service }) => (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-l-blue-500">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getStatusIcon(service.status)}</span>
          <h3 className="text-lg font-semibold capitalize">
            {service.service.replace('_', ' ')}
          </h3>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(service.status)}`}>
          {service.status}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Response Time:</span>
          <div className="font-medium">{formatResponseTime(service.responseTime)}</div>
        </div>
        <div>
          <span className="text-gray-600">Last Check:</span>
          <div className="font-medium">
            {new Date(service.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>

      {service.details && (
        <div className="mt-4">
          <details className="cursor-pointer">
            <summary className="text-sm text-gray-600 hover:text-gray-800">
              View Details
            </summary>
            <pre className="mt-2 text-xs bg-gray-50 p-3 rounded overflow-x-auto">
              {JSON.stringify(service.details, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {service.error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-sm text-red-700">
            <strong>Error:</strong> {service.error}
          </p>
        </div>
      )}
    </div>
  );

  if (loading && !health) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking system health...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">System Health Dashboard</h1>
              <p className="text-gray-600">Real-time monitoring and deployment validation</p>
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-600">Auto-refresh</span>
              </label>
              <button
                onClick={fetchHealth}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {health && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Overall Status */}
              <div className="col-span-1 md:col-span-2">
                <div className={`p-4 rounded-lg ${getStatusColor(health.overall)}`}>
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">{getStatusIcon(health.overall)}</span>
                    <div>
                      <h2 className="text-xl font-bold">Overall Status</h2>
                      <p className="capitalize font-medium">{health.overall}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Info */}
              <div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{health.version}</div>
                  <div className="text-sm text-gray-600">Version</div>
                </div>
              </div>

              <div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 capitalize">{health.environment}</div>
                  <div className="text-sm text-gray-600">Environment</div>
                </div>
              </div>
            </div>
          )}

          {lastUpdate && (
            <div className="mt-4 text-sm text-gray-500">
              Last updated: {lastUpdate.toLocaleString()}
            </div>
          )}
        </div>

        {/* Service Status Cards */}
        {health && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {health.services.map((service, index) => (
              <ServiceCard key={index} service={service} />
            ))}
          </div>
        )}

        {/* System Metrics */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">System Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{health?.services.length || 0}</div>
              <div className="text-sm text-gray-600">Services Monitored</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {health?.services.filter(s => s.status === 'healthy').length || 0}
              </div>
              <div className="text-sm text-gray-600">Healthy Services</div>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {health?.services.filter(s => s.status !== 'healthy').length || 0}
              </div>
              <div className="text-sm text-gray-600">Issues Detected</div>
            </div>
          </div>
        </div>

        {/* Deployment Status */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Deployment Readiness</h2>
          <div className="space-y-4">
            {health?.services.map((service, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center space-x-3">
                  <span>{getStatusIcon(service.status)}</span>
                  <span className="font-medium capitalize">{service.service.replace('_', ' ')}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {formatResponseTime(service.responseTime)}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
            <h3 className="font-semibold text-blue-900 mb-2">Deployment Status</h3>
            <p className="text-blue-700">
              {health?.overall === 'healthy' 
                ? '✅ System is ready for deployment'
                : health?.overall === 'degraded'
                ? '⚠️ System has non-critical issues - deployment possible with caution'
                : '❌ System has critical issues - deployment not recommended'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthCheck;