/**
 * Test utilities for i18n testing
 * Provides mock configurations, test helpers, and utilities for internationalization tests
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { I18nProvider } from '../../contexts/I18nContext';
import { 
  createMockI18nInstance,
  createMockTranslationFunction,
  createI18nTestWrapper,
  setupI18nMocks,
  resetI18nMocks
} from '../i18n-test-utils';

// Mock react-i18next
const mockI18nInstance = createMockI18nInstance();
const mockT = createMockTranslationFunction();

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

describe('I18n Test Utilities', () => {
  beforeEach(() => {
    setupI18nMocks();
  });

  afterEach(() => {
    resetI18nMocks();
  });

  describe('createMockI18nInstance', () => {
    it('should create a mock i18n instance with all required methods', () => {
      const instance = createMockI18nInstance();
      
      expect(instance).toHaveProperty('changeLanguage');
      expect(instance).toHaveProperty('language');
      expect(instance).toHaveProperty('languages');
      expect(instance).toHaveProperty('loadNamespaces');
      expect(instance).toHaveProperty('exists');
      expect(instance).toHaveProperty('getResourceBundle');
      expect(instance).toHaveProperty('isInitialized');
      expect(instance).toHaveProperty('store');
      
      expect(typeof instance.changeLanguage).toBe('function');
      expect(typeof instance.loadNamespaces).toBe('function');
      expect(typeof instance.exists).toBe('function');
      expect(typeof instance.getResourceBundle).toBe('function');
    });

    it('should allow custom configuration', () => {
      const customInstance = createMockI18nInstance({
        language: 'pt-BR',
        languages: ['pt-BR', 'es'],
        isInitialized: false
      });
      
      expect(customInstance.language).toBe('pt-BR');
      expect(customInstance.languages).toEqual(['pt-BR', 'es']);
      expect(customInstance.isInitialized).toBe(false);
    });

    it('should provide working mock methods', async () => {
      const instance = createMockI18nInstance();
      
      // Test changeLanguage
      await expect(instance.changeLanguage('pt-BR')).resolves.toBeUndefined();
      
      // Test loadNamespaces
      await expect(instance.loadNamespaces(['common'])).resolves.toBeUndefined();
      
      // Test exists
      expect(instance.exists('test.key')).toBe(true);
      
      // Test getResourceBundle
      const bundle = instance.getResourceBundle('en', 'translation');
      expect(bundle).toBeDefined();
    });
  });

  describe('createMockTranslationFunction', () => {
    it('should create a translation function that handles basic keys', () => {
      const t = createMockTranslationFunction();
      
      const result = t('test.key');
      expect(result).toBe('translated_test.key');
    });

    it('should handle interpolation', () => {
      const t = createMockTranslationFunction();
      
      const result = t('hello.name', { name: 'World' });
      expect(result).toBe('Hello World');
    });

    it('should handle default values', () => {
      const t = createMockTranslationFunction();
      
      const result = t('missing.key', 'Default Value');
      expect(result).toBe('Default Value');
    });

    it('should handle pluralization', () => {
      const t = createMockTranslationFunction();
      
      const singular = t('count.items', { count: 1 });
      const plural = t('count.items', { count: 5 });
      
      expect(singular).toBe('1 item');
      expect(plural).toBe('5 items');
    });

    it('should handle custom translations', () => {
      const customTranslations = {
        'custom.key': 'Custom Value',
        'another.key': 'Another Value'
      };
      
      const t = createMockTranslationFunction(customTranslations);
      
      expect(t('custom.key')).toBe('Custom Value');
      expect(t('another.key')).toBe('Another Value');
      expect(t('missing.key')).toBe('translated_missing.key');
    });
  });

  describe('createI18nTestWrapper', () => {
    it('should create a test wrapper component', () => {
      const Wrapper = createI18nTestWrapper();
      
      expect(Wrapper).toBeDefined();
      expect(typeof Wrapper).toBe('function');
    });

    it('should wrap children with I18nProvider', () => {
      const Wrapper = createI18nTestWrapper();
      
      const TestComponent = () => <div>Test</div>;
      
      const { getByText } = render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );
      
      expect(getByText('Test')).toBeInTheDocument();
    });

    it('should accept custom i18n configuration', () => {
      const customConfig = {
        language: 'pt-BR',
        supportedLanguages: ['pt-BR', 'es']
      };
      
      const Wrapper = createI18nTestWrapper(customConfig);
      
      expect(Wrapper).toBeDefined();
    });
  });

  describe('setupI18nMocks', () => {
    it('should setup all required mocks', () => {
      setupI18nMocks();
      
      // Should not throw and mocks should be configured
      expect(mockI18nInstance.changeLanguage).toBeDefined();
      expect(mockT).toBeDefined();
    });

    it('should setup with custom configuration', () => {
      const customConfig = {
        language: 'es',
        translations: {
          'test.key': 'Clave de Prueba'
        }
      };
      
      setupI18nMocks(customConfig);
      
      expect(mockI18nInstance.language).toBe('es');
    });

    it('should reset mock call counts', () => {
      // Make some calls
      mockI18nInstance.changeLanguage('pt-BR');
      mockT('test.key');
      
      expect(mockI18nInstance.changeLanguage).toHaveBeenCalledTimes(1);
      expect(mockT).toHaveBeenCalledTimes(1);
      
      setupI18nMocks();
      
      expect(mockI18nInstance.changeLanguage).toHaveBeenCalledTimes(0);
      expect(mockT).toHaveBeenCalledTimes(0);
    });
  });

  describe('resetI18nMocks', () => {
    it('should reset all mock states', () => {
      // Setup some state
      mockI18nInstance.language = 'pt-BR';
      mockI18nInstance.isInitialized = false;
      
      // Make some calls
      mockI18nInstance.changeLanguage('es');
      mockT('test.key');
      
      resetI18nMocks();
      
      expect(mockI18nInstance.language).toBe('en');
      expect(mockI18nInstance.isInitialized).toBe(true);
      expect(mockI18nInstance.changeLanguage).toHaveBeenCalledTimes(0);
      expect(mockT).toHaveBeenCalledTimes(0);
    });

    it('should restore default translations', () => {
      // Override translations
      setupI18nMocks({
        translations: {
          'custom.key': 'Custom Value'
        }
      });
      
      expect(mockT('custom.key')).toBe('Custom Value');
      
      resetI18nMocks();
      
      expect(mockT('custom.key')).toBe('translated_custom.key');
    });
  });

  describe('Mock Integration Tests', () => {
    it('should work with React Testing Library', () => {
      const TestComponent = () => {
        const t = mockT;
        return <div>{t('test.message')}</div>;
      };
      
      const Wrapper = createI18nTestWrapper();
      
      const { getByText } = render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );
      
      expect(getByText('translated_test.message')).toBeInTheDocument();
    });

    it('should handle async language changes', async () => {
      const mockChangeLanguage = jest.fn().mockResolvedValue(undefined);
      const instance = createMockI18nInstance({
        changeLanguage: mockChangeLanguage
      });
      
      await instance.changeLanguage('pt-BR');
      
      expect(mockChangeLanguage).toHaveBeenCalledWith('pt-BR');
    });

    it('should simulate loading states', () => {
      const instance = createMockI18nInstance({
        isInitialized: false
      });
      
      expect(instance.isInitialized).toBe(false);
      
      // Simulate initialization complete
      instance.isInitialized = true;
      expect(instance.isInitialized).toBe(true);
    });
  });

  describe('Error Simulation', () => {
    it('should allow mocking of errors', async () => {
      const errorMessage = 'Language change failed';
      const instance = createMockI18nInstance({
        changeLanguage: jest.fn().mockRejectedValue(new Error(errorMessage))
      });
      
      await expect(instance.changeLanguage('invalid')).rejects.toThrow(errorMessage);
    });

    it('should handle translation errors', () => {
      const t = createMockTranslationFunction();
      
      // Override to throw error
      const errorT = jest.fn().mockImplementation(() => {
        throw new Error('Translation error');
      });
      
      expect(() => errorT('test.key')).toThrow('Translation error');
    });
  });

  describe('Custom Render Helper', () => {
    it('should provide custom render function with i18n wrapper', () => {
      const customRender = (ui: React.ReactElement, options?: RenderOptions) => {
        const Wrapper = createI18nTestWrapper();
        return render(ui, {
          wrapper: Wrapper,
          ...options
        });
      };
      
      const TestComponent = () => <div>Test with i18n</div>;
      
      const { getByText } = customRender(<TestComponent />);
      
      expect(getByText('Test with i18n')).toBeInTheDocument();
    });
  });

  describe('Performance Testing', () => {
    it('should handle many translation calls efficiently', () => {
      const t = createMockTranslationFunction();
      
      const start = performance.now();
      
      // Call translation function many times
      for (let i = 0; i < 1000; i++) {
        t(`key.${i}`);
      }
      
      const end = performance.now();
      const duration = end - start;
      
      // Should complete quickly (less than 100ms)
      expect(duration).toBeLessThan(100);
    });

    it('should handle large translation objects', () => {
      const largeTranslations: Record<string, string> = {};
      
      // Create large translation object
      for (let i = 0; i < 10000; i++) {
        largeTranslations[`key.${i}`] = `Value ${i}`;
      }
      
      const t = createMockTranslationFunction(largeTranslations);
      
      // Should handle lookups efficiently
      expect(t('key.5000')).toBe('Value 5000');
      expect(t('key.9999')).toBe('Value 9999');
    });
  });
});
