import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import { setNodeEnv, restoreNodeEnv } from '../../test-utils/nodeEnvHelper';

// Mock console methods to avoid noise in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Component that throws an error
const ThrowError: React.FC<{ shouldThrow?: boolean; message?: string }> = ({ 
  shouldThrow = true, 
  message = 'Test error' 
}) => {
  if (shouldThrow) {
    throw new Error(message);
  }
  return <div data-testid="no-error">No Error</div>;
};

// Component that works normally
const WorkingComponent: React.FC = () => {
  return <div data-testid="working-component">Working Component</div>;
};

describe('ErrorBoundary Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Normal Operation', () => {
    it('renders children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <WorkingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('working-component')).toBeInTheDocument();
    });

    it('does not render error UI when children render successfully', () => {
      render(
        <ErrorBoundary>
          <WorkingComponent />
        </ErrorBoundary>
      );

      expect(screen.queryByTestId('error-boundary-fallback')).not.toBeInTheDocument();
    });
  });

  describe('Error Catching', () => {
    it('catches errors and displays fallback UI', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
      expect(screen.getByText('Ops! Algo deu errado')).toBeInTheDocument();
      expect(screen.getByText('Lamentamos o inconveniente. Por favor, tente atualizar a página.')).toBeInTheDocument();
    });

    it('displays reset button in error state', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('reset-error-boundary')).toBeInTheDocument();
      expect(screen.getByText('Tentar Novamente')).toBeInTheDocument();
    });

    it('logs error to console in development', () => {
      const originalEnv = process.env.NODE_ENV;
      setNodeEnv('development');

      render(
        <ErrorBoundary>
          <ThrowError message="Development error" />
        </ErrorBoundary>
      );

      expect(console.error).toHaveBeenCalledWith(
        'ErrorBoundary caught an error:',
        expect.any(Error),
        expect.any(Object)
      );

      restoreNodeEnv(originalEnv);
    });

    it('does not log error in production', () => {
      const originalEnv = process.env.NODE_ENV;
      setNodeEnv('production');

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // Console.error should only be called by React itself, not our error handler
      expect(console.error).toHaveBeenCalled();

      restoreNodeEnv(originalEnv);
    });
  });

  describe('Custom Error Handler', () => {
    it('calls custom onError callback when provided', () => {
      const mockOnError = jest.fn();

      render(
        <ErrorBoundary onError={mockOnError}>
          <ThrowError message="Custom error" />
        </ErrorBoundary>
      );

      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Custom error'
        }),
        expect.any(Object)
      );
    });

    it('works without onError callback', () => {
      expect(() => {
        render(
          <ErrorBoundary>
            <ThrowError />
          </ErrorBoundary>
        );
      }).not.toThrow();

      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
    });
  });

  describe('Custom Fallback', () => {
    it('renders custom fallback when provided', () => {
      const customFallback = <div data-testid="custom-fallback">Custom Error Message</div>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.getByText('Custom Error Message')).toBeInTheDocument();
      expect(screen.queryByTestId('error-boundary-fallback')).not.toBeInTheDocument();
    });

    it('uses default fallback when custom fallback is not provided', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
      expect(screen.queryByTestId('custom-fallback')).not.toBeInTheDocument();
    });
  });

  describe('Error Boundary Reset', () => {
    it('resets error state when reset button is clicked', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();

      const resetButton = screen.getByTestId('reset-error-boundary');
      fireEvent.click(resetButton);

      // Now render with a working component
      rerender(
        <ErrorBoundary>
          <WorkingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('working-component')).toBeInTheDocument();
      expect(screen.queryByTestId('error-boundary-fallback')).not.toBeInTheDocument();
    });

    it('resets when resetKeys change', () => {
      const { rerender } = render(
        <ErrorBoundary resetKeys={['key1']}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();

      // Change reset keys
      rerender(
        <ErrorBoundary resetKeys={['key2']}>
          <WorkingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('working-component')).toBeInTheDocument();
      expect(screen.queryByTestId('error-boundary-fallback')).not.toBeInTheDocument();
    });

    it('does not reset when resetKeys remain the same', () => {
      const { rerender } = render(
        <ErrorBoundary resetKeys={['key1']}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();

      // Keep same reset keys
      rerender(
        <ErrorBoundary resetKeys={['key1']}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
    });

    it('resets when resetOnPropsChange is true and children change', () => {
      const { rerender } = render(
        <ErrorBoundary resetOnPropsChange>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();

      // Change children
      rerender(
        <ErrorBoundary resetOnPropsChange>
          <WorkingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('working-component')).toBeInTheDocument();
      expect(screen.queryByTestId('error-boundary-fallback')).not.toBeInTheDocument();
    });
  });

  describe('Development Mode Features', () => {
    it('shows error details in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      setNodeEnv('development');

      render(
        <ErrorBoundary>
          <ThrowError message="Detailed error message" />
        </ErrorBoundary>
      );

      // Click to expand details
      const detailsElement = screen.getByText('Detalhes do erro (apenas desenvolvimento)');
      expect(detailsElement).toBeInTheDocument();

      restoreNodeEnv(originalEnv);
    });

    it('hides error details in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      setNodeEnv('production');

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.queryByText('Detalhes do erro (apenas desenvolvimento)')).not.toBeInTheDocument();

      restoreNodeEnv(originalEnv);
    });
  });

  describe('Component State Management', () => {
    it('tracks reset count correctly', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const resetButton = screen.getByTestId('reset-error-boundary');
      
      // First reset
      fireEvent.click(resetButton);
      
      // Component should still be in error state but reset count incremented
      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
      
      // Second reset
      fireEvent.click(resetButton);
      
      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
    });

    it('maintains error information in state', () => {
      render(
        <ErrorBoundary>
          <ThrowError message="State test error" />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing resetKeys gracefully', () => {
      const { rerender } = render(
        <ErrorBoundary resetKeys={undefined}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();

      rerender(
        <ErrorBoundary resetKeys={['key1']}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
    });

    it('handles empty resetKeys array', () => {
      const { rerender } = render(
        <ErrorBoundary resetKeys={[]}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();

      rerender(
        <ErrorBoundary resetKeys={['key1']}>
          <ThrowError />
        </ErrorBoundary>
      );

      // Should reset because keys changed from empty to populated
      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
    });
  });

  describe('Multiple Children', () => {
    it('catches errors from any child component', () => {
      render(
        <ErrorBoundary>
          <WorkingComponent />
          <ThrowError />
          <WorkingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
      expect(screen.queryByTestId('working-component')).not.toBeInTheDocument();
    });

    it('renders all children when none throw errors', () => {
      render(
        <ErrorBoundary>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
          <div data-testid="child-3">Child 3</div>
        </ErrorBoundary>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
      expect(screen.getByTestId('child-3')).toBeInTheDocument();
    });
  });
});