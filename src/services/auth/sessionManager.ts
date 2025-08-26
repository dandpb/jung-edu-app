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
 * Supabase-compatible session interface for test compatibility
 */
interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: {
    id: string;
    email: string;
    user_metadata: any;
  };
}

/**
 * Event listener type
 */
type EventListener = (session: SupabaseSession | null) => void;

/**
 * Event handlers storage
 */
interface EventHandlers {
  sessionChanged: EventListener[];
}

/**
 * Session manager class
 */
export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private userSessions: Map<string, Set<string>> = new Map();
  private config: SessionConfig;
  private activityCheckInterval?: number;
  
  // For Supabase-compatible session management (used by tests)
  private currentSession: SupabaseSession | null = null;
  private eventHandlers: EventHandlers = {
    sessionChanged: []
  };
  
  constructor(config: Partial<SessionConfig> = {}) {
    this.config = { ...DEFAULT_SESSION_CONFIG, ...config };
    this.loadFromStorage();
    this.loadSupabaseSession();
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
   * Load Supabase-compatible session from localStorage
   */
  private loadSupabaseSession(): void {
    try {
      if (typeof window !== 'undefined' && localStorage) {
        const stored = localStorage.getItem('auth_session');
        if (stored) {
          this.currentSession = JSON.parse(stored);
        }
      }
    } catch (error) {
      console.error('Failed to load auth session:', error);
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
  public getSessionById(sessionId: string): Session | null {
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

  // =====================================================================
  // SUPABASE-COMPATIBLE SESSION METHODS FOR TESTING
  // =====================================================================

  /**
   * Set the current session (Supabase-compatible)
   */
  public setSession(session: SupabaseSession | null): void {
    this.currentSession = session;
    
    try {
      if (typeof window !== 'undefined' && localStorage) {
        if (session) {
          localStorage.setItem('auth_session', JSON.stringify(session));
        } else {
          localStorage.removeItem('auth_session');
        }
      }
    } catch (error) {
      console.error('Failed to save session to localStorage:', error);
    }

    // Emit session change event
    this.emitSessionChange(session);
  }

  /**
   * Get the current session (Supabase-compatible)
   */
  public getSession(): SupabaseSession | null {
    if (!this.currentSession) {
      this.loadSupabaseSession();
    }
    return this.currentSession;
  }

  /**
   * Clear the current session
   */
  public clearSession(): void {
    this.setSession(null);
  }

  /**
   * Check if current session is valid
   */
  public isValidSession(): boolean {
    const session = this.getSession();
    if (!session) return false;
    if (!session.access_token || typeof session.access_token !== 'string' || session.access_token.trim() === '') return false;
    if (!session.expires_at || typeof session.expires_at !== 'number') return false;

    const now = Math.floor(Date.now() / 1000);
    const bufferTime = 300; // 5 minutes buffer
    
    return session.expires_at > (now + bufferTime);
  }

  /**
   * Get access token from current session
   */
  public getAccessToken(): string | null {
    const session = this.getSession();
    if (!session || !this.isValidSession()) return null;
    return session.access_token;
  }

  /**
   * Get refresh token from current session
   */
  public getRefreshToken(): string | null {
    const session = this.getSession();
    return session ? session.refresh_token : null;
  }

  /**
   * Get user from current session
   */
  public getUser(): any | null {
    const session = this.getSession();
    if (!session || !this.isValidSession()) return null;
    return session.user;
  }

  /**
   * Update current session properties
   */
  public updateSession(updates: Partial<SupabaseSession>): void {
    if (!this.currentSession) return;
    
    const updatedSession = {
      ...this.currentSession,
      ...updates
    };
    
    this.setSession(updatedSession);
  }

  /**
   * Check if session is expiring soon
   */
  public isExpiringSoon(thresholdSeconds: number = 300): boolean {
    const session = this.getSession();
    if (!session || !session.expires_at) return false;

    const now = Math.floor(Date.now() / 1000);
    return session.expires_at <= (now + thresholdSeconds);
  }

  // =====================================================================
  // EVENT HANDLING METHODS
  // =====================================================================

  /**
   * Add event listener
   */
  public on(event: 'sessionChanged', listener: EventListener): void {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(listener);
  }

  /**
   * Remove event listener
   */
  public off(event: 'sessionChanged', listener: EventListener): void {
    if (!this.eventHandlers[event]) return;
    
    const index = this.eventHandlers[event].indexOf(listener);
    if (index > -1) {
      this.eventHandlers[event].splice(index, 1);
    }
  }

  /**
   * Add one-time event listener
   */
  public once(event: 'sessionChanged', listener: EventListener): void {
    const onceWrapper = (session: SupabaseSession | null) => {
      listener(session);
      this.off(event, onceWrapper);
    };
    this.on(event, onceWrapper);
  }

  /**
   * Emit session change event
   */
  private emitSessionChange(session: SupabaseSession | null): void {
    if (!this.eventHandlers.sessionChanged) return;
    
    this.eventHandlers.sessionChanged.forEach(listener => {
      try {
        listener(session);
      } catch (error) {
        console.error('Error in session change listener:', error);
      }
    });
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();