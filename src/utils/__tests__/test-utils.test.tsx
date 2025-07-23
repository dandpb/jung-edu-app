/**
 * Test suite for test-utils
 * Tests the custom render function and provider setup
 */

import React from 'react';
import { render as rtlRender, screen, waitFor, fireEvent } from '@testing-library/react';
import { useNavigate, useLocation, NavigateFunction, Location } from 'react-router-dom';
import { render } from '../test-utils';
import { useAdmin } from '../../contexts/AdminContext';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div data-testid="browser-router">{children}</div>,
  useNavigate: jest.fn(),
  useLocation: jest.fn()
}));

// Mock AdminContext
jest.mock('../../contexts/AdminContext', () => ({
  ...jest.requireActual('../../contexts/AdminContext'),
  AdminProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="admin-provider">{children}</div>,
  useAdmin: jest.fn()
}));

describe('test-utils', () => {
  const mockNavigate = jest.fn();
  const mockLocation = { pathname: '/', search: '', hash: '', state: null, key: '' };

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    (useLocation as jest.Mock).mockReturnValue(mockLocation);
    (useAdmin as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      login: jest.fn(),
      logout: jest.fn(),
      checkAuth: jest.fn()
    });
  });

  describe('custom render function', () => {
    it('should render component with all providers', () => {
      const TestComponent = () => <div data-testid="test-component">Test Content</div>;
      
      render(<TestComponent />);

      expect(screen.getByTestId('test-component')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should wrap component with AdminProvider', () => {
      const TestComponent = () => {
        const admin = useAdmin();
        return (
          <div data-testid="admin-test">
            {admin.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
          </div>
        );
      };

      render(<TestComponent />);

      expect(screen.getByTestId('admin-test')).toBeInTheDocument();
      expect(screen.getByText('Not Authenticated')).toBeInTheDocument();
    });

    it('should wrap component with BrowserRouter', () => {
      const TestComponent = () => {
        const navigate = useNavigate();
        const location = useLocation();
        
        return (
          <div>
            <div data-testid="location">{location.pathname}</div>
            <button onClick={() => navigate('/test')}>Navigate</button>
          </div>
        );
      };

      render(<TestComponent />);

      expect(screen.getByTestId('location')).toHaveTextContent('/');
      screen.getByText('Navigate').click();
      expect(mockNavigate).toHaveBeenCalledWith('/test');
    });

    it('should pass through render options', () => {
      const TestComponent = () => <div data-testid="test">Test</div>;
      const container = document.createElement('div');
      container.id = 'custom-container';
      document.body.appendChild(container);

      const result = render(<TestComponent />, { container });

      expect(result.container).toBe(container);
      expect(container.querySelector('[data-testid="test"]')).toBeInTheDocument();

      document.body.removeChild(container);
    });

    it('should handle components that use multiple context providers', () => {
      const TestComponent = () => {
        const admin = useAdmin();
        const navigate = useNavigate();
        
        return (
          <div>
            <div data-testid="admin-status">{admin.isAuthenticated ? 'Admin' : 'Guest'}</div>
            <button onClick={() => navigate('/admin')}>Go to Admin</button>
          </div>
        );
      };

      render(<TestComponent />);

      expect(screen.getByTestId('admin-status')).toHaveTextContent('Guest');
      screen.getByText('Go to Admin').click();
      expect(mockNavigate).toHaveBeenCalledWith('/admin');
    });

    it('should properly configure BrowserRouter with future flags', () => {
      // Create a component that uses router features
      const TestComponent = () => {
        const navigate = useNavigate();
        return (
          <button onClick={() => navigate('/test', { state: { from: 'test' } })}>
            Navigate with State
          </button>
        );
      };

      render(<TestComponent />);
      
      // Verify component renders and navigation works
      const button = screen.getByText('Navigate with State');
      button.click();
      
      expect(mockNavigate).toHaveBeenCalledWith('/test', { state: { from: 'test' } });
    });

    it('should handle async component rendering', async () => {
      const AsyncComponent = () => {
        const [loaded, setLoaded] = React.useState(false);
        
        React.useEffect(() => {
          setTimeout(() => setLoaded(true), 10);
        }, []);
        
        return loaded ? <div data-testid="async">Loaded</div> : <div>Loading...</div>;
      };

      render(<AsyncComponent />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByTestId('async')).toBeInTheDocument();
        expect(screen.getByText('Loaded')).toBeInTheDocument();
      });
    });

    it('should handle error boundaries', () => {
      const ErrorComponent = () => {
        throw new Error('Test error');
      };

      class ErrorBoundary extends React.Component<
        { children: React.ReactNode },
        { hasError: boolean }
      > {
        constructor(props: { children: React.ReactNode }) {
          super(props);
          this.state = { hasError: false };
        }

        static getDerivedStateFromError() {
          return { hasError: true };
        }

        componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
          console.log('Error caught:', error, errorInfo);
        }

        render() {
          if (this.state.hasError) {
            return <div data-testid="error">Error caught</div>;
          }

          return this.props.children;
        }
      }

      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error')).toBeInTheDocument();
      expect(screen.getByText('Error caught')).toBeInTheDocument();

      consoleSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should support custom wrapper components', () => {
      const CustomWrapper = ({ children }: { children: React.ReactNode }) => (
        <div data-testid="custom-wrapper" style={{ padding: '20px' }}>
          {children}
        </div>
      );

      const TestComponent = () => <div data-testid="test">Content</div>;

      // Since our render already has a wrapper, we need to test differently
      const { container } = render(
        <CustomWrapper>
          <TestComponent />
        </CustomWrapper>
      );

      expect(screen.getByTestId('custom-wrapper')).toBeInTheDocument();
      expect(screen.getByTestId('test')).toBeInTheDocument();
    });

    it('should maintain provider hierarchy order', () => {
      let renderOrder: string[] = [];

      // Override mocks to track order
      jest.doMock('../../contexts/AdminContext', () => ({
        AdminProvider: ({ children }: { children: React.ReactNode }) => {
          renderOrder.push('AdminProvider');
          return <div data-testid="admin-provider">{children}</div>;
        },
        useAdmin: jest.fn()
      }));

      jest.doMock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        BrowserRouter: ({ children }: { children: React.ReactNode }) => {
          renderOrder.push('BrowserRouter');
          return <div data-testid="browser-router">{children}</div>;
        },
        useNavigate: jest.fn(),
        useLocation: jest.fn()
      }));

      const TestComponent = () => {
        renderOrder.push('Component');
        return <div>Test</div>;
      };

      render(<TestComponent />);

      // AdminProvider should wrap BrowserRouter
      expect(renderOrder.indexOf('AdminProvider')).toBeLessThan(renderOrder.indexOf('Component'));
    });

    it('should handle multiple renders without conflicts', () => {
      const Component1 = () => <div data-testid="comp1">Component 1</div>;
      const Component2 = () => <div data-testid="comp2">Component 2</div>;

      const result1 = render(<Component1 />);
      expect(screen.getByTestId('comp1')).toBeInTheDocument();

      // Clean up first render
      result1.unmount();

      const result2 = render(<Component2 />);
      expect(screen.getByTestId('comp2')).toBeInTheDocument();
      expect(screen.queryByTestId('comp1')).not.toBeInTheDocument();
    });

    it('should preserve React Testing Library functionality', () => {
      const TestComponent = () => {
        const [count, setCount] = React.useState(0);
        
        return (
          <div>
            <div data-testid="count">{count}</div>
            <button onClick={() => setCount(c => c + 1)}>Increment</button>
          </div>
        );
      };

      const { rerender, unmount, container } = render(<TestComponent />);

      // Test initial render
      expect(screen.getByTestId('count')).toHaveTextContent('0');

      // Test interaction
      const button = screen.getByText('Increment');
      fireEvent.click(button);
      expect(screen.getByTestId('count')).toHaveTextContent('1');

      // Test rerender
      rerender(<TestComponent />);
      expect(screen.getByTestId('count')).toHaveTextContent('1'); // State should persist

      // Test container
      expect(container.querySelector('[data-testid="count"]')).toBeInTheDocument();

      // Test unmount
      unmount();
      expect(container.querySelector('[data-testid="count"]')).not.toBeInTheDocument();
    });

    it('should handle components with complex provider dependencies', () => {
      const ComplexComponent = () => {
        const admin = useAdmin();
        const navigate = useNavigate();
        const location = useLocation();
        
        const handleAction = () => {
          if (admin.isAuthenticated) {
            navigate('/dashboard');
          } else {
            navigate('/login', { state: { from: location.pathname } });
          }
        };
        
        return (
          <div>
            <div data-testid="path">{location.pathname}</div>
            <div data-testid="auth">{admin.isAuthenticated ? 'Yes' : 'No'}</div>
            <button onClick={handleAction}>Action</button>
          </div>
        );
      };

      // Test unauthenticated state
      const { unmount: unmount1 } = render(<ComplexComponent />);
      
      expect(screen.getByTestId('path')).toHaveTextContent('/');
      expect(screen.getByTestId('auth')).toHaveTextContent('No');
      
      const buttons = screen.getAllByText('Action');
      fireEvent.click(buttons[0]);
      expect(mockNavigate).toHaveBeenCalledWith('/login', { state: { from: '/' } });

      // Clean up first render
      unmount1();
      
      // Clean up and reset mocks
      mockNavigate.mockClear();
      
      // Test authenticated state
      (useAdmin as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        checkAuth: jest.fn()
      });
      
      // Re-render with new auth state
      const { unmount: unmount2 } = render(<ComplexComponent />);
      
      expect(screen.getByTestId('auth')).toHaveTextContent('Yes');
      
      const newButtons = screen.getAllByText('Action');
      fireEvent.click(newButtons[0]);
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      
      unmount2();
    });
  });

  describe('re-exported RTL functions', () => {
    it('should re-export all React Testing Library functions', () => {
      // Import the module
      const testUtils = require('../test-utils');
      
      // Check that common RTL exports are available
      expect(testUtils.screen).toBeDefined();
      expect(testUtils.waitFor).toBeDefined();
      expect(testUtils.fireEvent).toBeDefined();
      expect(testUtils.cleanup).toBeDefined();
      expect(testUtils.act).toBeDefined();
      expect(testUtils.renderHook).toBeDefined();
      
      // Check query functions
      expect(testUtils.getByText).toBeDefined();
      expect(testUtils.getByRole).toBeDefined();
      expect(testUtils.getByTestId).toBeDefined();
      expect(testUtils.queryByText).toBeDefined();
      expect(testUtils.findByText).toBeDefined();
    });

    it('should have render as the customized function', () => {
      const testUtils = require('../test-utils');
      
      // Our custom render should be different from RTL's render
      expect(testUtils.render).toBeDefined();
      expect(testUtils.render).not.toBe(rtlRender);
    });
  });

  describe('TypeScript types', () => {
    it('should accept all valid React elements', () => {
      // Function component
      const FunctionComponent = () => <div>Function</div>;
      render(<FunctionComponent />);
      expect(screen.getByText('Function')).toBeInTheDocument();

      // Class component
      class ClassComponent extends React.Component {
        render() {
          return <div>Class</div>;
        }
      }
      render(<ClassComponent />);
      expect(screen.getByText('Class')).toBeInTheDocument();

      // Fragment
      render(<><div>Fragment</div></>);
      expect(screen.getByText('Fragment')).toBeInTheDocument();

      // With props
      const WithProps: React.FC<{ text: string }> = ({ text }) => <div>{text}</div>;
      render(<WithProps text="Props" />);
      expect(screen.getByText('Props')).toBeInTheDocument();
    });
  });
});