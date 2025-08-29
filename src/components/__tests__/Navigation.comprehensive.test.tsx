/**
 * Comprehensive Unit Tests for Navigation Component
 * Tests navigation behavior, routing, auth states
 * Target: 80%+ coverage
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import Navigation from '../Navigation';
import { AuthProvider } from '../../contexts/AuthContext';
import { UserRole } from '../../types/auth';
import { User } from '../../types/auth';

// Mock the auth service
jest.mock('../../services/auth/authService', () => ({
  authService: {
    logout: jest.fn().mockResolvedValue(undefined),
    getCurrentUser: jest.fn(),
    refreshAccessToken: jest.fn(),
    login: jest.fn(),
    register: jest.fn(),
    requestPasswordReset: jest.fn(),
    resetPassword: jest.fn(),
    changePassword: jest.fn(),
    verifyEmail: jest.fn(),
  }
}));

// Mock JWT utils
jest.mock('../../services/auth/jwt', () => ({
  getStoredTokens: jest.fn().mockReturnValue({ accessToken: 'token', refreshToken: 'refresh' }),
  isTokenExpired: jest.fn().mockReturnValue(false),
}));

// Create mock user factory
const createMockUser = (role: UserRole = UserRole.STUDENT, additionalProps: Partial<User> = {}): User => ({
  id: 'test-user-id',
  email: 'test@example.com',
  username: 'testuser',
  passwordHash: 'hash',
  salt: 'salt',
  role,
  permissions: [],
  profile: {
    firstName: 'Test',
    lastName: 'User',
    bio: 'Test bio',
    avatar: '',
    preferences: {
      theme: 'light',
      language: 'pt',
      emailNotifications: true,
      pushNotifications: true
    }
  },
  security: {
    twoFactorEnabled: false,
    passwordHistory: [],
    lastPasswordChange: new Date(),
    loginNotifications: true,
    trustedDevices: [],
    sessions: []
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLogin: new Date(),
  isActive: true,
  isVerified: true,
  ...additionalProps
});

// Mock useAuth hook
const mockUseAuth = {
  isAuthenticated: false,
  user: null,
  logout: jest.fn(),
  hasRole: jest.fn(),
  login: jest.fn(),
  register: jest.fn(),
  requestPasswordReset: jest.fn(),
  resetPassword: jest.fn(),
  changePassword: jest.fn(),
  verifyEmail: jest.fn(),
  resendVerificationEmail: jest.fn(),
  hasPermission: jest.fn(),
  refreshSession: jest.fn(),
  clearError: jest.fn(),
  isLoading: false,
  error: null
};

jest.mock('../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../contexts/AuthContext'),
  useAuth: () => mockUseAuth
}));

const NavigationWrapper: React.FC<{ 
  children: React.ReactNode;
  initialEntries?: string[];
}> = ({ children, initialEntries = ['/dashboard'] }) => (
  <MemoryRouter initialEntries={initialEntries}>
    {children}
  </MemoryRouter>
);

describe('Navigation Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.isAuthenticated = false;
    mockUseAuth.user = null;
    mockUseAuth.hasRole.mockReturnValue(false);
  });

  describe('Unauthenticated State', () => {
    it('should not render navigation on auth pages', () => {
      const { container } = render(
        <NavigationWrapper initialEntries={['/login']}>
          <Navigation />
        </NavigationWrapper>
      );

      expect(container.firstChild).toBeNull();
    });

    it('should not render navigation on register page', () => {
      const { container } = render(
        <NavigationWrapper initialEntries={['/register']}>
          <Navigation />
        </NavigationWrapper>
      );

      expect(container.firstChild).toBeNull();
    });

    it('should not render navigation on forgot password page', () => {
      const { container } = render(
        <NavigationWrapper initialEntries={['/forgot-password']}>
          <Navigation />
        </NavigationWrapper>
      );

      expect(container.firstChild).toBeNull();
    });

    it('should show login button when not authenticated', () => {
      render(
        <NavigationWrapper>
          <Navigation />
        </NavigationWrapper>
      );

      expect(screen.getByText('Entrar')).toBeInTheDocument();
    });
  });

  describe('Authenticated State - Regular User', () => {
    beforeEach(() => {
      mockUseAuth.isAuthenticated = true;
      mockUseAuth.user = createMockUser(UserRole.STUDENT);
      mockUseAuth.hasRole.mockImplementation((role) => role === UserRole.STUDENT);
    });

    it('should render main navigation items for authenticated users', () => {
      render(
        <NavigationWrapper>
          <Navigation />
        </NavigationWrapper>
      );

      expect(screen.getByText('Painel')).toBeInTheDocument();
      expect(screen.getByText('Anotações')).toBeInTheDocument();
      expect(screen.getByText('Recursos')).toBeInTheDocument();
      expect(screen.getByText('Buscar')).toBeInTheDocument();
    });

    it('should show user menu with user name', () => {
      render(
        <NavigationWrapper>
          <Navigation />
        </NavigationWrapper>
      );

      expect(screen.getByTestId('user-menu')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('should show logout button', () => {
      render(
        <NavigationWrapper>
          <Navigation />
        </NavigationWrapper>
      );

      expect(screen.getByTestId('logout-button')).toBeInTheDocument();
      expect(screen.getByText('Sair')).toBeInTheDocument();
    });

    it('should handle logout click', async () => {
      render(
        <NavigationWrapper>
          <Navigation />
        </NavigationWrapper>
      );

      const logoutButton = screen.getByTestId('logout-button');
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(mockUseAuth.logout).toHaveBeenCalledTimes(1);
      });
    });

    it('should highlight active navigation item', () => {
      render(
        <NavigationWrapper initialEntries={['/notes']}>
          <Navigation />
        </NavigationWrapper>
      );

      const notesLink = screen.getByText('Anotações').closest('a');
      expect(notesLink).toHaveClass('bg-primary-50', 'text-primary-700');
    });

    it('should not show admin links for regular users', () => {
      render(
        <NavigationWrapper>
          <Navigation />
        </NavigationWrapper>
      );

      expect(screen.queryByText('Administrador')).not.toBeInTheDocument();
      expect(screen.queryByText('Monitoramento')).not.toBeInTheDocument();
    });
  });

  describe('Authenticated State - Admin User', () => {
    beforeEach(() => {
      mockUseAuth.isAuthenticated = true;
      mockUseAuth.user = createMockUser(UserRole.ADMIN);
      mockUseAuth.hasRole.mockImplementation((role) => [UserRole.ADMIN, UserRole.STUDENT].includes(role));
    });

    it('should show admin navigation items', () => {
      render(
        <NavigationWrapper>
          <Navigation />
        </NavigationWrapper>
      );

      expect(screen.getByText('Administrador')).toBeInTheDocument();
      expect(screen.getByText('Monitoramento')).toBeInTheDocument();
    });

    it('should highlight admin link when on admin page', () => {
      render(
        <NavigationWrapper initialEntries={['/admin/modules']}>
          <Navigation />
        </NavigationWrapper>
      );

      const adminLink = screen.getByText('Administrador').closest('a');
      expect(adminLink).toHaveClass('bg-primary-50', 'text-primary-700');
    });

    it('should highlight monitoring link when active', () => {
      render(
        <NavigationWrapper initialEntries={['/monitoring']}>
          <Navigation />
        </NavigationWrapper>
      );

      const monitoringLink = screen.getByText('Monitoramento').closest('a');
      expect(monitoringLink).toHaveClass('bg-primary-50', 'text-primary-700');
    });
  });

  describe('Navigation Links', () => {
    beforeEach(() => {
      mockUseAuth.isAuthenticated = true;
      mockUseAuth.user = createMockUser(UserRole.STUDENT);
    });

    it('should render all navigation links with correct hrefs', () => {
      render(
        <NavigationWrapper>
          <Navigation />
        </NavigationWrapper>
      );

      expect(screen.getByText('Painel').closest('a')).toHaveAttribute('href', '/dashboard');
      expect(screen.getByText('Anotações').closest('a')).toHaveAttribute('href', '/notes');
      expect(screen.getByText('Recursos').closest('a')).toHaveAttribute('href', '/bibliography');
      expect(screen.getByText('Buscar').closest('a')).toHaveAttribute('href', '/search');
    });

    it('should render logo link correctly', () => {
      render(
        <NavigationWrapper>
          <Navigation />
        </NavigationWrapper>
      );

      const logoLink = screen.getByText('Psicologia de Jung').closest('a');
      expect(logoLink).toHaveAttribute('href', '/dashboard');
    });
  });

  describe('User Display', () => {
    it('should show first and last name when available', () => {
      mockUseAuth.isAuthenticated = true;
      mockUseAuth.user = createMockUser(UserRole.STUDENT, {
        profile: {
          ...createMockUser().profile,
          firstName: 'João',
          lastName: 'Silva'
        }
      });

      render(
        <NavigationWrapper>
          <Navigation />
        </NavigationWrapper>
      );

      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });

    it('should fallback to username when name not available', () => {
      mockUseAuth.isAuthenticated = true;
      mockUseAuth.user = createMockUser(UserRole.STUDENT, {
        username: 'cooluser123',
        profile: {
          ...createMockUser().profile,
          firstName: '',
          lastName: ''
        }
      });

      render(
        <NavigationWrapper>
          <Navigation />
        </NavigationWrapper>
      );

      expect(screen.getByText('cooluser123')).toBeInTheDocument();
    });

    it('should show default text when no user data available', () => {
      mockUseAuth.isAuthenticated = true;
      mockUseAuth.user = createMockUser(UserRole.STUDENT, {
        username: '',
        profile: {
          ...createMockUser().profile,
          firstName: '',
          lastName: ''
        }
      });

      render(
        <NavigationWrapper>
          <Navigation />
        </NavigationWrapper>
      );

      expect(screen.getByText('Usuário')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      mockUseAuth.isAuthenticated = true;
      mockUseAuth.user = createMockUser(UserRole.STUDENT);
    });

    it('should hide text labels on small screens', () => {
      render(
        <NavigationWrapper>
          <Navigation />
        </NavigationWrapper>
      );

      const dashboardText = screen.getByText('Painel');
      expect(dashboardText).toHaveClass('hidden', 'sm:inline');
    });

    it('should show icons for all navigation items', () => {
      render(
        <NavigationWrapper>
          <Navigation />
        </NavigationWrapper>
      );

      // Check that icons are present (they use Lucide icons with specific classes)
      const navItems = screen.getAllByRole('link');
      const navItemsWithIcons = navItems.filter(item => 
        item.querySelector('svg')
      );
      
      // Should have icons for all main nav items plus logout
      expect(navItemsWithIcons.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Navigation Testid Attributes', () => {
    beforeEach(() => {
      mockUseAuth.isAuthenticated = true;
      mockUseAuth.user = createMockUser(UserRole.STUDENT);
    });

    it('should have main navigation testid', () => {
      render(
        <NavigationWrapper>
          <Navigation />
        </NavigationWrapper>
      );

      expect(screen.getByTestId('main-navigation')).toBeInTheDocument();
    });

    it('should have user menu testid', () => {
      render(
        <NavigationWrapper>
          <Navigation />
        </NavigationWrapper>
      );

      expect(screen.getByTestId('user-menu')).toBeInTheDocument();
    });

    it('should have logout button testid', () => {
      render(
        <NavigationWrapper>
          <Navigation />
        </NavigationWrapper>
      );

      expect(screen.getByTestId('logout-button')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should call logout when logout button is clicked', async () => {
      mockUseAuth.isAuthenticated = true;
      mockUseAuth.user = createMockUser(UserRole.STUDENT);

      render(
        <NavigationWrapper>
          <Navigation />
        </NavigationWrapper>
      );

      const logoutButton = screen.getByTestId('logout-button');
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(mockUseAuth.logout).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      mockUseAuth.isAuthenticated = true;
      mockUseAuth.user = createMockUser(UserRole.STUDENT);
    });

    it('should have proper ARIA roles and labels', () => {
      render(
        <NavigationWrapper>
          <Navigation />
        </NavigationWrapper>
      );

      const nav = screen.getByTestId('main-navigation');
      expect(nav.tagName).toBe('NAV');
    });

    it('should support keyboard navigation', () => {
      render(
        <NavigationWrapper>
          <Navigation />
        </NavigationWrapper>
      );

      const dashboardLink = screen.getByText('Painel').closest('a');
      expect(dashboardLink).toHaveAttribute('href');
      
      // Links should be focusable
      if (dashboardLink) {
        dashboardLink.focus();
        expect(document.activeElement).toBe(dashboardLink);
      }
    });
  });
});