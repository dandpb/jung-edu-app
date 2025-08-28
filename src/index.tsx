import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// MUST RUN FIRST - Suppress ResizeObserver errors before React mounts
(() => {
  const resizeObserverErr = window.ResizeObserver;
  window.ResizeObserver = class ResizeObserver extends resizeObserverErr {
    constructor(callback: ResizeObserverCallback) {
      super((entries, observer) => {
        window.requestAnimationFrame(() => {
          callback(entries, observer);
        });
      });
    }
  };
  
  // Suppress the specific error message from appearing
  const debounce = (callback: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout | null = null;
    return (...args: any[]) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        callback(...args);
      }, delay);
    };
  };
})();

// ===================================================================
// SOLUÇÃO COMPLETA PARA SUPRIMIR ERROS DO RESIZEOBSERVER
// ===================================================================

// 1. Interceptar console.error para filtrar mensagens do ResizeObserver
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Override console methods before React loads
Object.defineProperty(console, 'error', {
  configurable: true,
  enumerable: true,
  writable: true,
  value: (...args: any[]) => {
    const errorString = args.join(' ');
    if (errorString.includes('ResizeObserver loop completed') ||
        errorString.includes('ResizeObserver loop limit exceeded') ||
        errorString.includes('undelivered notifications') ||
        errorString.includes('ResizeObserver loop')) {
      // Silenciosamente ignorar erros do ResizeObserver
      return;
    }
    originalConsoleError.apply(console, args);
  }
});

Object.defineProperty(console, 'warn', {
  configurable: true,
  enumerable: true,
  writable: true,
  value: (...args: any[]) => {
    const warnString = args.join(' ');
    if (warnString.includes('ResizeObserver') ||
        warnString.includes('undelivered notifications')) {
      return;
    }
    originalConsoleWarn.apply(console, args);
  }
});

// 2. Interceptar window.onerror para erros globais
const originalWindowError = window.onerror;
window.onerror = function (message, source, lineno, colno, error) {
  if (message && typeof message === 'string' && 
      (message.includes('ResizeObserver loop completed') ||
       message.includes('ResizeObserver loop limit exceeded') ||
       message.includes('undelivered notifications'))) {
    return true; // Prevenir propagação
  }
  if (originalWindowError) {
    return originalWindowError(message, source, lineno, colno, error);
  }
  return false;
};

// 3. Capturar erros não tratados de Promises
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason) {
    const errorMessage = event.reason.message || event.reason.toString();
    if (errorMessage && 
        (errorMessage.includes('ResizeObserver loop') ||
         errorMessage.includes('undelivered notifications'))) {
      event.preventDefault();
      event.stopPropagation();
    }
  }
});

// 4. Captura com alta prioridade no capture phase
window.addEventListener('error', (event) => {
  if (event.message && 
      (event.message.includes('ResizeObserver loop') ||
       event.message.includes('undelivered notifications'))) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    return true;
  }
}, true); // true = capture phase

// 5. Patch do ResizeObserver para adicionar debouncing e error handling
if (typeof window !== 'undefined' && window.ResizeObserver) {
  const OriginalResizeObserver = window.ResizeObserver;
  
  // Criar versão com debounce e error suppression
  class SafeResizeObserver {
    private observer: ResizeObserver;
    private rafId: number | null = null;
    
    constructor(callback: ResizeObserverCallback) {
      const safeCallback = (entries: ResizeObserverEntry[], observer: ResizeObserver) => {
        // Cancel any pending animation frame
        if (this.rafId !== null) {
          window.cancelAnimationFrame(this.rafId);
        }
        
        // Use requestAnimationFrame to debounce and avoid loop errors
        this.rafId = window.requestAnimationFrame(() => {
          try {
            callback(entries, observer);
          } catch (e: any) {
            // Silently ignore ResizeObserver errors
            if (e?.message && !e.message.includes('ResizeObserver')) {
              console.warn('Non-ResizeObserver error:', e);
            }
          }
        });
      };
      
      // Create the actual ResizeObserver with error handling
      try {
        this.observer = new OriginalResizeObserver(safeCallback);
      } catch (e) {
        // Fallback if construction fails
        this.observer = new OriginalResizeObserver(() => {});
      }
    }
    
    observe(target: Element, options?: ResizeObserverOptions) {
      try {
        this.observer.observe(target, options);
      } catch (e) {
        // Silently ignore observation errors
      }
    }
    
    unobserve(target: Element) {
      try {
        this.observer.unobserve(target);
      } catch (e) {
        // Silently ignore unobservation errors
      }
    }
    
    disconnect() {
      try {
        if (this.rafId !== null) {
          window.cancelAnimationFrame(this.rafId);
          this.rafId = null;
        }
        this.observer.disconnect();
      } catch (e) {
        // Silently ignore disconnection errors
      }
    }
  }
  
  // Replace the global ResizeObserver
  (window as any).ResizeObserver = SafeResizeObserver;
}

// 6. Enhanced React Error Boundary handling
if (typeof window !== 'undefined') {
  // Global error handler for uncaught errors
  const handleGlobalError = (event: ErrorEvent) => {
    const error = event.error;
    const message = event.message || (error && error.message) || '';
    
    if (message.includes('ResizeObserver loop completed') ||
        message.includes('ResizeObserver loop limit exceeded') ||
        message.includes('undelivered notifications')) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      return true;
    }
    return false;
  };

  // Add the global error handler
  window.addEventListener('error', handleGlobalError, { capture: true, passive: false });
  
  // Enhanced console.error override that handles React's error reporting
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const errorString = args.join(' ');
    const firstArg = args[0];
    
    // Check for ResizeObserver errors in various formats
    if ((typeof firstArg === 'string' && 
         (firstArg.includes('ResizeObserver loop completed') ||
          firstArg.includes('ResizeObserver loop limit exceeded') ||
          firstArg.includes('undelivered notifications'))) ||
        (errorString.includes('ResizeObserver loop completed') ||
         errorString.includes('ResizeObserver loop limit exceeded') ||
         errorString.includes('undelivered notifications'))) {
      return;
    }
    
    // Call original console.error for all other errors
    originalError.apply(console, args);
  };
}

// Create error boundary to catch ResizeObserver errors
class ResizeObserverErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    // Check if it's a ResizeObserver error
    if (error?.message?.includes('ResizeObserver')) {
      // Don't update state for ResizeObserver errors
      return null;
    }
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Ignore ResizeObserver errors
    if (error?.message?.includes('ResizeObserver') ||
        error?.message?.includes('undelivered notifications')) {
      return;
    }
    // Log other errors
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong.</div>;
    }
    return this.props.children;
  }
}

// Also intercept React's internal error handling
if (typeof window !== 'undefined' && (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
  const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
  const originalOnCommitFiberRoot = hook.onCommitFiberRoot;
  const originalOnCommitFiberUnmount = hook.onCommitFiberUnmount;
  
  hook.onCommitFiberRoot = function(...args: any[]) {
    try {
      return originalOnCommitFiberRoot?.apply(this, args);
    } catch (e: any) {
      if (!e?.message?.includes('ResizeObserver')) {
        throw e;
      }
    }
  };
  
  hook.onCommitFiberUnmount = function(...args: any[]) {
    try {
      return originalOnCommitFiberUnmount?.apply(this, args);
    } catch (e: any) {
      if (!e?.message?.includes('ResizeObserver')) {
        throw e;
      }
    }
  };
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <ResizeObserverErrorBoundary>
      <App />
    </ResizeObserverErrorBoundary>
  </React.StrictMode>
);

reportWebVitals();