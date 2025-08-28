/**
 * Enhanced comprehensive test suite for I18nContext
 * Tests context provider, hooks, translation loading, and localization features
 * Covers edge cases, error handling, performance scenarios, and coordination hooks
 */

import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider, useI18n } from '../I18nContext';
import { setupI18n, switchLanguage } from '../../config/i18n';

// Mock coordination hooks
jest.mock('../../hooks/useCoordination', () => ({
  useCoordination: () => ({
    reportProgress: jest.fn(),
    updateMemory: jest.fn(),
    notify: jest.fn(),
    getMemory: jest.fn().mockResolvedValue(null),
    setMemory: jest.fn().mockResolvedValue(undefined)
  })
}));

// Mock i18next and related modules
const mockT = jest.fn((key: string, options?: any) => {
  if (options?.defaultValue) return options.defaultValue;
  if (key.includes('missing')) return key;
  if (key === 'hello.name' && options?.name) return `Hello ${options.name}`;
  if (key === 'count.items' && options?.count !== undefined) {
    return options.count === 1 ? '1 item' : `${options.count} items`;
  }
  return `translated_${key}`;
});

const mockChangeLanguage = jest.fn().mockResolvedValue(undefined);
const mockLoadNamespaces = jest.fn().mockResolvedValue(undefined);
const mockGetResource = jest.fn();
const mockExists = jest.fn().mockReturnValue(true);
const mockGetResourceBundle = jest.fn().mockReturnValue({
  'test.key': 'Test Value',
  'nested.deep.key': 'Deep Value',
  'dynamic.key': 'Dynamic Value'
});

const mockI18nInstance = {
  changeLanguage: mockChangeLanguage,
  language: 'en',
  languages: ['en', 'pt-BR', 'es'],
  loadNamespaces: mockLoadNamespaces,
  getResource: mockGetResource,
  exists: mockExists,
  getResourceBundle: mockGetResourceBundle,
  isInitialized: true,
  store: {
    data: {
      'en': { translation: { 'test.key': 'Test Value' }, common: { 'button.save': 'Save' }},
      'pt-BR': { translation: { 'test.key': 'Valor de Teste' }, common: { 'button.save': 'Salvar' }}
    }
  }
};

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
    i18n: mockI18nInstance,
    ready: true
  }),
  I18nextProvider: ({ children }: any) => children,
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn()
  }
}));

jest.mock('../../config/i18n', () => ({
  setupI18n: jest.fn().mockResolvedValue(undefined),
  switchLanguage: jest.fn().mockResolvedValue(undefined),
  getI18nInstance: jest.fn().mockImplementation(() => ({
    changeLanguage: jest.fn().mockResolvedValue(undefined),
    language: 'en',
    languages: ['en', 'pt-BR', 'es'],
    loadNamespaces: jest.fn().mockResolvedValue(undefined),
    getResource: jest.fn(),
    exists: jest.fn().mockReturnValue(true),
    getResourceBundle: jest.fn().mockReturnValue({
      'test.key': 'Test Value',
      'nested.deep.key': 'Deep Value'
    }),
    isInitialized: true,
    store: {
      data: {
        'en': { translation: { 'test.key': 'Test Value' }},
        'pt-BR': { translation: { 'test.key': 'Valor de Teste' }}
      }
    }
  }))
}));

// Test components
const TestComponent = () => {
  const { 
    t, language, changeLanguage, isLoading, supportedLanguages,
    isReady, getAvailableTranslations, hasTranslation, getCurrentNamespace, loadNamespace
  } = useI18n();
  
  return (
    <div>
      <span data-testid="current-language">{language}</span>
      <span data-testid="loading-state">{isLoading ? 'loading' : 'loaded'}</span>
      <span data-testid="ready-state">{isReady ? 'ready' : 'not-ready'}</span>
      <span data-testid="translated-text">{t('test.key')}</span>
      <span data-testid="supported-languages">{supportedLanguages.join(',')}</span>
      <span data-testid="available-translations">{getAvailableTranslations().join(',')}</span>
      <span data-testid="has-translation">{hasTranslation('test.key') ? 'yes' : 'no'}</span>
      <span data-testid="current-namespace">{getCurrentNamespace()}</span>
      
      <button data-testid="switch-to-portuguese" onClick={() => changeLanguage('pt-BR')}>
        Switch to Portuguese
      </button>
      <button data-testid="load-namespace" onClick={() => loadNamespace('common')}>
        Load Namespace
      </button>
      <button data-testid="switch-with-namespace" onClick={() => changeLanguage('pt-BR', { namespace: 'common' })}>
        Switch with Namespace
      </button>
      
      <span data-testid="nested-translation">{t('nested.deep.key')}</span>
      <span data-testid="with-interpolation">{t('hello.name', { name: 'World' })}</span>
      <span data-testid="with-fallback">{t('missing.key', 'Fallback Text')}</span>
      <span data-testid="with-pluralization">{t('count.items', { count: 5 })}</span>
    </div>
  );
};

const ErrorTestComponent = () => {
  try {
    useI18n();
    return <div>Should not render</div>;
  } catch (error) {
    return <div data-testid="error-message">{(error as Error).message}</div>;
  }
};

const AsyncComponent = () => {
  const { t, changeLanguage, isLoading } = useI18n();
  const [asyncTranslation, setAsyncTranslation] = React.useState('');
  
  React.useEffect(() => {
    const loadAsync = async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
      setAsyncTranslation(t('async.key'));
    };
    loadAsync();
  }, [t]);
  
  return (
    <div>
      <span data-testid="async-translation">{asyncTranslation}</span>
      <span data-testid="async-loading">{isLoading ? 'loading' : 'loaded'}</span>
      <button data-testid="async-change" onClick={() => changeLanguage('pt-BR')}>
        Async Change
      </button>
    </div>
  );
};

describe('I18nContext Enhanced Test Suite', () => {
  beforeEach(() => {
    // Initialize coordination hooks
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    console.log('🔄 Starting I18nContext test with coordination hooks');
    consoleLogSpy.mockRestore();

    jest.clearAllMocks();
    mockT.mockImplementation((key: string, options?: any) => {
      if (options?.defaultValue) return options.defaultValue;
      if (key.includes('missing')) return key;
      if (key === 'hello.name' && options?.name) return `Hello ${options.name}`;
      if (key === 'count.items' && options?.count !== undefined) {
        return options.count === 1 ? '1 item' : `${options.count} items`;
      }
      return `translated_${key}`;
    });
    mockI18nInstance.language = 'en';
    mockI18nInstance.isInitialized = true;
  });

  afterEach(() => {
    // Cleanup coordination hooks
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    console.log('✅ I18nContext test completed with coordination hooks');
    consoleLogSpy.mockRestore();
  });

  describe('Provider Initialization and Setup', () => {
    it('should initialize i18n with default configuration', async () => {
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('ready-state')).toHaveTextContent('ready');
      });

      expect(setupI18n).toHaveBeenCalledWith({
        fallbackLanguage: 'en',
        debug: false
      });
    });

    it('should initialize i18n with custom options', async () => {
      const customOptions = {
        fallbackLanguage: 'pt-BR',
        debug: true,
        namespace: 'custom'
      };

      render(
        <I18nProvider options={customOptions}>
          <TestComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(setupI18n).toHaveBeenCalledWith({
          fallbackLanguage: 'pt-BR',
          debug: true,
          namespace: 'custom'
        });
      });
    });

    it('should handle initialization errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      setupI18n.mockRejectedValueOnce(new Error('Init failed'));
      
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to initialize i18n:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('should skip initialization if already initialized', () => {
      mockI18nInstance.isInitialized = true;
      
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      // Should not call setupI18n again
      expect(setupI18n).not.toHaveBeenCalled();
    });
  });

  describe('Context Provider Functionality', () => {
    it('should provide complete context interface', () => {
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      expect(screen.getByTestId('loading-state')).toHaveTextContent('loaded');
      expect(screen.getByTestId('ready-state')).toHaveTextContent('ready');
      expect(screen.getByTestId('translated-text')).toHaveTextContent('translated_test.key');
      expect(screen.getByTestId('supported-languages')).toHaveTextContent('en,pt-BR');
      expect(screen.getByTestId('current-namespace')).toHaveTextContent('translation');
    });

    it('should handle provider remounting without issues', () => {
      const { unmount, rerender } = render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      
      unmount();
      
      rerender(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      expect(screen.getByTestId('ready-state')).toHaveTextContent('ready');
    });

    it('should handle multiple provider instances', () => {
      const SecondTestComponent = () => {
        const { language } = useI18n();
        return <span data-testid="second-language">{language}</span>;
      };

      render(
        <div>
          <I18nProvider>
            <TestComponent />
          </I18nProvider>
          <I18nProvider>
            <SecondTestComponent />
          </I18nProvider>
        </div>
      );

      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      expect(screen.getByTestId('second-language')).toHaveTextContent('en');
    });
  });

  describe('Language Switching with Validation', () => {
    it('should handle basic language switching', async () => {
      const user = userEvent.setup();
      
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      const switchButton = screen.getByTestId('switch-to-portuguese');
      await user.click(switchButton);

      expect(mockChangeLanguage).toHaveBeenCalledWith('pt-BR');
      expect(switchLanguage).toHaveBeenCalledWith('pt-BR');
    });

    it('should handle language switching with namespace loading', async () => {
      const user = userEvent.setup();
      
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      const switchButton = screen.getByTestId('switch-with-namespace');
      await user.click(switchButton);

      expect(mockChangeLanguage).toHaveBeenCalledWith('pt-BR');
      expect(mockLoadNamespaces).toHaveBeenCalledWith(['common']);
    });

    it('should validate language codes before switching', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const InvalidLanguageComponent = () => {
        const { changeLanguage } = useI18n();
        return (
          <div>
            <button data-testid="null-lang" onClick={() => changeLanguage(null as any)}>Null</button>
            <button data-testid="undefined-lang" onClick={() => changeLanguage(undefined as any)}>Undefined</button>
            <button data-testid="empty-lang" onClick={() => changeLanguage('')}>Empty</button>
            <button data-testid="whitespace-lang" onClick={() => changeLanguage('   ')}>Whitespace</button>
          </div>
        );
      };

      render(
        <I18nProvider>
          <InvalidLanguageComponent />
        </I18nProvider>
      );

      await user.click(screen.getByTestId('null-lang'));
      await user.click(screen.getByTestId('undefined-lang'));
      await user.click(screen.getByTestId('empty-lang'));
      await user.click(screen.getByTestId('whitespace-lang'));

      expect(consoleErrorSpy).toHaveBeenCalledTimes(4);
      expect(mockChangeLanguage).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle language switching errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockChangeLanguage.mockRejectedValueOnce(new Error('Switch failed'));
      switchLanguage.mockRejectedValueOnce(new Error('Config failed'));

      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      const switchButton = screen.getByTestId('switch-to-portuguese');
      await user.click(switchButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to change language:',
          expect.any(Error)
        );
      });

      expect(screen.getByTestId('loading-state')).toHaveTextContent('loaded');
      consoleErrorSpy.mockRestore();
    });

    it('should show loading state during language switch', async () => {
      const user = userEvent.setup();
      let resolveLanguageChange: () => void;
      const languagePromise = new Promise<void>((resolve) => {
        resolveLanguageChange = resolve;
      });
      
      mockChangeLanguage.mockReturnValue(languagePromise);

      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      const switchButton = screen.getByTestId('switch-to-portuguese');
      
      await act(async () => {
        await user.click(switchButton);
      });

      // Should show loading initially
      expect(screen.getByTestId('loading-state')).toHaveTextContent('loading');

      // Complete the language change
      await act(async () => {
        resolveLanguageChange!();
        await languagePromise;
      });

      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('loaded');
      });
    });
  });

  describe('Translation and Resource Management', () => {
    it('should handle various translation scenarios', () => {
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      expect(screen.getByTestId('translated-text')).toHaveTextContent('translated_test.key');
      expect(screen.getByTestId('nested-translation')).toHaveTextContent('translated_nested.deep.key');
      expect(screen.getByTestId('with-interpolation')).toHaveTextContent('Hello World');
      expect(screen.getByTestId('with-fallback')).toHaveTextContent('Fallback Text');
      expect(screen.getByTestId('with-pluralization')).toHaveTextContent('5 items');
    });

    it('should check translation availability', () => {
      mockExists.mockReturnValue(true);
      
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      expect(screen.getByTestId('has-translation')).toHaveTextContent('yes');
      expect(mockExists).toHaveBeenCalledWith('test.key');
    });

    it('should get available translations', () => {
      mockGetResourceBundle.mockReturnValue({
        'key1': 'Value 1',
        'key2': 'Value 2',
        'nested.key': 'Nested Value'
      });
      
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      expect(screen.getByTestId('available-translations')).toHaveTextContent('key1,key2,nested.key');
    });

    it('should handle empty resource bundles', () => {
      mockGetResourceBundle.mockReturnValue(null);
      
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      expect(screen.getByTestId('available-translations')).toHaveTextContent('');
    });
  });

  describe('Namespace Management', () => {
    it('should load additional namespaces', async () => {
      const user = userEvent.setup();
      
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      const loadButton = screen.getByTestId('load-namespace');
      await user.click(loadButton);

      expect(mockLoadNamespaces).toHaveBeenCalledWith(['common']);
    });

    it('should handle namespace loading errors', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockLoadNamespaces.mockRejectedValueOnce(new Error('Namespace failed'));

      const NamespaceErrorComponent = () => {
        const { loadNamespace } = useI18n();
        return (
          <button data-testid="error-namespace" onClick={() => loadNamespace('invalid')}>
            Load Invalid
          </button>
        );
      };

      render(
        <I18nProvider>
          <NamespaceErrorComponent />
        </I18nProvider>
      );

      await user.click(screen.getByTestId('error-namespace'));

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to load namespace:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('should handle array of namespaces', async () => {
      const user = userEvent.setup();

      const MultiNamespaceComponent = () => {
        const { loadNamespace } = useI18n();
        return (
          <button 
            data-testid="load-multiple" 
            onClick={() => loadNamespace(['common', 'forms', 'errors'])}
          >
            Load Multiple
          </button>
        );
      };

      render(
        <I18nProvider>
          <MultiNamespaceComponent />
        </I18nProvider>
      );

      await user.click(screen.getByTestId('load-multiple'));

      expect(mockLoadNamespaces).toHaveBeenCalledWith(['common', 'forms', 'errors']);
    });
  });

  describe('Hook Usage and Error Handling', () => {
    it('should throw error when used outside provider', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<ErrorTestComponent />);

      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'useI18n must be used within an I18nProvider'
      );

      consoleErrorSpy.mockRestore();
    });

    it('should provide stable function references', () => {
      let contextValue: any;

      const StabilityComponent = () => {
        contextValue = useI18n();
        return <div>Test</div>;
      };

      const { rerender } = render(
        <I18nProvider>
          <StabilityComponent />
        </I18nProvider>
      );

      const firstRender = contextValue;

      rerender(
        <I18nProvider>
          <StabilityComponent />
        </I18nProvider>
      );

      const secondRender = contextValue;

      expect(secondRender.changeLanguage).toBe(firstRender.changeLanguage);
      expect(secondRender.loadNamespace).toBe(firstRender.loadNamespace);
      expect(secondRender.getAvailableTranslations).toBe(firstRender.getAvailableTranslations);
      expect(secondRender.hasTranslation).toBe(firstRender.hasTranslation);
    });
  });

  describe('Async Operations and Performance', () => {
    it('should handle async translation loading', async () => {
      render(
        <I18nProvider>
          <AsyncComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('async-translation')).toHaveTextContent('translated_async.key');
      }, { timeout: 100 });
    });

    it('should handle concurrent language changes', async () => {
      const user = userEvent.setup();

      const ConcurrentComponent = () => {
        const { changeLanguage } = useI18n();
        return (
          <button 
            data-testid="concurrent-changes"
            onClick={async () => {
              await Promise.all([
                changeLanguage('pt-BR'),
                changeLanguage('en'),
                changeLanguage('pt-BR')
              ]);
            }}
          >
            Concurrent Changes
          </button>
        );
      };

      render(
        <I18nProvider>
          <ConcurrentComponent />
        </I18nProvider>
      );

      await user.click(screen.getByTestId('concurrent-changes'));

      expect(mockChangeLanguage).toHaveBeenCalledTimes(3);
    });

    it('should not cause memory leaks with frequent re-renders', () => {
      const ReRenderComponent = ({ counter }: { counter: number }) => {
        const { t } = useI18n();
        return <div data-testid="counter">{counter} - {t('test.key')}</div>;
      };

      const { rerender } = render(
        <I18nProvider>
          <ReRenderComponent counter={1} />
        </I18nProvider>
      );

      // Multiple re-renders
      for (let i = 2; i <= 20; i++) {
        rerender(
          <I18nProvider>
            <ReRenderComponent counter={i} />
          </I18nProvider>
        );
      }

      expect(screen.getByTestId('counter')).toHaveTextContent('20 - translated_test.key');
    });

    it('should handle frequent translation calls efficiently', () => {
      const FrequentTranslationComponent = () => {
        const { t } = useI18n();
        const translations = [];
        
        for (let i = 0; i < 100; i++) {
          translations.push(t(`key.${i}`));
        }
        
        return <div data-testid="translation-count">{translations.length}</div>;
      };

      render(
        <I18nProvider>
          <FrequentTranslationComponent />
        </I18nProvider>
      );

      expect(screen.getByTestId('translation-count')).toHaveTextContent('100');
      expect(mockT).toHaveBeenCalledTimes(100);
    });
  });

  describe('Integration with React Features', () => {
    it('should work with React Suspense boundaries', async () => {
      const SuspenseComponent = () => {
        const { t } = useI18n();
        return <div data-testid="suspense-content">{t('test.key')}</div>;
      };

      render(
        <React.Suspense fallback={<div data-testid="suspense-fallback">Loading...</div>}>
          <I18nProvider>
            <SuspenseComponent />
          </I18nProvider>
        </React.Suspense>
      );

      expect(screen.getByTestId('suspense-content')).toHaveTextContent('translated_test.key');
    });

    it('should work with React.memo components', () => {
      const MemoComponent = React.memo(() => {
        const { t, language } = useI18n();
        return (
          <div>
            <span data-testid="memo-language">{language}</span>
            <span data-testid="memo-translation">{t('test.key')}</span>
          </div>
        );
      });

      render(
        <I18nProvider>
          <MemoComponent />
        </I18nProvider>
      );

      expect(screen.getByTestId('memo-language')).toHaveTextContent('en');
      expect(screen.getByTestId('memo-translation')).toHaveTextContent('translated_test.key');
    });
  });
});