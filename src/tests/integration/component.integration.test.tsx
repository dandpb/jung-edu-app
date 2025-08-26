/**
 * Component Integration Tests
 * Tests complex component interactions, context integration, and routing workflows
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { AdminContext } from '../../contexts/AdminContext';
import App from '../../App';
import Dashboard from '../../pages/Dashboard';
import ModulePage from '../../pages/ModulePage';
import AdminDashboard from '../../pages/admin/AdminDashboard';
import AdminModules from '../../pages/admin/AdminModules';
import ProtectedRoute from '../../components/ProtectedRoute';
import { ModuleService } from '../../services/modules/moduleService';
import { AuthService } from '../../services/auth/authService';
import { UserRole } from '../../types/auth';
import { DifficultyLevel, ModuleStatus } from '../../schemas/module.schema';

// Mock services
jest.mock('../../services/modules/moduleService');
jest.mock('../../services/auth/authService');

// Mock react-markdown to avoid import issues
jest.mock('react-markdown', () => {
  return function MockMarkdown({ children }: { children: string }) {
    return <div data-testid="markdown-content">{children}</div>;
  };
});

// Mock react-router-dom hooks for specific tests
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: 'test-module-id' })
}));

const MockedModuleService = ModuleService as jest.Mocked<typeof ModuleService>;
const MockedAuthService = AuthService as jest.Mocked<typeof AuthService>;

describe('Component Integration Tests', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    role: UserRole.STUDENT,
    profile: {
      firstName: 'Test',
      lastName: 'User',
      preferences: {
        theme: 'light' as const,
        language: 'en',
        emailNotifications: true,
        pushNotifications: false
      }
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    isVerified: true
  };

  const mockAdmin = {
    id: 'admin-123',
    username: 'admin',
    password: 'hashed-password', // In production this would be hashed
    role: 'admin' as const,
    lastLogin: Date.now()
  };

  const mockUserProgress = {
    userId: 'user-123',
    completedModules: [],
    quizScores: {},
    totalTime: 0,
    lastAccessed: Date.now(),
    notes: []
  };

  const mockModule = {
    id: 'test-module-id',
    title: 'Integration Test Module',
    description: 'Module for testing component integration',
    content: {
      introduction: 'This is an integration test module',
      sections: [
        {
          id: 'section-1',
          title: 'Test Section',
          content: 'Content for testing component integration',
          order: 1
        }
      ]
    },
    videos: [
      {
        id: 'video-1',
        title: 'Test Video',
        url: 'https://youtube.com/watch?v=test',
        duration: '10:00',
        description: 'Test video description'
      }
    ],
    quiz: {
      id: 'quiz-1',
      title: 'Test Quiz',
      description: 'Integration test quiz',
      passingScore: 75,
      questions: [
        {
          id: 'q1',
          question: 'What is integration testing?',
          options: [
            { id: 'a', text: 'Testing individual components', isCorrect: false },
            { id: 'b', text: 'Testing component interactions', isCorrect: true },
            { id: 'c', text: 'Testing the entire system', isCorrect: false },
            { id: 'd', text: 'Testing user interfaces', isCorrect: false }
          ],
          correctAnswer: 'b',
          explanation: 'Integration testing focuses on testing interactions between components.',
          type: 'multiple-choice' as const,
          difficulty: 'intermediate' as const,
          points: 1
        }
      ]
    },
    bibliography: [],
    filmReferences: [],
    tags: ['integration', 'testing'],
    difficulty: 'intermediate' as const,
    estimatedTime: 90, // 90 minutes
    mindMaps: [],
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '1.0.0',
      status: ModuleStatus.PUBLISHED,
      language: 'en',
      author: {
        id: 'author-1',
        name: 'Test Author',
        email: 'author@example.com',
        role: 'Instructor'
      }
    }
  };

  const createAuthContextValue = (user: any = null, loading = false) => ({
    user,
    isAuthenticated: !!user,
    isLoading: loading,
    error: null,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    requestPasswordReset: jest.fn(),
    resetPassword: jest.fn(),
    changePassword: jest.fn(),
    verifyEmail: jest.fn(),
    resendVerificationEmail: jest.fn(),
    hasPermission: jest.fn().mockReturnValue(true),
    hasRole: jest.fn().mockReturnValue(true),
    refreshSession: jest.fn(),
    clearError: jest.fn()
  });

  const createAdminContextValue = () => ({
    isAdmin: true,
    currentAdmin: mockAdmin,
    login: jest.fn().mockReturnValue(true),
    logout: jest.fn(),
    modules: [mockModule],
    updateModules: jest.fn()
  });

  const renderWithProviders = (
    component: React.ReactElement,
    { user = null, loading = false, route = '/' }: { user?: any, loading?: boolean, route?: string } = {}
  ) => {
    const authValue = createAuthContextValue(user, loading);
    const adminValue = createAdminContextValue();

    return render(
      <MemoryRouter initialEntries={[route]}>
        <AuthContext.Provider value={authValue}>
          <AdminContext.Provider value={adminValue}>
            {component}
          </AdminContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    localStorage.clear();
    
    // Setup default mock implementations
    MockedModuleService.getAllModules = jest.fn().mockResolvedValue([mockModule]);
    MockedModuleService.getModuleById = jest.fn().mockResolvedValue(mockModule);
  });

  describe('Authentication Flow Integration', () => {
    it('should handle complete authentication flow', async () => {
      const user = userEvent.setup();
      
      // Mock authentication methods
      const mockLogin = jest.fn().mockResolvedValue({
        user: mockUser,
        accessToken: 'mock-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 900000
      });

      const authValue = {
        ...createAuthContextValue(),
        login: mockLogin
      };

      render(
        <MemoryRouter initialEntries={['/login']}>
          <AuthContext.Provider value={authValue}>
            <AdminContext.Provider value={createAdminContextValue()}>
              <App />
            </AdminContext.Provider>
          </AuthContext.Provider>
        </MemoryRouter>
      );

      // Should show login form
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();

      // Fill and submit login form
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          username: 'testuser',
          password: 'password123',
          rememberMe: false
        });
      });
    });

    it('should redirect to login for protected routes', () => {
      renderWithProviders(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        { route: '/dashboard' }
      );

      // Should not show protected content
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      
      // Should show login prompt or redirect (depends on implementation)
      expect(screen.getByText(/login/i)).toBeInTheDocument();
    });

    it('should show protected content for authenticated users', () => {
      renderWithProviders(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        { user: mockUser }
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  describe('Dashboard Integration', () => {
    it('should display modules and handle interactions', async () => {
      const user = userEvent.setup();

      renderWithProviders(<Dashboard modules={[mockModule]} userProgress={mockUserProgress} />, { user: mockUser });

      // Wait for modules to load
      await waitFor(() => {
        expect(screen.getByText('Integration Test Module')).toBeInTheDocument();
      });

      // Should show module information
      expect(screen.getByText(/Module for testing component integration/i)).toBeInTheDocument();
      expect(screen.getByText(/Intermediate/i)).toBeInTheDocument();

      // Click on module should navigate
      const moduleCard = screen.getByText('Integration Test Module').closest('[role="button"]') ||
                         screen.getByText('Integration Test Module');
      
      if (moduleCard) {
        await user.click(moduleCard);
        // Navigation would typically happen here
        // For testing, we just verify the click was handled
      }

      expect(MockedModuleService.getAllModules).toHaveBeenCalled();
    });

    it('should handle loading states correctly', () => {
      renderWithProviders(<Dashboard modules={[mockModule]} userProgress={mockUserProgress} />, { user: mockUser, loading: true });

      // Should show loading indicator
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should handle empty module list', async () => {
      MockedModuleService.getAllModules = jest.fn().mockResolvedValue([]);

      renderWithProviders(<Dashboard modules={[]} userProgress={mockUserProgress} />, { user: mockUser });

      await waitFor(() => {
        expect(screen.getByText(/no modules available/i)).toBeInTheDocument();
      });
    });
  });

  describe('Module Page Integration', () => {
    it('should render module content with all components', async () => {
      renderWithProviders(<ModulePage modules={[mockModule]} userProgress={mockUserProgress} updateProgress={jest.fn()} />, { user: mockUser, route: `/modules/${mockModule.id}` });

      // Wait for module to load
      await waitFor(() => {
        expect(screen.getByText('Integration Test Module')).toBeInTheDocument();
      });

      // Check content sections
      expect(screen.getByText('This is an integration test module')).toBeInTheDocument();
      expect(screen.getByText('Test Section')).toBeInTheDocument();
      expect(screen.getByText(/Content for testing component integration/i)).toBeInTheDocument();

      // Check video section
      expect(screen.getByText('Test Video')).toBeInTheDocument();

      // Check quiz section
      expect(screen.getByText('Test Quiz')).toBeInTheDocument();

      expect(MockedModuleService.getModuleById).toHaveBeenCalledWith(mockModule.id);
    });

    it('should handle quiz interactions', async () => {
      const user = userEvent.setup();

      renderWithProviders(<ModulePage modules={[mockModule]} userProgress={mockUserProgress} updateProgress={jest.fn()} />, { user: mockUser, route: `/modules/${mockModule.id}` });

      await waitFor(() => {
        expect(screen.getByText('Integration Test Module')).toBeInTheDocument();
      });

      // Find and interact with quiz
      const quizQuestion = screen.getByText('What is integration testing?');
      expect(quizQuestion).toBeInTheDocument();

      // Select correct answer
      const correctOption = screen.getByText('Testing component interactions');
      await user.click(correctOption);

      // Submit answer (if there's a submit button)
      const submitButton = screen.queryByText(/submit/i) || screen.queryByText(/next/i);
      if (submitButton) {
        await user.click(submitButton);
        
        // Should show explanation
        await waitFor(() => {
          expect(screen.getByText(/Integration testing focuses on/i)).toBeInTheDocument();
        });
      }
    });

    it('should handle module loading errors', async () => {
      MockedModuleService.getModuleById = jest.fn().mockRejectedValue(new Error('Module not found'));

      renderWithProviders(<ModulePage modules={[mockModule]} userProgress={mockUserProgress} updateProgress={jest.fn()} />, { user: mockUser, route: '/modules/nonexistent' });

      await waitFor(() => {
        expect(screen.getByText(/error loading module/i)).toBeInTheDocument();
      });
    });
  });

  describe('Admin Panel Integration', () => {
    it('should restrict admin access to authorized users only', () => {
      // Try to access admin panel as regular user
      renderWithProviders(<AdminDashboard />, { user: mockUser, route: '/admin' });

      // Should not show admin content or should redirect
      expect(screen.queryByText(/admin dashboard/i)).not.toBeInTheDocument();
    });

    it('should show admin dashboard for admin users', async () => {
      renderWithProviders(<AdminDashboard />, { user: mockAdmin, route: '/admin' });

      await waitFor(() => {
        expect(screen.getByText(/admin dashboard/i)).toBeInTheDocument();
      });

      // Should show admin statistics and controls
      expect(screen.getByText(/modules/i)).toBeInTheDocument();
      expect(screen.getByText(/users/i)).toBeInTheDocument();
    });

    it('should handle admin module management', async () => {
      const user = userEvent.setup();

      renderWithProviders(<AdminModules />, { user: mockAdmin, route: '/admin/modules' });

      await waitFor(() => {
        expect(screen.getByText('Integration Test Module')).toBeInTheDocument();
      });

      // Should show admin controls for modules
      const editButton = screen.queryByText(/edit/i) || screen.queryByRole('button', { name: /edit/i });
      if (editButton) {
        await user.click(editButton);
        // Should handle edit action
      }

      const deleteButton = screen.queryByText(/delete/i) || screen.queryByRole('button', { name: /delete/i });
      if (deleteButton) {
        await user.click(deleteButton);
        
        // Should show confirmation dialog
        await waitFor(() => {
          expect(screen.getByText(/confirm deletion/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Context Integration', () => {
    it('should share authentication state across components', async () => {
      const user = userEvent.setup();
      const mockLogout = jest.fn();
      
      const authValue = {
        ...createAuthContextValue(mockUser),
        logout: mockLogout
      };

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <AuthContext.Provider value={authValue}>
            <AdminContext.Provider value={createAdminContextValue()}>
              <div>
                <nav data-testid="navigation">
                  <span>Welcome, {authValue.user?.profile.firstName}</span>
                  <button onClick={mockLogout}>Logout</button>
                </nav>
                <Dashboard modules={[mockModule]} userProgress={mockUserProgress} />
              </div>
            </AdminContext.Provider>
          </AuthContext.Provider>
        </MemoryRouter>
      );

      // Should show user information in navigation
      expect(screen.getByText('Welcome, Test')).toBeInTheDocument();

      // Logout should be accessible
      const logoutButton = screen.getByText('Logout');
      await user.click(logoutButton);

      expect(mockLogout).toHaveBeenCalled();
    });

    it('should update UI when context changes', async () => {
      const { rerender } = render(
        <MemoryRouter>
          <AuthContext.Provider value={createAuthContextValue(null, true)}>
            <AdminContext.Provider value={createAdminContextValue()}>
              <Dashboard modules={[mockModule]} userProgress={mockUserProgress} />
            </AdminContext.Provider>
          </AuthContext.Provider>
        </MemoryRouter>
      );

      // Should show loading state
      expect(screen.getByText(/loading/i)).toBeInTheDocument();

      // Update context to show logged in user
      rerender(
        <MemoryRouter>
          <AuthContext.Provider value={createAuthContextValue(mockUser, false)}>
            <AdminContext.Provider value={createAdminContextValue()}>
              <Dashboard modules={[mockModule]} userProgress={mockUserProgress} />
            </AdminContext.Provider>
          </AuthContext.Provider>
        </MemoryRouter>
      );

      // Should show dashboard content
      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
        expect(screen.getByText('Integration Test Module')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation and Routing Integration', () => {
    it('should handle navigation between routes', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <AuthContext.Provider value={createAuthContextValue(mockUser)}>
            <AdminContext.Provider value={createAdminContextValue()}>
              <App />
            </AdminContext.Provider>
          </AuthContext.Provider>
        </MemoryRouter>
      );

      // Should be on dashboard
      await waitFor(() => {
        expect(screen.getByText('Integration Test Module')).toBeInTheDocument();
      });

      // Navigate to profile or other route
      const profileLink = screen.queryByText(/profile/i) || screen.queryByRole('link', { name: /profile/i });
      if (profileLink) {
        await user.click(profileLink);
        // Should navigate to profile page
      }
    });

    it('should handle deep linking to modules', () => {
      renderWithProviders(
        <App />, 
        { 
          user: mockUser, 
          route: `/modules/${mockModule.id}` 
        }
      );

      // Should directly load module page
      waitFor(() => {
        expect(screen.getByText('Integration Test Module')).toBeInTheDocument();
        expect(MockedModuleService.getModuleById).toHaveBeenCalledWith(mockModule.id);
      });
    });

    it('should handle invalid routes gracefully', () => {
      renderWithProviders(
        <App />, 
        { 
          user: mockUser, 
          route: '/nonexistent-route' 
        }
      );

      // Should show 404 or redirect to valid route
      expect(screen.getByText(/not found/i) || screen.getByText(/dashboard/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle component errors with error boundaries', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      // Mock console.error to avoid noise in test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      renderWithProviders(<ThrowError />, { user: mockUser });

      // Should show error boundary fallback
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('should handle network errors gracefully', async () => {
      MockedModuleService.getAllModules = jest.fn().mockRejectedValue(new Error('Network error'));

      renderWithProviders(<Dashboard modules={[mockModule]} userProgress={mockUserProgress} />, { user: mockUser });

      await waitFor(() => {
        expect(screen.getByText(/error loading modules/i)).toBeInTheDocument();
      });

      // Should provide retry option
      const retryButton = screen.queryByText(/retry/i);
      if (retryButton) {
        const user = userEvent.setup();
        
        // Mock successful retry
        MockedModuleService.getAllModules = jest.fn().mockResolvedValue([mockModule]);
        
        await user.click(retryButton);
        
        await waitFor(() => {
          expect(screen.getByText('Integration Test Module')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Performance Integration', () => {
    it('should handle large datasets efficiently', async () => {
      const largeModuleList = Array.from({ length: 100 }, (_, i) => ({
        ...mockModule,
        id: `module-${i}`,
        title: `Test Module ${i}`,
        description: `Description for module ${i}`
      }));

      MockedModuleService.getAllModules = jest.fn().mockResolvedValue(largeModuleList);

      const startTime = performance.now();
      
      renderWithProviders(<Dashboard modules={[mockModule]} userProgress={mockUserProgress} />, { user: mockUser });

      await waitFor(() => {
        expect(screen.getByText('Test Module 0')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      console.log(`Rendered 100 modules in ${renderTime.toFixed(2)}ms`);
      
      // Should render efficiently
      expect(renderTime).toBeLessThan(1000); // Less than 1 second
      
      // Should show all modules
      expect(screen.getAllByText(/Test Module/)).toHaveLength(100);
    });

    it('should implement virtual scrolling for large lists', async () => {
      const largeModuleList = Array.from({ length: 1000 }, (_, i) => ({
        ...mockModule,
        id: `module-${i}`,
        title: `Module ${i}`,
        description: `Description ${i}`
      }));

      MockedModuleService.getAllModules = jest.fn().mockResolvedValue(largeModuleList);

      renderWithProviders(<Dashboard modules={[mockModule]} userProgress={mockUserProgress} />, { user: mockUser });

      await waitFor(() => {
        // Should only render visible items (virtual scrolling)
        const moduleItems = screen.getAllByText(/Module \d+/);
        // Virtual scrolling would limit DOM nodes
        expect(moduleItems.length).toBeLessThan(1000);
        expect(moduleItems.length).toBeGreaterThan(0);
      });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});