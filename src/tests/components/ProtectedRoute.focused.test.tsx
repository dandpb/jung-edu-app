import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { UserRole } from '../../types/auth';

// Mock the AuthContext
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn()
}));

import { useAuth } from '../../contexts/AuthContext';

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock Navigate component
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: ({ to, replace }: { to: string; replace?: boolean }) => {
    mockNavigate(to, replace);
    return <div data-testid="mock-navigate">Navigating to {to}</div>;
  }
}));

// Test components
const TestComponent: React.FC = () => {
  return <div data-testid="protected-content">Protected Content</div>;
};

const renderWithRouter = (
  component: React.ReactElement,
  initialRoute: string = '/'
) => {
  window.history.pushState({}, 'Test page', initialRoute);
  return render(
    <BrowserRouter>
      <Routes>
        <Route path="*" element={component} />
      </Routes>
    </BrowserRouter>
  );
};

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  describe('Authentication Logic', () => {
    it('renders children when user is authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '123',
          email: 'test@example.com',
          name: 'Test User',
          role: UserRole.USER
        },
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        loading: false
      });

      renderWithRouter(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.queryByTestId('mock-navigate')).not.toBeInTheDocument();
    });

    it('redirects to login when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        login: jest.fn(),
        logout: jest.fn(),
        loading: false
      });

      renderWithRouter(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.getByTestId('mock-navigate')).toBeInTheDocument();
      expect(mockNavigate).toHaveBeenCalledWith('/login', true);
    });

    it('shows loading state when authentication is in progress', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        login: jest.fn(),
        logout: jest.fn(),
        loading: true
      });

      renderWithRouter(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.queryByTestId('mock-navigate')).not.toBeInTheDocument();
    });
  });

  describe('Role-Based Access Control', () => {
    it('allows access when user has exact required role', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '123',
          email: 'admin@example.com',
          name: 'Admin User',
          role: UserRole.ADMIN
        },
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        loading: false
      });

      renderWithRouter(
        <ProtectedRoute requiredRole={UserRole.ADMIN}>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.queryByTestId('mock-navigate')).not.toBeInTheDocument();
    });

    it('denies access when user lacks required role', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '123',
          email: 'user@example.com',
          name: 'Regular User',
          role: UserRole.USER
        },
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        loading: false
      });

      renderWithRouter(
        <ProtectedRoute requiredRole={UserRole.ADMIN}>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.getByTestId('mock-navigate')).toBeInTheDocument();
      expect(mockNavigate).toHaveBeenCalledWith('/unauthorized', true);
    });

    it('allows access when no specific role is required', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '123',
          email: 'user@example.com',
          name: 'Regular User',
          role: UserRole.USER
        },
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        loading: false
      });

      renderWithRouter(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.queryByTestId('mock-navigate')).not.toBeInTheDocument();
    });

    it('handles missing user role gracefully', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '123',
          email: 'user@example.com',
          name: 'User Without Role',
          role: undefined as any
        },
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        loading: false
      });

      renderWithRouter(
        <ProtectedRoute requiredRole={UserRole.ADMIN}>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.getByTestId('mock-navigate')).toBeInTheDocument();
      expect(mockNavigate).toHaveBeenCalledWith('/unauthorized', true);
    });
  });

  describe('Multiple Role Support', () => {
    it('allows access when user has one of multiple required roles', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '123',
          email: 'moderator@example.com',
          name: 'Moderator User',
          role: UserRole.ADMIN // Admin should have access to user-level content
        },
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        loading: false
      });

      renderWithRouter(
        <ProtectedRoute requiredRole={UserRole.USER}>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('denies access when user role is insufficient', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '123',
          email: 'user@example.com',
          name: 'Regular User',
          role: UserRole.USER
        },
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        loading: false
      });

      renderWithRouter(
        <ProtectedRoute requiredRole={UserRole.ADMIN}>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(mockNavigate).toHaveBeenCalledWith('/unauthorized', true);
    });
  });

  describe('Navigation Behavior', () => {
    it('uses replace navigation for login redirect', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        login: jest.fn(),
        logout: jest.fn(),
        loading: false
      });

      renderWithRouter(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(mockNavigate).toHaveBeenCalledWith('/login', true);
    });

    it('uses replace navigation for unauthorized redirect', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '123',
          email: 'user@example.com',
          name: 'Regular User',
          role: UserRole.USER
        },
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        loading: false
      });

      renderWithRouter(
        <ProtectedRoute requiredRole={UserRole.ADMIN}>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(mockNavigate).toHaveBeenCalledWith('/unauthorized', true);
    });
  });

  describe('Edge Cases', () => {
    it('handles null user gracefully', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        login: jest.fn(),
        logout: jest.fn(),
        loading: false
      });

      renderWithRouter(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(mockNavigate).toHaveBeenCalledWith('/login', true);
    });

    it('handles undefined user gracefully', () => {
      mockUseAuth.mockReturnValue({
        user: undefined as any,
        isAuthenticated: false,
        login: jest.fn(),
        logout: jest.fn(),
        loading: false
      });

      renderWithRouter(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(mockNavigate).toHaveBeenCalledWith('/login', true);
    });

    it('handles inconsistent auth state (authenticated but no user)', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: true, // Inconsistent state
        login: jest.fn(),
        logout: jest.fn(),
        loading: false
      });

      renderWithRouter(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(mockNavigate).toHaveBeenCalledWith('/login', true);
    });
  });

  describe('Child Component Rendering', () => {
    it('passes props to child components correctly', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '123',
          email: 'test@example.com',
          name: 'Test User',
          role: UserRole.USER
        },
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        loading: false
      });

      const ChildWithProps: React.FC<{ testProp: string }> = ({ testProp }) => {
        return <div data-testid="child-with-props">{testProp}</div>;
      };

      renderWithRouter(
        <ProtectedRoute>
          <ChildWithProps testProp="test-value" />
        </ProtectedRoute>
      );

      expect(screen.getByTestId('child-with-props')).toBeInTheDocument();
      expect(screen.getByText('test-value')).toBeInTheDocument();
    });

    it('renders multiple children correctly', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '123',
          email: 'test@example.com',
          name: 'Test User',
          role: UserRole.USER
        },
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        loading: false
      });

      renderWithRouter(
        <ProtectedRoute>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });

    it('handles empty children gracefully', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '123',
          email: 'test@example.com',
          name: 'Test User',
          role: UserRole.USER
        },
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        loading: false
      });

      renderWithRouter(<ProtectedRoute>{null}</ProtectedRoute>);

      expect(screen.queryByTestId('mock-navigate')).not.toBeInTheDocument();
    });
  });

  describe('State Changes', () => {
    it('updates when authentication state changes', () => {
      // Start unauthenticated
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        login: jest.fn(),
        logout: jest.fn(),
        loading: false
      });

      const { rerender } = renderWithRouter(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(mockNavigate).toHaveBeenCalledWith('/login', true);

      // Clear previous navigation calls
      mockNavigate.mockClear();

      // Change to authenticated
      mockUseAuth.mockReturnValue({
        user: {
          id: '123',
          email: 'test@example.com',
          name: 'Test User',
          role: UserRole.USER
        },
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        loading: false
      });

      rerender(
        <BrowserRouter>
          <Routes>
            <Route
              path="*"
              element={
                <ProtectedRoute>
                  <TestComponent />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('updates when user role changes', () => {
      // Start as regular user trying to access admin content
      mockUseAuth.mockReturnValue({
        user: {
          id: '123',
          email: 'user@example.com',
          name: 'Regular User',
          role: UserRole.USER
        },
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        loading: false
      });

      const { rerender } = renderWithRouter(
        <ProtectedRoute requiredRole={UserRole.ADMIN}>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(mockNavigate).toHaveBeenCalledWith('/unauthorized', true);

      // Clear previous navigation calls
      mockNavigate.mockClear();

      // Change to admin user
      mockUseAuth.mockReturnValue({
        user: {
          id: '123',
          email: 'user@example.com',
          name: 'Admin User',
          role: UserRole.ADMIN
        },
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        loading: false
      });

      rerender(
        <BrowserRouter>
          <Routes>
            <Route
              path="*"
              element={
                <ProtectedRoute requiredRole={UserRole.ADMIN}>
                  <TestComponent />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});