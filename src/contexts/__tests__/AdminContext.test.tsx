import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AdminProvider, useAdmin } from '../AdminContext';
import { modules as defaultModules } from '../../data/modules';
import { defaultMindMapNodes, defaultMindMapEdges } from '../../data/mindmap';

// Test component to access admin context
const TestComponent = () => {
  const admin = useAdmin();
  return (
    <div>
      <span data-testid="is-admin">{admin.isAdmin.toString()}</span>
      <span data-testid="username">{admin.currentAdmin?.username || 'none'}</span>
      <span data-testid="modules-count">{admin.modules.length}</span>
      <button onClick={() => admin.login('admin', 'jungadmin123')}>Login Valid</button>
      <button onClick={() => admin.login('wrong', 'wrong')}>Login Invalid</button>
      <button onClick={() => admin.logout()}>Logout</button>
      <button onClick={() => admin.updateModules([])}>Clear Modules</button>
      <button onClick={() => admin.updateMindMap([], [])}>Clear MindMap</button>
    </div>
  );
};

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('AdminContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('provides default values when not logged in', () => {
    render(
      <AdminProvider>
        <TestComponent />
      </AdminProvider>
    );

    expect(screen.getByTestId('is-admin')).toHaveTextContent('false');
    expect(screen.getByTestId('username')).toHaveTextContent('none');
    // Check that modules are loaded (should be > 0)
    const modulesCount = screen.getByTestId('modules-count').textContent;
    expect(Number(modulesCount)).toBeGreaterThan(0);
  });

  test('successful login with valid credentials', async () => {
    render(
      <AdminProvider>
        <TestComponent />
      </AdminProvider>
    );

    const loginButton = screen.getByText('Login Valid');
    
    act(() => {
      loginButton.click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-admin')).toHaveTextContent('true');
    });

    expect(screen.getByTestId('username')).toHaveTextContent('admin');

    // Check session token is stored
    expect(localStorage.getItem('jungAppSessionToken')).toBeTruthy();
  });

  test('failed login with invalid credentials', () => {
    render(
      <AdminProvider>
        <TestComponent />
      </AdminProvider>
    );

    const loginButton = screen.getByText('Login Invalid');
    
    act(() => {
      loginButton.click();
    });

    expect(screen.getByTestId('is-admin')).toHaveTextContent('false');
    expect(screen.getByTestId('username')).toHaveTextContent('none');
    expect(localStorage.getItem('jungAppSessionToken')).toBeNull();
  });

  test('logout clears admin state', async () => {
    render(
      <AdminProvider>
        <TestComponent />
      </AdminProvider>
    );

    // First login
    act(() => {
      screen.getByText('Login Valid').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-admin')).toHaveTextContent('true');
    });

    // Then logout
    act(() => {
      screen.getByText('Logout').click();
    });

    expect(screen.getByTestId('is-admin')).toHaveTextContent('false');
    expect(screen.getByTestId('username')).toHaveTextContent('none');
    expect(localStorage.getItem('jungAppSessionToken')).toBeNull();
  });

  test('persists modules to localStorage', () => {
    render(
      <AdminProvider>
        <TestComponent />
      </AdminProvider>
    );

    act(() => {
      screen.getByText('Clear Modules').click();
    });

    const stored = localStorage.getItem('jungAppModules');
    expect(stored).toBe('[]');
  });

  test('persists mind map to localStorage', () => {
    render(
      <AdminProvider>
        <TestComponent />
      </AdminProvider>
    );

    act(() => {
      screen.getByText('Clear MindMap').click();
    });

    expect(localStorage.getItem('jungAppMindMapNodes')).toBe('[]');
    expect(localStorage.getItem('jungAppMindMapEdges')).toBe('[]');
  });

  test('loads saved modules from localStorage', () => {
    const customModules = [{ ...defaultModules[0], title: 'Custom Module' }];
    localStorage.setItem('jungAppModules', JSON.stringify(customModules));

    render(
      <AdminProvider>
        <TestComponent />
      </AdminProvider>
    );

    expect(screen.getByTestId('modules-count')).toHaveTextContent('1');
  });

  test('loads saved mind map from localStorage', () => {
    const customNodes = [{ ...defaultMindMapNodes[0], data: { label: 'Custom Node' } }];
    const customEdges = [{ ...defaultMindMapEdges[0], label: 'Custom Edge' }];
    
    localStorage.setItem('jungAppMindMapNodes', JSON.stringify(customNodes));
    localStorage.setItem('jungAppMindMapEdges', JSON.stringify(customEdges));

    const TestMindMapComponent = () => {
      const { mindMapNodes, mindMapEdges } = useAdmin();
      return (
        <div>
          <span data-testid="nodes-count">{mindMapNodes.length}</span>
          <span data-testid="edges-count">{mindMapEdges.length}</span>
        </div>
      );
    };

    render(
      <AdminProvider>
        <TestMindMapComponent />
      </AdminProvider>
    );

    expect(screen.getByTestId('nodes-count')).toHaveTextContent('1');
    expect(screen.getByTestId('edges-count')).toHaveTextContent('1');
  });

  test('restores session from valid token', async () => {
    // Create a valid session token
    const validToken = Buffer.from(JSON.stringify({
      userId: 'admin-1',
      exp: Date.now() + 1000000, // Future expiry
      iat: Date.now()
    })).toString('base64');
    
    localStorage.setItem('jungAppSessionToken', validToken);

    render(
      <AdminProvider>
        <TestComponent />
      </AdminProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('is-admin')).toHaveTextContent('true');
      expect(screen.getByTestId('username')).toHaveTextContent('admin');
    });
  });

  test('ignores expired session token', () => {
    // Create an expired session token
    const expiredToken = Buffer.from(JSON.stringify({
      userId: 'admin-1',
      exp: Date.now() - 1000000, // Past expiry
      iat: Date.now() - 2000000
    })).toString('base64');
    
    localStorage.setItem('jungAppSessionToken', expiredToken);

    render(
      <AdminProvider>
        <TestComponent />
      </AdminProvider>
    );

    expect(screen.getByTestId('is-admin')).toHaveTextContent('false');
    expect(screen.getByTestId('username')).toHaveTextContent('none');
    // Token should be removed
    expect(localStorage.getItem('jungAppSessionToken')).toBeNull();
  });

  test('throws error when useAdmin used outside provider', () => {
    const TestErrorComponent = () => {
      useAdmin(); // This should throw
      return null;
    };

    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => {
      render(<TestErrorComponent />);
    }).toThrow('useAdmin must be used within an AdminProvider');

    console.error = originalError;
  });
});