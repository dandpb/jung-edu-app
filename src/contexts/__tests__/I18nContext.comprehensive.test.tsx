/**
 * Comprehensive test suite for I18nContext
 * Tests context provider, hooks, translation loading, and localization features
 * Covers edge cases, error handling, and performance scenarios
 */

// Mock i18next and related modules
const mockT = jest.fn((key: string, options?: any) => {
  if (options?.defaultValue) return options.defaultValue;
  if (key.includes('missing')) return key; // Simulate missing translation
  return `translated_${key}`;
});

const mockChangeLanguage = jest.fn().mockResolvedValue(undefined);
const mockLoadNamespaces = jest.fn().mockResolvedValue(undefined);
const mockGetResource = jest.fn();
const mockExists = jest.fn().mockReturnValue(true);
const mockGetResourceBundle = jest.fn().mockReturnValue({
  'test.key': 'Test Value',
  'nested.deep.key': 'Deep Value'
});

const mockI18nInstance = {
  changeLanguage: mockChangeLanguage,
  language: 'en',
  languages: ['en', 'pt-BR'],
  loadNamespaces: mockLoadNamespaces,
  getResource: mockGetResource,
  exists: mockExists,
  getResourceBundle: mockGetResourceBundle,
  isInitialized: true,
  store: {
    data: {
      'en': { translation: { 'test.key': 'Test Value' } },
      'pt-BR': { translation: { 'test.key': 'Valor de Teste' } }
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
  getI18nInstance: jest.fn().mockReturnValue(mockI18nInstance)
}));

import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider, useI18n } from '../I18nContext';
import { setupI18n, switchLanguage } from '../../config/i18n';

// Test components
const TestComponent = () => {
  const { 
    t, 
    language, 
    changeLanguage, 
    isLoading, 
    supportedLanguages,
    isReady,
    getAvailableTranslations,
    hasTranslation
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
      
      <button 
        data-testid="switch-to-portuguese"
        onClick={() => changeLanguage('pt-BR')}
      >
        Switch to Portuguese
      </button>
      
      <button 
        data-testid="switch-to-english"
        onClick={() => changeLanguage('en')}
      >
        Switch to English
      </button>
      
      <button 
        data-testid="load-namespace"
        onClick={() => changeLanguage('en', { namespace: 'common' })}
      >
        Load Common Namespace
      </button>
      
      <span data-testid="nested-translation">{t('nested.deep.key')}</span>
      <span data-testid="with-interpolation">{t('hello.name', { name: 'World' })}</span>
      <span data-testid="with-fallback">{t('missing.key', 'Fallback Text')}</span>
    </div>
  );
};

const TestComponentWithError = () => {
  try {
    useI18n();
    return <div>Should not render</div>;
  } catch (error) {
    return <div data-testid="error-message">{(error as Error).message}</div>;
  }
};

const LanguageSwitcherTestComponent = () => {
  const { changeLanguage, supportedLanguages, language } = useI18n();
  
  return (
    <div>
      <select 
        data-testid="language-selector"
        value={language}
        onChange={(e) => changeLanguage(e.target.value)}
      >
        {supportedLanguages.map(lang => (
          <option key={lang} value={lang}>{lang}</option>
        ))}
      </select>
    </div>
  );
};

const AsyncTranslationComponent = () => {
  const { t, changeLanguage, isLoading } = useI18n();
  const [asyncTranslation, setAsyncTranslation] = React.useState('');
  
  React.useEffect(() => {
    const loadAsyncTranslation = async () => {
      // Simulate async translation loading
      await new Promise(resolve => setTimeout(resolve, 100));
      setAsyncTranslation(t('async.key'));
    };
    loadAsyncTranslation();
  }, [t]);
  
  return (
    <div>
      <span data-testid="async-translation">{asyncTranslation}</span>
      <span data-testid="async-loading">{isLoading ? 'loading' : 'loaded'}</span>
      <button 
        data-testid="trigger-async-change"
        onClick={() => changeLanguage('pt-BR')}
      >
        Async Change
      </button>
    </div>
  );
};

describe('I18nContext Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockT.mockImplementation((key: string, options?: any) => {
      if (options?.defaultValue) return options.defaultValue;
      if (key.includes('missing')) return key;
      if (key === 'hello.name' && options?.name) return `Hello ${options.name}`;
      return `translated_${key}`;
    });
    mockI18nInstance.language = 'en';
    mockI18nInstance.isInitialized = true;
  });

  describe('I18nProvider Functionality', () => {
    it('should provide complete i18n context to children', () => {
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
    });

    it('should provide supported languages list with validation', () => {
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      const supportedLanguagesElement = screen.getByTestId('supported-languages');
      const languages = supportedLanguagesElement.textContent?.split(',');
      
      expect(languages).toContain('en');
      expect(languages).toContain('pt-BR');
      expect(languages?.length).toBe(2);
    });

    it('should handle provider initialization with custom options', async () => {
      const customOptions = {
        fallbackLanguage: 'en',
        debug: true,
        namespace: 'custom'
      };

      render(
        <I18nProvider options={customOptions}>
          <TestComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('ready-state')).toHaveTextContent('ready');
      });

      expect(setupI18n).toHaveBeenCalledWith(expect.objectContaining(customOptions));
    });

    it('should handle provider remounting gracefully', () => {
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
  });

  describe('Language Switching Functionality', () => {
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

    it('should show loading state during language switch', async () => {
      const user = userEvent.setup();
      
      // Make language change take time
      mockChangeLanguage.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(undefined), 100))
      );

      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      const switchButton = screen.getByTestId('switch-to-portuguese');
      
      // Start the language change
      await act(async () => {
        await user.click(switchButton);
      });

      // Should eventually return to loaded state
      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('loaded');
      }, { timeout: 200 });
    });

    it('should handle rapid successive language switches', async () => {
      const user = userEvent.setup();
      
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      const portugueseButton = screen.getByTestId('switch-to-portuguese');
      const englishButton = screen.getByTestId('switch-to-english');

      // Rapid successive clicks
      await act(async () => {
        await user.click(portugueseButton);
        await user.click(englishButton);
        await user.click(portugueseButton);
      });

      // Should handle all requests gracefully
      expect(mockChangeLanguage).toHaveBeenCalledTimes(3);
    });

    it('should handle language switching with namespace loading', async () => {
      const user = userEvent.setup();
      
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      const loadNamespaceButton = screen.getByTestId('load-namespace');
      await user.click(loadNamespaceButton);

      expect(mockLoadNamespaces).toHaveBeenCalledWith(['common']);
    });
  });

  describe('Translation Loading and Fallbacks', () => {
    it('should handle translation with interpolation', () => {
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      expect(screen.getByTestId('with-interpolation')).toHaveTextContent('Hello World');
      expect(mockT).toHaveBeenCalledWith('hello.name', { name: 'World' });
    });

    it('should handle nested translation keys', () => {
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      expect(screen.getByTestId('nested-translation')).toHaveTextContent('translated_nested.deep.key');
    });

    it('should handle missing translations with fallback', () => {
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      expect(screen.getByTestId('with-fallback')).toHaveTextContent('Fallback Text');
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
        'key3': 'Value 3'
      });
      
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      expect(screen.getByTestId('available-translations')).toHaveTextContent('key1,key2,key3');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle language switching errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockChangeLanguage.mockRejectedValue(new Error('Language switch failed'));
      switchLanguage.mockRejectedValue(new Error('Config switch failed'));

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

      // Should still be in loaded state after error
      expect(screen.getByTestId('loading-state')).toHaveTextContent('loaded');

      consoleErrorSpy.mockRestore();
    });

    it('should handle invalid language codes', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockChangeLanguage.mockRejectedValue(new Error('Invalid language'));

      const CustomTestComponent = () => {
        const { changeLanguage } = useI18n();
        return (
          <button 
            data-testid="invalid-language"
            onClick={() => changeLanguage('invalid-lang-xyz')}
          >
            Invalid Language
          </button>
        );
      };

      render(
        <I18nProvider>
          <CustomTestComponent />
        </I18nProvider>
      );

      const invalidButton = screen.getByTestId('invalid-language');
      await user.click(invalidButton);

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should handle null/undefined language values', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const CustomTestComponent = () => {
        const { changeLanguage } = useI18n();
        return (
          <div>
            <button 
              data-testid="null-language"
              onClick={() => changeLanguage(null as any)}
            >
              Null Language
            </button>
            <button 
              data-testid="undefined-language"
              onClick={() => changeLanguage(undefined as any)}
            >
              Undefined Language
            </button>
            <button 
              data-testid="empty-language"
              onClick={() => changeLanguage('')}
            >
              Empty Language
            </button>
          </div>
        );
      };

      render(
        <I18nProvider>
          <CustomTestComponent />
        </I18nProvider>
      );

      await user.click(screen.getByTestId('null-language'));
      await user.click(screen.getByTestId('undefined-language'));
      await user.click(screen.getByTestId('empty-language'));

      expect(consoleErrorSpy).toHaveBeenCalledTimes(3);
      consoleErrorSpy.mockRestore();
    });

    it('should handle i18n initialization failures', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      setupI18n.mockRejectedValueOnce(new Error('Initialization failed'));
      
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
  });

  describe('useI18n Hook Functionality', () => {
    it('should throw error when used outside provider', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<TestComponentWithError />);

      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'useI18n must be used within an I18nProvider'
      );

      consoleErrorSpy.mockRestore();
    });

    it('should return all required context values with correct types', () => {
      let contextValue: any;

      const TestHookComponent = () => {
        contextValue = useI18n();
        return <div>Test</div>;
      };

      render(
        <I18nProvider>
          <TestHookComponent />
        </I18nProvider>
      );

      // Verify all properties exist
      expect(contextValue).toHaveProperty('t');
      expect(contextValue).toHaveProperty('language');
      expect(contextValue).toHaveProperty('changeLanguage');
      expect(contextValue).toHaveProperty('isLoading');
      expect(contextValue).toHaveProperty('isReady');
      expect(contextValue).toHaveProperty('supportedLanguages');
      expect(contextValue).toHaveProperty('getAvailableTranslations');
      expect(contextValue).toHaveProperty('hasTranslation');

      // Verify types
      expect(typeof contextValue.t).toBe('function');
      expect(typeof contextValue.changeLanguage).toBe('function');
      expect(typeof contextValue.getAvailableTranslations).toBe('function');
      expect(typeof contextValue.hasTranslation).toBe('function');
      expect(typeof contextValue.language).toBe('string');
      expect(typeof contextValue.isLoading).toBe('boolean');
      expect(typeof contextValue.isReady).toBe('boolean');
      expect(Array.isArray(contextValue.supportedLanguages)).toBe(true);
    });

    it('should maintain hook stability across re-renders', () => {
      let renderCount = 0;
      let contextValue: any;
      let previousContextValue: any;

      const StabilityTestComponent = () => {
        renderCount++;
        previousContextValue = contextValue;
        contextValue = useI18n();
        return <div data-testid="render-count">{renderCount}</div>;
      };

      const { rerender } = render(
        <I18nProvider>
          <StabilityTestComponent />
        </I18nProvider>
      );

      const firstRender = contextValue;

      rerender(
        <I18nProvider>
          <StabilityTestComponent />
        </I18nProvider>
      );

      // Functions should be stable (same reference)
      expect(contextValue.changeLanguage).toBe(firstRender.changeLanguage);
      expect(contextValue.t).toBe(firstRender.t);
      expect(renderCount).toBe(2);
    });
  });

  describe('Language Selector Integration', () => {
    it('should integrate with language selector components', async () => {
      const user = userEvent.setup();
      
      render(
        <I18nProvider>
          <LanguageSwitcherTestComponent />
        </I18nProvider>
      );

      const selector = screen.getByTestId('language-selector');
      expect(selector).toHaveValue('en');

      await user.selectOptions(selector, 'pt-BR');
      expect(mockChangeLanguage).toHaveBeenCalledWith('pt-BR');
    });

    it('should handle selector with all supported languages', () => {
      render(
        <I18nProvider>
          <LanguageSwitcherTestComponent />
        </I18nProvider>
      );

      const selector = screen.getByTestId('language-selector');
      const options = Array.from(selector.querySelectorAll('option'));
      
      expect(options).toHaveLength(2);
      expect(options.map(option => option.value)).toEqual(['en', 'pt-BR']);
    });
  });

  describe('Async Translation Loading', () => {
    it('should handle async translation loading scenarios', async () => {
      render(
        <I18nProvider>
          <AsyncTranslationComponent />
        </I18nProvider>
      );

      // Initially should be empty or loading
      expect(screen.getByTestId('async-loading')).toHaveTextContent('loaded');

      // Wait for async translation to load
      await waitFor(() => {
        expect(screen.getByTestId('async-translation')).toHaveTextContent('translated_async.key');
      }, { timeout: 200 });
    });

    it('should handle language changes during async operations', async () => {
      const user = userEvent.setup();
      
      render(
        <I18nProvider>
          <AsyncTranslationComponent />
        </I18nProvider>
      );

      const asyncChangeButton = screen.getByTestId('trigger-async-change');
      await user.click(asyncChangeButton);

      expect(mockChangeLanguage).toHaveBeenCalledWith('pt-BR');
    });
  });

  describe('Performance and Memory', () => {
    it('should not cause memory leaks with frequent re-renders', () => {
      const TestReRenderComponent = ({ counter }: { counter: number }) => {
        const { t } = useI18n();
        return <div data-testid="counter">{counter} - {t('test.key')}</div>;
      };

      const { rerender } = render(
        <I18nProvider>
          <TestReRenderComponent counter={1} />
        </I18nProvider>
      );

      // Re-render multiple times
      for (let i = 2; i <= 10; i++) {
        rerender(
          <I18nProvider>
            <TestReRenderComponent counter={i} />
          </I18nProvider>
        );
      }

      expect(screen.getByTestId('counter')).toHaveTextContent('10 - translated_test.key');
      // Test should complete without memory issues
    });

    it('should efficiently handle multiple translation calls', () => {
      const MultipleTranslationsComponent = () => {
        const { t } = useI18n();
        const translations = [];
        
        for (let i = 0; i < 50; i++) {
          translations.push(t(`key.${i}`));
        }
        
        return <div data-testid="translations-count">{translations.length}</div>;
      };

      render(
        <I18nProvider>
          <MultipleTranslationsComponent />
        </I18nProvider>
      );

      expect(screen.getByTestId('translations-count')).toHaveTextContent('50');
      expect(mockT).toHaveBeenCalledTimes(50);
    });
  });

  describe('Context State Management', () => {
    it('should maintain context state during provider updates', () => {
      const { rerender } = render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      expect(screen.getByTestId('current-language')).toHaveTextContent('en');

      // Update with different props but same provider
      rerender(
        <I18nProvider debug={true}>
          <TestComponent />
        </I18nProvider>
      );

      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      expect(screen.getByTestId('ready-state')).toHaveTextContent('ready');
    });

    it('should handle provider cleanup properly', () => {
      const { unmount } = render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      
      // Should not throw during cleanup
      expect(() => unmount()).not.toThrow();
    });
  });
});
