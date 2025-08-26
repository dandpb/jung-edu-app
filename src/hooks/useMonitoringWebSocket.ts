import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { PipelineMetrics, PipelineStatus, PerformanceAlert } from '../services/resourcePipeline/monitoring';

interface UseMonitoringWebSocketOptions {
  url?: string;
  onMetricsUpdate?: (metrics: PipelineMetrics) => void;
  onStatusUpdate?: (status: PipelineStatus) => void;
  onAlertsUpdate?: (alerts: PerformanceAlert[]) => void;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

interface UseMonitoringWebSocketReturn {
  connected: boolean;
  error: string | null;
  sendMessage: (event: string, data: any) => void;
  acknowledgeAlert: (alertId: string) => void;
}

export const useMonitoringWebSocket = ({
  url = process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:3001',
  onMetricsUpdate,
  onStatusUpdate,
  onAlertsUpdate,
  reconnectAttempts = 5,
  reconnectDelay = 3000
}: UseMonitoringWebSocketOptions): UseMonitoringWebSocketReturn => {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    try {
      // Clean up existing connection
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      console.log('🔌 Attempting to connect to monitoring WebSocket:', url);
      
      socketRef.current = io(url, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true
      });

      const socket = socketRef.current;

      // Connection events
      socket.on('connect', () => {
        console.log('✅ WebSocket connected to monitoring service');
        setConnected(true);
        setError(null);
        reconnectCountRef.current = 0;
        
        // Request initial data
        socket.emit('request_initial_data');
      });

      socket.on('disconnect', (reason) => {
        console.log('❌ WebSocket disconnected:', reason);
        setConnected(false);
        
        // Auto-reconnect logic
        if (reason === 'io server disconnect') {
          // Server initiated disconnect, don't reconnect
          setError('Server disconnected the connection');
        } else if (reconnectCountRef.current < reconnectAttempts) {
          setError(`Connection lost. Reconnecting... (${reconnectCountRef.current + 1}/${reconnectAttempts})`);
          attemptReconnect();
        } else {
          setError('Failed to reconnect after multiple attempts');
        }
      });

      socket.on('connect_error', (err) => {
        console.error('🔌 WebSocket connection error:', err);
        setConnected(false);
        setError(`Connection error: ${err.message}`);
        
        if (reconnectCountRef.current < reconnectAttempts) {
          attemptReconnect();
        }
      });

      // Monitoring data events
      socket.on('metrics_update', (metrics: PipelineMetrics) => {
        console.log('📊 Received metrics update:', metrics);
        onMetricsUpdate?.(metrics);
      });

      socket.on('status_update', (status: PipelineStatus) => {
        console.log('📈 Received status update:', status);
        onStatusUpdate?.(status);
      });

      socket.on('alerts_update', (alerts: PerformanceAlert[]) => {
        console.log('🚨 Received alerts update:', alerts.length, 'alerts');
        onAlertsUpdate?.(alerts);
      });

      socket.on('initial_data', (data: {
        metrics: PipelineMetrics;
        status: PipelineStatus;
        alerts: PerformanceAlert[];
      }) => {
        console.log('🔄 Received initial monitoring data');
        onMetricsUpdate?.(data.metrics);
        onStatusUpdate?.(data.status);
        onAlertsUpdate?.(data.alerts);
      });

      // Health check events
      socket.on('health_check_complete', (healthData: any) => {
        console.log('🏥 Health check completed:', healthData);
      });

      socket.on('alert_created', (alert: PerformanceAlert) => {
        console.log('🚨 New alert created:', alert);
        // Optionally handle individual alerts
      });

      socket.on('alert_acknowledged', (alert: PerformanceAlert) => {
        console.log('✅ Alert acknowledged:', alert.id);
      });

    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setError(`Failed to initialize connection: ${err}`);
    }
  };

  const attemptReconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectCountRef.current++;
    console.log(`🔄 Attempting to reconnect (${reconnectCountRef.current}/${reconnectAttempts}) in ${reconnectDelay}ms`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, reconnectDelay);
  };

  const sendMessage = (event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('Cannot send message: WebSocket not connected');
    }
  };

  const acknowledgeAlert = (alertId: string) => {
    sendMessage('acknowledge_alert', { alertId });
  };

  // Initialize connection on mount
  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        console.log('🔌 Cleaning up WebSocket connection');
        socketRef.current.disconnect();
      }
    };
  }, [url]); // Reconnect if URL changes

  // Simulate periodic data updates when WebSocket is not available
  useEffect(() => {
    if (!connected && !error?.includes('Reconnecting')) {
      console.log('📡 WebSocket not available, using mock data simulation');
      
      const interval = setInterval(() => {
        // Generate mock metrics with some variation
        const mockMetrics: PipelineMetrics = {
          totalModulesProcessed: Math.floor(Math.random() * 200) + 100,
          totalResourcesGenerated: Math.floor(Math.random() * 1000) + 500,
          averageProcessingTime: Math.random() * 20000 + 5000,
          successRate: 0.9 + Math.random() * 0.1,
          errorRate: Math.random() * 0.1,
          resourcesByType: {
            'quiz': Math.floor(Math.random() * 400) + 250,
            'video': Math.floor(Math.random() * 200) + 150,
            'bibliography': Math.floor(Math.random() * 150) + 100
          },
          qualityScores: {
            average: 0.8 + Math.random() * 0.2,
            byType: {
              'quiz': 0.8 + Math.random() * 0.2,
              'video': 0.85 + Math.random() * 0.15,
              'bibliography': 0.75 + Math.random() * 0.25
            }
          },
          performance: {
            averageGenerationTime: Math.random() * 10000 + 5000,
            averageValidationTime: Math.random() * 3000 + 1000,
            averageHookExecutionTime: Math.random() * 500 + 200
          },
          health: {
            status: Math.random() > 0.8 ? 'degraded' : 'healthy',
            lastUpdate: new Date(),
            issues: Math.random() > 0.9 ? ['High memory usage detected'] : []
          }
        };

        onMetricsUpdate?.(mockMetrics);
      }, 5000); // Update every 5 seconds

      return () => clearInterval(interval);
    }
  }, [connected, error, onMetricsUpdate]);

  return {
    connected,
    error,
    sendMessage,
    acknowledgeAlert
  };
};