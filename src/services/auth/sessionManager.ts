/**
 * Session Management Service
 * Handles user sessions, activity tracking, and session expiration
 */

import { Session } from '../../types/auth';
import { generateSecureToken } from './crypto';

/**
 * Session configuration
 */
interface SessionConfig {
  absoluteTimeout: number;      // Maximum session duration
  idleTimeout: number;          // Timeout for inactivity
  maxConcurrentSessions: number; // Max sessions per user
  enableDeviceTracking: boolean; // Track device information
}

/**
 * Default session configuration
 */
const DEFAULT_SESSION_CONFIG: SessionConfig = {
  absoluteTimeout: 24 * 60 * 60 * 1000,  // 24 hours
  idleTimeout: 30 * 60 * 1000,           // 30 minutes
  maxConcurrentSessions: 3,
  enableDeviceTracking: true
};

/**
 * Session manager class
 */
export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private userSessions: Map<string, Set<string>> = new Map();
  private config: SessionConfig;
  private activityCheckInterval?: number;
  
  constructor(config: Partial<SessionConfig> = {}) {
    this.config = { ...DEFAULT_SESSION_CONFIG, ...config };
    this.loadFromStorage();
    this.startActivityCheck();
  }
  
  /**
   * Load sessions from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('jungApp_sessions');
      if (stored) {
        const sessions = JSON.parse(stored);
        Object.values(sessions).forEach((session: any) => {
          const parsedSession: Session = {
            ...session,
            createdAt: new Date(session.createdAt),
            lastActivity: new Date(session.lastActivity),
            expiresAt: new Date(session.expiresAt)
          };
          this.sessions.set(parsedSession.id, parsedSession);
          this.addToUserIndex(parsedSession.userId, parsedSession.id);
        });
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  }
  
  /**
   * Save sessions to localStorage
   */
  private saveToStorage(): void {
    const sessions: Record<string, Session> = {};
    this.sessions.forEach((session, id) => {
      sessions[id] = session;
    });
    localStorage.setItem('jungApp_sessions', JSON.stringify(sessions));
  }
  
  /**
   * Add session to user index
   */
  private addToUserIndex(userId: string, sessionId: string): void {
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, new Set());
    }
    this.userSessions.get(userId)!.add(sessionId);
  }
  
  /**
   * Remove session from user index
   */
  private removeFromUserIndex(userId: string, sessionId: string): void {
    const userSessionSet = this.userSessions.get(userId);
    if (userSessionSet) {
      userSessionSet.delete(sessionId);
      if (userSessionSet.size === 0) {
        this.userSessions.delete(userId);
      }
    }
  }
  
  /**
   * Start periodic activity check
   */
  private startActivityCheck(): void {
    this.activityCheckInterval = window.setInterval(() => {
      this.checkExpiredSessions();
    }, 60000); // Check every minute
  }
  
  /**
   * Stop activity check
   */
  public destroy(): void {
    if (this.activityCheckInterval) {
      clearInterval(this.activityCheckInterval);
    }
  }
  
  /**
   * Check and remove expired sessions
   */
  private checkExpiredSessions(): void {
    const now = new Date();
    const expiredSessions: string[] = [];
    
    this.sessions.forEach((session, id) => {
      // Check absolute timeout
      if (session.expiresAt < now) {
        expiredSessions.push(id);
        return;
      }
      
      // Check idle timeout
      const idleTime = now.getTime() - session.lastActivity.getTime();
      if (idleTime > this.config.idleTimeout) {
        expiredSessions.push(id);
      }
    });
    
    // Remove expired sessions
    expiredSessions.forEach(sessionId => {
      this.removeSession(sessionId);
    });
    
    if (expiredSessions.length > 0) {
      this.saveToStorage();
    }
  }
  
  /**
   * Create a new session
   */
  public async createSession(
    userId: string,
    deviceInfo?: {
      deviceId?: string;
      deviceName?: string;
      ipAddress?: string;
      userAgent?: string;
    },
    rememberMe: boolean = false
  ): Promise<Session> {
    // Check concurrent session limit
    const userSessionIds = this.userSessions.get(userId);
    if (userSessionIds && userSessionIds.size >= this.config.maxConcurrentSessions) {
      // Remove oldest session
      const sessions = Array.from(userSessionIds)
        .map(id => this.sessions.get(id)!)
        .filter(Boolean)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      
      if (sessions.length > 0) {
        this.removeSession(sessions[0].id);
      }
    }
    
    const now = new Date();
    const session: Session = {
      id: generateSecureToken(),
      userId,
      deviceId: deviceInfo?.deviceId || generateSecureToken(16),
      deviceName: deviceInfo?.deviceName,
      ipAddress: deviceInfo?.ipAddress || 'unknown',
      userAgent: deviceInfo?.userAgent || navigator.userAgent,
      createdAt: now,
      lastActivity: now,
      expiresAt: new Date(now.getTime() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : this.config.absoluteTimeout)),
      isActive: true
    };
    
    this.sessions.set(session.id, session);
    this.addToUserIndex(userId, session.id);
    this.saveToStorage();
    
    return session;
  }
  
  /**
   * Get session by ID
   */
  public getSession(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    
    // Check if session is still valid
    const now = new Date();
    if (session.expiresAt < now) {
      this.removeSession(sessionId);
      return null;
    }
    
    const idleTime = now.getTime() - session.lastActivity.getTime();
    if (idleTime > this.config.idleTimeout) {
      this.removeSession(sessionId);
      return null;
    }
    
    return session;
  }
  
  /**
   * Update session activity
   */
  public updateActivity(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session && session.isActive) {
      session.lastActivity = new Date();
      this.saveToStorage();
    }
  }
  
  /**
   * Remove session
   */
  public removeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.sessions.delete(sessionId);
      this.removeFromUserIndex(session.userId, sessionId);
      this.saveToStorage();
    }
  }
  
  /**
   * Get all sessions for a user
   */
  public getUserSessions(userId: string): Session[] {
    const sessionIds = this.userSessions.get(userId);
    if (!sessionIds) return [];
    
    const sessions: Session[] = [];
    sessionIds.forEach(id => {
      const session = this.sessions.get(id);
      if (session) {
        sessions.push(session);
      }
    });
    
    return sessions.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
  }
  
  /**
   * Remove all sessions for a user
   */
  public removeUserSessions(userId: string): void {
    const sessionIds = this.userSessions.get(userId);
    if (sessionIds) {
      sessionIds.forEach(id => {
        this.sessions.delete(id);
      });
      this.userSessions.delete(userId);
      this.saveToStorage();
    }
  }
  
  /**
   * Deactivate a session
   */
  public deactivateSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.saveToStorage();
    }
  }
  
  /**
   * Get session statistics
   */
  public getStatistics(): {
    totalSessions: number;
    activeSessions: number;
    uniqueUsers: number;
    averageSessionDuration: number;
  } {
    let activeSessions = 0;
    let totalDuration = 0;
    const now = new Date();
    
    this.sessions.forEach(session => {
      if (session.isActive) {
        activeSessions++;
      }
      totalDuration += session.lastActivity.getTime() - session.createdAt.getTime();
    });
    
    return {
      totalSessions: this.sessions.size,
      activeSessions,
      uniqueUsers: this.userSessions.size,
      averageSessionDuration: this.sessions.size > 0 ? totalDuration / this.sessions.size : 0
    };
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();