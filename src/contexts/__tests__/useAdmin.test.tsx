import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AdminUser } from '../../types';

// Mock the utils/auth module BEFORE importing components that use it
jest.mock('../../utils/auth');

// Mock the config module
jest.mock('../../config/admin', () => ({
  ADMIN_CONFIG: {
    defaultAdmin: {
      username: 'admin',
      salt: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      passwordHash: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890'
    },
    session: {
      tokenKey: 'test-token-key',
      expiry: 3600000
    }
  }
}));

// Now import the components
import { useAdmin, AdminProvider } from '../AdminContext';

// Set up the auth mocks
const mockHashPassword = jest.fn();
const mockCreateSessionToken = jest.fn();
const mockValidateSessionToken = jest.fn();

const authModule = require('../../utils/auth');
authModule.hashPassword = mockHashPassword;
authModule.createSessionToken = mockCreateSessionToken;
authModule.validateSessionToken = mockValidateSessionToken;

// Mock data
jest.mock('../../data/modules', () => ({
  modules: [
    { id: 'module-1', title: 'Module 1' },
    { id: 'module-2', title: 'Module 2' }
  ]
}));

jest.mock('../../data/mindmap', () => ({
  defaultMindMapNodes: [
    { id: 'node-1', data: { label: 'Node 1' }, position: { x: 0, y: 0 } }
  ],
  defaultMindMapEdges: [
    { id: 'edge-1', source: 'node-1', target: 'node-2' }
  ]
}));

describe('useAdmin Hook', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AdminProvider>{children}</AdminProvider>
  );

  // Create a proper localStorage mock
  const localStorageMock = (() => {
    let store: { [key: string]: string } = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      }
    };
  })();

  beforeEach(() => {
    // Clear localStorage before each test
    localStorageMock.clear();
    jest.clearAllMocks();
    
    // Replace the global localStorage with our mock
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });
    
    // Reset mock implementations
    mockHashPassword.mockImplementation((password: string, salt: string) => {
      if (password === 'correctPassword' || password === 'jungadmin123') {
        return 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890';
      }
      return 'wrong-hash';
    });
    
    mockCreateSessionToken.mockReturnValue('mock-session-token');
    
    mockValidateSessionToken.mockImplementation((token: string) => {
      return token === 'valid-token' ? { userId: 'admin-1', exp: Date.now() + 3600000 } : null;
    });
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  // Helper to create a new hook instance to avoid state persistence
  const createHookWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <AdminProvider>{children}</AdminProvider>
    );
  };

  describe('Hook Usage', () => {
    it('should throw error when used outside AdminProvider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      expect(() => {
        renderHook(() => useAdmin());
      }).toThrow('useAdmin must be used within an AdminProvider');

      consoleError.mockRestore();
    });

    it('should return context when used within AdminProvider', () => {
      const { result } = renderHook(() => useAdmin(), { wrapper });

      expect(result.current).toBeDefined();
      expect(result.current.isAdmin).toBe(false);
      expect(result.current.currentAdmin).toBeNull();
      expect(result.current.modules).toBeDefined();
      expect(result.current.mindMapNodes).toBeDefined();
      expect(result.current.mindMapEdges).toBeDefined();
    });
  });

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useAdmin(), { wrapper });

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.currentAdmin).toBeNull();
      expect(result.current.modules).toHaveLength(2);
      expect(result.current.mindMapNodes).toHaveLength(1);
      expect(result.current.mindMapEdges).toHaveLength(1);
    });

    it('should load modules from localStorage if available', () => {
      const savedModules = [
        { id: 'saved-1', title: 'Saved Module 1' },
        { id: 'saved-2', title: 'Saved Module 2' }
      ];
      localStorage.setItem('jungAppModules', JSON.stringify(savedModules));
      
      // Verify localStorage is set
      expect(localStorage.getItem('jungAppModules')).toBe(JSON.stringify(savedModules));

      const { result } = renderHook(() => useAdmin(), { wrapper: createHookWrapper() });

      expect(result.current.modules).toEqual(savedModules);
    });

    it('should load mindmap data from localStorage if available', () => {
      const savedNodes = [{ id: 'saved-node', data: { label: 'Saved' }, position: { x: 100, y: 100 } }];
      const savedEdges = [{ id: 'saved-edge', source: 'saved-node', target: 'other' }];
      
      localStorage.setItem('jungAppMindMapNodes', JSON.stringify(savedNodes));
      localStorage.setItem('jungAppMindMapEdges', JSON.stringify(savedEdges));

      const { result } = renderHook(() => useAdmin(), { wrapper: createHookWrapper() });

      expect(result.current.mindMapNodes).toEqual(savedNodes);
      expect(result.current.mindMapEdges).toEqual(savedEdges);
    });

    it('should restore valid session from localStorage', () => {
      localStorage.setItem('test-token-key', 'valid-token');

      const { result } = renderHook(() => useAdmin(), { wrapper: createHookWrapper() });

      expect(result.current.isAdmin).toBe(true);
      expect(result.current.currentAdmin).toEqual({
        id: 'admin-1',
        username: 'admin',
        password: '',
        role: 'admin',
        lastLogin: expect.any(Number)
      });
    });

    it('should clear invalid session from localStorage', () => {
      localStorage.setItem('test-token-key', 'invalid-token');

      renderHook(() => useAdmin(), { wrapper: createHookWrapper() });

      // The token should be removed if invalid
      expect(localStorage.getItem('test-token-key')).toBeNull();
    });
  });

  describe('Login', () => {
    it('should login successfully with correct credentials', async () => {
      const { result } = renderHook(() => useAdmin(), { wrapper });

      let success = false;
      act(() => {
        success = result.current.login('admin', 'correctPassword');
      });
      
      expect(success).toBe(true);

      await waitFor(() => {
        expect(result.current.isAdmin).toBe(true);
        expect(result.current.currentAdmin).toEqual({
          id: 'admin-1',
          username: 'admin',
          password: '',
          role: 'admin',
          lastLogin: expect.any(Number)
        });
      });
      
      expect(localStorage.getItem('test-token-key')).toBe('mock-session-token');
    });

    it('should login successfully with legacy password', async () => {
      const { result } = renderHook(() => useAdmin(), { wrapper });

      let success = false;
      act(() => {
        success = result.current.login('admin', 'jungadmin123');
      });
      
      expect(success).toBe(true);

      await waitFor(() => {
        expect(result.current.isAdmin).toBe(true);
      });
    });

    it('should fail login with incorrect username', () => {
      const { result } = renderHook(() => useAdmin(), { wrapper });

      act(() => {
        const success = result.current.login('wronguser', 'correctPassword');
        expect(success).toBe(false);
      });

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.currentAdmin).toBeNull();
    });

    it('should fail login with incorrect password', () => {
      const { result } = renderHook(() => useAdmin(), { wrapper });

      let success = false;
      act(() => {
        success = result.current.login('admin', 'wrongPassword');
      });

      expect(success).toBe(false);
      expect(result.current.isAdmin).toBe(false);
      expect(result.current.currentAdmin).toBeNull();
    });
  });

  describe('Logout', () => {
    it('should logout successfully', async () => {
      const { result } = renderHook(() => useAdmin(), { wrapper });

      // Login first
      act(() => {
        result.current.login('admin', 'correctPassword');
      });
      
      await waitFor(() => {
        expect(result.current.isAdmin).toBe(true);
      });

      // Then logout
      act(() => {
        result.current.logout();
      });

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.currentAdmin).toBeNull();
      expect(localStorage.getItem('test-token-key')).toBeNull();
    });
  });

  describe('Update Functions', () => {
    it('should update modules and persist to localStorage', async () => {
      const { result } = renderHook(() => useAdmin(), { wrapper });

      const newModules = [
        { id: 'new-1', title: 'New Module 1' },
        { id: 'new-2', title: 'New Module 2' }
      ];

      act(() => {
        result.current.updateModules(newModules);
      });

      await waitFor(() => {
        expect(result.current.modules).toEqual(newModules);
      });

      expect(JSON.parse(localStorage.getItem('jungAppModules') || '[]')).toEqual(newModules);
    });

    it('should update mindmap and persist to localStorage', async () => {
      const { result } = renderHook(() => useAdmin(), { wrapper });

      const newNodes = [
        { id: 'new-node', data: { label: 'New Node' }, position: { x: 50, y: 50 } }
      ];
      const newEdges = [
        { id: 'new-edge', source: 'new-node', target: 'target' }
      ];

      act(() => {
        result.current.updateMindMap(newNodes, newEdges);
      });

      await waitFor(() => {
        expect(result.current.mindMapNodes).toEqual(newNodes);
        expect(result.current.mindMapEdges).toEqual(newEdges);
      });

      expect(JSON.parse(localStorage.getItem('jungAppMindMapNodes') || '[]')).toEqual(newNodes);
      expect(JSON.parse(localStorage.getItem('jungAppMindMapEdges') || '[]')).toEqual(newEdges);
    });
  });

  describe('State Persistence', () => {
    it('should maintain state across re-renders', async () => {
      const { result, rerender } = renderHook(() => useAdmin(), { wrapper });

      // Login
      act(() => {
        result.current.login('admin', 'correctPassword');
      });
      
      await waitFor(() => {
        expect(result.current.isAdmin).toBe(true);
      });
      
      const adminBefore = result.current.currentAdmin;

      // Re-render
      rerender();

      expect(result.current.isAdmin).toBe(true);
      expect(result.current.currentAdmin).toEqual(adminBefore);
    });

    it('should update localStorage when modules change', async () => {
      const { result } = renderHook(() => useAdmin(), { wrapper });

      const newModules = [{ id: 'test', title: 'Test' }];
      
      act(() => {
        result.current.updateModules(newModules);
      });

      await waitFor(() => {
        expect(localStorage.getItem('jungAppModules')).toBe(JSON.stringify(newModules));
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed localStorage data gracefully', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      localStorage.setItem('jungAppModules', 'invalid-json');
      localStorage.setItem('jungAppMindMapNodes', 'invalid-json');
      localStorage.setItem('jungAppMindMapEdges', 'invalid-json');

      const { result } = renderHook(() => useAdmin(), { wrapper });

      // Should fall back to default data
      expect(result.current.modules).toHaveLength(2);
      expect(result.current.mindMapNodes).toHaveLength(1);
      expect(result.current.mindMapEdges).toHaveLength(1);
      
      // Should have logged errors
      expect(consoleError).toHaveBeenCalledWith(
        'Failed to parse modules from localStorage:',
        expect.any(SyntaxError)
      );
      expect(consoleError).toHaveBeenCalledWith(
        'Failed to parse mindmap nodes from localStorage:',
        expect.any(SyntaxError)
      );
      expect(consoleError).toHaveBeenCalledWith(
        'Failed to parse mindmap edges from localStorage:',
        expect.any(SyntaxError)
      );
      
      consoleError.mockRestore();
    });

    it('should handle empty arrays in updates', async () => {
      const { result } = renderHook(() => useAdmin(), { wrapper });

      act(() => {
        result.current.updateModules([]);
      });
      
      await waitFor(() => {
        expect(result.current.modules).toEqual([]);
      });

      act(() => {
        result.current.updateMindMap([], []);
      });
      
      await waitFor(() => {
        expect(result.current.mindMapNodes).toEqual([]);
        expect(result.current.mindMapEdges).toEqual([]);
      });
    });

    it('should not store password in currentAdmin', async () => {
      const { result } = renderHook(() => useAdmin(), { wrapper });

      act(() => {
        result.current.login('admin', 'correctPassword');
      });
      
      await waitFor(() => {
        expect(result.current.isAdmin).toBe(true);
      });

      expect(result.current.currentAdmin?.password).toBe('');
    });
  });
});