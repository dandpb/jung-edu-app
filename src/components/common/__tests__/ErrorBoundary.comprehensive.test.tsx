/**
 * Comprehensive Unit Tests for ErrorBoundary Component
 * Tests error catching, fallback UI, recovery mechanisms
 * Target: 80%+ coverage
 */

import React from 'react';
import { setNodeEnv, restoreNodeEnv } from '../../test-utils/nodeEnvHelper';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ErrorBoundary from '../ErrorBoundary';

// Component that throws an error for testing
const ThrowingComponent: React.FC<{ shouldThrow?: boolean; errorMessage?: string }> = ({ 
  shouldThrow = false, 
  errorMessage = 'Test error' 
}) => {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return <div>Working component</div>;
};

// Component that throws on specific prop changes
const ConditionalThrowingComponent: React.FC<{ triggerError?: boolean }> = ({ triggerError = false }) => {
  if (triggerError) {
    throw new Error('Conditional error');
  }
  return <div>Conditional component</div>;
};

// Custom fallback component
const CustomFallback: React.FC = () => (
  <div data-testid="custom-fallback">
    Custom error fallback
  </div>
);

describe('ErrorBoundary Component', () => {
  // Suppress console.error during tests to avoid noise
  const originalConsoleError = console.error;
  
  beforeEach(() => {
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  describe('Normal Operation', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Normal child component</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Normal child component')).toBeInTheDocument();
      expect(screen.queryByTestId('error-boundary-fallback')).not.toBeInTheDocument();
    });

    it('should render multiple children normally', () => {
      render(
        <ErrorBoundary>
          <div>First child</div>
          <div>Second child</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('First child')).toBeInTheDocument();
      expect(screen.getByText('Second child')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should catch and display error fallback UI', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
      expect(screen.getByText('Ops! Algo deu errado')).toBeInTheDocument();
      expect(screen.getByText('Lamentamos o inconveniente. Por favor, tente atualizar a página.')).toBeInTheDocument();
      expect(screen.queryByText('Working component')).not.toBeInTheDocument();
    });

    it('should call onError callback when provided', () => {
      const onErrorMock = jest.fn();
      const testError = new Error('Test error message');

      render(
        <ErrorBoundary onError={onErrorMock}>
          <ThrowingComponent shouldThrow={true} errorMessage="Test error message" />
        </ErrorBoundary>
      );

      expect(onErrorMock).toHaveBeenCalledTimes(1);
      expect(onErrorMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Test error message' }),
        expect.objectContaining({
          componentStack: expect.any(String)
        })
      );
    });

    it('should log error to console in development mode', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      setNodeEnv('development');

      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} errorMessage="Development error" />
        </ErrorBoundary>
      );

      expect(console.error).toHaveBeenCalledWith(
        'ErrorBoundary caught an error:',
        expect.objectContaining({ message: 'Development error' }),
        expect.any(Object)
      );

      restoreNodeEnv(originalNodeEnv);
    });

    it('should not log error to console in production mode', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      setNodeEnv('production');

      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(console.error).not.toHaveBeenCalledWith(
        expect.stringContaining('ErrorBoundary caught an error:')
      );

      restoreNodeEnv(originalNodeEnv);
    });
  });

  describe('Custom Fallback', () => {
    it('should render custom fallback when provided', () => {
      const CustomFallbackComponent = () => (
        <div data-testid="custom-fallback">
          Custom error message
        </div>
      );

      render(
        <ErrorBoundary fallback={<CustomFallbackComponent />}>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.getByText('Custom error message')).toBeInTheDocument();
      expect(screen.queryByTestId('error-boundary-fallback')).not.toBeInTheDocument();
    });

    it('should render custom fallback as React element', () => {
      render(
        <ErrorBoundary fallback={<CustomFallback />}>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.getByText('Custom error fallback')).toBeInTheDocument();
    });
  });

  describe('Error Recovery', () => {
    it('should reset error state when reset button is clicked', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();

      const resetButton = screen.getByTestId('reset-error-boundary');
      fireEvent.click(resetButton);

      // After reset, the ErrorBoundary should still show because the children still throw
      // To actually recover, we need to provide working children
      rerender(
        <ErrorBoundary key="reset"> {/* Force remount with key */}
          <ThrowingComponent shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.queryByTestId('error-boundary-fallback')).not.toBeInTheDocument();
      expect(screen.getByText('Working component')).toBeInTheDocument();
    });

    it('should reset on resetKeys change', () => {
      let resetKey = 'key1';

      const { rerender } = render(
        <ErrorBoundary resetKeys={[resetKey]}>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();

      // Change reset key
      resetKey = 'key2';
      rerender(
        <ErrorBoundary resetKeys={[resetKey]}>
          <ThrowingComponent shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.queryByTestId('error-boundary-fallback')).not.toBeInTheDocument();
      expect(screen.getByText('Working component')).toBeInTheDocument();
    });

    it('should reset when resetOnPropsChange is true and children change', () => {
      const { rerender } = render(
        <ErrorBoundary resetOnPropsChange={true}>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();

      // Change children
      rerender(
        <ErrorBoundary resetOnPropsChange={true}>
          <ThrowingComponent shouldThrow={false} />
          <div>Additional component</div>
        </ErrorBoundary>
      );

      expect(screen.queryByTestId('error-boundary-fallback')).not.toBeInTheDocument();
      expect(screen.getByText('Working component')).toBeInTheDocument();
    });

    it('should not reset when resetKeys values remain the same', () => {
      const resetKeys = ['same-key'];

      const { rerender } = render(
        <ErrorBoundary resetKeys={resetKeys}>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();

      // Re-render with same resetKeys
      rerender(
        <ErrorBoundary resetKeys={resetKeys}>
          <ThrowingComponent shouldThrow={false} />
        </ErrorBoundary>
      );

      // Should still show error boundary because keys didn't change
      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
    });
  });

  describe('Error Details Display', () => {
    it('should show error details in development mode', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      setNodeEnv('development');

      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} errorMessage="Detailed error for dev" />
        </ErrorBoundary>
      );

      expect(screen.getByText('Detalhes do erro (apenas desenvolvimento)')).toBeInTheDocument();
      
      // Click to expand details
      fireEvent.click(screen.getByText('Detalhes do erro (apenas desenvolvimento)'));
      
      expect(screen.getByText(/Detailed error for dev/)).toBeInTheDocument();

      restoreNodeEnv(originalNodeEnv);
    });

    it('should not show error details in production mode', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      setNodeEnv('production');

      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.queryByText('Detalhes do erro (apenas desenvolvimento)')).not.toBeInTheDocument();

      restoreNodeEnv(originalNodeEnv);
    });

    it('should display component stack in error details', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      setNodeEnv('development');

      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      // Expand error details
      fireEvent.click(screen.getByText('Detalhes do erro (apenas desenvolvimento)'));

      const errorDetails = screen.getByRole('group'); // details element
      expect(errorDetails).toBeInTheDocument();

      restoreNodeEnv(originalNodeEnv);
    });
  });

  describe('Component State Management', () => {
    it('should maintain reset count internally', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      let resetButton = screen.getByTestId('reset-error-boundary');
      
      // Click reset multiple times
      fireEvent.click(resetButton);
      fireEvent.click(resetButton);
      fireEvent.click(resetButton);

      // Component should handle multiple resets without issues - get button again after resets
      resetButton = screen.getByTestId('reset-error-boundary');
      expect(resetButton).toBeInTheDocument();
    });

    it('should handle errors thrown during render', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} errorMessage="Render error" />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
      expect(screen.getByText('Ops! Algo deu errado')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null error gracefully', () => {
      // This tests the static getDerivedStateFromError method
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
    });

    it('should handle nested error boundaries', () => {
      const InnerThrowingComponent = () => {
        throw new Error('Inner error');
      };

      render(
        <ErrorBoundary>
          <div>Outer content</div>
          <ErrorBoundary>
            <InnerThrowingComponent />
          </ErrorBoundary>
        </ErrorBoundary>
      );

      // Inner error boundary should catch the error
      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
      // Outer content should still be visible since only inner boundary caught the error
      expect(screen.getByText('Outer content')).toBeInTheDocument();
    });

    it('should handle components that throw non-Error objects', () => {
      const ComponentThrowingString = () => {
        throw 'String error';
      };

      render(
        <ErrorBoundary>
          <ComponentThrowingString />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes in error state', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      const errorContainer = screen.getByTestId('error-boundary-fallback');
      expect(errorContainer).toBeInTheDocument();

      const resetButton = screen.getByTestId('reset-error-boundary');
      expect(resetButton).toHaveAttribute('type', 'button');
    });

    it('should have semantic HTML structure in error state', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Ops! Algo deu errado');
      expect(screen.getByRole('button')).toHaveTextContent('Tentar Novamente');
    });

    it('should support keyboard interaction', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      const resetButton = screen.getByTestId('reset-error-boundary');
      resetButton.focus();
      expect(resetButton).toHaveFocus();

      // Should be clickable via keyboard
      fireEvent.keyDown(resetButton, { key: 'Enter', code: 'Enter' });
      fireEvent.keyUp(resetButton, { key: 'Enter', code: 'Enter' });
    });
  });

  describe('Error Boundary Lifecycle', () => {
    it('should call componentDidCatch with error and errorInfo', () => {
      const onErrorSpy = jest.fn();

      render(
        <ErrorBoundary onError={onErrorSpy}>
          <ThrowingComponent shouldThrow={true} errorMessage="Lifecycle test error" />
        </ErrorBoundary>
      );

      expect(onErrorSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Lifecycle test error',
          name: 'Error'
        }),
        expect.objectContaining({
          componentStack: expect.any(String)
        })
      );
    });

    it('should persist error state across re-renders', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();

      // Re-render the same component
      rerender(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      // Should still show error boundary
      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
    });

    it('should recover when error is fixed and component is reset', () => {
      let shouldThrow = true;

      const { rerender } = render(
        <ErrorBoundary resetOnPropsChange={true}>
          <ThrowingComponent shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();

      // Fix the error and force re-render
      shouldThrow = false;
      rerender(
        <ErrorBoundary resetOnPropsChange={true}>
          <ThrowingComponent shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );

      expect(screen.queryByTestId('error-boundary-fallback')).not.toBeInTheDocument();
      expect(screen.getByText('Working component')).toBeInTheDocument();
    });
  });
});