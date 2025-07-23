import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  resetCount: number;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      resetCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError } = this.props;
    
    this.setState({
      errorInfo,
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetKeys?.some((key, index) => key !== prevProps.resetKeys?.[index])) {
        this.resetErrorBoundary();
      }
    }

    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetErrorBoundary();
    }
  }

  resetErrorBoundary = () => {
    this.setState((prevState) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      resetCount: prevState.resetCount + 1,
    }));
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      if (fallback) {
        return <>{fallback}</>;
      }

      return (
        <div 
          className="min-h-screen flex items-center justify-center p-4"
          data-testid="error-boundary-fallback"
        >
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
              Oops! Something went wrong
            </h2>
            
            <p className="text-gray-600 text-center mb-4">
              We're sorry for the inconvenience. Please try refreshing the page.
            </p>

            {process.env.NODE_ENV === 'development' && (
              <details className="mb-4">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Error details (development only)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {error.toString()}
                  {errorInfo && errorInfo.componentStack}
                </pre>
              </details>
            )}

            <button
              onClick={this.resetErrorBoundary}
              className="w-full bg-primary-600 text-white rounded-md px-4 py-2 hover:bg-primary-700 transition-colors"
              data-testid="reset-error-boundary"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;