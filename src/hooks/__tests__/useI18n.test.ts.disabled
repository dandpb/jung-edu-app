/**
 * Comprehensive test suite for useI18n hook
 * Tests hook functionality, translation features, language switching, edge cases, and error handling
 * 
 * Coverage goals:
 * - Hook interface and basic functionality
 * - Translation functionality with interpolation and pluralization
 * - Language switching and validation
 * - Namespace management
 * - Resource and translation management
 * - State management and lifecycle
 * - Error handling and edge cases
 * - Performance considerations
 */

import { renderHook, act } from '@testing-library/react';
import { useI18n } from '../useI18n';
import * as i18nConfig from '../../config/i18n';

// Mock dependencies
const mockT = jest.fn();
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
  languages: ['en', 'pt-BR', 'es', 'fr'],
  loadNamespaces: mockLoadNamespaces,
  exists: mockExists,
  getResourceBundle: mockGetResourceBundle,
  isInitialized: true,
  hasResourceBundle: jest.fn().mockReturnValue(true),
  getResource: jest.fn((lang: string, ns: string, key: string) => `${lang}_${ns}_${key}`),
  getDataByLanguage: jest.fn().mockReturnValue({
    translation: { 'key1': 'value1' },
    common: { 'button.save': 'Save' }
  }),
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

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
    i18n: mockI18nInstance,
    ready: true
  })
}));

// Mock i18n config
jest.mock('../../config/i18n', () => ({
  switchLanguage: jest.fn().mockResolvedValue(undefined),
  getI18nInstance: jest.fn(),
  setupI18n: jest.fn().mockResolvedValue(undefined)
}));

describe('useI18n Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockT.mockImplementation((key: string, options?: any) => {
      if (options?.defaultValue) return options.defaultValue;
      if (key.includes('missing')) return key;
      if (key === 'hello.name' && options?.name) return `Hello ${options.name}`;
      if (key === 'count.items' && options?.count !== undefined) {
        return options.count === 1 ? '1 item' : `${options.count} items`;
      }
      if (key.startsWith('error.')) throw new Error('Translation error');
      return `translated_${key}`;
    });
    
    mockI18nInstance.language = 'en';
    mockI18nInstance.isInitialized = true;
    mockGetResourceBundle.mockReturnValue({
      'test.key': 'Test Value',
      'nested.deep.key': 'Deep Value',
      'dynamic.key': 'Dynamic Value'
    });
    mockExists.mockReturnValue(true);
  });

  describe('Hook Interface and Basic Functionality', () => {
    it('should return complete hook interface', () => {
      const { result } = renderHook(() => useI18n());
      const hookResult = result.current;

      // Verify all required properties exist
      expect(hookResult).toHaveProperty('t');
      expect(hookResult).toHaveProperty('language');
      expect(hookResult).toHaveProperty('supportedLanguages');
      expect(hookResult).toHaveProperty('changeLanguage');
      expect(hookResult).toHaveProperty('isLoading');
      expect(hookResult).toHaveProperty('isReady');
      expect(hookResult).toHaveProperty('getAvailableTranslations');
      expect(hookResult).toHaveProperty('hasTranslation');
      expect(hookResult).toHaveProperty('getCurrentNamespace');
      expect(hookResult).toHaveProperty('loadNamespace');

      // Verify correct types
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
      const { result } = renderHook(() => useI18n());

      expect(result.current.language).toBe('en');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isReady).toBe(true);
      expect(result.current.supportedLanguages).toEqual(['en', 'pt-BR']);
      expect(result.current.getCurrentNamespace()).toBe('translation');
    });

    it('should maintain stable function references across re-renders', () => {
      const { result, rerender } = renderHook(() => useI18n());

      const firstRender = result.current;
      rerender();
      const secondRender = result.current;

      // Function references should be stable
      expect(secondRender.changeLanguage).toBe(firstRender.changeLanguage);
      expect(secondRender.loadNamespace).toBe(firstRender.loadNamespace);
      expect(secondRender.getAvailableTranslations).toBe(firstRender.getAvailableTranslations);
      expect(secondRender.hasTranslation).toBe(firstRender.hasTranslation);
      expect(secondRender.getCurrentNamespace).toBe(firstRender.getCurrentNamespace);
    });

    it('should handle hook re-initialization gracefully', () => {
      const { result, unmount } = renderHook(() => useI18n());

      const firstLanguage = result.current.language;
      expect(firstLanguage).toBe('en');

      // Test unmounting - this should not throw
      expect(() => unmount()).not.toThrow();
      
      // Create a new hook instance after unmount
      const { result: newResult } = renderHook(() => useI18n());
      expect(newResult.current.language).toBe('en');
      expect(newResult.current.isReady).toBe(true);
    });
  });

  describe('Translation Functionality', () => {
    it('should handle basic translation', () => {
      const { result } = renderHook(() => useI18n());

      const translation = result.current.t('test.key');
      
      expect(translation).toBe('translated_test.key');
      expect(mockT).toHaveBeenCalledWith('test.key');
    });

    it('should handle translation with interpolation', () => {
      const { result } = renderHook(() => useI18n());

      const translation = result.current.t('hello.name', { name: 'World' });
      
      expect(translation).toBe('Hello World');
      expect(mockT).toHaveBeenCalledWith('hello.name', { name: 'World' });
    });

    it('should handle translation with default values', () => {
      const { result } = renderHook(() => useI18n());

      const translation = result.current.t('missing.key', { defaultValue: 'Default Text' });
      
      expect(translation).toBe('Default Text');
      expect(mockT).toHaveBeenCalledWith('missing.key', { defaultValue: 'Default Text' });
    });

    it('should handle pluralization correctly', () => {
      const { result } = renderHook(() => useI18n());

      const singular = result.current.t('count.items', { count: 1 });
      const plural = result.current.t('count.items', { count: 5 });
      const zero = result.current.t('count.items', { count: 0 });
      
      expect(singular).toBe('1 item');
      expect(plural).toBe('5 items');
      expect(zero).toBe('0 items');
    });

    it('should handle nested translation keys', () => {
      const { result } = renderHook(() => useI18n());

      const translation = result.current.t('nested.deep.key');
      
      expect(translation).toBe('translated_nested.deep.key');
      expect(mockT).toHaveBeenCalledWith('nested.deep.key');
    });

    it('should handle translation with complex interpolation', () => {
      mockT.mockImplementationOnce((key, options) => {
        if (key === 'complex.interpolation' && options) {
          return `User ${options.user.name} has ${options.count} ${options.type}(s)`;
        }
        return `translated_${key}`;
      });

      const { result } = renderHook(() => useI18n());

      const translation = result.current.t('complex.interpolation', {
        user: { name: 'John' },
        count: 5,
        type: 'message'
      });
      
      expect(translation).toBe('User John has 5 message(s)');
    });

    it('should handle contextual translations', () => {
      mockT.mockImplementation((key, options) => {
        if (key === 'contextual.key' && options?.context) {
          return `translated_${key}_${options.context}`;
        }
        return `translated_${key}`;
      });

      const { result } = renderHook(() => useI18n());

      const maleContext = result.current.t('contextual.key', { context: 'male' });
      const femaleContext = result.current.t('contextual.key', { context: 'female' });
      
      expect(maleContext).toBe('translated_contextual.key_male');
      expect(femaleContext).toBe('translated_contextual.key_female');
    });

    it('should handle translation errors gracefully', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const { result } = renderHook(() => useI18n());

      // This should not throw but handle gracefully
      let errorTranslation;
      expect(() => {
        errorTranslation = result.current.t('error.key');
      }).not.toThrow();
      
      expect(errorTranslation).toBeDefined();
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle empty and null translation keys', () => {
      const { result } = renderHook(() => useI18n());

      expect(() => {
        result.current.t('');
        result.current.t(null as any);
        result.current.t(undefined as any);
      }).not.toThrow();
    });
  });

  describe('Language Switching and Validation', () => {
    it('should handle basic language switching', async () => {
      const { result } = renderHook(() => useI18n());

      await act(async () => {
        await result.current.changeLanguage('pt-BR');
      });

      expect(mockChangeLanguage).toHaveBeenCalledWith('pt-BR');
      expect((i18nConfig.switchLanguage as jest.MockedFunction<typeof i18nConfig.switchLanguage>)).toHaveBeenCalledWith('pt-BR');
    });

    it('should handle language switching with namespace loading', async () => {
      const { result } = renderHook(() => useI18n());

      await act(async () => {
        await result.current.changeLanguage('pt-BR', { namespace: 'common' });
      });

      expect(mockChangeLanguage).toHaveBeenCalledWith('pt-BR');
      expect((i18nConfig.switchLanguage as jest.MockedFunction<typeof i18nConfig.switchLanguage>)).toHaveBeenCalledWith('pt-BR');
      expect(mockLoadNamespaces).toHaveBeenCalledWith(['common']);
    });

    it('should validate language codes before switching', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const { result } = renderHook(() => useI18n());

      // Test various invalid inputs
      await act(async () => {
        await result.current.changeLanguage(null as any);
        await result.current.changeLanguage(undefined as any);
        await result.current.changeLanguage('');
        await result.current.changeLanguage('   ');
      });

      expect(consoleErrorSpy).toHaveBeenCalledTimes(4);
      expect(mockChangeLanguage).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle language switching errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockChangeLanguage.mockRejectedValueOnce(new Error('Language switch failed'));
      
      const { result } = renderHook(() => useI18n());

      await act(async () => {
        await result.current.changeLanguage('invalid-lang');
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to change language:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
      mockChangeLanguage.mockResolvedValue(undefined); // Reset mock
    });

    it('should handle concurrent language changes', async () => {
      const { result } = renderHook(() => useI18n());

      const promises = [
        result.current.changeLanguage('pt-BR'),
        result.current.changeLanguage('es'),
        result.current.changeLanguage('en')
      ];

      await act(async () => {
        await Promise.all(promises);
      });

      expect(mockChangeLanguage).toHaveBeenCalledTimes(3);
      expect(mockChangeLanguage).toHaveBeenCalledWith('pt-BR');
      expect(mockChangeLanguage).toHaveBeenCalledWith('es');
      expect(mockChangeLanguage).toHaveBeenCalledWith('en');
    });

    it('should handle network errors during language switching', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const networkError = new Error('Network timeout');
      (i18nConfig.switchLanguage as jest.MockedFunction<typeof i18nConfig.switchLanguage>).mockRejectedValueOnce(networkError);
      
      const { result } = renderHook(() => useI18n());

      await act(async () => {
        await result.current.changeLanguage('pt-BR');
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to change language:',
        networkError
      );

      consoleErrorSpy.mockRestore();
      (i18nConfig.switchLanguage as jest.MockedFunction<typeof i18nConfig.switchLanguage>).mockResolvedValue(undefined); // Reset mock
    });
  });

  describe('Namespace Management', () => {
    it('should load single namespace', async () => {
      const { result } = renderHook(() => useI18n());

      await act(async () => {
        await result.current.loadNamespace('common');
      });

      expect(mockLoadNamespaces).toHaveBeenCalledWith(['common']);
    });

    it('should load multiple namespaces', async () => {
      const { result } = renderHook(() => useI18n());

      await act(async () => {
        await result.current.loadNamespace(['common', 'forms', 'errors']);
      });

      expect(mockLoadNamespaces).toHaveBeenCalledWith(['common', 'forms', 'errors']);
    });

    it('should handle namespace loading errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockLoadNamespaces.mockRejectedValueOnce(new Error('Namespace loading failed'));
      
      const { result } = renderHook(() => useI18n());

      await act(async () => {
        await result.current.loadNamespace('invalid-namespace');
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load namespace:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
      mockLoadNamespaces.mockResolvedValue(undefined); // Reset mock
    });

    it('should return current namespace', () => {
      const { result } = renderHook(() => useI18n());

      const namespace = result.current.getCurrentNamespace();
      
      expect(namespace).toBe('translation');
    });

    it('should handle empty namespace arrays', async () => {
      const { result } = renderHook(() => useI18n());

      await act(async () => {
        await result.current.loadNamespace([]);
      });

      expect(mockLoadNamespaces).toHaveBeenCalledWith([]);
    });

    it('should handle special characters in namespace names', async () => {
      const { result } = renderHook(() => useI18n());

      await act(async () => {
        await result.current.loadNamespace('special-chars_123');
      });

      expect(mockLoadNamespaces).toHaveBeenCalledWith(['special-chars_123']);
    });
  });

  describe('Resource and Translation Management', () => {
    it('should get available translations for default namespace', () => {
      mockGetResourceBundle.mockReturnValue({
        'key1': 'Value 1',
        'key2': 'Value 2',
        'nested.key': 'Nested Value'
      });
      
      const { result } = renderHook(() => useI18n());

      const translations = result.current.getAvailableTranslations();
      
      expect(translations).toEqual(['key1', 'key2', 'nested.key']);
      expect(mockGetResourceBundle).toHaveBeenCalledWith('en', 'translation');
    });

    it('should get available translations for specific namespace', () => {
      mockGetResourceBundle.mockReturnValue({
        'button.save': 'Save',
        'button.cancel': 'Cancel',
        'button.delete': 'Delete'
      });
      
      const { result } = renderHook(() => useI18n());

      const translations = result.current.getAvailableTranslations('common');
      
      expect(translations).toEqual(['button.save', 'button.cancel', 'button.delete']);
      expect(mockGetResourceBundle).toHaveBeenCalledWith('en', 'common');
    });

    it('should handle missing resource bundles gracefully', () => {
      mockGetResourceBundle.mockReturnValue(null);
      
      const { result } = renderHook(() => useI18n());

      const translations = result.current.getAvailableTranslations();
      
      expect(translations).toEqual([]);
    });

    it('should handle empty resource bundles', () => {
      mockGetResourceBundle.mockReturnValue({});
      
      const { result } = renderHook(() => useI18n());

      const translations = result.current.getAvailableTranslations();
      
      expect(translations).toEqual([]);
    });

    it('should check translation existence correctly', () => {
      mockExists.mockReturnValue(true);
      
      const { result } = renderHook(() => useI18n());

      const exists = result.current.hasTranslation('test.key');
      
      expect(exists).toBe(true);
      expect(mockExists).toHaveBeenCalledWith('test.key');
      
      mockExists.mockReturnValue(false);
      const notExists = result.current.hasTranslation('nonexistent.key');
      expect(notExists).toBe(false);
    });

    it('should handle translation existence check errors', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockExists.mockImplementation(() => {
        throw new Error('Existence check failed');
      });
      
      const { result } = renderHook(() => useI18n());

      // Should not throw but return false or handle gracefully
      let exists;
      expect(() => {
        exists = result.current.hasTranslation('test.key');
      }).not.toThrow();
      
      expect(exists).toBeDefined();
      
      consoleErrorSpy.mockRestore();
      mockExists.mockReturnValue(true); // Reset mock
    });
  });

  describe('State Management and Lifecycle', () => {
    it('should reflect i18n initialization state', () => {
      mockI18nInstance.isInitialized = true;
      
      const { result } = renderHook(() => useI18n());

      expect(result.current.isReady).toBe(true);
    });

    it('should handle not initialized state', () => {
      mockI18nInstance.isInitialized = false;
      
      const { result, rerender } = renderHook(() => useI18n());

      expect(result.current.isReady).toBe(false);

      // Simulate initialization
      mockI18nInstance.isInitialized = true;
      rerender();

      expect(result.current.isReady).toBe(true);
    });

    it('should handle language changes from external sources', () => {
      const { result, rerender } = renderHook(() => useI18n());

      expect(result.current.language).toBe('en');

      // Simulate external language change
      mockI18nInstance.language = 'pt-BR';
      rerender();

      expect(result.current.language).toBe('pt-BR');
    });

    it('should maintain consistent state during rapid re-renders', () => {
      const { result, rerender } = renderHook(() => useI18n());

      const initialState = {
        language: result.current.language,
        isReady: result.current.isReady,
        isLoading: result.current.isLoading
      };

      // Rapid re-renders
      for (let i = 0; i < 10; i++) {
        rerender();
      }

      expect(result.current.language).toBe(initialState.language);
      expect(result.current.isReady).toBe(initialState.isReady);
      expect(result.current.isLoading).toBe(initialState.isLoading);
    });
  });

  describe('Performance and Memory Management', () => {
    it('should handle frequent translation calls efficiently', () => {
      const { result } = renderHook(() => useI18n());

      // Call translation function many times
      const translations = [];
      for (let i = 0; i < 100; i++) {
        translations.push(result.current.t(`key.${i}`));
      }

      expect(translations.length).toBe(100);
      expect(mockT).toHaveBeenCalledTimes(100);
    });

    it('should not cause memory leaks with hook cleanup', () => {
      const { result, unmount } = renderHook(() => useI18n());

      // Use the hook
      result.current.t('test.key');
      result.current.getAvailableTranslations();

      // Should not throw during cleanup
      expect(() => unmount()).not.toThrow();
    });

    it('should maintain function reference stability for performance optimization', () => {
      const { result, rerender } = renderHook(() => useI18n());

      const functions = [
        result.current.changeLanguage,
        result.current.loadNamespace,
        result.current.getAvailableTranslations,
        result.current.hasTranslation,
        result.current.getCurrentNamespace
      ];

      // Multiple re-renders
      for (let i = 0; i < 5; i++) {
        rerender();
      }

      // Functions should maintain references
      expect(result.current.changeLanguage).toBe(functions[0]);
      expect(result.current.loadNamespace).toBe(functions[1]);
      expect(result.current.getAvailableTranslations).toBe(functions[2]);
      expect(result.current.hasTranslation).toBe(functions[3]);
      expect(result.current.getCurrentNamespace).toBe(functions[4]);
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle malformed translation keys gracefully', () => {
      const { result } = renderHook(() => useI18n());

      const malformedKeys = [
        '',
        '   ',
        '.key',
        'key.',
        '..key..',
        'key..subkey',
        null,
        undefined,
        123,
        {},
        []
      ];

      malformedKeys.forEach(key => {
        expect(() => {
          result.current.t(key as any);
        }).not.toThrow();
      });
    });

    it('should handle resource bundle errors gracefully', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockGetResourceBundle.mockImplementation(() => {
        throw new Error('Resource bundle error');
      });
      
      const { result } = renderHook(() => useI18n());

      let translations;
      expect(() => {
        translations = result.current.getAvailableTranslations();
      }).not.toThrow();
      
      expect(translations).toEqual([]);
      
      consoleErrorSpy.mockRestore();
      mockGetResourceBundle.mockReturnValue({}); // Reset mock
    });

    it('should handle i18n instance errors', () => {
      const originalChangeLanguage = mockI18nInstance.changeLanguage;
      mockI18nInstance.changeLanguage = undefined as any;
      
      const { result } = renderHook(() => useI18n());

      expect(() => {
        result.current.changeLanguage('pt-BR');
      }).not.toThrow();

      mockI18nInstance.changeLanguage = originalChangeLanguage; // Restore
    });

    it('should handle corrupted language data', () => {
      mockI18nInstance.language = null as any;
      
      const { result } = renderHook(() => useI18n());

      expect(result.current.language).toBeNull();
      expect(result.current.supportedLanguages).toEqual(['en', 'pt-BR']);
    });

    it('should handle invalid namespace types in loadNamespace', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const { result } = renderHook(() => useI18n());

      await act(async () => {
        await result.current.loadNamespace(null as any);
        await result.current.loadNamespace(undefined as any);
        await result.current.loadNamespace(123 as any);
      });

      // Should handle gracefully and not crash
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle resource bundle exceptions during getAvailableTranslations', () => {
      mockGetResourceBundle.mockImplementation(() => {
        throw new Error('Resource access failed');
      });
      
      const { result } = renderHook(() => useI18n());

      expect(() => {
        const translations = result.current.getAvailableTranslations('problematic-namespace');
        expect(translations).toEqual([]);
      }).not.toThrow();
    });
  });

  describe('Integration and Real-world Scenarios', () => {
    it('should handle rapid language switching', async () => {
      const { result } = renderHook(() => useI18n());

      // Simulate rapid user clicks on language switcher
      const languageChanges = ['pt-BR', 'en', 'es', 'en', 'pt-BR'];
      
      for (const lang of languageChanges) {
        await act(async () => {
          await result.current.changeLanguage(lang);
        });
      }

      expect(mockChangeLanguage).toHaveBeenCalledTimes(languageChanges.length);
      expect((i18nConfig.switchLanguage as jest.MockedFunction<typeof i18nConfig.switchLanguage>)).toHaveBeenCalledTimes(languageChanges.length);
    });

    it('should handle namespace loading during language change', async () => {
      const { result } = renderHook(() => useI18n());

      await act(async () => {
        await result.current.changeLanguage('pt-BR', { namespace: 'forms' });
      });

      expect(mockLoadNamespaces).toHaveBeenCalledWith(['forms']);
      expect(mockChangeLanguage).toHaveBeenCalledWith('pt-BR');
    });

    it('should maintain consistency during async operations', async () => {
      const { result } = renderHook(() => useI18n());

      const initialLanguage = result.current.language;
      const initialReady = result.current.isReady;

      // Start async operations
      const langChangePromise = result.current.changeLanguage('pt-BR');
      const namespaceLoadPromise = result.current.loadNamespace('common');

      // State should remain consistent during async operations
      expect(result.current.language).toBe(initialLanguage);
      expect(result.current.isReady).toBe(initialReady);

      await act(async () => {
        await Promise.all([langChangePromise, namespaceLoadPromise]);
      });

      // Operations should have completed
      expect(mockChangeLanguage).toHaveBeenCalled();
      expect(mockLoadNamespaces).toHaveBeenCalled();
    });

    it('should handle translation with deeply nested interpolation', () => {
      mockT.mockImplementation((key, options) => {
        if (key === 'deep.interpolation' && options) {
          return `Welcome ${options.user.profile.name} to ${options.app.name} (${options.app.version})`;
        }
        return `translated_${key}`;
      });

      const { result } = renderHook(() => useI18n());

      const translation = result.current.t('deep.interpolation', {
        user: {
          profile: {
            name: 'John Doe'
          }
        },
        app: {
          name: 'Jung Edu App',
          version: 'v1.0.0'
        }
      });

      expect(translation).toBe('Welcome John Doe to Jung Edu App (v1.0.0)');
    });

    it('should handle multiple simultaneous namespace loads', async () => {
      const { result } = renderHook(() => useI18n());

      const namespaces = ['forms', 'errors', 'common', 'navigation'];
      const promises = namespaces.map(ns => result.current.loadNamespace(ns));

      await act(async () => {
        await Promise.all(promises);
      });

      expect(mockLoadNamespaces).toHaveBeenCalledTimes(namespaces.length);
      namespaces.forEach(ns => {
        expect(mockLoadNamespaces).toHaveBeenCalledWith([ns]);
      });
    });
  });
});