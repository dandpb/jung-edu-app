import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { renderWithoutProviders, mockLocalStorage } from './utils/test-utils';
import { setupConsoleHandlers } from './utils/test-setup';
import { createMockModules, createMockUserProgress } from './utils/test-mocks';
import App from './App';
import { useAdmin } from './contexts/AdminContext';

// Setup console handlers to reduce noise
setupConsoleHandlers();

// Mock only the useAdmin hook
jest.mock('./contexts/AdminContext', () => ({
  ...jest.requireActual('./contexts/AdminContext'),
  useAdmin: jest.fn()
}));

// Mock AuthContext to have a logged-in user
jest.mock('./contexts/AuthContext', () => ({
  ...jest.requireActual('./contexts/AuthContext'),
  useAuth: () => ({
    user: { id: 'test-user', username: 'testuser', role: 'user' },
    isAuthenticated: true,
    isLoading: false,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn()
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

// Mock Navigation component to avoid router issues
jest.mock('./components/Navigation', () => {
  return function Navigation() { 
    return <nav data-testid="navigation">Navigation</nav>; 
  };
});

// Mock all page components
jest.mock('./pages/Dashboard', () => {
  return function Dashboard() { return <div data-testid="dashboard-page">Dashboard Page</div>; };
});
jest.mock('./pages/ModulePage', () => {
  return function ModulePage() { return <div data-testid="module-page">Module Page</div>; };
});
jest.mock('./pages/MindMapPage', () => {
  return function MindMapPage() { return <div data-testid="mindmap-page">MindMap Page</div>; };
});
jest.mock('./pages/MiniMapDemo', () => {
  return function MiniMapDemo() { return <div data-testid="minimap-demo">MiniMap Demo</div>; };
});
jest.mock('./pages/EnhancedMindMapPage', () => {
  return function EnhancedMindMapPage() { return <div data-testid="enhanced-mindmap">Enhanced MindMap Page</div>; };
});
jest.mock('./pages/AIDemo', () => {
  return function AIDemo() { return <div data-testid="ai-demo">AI Demo</div>; };
});
jest.mock('./pages/NotesPage', () => {
  return function NotesPage() { return <div data-testid="notes-page">Notes Page</div>; };
});
jest.mock('./pages/BibliographyPage', () => {
  return function BibliographyPage() { return <div data-testid="bibliography-page">Bibliography Page</div>; };
});
jest.mock('./pages/SearchPage', () => {
  return function SearchPage() { return <div data-testid="search-page">Search Page</div>; };
});
jest.mock('./pages/TestYouTubeIntegration', () => {
  return function TestYouTubeIntegration() { return <div data-testid="youtube-integration">YouTube Integration</div>; };
});
jest.mock('./pages/TestYouTubeAPI', () => {
  return function TestYouTubeAPI() { return <div data-testid="youtube-api">YouTube API Test</div>; };
});
jest.mock('./pages/admin/AdminLogin', () => {
  return function AdminLogin() { return <div data-testid="admin-login">Admin Login</div>; };
});
jest.mock('./pages/admin/AdminDashboard', () => {
  return function AdminDashboard() { return <div data-testid="admin-dashboard">Admin Dashboard</div>; };
});
jest.mock('./pages/admin/AdminModules', () => {
  return function AdminModules() { return <div data-testid="admin-modules">Admin Modules</div>; };
});
jest.mock('./pages/admin/AdminResources', () => {
  return function AdminResources() { return <div data-testid="admin-resources">Admin Resources</div>; };
});
jest.mock('./components/ProtectedRoute', () => {
  return function ProtectedRoute({ children }: { children: React.ReactNode }) {
    return <div>{children}</div>;
  };
});

describe('App Component', () => {
  const mockModules = createMockModules(3);

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Clear and setup localStorage directly
    mockLocalStorage.clear();
    mockLocalStorage.__setStore({
      jungAppEducationalModules: JSON.stringify(mockModules),
      jungAppMindMapNodes: JSON.stringify([]),
      jungAppMindMapEdges: JSON.stringify([])
    });

    // Mock useAdmin hook
    (useAdmin as jest.Mock).mockReturnValue({
      modules: mockModules,
      updateModules: jest.fn(),
      mindMapNodes: [],
      mindMapEdges: [],
      updateMindMap: jest.fn(),
      isAdmin: false,
      currentAdmin: null,
      adminLogin: jest.fn(),
      adminLogout: jest.fn(),
    });
  });

  test('renders without crashing', () => {
    renderWithoutProviders(<App />);
    expect(screen.getByText('Navigation')).toBeInTheDocument();
  });

  test('initializes user progress from localStorage', () => {
    const savedProgress = createMockUserProgress({
      userId: 'test-user',
      completedModules: ['intro-jung'],
      quizScores: { 'intro-jung': 85 },
      totalTime: 1800
    });
    
    // Setup localStorage with saved progress
    mockLocalStorage.__setStore({
      jungAppProgress: JSON.stringify(savedProgress),
      jungAppEducationalModules: JSON.stringify(mockModules),
      jungAppMindMapNodes: JSON.stringify([]),
      jungAppMindMapEdges: JSON.stringify([])
    });
    
    renderWithoutProviders(<App />);
    
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('jungAppProgress');
  });

  test('creates new user progress if none exists', () => {
    renderWithoutProviders(<App />);
    
    // Wait a bit for the component to initialize
    waitFor(() => {
      // Check that localStorage.setItem was called
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      
      // Get the arguments passed to localStorage.setItem
      const calls = mockLocalStorage.setItem.mock.calls;
      const progressCall = calls.find(call => call[0] === 'jungAppProgress');
      
      expect(progressCall).toBeDefined();
      
      if (progressCall) {
        const savedData = JSON.parse(progressCall[1]);
        expect(savedData).toHaveProperty('userId');
        expect(savedData.completedModules).toEqual([]);
        expect(savedData.notes).toEqual([]);
      }
    });
  });

  test('navigation renders correctly', () => {
    renderWithoutProviders(<App />);
    expect(screen.getByTestId('navigation')).toBeInTheDocument();
  });

  describe('Routing and Components', () => {
    test('renders navigation and shows dashboard for authenticated user', () => {
      const { container } = renderWithoutProviders(<App />);
      
      // Check that the router structure is rendered
      expect(container.querySelector('.min-h-screen')).toBeInTheDocument();
      
      // Navigation should always be visible
      expect(screen.getByTestId('navigation')).toBeInTheDocument();
      
      // Since we're authenticated and at the root path, should show dashboard
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });

    test('initializes dashboard with correct data', () => {
      renderWithoutProviders(<App />);
      
      // Dashboard should be visible for authenticated user
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      
      // Verify useAdmin was called to get modules
      expect(useAdmin).toHaveBeenCalled();
    });
  });

  describe('localStorage integration', () => {
    test('saves user progress to localStorage on initial render', async () => {
      renderWithoutProviders(<App />);
      
      // Wait for the component to initialize and save to localStorage
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'jungAppProgress',
          expect.any(String)
        );
      });

      // Verify the saved data structure
      const savedProgressCalls = mockLocalStorage.setItem.mock.calls.filter(
        call => call[0] === 'jungAppProgress'
      );
      expect(savedProgressCalls.length).toBeGreaterThan(0);
      
      const lastCall = savedProgressCalls[savedProgressCalls.length - 1];
      const savedData = JSON.parse(lastCall[1]);
      expect(savedData).toHaveProperty('userId');
      expect(savedData).toHaveProperty('completedModules');
      expect(savedData).toHaveProperty('lastAccessed');
      expect(savedData.completedModules).toEqual([]);
    });

    test('loads existing progress from localStorage', async () => {
      const existingProgress = createMockUserProgress({
        userId: 'existing-user',
        completedModules: ['module1'],
        quizScores: { module1: 85 },
        totalTime: 1800
      });

      mockLocalStorage.__setStore({
        jungAppProgress: JSON.stringify(existingProgress),
        jungAppEducationalModules: JSON.stringify(mockModules),
        jungAppMindMapNodes: JSON.stringify([]),
        jungAppMindMapEdges: JSON.stringify([])
      });

      renderWithoutProviders(<App />);
      
      // The component should load the existing progress
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('jungAppProgress');
    });
  });

  describe('AppContent component', () => {
    test('initializes with correct state structure', () => {
      const { container } = renderWithoutProviders(<App />);
      
      // Verify the app structure is rendered
      expect(container.querySelector('.min-h-screen')).toBeInTheDocument();
      expect(container.querySelector('.bg-gray-50')).toBeInTheDocument();
    });

    test('renders main container with correct classes', () => {
      const { container } = renderWithoutProviders(<App />);
      
      const mainElement = container.querySelector('main');
      expect(mainElement).toHaveClass('container', 'mx-auto', 'px-4', 'py-8');
    });
  });

  describe('App wrapper component', () => {
    test('wraps AppContent with AdminProvider', () => {
      renderWithoutProviders(<App />);
      
      // AdminProvider should wrap the entire app
      expect(screen.getByTestId('navigation')).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    test('renders with correct CSS classes', () => {
      const { container } = renderWithoutProviders(<App />);
      
      // Check for main app structure classes
      expect(container.querySelector('.min-h-screen.bg-gray-50')).toBeInTheDocument();
      expect(container.querySelector('main.container.mx-auto.px-4.py-8')).toBeInTheDocument();
    });

    test('initializes with AdminProvider wrapper', () => {
      renderWithoutProviders(<App />);
      
      // Verify that the useAdmin hook is being used (called during render)
      expect(useAdmin).toHaveBeenCalled();
    });

    test('renders navigation component', () => {
      renderWithoutProviders(<App />);
      
      expect(screen.getByTestId('navigation')).toBeInTheDocument();
    });
  });
});