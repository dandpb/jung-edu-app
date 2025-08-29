/**
 * useI18n Hook - Comprehensive Tests
 * Tests covering all hook functionality including language switching,
 * namespace management, resource loading, and error handling
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useI18n } from '../useI18n';
import { switchLanguage } from '../../config/i18n';

// Mock react-i18next
const mockChangeLanguage = jest.fn();
const mockLoadNamespaces = jest.fn();
const mockExists = jest.fn();
const mockGetResourceBundle = jest.fn();
const mockT = jest.fn();

const mockI18n = {
  language: 'en',
  isInitialized: true,
  changeLanguage: mockChangeLanguage,
  loadNamespaces: mockLoadNamespaces,
  exists: mockExists,
  getResourceBundle: mockGetResourceBundle
};

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
    i18n: mockI18n,
    ready: true
  })
}));

// Mock i18n config
jest.mock('../../config/i18n', () => ({
  switchLanguage: jest.fn().mockResolvedValue(undefined)
}));

const mockSwitchLanguage = switchLanguage as jest.MockedFunction<typeof switchLanguage>;

describe('useI18n Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mocks to default states
    mockI18n.language = 'en';
    mockI18n.isInitialized = true;
    mockChangeLanguage.mockResolvedValue(undefined);
    mockLoadNamespaces.mockResolvedValue(undefined);
    mockExists.mockReturnValue(true);
    mockGetResourceBundle.mockReturnValue({ key1: 'value1', key2: 'value2' });
    mockT.mockImplementation((key: string) => `translated_${key}`);
    mockSwitchLanguage.mockResolvedValue(undefined);
  });

  describe('Basic Hook Interface', () => {
    it('should return all expected properties and methods', () => {
      const { result } = renderHook(() => useI18n());

      expect(result.current).toHaveProperty('t');
      expect(result.current).toHaveProperty('language');
      expect(result.current).toHaveProperty('supportedLanguages');
      expect(result.current).toHaveProperty('changeLanguage');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('isReady');
      expect(result.current).toHaveProperty('getAvailableTranslations');
      expect(result.current).toHaveProperty('hasTranslation');
      expect(result.current).toHaveProperty('getCurrentNamespace');
      expect(result.current).toHaveProperty('loadNamespace');

      expect(typeof result.current.t).toBe('function');
      expect(typeof result.current.changeLanguage).toBe('function');
      expect(typeof result.current.getAvailableTranslations).toBe('function');
      expect(typeof result.current.hasTranslation).toBe('function');
      expect(typeof result.current.getCurrentNamespace).toBe('function');
      expect(typeof result.current.loadNamespace).toBe('function');
    });

    it('should return current language', () => {
      const { result } = renderHook(() => useI18n());

      expect(result.current.language).toBe('en');
    });

    it('should return supported languages', () => {
      const { result } = renderHook(() => useI18n());

      expect(result.current.supportedLanguages).toEqual(['en', 'pt-BR']);
    });

    it('should return ready state correctly', () => {
      const { result } = renderHook(() => useI18n());

      expect(result.current.isReady).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Translation Function', () => {
    it('should forward translation calls to i18next', () => {
      const { result } = renderHook(() => useI18n());

      const translationKey = 'hello.world';
      const options = { name: 'test' };

      result.current.t(translationKey, options);

      expect(mockT).toHaveBeenCalledWith(translationKey, options);
    });
  });

  describe('Language Change Functionality', () => {
    it('should change language successfully', async () => {
      const { result } = renderHook(() => useI18n());

      await act(async () => {
        await result.current.changeLanguage('pt-BR');
      });

      expect(mockChangeLanguage).toHaveBeenCalledWith('pt-BR');
      expect(mockSwitchLanguage).toHaveBeenCalledWith('pt-BR');
    });

    it('should change language with namespace option', async () => {
      const { result } = renderHook(() => useI18n());

      await act(async () => {
        await result.current.changeLanguage('pt-BR', { namespace: 'admin' });
      });

      expect(mockChangeLanguage).toHaveBeenCalledWith('pt-BR');
      expect(mockSwitchLanguage).toHaveBeenCalledWith('pt-BR');
      expect(mockLoadNamespaces).toHaveBeenCalledWith(['admin']);
    });

    it('should validate language code before change', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const { result } = renderHook(() => useI18n());

      // Test invalid language codes
      await act(async () => {
        await result.current.changeLanguage('');
      });

      await act(async () => {
        await result.current.changeLanguage('   ');
      });

      await act(async () => {
        await result.current.changeLanguage(null as any);
      });

      await act(async () => {
        await result.current.changeLanguage(undefined as any);
      });

      expect(consoleSpy).toHaveBeenCalledTimes(4);
      expect(mockChangeLanguage).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle language change errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Language change failed');
      mockChangeLanguage.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useI18n());

      await act(async () => {
        await result.current.changeLanguage('pt-BR');
      });

      expect(consoleSpy).toHaveBeenCalledWith('Failed to change language:', error);

      consoleSpy.mockRestore();
    });
  });

  describe('Namespace Management', () => {
    it('should load single namespace', async () => {
      const { result } = renderHook(() => useI18n());

      await act(async () => {
        await result.current.loadNamespace('admin');
      });

      expect(mockLoadNamespaces).toHaveBeenCalledWith(['admin']);
    });

    it('should load multiple namespaces', async () => {
      const { result } = renderHook(() => useI18n());

      await act(async () => {
        await result.current.loadNamespace(['admin', 'user', 'common']);
      });

      expect(mockLoadNamespaces).toHaveBeenCalledWith(['admin', 'user', 'common']);
    });

    it('should handle namespace loading errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Failed to load namespace');
      mockLoadNamespaces.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useI18n());

      await act(async () => {
        await result.current.loadNamespace('admin');
      });

      expect(consoleSpy).toHaveBeenCalledWith('Failed to load namespace:', error);

      consoleSpy.mockRestore();
    });

    it('should return current namespace', () => {
      const { result } = renderHook(() => useI18n());

      const namespace = result.current.getCurrentNamespace();

      expect(namespace).toBe('translation');
    });
  });

  describe('Resource Management', () => {
    it('should get available translations for default namespace', () => {
      mockGetResourceBundle.mockReturnValue({
        'key1': 'value1',
        'key2': 'value2',
        'nested.key': 'nested value'
      });

      const { result } = renderHook(() => useI18n());

      const translations = result.current.getAvailableTranslations();

      expect(mockGetResourceBundle).toHaveBeenCalledWith('en', 'translation');
      expect(translations).toEqual(['key1', 'key2', 'nested.key']);
    });

    it('should get available translations for specific namespace', () => {
      mockGetResourceBundle.mockReturnValue({
        'admin.key1': 'admin value1',
        'admin.key2': 'admin value2'
      });

      const { result } = renderHook(() => useI18n());

      const translations = result.current.getAvailableTranslations('admin');

      expect(mockGetResourceBundle).toHaveBeenCalledWith('en', 'admin');
      expect(translations).toEqual(['admin.key1', 'admin.key2']);
    });

    it('should return empty array when no resource bundle exists', () => {
      mockGetResourceBundle.mockReturnValue(null);

      const { result } = renderHook(() => useI18n());

      const translations = result.current.getAvailableTranslations();

      expect(translations).toEqual([]);
    });

    it('should check if translation exists', () => {
      mockExists.mockReturnValue(true);

      const { result } = renderHook(() => useI18n());

      const exists = result.current.hasTranslation('test.key');

      expect(mockExists).toHaveBeenCalledWith('test.key');
      expect(exists).toBe(true);
    });

    it('should return false for non-existent translation', () => {
      mockExists.mockReturnValue(false);

      const { result } = renderHook(() => useI18n());

      const exists = result.current.hasTranslation('non.existent.key');

      expect(exists).toBe(false);
    });
  });

  describe('State Management', () => {
    it('should reflect i18n initialization state', () => {
      mockI18n.isInitialized = false;

      const { result } = renderHook(() => useI18n());

      expect(result.current.isReady).toBe(false);
    });

    it('should update when language changes', () => {
      const { result, rerender } = renderHook(() => useI18n());

      expect(result.current.language).toBe('en');

      // Simulate language change in i18n
      mockI18n.language = 'pt-BR';
      rerender();

      expect(result.current.language).toBe('pt-BR');
    });

    it('should maintain consistent loading state', () => {
      const { result } = renderHook(() => useI18n());

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle i18n not ready state', () => {
      jest.doMock('react-i18next', () => ({
        useTranslation: () => ({
          t: mockT,
          i18n: mockI18n,
          ready: false
        })
      }));

      // Re-import to get the mocked version
      const { useI18n: useI18nMocked } = require('../useI18n');
      const { result } = renderHook(() => useI18nMocked());

      expect(result.current.isReady).toBe(false);
    });

    it('should handle undefined resource bundles gracefully', () => {
      mockGetResourceBundle.mockReturnValue(undefined);

      const { result } = renderHook(() => useI18n());

      const translations = result.current.getAvailableTranslations();

      expect(translations).toEqual([]);
    });

    it('should handle i18n errors in exists check', () => {
      mockExists.mockImplementation(() => {
        throw new Error('i18n error');
      });

      const { result } = renderHook(() => useI18n());

      // Should not throw, should handle gracefully
      expect(() => {
        result.current.hasTranslation('test.key');
      }).not.toThrow();
    });
  });

  describe('Integration Scenarios', () => {
    it('should work with real-world language switching workflow', async () => {
      const { result } = renderHook(() => useI18n());

      // Initial state
      expect(result.current.language).toBe('en');
      expect(result.current.isReady).toBe(true);

      // Change to Portuguese
      await act(async () => {
        await result.current.changeLanguage('pt-BR');
      });

      expect(mockChangeLanguage).toHaveBeenCalledWith('pt-BR');
      expect(mockSwitchLanguage).toHaveBeenCalledWith('pt-BR');

      // Load admin namespace
      await act(async () => {
        await result.current.loadNamespace('admin');
      });

      expect(mockLoadNamespaces).toHaveBeenCalledWith(['admin']);

      // Check translations
      const hasTranslation = result.current.hasTranslation('admin.title');
      expect(mockExists).toHaveBeenCalledWith('admin.title');
    });

    it('should handle complex namespace and language operations', async () => {
      const { result } = renderHook(() => useI18n());

      // Change language with namespace
      await act(async () => {
        await result.current.changeLanguage('pt-BR', { namespace: 'user' });
      });

      // Load additional namespaces
      await act(async () => {
        await result.current.loadNamespace(['common', 'errors']);
      });

      // Get translations for different namespaces
      result.current.getAvailableTranslations('user');
      result.current.getAvailableTranslations('common');

      expect(mockGetResourceBundle).toHaveBeenCalledWith('pt-BR', 'user');
      expect(mockGetResourceBundle).toHaveBeenCalledWith('pt-BR', 'common');
    });
  });

  describe('Performance Considerations', () => {
    it('should not recreate functions on every render', () => {
      const { result, rerender } = renderHook(() => useI18n());

      const firstChangeLanguage = result.current.changeLanguage;
      const firstLoadNamespace = result.current.loadNamespace;
      const firstGetAvailableTranslations = result.current.getAvailableTranslations;
      const firstHasTranslation = result.current.hasTranslation;

      rerender();

      expect(result.current.changeLanguage).toBe(firstChangeLanguage);
      expect(result.current.loadNamespace).toBe(firstLoadNamespace);
      expect(result.current.getAvailableTranslations).toBe(firstGetAvailableTranslations);
      expect(result.current.hasTranslation).toBe(firstHasTranslation);
    });

    it('should handle rapid language changes efficiently', async () => {
      const { result } = renderHook(() => useI18n());

      // Rapid language changes
      await act(async () => {
        const promises = [
          result.current.changeLanguage('pt-BR'),
          result.current.changeLanguage('es'),
          result.current.changeLanguage('fr')
        ];
        await Promise.all(promises);
      });

      expect(mockChangeLanguage).toHaveBeenCalledTimes(3);
      expect(mockSwitchLanguage).toHaveBeenCalledTimes(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty translation keys', () => {
      const { result } = renderHook(() => useI18n());

      result.current.hasTranslation('');
      result.current.hasTranslation('   ');

      expect(mockExists).toHaveBeenCalledWith('');
      expect(mockExists).toHaveBeenCalledWith('   ');
    });

    it('should handle null/undefined in getAvailableTranslations', () => {
      mockGetResourceBundle.mockReturnValue(null);

      const { result } = renderHook(() => useI18n());

      const translations1 = result.current.getAvailableTranslations();
      const translations2 = result.current.getAvailableTranslations(null as any);
      const translations3 = result.current.getAvailableTranslations(undefined as any);

      expect(translations1).toEqual([]);
      expect(translations2).toEqual([]);
      expect(translations3).toEqual([]);
    });

    it('should handle concurrent namespace loading', async () => {
      const { result } = renderHook(() => useI18n());

      await act(async () => {
        const promises = [
          result.current.loadNamespace('ns1'),
          result.current.loadNamespace(['ns2', 'ns3']),
          result.current.loadNamespace('ns4')
        ];
        await Promise.all(promises);
      });

      expect(mockLoadNamespaces).toHaveBeenCalledTimes(3);
      expect(mockLoadNamespaces).toHaveBeenCalledWith(['ns1']);
      expect(mockLoadNamespaces).toHaveBeenCalledWith(['ns2', 'ns3']);
      expect(mockLoadNamespaces).toHaveBeenCalledWith(['ns4']);
    });
  });
});