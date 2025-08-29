/**
 * Integration tests for context provider interactions
 * Tests how different context providers work together and interact
 */

import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../AuthContext';
import { I18nProvider, useI18n } from '../I18nContext';
import { LanguageProvider, useLanguage } from '../LanguageContext';
import { AdminProvider, useAdmin } from '../AdminContext';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock dependencies
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}));

jest.mock('../../services/auth/authService', () => ({
  authService: {
    login: jest.fn(),
    logout: jest.fn(),
    getCurrentUser: jest.fn(),
    refreshAccessToken: jest.fn(),
    register: jest.fn(),
    requestPasswordReset: jest.fn(),
    resetPassword: jest.fn(),
    changePassword: jest.fn(),
    verifyEmail: jest.fn(),
  }
}));

jest.mock('../../services/auth/jwt', () => ({
  getStoredTokens: jest.fn(() => ({ accessToken: null, refreshToken: null })),
  isTokenExpired: jest.fn(() => false),
}));

jest.mock('../../config/i18n', () => ({
  setupI18n: jest.fn().mockResolvedValue(undefined),
  switchLanguage: jest.fn().mockResolvedValue(undefined),
  getI18nInstance: jest.fn(() => ({
    language: 'en',
    languages: ['en', 'pt-BR'],
    changeLanguage: jest.fn(),
    loadNamespaces: jest.fn(),
    exists: jest.fn(() => true),
    getResourceBundle: jest.fn(() => ({})),
    isInitialized: true,
  })),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: jest.fn((key: string) => key),
    i18n: {
      language: 'en',
      changeLanguage: jest.fn(),
      isInitialized: true,
    },
    ready: true,
  })
}));

// Test component that uses multiple contexts
const IntegratedTestComponent = () => {
  const auth = useAuth();
  const i18n = useI18n();
  const language = useLanguage();
  const admin = useAdmin();

  return (
    <div>
      <div data-testid="auth-status">{auth.isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
      <div data-testid="current-language">{i18n.language}</div>
      <div data-testid="language-context-lang">{language.currentLanguage}</div>
      <div data-testid="admin-status">{admin.isAdmin ? 'admin' : 'not-admin'}</div>
      <div data-testid="modules-count">{admin.modules.length}</div>
      
      <button 
        data-testid="change-language"
        onClick={() => {
          i18n.changeLanguage('pt-BR');
          language.setLanguage('pt-BR');
        }}
      >
        Change Language
      </button>
      
      <button 
        data-testid="admin-login"
        onClick={() => admin.login('admin', 'jungadmin123')}
      >
        Admin Login
      </button>
      
      <button 
        data-testid="auth-login"
        onClick={() => auth.login({ email: 'test@example.com', password: 'password' })}
      >
        Auth Login
      </button>
    </div>
  );
};

// Provider wrapper that includes all contexts
const AllProvidersWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthProvider>
    <I18nProvider>
      <LanguageProvider>
        <AdminProvider>
          {children}
        </AdminProvider>
      </LanguageProvider>
    </I18nProvider>
  </AuthProvider>
);

describe('Context Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Provider Composition', () => {
    it('should render all providers without conflicts', () => {
      render(
        <AllProvidersWrapper>
          <IntegratedTestComponent />
        </AllProvidersWrapper>
      );

      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      expect(screen.getByTestId('language-context-lang')).toHaveTextContent('en');
      expect(screen.getByTestId('admin-status')).toHaveTextContent('not-admin');
      expect(screen.getByTestId('modules-count')).toHaveTextContent('2');
    });

    it('should handle nested provider initialization order', () => {
      // Test that providers initialize in the correct order without dependency conflicts
      const initOrder: string[] = [];

      const OrderTestComponent = () => {
        const auth = useAuth();
        const i18n = useI18n();
        const language = useLanguage();
        const admin = useAdmin();

        React.useEffect(() => {
          initOrder.push('auth');
        }, [auth]);

        React.useEffect(() => {
          initOrder.push('i18n');
        }, [i18n]);

        React.useEffect(() => {
          initOrder.push('language');
        }, [language]);

        React.useEffect(() => {
          initOrder.push('admin');
        }, [admin]);

        return <div data-testid="order-test">Order Test</div>;
      };

      render(
        <AllProvidersWrapper>
          <OrderTestComponent />
        </AllProvidersWrapper>
      );

      expect(screen.getByTestId('order-test')).toBeInTheDocument();
      expect(initOrder.length).toBe(4);
      expect(initOrder).toContain('auth');
      expect(initOrder).toContain('i18n');
      expect(initOrder).toContain('language');
      expect(initOrder).toContain('admin');
    });

    it('should maintain separate state across contexts', async () => {
      const user = userEvent.setup();

      render(
        <AllProvidersWrapper>
          <IntegratedTestComponent />
        </AllProvidersWrapper>
      );

      // Each context should maintain its own state
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
      expect(screen.getByTestId('admin-status')).toHaveTextContent('not-admin');

      // Admin login should not affect auth status
      const adminLoginButton = screen.getByTestId('admin-login');
      await user.click(adminLoginButton);

      expect(screen.getByTestId('admin-status')).toHaveTextContent('admin');
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    });
  });

  describe('Language Context Integration', () => {
    it('should synchronize language changes between I18n and Language contexts', async () => {
      const user = userEvent.setup();

      render(
        <AllProvidersWrapper>
          <IntegratedTestComponent />
        </AllProvidersWrapper>
      );

      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      expect(screen.getByTestId('language-context-lang')).toHaveTextContent('en');

      const changeLanguageButton = screen.getByTestId('change-language');
      await user.click(changeLanguageButton);

      // Both contexts should be updated
      await waitFor(() => {
        expect(screen.getByTestId('language-context-lang')).toHaveTextContent('pt-BR');
      });
    });

    it('should persist language preferences across context remounts', () => {
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'jung-edu-language') return 'pt-BR';
        return null;
      });

      const { unmount } = render(
        <AllProvidersWrapper>
          <IntegratedTestComponent />
        </AllProvidersWrapper>
      );

      expect(screen.getByTestId('language-context-lang')).toHaveTextContent('pt-BR');

      unmount();

      render(
        <AllProvidersWrapper>
          <IntegratedTestComponent />
        </AllProvidersWrapper>
      );

      expect(screen.getByTestId('language-context-lang')).toHaveTextContent('pt-BR');
    });

    it('should handle language validation across contexts', async () => {
      const user = userEvent.setup();

      const InvalidLanguageComponent = () => {
        const language = useLanguage();
        return (
          <div>
            <div data-testid="current-lang">{language.currentLanguage}</div>
            <button 
              data-testid="invalid-lang"
              onClick={() => language.setLanguage('invalid-lang')}
            >
              Invalid Language
            </button>
          </div>
        );
      };

      render(
        <AllProvidersWrapper>
          <InvalidLanguageComponent />
        </AllProvidersWrapper>
      );

      expect(screen.getByTestId('current-lang')).toHaveTextContent('en');

      const invalidButton = screen.getByTestId('invalid-lang');
      await user.click(invalidButton);

      // Should not change to invalid language
      expect(screen.getByTestId('current-lang')).toHaveTextContent('en');
    });
  });

  describe('Authentication and Admin Context Interaction', () => {
    it('should handle independent authentication systems', async () => {
      const user = userEvent.setup();

      // Mock successful auth service login
      const { authService } = require('../../services/auth/authService');
      authService.login.mockResolvedValue({
        user: {
          id: 'user-1',
          email: 'test@example.com',
          role: 'STUDENT'
        }
      });

      render(
        <AllProvidersWrapper>
          <IntegratedTestComponent />
        </AllProvidersWrapper>
      );

      // Initially both should be false
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
      expect(screen.getByTestId('admin-status')).toHaveTextContent('not-admin');

      // Admin login
      const adminLoginButton = screen.getByTestId('admin-login');
      await user.click(adminLoginButton);
      expect(screen.getByTestId('admin-status')).toHaveTextContent('admin');
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');

      // Auth login
      const authLoginButton = screen.getByTestId('auth-login');
      await user.click(authLoginButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });
      expect(screen.getByTestId('admin-status')).toHaveTextContent('admin');
    });

    it('should handle session persistence independently', () => {
      // Mock admin session
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'admin_session_token') return 'admin_token';
        return null;
      });

      // Mock valid admin session
      jest.mock('../../utils/auth', () => ({
        validateSessionToken: jest.fn(() => ({ userId: 'admin-1', exp: Date.now() + 100000 })),
      }));

      render(
        <AllProvidersWrapper>
          <IntegratedTestComponent />
        </AllProvidersWrapper>
      );

      // Admin should be logged in, auth should not
      expect(screen.getByTestId('admin-status')).toHaveTextContent('admin');
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle context provider errors gracefully', () => {
      const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
        const [hasError, setHasError] = React.useState(false);

        React.useEffect(() => {
          const errorHandler = (event: ErrorEvent) => {
            setHasError(true);
          };

          window.addEventListener('error', errorHandler);
          return () => window.removeEventListener('error', errorHandler);
        }, []);

        if (hasError) {
          return <div data-testid="error-boundary">Error occurred</div>;
        }

        return <>{children}</>;
      };

      // Mock i18n setup to fail
      const { setupI18n } = require('../../config/i18n');
      setupI18n.mockRejectedValueOnce(new Error('I18n setup failed'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <AllProvidersWrapper>
            <IntegratedTestComponent />
          </AllProvidersWrapper>
        </ErrorBoundary>
      );

      // Should still render despite i18n error
      expect(screen.getByTestId('auth-status')).toBeInTheDocument();
      expect(screen.getByTestId('admin-status')).toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });

    it('should handle localStorage access errors across contexts', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage access denied');
      });

      render(
        <AllProvidersWrapper>
          <IntegratedTestComponent />
        </AllProvidersWrapper>
      );

      // Should render with default values despite localStorage errors
      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      expect(screen.getByTestId('language-context-lang')).toHaveTextContent('en');
      expect(screen.getByTestId('modules-count')).toHaveTextContent('2');

      consoleErrorSpy.mockRestore();
    });

    it('should handle simultaneous context operations', async () => {
      const user = userEvent.setup();

      render(
        <AllProvidersWrapper>
          <IntegratedTestComponent />
        </AllProvidersWrapper>
      );

      // Perform multiple operations simultaneously
      const changeLanguageButton = screen.getByTestId('change-language');
      const adminLoginButton = screen.getByTestId('admin-login');

      await Promise.all([
        user.click(changeLanguageButton),
        user.click(adminLoginButton),
      ]);

      // Both operations should complete successfully
      expect(screen.getByTestId('admin-status')).toHaveTextContent('admin');
      await waitFor(() => {
        expect(screen.getByTestId('language-context-lang')).toHaveTextContent('pt-BR');
      });
    });
  });

  describe('Performance and Memory Management', () => {
    it('should not cause excessive re-renders', () => {
      let renderCount = 0;

      const RenderCountComponent = () => {
        const auth = useAuth();
        const i18n = useI18n();
        const language = useLanguage();
        const admin = useAdmin();

        renderCount++;

        return (
          <div>
            <div data-testid="render-count">{renderCount}</div>
            <div data-testid="contexts-ready">
              {auth && i18n && language && admin ? 'ready' : 'loading'}
            </div>
          </div>
        );
      };

      const { rerender } = render(
        <AllProvidersWrapper>
          <RenderCountComponent />
        </AllProvidersWrapper>
      );

      const initialRenderCount = Number(screen.getByTestId('render-count').textContent);
      expect(initialRenderCount).toBeGreaterThan(0);

      // Rerender should not cause excessive additional renders
      rerender(
        <AllProvidersWrapper>
          <RenderCountComponent />
        </AllProvidersWrapper>
      );

      const finalRenderCount = Number(screen.getByTestId('render-count').textContent);
      expect(finalRenderCount - initialRenderCount).toBeLessThanOrEqual(2);
    });

    it('should clean up all contexts on unmount', () => {
      const { unmount } = render(
        <AllProvidersWrapper>
          <IntegratedTestComponent />
        </AllProvidersWrapper>
      );

      // Should not throw during cleanup
      expect(() => unmount()).not.toThrow();
    });

    it('should handle rapid context switches', async () => {
      const user = userEvent.setup();

      const RapidSwitchComponent = () => {
        const language = useLanguage();
        const admin = useAdmin();

        return (
          <div>
            <div data-testid="current-lang">{language.currentLanguage}</div>
            <div data-testid="admin-status">{admin.isAdmin ? 'admin' : 'not-admin'}</div>
            <button 
              data-testid="rapid-switch"
              onClick={() => {
                // Rapid state changes
                for (let i = 0; i < 10; i++) {
                  language.setLanguage(i % 2 === 0 ? 'en' : 'pt-BR');
                  if (i % 3 === 0) {
                    admin.login('admin', 'jungadmin123');
                  } else if (i % 5 === 0) {
                    admin.logout();
                  }
                }
              }}
            >
              Rapid Switch
            </button>
          </div>
        );
      };

      render(
        <AllProvidersWrapper>
          <RapidSwitchComponent />
        </AllProvidersWrapper>
      );

      const rapidButton = screen.getByTestId('rapid-switch');
      await user.click(rapidButton);

      // Should handle rapid changes without crashing
      expect(screen.getByTestId('current-lang')).toBeInTheDocument();
      expect(screen.getByTestId('admin-status')).toBeInTheDocument();
    });
  });

  describe('Complex Integration Scenarios', () => {
    it('should handle user role-based admin access', async () => {
      const user = userEvent.setup();

      // Mock auth service to return admin user
      const { authService } = require('../../services/auth/authService');
      authService.login.mockResolvedValue({
        user: {
          id: 'admin-user',
          email: 'admin@example.com',
          role: 'ADMIN'
        }
      });

      const RoleBasedComponent = () => {
        const auth = useAuth();
        const admin = useAdmin();

        return (
          <div>
            <div data-testid="user-role">{auth.user?.role || 'none'}</div>
            <div data-testid="admin-access">{admin.isAdmin ? 'granted' : 'denied'}</div>
            <button 
              data-testid="auth-admin-login"
              onClick={() => auth.login({ email: 'admin@example.com', password: 'password' })}
            >
              Login as Admin
            </button>
          </div>
        );
      };

      render(
        <AllProvidersWrapper>
          <RoleBasedComponent />
        </AllProvidersWrapper>
      );

      const loginButton = screen.getByTestId('auth-admin-login');
      await user.click(loginButton);

      await waitFor(() => {
        expect(screen.getByTestId('user-role')).toHaveTextContent('ADMIN');
      });

      // Admin access should remain separate
      expect(screen.getByTestId('admin-access')).toHaveTextContent('denied');
    });

    it('should handle multilingual admin interface', async () => {
      const user = userEvent.setup();

      const MultilingualAdminComponent = () => {
        const i18n = useI18n();
        const language = useLanguage();
        const admin = useAdmin();

        return (
          <div>
            <div data-testid="i18n-lang">{i18n.language}</div>
            <div data-testid="lang-context">{language.currentLanguage}</div>
            <div data-testid="admin-modules">{admin.modules.length}</div>
            <button 
              data-testid="multilingual-operation"
              onClick={async () => {
                await i18n.changeLanguage('pt-BR');
                language.setLanguage('pt-BR');
                admin.login('admin', 'jungadmin123');
                admin.updateModules([
                  {
                    id: 'pt-module',
                    title: 'Módulo em Português',
                    description: 'Descrição em português',
                    difficulty: 'beginner' as const,
                    icon: '🇧🇷',
                    estimatedTime: 30,
                    topics: ['Português'],
                    content: 'Conteúdo em português',
                    quiz: { questions: [], passingScore: 70 }
                  }
                ]);
              }}
            >
              Multilingual Operation
            </button>
          </div>
        );
      };

      render(
        <AllProvidersWrapper>
          <MultilingualAdminComponent />
        </AllProvidersWrapper>
      );

      const operationButton = screen.getByTestId('multilingual-operation');
      await user.click(operationButton);

      await waitFor(() => {
        expect(screen.getByTestId('lang-context')).toHaveTextContent('pt-BR');
        expect(screen.getByTestId('admin-modules')).toHaveTextContent('1');
      });
    });
  });
});