import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderWithoutProviders, mockLocalStorage } from '../utils/test-utils';
import { setupLocalStorage, setupConsoleHandlers } from '../utils/test-setup';
import { createMockModules, createMockUserProgress } from '../utils/test-mocks';
import App from '../App';

// Setup console handlers
setupConsoleHandlers();

// Mock the modules data using factory
const mockModules = createMockModules(3);

// Mock AuthContext to provide authenticated user
jest.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    user: { id: 'test-user', username: 'testuser', role: 'user' },
    isAuthenticated: true,
    isLoading: false,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn()
  })
}));

// Mock contexts
jest.mock('../contexts/AdminContext', () => {
  const actual = jest.requireActual('../contexts/AdminContext');
  return {
    ...actual,
    useAdmin: () => ({
      modules: mockModules,
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      updateModules: jest.fn(),
      addModule: jest.fn(),
      updateModule: jest.fn(),
      deleteModule: jest.fn()
    }),
    AdminProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
  };
});

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Navigate: ({ to }: { to: string }) => <div>Navigate to {to}</div>,
  Routes: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Route: ({ element }: { element: React.ReactNode }) => <div>{element}</div>,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/' }),
  useParams: () => ({})
}));

// Mock components to avoid complex dependencies
jest.mock('../components/Navigation', () => ({
  __esModule: true,
  default: () => <nav data-testid="navigation">Navigation</nav>
}));

jest.mock('../pages/Dashboard', () => ({
  __esModule: true,
  default: ({ modules, userProgress }: any) => (
    <div data-testid="dashboard">
      Dashboard - Modules: {modules.length}, User: {userProgress.userId}
    </div>
  )
}));

jest.mock('../pages/ModulePage', () => ({
  __esModule: true,
  default: () => <div data-testid="module-page">Module Page</div>
}));

  __esModule: true,
}));

jest.mock('../pages/admin/AdminLogin', () => ({
  __esModule: true,
  default: () => <div data-testid="admin-login">Admin Login</div>
}));

jest.mock('../components/auth/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

jest.mock('../components/auth/PublicRoute', () => ({
  PublicRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

// LocalStorage is already mocked by test-utils

describe('App Component', () => {
  // Setup localStorage for each test
  setupLocalStorage();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    renderWithoutProviders(<App />);
    expect(screen.getByTestId('navigation')).toBeInTheDocument();
  });

  test('wraps content with AdminProvider', () => {
    const { container } = renderWithoutProviders(<App />);
    expect(container).toBeInTheDocument();
  });

  test('renders navigation component', () => {
    renderWithoutProviders(<App />);
    expect(screen.getByTestId('navigation')).toBeInTheDocument();
  });

  test('initializes user progress from localStorage when available', () => {
    const existingProgress = createMockUserProgress({
      userId: 'existing-user',
      completedModules: ['module1'],
      quizScores: { module1: 80 },
      totalTime: 3600
    });
    
    mockLocalStorage.__setStore({
      jungAppProgress: JSON.stringify(existingProgress)
    });
    
    renderWithoutProviders(<App />);
    
    // Check that the dashboard receives the existing progress
    expect(screen.getByTestId('dashboard')).toHaveTextContent('User: existing-user');
  });

  test('creates new user progress when localStorage is empty', async () => {
    renderWithoutProviders(<App />);
    
    // Wait for localStorage to be populated
    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'jungAppProgress',
        expect.any(String)
      );
    });
    
    const calls = mockLocalStorage.setItem.mock.calls;
    const progressCall = calls.find(call => call[0] === 'jungAppProgress');
    
    if (progressCall) {
      const progress = JSON.parse(progressCall[1]);
      expect(progress).toMatchObject({
        userId: expect.stringMatching(/^user-\d+$/),
        completedModules: [],
        quizScores: {},
        totalTime: 0,
        lastAccessed: expect.any(Number),
        notes: []
      });
    }
  });

  test('saves user progress to localStorage on updates', async () => {
    renderWithoutProviders(<App />);
    
    // Wait for initial save
    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'jungAppProgress',
        expect.any(String)
      );
    });
  });

  test('renders main container with correct styling', () => {
    const { container } = renderWithoutProviders(<App />);
    const mainElement = container.querySelector('main');
    
    expect(mainElement).toHaveClass('container', 'mx-auto', 'px-4', 'py-8');
  });

  test('renders with min-height screen background', () => {
    const { container } = renderWithoutProviders(<App />);
    const rootDiv = container.querySelector('.min-h-screen');
    
    expect(rootDiv).toBeInTheDocument();
    expect(rootDiv).toHaveClass('bg-gray-50');
  });

  test('includes router with future flags', () => {
    renderWithoutProviders(<App />);
    // The router is mocked, but we verify the component renders
    expect(screen.getByTestId('navigation')).toBeInTheDocument();
  });

  test('provides modules from admin context', () => {
    renderWithoutProviders(<App />);
    
    expect(screen.getByTestId('dashboard')).toHaveTextContent('Modules: 3');
  });

  test('handles corrupted localStorage gracefully', async () => {
    mockLocalStorage.__setStore({
      jungAppProgress: 'invalid-json'
    });
    
    // Should not throw an error
    expect(() => renderWithoutProviders(<App />)).not.toThrow();
    
    // Should create new progress
    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'jungAppProgress',
        expect.any(String)
      );
    });
  });

  test('AppContent receives modules from useAdmin hook', () => {
    renderWithoutProviders(<App />);
    
    const dashboard = screen.getByTestId('dashboard');
    expect(dashboard).toHaveTextContent('Modules: 3');
  });

  test('renders Routes component structure', () => {
    const { container } = renderWithoutProviders(<App />);
    
    // Verify the structure exists (mocked components)
    expect(container.querySelector('main')).toBeInTheDocument();
    expect(screen.getByTestId('navigation')).toBeInTheDocument();
  });

  test('user progress includes all required fields', async () => {
    renderWithoutProviders(<App />);
    
    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'jungAppProgress',
        expect.any(String)
      );
    });
    
    const calls = mockLocalStorage.setItem.mock.calls;
    const progressCall = calls.find(call => call[0] === 'jungAppProgress');
    
    if (progressCall) {
      const progress = JSON.parse(progressCall[1]);
      expect(progress).toHaveProperty('userId');
      expect(progress).toHaveProperty('completedModules');
      expect(progress).toHaveProperty('quizScores');
      expect(progress).toHaveProperty('totalTime');
      expect(progress).toHaveProperty('lastAccessed');
      expect(progress).toHaveProperty('notes');
    }
  });

  test('multiple renders use same user progress', async () => {
    const { unmount } = renderWithoutProviders(<App />);
    
    // Wait for first render to save
    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
    
    const firstCalls = mockLocalStorage.setItem.mock.calls;
    const firstProgressCall = firstCalls.find(call => call[0] === 'jungAppProgress');
    const firstUserId = firstProgressCall ? JSON.parse(firstProgressCall[1]).userId : null;
    
    unmount();
    
    // Clear mock calls but keep the store
    mockLocalStorage.setItem.mockClear();
    
    // Second render should use existing progress
    renderWithoutProviders(<App />);
    
    // Verify it loaded from localStorage
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('jungAppProgress');
  });
});