import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Clock, Activity } from 'lucide-react';
import { PipelineMetrics, PipelineStatus } from '../../services/resourcePipeline/monitoring';

interface SystemHealthIndicatorProps {
  health?: PipelineMetrics['health'];
  status?: PipelineStatus;
  theme?: 'light' | 'dark';
}

export const SystemHealthIndicator: React.FC<SystemHealthIndicatorProps> = ({
  health,
  status,
  theme = 'light'
}) => {
  if (!health || !status) {
    return (
      <div className={`p-6 rounded-lg shadow-lg ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-gray-300 h-10 w-10"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  const getHealthIcon = () => {
    switch (health.status) {
      case 'healthy':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-8 w-8 text-yellow-500" />;
      case 'unhealthy':
        return <XCircle className="h-8 w-8 text-red-500" />;
      default:
        return <Activity className="h-8 w-8 text-gray-500" />;
    }
  };

  const getHealthColor = () => {
    switch (health.status) {
      case 'healthy':
        return 'border-green-500 bg-green-50 dark:bg-green-900/20';
      case 'degraded':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'unhealthy':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      default:
        return 'border-gray-500 bg-gray-50 dark:bg-gray-800';
    }
  };

  const getStatusText = () => {
    switch (health.status) {
      case 'healthy':
        return 'All systems operational';
      case 'degraded':
        return 'System performance degraded';
      case 'unhealthy':
        return 'System requires attention';
      default:
        return 'System status unknown';
    }
  };

  const formatLastUpdate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className={`p-6 rounded-lg shadow-lg border-l-4 transition-colors duration-200 ${
      getHealthColor()
    } ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          {getHealthIcon()}
          <div>
            <h2 className="text-xl font-bold capitalize">{health.status}</h2>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {getStatusText()}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-center space-x-2">
            <Clock className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
            <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {formatLastUpdate(health.lastUpdate)}
            </span>
          </div>
          {status.isRunning && (
            <div className="flex items-center space-x-2 mt-1">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                RUNNING
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Health Issues */}
      {health.issues && health.issues.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            Issues Detected:
          </h4>
          <ul className="space-y-1">
            {health.issues.map((issue, index) => (
              <li key={index} className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {issue}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quick Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className={`text-2xl font-bold ${
            status.activeModules > 0 ? 'text-green-600' : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {status.activeModules}
          </div>
          <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Active Modules
          </div>
        </div>
        
        <div className="text-center">
          <div className={`text-2xl font-bold ${
            status.queuedModules > 0 ? 'text-yellow-600' : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {status.queuedModules}
          </div>
          <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Queued
          </div>
        </div>
        
        <div className="text-center">
          <div className={`text-2xl font-bold ${
            status.resourcesInProgress > 0 ? 'text-blue-600' : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {status.resourcesInProgress}
          </div>
          <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            In Progress
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemHealthIndicator;