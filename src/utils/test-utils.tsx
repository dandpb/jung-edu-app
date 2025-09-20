import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { AdminProvider } from '../contexts/AdminContext';
import { AuthProvider } from '../contexts/AuthContext';
import userEvent from '@testing-library/user-event';

// Custom render options
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  useMemoryRouter?: boolean;
  authState?: {
    user?: any;
    isAuthenticated?: boolean;
    isLoading?: boolean;
  };
  adminState?: {
    isAdmin?: boolean;
    currentAdmin?: any;
  };
}

// Mock localStorage implementation
export const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    // Helper to get current store state
    __getStore: () => ({ ...store }),
    // Helper to set initial store state
    __setStore: (initialStore: Record<string, string>) => {
      store = { ...initialStore };
      // Update the mock implementation to return from the new store
      mockLocalStorage.getItem.mockImplementation((key: string) => store[key] || null);
    }
  };
})();

// Setup localStorage mock
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true
  });
}

// All providers wrapper
interface AllTheProvidersProps {
  children: React.ReactNode;
  options?: CustomRenderOptions;
}

const AllTheProviders: React.FC<AllTheProvidersProps> = ({ children, options = {} }) => {
  const { useMemoryRouter = true, initialEntries = ['/'] } = options;
  
  const Router = useMemoryRouter ? MemoryRouter : BrowserRouter;
  const routerProps = useMemoryRouter 
    ? { initialEntries } 
    : { future: { v7_startTransition: true, v7_relativeSplatPath: true } };
  
  // Check if AuthProvider is mocked by checking if it's a jest mock function
  const isAuthMocked = typeof AuthProvider === 'function' &&
    AuthProvider.hasOwnProperty('_isMockFunction');

  if (isAuthMocked) {
    return (
      <Router {...routerProps}>
        <AdminProvider>
          {children}
        </AdminProvider>
      </Router>
    );
  }
  
  // Otherwise, include AuthProvider
  // Router must wrap AuthProvider since AuthProvider uses useNavigate
  return (
    <Router {...routerProps}>
      <AuthProvider>
        <AdminProvider>
          {children}
        </AdminProvider>
      </AuthProvider>
    </Router>
  );
};

// Custom render function
export const customRender = (
  ui: React.ReactElement,
  options?: CustomRenderOptions
) => {
  const user = userEvent.setup();
  
  const renderResult = render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders options={options}>{children}</AllTheProviders>
    ),
    ...options
  });
  
  return {
    user,
    ...renderResult
  };
};

// Render function that doesn't include any providers (for App component tests)
export const renderWithoutProviders = (
  ui: React.ReactElement,
  options?: RenderOptions
) => {
  const user = userEvent.setup();
  const renderResult = render(ui, options);
  
  return {
    user,
    ...renderResult
  };
};

// Render function for components that need Router context but not App's BrowserRouter
export const renderWithRouter = (
  ui: React.ReactElement,
  options?: { initialEntries?: string[] } & RenderOptions
) => {
  const { initialEntries = ['/'], ...renderOptions } = options || {};
  const user = userEvent.setup();
  
  const renderResult = render(
    <MemoryRouter initialEntries={initialEntries}>
      {ui}
    </MemoryRouter>,
    renderOptions
  );
  
  return {
    user,
    ...renderResult
  };
};

// Re-export everything from React Testing Library
export * from '@testing-library/react';

// Export the custom render as the default render
export { customRender as render };

// Export userEvent for convenience
export { userEvent };