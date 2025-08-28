import { EventEmitter } from 'events';
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
export declare class WebSocketTestClient extends EventEmitter {
    private ws;
    private url;
    private options;
    private isConnected;
    private messageQueue;
    private responseHandlers;
    private connectionPromise;
    private pingInterval;
    constructor(options?: WebSocketTestOptions);
    connect(token?: string): Promise<void>;
    connectWithAuth(role?: 'student' | 'teacher' | 'admin'): Promise<void>;
    disconnect(): void;
    private startPingInterval;
    private stopPingInterval;
    private handleMessage;
    send(message: WebSocketMessage): void;
    sendAndWait(message: WebSocketMessage, timeout?: number): Promise<WebSocketMessage>;
    waitForMessage(type: string, timeout?: number): Promise<WebSocketMessage>;
    waitForConnection(timeout?: number): Promise<void>;
    getReceivedMessages(): WebSocketMessage[];
    getMessagesByType(type: string): WebSocketMessage[];
    clearMessageQueue(): void;
    getLastMessage(): WebSocketMessage | null;
    getMessageCount(): number;
    isConnectedToServer(): boolean;
    joinCourse(courseId: string): Promise<WebSocketMessage>;
    leaveCourse(courseId: string): Promise<WebSocketMessage>;
    joinLiveSession(sessionId: string): Promise<WebSocketMessage>;
    leaveLiveSession(sessionId: string): Promise<WebSocketMessage>;
    sendChatMessage(sessionId: string, message: string): Promise<WebSocketMessage>;
    raiseHand(sessionId: string): Promise<WebSocketMessage>;
    lowerHand(sessionId: string): Promise<WebSocketMessage>;
    updateProgress(courseId: string, lessonId: string, progress: number): Promise<WebSocketMessage>;
    submitQuizAnswer(sessionId: string, questionId: string, answer: any): Promise<WebSocketMessage>;
    startCollaboration(sessionId: string, type: 'whiteboard' | 'document'): Promise<WebSocketMessage>;
    sendCollaborationUpdate(sessionId: string, update: any): Promise<WebSocketMessage>;
}
export declare const websocketHelpers: {
    createClient: (options?: WebSocketTestOptions) => WebSocketTestClient;
    createAuthenticatedClient: (role?: "student" | "teacher" | "admin", options?: WebSocketTestOptions) => Promise<WebSocketTestClient>;
    simulateMultipleConnections: (count: number, role?: "student" | "teacher" | "admin") => Promise<WebSocketTestClient[]>;
    cleanupClients: (clients: WebSocketTestClient[]) => Promise<void>;
    expectMessage: (client: WebSocketTestClient, type: string, timeout?: number) => Promise<WebSocketMessage>;
    expectMessageWithData: (client: WebSocketTestClient, type: string, expectedData: any, timeout?: number) => Promise<void>;
    measureMessageLatency: (sender: WebSocketTestClient, receiver: WebSocketTestClient, messageType: string) => Promise<number>;
    testConnectionStability: (client: WebSocketTestClient, duration?: number) => Promise<{
        connected: boolean;
        messagesSent: number;
        messagesReceived: number;
    }>;
};
export declare const websocketAssertions: {
    expectConnected: (client: WebSocketTestClient) => void;
    expectDisconnected: (client: WebSocketTestClient) => void;
    expectMessageReceived: (client: WebSocketTestClient, type: string) => void;
    expectMessageCount: (client: WebSocketTestClient, expectedCount: number) => void;
    expectMessageNotReceived: (client: WebSocketTestClient, type: string) => void;
    expectValidMessage: (message: WebSocketMessage) => void;
    expectMessageData: (message: WebSocketMessage, expectedData: any) => void;
    expectFastResponse: (latency: number, maxLatency?: number) => void;
};
declare const _default: {
    WebSocketTestClient: typeof WebSocketTestClient;
    websocketHelpers: {
        createClient: (options?: WebSocketTestOptions) => WebSocketTestClient;
        createAuthenticatedClient: (role?: "student" | "teacher" | "admin", options?: WebSocketTestOptions) => Promise<WebSocketTestClient>;
        simulateMultipleConnections: (count: number, role?: "student" | "teacher" | "admin") => Promise<WebSocketTestClient[]>;
        cleanupClients: (clients: WebSocketTestClient[]) => Promise<void>;
        expectMessage: (client: WebSocketTestClient, type: string, timeout?: number) => Promise<WebSocketMessage>;
        expectMessageWithData: (client: WebSocketTestClient, type: string, expectedData: any, timeout?: number) => Promise<void>;
        measureMessageLatency: (sender: WebSocketTestClient, receiver: WebSocketTestClient, messageType: string) => Promise<number>;
        testConnectionStability: (client: WebSocketTestClient, duration?: number) => Promise<{
            connected: boolean;
            messagesSent: number;
            messagesReceived: number;
        }>;
    };
    websocketAssertions: {
        expectConnected: (client: WebSocketTestClient) => void;
        expectDisconnected: (client: WebSocketTestClient) => void;
        expectMessageReceived: (client: WebSocketTestClient, type: string) => void;
        expectMessageCount: (client: WebSocketTestClient, expectedCount: number) => void;
        expectMessageNotReceived: (client: WebSocketTestClient, type: string) => void;
        expectValidMessage: (message: WebSocketMessage) => void;
        expectMessageData: (message: WebSocketMessage, expectedData: any) => void;
        expectFastResponse: (latency: number, maxLatency?: number) => void;
    };
};
export default _default;
//# sourceMappingURL=websocket-client.d.ts.map