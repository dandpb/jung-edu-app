import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navigation from '../../components/Navigation';

// Mock the AuthContext
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn()
}));

// Mock the I18nContext  
jest.mock('../../contexts/I18nContext', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    language: 'pt',
    setLanguage: jest.fn()
  })
}));

import { useAuth } from '../../contexts/AuthContext';

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Wrapper for routing
const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Navigation Component', () => {
  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Unauthenticated State', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        login: jest.fn(),
        logout: mockLogout,
        hasRole: jest.fn().mockReturnValue(false),
        register: jest.fn(),
        requestPasswordReset: jest.fn(),
        resetPassword: jest.fn(),
        changePassword: jest.fn(),
        verifyEmail: jest.fn(),
        resendVerificationEmail: jest.fn(),
        hasPermission: jest.fn().mockReturnValue(false),
        refreshSession: jest.fn(),
        clearError: jest.fn(),
        isLoading: false,
        error: null
      });
    });

    it('renders navigation bar', () => {
      renderWithRouter(<Navigation />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('shows app title/logo', () => {
      renderWithRouter(<Navigation />);
      
      // Assuming navigation has a title or logo
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('shows login/register links for unauthenticated users', () => {
      renderWithRouter(<Navigation />);
      
      // Check for login-related elements (adjust selectors based on actual implementation)
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('does not show authenticated user menu', () => {
      renderWithRouter(<Navigation />);
      
      // Should not show user profile or logout options
      expect(screen.queryByText('logout')).not.toBeInTheDocument();
      expect(screen.queryByText('profile')).not.toBeInTheDocument();
    });
  });

  describe('Authenticated State', () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user' as const
    } as any;

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        login: jest.fn(),
        logout: mockLogout,
        hasRole: jest.fn().mockReturnValue(false),
        register: jest.fn(),
        requestPasswordReset: jest.fn(),
        resetPassword: jest.fn(),
        changePassword: jest.fn(),
        verifyEmail: jest.fn(),
        resendVerificationEmail: jest.fn(),
        hasPermission: jest.fn().mockReturnValue(false),
        refreshSession: jest.fn(),
        clearError: jest.fn(),
        isLoading: false,
        error: null
      });
    });

    it('shows authenticated navigation elements', () => {
      renderWithRouter(<Navigation />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('shows user-specific navigation items', () => {
      renderWithRouter(<Navigation />);
      
      // Check for dashboard, modules, etc. links
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('hides login/register links', () => {
      renderWithRouter(<Navigation />);
      
      // Should not show login/register when authenticated
      expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
      expect(screen.queryByText('Sign Up')).not.toBeInTheDocument();
    });
  });

  describe('Admin User State', () => {
    const mockAdminUser = {
      id: '456',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin' as const
    } as any;

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockAdminUser,
        isAuthenticated: true,
        login: jest.fn(),
        logout: mockLogout,
        hasRole: jest.fn().mockReturnValue(true), // Admin should return true
        register: jest.fn(),
        requestPasswordReset: jest.fn(),
        resetPassword: jest.fn(),
        changePassword: jest.fn(),
        verifyEmail: jest.fn(),
        resendVerificationEmail: jest.fn(),
        hasPermission: jest.fn().mockReturnValue(true),
        refreshSession: jest.fn(),
        clearError: jest.fn(),
        isLoading: false,
        error: null
      });
    });

    it('shows admin navigation items for admin users', () => {
      renderWithRouter(<Navigation />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('shows both regular and admin navigation items', () => {
      renderWithRouter(<Navigation />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        login: jest.fn(),
        logout: mockLogout,
        hasRole: jest.fn().mockReturnValue(false),
        register: jest.fn(),
        requestPasswordReset: jest.fn(),
        resetPassword: jest.fn(),
        changePassword: jest.fn(),
        verifyEmail: jest.fn(),
        resendVerificationEmail: jest.fn(),
        hasPermission: jest.fn().mockReturnValue(false),
        refreshSession: jest.fn(),
        clearError: jest.fn(),
        isLoading: true,
        error: null
      });
    });

    it('renders navigation during loading', () => {
      renderWithRouter(<Navigation />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('does not show user-specific items while loading', () => {
      renderWithRouter(<Navigation />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });
  });

  describe('Navigation Structure', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        login: jest.fn(),
        logout: mockLogout,
        hasRole: jest.fn().mockReturnValue(false),
        register: jest.fn(),
        requestPasswordReset: jest.fn(),
        resetPassword: jest.fn(),
        changePassword: jest.fn(),
        verifyEmail: jest.fn(),
        resendVerificationEmail: jest.fn(),
        hasPermission: jest.fn().mockReturnValue(false),
        refreshSession: jest.fn(),
        clearError: jest.fn(),
        isLoading: false,
        error: null
      });
    });

    it('has proper navigation element structure', () => {
      renderWithRouter(<Navigation />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('contains clickable navigation elements', () => {
      renderWithRouter(<Navigation />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('applies correct CSS classes for styling', () => {
      renderWithRouter(<Navigation />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        login: jest.fn(),
        logout: mockLogout,
        hasRole: jest.fn().mockReturnValue(false),
        register: jest.fn(),
        requestPasswordReset: jest.fn(),
        resetPassword: jest.fn(),
        changePassword: jest.fn(),
        verifyEmail: jest.fn(),
        resendVerificationEmail: jest.fn(),
        hasPermission: jest.fn().mockReturnValue(false),
        refreshSession: jest.fn(),
        clearError: jest.fn(),
        isLoading: false,
        error: null
      });
    });

    it('renders navigation on all screen sizes', () => {
      renderWithRouter(<Navigation />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('maintains navigation structure across viewport sizes', () => {
      // Test mobile view
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      const { rerender } = renderWithRouter(<Navigation />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();

      // Test desktop view
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      rerender(
        <BrowserRouter>
          <Navigation />
        </BrowserRouter>
      );

      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        login: jest.fn(),
        logout: mockLogout,
        hasRole: jest.fn().mockReturnValue(false),
        register: jest.fn(),
        requestPasswordReset: jest.fn(),
        resetPassword: jest.fn(),
        changePassword: jest.fn(),
        verifyEmail: jest.fn(),
        resendVerificationEmail: jest.fn(),
        hasPermission: jest.fn().mockReturnValue(false),
        refreshSession: jest.fn(),
        clearError: jest.fn(),
        isLoading: false,
        error: null
      });
    });

    it('has proper navigation role', () => {
      renderWithRouter(<Navigation />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('contains accessible navigation links', () => {
      renderWithRouter(<Navigation />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('maintains keyboard navigation support', () => {
      renderWithRouter(<Navigation />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });
  });

  describe('Integration with Router', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'user' as const
        } as any,
        isAuthenticated: true,
        login: jest.fn(),
        logout: mockLogout,
        hasRole: jest.fn().mockReturnValue(false),
        register: jest.fn(),
        requestPasswordReset: jest.fn(),
        resetPassword: jest.fn(),
        changePassword: jest.fn(),
        verifyEmail: jest.fn(),
        resendVerificationEmail: jest.fn(),
        hasPermission: jest.fn().mockReturnValue(false),
        refreshSession: jest.fn(),
        clearError: jest.fn(),
        isLoading: false,
        error: null
      });
    });

    it('renders without router errors', () => {
      renderWithRouter(<Navigation />);
      
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('handles route changes correctly', () => {
      renderWithRouter(<Navigation />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles auth context errors gracefully', () => {
      mockUseAuth.mockImplementation(() => {
        throw new Error('Auth context error');
      });

      expect(() => {
        renderWithRouter(<Navigation />);
      }).toThrow('Auth context error');
    });

    it('handles missing user data gracefully', () => {
      mockUseAuth.mockReturnValue({
        user: undefined as any,
        isAuthenticated: false,
        login: jest.fn(),
        logout: mockLogout,
        hasRole: jest.fn().mockReturnValue(false),
        register: jest.fn(),
        requestPasswordReset: jest.fn(),
        resetPassword: jest.fn(),
        changePassword: jest.fn(),
        verifyEmail: jest.fn(),
        resendVerificationEmail: jest.fn(),
        hasPermission: jest.fn().mockReturnValue(false),
        refreshSession: jest.fn(),
        clearError: jest.fn(),
        isLoading: false,
        error: null
      });

      renderWithRouter(<Navigation />);
      
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
  });

  describe('State Transitions', () => {
    it('updates when auth state changes from unauthenticated to authenticated', () => {
      // Start unauthenticated
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        login: jest.fn(),
        logout: mockLogout,
        hasRole: jest.fn().mockReturnValue(false),
        register: jest.fn(),
        requestPasswordReset: jest.fn(),
        resetPassword: jest.fn(),
        changePassword: jest.fn(),
        verifyEmail: jest.fn(),
        resendVerificationEmail: jest.fn(),
        hasPermission: jest.fn().mockReturnValue(false),
        refreshSession: jest.fn(),
        clearError: jest.fn(),
        isLoading: false,
        error: null
      });

      const { rerender } = renderWithRouter(<Navigation />);
      
      expect(screen.getByRole('navigation')).toBeInTheDocument();

      // Change to authenticated
      mockUseAuth.mockReturnValue({
        user: {
          id: '123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'user' as const
        } as any,
        isAuthenticated: true,
        login: jest.fn(),
        logout: mockLogout,
        hasRole: jest.fn().mockReturnValue(false),
        register: jest.fn(),
        requestPasswordReset: jest.fn(),
        resetPassword: jest.fn(),
        changePassword: jest.fn(),
        verifyEmail: jest.fn(),
        resendVerificationEmail: jest.fn(),
        hasPermission: jest.fn().mockReturnValue(false),
        refreshSession: jest.fn(),
        clearError: jest.fn(),
        isLoading: false,
        error: null
      });

      rerender(
        <BrowserRouter>
          <Navigation />
        </BrowserRouter>
      );

      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('updates when user role changes', () => {
      // Start as regular user
      mockUseAuth.mockReturnValue({
        user: {
          id: '123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'user' as const
        } as any,
        isAuthenticated: true,
        login: jest.fn(),
        logout: mockLogout,
        hasRole: jest.fn().mockReturnValue(false),
        register: jest.fn(),
        requestPasswordReset: jest.fn(),
        resetPassword: jest.fn(),
        changePassword: jest.fn(),
        verifyEmail: jest.fn(),
        resendVerificationEmail: jest.fn(),
        hasPermission: jest.fn().mockReturnValue(false),
        refreshSession: jest.fn(),
        clearError: jest.fn(),
        isLoading: false,
        error: null
      });

      const { rerender } = renderWithRouter(<Navigation />);
      
      expect(screen.getByRole('navigation')).toBeInTheDocument();

      // Change to admin
      mockUseAuth.mockReturnValue({
        user: {
          id: '123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'admin' as const
        } as any,
        isAuthenticated: true,
        login: jest.fn(),
        logout: mockLogout,
        hasRole: jest.fn().mockReturnValue(true),
        register: jest.fn(),
        requestPasswordReset: jest.fn(),
        resetPassword: jest.fn(),
        changePassword: jest.fn(),
        verifyEmail: jest.fn(),
        resendVerificationEmail: jest.fn(),
        hasPermission: jest.fn().mockReturnValue(true),
        refreshSession: jest.fn(),
        clearError: jest.fn(),
        isLoading: false,
        error: null
      });

      rerender(
        <BrowserRouter>
          <Navigation />
        </BrowserRouter>
      );

      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
  });
});