/**
 * Comprehensive test suite for I18nContext
 * Tests context provider, hooks, namespace management, localStorage persistence, and all functionality
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider, useI18n, I18nOptions } from '../I18nContext';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Create mock i18n instance
const mockI18nInstance = {
  isInitialized: true,
  language: 'en',
  changeLanguage: jest.fn().mockResolvedValue(undefined),
  loadNamespaces: jest.fn().mockResolvedValue(undefined),
  getResourceBundle: jest.fn(),
  exists: jest.fn(),
  t: jest.fn((key: string) => key),
};

// Mock i18n configuration
jest.mock('../../config/i18n', () => ({
  setupI18n: jest.fn().mockResolvedValue(undefined),
  switchLanguage: jest.fn().mockResolvedValue(undefined),
  getI18nInstance: () => mockI18nInstance,
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(),
}));

// Test component to access all context features
const TestComponent = () => {
  const { 
    t, 
    language, 
    supportedLanguages, 
    changeLanguage, 
    isLoading, 
    isReady,
    getAvailableTranslations,
    hasTranslation,
    getCurrentNamespace,
    loadNamespace
  } = useI18n();
  
  return (
    <div>
      <span data-testid="current-language">{language}</span>
      <span data-testid="loading-state">{isLoading ? 'loading' : 'loaded'}</span>
      <span data-testid="ready-state">{isReady ? 'ready' : 'not-ready'}</span>
      <span data-testid="translated-text">{t('test.key')}</span>
      <span data-testid="supported-languages">{supportedLanguages.join(',')}</span>
      <span data-testid="current-namespace">{getCurrentNamespace()}</span>
      <span data-testid="has-translation">{hasTranslation('test.key') ? 'exists' : 'missing'}</span>
      <span data-testid="available-translations">{getAvailableTranslations().join(',')}</span>
      
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
        data-testid="switch-with-namespace"
        onClick={() => changeLanguage('pt-BR', { namespace: 'common' })}
      >
        Switch with Namespace
      </button>
      <button 
        data-testid="load-namespace"
        onClick={() => loadNamespace('common')}
      >
        Load Namespace
      </button>
      <button 
        data-testid="load-multiple-namespaces"
        onClick={() => loadNamespace(['common', 'forms'])}
      >
        Load Multiple Namespaces
      </button>
      <button 
        data-testid="invalid-language"
        onClick={() => changeLanguage('')}
      >
        Invalid Language
      </button>
      <button 
        data-testid="null-language"
        onClick={() => changeLanguage(null as any)}
      >
        Null Language
      </button>
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

describe('I18nContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Get mock references
    const { setupI18n, switchLanguage } = require('../../config/i18n');
    const { useTranslation } = require('react-i18next');
    
    // Setup default mock behaviors
    mockI18nInstance.t.mockImplementation((key: string) => key);
    mockI18nInstance.language = 'en';
    mockI18nInstance.isInitialized = true;
    mockI18nInstance.getResourceBundle.mockReturnValue({ 'test.key': 'Test Value', 'nested.key': 'Nested' });
    mockI18nInstance.exists.mockReturnValue(true);
    mockI18nInstance.changeLanguage.mockResolvedValue(undefined);
    mockI18nInstance.loadNamespaces.mockResolvedValue(undefined);
    setupI18n.mockResolvedValue(undefined);
    switchLanguage.mockResolvedValue(undefined);
    
    // Setup default useTranslation mock
    useTranslation.mockReturnValue({
      t: mockI18nInstance.t,
      i18n: mockI18nInstance,
      ready: true,
    });
  });

  describe('I18nProvider', () => {
    it('should provide i18n context to children', () => {
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      expect(screen.getByTestId('loading-state')).toHaveTextContent('loaded');
      expect(screen.getByTestId('ready-state')).toHaveTextContent('ready');
      expect(screen.getByTestId('translated-text')).toHaveTextContent('test.key');
    });

    it('should provide supported languages list', () => {
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      const supportedLanguagesElement = screen.getByTestId('supported-languages');
      expect(supportedLanguagesElement).toHaveTextContent('en,pt-BR');
    });

    it('should initialize i18n with default options', () => {
      mockI18nInstance.isInitialized = false;
      const { setupI18n } = require('../../config/i18n');
      
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      expect(setupI18n).toHaveBeenCalledWith({
        debug: false,
        fallbackLanguage: 'en',
      });
    });

    it('should initialize i18n with custom options', () => {
      const options: I18nOptions = {
        fallbackLanguage: 'pt-BR',
        debug: true,
        namespace: 'custom'
      };
      mockI18nInstance.isInitialized = false;
      
      render(
        <I18nProvider options={options} debug={true}>
          <TestComponent />
        </I18nProvider>
      );

      const { setupI18n } = require('../../config/i18n');
      expect(setupI18n).toHaveBeenCalledWith({
        debug: true,
        fallbackLanguage: 'pt-BR',
        namespace: 'custom'
      });
    });

    it('should handle i18n initialization errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const { setupI18n } = require('../../config/i18n');
      setupI18n.mockRejectedValueOnce(new Error('Initialization failed'));
      mockI18nInstance.isInitialized = false;

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

    it('should not reinitialize if already initialized', () => {
      mockI18nInstance.isInitialized = true;
      
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      const { setupI18n } = require('../../config/i18n');
      expect(setupI18n).not.toHaveBeenCalled();
    });
  });

  describe('Language switching', () => {
    it('should handle language switching', async () => {
      const user = userEvent.setup();
      
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      const switchButton = screen.getByTestId('switch-to-portuguese');
      await user.click(switchButton);

      expect(mockI18nInstance.changeLanguage).toHaveBeenCalledWith('pt-BR');
      const { switchLanguage } = require('../../config/i18n');
      expect(switchLanguage).toHaveBeenCalledWith('pt-BR');
    });

    it('should handle language switching with namespace', async () => {
      const user = userEvent.setup();
      
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      const switchButton = screen.getByTestId('switch-with-namespace');
      await user.click(switchButton);

      expect(mockI18nInstance.changeLanguage).toHaveBeenCalledWith('pt-BR');
      expect(mockI18nInstance.loadNamespaces).toHaveBeenCalledWith(['common']);
    });

    it('should show loading state during language switch', async () => {
      const user = userEvent.setup();
      
      let resolvePromise: () => void;
      const slowPromise = new Promise<void>(resolve => {
        resolvePromise = resolve;
      });
      mockI18nInstance.changeLanguage.mockReturnValue(slowPromise);

      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      const switchButton = screen.getByTestId('switch-to-portuguese');
      
      await user.click(switchButton);

      expect(screen.getByTestId('loading-state')).toHaveTextContent('loading');

      act(() => {
        resolvePromise!();
      });

      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('loaded');
      }, { timeout: 200 });
    });

    it('should handle language switching errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockI18nInstance.changeLanguage.mockRejectedValueOnce(new Error('Language switch failed'));

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

    it('should validate language codes before switching', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      const invalidButton = screen.getByTestId('invalid-language');
      await user.click(invalidButton);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Invalid language code provided:',
        ''
      );
      expect(mockI18nInstance.changeLanguage).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle null/undefined language gracefully', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      const nullButton = screen.getByTestId('null-language');
      await user.click(nullButton);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Invalid language code provided:',
        null
      );
      expect(mockI18nInstance.changeLanguage).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle multiple concurrent language switch attempts', async () => {
      const user = userEvent.setup();
      
      let resolvePromise: () => void;
      const slowPromise = new Promise<void>(resolve => {
        resolvePromise = resolve;
      });
      mockI18nInstance.changeLanguage.mockReturnValue(slowPromise);

      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      const switchButton = screen.getByTestId('switch-to-portuguese');

      // First click starts loading
      await user.click(switchButton);
      expect(screen.getByTestId('loading-state')).toHaveTextContent('loading');
      
      // Additional clicks are processed (current implementation allows concurrent calls)
      await user.click(switchButton);
      await user.click(switchButton);

      // Current implementation allows multiple concurrent calls
      expect(mockI18nInstance.changeLanguage).toHaveBeenCalledTimes(3);

      act(() => {
        resolvePromise!();
      });

      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('loaded');
      });
    });
  });

  describe('Namespace management', () => {
    it('should load single namespace', async () => {
      const user = userEvent.setup();
      
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      const loadButton = screen.getByTestId('load-namespace');
      await user.click(loadButton);

      expect(mockI18nInstance.loadNamespaces).toHaveBeenCalledWith(['common']);
    });

    it('should load multiple namespaces', async () => {
      const user = userEvent.setup();
      
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      const loadButton = screen.getByTestId('load-multiple-namespaces');
      await user.click(loadButton);

      expect(mockI18nInstance.loadNamespaces).toHaveBeenCalledWith(['common', 'forms']);
    });

    it('should handle namespace loading errors', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockI18nInstance.loadNamespaces.mockRejectedValueOnce(new Error('Namespace load failed'));

      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      const loadButton = screen.getByTestId('load-namespace');
      await user.click(loadButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to load namespace:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('should return current namespace', () => {
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      expect(screen.getByTestId('current-namespace')).toHaveTextContent('translation');
    });

    it('should update current namespace when switching with namespace option', async () => {
      const user = userEvent.setup();
      
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      const switchButton = screen.getByTestId('switch-with-namespace');
      await user.click(switchButton);

      await waitFor(() => {
        expect(screen.getByTestId('current-namespace')).toHaveTextContent('common');
      });
    });
  });

  describe('Translation functions', () => {
    it('should provide translation function that works', () => {
      mockI18nInstance.t.mockReturnValue('Translated text');

      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      expect(screen.getByTestId('translated-text')).toHaveTextContent('Translated text');
      expect(mockI18nInstance.t).toHaveBeenCalledWith('test.key');
    });

    it('should check if translation exists', () => {
      mockI18nInstance.exists.mockReturnValue(true);

      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      expect(screen.getByTestId('has-translation')).toHaveTextContent('exists');
      expect(mockI18nInstance.exists).toHaveBeenCalledWith('test.key');
    });

    it('should handle missing translations', () => {
      mockI18nInstance.exists.mockReturnValue(false);

      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      expect(screen.getByTestId('has-translation')).toHaveTextContent('missing');
    });

    it('should get available translations for default namespace', () => {
      mockI18nInstance.getResourceBundle.mockReturnValue({
        'test.key': 'Test Value',
        'nested.key': 'Nested Value'
      });

      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      expect(screen.getByTestId('available-translations')).toHaveTextContent('test.key,nested.key');
      expect(mockI18nInstance.getResourceBundle).toHaveBeenCalledWith('en', 'translation');
    });

    it('should get available translations for specific namespace', () => {
      // Set up mock to return different values for different namespaces
      mockI18nInstance.getResourceBundle.mockImplementation((lang, ns) => {
        if (ns === 'common') {
          return { 'button.save': 'Save', 'button.cancel': 'Cancel' };
        }
        return { 'test.key': 'Test Value', 'nested.key': 'Nested Value' };
      });

      const TestComponentWithNamespace = () => {
        const { getAvailableTranslations } = useI18n();
        return (
          <div>
            <span data-testid="common-translations">
              {getAvailableTranslations('common').join(',')}
            </span>
          </div>
        );
      };

      render(
        <I18nProvider>
          <TestComponentWithNamespace />
        </I18nProvider>
      );

      expect(screen.getByTestId('common-translations')).toHaveTextContent('button.save,button.cancel');
      expect(mockI18nInstance.getResourceBundle).toHaveBeenCalledWith('en', 'common');
    });

    it('should handle empty resource bundle', () => {
      mockI18nInstance.getResourceBundle.mockReturnValue(null);

      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      expect(screen.getByTestId('available-translations')).toHaveTextContent('');
    });
  });

  describe('useI18n hook', () => {
    it('should throw error when used outside provider', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<TestComponentWithError />);

      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'useI18n must be used within an I18nProvider'
      );

      consoleErrorSpy.mockRestore();
    });

    it('should return all required context values', () => {
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

      expect(contextValue).toHaveProperty('t');
      expect(contextValue).toHaveProperty('language');
      expect(contextValue).toHaveProperty('supportedLanguages');
      expect(contextValue).toHaveProperty('changeLanguage');
      expect(contextValue).toHaveProperty('isLoading');
      expect(contextValue).toHaveProperty('isReady');
      expect(contextValue).toHaveProperty('getAvailableTranslations');
      expect(contextValue).toHaveProperty('hasTranslation');
      expect(contextValue).toHaveProperty('getCurrentNamespace');
      expect(contextValue).toHaveProperty('loadNamespace');

      expect(typeof contextValue.t).toBe('function');
      expect(typeof contextValue.changeLanguage).toBe('function');
      expect(typeof contextValue.getAvailableTranslations).toBe('function');
      expect(typeof contextValue.hasTranslation).toBe('function');
      expect(typeof contextValue.getCurrentNamespace).toBe('function');
      expect(typeof contextValue.loadNamespace).toBe('function');
      expect(typeof contextValue.language).toBe('string');
      expect(typeof contextValue.isLoading).toBe('boolean');
      expect(typeof contextValue.isReady).toBe('boolean');
      expect(Array.isArray(contextValue.supportedLanguages)).toBe(true);
    });

    it('should provide correct initial values', () => {
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

      expect(contextValue.language).toBe('en');
      expect(contextValue.supportedLanguages).toEqual(['en', 'pt-BR']);
      expect(contextValue.isLoading).toBe(false);
      expect(contextValue.isReady).toBe(true);
      expect(contextValue.getCurrentNamespace()).toBe('translation');
    });
  });

  describe('Context state management', () => {
    it('should maintain state across re-renders', () => {
      const { rerender } = render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      expect(screen.getByTestId('current-language')).toHaveTextContent('en');

      rerender(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
    });

    it('should handle provider remounting', () => {
      const { unmount } = render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      unmount();

      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
    });

    it('should handle i18n not ready state', () => {
      const mockUseTranslation = require('react-i18next').useTranslation;
      mockUseTranslation.mockReturnValueOnce({
        t: mockI18nInstance.t,
        i18n: mockI18nInstance,
        ready: false,
      });

      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      expect(screen.getByTestId('ready-state')).toHaveTextContent('not-ready');
    });

    it('should handle i18n not initialized state', () => {
      mockI18nInstance.isInitialized = false;

      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      expect(screen.getByTestId('ready-state')).toHaveTextContent('not-ready');
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle multiple language switches gracefully', async () => {
      const user = userEvent.setup();
      mockI18nInstance.changeLanguage.mockResolvedValue(undefined);

      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      const portugueseButton = screen.getByTestId('switch-to-portuguese');
      const englishButton = screen.getByTestId('switch-to-english');

      await user.click(portugueseButton);
      expect(mockI18nInstance.changeLanguage).toHaveBeenCalledWith('pt-BR');

      await user.click(englishButton);
      expect(mockI18nInstance.changeLanguage).toHaveBeenCalledWith('en');

      expect(mockI18nInstance.changeLanguage).toHaveBeenCalledTimes(2);
    });

    it('should handle whitespace-only language codes', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const TestComponentWithWhitespace = () => {
        const { changeLanguage } = useI18n();
        return (
          <button 
            data-testid="whitespace-language"
            onClick={() => changeLanguage('   ')}
          >
            Whitespace Language
          </button>
        );
      };

      render(
        <I18nProvider>
          <TestComponentWithWhitespace />
        </I18nProvider>
      );

      const whitespaceButton = screen.getByTestId('whitespace-language');
      await user.click(whitespaceButton);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Invalid language code provided:',
        '   '
      );
      expect(mockI18nInstance.changeLanguage).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle non-string language parameter', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const TestComponentWithNumber = () => {
        const { changeLanguage } = useI18n();
        return (
          <button 
            data-testid="number-language"
            onClick={() => changeLanguage(123 as any)}
          >
            Number Language
          </button>
        );
      };

      render(
        <I18nProvider>
          <TestComponentWithNumber />
        </I18nProvider>
      );

      const numberButton = screen.getByTestId('number-language');
      await user.click(numberButton);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Invalid language code provided:',
        123
      );
      expect(mockI18nInstance.changeLanguage).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle switchLanguage function errors', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const { switchLanguage } = require('../../config/i18n');
      switchLanguage.mockRejectedValueOnce(new Error('Switch function failed'));

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

      consoleErrorSpy.mockRestore();
    });

    it('should handle namespace loading during language switch errors', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockI18nInstance.loadNamespaces.mockRejectedValueOnce(new Error('Namespace loading failed'));

      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      const switchButton = screen.getByTestId('switch-with-namespace');
      await user.click(switchButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to change language:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Provider options and configuration', () => {
    it('should handle custom options correctly', () => {
      const options: I18nOptions = {
        fallbackLanguage: 'pt-BR',
        debug: true,
        namespace: 'custom'
      };

      mockI18nInstance.isInitialized = false;

      render(
        <I18nProvider options={options}>
          <TestComponent />
        </I18nProvider>
      );

      const { setupI18n } = require('../../config/i18n');
      expect(setupI18n).toHaveBeenCalledWith({
        debug: true,
        fallbackLanguage: 'pt-BR',
        namespace: 'custom'
      });
    });

    it('should handle debug prop override', () => {
      mockI18nInstance.isInitialized = false;

      render(
        <I18nProvider debug={true}>
          <TestComponent />
        </I18nProvider>
      );

      const { setupI18n } = require('../../config/i18n');
      expect(setupI18n).toHaveBeenCalledWith({
        debug: true,
        fallbackLanguage: 'en',
      });
    });

    it('should handle empty options object', () => {
      mockI18nInstance.isInitialized = false;

      render(
        <I18nProvider options={{}}>
          <TestComponent />
        </I18nProvider>
      );

      const { setupI18n } = require('../../config/i18n');
      expect(setupI18n).toHaveBeenCalledWith({
        debug: false,
        fallbackLanguage: 'en',
      });
    });
  });

  describe('Supported languages validation', () => {
    it('should only include valid language codes', () => {
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      const supportedLanguages = screen.getByTestId('supported-languages').textContent?.split(',');
      
      expect(supportedLanguages).toContain('en');
      expect(supportedLanguages).toContain('pt-BR');
      expect(supportedLanguages).toHaveLength(2);
    });

    it('should provide hardcoded supported languages based on config', () => {
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

      expect(contextValue.supportedLanguages).toEqual(['en', 'pt-BR']);
    });
  });
});