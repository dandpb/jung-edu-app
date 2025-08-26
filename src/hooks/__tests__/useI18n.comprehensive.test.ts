/**
 * Comprehensive test suite for useI18n hook
 * Tests hook functionality, translation features, language switching, and edge cases
 */

import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { useI18n } from '../useI18n';
import { I18nProvider } from '../../contexts/I18nContext';

// Mock dependencies
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
  exists: mockExists,
  getResourceBundle: mockGetResourceBundle,
  isInitialized: true,
  hasResourceBundle: jest.fn().mockReturnValue(true),
  getResource: jest.fn((lang: string, ns: string, key: string) => `${lang}_${ns}_${key}`),
  store: {
    data: {
      'en': { 
        translation: { 'test.key': 'Test Value' },
        common: { 'button.save': 'Save', 'button.cancel': 'Cancel' }
      },
      'pt-BR': { 
        translation: { 'test.key': 'Valor de Teste' },
        common: { 'button.save': 'Salvar', 'button.cancel': 'Cancelar' }
      }
    }
  }
};

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
    i18n: mockI18nInstance,
    ready: true
  }),
  I18nextProvider: ({ children }: any) => children
}));

jest.mock('../../config/i18n', () => ({
  switchLanguage: jest.fn().mockResolvedValue(undefined),
  getI18nInstance: jest.fn().mockReturnValue(mockI18nInstance),
  setupI18n: jest.fn().mockResolvedValue(undefined)
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return React.createElement(I18nProvider, {}, children);
};

describe('useI18n Hook Comprehensive Tests', () => {
  beforeEach(() => {
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

  describe('Basic Hook Functionality', () => {
    it('should return all required hook properties', () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: TestWrapper
      });

      const hookResult = result.current;

      expect(hookResult).toHaveProperty('t');
      expect(hookResult).toHaveProperty('language');
      expect(hookResult).toHaveProperty('changeLanguage');
      expect(hookResult).toHaveProperty('isLoading');
      expect(hookResult).toHaveProperty('isReady');
      expect(hookResult).toHaveProperty('supportedLanguages');
      expect(hookResult).toHaveProperty('getAvailableTranslations');
      expect(hookResult).toHaveProperty('hasTranslation');
      expect(hookResult).toHaveProperty('getCurrentNamespace');
      expect(hookResult).toHaveProperty('loadNamespace');

      // Verify types
      expect(typeof hookResult.t).toBe('function');
      expect(typeof hookResult.changeLanguage).toBe('function');
      expect(typeof hookResult.getAvailableTranslations).toBe('function');
      expect(typeof hookResult.hasTranslation).toBe('function');
      expect(typeof hookResult.getCurrentNamespace).toBe('function');
      expect(typeof hookResult.loadNamespace).toBe('function');
      expect(typeof hookResult.language).toBe('string');
      expect(typeof hookResult.isLoading).toBe('boolean');
      expect(typeof hookResult.isReady).toBe('boolean');
      expect(Array.isArray(hookResult.supportedLanguages)).toBe(true);
    });

    it('should provide correct initial values', () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: TestWrapper
      });

      expect(result.current.language).toBe('en');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isReady).toBe(true);
      expect(result.current.supportedLanguages).toEqual(['en', 'pt-BR']);
    });

    it('should maintain stable function references', () => {
      const { result, rerender } = renderHook(() => useI18n(), {
        wrapper: TestWrapper
      });

      const firstRender = result.current;

      rerender();

      const secondRender = result.current;

      // Function references should be stable
      expect(secondRender.changeLanguage).toBe(firstRender.changeLanguage);
      expect(secondRender.getAvailableTranslations).toBe(firstRender.getAvailableTranslations);
      expect(secondRender.hasTranslation).toBe(firstRender.hasTranslation);
    });
  });

  describe('Translation Functionality', () => {
    it('should handle basic translation', () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: TestWrapper
      });

      const translation = result.current.t('test.key');
      
      expect(translation).toBe('translated_test.key');
      expect(mockT).toHaveBeenCalledWith('test.key');
    });

    it('should handle translation with interpolation', () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: TestWrapper
      });

      const translation = result.current.t('hello.name', { name: 'World' });
      
      expect(translation).toBe('Hello World');
      expect(mockT).toHaveBeenCalledWith('hello.name', { name: 'World' });
    });

    it('should handle translation with default values', () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: TestWrapper
      });

      const translation = result.current.t('missing.key', 'Default Text');
      
      expect(translation).toBe('Default Text');
      expect(mockT).toHaveBeenCalledWith('missing.key', 'Default Text');
    });

    it('should handle pluralization', () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: TestWrapper
      });

      const singular = result.current.t('count.items', { count: 1 });
      const plural = result.current.t('count.items', { count: 5 });
      
      expect(singular).toBe('1 item');
      expect(plural).toBe('5 items');
    });

    it('should handle nested translation keys', () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: TestWrapper
      });

      const translation = result.current.t('nested.deep.key');
      
      expect(translation).toBe('translated_nested.deep.key');
    });

    it('should check translation existence', () => {
      mockExists.mockReturnValue(true);
      
      const { result } = renderHook(() => useI18n(), {
        wrapper: TestWrapper
      });

      const exists = result.current.hasTranslation('test.key');
      
      expect(exists).toBe(true);
      expect(mockExists).toHaveBeenCalledWith('test.key');
    });

    it('should handle non-existent translations', () => {
      mockExists.mockReturnValue(false);
      
      const { result } = renderHook(() => useI18n(), {
        wrapper: TestWrapper
      });

      const exists = result.current.hasTranslation('non.existent.key');
      
      expect(exists).toBe(false);
    });
  });

  describe('Language Switching', () => {
    it('should handle basic language switching', async () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: TestWrapper
      });

      await act(async () => {
        await result.current.changeLanguage('pt-BR');
      });

      expect(mockChangeLanguage).toHaveBeenCalledWith('pt-BR');
    });

    it('should handle language switching with namespace', async () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: TestWrapper
      });

      await act(async () => {
        await result.current.changeLanguage('pt-BR', { namespace: 'common' });
      });

      expect(mockChangeLanguage).toHaveBeenCalledWith('pt-BR');
      expect(mockLoadNamespaces).toHaveBeenCalledWith(['common']);
    });

    it('should handle language switching errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockChangeLanguage.mockRejectedValueOnce(new Error('Language switch failed'));
      
      const { result } = renderHook(() => useI18n(), {
        wrapper: TestWrapper
      });

      await act(async () => {
        await result.current.changeLanguage('invalid-lang');
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to change language:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should validate language codes before switching', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const { result } = renderHook(() => useI18n(), {
        wrapper: TestWrapper
      });

      // Test with null
      await act(async () => {
        await result.current.changeLanguage(null as any);
      });

      // Test with undefined
      await act(async () => {
        await result.current.changeLanguage(undefined as any);
      });

      // Test with empty string
      await act(async () => {
        await result.current.changeLanguage('');
      });

      expect(consoleErrorSpy).toHaveBeenCalledTimes(3);
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Namespace Management', () => {
    it('should load additional namespaces', async () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: TestWrapper
      });

      await act(async () => {
        await result.current.loadNamespace('common');
      });

      expect(mockLoadNamespaces).toHaveBeenCalledWith(['common']);
    });

    it('should load multiple namespaces', async () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: TestWrapper
      });

      await act(async () => {
        await result.current.loadNamespace(['common', 'forms', 'errors']);
      });

      expect(mockLoadNamespaces).toHaveBeenCalledWith(['common', 'forms', 'errors']);
    });

    it('should get current namespace', () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: TestWrapper
      });

      const namespace = result.current.getCurrentNamespace();
      
      expect(namespace).toBe('translation'); // default namespace
    });

    it('should handle namespace loading errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockLoadNamespaces.mockRejectedValueOnce(new Error('Namespace loading failed'));
      
      const { result } = renderHook(() => useI18n(), {
        wrapper: TestWrapper
      });

      await act(async () => {
        await result.current.loadNamespace('invalid-namespace');
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load namespace:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Translation Resource Management', () => {
    it('should get available translations for current language', () => {
      mockGetResourceBundle.mockReturnValue({
        'key1': 'Value 1',
        'key2': 'Value 2',
        'nested.key': 'Nested Value'
      });
      
      const { result } = renderHook(() => useI18n(), {
        wrapper: TestWrapper
      });

      const translations = result.current.getAvailableTranslations();
      
      expect(translations).toEqual(['key1', 'key2', 'nested.key']);
      expect(mockGetResourceBundle).toHaveBeenCalledWith('en', 'translation');
    });

    it('should get available translations for specific namespace', () => {
      mockGetResourceBundle.mockReturnValue({
        'button.save': 'Save',
        'button.cancel': 'Cancel'
      });
      
      const { result } = renderHook(() => useI18n(), {
        wrapper: TestWrapper
      });

      const translations = result.current.getAvailableTranslations('common');
      
      expect(translations).toEqual(['button.save', 'button.cancel']);
      expect(mockGetResourceBundle).toHaveBeenCalledWith('en', 'common');
    });

    it('should handle missing resource bundles', () => {
      mockGetResourceBundle.mockReturnValue(null);
      
      const { result } = renderHook(() => useI18n(), {
        wrapper: TestWrapper
      });

      const translations = result.current.getAvailableTranslations();
      
      expect(translations).toEqual([]);
    });
  });

  describe('Hook State Management', () => {
    it('should manage loading state during language changes', async () => {
      let resolveLanguageChange: () => void;
      const languageChangePromise = new Promise<void>((resolve) => {
        resolveLanguageChange = resolve;
      });
      
      mockChangeLanguage.mockReturnValue(languageChangePromise);
      
      const { result } = renderHook(() => useI18n(), {
        wrapper: TestWrapper
      });

      expect(result.current.isLoading).toBe(false);

      // Start language change
      act(() => {
        result.current.changeLanguage('pt-BR');
      });

      // Should be loading
      expect(result.current.isLoading).toBe(true);

      // Complete language change
      await act(async () => {
        resolveLanguageChange!();
        await languageChangePromise;
      });

      // Should not be loading anymore
      expect(result.current.isLoading).toBe(false);
    });

    it('should manage ready state based on i18n initialization', () => {
      mockI18nInstance.isInitialized = true;
      
      const { result } = renderHook(() => useI18n(), {
        wrapper: TestWrapper
      });

      expect(result.current.isReady).toBe(true);
    });

    it('should handle not ready state', () => {
      mockI18nInstance.isInitialized = false;
      
      const { result, rerender } = renderHook(() => useI18n(), {
        wrapper: TestWrapper
      });

      expect(result.current.isReady).toBe(false);

      // Simulate initialization complete
      mockI18nInstance.isInitialized = true;
      rerender();

      expect(result.current.isReady).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should throw error when used outside provider', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useI18n());
      }).toThrow('useI18n must be used within an I18nProvider');

      consoleErrorSpy.mockRestore();
    });

    it('should handle translation function errors gracefully', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockT.mockImplementationOnce(() => {
        throw new Error('Translation error');
      });
      
      const { result } = renderHook(() => useI18n(), {
        wrapper: TestWrapper
      });

      // Should not throw but handle gracefully
      const translation = result.current.t('error.key');
      
      // Should return key as fallback or handle error
      expect(translation).toBeDefined();
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle concurrent language changes', async () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: TestWrapper
      });

      // Trigger multiple language changes rapidly
      const promises = [
        result.current.changeLanguage('pt-BR'),
        result.current.changeLanguage('en'),
        result.current.changeLanguage('pt-BR')
      ];

      await act(async () => {
        await Promise.all(promises);
      });

      // All changes should be handled without issues
      expect(mockChangeLanguage).toHaveBeenCalledTimes(3);
    });

    it('should handle malformed translation keys', () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: TestWrapper
      });

      // Test various malformed keys
      const results = [
        result.current.t(''),
        result.current.t('   '),
        result.current.t('.key'),
        result.current.t('key.'),
        result.current.t('..key..'),
        result.current.t(null as any),
        result.current.t(undefined as any)
      ];

      // Should handle all gracefully without throwing
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });
  });

  describe('Performance Optimization', () => {
    it('should memoize expensive operations', () => {
      const { result, rerender } = renderHook(() => useI18n(), {
        wrapper: TestWrapper
      });

      const firstTranslations = result.current.getAvailableTranslations();
      
      rerender();
      
      const secondTranslations = result.current.getAvailableTranslations();

      // Should return same reference for same data
      expect(secondTranslations).toBe(firstTranslations);
    });

    it('should handle frequent translation calls efficiently', () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: TestWrapper
      });

      // Call translation function many times
      const translations = [];
      for (let i = 0; i < 100; i++) {
        translations.push(result.current.t(`key.${i}`));
      }

      expect(translations.length).toBe(100);
      expect(mockT).toHaveBeenCalledTimes(100);
    });

    it('should not cause memory leaks with frequent hook usage', () => {
      const { rerender, unmount } = renderHook(() => useI18n(), {
        wrapper: TestWrapper
      });

      // Multiple re-renders
      for (let i = 0; i < 20; i++) {
        rerender();
      }

      // Should unmount cleanly
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Integration with i18next Features', () => {
    it('should work with i18next context features', () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: TestWrapper
      });

      // Test context access
      const contextTranslation = result.current.t('test.key', { context: 'male' });
      
      expect(mockT).toHaveBeenCalledWith('test.key', { context: 'male' });
    });

    it('should work with i18next formatting', () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: TestWrapper
      });

      const formattedTranslation = result.current.t('date.format', { 
        date: new Date('2023-01-01'),
        formatParams: {
          date: { year: 'numeric', month: 'long', day: 'numeric' }
        }
      });
      
      expect(mockT).toHaveBeenCalledWith('date.format', expect.objectContaining({
        date: expect.any(Date),
        formatParams: expect.any(Object)
      }));
    });

    it('should support i18next resource nesting', () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: TestWrapper
      });

      const nestedTranslation = result.current.t('$t(common:button.save)');
      
      expect(mockT).toHaveBeenCalledWith('$t(common:button.save)');
    });
  });
});
