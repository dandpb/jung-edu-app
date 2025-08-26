import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// ===================================================================
// SOLUÇÃO COMPLETA PARA SUPRIMIR ERROS DO RESIZEOBSERVER
// ===================================================================

// 1. Interceptar console.error para filtrar mensagens do ResizeObserver
const originalConsoleError = console.error;
try {
  console.error = (...args: any[]) => {
    const errorString = args.join(' ');
    if (errorString.includes('ResizeObserver loop completed') ||
        errorString.includes('ResizeObserver loop limit exceeded') ||
        errorString.includes('undelivered notifications')) {
      // Silenciosamente ignorar erros do ResizeObserver
      return;
    }
    originalConsoleError.apply(console, args);
  };
} catch (e) {
  // In test environment, console.error might be readonly
  // Continue without console filtering
}

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

// 5. Patch do ResizeObserver para adicionar debouncing
if (typeof window !== 'undefined' && window.ResizeObserver) {
  const OriginalResizeObserver = window.ResizeObserver;
  
  // Criar versão com debounce
  class DebouncedResizeObserver extends OriginalResizeObserver {
    constructor(callback: ResizeObserverCallback) {
      // Wrapper que usa requestAnimationFrame para debounce
      const debouncedCallback = (entries: ResizeObserverEntry[], observer: ResizeObserver) => {
        // Usar requestAnimationFrame para evitar loops
        window.requestAnimationFrame(() => {
          try {
            callback(entries, observer);
          } catch (e: any) {
            // Silenciosamente ignorar erros do ResizeObserver
            if (!e?.message?.includes('ResizeObserver')) {
              throw e;
            }
          }
        });
      };
      
      super(debouncedCallback);
    }
  }
  
  // Substituir o ResizeObserver global
  (window as any).ResizeObserver = DebouncedResizeObserver;
}

// 6. Adicionar um fallback para React ErrorBoundary
if (typeof window !== 'undefined') {
  // Interceptar React's error handling
  const originalError = console.error.bind(console);
  const reactErrorPattern = /^Error: ResizeObserver/;
  
  // Override específico para React
  Object.defineProperty(console, 'error', {
    value: (...args: any[]) => {
      const firstArg = args[0];
      if (typeof firstArg === 'string' && 
          (firstArg.includes('ResizeObserver') || 
           reactErrorPattern.test(firstArg))) {
        return;
      }
      originalError(...args);
    },
    writable: false,
    configurable: true
  });
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();