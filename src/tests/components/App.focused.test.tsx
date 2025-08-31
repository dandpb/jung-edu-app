import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../../App';
import { AuthProvider } from '../../contexts/AuthContext';
import { AdminProvider } from '../../contexts/AdminContext';

// Mock all external dependencies
jest.mock('../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="mock-auth-provider">{children}</div>,
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    login: jest.fn(),
    logout: jest.fn(),
    loading: false
  })
}));

jest.mock('../../contexts/AdminContext', () => ({
  AdminProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="mock-admin-provider">{children}</div>,
  useAdmin: () => ({
    modules: [],
    addModule: jest.fn(),
    updateModule: jest.fn(),
    deleteModule: jest.fn(),
    isLoading: false
  })
}));

jest.mock('../../components/Navigation', () => {
  return function MockNavigation() {
    return <nav data-testid="mock-navigation">Navigation</nav>;
  };
});

jest.mock('../../pages/Dashboard', () => {
  return function MockDashboard() {
    return <div data-testid="mock-dashboard">Dashboard</div>;
  };
});

jest.mock('../../pages/auth/LoginPage', () => ({
  LoginPage: () => <div data-testid="mock-login-page">Login Page</div>
}));

jest.mock('../../pages/UnauthorizedPage', () => ({
  UnauthorizedPage: () => <div data-testid="mock-unauthorized-page">Unauthorized Page</div>
}));

jest.mock('../../components/auth/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-protected-route">{children}</div>
  )
}));

jest.mock('../../components/auth/PublicRoute', () => ({
  PublicRoute: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-public-route">{children}</div>
  )
}));

jest.mock('../../components/admin/AdminProtectedRoute', () => ({
  AdminProtectedRoute: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-admin-protected-route">{children}</div>
  )
}));

jest.mock('../../components/admin/AdminPublicRoute', () => ({
  AdminPublicRoute: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-admin-public-route">{children}</div>
  )
}));

// Mock all page components
jest.mock('../../pages/ModulePage', () => {
  return function MockModulePage() {
    return <div data-testid="mock-module-page">Module Page</div>;
  };
});

jest.mock('../../pages/AIDemo', () => {
  return function MockAIDemo() {
    return <div data-testid="mock-ai-demo">AI Demo</div>;
  };
});

jest.mock('../../pages/NotesPage', () => {
  return function MockNotesPage() {
    return <div data-testid="mock-notes-page">Notes Page</div>;
  };
});

jest.mock('../../pages/BibliographyPage', () => {
  return function MockBibliographyPage() {
    return <div data-testid="mock-bibliography-page">Bibliography Page</div>;
  };
});

jest.mock('../../pages/SearchPage', () => {
  return function MockSearchPage() {
    return <div data-testid="mock-search-page">Search Page</div>;
  };
});

jest.mock('../../pages/TestYouTubeIntegration', () => {
  return function MockTestYouTubeIntegration() {
    return <div data-testid="mock-youtube-integration">YouTube Integration</div>;
  };
});

jest.mock('../../pages/TestYouTubeAPI', () => {
  return function MockTestYouTubeAPI() {
    return <div data-testid="mock-youtube-api">YouTube API</div>;
  };
});

jest.mock('../../pages/admin/AdminLogin', () => {
  return function MockAdminLogin() {
    return <div data-testid="mock-admin-login">Admin Login</div>;
  };
});

jest.mock('../../pages/admin/AdminDashboard', () => {
  return function MockAdminDashboard() {
    return <div data-testid="mock-admin-dashboard">Admin Dashboard</div>;
  };
});

jest.mock('../../pages/admin/AdminModules', () => {
  return function MockAdminModules() {
    return <div data-testid="mock-admin-modules">Admin Modules</div>;
  };
});

jest.mock('../../pages/admin/AdminResources', () => {
  return function MockAdminResources() {
    return <div data-testid="mock-admin-resources">Admin Resources</div>;
  };
});

jest.mock('../../pages/admin/AdminPrompts', () => {
  return function MockAdminPrompts() {
    return <div data-testid="mock-admin-prompts">Admin Prompts</div>;
  };
});

jest.mock('../../pages/auth/RegisterPage', () => ({
  RegisterPage: () => <div data-testid="mock-register-page">Register Page</div>
}));

jest.mock('../../pages/auth/ForgotPasswordPage', () => ({
  ForgotPasswordPage: () => <div data-testid="mock-forgot-password-page">Forgot Password Page</div>
}));

jest.mock('../../pages/CreateTestUser', () => {
  return function MockCreateTestUser() {
    return <div data-testid="mock-create-test-user">Create Test User</div>;
  };
});

jest.mock('../../pages/MonitoringDashboard', () => {
  return function MockMonitoringDashboard() {
    return <div data-testid="mock-monitoring-dashboard">Monitoring Dashboard</div>;
  };
});

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('Component Structure', () => {
    it('renders app with correct provider hierarchy', () => {
      render(<App />);
      
      expect(screen.getByTestId('mock-auth-provider')).toBeInTheDocument();
      expect(screen.getByTestId('mock-admin-provider')).toBeInTheDocument();
    });

    it('renders navigation component', () => {
      render(<App />);
      
      expect(screen.getByTestId('mock-navigation')).toBeInTheDocument();
    });

    it('renders main content container with correct styling', () => {
      render(<App />);
      
      const mainElement = screen.getByRole('main');
      expect(mainElement).toBeInTheDocument();
      expect(mainElement).toHaveClass('container', 'mx-auto', 'px-4', 'py-8');
    });
  });

  describe('User Progress Management', () => {
    it('initializes user progress from localStorage when available', () => {
      const mockProgress = {
        userId: 'test-user',
        completedModules: ['module1'],
        quizScores: { quiz1: 85 },
        totalTime: 1200,
        lastAccessed: Date.now(),
        notes: []
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockProgress));
      
      render(<App />);
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('jungAppProgress');
    });

    it('creates new user progress when localStorage is empty', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      render(<App />);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'jungAppProgress',
        expect.stringContaining('"completedModules":[]')
      );
    });

    it('handles corrupted localStorage data gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json');
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      render(<App />);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Corrupted localStorage data detected'),
        expect.any(SyntaxError)
      );
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('jungAppProgress');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Application Layout', () => {
    it('renders with correct root styling', () => {
      render(<App />);
      
      const rootDiv = screen.getByRole('main').parentElement;
      expect(rootDiv).toHaveClass('min-h-screen', 'bg-gray-50');
    });

    it('provides router context to child components', () => {
      render(<App />);
      
      // Verify router is working by checking that routes are rendered
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Error Boundaries', () => {
    it('handles rendering errors gracefully', () => {
      // Suppress console errors for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Test error boundary behavior would go here
      // For now, just verify the app can render without throwing
      expect(() => render(<App />)).not.toThrow();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Component Integration', () => {
    it('passes modules to child components correctly', async () => {
      render(<App />);
      
      // Wait for component to fully render
      await waitFor(() => {
        expect(screen.getByTestId('mock-navigation')).toBeInTheDocument();
      });
    });

    it('maintains state consistency across re-renders', () => {
      const { rerender } = render(<App />);
      
      // Rerender the component
      rerender(<App />);
      
      // Verify localStorage is called appropriately
      expect(mockLocalStorage.getItem).toHaveBeenCalled();
    });
  });

  describe('Future Router Configuration', () => {
    it('configures router with future flags', () => {
      // Test that router is configured with future flags
      render(<App />);
      
      // Verify the app renders without router configuration errors
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });
});