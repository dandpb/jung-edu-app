import { EventEmitter } from 'events';

export interface SocketConfig {
  url: string;
  autoConnect: boolean;
  reconnectAttempts: number;
  reconnectInterval: number;
}

export interface SocketMessage {
  event: string;
  data?: any;
  timestamp: Date;
}

export interface SocketRoom {
  id: string;
  participants: string[];
  metadata?: any;
}

export class SocketService extends EventEmitter {
  private socket?: WebSocket;
  private config: SocketConfig;
  private isConnected = false;
  private reconnectCount = 0;
  private currentRoom?: string;
  private messageQueue: SocketMessage[] = [];

  constructor(config: Partial<SocketConfig>) {
    super();
    this.config = {
      url: config.url || 'ws://localhost:8080',
      autoConnect: config.autoConnect ?? true,
      reconnectAttempts: config.reconnectAttempts ?? 5,
      reconnectInterval: config.reconnectInterval ?? 3000
    };

    if (this.config.autoConnect) {
      this.connect();
    }
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(this.config.url);

        this.socket.onopen = () => {
          this.isConnected = true;
          this.reconnectCount = 0;
          this.emit('connected');
          
          // Send queued messages
          this.messageQueue.forEach(message => this.sendMessage(message));
          this.messageQueue = [];
          
          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            const message: SocketMessage = JSON.parse(event.data);
            this.emit('message', message);
            this.emit(message.event, message.data);
          } catch (error) {
            this.emit('error', new Error('Failed to parse message'));
          }
        };

        this.socket.onclose = () => {
          this.isConnected = false;
          this.emit('disconnected');
          
          if (this.reconnectCount < this.config.reconnectAttempts) {
            setTimeout(() => {
              this.reconnectCount++;
              this.connect();
            }, this.config.reconnectInterval);
          }
        };

        this.socket.onerror = (error) => {
          this.emit('error', error);
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = undefined;
    }
    this.isConnected = false;
  }

  sendMessage(message: SocketMessage): void {
    if (!this.isConnected || !this.socket) {
      this.messageQueue.push(message);
      return;
    }

    try {
      this.socket.send(JSON.stringify(message));
    } catch (error) {
      this.emit('error', new Error('Failed to send message'));
    }
  }

  emit(event: string, data?: any): boolean {
    const message: SocketMessage = {
      event,
      data,
      timestamp: new Date()
    };

    // If it's a socket event, send it over the socket
    if (this.isConnected && !['connected', 'disconnected', 'error', 'message'].includes(event)) {
      this.sendMessage(message);
    }

    // Always emit locally for event handlers
    return super.emit(event, data);
  }

  joinRoom(roomId: string, metadata?: any): void {
    this.currentRoom = roomId;
    this.emit('join-room', { roomId, metadata });
  }

  leaveRoom(roomId?: string): void {
    const targetRoom = roomId || this.currentRoom;
    if (targetRoom) {
      this.emit('leave-room', { roomId: targetRoom });
      if (this.currentRoom === targetRoom) {
        this.currentRoom = undefined;
      }
    }
  }

  broadcast(event: string, data?: any): void {
    this.emit('broadcast', { event, data, room: this.currentRoom });
  }

  sendToRoom(roomId: string, event: string, data?: any): void {
    this.emit('room-message', { roomId, event, data });
  }

  sendPrivateMessage(userId: string, event: string, data?: any): void {
    this.emit('private-message', { userId, event, data });
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  getCurrentRoom(): string | undefined {
    return this.currentRoom;
  }

  // Mock WebSocket for testing
  static createMockSocket(): SocketService {
    const service = new SocketService({ 
      url: 'ws://localhost:8080',
      autoConnect: false 
    });

    // Override connect method for testing
    service.connect = async () => {
      service.isConnected = true;
      service.emit('connected');
      return Promise.resolve();
    };

    service.disconnect = () => {
      service.isConnected = false;
      service.emit('disconnected');
    };

    service.sendMessage = (message) => {
      // Mock sending - just emit locally
      setTimeout(() => service.emit(message.event, message.data), 0);
    };

    return service;
  }
}