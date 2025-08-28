import { EventEmitter } from 'events';
import { DashboardData } from '../types/monitoring';

export class WebSocketManager extends EventEmitter {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isManualClose = false;

  constructor(url: string) {
    super();
    this.url = url;
  }

  public connect(): void {
    if (this.ws?.readyState === WebSocket.CONNECTING || this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isManualClose = false;
    
    try {
      this.ws = new WebSocket(this.url);
      this.setupEventHandlers();
    } catch (error) {
      this.emit('error', error);
      this.handleReconnection();
    }
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.emit('connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        this.emit('error', new Error('Failed to parse WebSocket message'));
      }
    };

    this.ws.onclose = (event) => {
      this.stopHeartbeat();
      
      if (!this.isManualClose) {
        this.emit('disconnected', { code: event.code, reason: event.reason });
        this.handleReconnection();
      }
    };

    this.ws.onerror = (error) => {
      this.emit('error', error);
    };
  }

  private handleMessage(data: any): void {
    switch (data.type) {
      case 'dashboard_update':
        this.emit('data', this.transformDashboardData(data.payload));
        break;
      
      case 'alert':
        this.emit('alert', data.payload);
        break;
      
      case 'health_update':
        this.emit('healthUpdate', data.payload);
        break;
      
      case 'anomaly_detected':
        this.emit('anomaly', data.payload);
        break;
      
      case 'pong':
        // Heartbeat response received
        break;
      
      default:
        this.emit('message', data);
    }
  }

  private transformDashboardData(payload: any): DashboardData {
    return {
      timestamp: new Date(payload.timestamp),
      metrics: {
        ...payload.metrics,
        timestamp: new Date(payload.metrics.timestamp)
      },
      alerts: payload.alerts?.map((alert: any) => ({
        ...alert,
        timestamp: new Date(alert.timestamp),
        acknowledgedAt: alert.acknowledgedAt ? new Date(alert.acknowledgedAt) : undefined,
        resolvedAt: alert.resolvedAt ? new Date(alert.resolvedAt) : null
      })) || [],
      anomalies: payload.anomalies?.map((anomaly: any) => ({
        ...anomaly,
        timestamp: new Date(anomaly.timestamp)
      })) || [],
      healthStatus: {
        overall: payload.healthStatus.overall,
        services: payload.healthStatus.services?.map((service: any) => ({
          ...service,
          timestamp: new Date(service.timestamp)
        })) || []
      }
    };
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
      }
    }, 30000); // Send ping every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private handleReconnection(): void {
    if (this.isManualClose || this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    this.emit('reconnecting', { attempt: this.reconnectAttempts, delay });

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  public send(data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      this.emit('error', new Error('WebSocket not connected'));
    }
  }

  public disconnect(): void {
    this.isManualClose = true;
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  public getReadyState(): number | null {
    return this.ws?.readyState ?? null;
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}