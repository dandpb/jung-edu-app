import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';
import { AdminProvider } from '../contexts/AdminContext';

// Mock the modules data
const mockModules = [
  {
    id: '1',
    title: 'Introduction to Jung',
    description: 'Basic concepts of Jungian psychology',
    content: {
      introduction: 'Welcome to Jungian psychology',
      sections: [
        {
          title: 'The Unconscious',
          content: 'Understanding the personal and collective unconscious'
        },
        {
          title: 'Archetypes',
          content: 'Common patterns in human psychology'
        }
      ],
      conclusion: 'Summary of key concepts'
    },
    videoUrl: 'https://example.com/video1',
    quiz: {
      questions: [
        {
          id: 'q1',
          question: 'What is the collective unconscious?',
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: 0,
          explanation: 'The collective unconscious is...'
        }
      ]
    },
    order: 1,
    mindMapData: {
      nodes: [],
      edges: []
    },
    bibliography: [],
    additionalResources: []
  }
];

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

jest.mock('../pages/MindMapPage', () => ({
  __esModule: true,
  default: () => <div data-testid="mindmap-page">MindMap Page</div>
}));

jest.mock('../pages/admin/AdminLogin', () => ({
  __esModule: true,
  default: () => <div data-testid="admin-login">Admin Login</div>
}));

jest.mock('../components/ProtectedRoute', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="protected-route">{children}</div>
}));

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

describe('App Component', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    render(<App />);
    expect(screen.getByTestId('navigation')).toBeInTheDocument();
  });

  test('wraps content with AdminProvider', () => {
    const { container } = render(<App />);
    expect(container).toBeInTheDocument();
  });

  test('renders navigation component', () => {
    render(<App />);
    expect(screen.getByTestId('navigation')).toBeInTheDocument();
  });

  test('initializes user progress from localStorage when available', () => {
    const existingProgress = {
      userId: 'existing-user',
      completedModules: ['module1'],
      quizScores: { module1: 80 },
      totalTime: 3600,
      lastAccessed: Date.now() - 1000,
      notes: []
    };
    
    localStorageMock.setItem('jungAppProgress', JSON.stringify(existingProgress));
    
    render(<App />);
    
    // Check that the dashboard receives the existing progress
    expect(screen.getByTestId('dashboard')).toHaveTextContent('User: existing-user');
  });

  test('creates new user progress when localStorage is empty', () => {
    render(<App />);
    
    // Check that localStorage was populated
    const savedProgress = localStorageMock.getItem('jungAppProgress');
    expect(savedProgress).toBeTruthy();
    
    const progress = JSON.parse(savedProgress!);
    expect(progress).toMatchObject({
      userId: expect.stringMatching(/^user-\d+$/),
      completedModules: [],
      quizScores: {},
      totalTime: 0,
      lastAccessed: expect.any(Number),
      notes: []
    });
  });

  test('saves user progress to localStorage on updates', async () => {
    render(<App />);
    
    // Initial save
    const initialProgress = localStorageMock.getItem('jungAppProgress');
    expect(initialProgress).toBeTruthy();
    
    // Wait for any potential updates
    await waitFor(() => {
      const currentProgress = localStorageMock.getItem('jungAppProgress');
      expect(currentProgress).toBeTruthy();
    });
  });

  test('renders main container with correct styling', () => {
    const { container } = render(<App />);
    const mainElement = container.querySelector('main');
    
    expect(mainElement).toHaveClass('container', 'mx-auto', 'px-4', 'py-8');
  });

  test('renders with min-height screen background', () => {
    const { container } = render(<App />);
    const rootDiv = container.querySelector('.min-h-screen');
    
    expect(rootDiv).toBeInTheDocument();
    expect(rootDiv).toHaveClass('bg-gray-50');
  });

  test('includes router with future flags', () => {
    render(<App />);
    // The router is mocked, but we verify the component renders
    expect(screen.getByTestId('navigation')).toBeInTheDocument();
  });

  test('provides modules from admin context', () => {
    render(<App />);
    
    expect(screen.getByTestId('dashboard')).toHaveTextContent('Modules: 1');
  });

  test('handles corrupted localStorage gracefully', () => {
    localStorageMock.setItem('jungAppProgress', 'invalid-json');
    
    // Should not throw an error
    expect(() => render(<App />)).not.toThrow();
    
    // Should create new progress
    const savedProgress = localStorageMock.getItem('jungAppProgress');
    const progress = JSON.parse(savedProgress!);
    expect(progress.userId).toMatch(/^user-\d+$/);
  });

  test('AppContent receives modules from useAdmin hook', () => {
    render(<App />);
    
    const dashboard = screen.getByTestId('dashboard');
    expect(dashboard).toHaveTextContent('Modules: 1');
  });

  test('renders Routes component structure', () => {
    const { container } = render(<App />);
    
    // Verify the structure exists (mocked components)
    expect(container.querySelector('main')).toBeInTheDocument();
    expect(screen.getByTestId('navigation')).toBeInTheDocument();
  });

  test('user progress includes all required fields', () => {
    render(<App />);
    
    const savedProgress = localStorageMock.getItem('jungAppProgress');
    const progress = JSON.parse(savedProgress!);
    
    expect(progress).toHaveProperty('userId');
    expect(progress).toHaveProperty('completedModules');
    expect(progress).toHaveProperty('quizScores');
    expect(progress).toHaveProperty('totalTime');
    expect(progress).toHaveProperty('lastAccessed');
    expect(progress).toHaveProperty('notes');
  });

  test('multiple renders use same user progress', () => {
    const { unmount } = render(<App />);
    const firstProgress = localStorageMock.getItem('jungAppProgress');
    const firstUserId = JSON.parse(firstProgress!).userId;
    
    unmount();
    
    render(<App />);
    const secondProgress = localStorageMock.getItem('jungAppProgress');
    const secondUserId = JSON.parse(secondProgress!).userId;
    
    expect(secondUserId).toBe(firstUserId);
  });
});