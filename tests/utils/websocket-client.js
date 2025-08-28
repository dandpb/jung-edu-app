"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.websocketAssertions = exports.websocketHelpers = exports.WebSocketTestClient = void 0;
const ws_1 = require("ws");
const events_1 = require("events");
const test_config_1 = require("../setup/test-config");
const test_helpers_1 = require("./test-helpers");
class WebSocketTestClient extends events_1.EventEmitter {
    constructor(options = {}) {
        super();
        this.ws = null;
        this.isConnected = false;
        this.messageQueue = [];
        this.responseHandlers = new Map();
        this.connectionPromise = null;
        this.pingInterval = null;
        this.url = options.url || test_config_1.testConfig.websocket.url;
        this.options = {
            timeout: test_config_1.testConfig.websocket.timeout,
            ...options
        };
    }
    async connect(token) {
        if (this.isConnected || this.connectionPromise) {
            return this.connectionPromise || Promise.resolve();
        }
        this.connectionPromise = new Promise((resolve, reject) => {
            const headers = {
                ...this.options.headers
            };
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }
            this.ws = new ws_1.WebSocket(this.url, this.options.protocols, {
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
                    const message = JSON.parse(event.data.toString());
                    this.handleMessage(message);
                }
                catch (error) {
                    console.error('Failed to parse WebSocket message:', error);
                    this.emit('error', error);
                }
            };
        });
        return this.connectionPromise;
    }
    async connectWithAuth(role = 'student') {
        const token = test_helpers_1.authHelpers.generateTestToken({ role });
        return this.connect(token);
    }
    disconnect() {
        if (this.ws) {
            this.stopPingInterval();
            this.ws.close();
            this.ws = null;
            this.isConnected = false;
            this.connectionPromise = null;
        }
    }
    startPingInterval() {
        this.pingInterval = setInterval(() => {
            if (this.isConnected && this.ws) {
                this.send({ type: 'ping', timestamp: new Date().toISOString() });
            }
        }, 30000); // Ping every 30 seconds
    }
    stopPingInterval() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }
    handleMessage(message) {
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
    send(message) {
        if (!this.isConnected || !this.ws) {
            throw new Error('WebSocket not connected');
        }
        const messageWithTimestamp = {
            ...message,
            timestamp: message.timestamp || new Date().toISOString()
        };
        this.ws.send(JSON.stringify(messageWithTimestamp));
    }
    async sendAndWait(message, timeout = 5000) {
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
    async waitForMessage(type, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                this.removeListener(type, handler);
                reject(new Error(`Timeout waiting for message type: ${type}`));
            }, timeout);
            const handler = (data) => {
                clearTimeout(timeoutId);
                resolve({ type, data, timestamp: new Date().toISOString() });
            };
            this.once(type, handler);
        });
    }
    async waitForConnection(timeout = 3000) {
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
    getReceivedMessages() {
        return [...this.messageQueue];
    }
    getMessagesByType(type) {
        return this.messageQueue.filter(msg => msg.type === type);
    }
    clearMessageQueue() {
        this.messageQueue = [];
    }
    getLastMessage() {
        return this.messageQueue[this.messageQueue.length - 1] || null;
    }
    getMessageCount() {
        return this.messageQueue.length;
    }
    isConnectedToServer() {
        return this.isConnected;
    }
    // Educational platform specific methods
    async joinCourse(courseId) {
        return this.sendAndWait({
            type: 'course:join',
            data: { courseId }
        });
    }
    async leaveCourse(courseId) {
        return this.sendAndWait({
            type: 'course:leave',
            data: { courseId }
        });
    }
    async joinLiveSession(sessionId) {
        return this.sendAndWait({
            type: 'session:join',
            data: { sessionId }
        });
    }
    async leaveLiveSession(sessionId) {
        return this.sendAndWait({
            type: 'session:leave',
            data: { sessionId }
        });
    }
    async sendChatMessage(sessionId, message) {
        return this.sendAndWait({
            type: 'chat:message',
            data: { sessionId, message }
        });
    }
    async raiseHand(sessionId) {
        return this.sendAndWait({
            type: 'session:raise_hand',
            data: { sessionId }
        });
    }
    async lowerHand(sessionId) {
        return this.sendAndWait({
            type: 'session:lower_hand',
            data: { sessionId }
        });
    }
    async updateProgress(courseId, lessonId, progress) {
        return this.sendAndWait({
            type: 'progress:update',
            data: { courseId, lessonId, progress }
        });
    }
    async submitQuizAnswer(sessionId, questionId, answer) {
        return this.sendAndWait({
            type: 'quiz:answer',
            data: { sessionId, questionId, answer }
        });
    }
    async startCollaboration(sessionId, type) {
        return this.sendAndWait({
            type: 'collaboration:start',
            data: { sessionId, type }
        });
    }
    async sendCollaborationUpdate(sessionId, update) {
        return this.sendAndWait({
            type: 'collaboration:update',
            data: { sessionId, update }
        });
    }
}
exports.WebSocketTestClient = WebSocketTestClient;
// WebSocket test utilities
exports.websocketHelpers = {
    createClient: (options) => {
        return new WebSocketTestClient(options);
    },
    createAuthenticatedClient: async (role = 'student', options) => {
        const client = new WebSocketTestClient(options);
        await client.connectWithAuth(role);
        return client;
    },
    simulateMultipleConnections: async (count, role = 'student') => {
        const clients = [];
        for (let i = 0; i < count; i++) {
            const client = new WebSocketTestClient();
            await client.connectWithAuth(role);
            clients.push(client);
            // Small delay to avoid overwhelming the server
            await test_helpers_1.timeHelpers.sleep(100);
        }
        return clients;
    },
    cleanupClients: async (clients) => {
        for (const client of clients) {
            client.disconnect();
        }
        // Wait a bit for connections to close
        await test_helpers_1.timeHelpers.sleep(100);
    },
    expectMessage: (client, type, timeout = 5000) => {
        return client.waitForMessage(type, timeout);
    },
    expectMessageWithData: async (client, type, expectedData, timeout = 5000) => {
        const message = await client.waitForMessage(type, timeout);
        expect(message.data).toMatchObject(expectedData);
    },
    measureMessageLatency: async (sender, receiver, messageType) => {
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
    testConnectionStability: async (client, duration = 10000) => {
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
        await test_helpers_1.timeHelpers.sleep(duration);
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
exports.websocketAssertions = {
    expectConnected: (client) => {
        expect(client.isConnectedToServer()).toBe(true);
    },
    expectDisconnected: (client) => {
        expect(client.isConnectedToServer()).toBe(false);
    },
    expectMessageReceived: (client, type) => {
        const messages = client.getMessagesByType(type);
        expect(messages.length).toBeGreaterThan(0);
    },
    expectMessageCount: (client, expectedCount) => {
        expect(client.getMessageCount()).toBe(expectedCount);
    },
    expectMessageNotReceived: (client, type) => {
        const messages = client.getMessagesByType(type);
        expect(messages.length).toBe(0);
    },
    expectValidMessage: (message) => {
        expect(message).toHaveProperty('type');
        expect(message).toHaveProperty('timestamp');
        expect(typeof message.type).toBe('string');
        expect(message.type.length).toBeGreaterThan(0);
    },
    expectMessageData: (message, expectedData) => {
        expect(message.data).toMatchObject(expectedData);
    },
    expectFastResponse: (latency, maxLatency = 100) => {
        expect(latency).toBeLessThan(maxLatency);
    }
};
exports.default = {
    WebSocketTestClient,
    websocketHelpers: exports.websocketHelpers,
    websocketAssertions: exports.websocketAssertions
};
//# sourceMappingURL=websocket-client.js.map