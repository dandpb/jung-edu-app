import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, XCircle, AlertCircle, Bell, BellOff } from 'lucide-react';
import { PerformanceAlert } from '../../services/resourcePipeline/monitoring';

interface AlertsPanelProps {
  alerts: PerformanceAlert[];
  theme?: 'light' | 'dark';
  onAcknowledge?: (alertId: string) => void;
  maxDisplayed?: number;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  alerts,
  theme = 'light',
  onAcknowledge,
  maxDisplayed = 10
}) => {
  const [filter, setFilter] = useState<'all' | 'unacknowledged' | 'critical'>('unacknowledged');
  const [showAll, setShowAll] = useState(false);

  const getSeverityIcon = (severity: PerformanceAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'high':
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'low':
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: PerformanceAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'high':
        return 'border-red-400 bg-red-50 dark:bg-red-900/20';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'border-gray-300 bg-gray-50 dark:bg-gray-800';
    }
  };

  const getTypeColor = (type: PerformanceAlert['type']) => {
    switch (type) {
      case 'error':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
      case 'performance':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
      case 'quality':
        return 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400';
      case 'health':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      case 'resource':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    switch (filter) {
      case 'unacknowledged':
        return !alert.acknowledged;
      case 'critical':
        return alert.severity === 'critical' || alert.severity === 'high';
      default:
        return true;
    }
  });

  const displayedAlerts = showAll ? filteredAlerts : filteredAlerts.slice(0, maxDisplayed);

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 min ago';
    if (minutes < 60) return `${minutes} min ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours}h ago`;
    
    return timestamp.toLocaleDateString();
  };

  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;
  const criticalCount = alerts.filter(a => (a.severity === 'critical' || a.severity === 'high') && !a.acknowledged).length;

  return (
    <div className={`p-6 rounded-lg shadow-lg transition-colors duration-200 ${
      theme === 'dark' ? 'bg-gray-800' : 'bg-white'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Bell className="h-5 w-5 mr-2" />
          System Alerts
          {unacknowledgedCount > 0 && (
            <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
              {unacknowledgedCount}
            </span>
          )}
        </h3>
        
        {/* Filter Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              filter === 'all'
                ? theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'
                : theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All ({alerts.length})
          </button>
          <button
            onClick={() => setFilter('unacknowledged')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              filter === 'unacknowledged'
                ? theme === 'dark' ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-800'
                : theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Active ({unacknowledgedCount})
          </button>
          <button
            onClick={() => setFilter('critical')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              filter === 'critical'
                ? theme === 'dark' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-800'
                : theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Critical ({criticalCount})
          </button>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {displayedAlerts.length === 0 ? (
          <div className="text-center py-8">
            <BellOff className={`mx-auto h-12 w-12 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {filter === 'all' 
                ? 'No alerts found' 
                : filter === 'unacknowledged' 
                ? 'No active alerts' 
                : 'No critical alerts'
              }
            </p>
          </div>
        ) : (
          displayedAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border-l-4 transition-all duration-200 ${
                getSeverityColor(alert.severity)
              } ${alert.acknowledged ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {getSeverityIcon(alert.severity)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        getTypeColor(alert.type)
                      }`}>
                        {alert.type.toUpperCase()}
                      </span>
                      <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {formatTimestamp(alert.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm font-medium break-words">
                      {alert.message}
                    </p>
                    {alert.moduleId && (
                      <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Module: {alert.moduleId}
                      </p>
                    )}
                  </div>
                </div>
                
                {!alert.acknowledged && onAcknowledge && (
                  <button
                    onClick={() => onAcknowledge(alert.id)}
                    className={`ml-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                      theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                    }`}
                    title="Acknowledge alert"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Show More/Less Button */}
      {filteredAlerts.length > maxDisplayed && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
              theme === 'dark' 
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {showAll 
              ? `Show Less` 
              : `Show All ${filteredAlerts.length} Alerts`
            }
          </button>
        </div>
      )}
    </div>
  );
};

export default AlertsPanel;