/**
 * Comprehensive test suite for AdminContext
 * Tests admin authentication, module management, session handling, and context state
 */

import React, { ReactNode } from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminProvider, useAdmin } from '../AdminContext';
import { Module, AdminUser } from '../../types';

// Mock dependencies
jest.mock('../../utils/auth', () => ({
  hashPassword: jest.fn((password: string, salt: string) => `hashed_${password}_${salt}`),
  createSessionToken: jest.fn((userId: string, expiry: number) => `token_${userId}_${expiry}`),
  validateSessionToken: jest.fn(),
}));

jest.mock('../../config/admin', () => ({
  ADMIN_CONFIG: {
    defaultAdmin: {
      username: 'admin',
      passwordHash: 'hashed_jungadmin123_default_salt',
      salt: 'default_salt'
    },
    session: {
      tokenKey: 'admin_session_token',
      expiry: 24 * 60 * 60 * 1000 // 24 hours
    }
  }
}));

jest.mock('../../data/modules', () => ({
  modules: [
    {
      id: 'test-module-1',
      title: 'Test Module 1',
      description: 'First test module',
      difficulty: 'beginner',
      icon: '🧠',
      estimatedTime: 30,
      topics: ['Test Topic 1'],
      content: 'Test content 1',
      quiz: { questions: [], passingScore: 70 }
    },
    {
      id: 'test-module-2',
      title: 'Test Module 2',
      description: 'Second test module',
      difficulty: 'intermediate',
      icon: '📚',
      estimatedTime: 45,
      topics: ['Test Topic 2'],
      content: 'Test content 2',
      quiz: { questions: [], passingScore: 70 }
    }
  ]
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Test component to access admin context
const TestAdminComponent = () => {
  const { 
    isAdmin, 
    currentAdmin, 
    login, 
    logout, 
    modules, 
    updateModules 
  } = useAdmin();

  return (
    <div>
      <span data-testid="is-admin">{isAdmin ? 'true' : 'false'}</span>
      <span data-testid="current-admin">{currentAdmin ? currentAdmin.username : 'none'}</span>
      <span data-testid="modules-count">{modules.length}</span>
      <span data-testid="first-module-title">{modules[0]?.title || 'none'}</span>
      
      <button 
        data-testid="login-button"
        onClick={() => login('admin', 'jungadmin123')}
      >
        Login
      </button>
      
      <button 
        data-testid="login-wrong-password"
        onClick={() => login('admin', 'wrongpassword')}
      >
        Login Wrong Password
      </button>
      
      <button 
        data-testid="login-wrong-username"
        onClick={() => login('wronguser', 'jungadmin123')}
      >
        Login Wrong Username
      </button>
      
      <button 
        data-testid="logout-button"
        onClick={() => logout()}
      >
        Logout
      </button>
      
      <button
        data-testid="update-modules"
        onClick={() => updateModules([{
          id: 'new-module',
          title: 'New Test Module',
          description: 'Updated module',
          difficulty: 'advanced' as const,
          icon: '🎯',
          estimatedTime: 60,
          topics: ['New Topic'],
          content: 'New content',
          quiz: { questions: [], passingScore: 80 }
        }])}
      >
        Update Modules
      </button>
    </div>
  );
};

// Error boundary test component
const TestComponentWithError = () => {
  try {
    useAdmin();
    return <div>Should not render</div>;
  } catch (error) {
    return <div data-testid="error-message">{(error as Error).message}</div>;
  }
};

describe('AdminContext', () => {
  const mockHashPassword = require('../../utils/auth').hashPassword as jest.Mock;
  const mockCreateSessionToken = require('../../utils/auth').createSessionToken as jest.Mock;
  const mockValidateSessionToken = require('../../utils/auth').validateSessionToken as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    
    // Reset auth mocks
    mockHashPassword.mockImplementation((password: string, salt: string) => `hashed_${password}_${salt}`);
    mockCreateSessionToken.mockImplementation((userId: string, expiry: number) => `token_${userId}_${expiry}`);
    mockValidateSessionToken.mockReturnValue(null);
  });

  describe('AdminProvider Initialization', () => {
    it('should provide admin context to children', () => {
      render(
        <AdminProvider>
          <TestAdminComponent />
        </AdminProvider>
      );

      expect(screen.getByTestId('is-admin')).toHaveTextContent('false');
      expect(screen.getByTestId('current-admin')).toHaveTextContent('none');
      expect(screen.getByTestId('modules-count')).toHaveTextContent('2');
    });

    it('should initialize with default modules', () => {
      render(
        <AdminProvider>
          <TestAdminComponent />
        </AdminProvider>
      );

      expect(screen.getByTestId('first-module-title')).toHaveTextContent('Test Module 1');
    });

    it('should load modules from localStorage when available', () => {
      const storedModules = [
        {
          id: 'stored-module',
          title: 'Stored Module',
          description: 'From localStorage',
          difficulty: 'beginner',
          icon: '💾',
          estimatedTime: 20,
          topics: ['Storage'],
          content: 'Stored content',
          quiz: { questions: [], passingScore: 70 }
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedModules));

      render(
        <AdminProvider>
          <TestAdminComponent />
        </AdminProvider>
      );

      expect(screen.getByTestId('modules-count')).toHaveTextContent('1');
      expect(screen.getByTestId('first-module-title')).toHaveTextContent('Stored Module');
    });

    it('should handle corrupted localStorage data gracefully', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      localStorageMock.getItem.mockReturnValue('{ invalid json }');

      render(
        <AdminProvider>
          <TestAdminComponent />
        </AdminProvider>
      );

      expect(screen.getByTestId('modules-count')).toHaveTextContent('2'); // Falls back to default
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to parse modules from localStorage:',
        expect.any(SyntaxError)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should initialize test modules in test mode', () => {
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'test-mode') return 'true';
        return null;
      });

      render(
        <AdminProvider>
          <TestAdminComponent />
        </AdminProvider>
      );

      expect(screen.getByTestId('modules-count')).toHaveTextContent('3');
      expect(screen.getByTestId('first-module-title')).toHaveTextContent('Introdução à Psicologia Jungiana');
    });
  });

  describe('Session Management', () => {
    it('should restore admin session from valid token', () => {
      const mockPayload = { userId: 'admin-1', exp: Date.now() + 100000 };
      mockValidateSessionToken.mockReturnValue(mockPayload);
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'admin_session_token') return 'valid_token';
        return null;
      });

      render(
        <AdminProvider>
          <TestAdminComponent />
        </AdminProvider>
      );

      expect(screen.getByTestId('is-admin')).toHaveTextContent('true');
      expect(screen.getByTestId('current-admin')).toHaveTextContent('admin');
    });

    it('should remove invalid session token', () => {
      mockValidateSessionToken.mockReturnValue(null);
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'admin_session_token') return 'invalid_token';
        return null;
      });

      render(
        <AdminProvider>
          <TestAdminComponent />
        </AdminProvider>
      );

      expect(screen.getByTestId('is-admin')).toHaveTextContent('false');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('admin_session_token');
    });

    it('should handle missing session token', () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(
        <AdminProvider>
          <TestAdminComponent />
        </AdminProvider>
      );

      expect(screen.getByTestId('is-admin')).toHaveTextContent('false');
      expect(screen.getByTestId('current-admin')).toHaveTextContent('none');
    });
  });

  describe('Authentication', () => {
    it('should authenticate admin with correct credentials', async () => {
      const user = userEvent.setup();

      render(
        <AdminProvider>
          <TestAdminComponent />
        </AdminProvider>
      );

      const loginButton = screen.getByTestId('login-button');
      await user.click(loginButton);

      expect(screen.getByTestId('is-admin')).toHaveTextContent('true');
      expect(screen.getByTestId('current-admin')).toHaveTextContent('admin');
      expect(mockCreateSessionToken).toHaveBeenCalledWith('admin-1', expect.any(Number));
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'admin_session_token',
        expect.stringContaining('token_admin-1_')
      );
    });

    it('should support old password format for backward compatibility', async () => {
      const user = userEvent.setup();

      render(
        <AdminProvider>
          <TestAdminComponent />
        </AdminProvider>
      );

      // Mock the hash function to return different value than expected
      mockHashPassword.mockReturnValue('different_hash');

      const loginButton = screen.getByTestId('login-button');
      await user.click(loginButton);

      // Should still authenticate with old password
      expect(screen.getByTestId('is-admin')).toHaveTextContent('true');
    });

    it('should reject incorrect password', async () => {
      const user = userEvent.setup();

      render(
        <AdminProvider>
          <TestAdminComponent />
        </AdminProvider>
      );

      mockHashPassword.mockReturnValue('wrong_hash');

      const wrongPasswordButton = screen.getByTestId('login-wrong-password');
      await user.click(wrongPasswordButton);

      expect(screen.getByTestId('is-admin')).toHaveTextContent('false');
      expect(screen.getByTestId('current-admin')).toHaveTextContent('none');
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should reject incorrect username', async () => {
      const user = userEvent.setup();

      render(
        <AdminProvider>
          <TestAdminComponent />
        </AdminProvider>
      );

      const wrongUsernameButton = screen.getByTestId('login-wrong-username');
      await user.click(wrongUsernameButton);

      expect(screen.getByTestId('is-admin')).toHaveTextContent('false');
      expect(screen.getByTestId('current-admin')).toHaveTextContent('none');
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should logout admin and clear session', async () => {
      const user = userEvent.setup();

      render(
        <AdminProvider>
          <TestAdminComponent />
        </AdminProvider>
      );

      // First login
      const loginButton = screen.getByTestId('login-button');
      await user.click(loginButton);

      expect(screen.getByTestId('is-admin')).toHaveTextContent('true');

      // Then logout
      const logoutButton = screen.getByTestId('logout-button');
      await user.click(logoutButton);

      expect(screen.getByTestId('is-admin')).toHaveTextContent('false');
      expect(screen.getByTestId('current-admin')).toHaveTextContent('none');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('admin_session_token');
    });

    it('should handle multiple login attempts correctly', async () => {
      const user = userEvent.setup();

      render(
        <AdminProvider>
          <TestAdminComponent />
        </AdminProvider>
      );

      // Try wrong credentials first
      const wrongPasswordButton = screen.getByTestId('login-wrong-password');
      await user.click(wrongPasswordButton);
      expect(screen.getByTestId('is-admin')).toHaveTextContent('false');

      // Then try correct credentials
      const loginButton = screen.getByTestId('login-button');
      await user.click(loginButton);
      expect(screen.getByTestId('is-admin')).toHaveTextContent('true');
    });
  });

  describe('Module Management', () => {
    it('should update modules and persist to localStorage', async () => {
      const user = userEvent.setup();

      render(
        <AdminProvider>
          <TestAdminComponent />
        </AdminProvider>
      );

      const updateButton = screen.getByTestId('update-modules');
      await user.click(updateButton);

      expect(screen.getByTestId('modules-count')).toHaveTextContent('1');
      expect(screen.getByTestId('first-module-title')).toHaveTextContent('New Test Module');
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'jungAppModules',
        expect.stringContaining('New Test Module')
      );
    });

    it('should persist modules to localStorage on every change', async () => {
      const user = userEvent.setup();

      render(
        <AdminProvider>
          <TestAdminComponent />
        </AdminProvider>
      );

      // Initial modules should be persisted
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'jungAppModules',
        expect.any(String)
      );

      // Update modules
      const updateButton = screen.getByTestId('update-modules');
      await user.click(updateButton);

      // Should persist again after update
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(2);
    });

    it('should handle empty module arrays', async () => {
      const EmptyModulesComponent = () => {
        const { modules, updateModules } = useAdmin();
        return (
          <div>
            <span data-testid="modules-count">{modules.length}</span>
            <button 
              data-testid="clear-modules"
              onClick={() => updateModules([])}
            >
              Clear Modules
            </button>
          </div>
        );
      };

      const user = userEvent.setup();

      render(
        <AdminProvider>
          <EmptyModulesComponent />
        </AdminProvider>
      );

      const clearButton = screen.getByTestId('clear-modules');
      await user.click(clearButton);

      expect(screen.getByTestId('modules-count')).toHaveTextContent('0');
    });

    it('should handle large module arrays efficiently', async () => {
      const LargeModulesComponent = () => {
        const { modules, updateModules } = useAdmin();
        
        const createLargeModuleArray = () => {
          const largeArray = Array.from({ length: 1000 }, (_, i) => ({
            id: `module-${i}`,
            title: `Module ${i}`,
            description: `Description ${i}`,
            difficulty: 'beginner' as const,
            icon: '📚',
            estimatedTime: 30 + i,
            topics: [`Topic ${i}`],
            content: `Content ${i}`,
            quiz: { questions: [], passingScore: 70 }
          }));
          updateModules(largeArray);
        };

        return (
          <div>
            <span data-testid="modules-count">{modules.length}</span>
            <button 
              data-testid="create-large-array"
              onClick={createLargeModuleArray}
            >
              Create Large Array
            </button>
          </div>
        );
      };

      const user = userEvent.setup();

      render(
        <AdminProvider>
          <LargeModulesComponent />
        </AdminProvider>
      );

      const createButton = screen.getByTestId('create-large-array');
      
      const start = performance.now();
      await user.click(createButton);
      const end = performance.now();

      expect(screen.getByTestId('modules-count')).toHaveTextContent('1000');
      expect(end - start).toBeLessThan(1000); // Should complete in reasonable time
    });
  });

  describe('useAdmin Hook', () => {
    it('should throw error when used outside AdminProvider', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<TestComponentWithError />);

      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'useAdmin must be used within an AdminProvider'
      );

      consoleErrorSpy.mockRestore();
    });

    it('should provide all required context properties', () => {
      let contextValue: any;

      const TestHookComponent = () => {
        contextValue = useAdmin();
        return <div>Test</div>;
      };

      render(
        <AdminProvider>
          <TestHookComponent />
        </AdminProvider>
      );

      expect(contextValue).toHaveProperty('isAdmin');
      expect(contextValue).toHaveProperty('currentAdmin');
      expect(contextValue).toHaveProperty('login');
      expect(contextValue).toHaveProperty('logout');
      expect(contextValue).toHaveProperty('modules');
      expect(contextValue).toHaveProperty('updateModules');

      expect(typeof contextValue.isAdmin).toBe('boolean');
      expect(typeof contextValue.login).toBe('function');
      expect(typeof contextValue.logout).toBe('function');
      expect(typeof contextValue.updateModules).toBe('function');
      expect(Array.isArray(contextValue.modules)).toBe(true);
    });

    it('should provide correct initial values', () => {
      let contextValue: any;

      const TestHookComponent = () => {
        contextValue = useAdmin();
        return <div>Test</div>;
      };

      render(
        <AdminProvider>
          <TestHookComponent />
        </AdminProvider>
      );

      expect(contextValue.isAdmin).toBe(false);
      expect(contextValue.currentAdmin).toBeNull();
      expect(contextValue.modules.length).toBe(2);
    });
  });

  describe('Context State Management', () => {
    it('should maintain state across re-renders', () => {
      const { rerender } = render(
        <AdminProvider>
          <TestAdminComponent />
        </AdminProvider>
      );

      expect(screen.getByTestId('is-admin')).toHaveTextContent('false');

      rerender(
        <AdminProvider>
          <TestAdminComponent />
        </AdminProvider>
      );

      expect(screen.getByTestId('is-admin')).toHaveTextContent('false');
      expect(screen.getByTestId('modules-count')).toHaveTextContent('2');
    });

    it('should handle provider remounting gracefully', () => {
      const { unmount } = render(
        <AdminProvider>
          <TestAdminComponent />
        </AdminProvider>
      );

      unmount();

      render(
        <AdminProvider>
          <TestAdminComponent />
        </AdminProvider>
      );

      expect(screen.getByTestId('is-admin')).toHaveTextContent('false');
      expect(screen.getByTestId('modules-count')).toHaveTextContent('2');
    });

    it('should handle rapid state changes', async () => {
      const user = userEvent.setup();

      render(
        <AdminProvider>
          <TestAdminComponent />
        </AdminProvider>
      );

      // Rapid login/logout cycles
      for (let i = 0; i < 5; i++) {
        const loginButton = screen.getByTestId('login-button');
        await user.click(loginButton);
        expect(screen.getByTestId('is-admin')).toHaveTextContent('true');

        const logoutButton = screen.getByTestId('logout-button');
        await user.click(logoutButton);
        expect(screen.getByTestId('is-admin')).toHaveTextContent('false');
      }
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle localStorage access errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <AdminProvider>
          <TestAdminComponent />
        </AdminProvider>
      );

      // Should still render with default modules
      expect(screen.getByTestId('modules-count')).toHaveTextContent('2');

      consoleErrorSpy.mockRestore();
    });

    it('should handle localStorage setItem errors gracefully', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage quota exceeded');
      });

      const user = userEvent.setup();

      render(
        <AdminProvider>
          <TestAdminComponent />
        </AdminProvider>
      );

      // Login should still work even if localStorage fails
      const loginButton = screen.getByTestId('login-button');
      await user.click(loginButton);

      expect(screen.getByTestId('is-admin')).toHaveTextContent('true');
    });

    it('should handle auth function errors gracefully', async () => {
      mockHashPassword.mockImplementation(() => {
        throw new Error('Hash function error');
      });

      const user = userEvent.setup();

      render(
        <AdminProvider>
          <TestAdminComponent />
        </AdminProvider>
      );

      const loginButton = screen.getByTestId('login-button');
      await user.click(loginButton);

      // Should not authenticate with auth function errors
      expect(screen.getByTestId('is-admin')).toHaveTextContent('false');
    });

    it('should handle malformed admin data gracefully', () => {
      const malformedPayload = { userId: null, exp: 'invalid' };
      mockValidateSessionToken.mockReturnValue(malformedPayload);
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'admin_session_token') return 'malformed_token';
        return null;
      });

      render(
        <AdminProvider>
          <TestAdminComponent />
        </AdminProvider>
      );

      // Should handle malformed data and create valid admin object
      expect(screen.getByTestId('is-admin')).toHaveTextContent('true');
      expect(screen.getByTestId('current-admin')).toHaveTextContent('admin');
    });

    it('should handle concurrent login attempts', async () => {
      const user = userEvent.setup();

      render(
        <AdminProvider>
          <TestAdminComponent />
        </AdminProvider>
      );

      // Simulate concurrent login attempts
      const loginButton = screen.getByTestId('login-button');
      const promises = [
        user.click(loginButton),
        user.click(loginButton),
        user.click(loginButton)
      ];

      await Promise.all(promises);

      // Should end up in logged in state
      expect(screen.getByTestId('is-admin')).toHaveTextContent('true');
      expect(screen.getByTestId('current-admin')).toHaveTextContent('admin');
    });
  });

  describe('Security Considerations', () => {
    it('should never store passwords in admin object', async () => {
      const user = userEvent.setup();

      render(
        <AdminProvider>
          <TestAdminComponent />
        </AdminProvider>
      );

      const loginButton = screen.getByTestId('login-button');
      await user.click(loginButton);

      // Check that password is not stored in localStorage
      const setItemCalls = localStorageMock.setItem.mock.calls;
      const sessionTokenCall = setItemCalls.find(call => call[0] === 'admin_session_token');
      
      expect(sessionTokenCall).toBeDefined();
      expect(sessionTokenCall![1]).not.toContain('jungadmin123');
      expect(sessionTokenCall![1]).not.toContain('password');
    });

    it('should use session tokens instead of storing admin data', async () => {
      const user = userEvent.setup();

      render(
        <AdminProvider>
          <TestAdminComponent />
        </AdminProvider>
      );

      const loginButton = screen.getByTestId('login-button');
      await user.click(loginButton);

      expect(mockCreateSessionToken).toHaveBeenCalledWith('admin-1', expect.any(Number));
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'admin_session_token',
        expect.any(String)
      );

      // Should not store raw admin data
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('jungadmin123')
      );
    });

    it('should validate session tokens on initialization', () => {
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'admin_session_token') return 'some_token';
        return null;
      });

      render(
        <AdminProvider>
          <TestAdminComponent />
        </AdminProvider>
      );

      expect(mockValidateSessionToken).toHaveBeenCalledWith('some_token');
    });

    it('should handle expired session tokens', () => {
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'admin_session_token') return 'expired_token';
        return null;
      });
      mockValidateSessionToken.mockReturnValue(null); // Expired token

      render(
        <AdminProvider>
          <TestAdminComponent />
        </AdminProvider>
      );

      expect(screen.getByTestId('is-admin')).toHaveTextContent('false');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('admin_session_token');
    });
  });

  describe('Performance and Memory Management', () => {
    it('should handle frequent module updates efficiently', async () => {
      const FrequentUpdateComponent = () => {
        const { modules, updateModules } = useAdmin();
        
        const performFrequentUpdates = () => {
          for (let i = 0; i < 100; i++) {
            updateModules([{
              id: `perf-module-${i}`,
              title: `Performance Module ${i}`,
              description: `Performance test ${i}`,
              difficulty: 'beginner' as const,
              icon: '⚡',
              estimatedTime: 30,
              topics: [`Perf Topic ${i}`],
              content: `Perf content ${i}`,
              quiz: { questions: [], passingScore: 70 }
            }]);
          }
        };

        return (
          <div>
            <span data-testid="modules-count">{modules.length}</span>
            <button 
              data-testid="frequent-updates"
              onClick={performFrequentUpdates}
            >
              Frequent Updates
            </button>
          </div>
        );
      };

      const user = userEvent.setup();

      const start = performance.now();
      
      render(
        <AdminProvider>
          <FrequentUpdateComponent />
        </AdminProvider>
      );

      const updateButton = screen.getByTestId('frequent-updates');
      await user.click(updateButton);
      
      const end = performance.now();
      const duration = end - start;

      expect(screen.getByTestId('modules-count')).toHaveTextContent('1');
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it('should not cause memory leaks with context cleanup', () => {
      const { unmount } = render(
        <AdminProvider>
          <TestAdminComponent />
        </AdminProvider>
      );

      // Should not throw during cleanup
      expect(() => unmount()).not.toThrow();
    });
  });
});