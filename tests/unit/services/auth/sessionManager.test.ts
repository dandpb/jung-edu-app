/**
 * Comprehensive Unit Tests for Session Manager
 * Tests session creation, validation, activity tracking, and cleanup
 */

import { SessionManager } from '../../../../src/services/auth/sessionManager';
import { Session } from '../../../../src/types/auth';
import { generateSecureToken } from '../../../../src/services/auth/crypto';

// Mock dependencies
jest.mock('../../../../src/services/auth/crypto');

const mockGenerateSecureToken = generateSecureToken as jest.MockedFunction<typeof generateSecureToken>;

// Mock window.setInterval and clearInterval
global.setInterval = jest.fn();
global.clearInterval = jest.fn();

describe('SessionManager', () => {
  let sessionManager: SessionManager;
  
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    
    mockGenerateSecureToken.mockReturnValue('secure-token-123');
    
    sessionManager = new SessionManager();
  });

  afterEach(() => {
    if (sessionManager) {
      sessionManager.destroy();
    }
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      expect(sessionManager).toBeInstanceOf(SessionManager);
    });

    it('should start activity check interval', () => {
      expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 60000);
    });

    it('should load existing sessions from localStorage', () => {
      const existingSessions = {
        'session-1': {
          id: 'session-1',
          userId: 'user-1',
          deviceId: 'device-1',
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
          createdAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          isActive: true
        }
      };
      
      localStorage.setItem('jungApp_sessions', JSON.stringify(existingSessions));
      
      const newSessionManager = new SessionManager();
      const sessions = newSessionManager.getUserSessions('user-1');
      
      expect(sessions).toHaveLength(1);
      expect(sessions[0].id).toBe('session-1');
      
      newSessionManager.destroy();
    });

    it('should handle localStorage load errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      localStorage.setItem('jungApp_sessions', 'invalid-json');
      
      const newSessionManager = new SessionManager();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load sessions:',
        expect.any(SyntaxError)
      );
      
      newSessionManager.destroy();
      consoleSpy.mockRestore();
    });

    it('should accept custom configuration', () => {
      const customConfig = {
        maxConcurrentSessions: 5,
        idleTimeout: 60000,
        absoluteTimeout: 86400000,
        enableDeviceTracking: false
      };
      
      const customSessionManager = new SessionManager(customConfig);
      
      expect(customSessionManager).toBeInstanceOf(SessionManager);
      
      customSessionManager.destroy();
    });
  });

  describe('Session Creation', () => {
    it('should create a new session', async () => {
      const session = await sessionManager.createSession('user-123');

      expect(session).toMatchObject({
        id: 'secure-token-123',
        userId: 'user-123',
        deviceId: expect.any(String),
        ipAddress: 'unknown',
        userAgent: expect.any(String),
        createdAt: expect.any(Date),
        lastActivity: expect.any(Date),
        expiresAt: expect.any(Date),
        isActive: true
      });
    });

    it('should create session with device information', async () => {
      const deviceInfo = {
        deviceId: 'device-456',
        deviceName: 'iPhone 12',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)'
      };

      const session = await sessionManager.createSession('user-123', deviceInfo);

      expect(session).toMatchObject({
        userId: 'user-123',
        deviceId: 'device-456',
        deviceName: 'iPhone 12',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)',
        isActive: true
      });
    });

    it('should create session with remember me option', async () => {
      const session = await sessionManager.createSession('user-123', undefined, true);
      
      const expiresIn = session.expiresAt.getTime() - session.createdAt.getTime();
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      
      expect(expiresIn).toBeCloseTo(thirtyDaysMs, -100000); // Within ~28 hours tolerance
    });

    it('should enforce concurrent session limit', async () => {
      const customConfig = { maxConcurrentSessions: 2 };
      const customSessionManager = new SessionManager(customConfig);

      // Create 3 sessions (exceeding limit)
      await customSessionManager.createSession('user-123');
      await customSessionManager.createSession('user-123');
      await customSessionManager.createSession('user-123');

      const sessions = customSessionManager.getUserSessions('user-123');
      
      expect(sessions).toHaveLength(2); // Should only keep 2 sessions
      
      customSessionManager.destroy();
    });

    it('should remove oldest session when limit exceeded', async () => {
      const customConfig = { maxConcurrentSessions: 2 };
      const customSessionManager = new SessionManager(customConfig);

      const session1 = await customSessionManager.createSession('user-123');
      
      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const session2 = await customSessionManager.createSession('user-123');
      const session3 = await customSessionManager.createSession('user-123');

      const sessions = customSessionManager.getUserSessions('user-123');
      
      expect(sessions).toHaveLength(2);
      expect(sessions.find(s => s.id === session1.id)).toBeUndefined();
      expect(sessions.find(s => s.id === session2.id)).toBeDefined();
      expect(sessions.find(s => s.id === session3.id)).toBeDefined();
      
      customSessionManager.destroy();
    });

    it('should save sessions to localStorage', async () => {
      await sessionManager.createSession('user-123');

      const storedSessions = localStorage.getItem('jungApp_sessions');
      expect(storedSessions).toBeTruthy();
      
      const sessions = JSON.parse(storedSessions!);
      expect(Object.keys(sessions)).toHaveLength(1);
    });
  });

  describe('Session Retrieval', () => {
    let testSession: Session;

    beforeEach(async () => {
      testSession = await sessionManager.createSession('user-123');
    });

    it('should get session by ID', () => {
      const retrieved = sessionManager.getSessionById(testSession.id);

      expect(retrieved).toEqual(testSession);
    });

    it('should return null for non-existent session', () => {
      const retrieved = sessionManager.getSessionById('non-existent');

      expect(retrieved).toBeNull();
    });

    it('should return null for expired session', async () => {
      jest.useFakeTimers();
      
      // Fast forward past expiration
      jest.advanceTimersByTime(25 * 60 * 60 * 1000); // 25 hours

      const retrieved = sessionManager.getSessionById(testSession.id);

      expect(retrieved).toBeNull();
      
      jest.useRealTimers();
    });

    it('should return null for idle session', async () => {
      jest.useFakeTimers();
      
      // Fast forward past idle timeout
      jest.advanceTimersByTime(31 * 60 * 1000); // 31 minutes

      const retrieved = sessionManager.getSessionById(testSession.id);

      expect(retrieved).toBeNull();
      
      jest.useRealTimers();
    });

    it('should get all sessions for a user', async () => {
      await sessionManager.createSession('user-123');
      await sessionManager.createSession('user-456');

      const userSessions = sessionManager.getUserSessions('user-123');

      expect(userSessions).toHaveLength(2);
      expect(userSessions.every(s => s.userId === 'user-123')).toBe(true);
    });

    it('should return empty array for user with no sessions', () => {
      const userSessions = sessionManager.getUserSessions('no-sessions');

      expect(userSessions).toEqual([]);
    });

    it('should sort user sessions by last activity (most recent first)', async () => {
      const session1 = await sessionManager.createSession('user-123');
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const session2 = await sessionManager.createSession('user-123');
      
      // Update activity for session1 to make it more recent
      sessionManager.updateActivity(session1.id);
      
      const userSessions = sessionManager.getUserSessions('user-123');

      expect(userSessions[0].id).toBe(session1.id);
      expect(userSessions[1].id).toBe(session2.id);
    });
  });

  describe('Activity Tracking', () => {
    let testSession: Session;

    beforeEach(async () => {
      testSession = await sessionManager.createSession('user-123');
    });

    it('should update session activity', () => {
      const originalActivity = testSession.lastActivity;
      
      // Wait a bit to ensure different timestamp
      setTimeout(() => {
        sessionManager.updateActivity(testSession.id);
        
        const updated = sessionManager.getSessionById(testSession.id);
        expect(updated!.lastActivity.getTime()).toBeGreaterThan(originalActivity.getTime());
      }, 10);
    });

    it('should not update inactive session', () => {
      sessionManager.deactivateSession(testSession.id);
      
      const originalActivity = testSession.lastActivity;
      sessionManager.updateActivity(testSession.id);
      
      const updated = sessionManager.getSessionById(testSession.id);
      expect(updated!.lastActivity.getTime()).toBe(originalActivity.getTime());
    });

    it('should ignore update for non-existent session', () => {
      // Should not throw error
      expect(() => {
        sessionManager.updateActivity('non-existent');
      }).not.toThrow();
    });
  });

  describe('Session Removal', () => {
    let testSession: Session;

    beforeEach(async () => {
      testSession = await sessionManager.createSession('user-123');
    });

    it('should remove session by ID', () => {
      sessionManager.removeSession(testSession.id);

      const retrieved = sessionManager.getSessionById(testSession.id);
      expect(retrieved).toBeNull();
    });

    it('should remove session from user index', () => {
      sessionManager.removeSession(testSession.id);

      const userSessions = sessionManager.getUserSessions('user-123');
      expect(userSessions).toHaveLength(0);
    });

    it('should update localStorage after removal', () => {
      sessionManager.removeSession(testSession.id);

      const storedSessions = localStorage.getItem('jungApp_sessions');
      const sessions = JSON.parse(storedSessions!);
      
      expect(sessions[testSession.id]).toBeUndefined();
    });

    it('should handle removal of non-existent session', () => {
      expect(() => {
        sessionManager.removeSession('non-existent');
      }).not.toThrow();
    });

    it('should remove all sessions for a user', async () => {
      await sessionManager.createSession('user-123');
      await sessionManager.createSession('user-456');

      sessionManager.removeUserSessions('user-123');

      const user123Sessions = sessionManager.getUserSessions('user-123');
      const user456Sessions = sessionManager.getUserSessions('user-456');

      expect(user123Sessions).toHaveLength(0);
      expect(user456Sessions).toHaveLength(1);
    });

    it('should handle removal of sessions for user with no sessions', () => {
      expect(() => {
        sessionManager.removeUserSessions('no-sessions');
      }).not.toThrow();
    });
  });

  describe('Session Deactivation', () => {
    let testSession: Session;

    beforeEach(async () => {
      testSession = await sessionManager.createSession('user-123');
    });

    it('should deactivate session', () => {
      sessionManager.deactivateSession(testSession.id);

      const retrieved = sessionManager.getSessionById(testSession.id);
      expect(retrieved!.isActive).toBe(false);
    });

    it('should save changes to localStorage', () => {
      sessionManager.deactivateSession(testSession.id);

      const storedSessions = localStorage.getItem('jungApp_sessions');
      const sessions = JSON.parse(storedSessions!);
      
      expect(sessions[testSession.id].isActive).toBe(false);
    });

    it('should handle deactivation of non-existent session', () => {
      expect(() => {
        sessionManager.deactivateSession('non-existent');
      }).not.toThrow();
    });
  });

  describe('Session Statistics', () => {
    beforeEach(async () => {
      await sessionManager.createSession('user-1');
      await sessionManager.createSession('user-1');
      await sessionManager.createSession('user-2');
      
      // Deactivate one session
      const sessions = sessionManager.getUserSessions('user-1');
      sessionManager.deactivateSession(sessions[0].id);
    });

    it('should calculate session statistics', () => {
      const stats = sessionManager.getStatistics();

      expect(stats).toMatchObject({
        totalSessions: 3,
        activeSessions: 2,
        uniqueUsers: 2,
        averageSessionDuration: expect.any(Number)
      });
    });

    it('should handle statistics with no sessions', () => {
      const emptySessionManager = new SessionManager();
      const stats = emptySessionManager.getStatistics();

      expect(stats).toMatchObject({
        totalSessions: 0,
        activeSessions: 0,
        uniqueUsers: 0,
        averageSessionDuration: 0
      });
      
      emptySessionManager.destroy();
    });

    it('should calculate average session duration correctly', () => {
      const stats = sessionManager.getStatistics();

      expect(stats.averageSessionDuration).toBeGreaterThan(0);
      expect(stats.averageSessionDuration).toBeLessThan(1000); // Should be small for new sessions
    });
  });

  describe('Expired Session Cleanup', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should check for expired sessions periodically', async () => {
      const checkSpy = jest.spyOn(sessionManager as any, 'checkExpiredSessions');
      
      await sessionManager.createSession('user-123');
      
      // Fast forward time to trigger interval
      jest.advanceTimersByTime(60000); // 1 minute
      
      expect(checkSpy).toHaveBeenCalled();
    });

    it('should remove expired sessions', async () => {
      const session = await sessionManager.createSession('user-123');
      
      // Fast forward past expiration
      jest.advanceTimersByTime(25 * 60 * 60 * 1000); // 25 hours
      
      // Manually trigger cleanup
      (sessionManager as any).checkExpiredSessions();
      
      const retrieved = sessionManager.getSessionById(session.id);
      expect(retrieved).toBeNull();
    });

    it('should remove idle sessions', async () => {
      const session = await sessionManager.createSession('user-123');
      
      // Fast forward past idle timeout
      jest.advanceTimersByTime(31 * 60 * 1000); // 31 minutes
      
      // Manually trigger cleanup
      (sessionManager as any).checkExpiredSessions();
      
      const retrieved = sessionManager.getSessionById(session.id);
      expect(retrieved).toBeNull();
    });

    it('should not remove active sessions within timeouts', async () => {
      const session = await sessionManager.createSession('user-123');
      
      // Fast forward but not past timeouts
      jest.advanceTimersByTime(10 * 60 * 1000); // 10 minutes
      
      // Manually trigger cleanup
      (sessionManager as any).checkExpiredSessions();
      
      const retrieved = sessionManager.getSessionById(session.id);
      expect(retrieved).not.toBeNull();
    });
  });

  describe('Supabase-Compatible Session Management', () => {
    const mockSupabaseSession = {
      access_token: 'access-token-123',
      refresh_token: 'refresh-token-456',
      expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      user: {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: {}
      }
    };

    it('should set and get Supabase-compatible session', () => {
      sessionManager.setSession(mockSupabaseSession);

      const retrieved = sessionManager.getSession();
      expect(retrieved).toEqual(mockSupabaseSession);
    });

    it('should store session in localStorage', () => {
      sessionManager.setSession(mockSupabaseSession);

      const stored = localStorage.getItem('auth_session');
      expect(JSON.parse(stored!)).toEqual(mockSupabaseSession);
    });

    it('should clear session', () => {
      sessionManager.setSession(mockSupabaseSession);
      sessionManager.clearSession();

      const retrieved = sessionManager.getSession();
      expect(retrieved).toBeNull();

      const stored = localStorage.getItem('auth_session');
      expect(stored).toBeNull();
    });

    it('should validate session correctly', () => {
      sessionManager.setSession(mockSupabaseSession);

      expect(sessionManager.isValidSession()).toBe(true);
    });

    it('should invalidate session with no access token', () => {
      const invalidSession = { ...mockSupabaseSession, access_token: '' };
      sessionManager.setSession(invalidSession);

      expect(sessionManager.isValidSession()).toBe(false);
    });

    it('should invalidate expired session', () => {
      const expiredSession = {
        ...mockSupabaseSession,
        expires_at: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      };
      sessionManager.setSession(expiredSession);

      expect(sessionManager.isValidSession()).toBe(false);
    });

    it('should get access token from valid session', () => {
      sessionManager.setSession(mockSupabaseSession);

      const token = sessionManager.getAccessToken();
      expect(token).toBe('access-token-123');
    });

    it('should return null for access token from invalid session', () => {
      const invalidSession = { ...mockSupabaseSession, access_token: '' };
      sessionManager.setSession(invalidSession);

      const token = sessionManager.getAccessToken();
      expect(token).toBeNull();
    });

    it('should get refresh token', () => {
      sessionManager.setSession(mockSupabaseSession);

      const token = sessionManager.getRefreshToken();
      expect(token).toBe('refresh-token-456');
    });

    it('should get user from valid session', () => {
      sessionManager.setSession(mockSupabaseSession);

      const user = sessionManager.getUser();
      expect(user).toEqual(mockSupabaseSession.user);
    });

    it('should return null for user from invalid session', () => {
      const expiredSession = {
        ...mockSupabaseSession,
        expires_at: Math.floor(Date.now() / 1000) - 3600
      };
      sessionManager.setSession(expiredSession);

      const user = sessionManager.getUser();
      expect(user).toBeNull();
    });

    it('should update session properties', () => {
      sessionManager.setSession(mockSupabaseSession);

      const updates = {
        access_token: 'new-access-token',
        expires_at: Math.floor(Date.now() / 1000) + 7200 // 2 hours from now
      };

      sessionManager.updateSession(updates);

      const updated = sessionManager.getSession();
      expect(updated?.access_token).toBe('new-access-token');
      expect(updated?.expires_at).toBe(updates.expires_at);
    });

    it('should check if session is expiring soon', () => {
      const soonToExpire = {
        ...mockSupabaseSession,
        expires_at: Math.floor(Date.now() / 1000) + 200 // 200 seconds from now
      };
      sessionManager.setSession(soonToExpire);

      expect(sessionManager.isExpiringSoon(300)).toBe(true); // Within 5 minutes
      expect(sessionManager.isExpiringSoon(100)).toBe(false); // Not within 100 seconds
    });

    it('should handle localStorage errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock localStorage to throw
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = jest.fn().mockImplementation(() => {
        throw new Error('Storage full');
      });

      sessionManager.setSession(mockSupabaseSession);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save session to localStorage:',
        expect.any(Error)
      );

      // Restore
      Storage.prototype.setItem = originalSetItem;
      consoleSpy.mockRestore();
    });

    it('should load existing Supabase session from localStorage', () => {
      localStorage.setItem('auth_session', JSON.stringify(mockSupabaseSession));
      
      const newSessionManager = new SessionManager();
      const retrieved = newSessionManager.getSession();
      
      expect(retrieved).toEqual(mockSupabaseSession);
      
      newSessionManager.destroy();
    });

    it('should handle invalid JSON in localStorage', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      localStorage.setItem('auth_session', 'invalid-json');
      
      const newSessionManager = new SessionManager();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load auth session:',
        expect.any(SyntaxError)
      );
      
      newSessionManager.destroy();
      consoleSpy.mockRestore();
    });
  });

  describe('Event Handling', () => {
    const mockSupabaseSession = {
      access_token: 'access-token-123',
      refresh_token: 'refresh-token-456',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: {}
      }
    };

    it('should emit session change events', () => {
      const listener = jest.fn();
      sessionManager.on('sessionChanged', listener);

      sessionManager.setSession(mockSupabaseSession);

      expect(listener).toHaveBeenCalledWith(mockSupabaseSession);
    });

    it('should remove event listeners', () => {
      const listener = jest.fn();
      sessionManager.on('sessionChanged', listener);
      sessionManager.off('sessionChanged', listener);

      sessionManager.setSession(mockSupabaseSession);

      expect(listener).not.toHaveBeenCalled();
    });

    it('should support one-time event listeners', () => {
      const listener = jest.fn();
      sessionManager.once('sessionChanged', listener);

      sessionManager.setSession(mockSupabaseSession);
      sessionManager.setSession(null);

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should handle listener errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const errorListener = jest.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });

      sessionManager.on('sessionChanged', errorListener);
      sessionManager.setSession(mockSupabaseSession);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in session change listener:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should emit events for session clearing', () => {
      const listener = jest.fn();
      sessionManager.on('sessionChanged', listener);

      sessionManager.setSession(mockSupabaseSession);
      sessionManager.clearSession();

      expect(listener).toHaveBeenCalledTimes(2);
      expect(listener).toHaveBeenNthCalledWith(1, mockSupabaseSession);
      expect(listener).toHaveBeenNthCalledWith(2, null);
    });
  });

  describe('Cleanup and Destruction', () => {
    it('should clean up interval on destroy', () => {
      sessionManager.destroy();

      expect(clearInterval).toHaveBeenCalled();
    });

    it('should handle destroy when no interval is set', () => {
      const newSessionManager = new SessionManager();
      
      // Clear the interval reference
      (newSessionManager as any).activityCheckInterval = undefined;
      
      expect(() => newSessionManager.destroy()).not.toThrow();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle concurrent session operations', async () => {
      const promises = [];
      
      for (let i = 0; i < 10; i++) {
        promises.push(sessionManager.createSession(`user-${i}`));
      }

      const sessions = await Promise.all(promises);
      
      expect(sessions).toHaveLength(10);
      expect(new Set(sessions.map(s => s.id)).size).toBe(10); // All should be unique
    });

    it('should handle sessions with same timestamps', async () => {
      jest.useFakeTimers();
      
      const session1 = await sessionManager.createSession('user-123');
      const session2 = await sessionManager.createSession('user-123');

      const userSessions = sessionManager.getUserSessions('user-123');
      
      expect(userSessions).toHaveLength(2);
      
      jest.useRealTimers();
    });

    it('should handle large numbers of sessions', async () => {
      const sessions = [];
      
      for (let i = 0; i < 1000; i++) {
        sessions.push(await sessionManager.createSession(`user-${i % 10}`));
      }

      const stats = sessionManager.getStatistics();
      
      expect(stats.totalSessions).toBe(1000);
      expect(stats.uniqueUsers).toBe(10);
    });
  });
});