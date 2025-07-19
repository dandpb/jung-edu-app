import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import * as AdminContext from '../../contexts/AdminContext';

// Mock the entire AdminContext module
jest.mock('../../contexts/AdminContext', () => ({
  useAdmin: jest.fn(),
  AdminProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

const mockUseAdmin = AdminContext.useAdmin as jest.MockedFunction<typeof AdminContext.useAdmin>;

// Test components
const ProtectedComponent = () => <div>Protected Content</div>;
const PublicComponent = () => <div>Public Content</div>;

describe('ProtectedRoute Component', () => {
  const renderWithRouter = (isAdmin: boolean, initialEntry: string = '/') => {
    mockUseAdmin.mockReturnValue({
      isAdmin,
      currentAdmin: isAdmin ? { id: 'admin-1', username: 'admin', password: '', role: 'admin', lastLogin: Date.now() } : null,
      login: jest.fn(),
      logout: jest.fn(),
      modules: [],
      updateModules: jest.fn(),
      mindMapNodes: [],
      mindMapEdges: [],
      updateMindMap: jest.fn()
    });
    
    return render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/" element={<PublicComponent />} />
          <Route path="/admin/login" element={<div>Login Page</div>} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <ProtectedComponent />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('redirects to admin login when not authenticated', () => {
    renderWithRouter(false, '/admin');
    
    // Should redirect to login page
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    
    // Should not show protected content when not authenticated
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  test('renders children when authenticated', () => {
    renderWithRouter(true, '/admin');
    
    // Should show protected content
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    
    // Should not show login page
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });

  test('renders Navigate component when not authenticated', () => {
    mockUseAdmin.mockReturnValue({
      isAdmin: false,
      currentAdmin: null,
      login: jest.fn(),
      logout: jest.fn(),
      modules: [],
      updateModules: jest.fn(),
      mindMapNodes: [],
      mindMapEdges: [],
      updateMindMap: jest.fn()
    });
    
    render(
      <MemoryRouter initialEntries={['/admin/modules']}>
        <Routes>
          <Route path="/admin/login" element={<div>Login Page</div>} />
          <Route
            path="/admin/modules"
            element={
              <ProtectedRoute>
                <ProtectedComponent />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );
    
    // Should redirect to login page
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    
    // Should not show protected content
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  test('works with nested routes', () => {
    mockUseAdmin.mockReturnValue({
      isAdmin: true,
      currentAdmin: { id: 'admin-1', username: 'admin', password: '', role: 'admin', lastLogin: Date.now() },
      login: jest.fn(),
      logout: jest.fn(),
      modules: [],
      updateModules: jest.fn(),
      mindMapNodes: [],
      mindMapEdges: [],
      updateMindMap: jest.fn()
    });
    
    const NestedComponent = () => <div>Nested Admin Content</div>;
    
    render(
      <MemoryRouter initialEntries={['/admin/nested']}>
        <Routes>
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <Routes>
                  <Route path="nested" element={<NestedComponent />} />
                </Routes>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );
    
    expect(screen.getByText('Nested Admin Content')).toBeInTheDocument();
  });

  test('renders correctly based on authentication status', () => {
    // Test unauthenticated state
    mockUseAdmin.mockReturnValue({
      isAdmin: false,
      currentAdmin: null,
      login: jest.fn(),
      logout: jest.fn(),
      modules: [],
      updateModules: jest.fn(),
      mindMapNodes: [],
      mindMapEdges: [],
      updateMindMap: jest.fn()
    });
    
    const { unmount } = render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <ProtectedComponent />
              </ProtectedRoute>
            }
          />
          <Route path="/admin/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );
    
    // Should redirect to login when not authenticated
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    
    // Clean up
    unmount();
    
    // Test authenticated state
    mockUseAdmin.mockReturnValue({
      isAdmin: true,
      currentAdmin: { id: 'admin-1', username: 'admin', password: '', role: 'admin', lastLogin: Date.now() },
      login: jest.fn(),
      logout: jest.fn(),
      modules: [],
      updateModules: jest.fn(),
      mindMapNodes: [],
      mindMapEdges: [],
      updateMindMap: jest.fn()
    });
    
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <ProtectedComponent />
              </ProtectedRoute>
            }
          />
          <Route path="/admin/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );
    
    // Should show protected content when authenticated
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });

  test('handles multiple children elements', () => {
    mockUseAdmin.mockReturnValue({
      isAdmin: true,
      currentAdmin: { id: 'admin-1', username: 'admin', password: '', role: 'admin', lastLogin: Date.now() },
      login: jest.fn(),
      logout: jest.fn(),
      modules: [],
      updateModules: jest.fn(),
      mindMapNodes: [],
      mindMapEdges: [],
      updateMindMap: jest.fn()
    });
    
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <>
                  <div>Child 1</div>
                  <div>Child 2</div>
                  <div>Child 3</div>
                </>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );
    
    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
    expect(screen.getByText('Child 3')).toBeInTheDocument();
  });
});