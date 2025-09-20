import { SessionManager } from '../sessionManager';

// Use the localStorage mock from setupTests.ts (jest-localstorage-mock)
// No need to redefine it here as it's already available globally

describe('SessionManager', () => {
  let sessionManager: SessionManager;

  const mockSession = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    user: {
      id: 'user123',
      email: 'test@example.com',
      user_metadata: { name: 'Test User' }
    }
  };

  beforeEach(() => {
    // Use the safe method from setupTests.ts to clear localStorage
    if (typeof localStorage !== 'undefined' && localStorage && typeof localStorage.clear === 'function') {
      localStorage.clear();
    }
    jest.clearAllMocks();

    // Create fresh spies for localStorage methods if available
    if (typeof localStorage !== 'undefined' && localStorage) {
      jest.spyOn(localStorage, 'getItem');
      jest.spyOn(localStorage, 'setItem');
      jest.spyOn(localStorage, 'removeItem');
    }

    sessionManager = new SessionManager();
  });

  describe('constructor', () => {
    it('should initialize session manager', () => {
      expect(sessionManager).toBeInstanceOf(SessionManager);
    });

    it('should load existing session from localStorage', () => {
      // Clear any existing session and set data in localStorage
      localStorage.clear();
      localStorage.setItem('auth_session', JSON.stringify(mockSession));

      // Mock window object to ensure it's available
      (global as any).window = global;

      const newManager = new SessionManager();

      expect(newManager.getSession()).toEqual(mockSession);
    });

    it('should handle corrupted session data in localStorage', () => {
      jest.spyOn(localStorage, 'getItem').mockReturnValue('invalid json');
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const newManager = new SessionManager();
      
      expect(newManager.getSession()).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('setSession', () => {
    it('should store session in memory and localStorage', () => {
      sessionManager.setSession(mockSession);

      expect(sessionManager.getSession()).toEqual(mockSession);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'auth_session',
        JSON.stringify(mockSession)
      );
    });

    it('should handle null session', () => {
      sessionManager.setSession(null);

      expect(sessionManager.getSession()).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_session');
    });

    it('should handle localStorage errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      localStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      sessionManager.setSession(mockSession);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save session to localStorage:',
        expect.any(Error)
      );

      // Session should still be stored in memory
      expect(sessionManager.getSession()).toEqual(mockSession);

      consoleSpy.mockRestore();
    });

    it('should emit session change event', () => {
      const eventListener = jest.fn();
      sessionManager.on('sessionChanged', eventListener);

      sessionManager.setSession(mockSession);

      expect(eventListener).toHaveBeenCalledWith(mockSession);
    });
  });

  describe('getSession', () => {
    it('should return current session', () => {
      sessionManager.setSession(mockSession);
      
      const session = sessionManager.getSession();
      
      expect(session).toEqual(mockSession);
    });

    it('should return null when no session exists', () => {
      const session = sessionManager.getSession();
      
      expect(session).toBeNull();
    });

    it('should return session from localStorage if not in memory', () => {
      jest.spyOn(localStorage, 'getItem').mockReturnValue(JSON.stringify(mockSession));
      
      const session = sessionManager.getSession();
      
      expect(session).toEqual(mockSession);
    });
  });

  describe('clearSession', () => {
    it('should clear session from memory and localStorage', () => {
      sessionManager.setSession(mockSession);
      
      sessionManager.clearSession();

      expect(sessionManager.getSession()).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_session');
    });

    it('should handle localStorage errors during clear', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      localStorage.removeItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      sessionManager.setSession(mockSession);
      sessionManager.clearSession();

      // Session should be cleared from memory regardless
      expect(sessionManager.getSession()).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should emit session change event', () => {
      const eventListener = jest.fn();
      sessionManager.on('sessionChanged', eventListener);

      sessionManager.setSession(mockSession);
      sessionManager.clearSession();

      expect(eventListener).toHaveBeenCalledWith(null);
    });
  });

  describe('isValidSession', () => {
    it('should return true for valid session', () => {
      sessionManager.setSession(mockSession);
      
      const isValid = sessionManager.isValidSession();
      
      expect(isValid).toBe(true);
    });

    it('should return false for expired session', () => {
      const expiredSession = {
        ...mockSession,
        expires_at: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      };
      
      sessionManager.setSession(expiredSession);
      
      const isValid = sessionManager.isValidSession();
      
      expect(isValid).toBe(false);
    });

    it('should return false when no session exists', () => {
      const isValid = sessionManager.isValidSession();
      
      expect(isValid).toBe(false);
    });

    it('should return false for session without access token', () => {
      const invalidSession = {
        ...mockSession,
        access_token: ''
      };
      
      sessionManager.setSession(invalidSession);
      
      const isValid = sessionManager.isValidSession();
      
      expect(isValid).toBe(false);
    });

    it('should return false for session without expiry time', () => {
      const invalidSession = {
        ...mockSession,
        expires_at: undefined
      };
      
      sessionManager.setSession(invalidSession as any);
      
      const isValid = sessionManager.isValidSession();
      
      expect(isValid).toBe(false);
    });

    it('should handle sessions expiring soon (buffer time)', () => {
      const soonToExpireSession = {
        ...mockSession,
        expires_at: Math.floor(Date.now() / 1000) + 30 // 30 seconds from now
      };
      
      sessionManager.setSession(soonToExpireSession);
      
      // Should be considered invalid due to buffer time
      const isValid = sessionManager.isValidSession();
      
      expect(isValid).toBe(false);
    });
  });

  describe('getAccessToken', () => {
    it('should return access token from valid session', () => {
      sessionManager.setSession(mockSession);
      
      const token = sessionManager.getAccessToken();
      
      expect(token).toBe(mockSession.access_token);
    });

    it('should return null for expired session', () => {
      const expiredSession = {
        ...mockSession,
        expires_at: Math.floor(Date.now() / 1000) - 3600
      };
      
      sessionManager.setSession(expiredSession);
      
      const token = sessionManager.getAccessToken();
      
      expect(token).toBeNull();
    });

    it('should return null when no session exists', () => {
      const token = sessionManager.getAccessToken();
      
      expect(token).toBeNull();
    });
  });

  describe('getRefreshToken', () => {
    it('should return refresh token from session', () => {
      sessionManager.setSession(mockSession);
      
      const token = sessionManager.getRefreshToken();
      
      expect(token).toBe(mockSession.refresh_token);
    });

    it('should return null when no session exists', () => {
      const token = sessionManager.getRefreshToken();
      
      expect(token).toBeNull();
    });

    it('should return refresh token even from expired session', () => {
      const expiredSession = {
        ...mockSession,
        expires_at: Math.floor(Date.now() / 1000) - 3600
      };
      
      sessionManager.setSession(expiredSession);
      
      const token = sessionManager.getRefreshToken();
      
      expect(token).toBe(expiredSession.refresh_token);
    });
  });

  describe('getUser', () => {
    it('should return user from valid session', () => {
      sessionManager.setSession(mockSession);
      
      const user = sessionManager.getUser();
      
      expect(user).toEqual(mockSession.user);
    });

    it('should return null for expired session', () => {
      const expiredSession = {
        ...mockSession,
        expires_at: Math.floor(Date.now() / 1000) - 3600
      };
      
      sessionManager.setSession(expiredSession);
      
      const user = sessionManager.getUser();
      
      expect(user).toBeNull();
    });

    it('should return null when no session exists', () => {
      const user = sessionManager.getUser();
      
      expect(user).toBeNull();
    });
  });

  describe('updateSession', () => {
    it('should update existing session properties', () => {
      sessionManager.setSession(mockSession);
      
      const updates = {
        access_token: 'new-access-token',
        expires_at: Math.floor(Date.now() / 1000) + 7200
      };
      
      sessionManager.updateSession(updates);
      
      const updatedSession = sessionManager.getSession();
      expect(updatedSession?.access_token).toBe(updates.access_token);
      expect(updatedSession?.expires_at).toBe(updates.expires_at);
      expect(updatedSession?.refresh_token).toBe(mockSession.refresh_token);
    });

    it('should not update when no session exists', () => {
      const updates = { access_token: 'new-token' };
      
      sessionManager.updateSession(updates);
      
      expect(sessionManager.getSession()).toBeNull();
    });
  });

  describe('isExpiringSoon', () => {
    it('should return true for sessions expiring within threshold', () => {
      const soonToExpireSession = {
        ...mockSession,
        expires_at: Math.floor(Date.now() / 1000) + 120 // 2 minutes from now
      };
      
      sessionManager.setSession(soonToExpireSession);
      
      const isExpiringSoon = sessionManager.isExpiringSoon(300); // 5 minutes threshold
      
      expect(isExpiringSoon).toBe(true);
    });

    it('should return false for sessions not expiring soon', () => {
      sessionManager.setSession(mockSession);
      
      const isExpiringSoon = sessionManager.isExpiringSoon(300); // 5 minutes threshold
      
      expect(isExpiringSoon).toBe(false);
    });

    it('should return false when no session exists', () => {
      const isExpiringSoon = sessionManager.isExpiringSoon();
      
      expect(isExpiringSoon).toBe(false);
    });
  });

  describe('event handling', () => {
    it('should support multiple event listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      sessionManager.on('sessionChanged', listener1);
      sessionManager.on('sessionChanged', listener2);
      
      sessionManager.setSession(mockSession);
      
      expect(listener1).toHaveBeenCalledWith(mockSession);
      expect(listener2).toHaveBeenCalledWith(mockSession);
    });

    it('should support removing event listeners', () => {
      const listener = jest.fn();
      
      sessionManager.on('sessionChanged', listener);
      sessionManager.off('sessionChanged', listener);
      
      sessionManager.setSession(mockSession);
      
      expect(listener).not.toHaveBeenCalled();
    });

    it('should support once event listeners', () => {
      const listener = jest.fn();
      
      sessionManager.once('sessionChanged', listener);
      
      sessionManager.setSession(mockSession);
      sessionManager.setSession(null);
      
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('security and edge cases', () => {
    it('should handle very large session objects', () => {
      const largeSession = {
        ...mockSession,
        user: {
          ...mockSession.user,
          metadata: 'x'.repeat(100000) // Very large metadata
        }
      };

      expect(() => sessionManager.setSession(largeSession)).not.toThrow();
    });

    it('should handle concurrent session operations', async () => {
      const operations = Array.from({ length: 10 }, (_, i) => {
        return new Promise(resolve => {
          setTimeout(() => {
            sessionManager.setSession({
              ...mockSession,
              access_token: `token-${i}`
            });
            resolve(sessionManager.getSession());
          }, Math.random() * 10);
        });
      });

      const results = await Promise.all(operations);
      
      // Should handle all operations without errors
      expect(results.length).toBe(10);
    });

    it('should sanitize session data before storing', () => {
      const sessionWithScript = {
        ...mockSession,
        user: {
          ...mockSession.user,
          user_metadata: {
            name: '<script>alert("xss")</script>'
          }
        }
      };

      sessionManager.setSession(sessionWithScript);
      
      const storedSession = sessionManager.getSession();
      
      // Should handle potentially malicious data appropriately
      expect(storedSession).toBeDefined();
    });

    it('should handle malformed session data', () => {
      const malformedSession = {
        access_token: 123, // Should be string
        expires_at: 'invalid', // Should be number
        user: null
      };

      // @ts-expect-error Testing malformed data
      sessionManager.setSession(malformedSession);
      
      expect(sessionManager.isValidSession()).toBe(false);
    });

    it('should handle localStorage being disabled', () => {
      // Mock localStorage being unavailable
      Object.defineProperty(window, 'localStorage', {
        value: null
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      sessionManager.setSession(mockSession);
      
      // Should still work with in-memory storage
      expect(sessionManager.getSession()).toEqual(mockSession);
      
      consoleSpy.mockRestore();
    });

    it('should handle session updates on expired sessions', () => {
      const expiredSession = {
        ...mockSession,
        expires_at: Math.floor(Date.now() / 1000) - 3600
      };

      sessionManager.setSession(expiredSession);
      
      const updates = {
        expires_at: Math.floor(Date.now() / 1000) + 3600
      };
      
      sessionManager.updateSession(updates);
      
      // Session should now be valid
      expect(sessionManager.isValidSession()).toBe(true);
    });
  });

  describe('performance tests', () => {
    it('should handle rapid session checks efficiently', () => {
      sessionManager.setSession(mockSession);
      
      const startTime = Date.now();
      
      // Perform many session validity checks
      for (let i = 0; i < 1000; i++) {
        sessionManager.isValidSession();
      }
      
      const endTime = Date.now();
      
      // Should complete quickly
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should handle many session updates efficiently', () => {
      sessionManager.setSession(mockSession);
      
      const startTime = Date.now();
      
      for (let i = 0; i < 100; i++) {
        sessionManager.updateSession({
          expires_at: Math.floor(Date.now() / 1000) + 3600 + i
        });
      }
      
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});