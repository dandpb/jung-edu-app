import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route, MemoryRouter } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import { AdminProvider } from '../../contexts/AdminContext';

// Mock the admin context
jest.mock('../../contexts/AdminContext', () => ({
  ...jest.requireActual('../../contexts/AdminContext'),
  useAdmin: jest.fn()
}));

import { useAdmin } from '../../contexts/AdminContext';

const mockUseAdmin = useAdmin as jest.MockedFunction<typeof useAdmin>;

// Test components
const ProtectedComponent = () => <div>Protected Content</div>;
const PublicComponent = () => <div>Public Content</div>;

describe('ProtectedRoute Component', () => {
  const renderWithRouter = (isAdmin: boolean) => {
    mockUseAdmin.mockReturnValue({ isAdmin });
    
    return render(
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AdminProvider>
          <Routes>
            <Route path="/" element={<PublicComponent />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <ProtectedComponent />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AdminProvider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('redirects to admin login when not authenticated', () => {
    renderWithRouter(false);
    
    // Should not show protected content when not authenticated
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    
    // Should show public content instead (because we start at '/')
    expect(screen.getByText('Public Content')).toBeInTheDocument();
  });

  test('renders children when authenticated', () => {
    renderWithRouter(true);
    
    // Navigate to protected route
    window.history.pushState({}, '', '/admin');
    
    // Force a re-render to pick up the route change
    render(
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <ProtectedComponent />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    );
    
    // Should show protected content
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  test('renders Navigate component when not authenticated', () => {
    mockUseAdmin.mockReturnValue({ isAdmin: false });
    
    const { container } = render(
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
      </BrowserRouter>
    );
    
    // The Navigate component should redirect to login
    window.history.pushState({}, '', '/admin/modules');
    
    // Should not show protected content
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  test('works with nested routes', () => {
    mockUseAdmin.mockReturnValue({ isAdmin: true });
    
    const NestedComponent = () => <div>Nested Admin Content</div>;
    
    render(
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
      </BrowserRouter>
    );
    
    // Navigate to nested route
    window.history.pushState({}, '', '/admin/nested');
    
    // Re-render to pick up route
    render(
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route
            path="/admin/nested"
            element={
              <ProtectedRoute>
                <NestedComponent />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    );
    
    expect(screen.getByText('Nested Admin Content')).toBeInTheDocument();
  });

  test('renders correctly based on authentication status', () => {
    // Test unauthenticated state
    mockUseAdmin.mockReturnValue({ isAdmin: false });
    
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
    mockUseAdmin.mockReturnValue({ isAdmin: true });
    
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
    mockUseAdmin.mockReturnValue({ isAdmin: true });
    
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