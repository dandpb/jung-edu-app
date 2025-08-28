import { WebSocket } from 'ws';
import { EventEmitter } from 'events';
import { testConfig } from '../setup/test-config';
import { authHelpers, timeHelpers } from './test-helpers';

/**
 * WebSocket Test Client for jaqEdu Platform
 * Provides utilities for testing real-time features
 */

export interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp?: string;
  id?: string;
}

export interface WebSocketTestOptions {
  url?: string;
  timeout?: number;
  headers?: Record<string, string>;
  protocols?: string | string[];
}

export class WebSocketTestClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private url: string;
  private options: WebSocketTestOptions;
  private isConnected = false;
  private messageQueue: WebSocketMessage[] = [];
  private responseHandlers: Map<string, (message: WebSocketMessage) => void> = new Map();
  private connectionPromise: Promise<void> | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  
  constructor(options: WebSocketTestOptions = {}) {
    super();
    this.url = options.url || testConfig.websocket.url;
    this.options = {
      timeout: testConfig.websocket.timeout,
      ...options
    };
  }
  
  async connect(token?: string): Promise<void> {
    if (this.isConnected || this.connectionPromise) {
      return this.connectionPromise || Promise.resolve();
    }
    
    this.connectionPromise = new Promise((resolve, reject) => {
      const headers: Record<string, string> = {
        ...this.options.headers
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      this.ws = new WebSocket(this.url, this.options.protocols, {
        headers,
        timeout: this.options.timeout
      });
      
      const timeout = setTimeout(() => {
        reject(new Error('WebSocket connection timeout'));
        this.ws?.terminate();
      }, this.options.timeout || 3000);
      
      this.ws.onopen = () => {
        clearTimeout(timeout);
        this.isConnected = true;
        this.emit('connected');
        this.startPingInterval();
        resolve();
      };
      
      this.ws.onclose = (event) => {
        clearTimeout(timeout);
        this.isConnected = false;
        this.stopPingInterval();
        this.emit('disconnected', event);
        this.connectionPromise = null;
      };
      
      this.ws.onerror = (error) => {
        clearTimeout(timeout);
        this.emit('error', error);
        reject(error);
      };
      
      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data.toString());
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
          this.emit('error', error);
        }
      };
    });
    
    return this.connectionPromise;
  }
  
  async connectWithAuth(role: 'student' | 'teacher' | 'admin' = 'student'): Promise<void> {
    const token = authHelpers.generateTestToken({ role });
    return this.connect(token);
  }
  
  disconnect(): void {
    if (this.ws) {
      this.stopPingInterval();
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
      this.connectionPromise = null;
    }
  }
  
  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      if (this.isConnected && this.ws) {
        this.send({ type: 'ping', timestamp: new Date().toISOString() });
      }
    }, 30000); // Ping every 30 seconds
  }
  
  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
  
  private handleMessage(message: WebSocketMessage): void {
    this.messageQueue.push(message);
    this.emit('message', message);
    
    // Handle response handlers
    if (message.id && this.responseHandlers.has(message.id)) {
      const handler = this.responseHandlers.get(message.id);
      if (handler) {
        handler(message);
        this.responseHandlers.delete(message.id);
      }
    }
    
    // Emit specific message type events
    if (message.type) {
      this.emit(message.type, message.data);
    }
  }
  
  send(message: WebSocketMessage): void {
    if (!this.isConnected || !this.ws) {
      throw new Error('WebSocket not connected');
    }
    
    const messageWithTimestamp = {
      ...message,
      timestamp: message.timestamp || new Date().toISOString()
    };
    
    this.ws.send(JSON.stringify(messageWithTimestamp));
  }
  
  async sendAndWait(message: WebSocketMessage, timeout: number = 5000): Promise<WebSocketMessage> {
    return new Promise((resolve, reject) => {
      const messageId = message.id || `msg_${Date.now()}_${Math.random()}`;
      const messageWithId = { ...message, id: messageId };
      
      const timeoutId = setTimeout(() => {
        this.responseHandlers.delete(messageId);
        reject(new Error(`WebSocket request timeout after ${timeout}ms`));
      }, timeout);
      
      this.responseHandlers.set(messageId, (response) => {
        clearTimeout(timeoutId);
        resolve(response);
      });
      
      this.send(messageWithId);
    });
  }
  
  async waitForMessage(type: string, timeout: number = 5000): Promise<WebSocketMessage> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.removeListener(type, handler);
        reject(new Error(`Timeout waiting for message type: ${type}`));
      }, timeout);
      
      const handler = (data: any) => {
        clearTimeout(timeoutId);
        resolve({ type, data, timestamp: new Date().toISOString() });
      };
      
      this.once(type, handler);
    });
  }
  
  async waitForConnection(timeout: number = 3000): Promise<void> {
    if (this.isConnected) {
      return Promise.resolve();
    }
    
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.removeListener('connected', handler);
        reject(new Error('Connection timeout'));
      }, timeout);
      
      const handler = () => {
        clearTimeout(timeoutId);
        resolve();
      };
      
      this.once('connected', handler);
    });
  }
  
  getReceivedMessages(): WebSocketMessage[] {
    return [...this.messageQueue];
  }
  
  getMessagesByType(type: string): WebSocketMessage[] {
    return this.messageQueue.filter(msg => msg.type === type);
  }
  
  clearMessageQueue(): void {
    this.messageQueue = [];
  }
  
  getLastMessage(): WebSocketMessage | null {
    return this.messageQueue[this.messageQueue.length - 1] || null;
  }
  
  getMessageCount(): number {
    return this.messageQueue.length;
  }
  
  isConnectedToServer(): boolean {
    return this.isConnected;
  }
  
  // Educational platform specific methods
  
  async joinCourse(courseId: string): Promise<WebSocketMessage> {
    return this.sendAndWait({
      type: 'course:join',
      data: { courseId }
    });
  }
  
  async leaveCourse(courseId: string): Promise<WebSocketMessage> {
    return this.sendAndWait({
      type: 'course:leave',
      data: { courseId }
    });
  }
  
  async joinLiveSession(sessionId: string): Promise<WebSocketMessage> {
    return this.sendAndWait({
      type: 'session:join',
      data: { sessionId }
    });
  }
  
  async leaveLiveSession(sessionId: string): Promise<WebSocketMessage> {
    return this.sendAndWait({
      type: 'session:leave',
      data: { sessionId }
    });
  }
  
  async sendChatMessage(sessionId: string, message: string): Promise<WebSocketMessage> {
    return this.sendAndWait({
      type: 'chat:message',
      data: { sessionId, message }
    });
  }
  
  async raiseHand(sessionId: string): Promise<WebSocketMessage> {
    return this.sendAndWait({
      type: 'session:raise_hand',
      data: { sessionId }
    });
  }
  
  async lowerHand(sessionId: string): Promise<WebSocketMessage> {
    return this.sendAndWait({
      type: 'session:lower_hand',
      data: { sessionId }
    });
  }
  
  async updateProgress(courseId: string, lessonId: string, progress: number): Promise<WebSocketMessage> {
    return this.sendAndWait({
      type: 'progress:update',
      data: { courseId, lessonId, progress }
    });
  }
  
  async submitQuizAnswer(sessionId: string, questionId: string, answer: any): Promise<WebSocketMessage> {
    return this.sendAndWait({
      type: 'quiz:answer',
      data: { sessionId, questionId, answer }
    });
  }
  
  async startCollaboration(sessionId: string, type: 'whiteboard' | 'document'): Promise<WebSocketMessage> {
    return this.sendAndWait({
      type: 'collaboration:start',
      data: { sessionId, type }
    });
  }
  
  async sendCollaborationUpdate(sessionId: string, update: any): Promise<WebSocketMessage> {
    return this.sendAndWait({
      type: 'collaboration:update',
      data: { sessionId, update }
    });
  }
}

// WebSocket test utilities
export const websocketHelpers = {
  createClient: (options?: WebSocketTestOptions): WebSocketTestClient => {
    return new WebSocketTestClient(options);
  },
  
  createAuthenticatedClient: async (role: 'student' | 'teacher' | 'admin' = 'student', options?: WebSocketTestOptions): Promise<WebSocketTestClient> => {
    const client = new WebSocketTestClient(options);
    await client.connectWithAuth(role);
    return client;
  },
  
  simulateMultipleConnections: async (count: number, role: 'student' | 'teacher' | 'admin' = 'student'): Promise<WebSocketTestClient[]> => {
    const clients: WebSocketTestClient[] = [];
    
    for (let i = 0; i < count; i++) {
      const client = new WebSocketTestClient();
      await client.connectWithAuth(role);
      clients.push(client);
      
      // Small delay to avoid overwhelming the server
      await timeHelpers.sleep(100);
    }
    
    return clients;
  },
  
  cleanupClients: async (clients: WebSocketTestClient[]): Promise<void> => {
    for (const client of clients) {
      client.disconnect();
    }
    
    // Wait a bit for connections to close
    await timeHelpers.sleep(100);
  },
  
  expectMessage: (client: WebSocketTestClient, type: string, timeout: number = 5000): Promise<WebSocketMessage> => {
    return client.waitForMessage(type, timeout);
  },
  
  expectMessageWithData: async (client: WebSocketTestClient, type: string, expectedData: any, timeout: number = 5000): Promise<void> => {
    const message = await client.waitForMessage(type, timeout);
    expect(message.data).toMatchObject(expectedData);
  },
  
  measureMessageLatency: async (sender: WebSocketTestClient, receiver: WebSocketTestClient, messageType: string): Promise<number> => {
    const startTime = performance.now();
    
    const receivePromise = receiver.waitForMessage(messageType);
    
    sender.send({
      type: messageType,
      data: { test: true },
      timestamp: new Date().toISOString()
    });
    
    await receivePromise;
    
    return performance.now() - startTime;
  },
  
  testConnectionStability: async (client: WebSocketTestClient, duration: number = 10000): Promise<{ connected: boolean; messagesSent: number; messagesReceived: number }> => {
    let messagesSent = 0;
    let messagesReceived = 0;
    
    const messageListener = () => {
      messagesReceived++;
    };
    
    client.on('message', messageListener);
    
    const interval = setInterval(() => {
      if (client.isConnectedToServer()) {
        client.send({
          type: 'test',
          data: { timestamp: Date.now() }
        });
        messagesSent++;
      }
    }, 1000);
    
    await timeHelpers.sleep(duration);
    
    clearInterval(interval);
    client.removeListener('message', messageListener);
    
    return {
      connected: client.isConnectedToServer(),
      messagesSent,
      messagesReceived
    };
  }
};

// WebSocket test assertions
export const websocketAssertions = {
  expectConnected: (client: WebSocketTestClient): void => {
    expect(client.isConnectedToServer()).toBe(true);
  },
  
  expectDisconnected: (client: WebSocketTestClient): void => {
    expect(client.isConnectedToServer()).toBe(false);
  },
  
  expectMessageReceived: (client: WebSocketTestClient, type: string): void => {
    const messages = client.getMessagesByType(type);
    expect(messages.length).toBeGreaterThan(0);
  },
  
  expectMessageCount: (client: WebSocketTestClient, expectedCount: number): void => {
    expect(client.getMessageCount()).toBe(expectedCount);
  },
  
  expectMessageNotReceived: (client: WebSocketTestClient, type: string): void => {
    const messages = client.getMessagesByType(type);
    expect(messages.length).toBe(0);
  },
  
  expectValidMessage: (message: WebSocketMessage): void => {
    expect(message).toHaveProperty('type');
    expect(message).toHaveProperty('timestamp');
    expect(typeof message.type).toBe('string');
    expect(message.type.length).toBeGreaterThan(0);
  },
  
  expectMessageData: (message: WebSocketMessage, expectedData: any): void => {
    expect(message.data).toMatchObject(expectedData);
  },
  
  expectFastResponse: (latency: number, maxLatency: number = 100): void => {
    expect(latency).toBeLessThan(maxLatency);
  }
};

export default {
  WebSocketTestClient,
  websocketHelpers,
  websocketAssertions
};
