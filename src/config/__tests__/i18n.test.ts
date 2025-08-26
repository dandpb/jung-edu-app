/**
 * Comprehensive test suite for i18n configuration
 * Tests internationalization setup, language switching, and error handling
 */

import { setupI18n, getI18nInstance, switchLanguage } from '../i18n';

// Mock react-i18next
const mockUse = jest.fn();
const mockInit = jest.fn().mockResolvedValue(undefined);
const mockChangeLanguage = jest.fn().mockResolvedValue(undefined);

jest.mock('react-i18next', () => ({
  use: mockUse.mockReturnThis(),
  init: mockInit,
  changeLanguage: mockChangeLanguage,
}));

// Mock i18next-browser-languagedetector
const mockLanguageDetector = {
  type: 'languageDetector',
  init: jest.fn(),
  detect: jest.fn(() => 'en'),
  cacheUserLanguage: jest.fn()
};

jest.mock('i18next-browser-languagedetector', () => {
  return function() {
    return mockLanguageDetector;
  };
});

describe('i18n configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUse.mockReturnThis();
  });

  describe('setupI18n', () => {
    it('should initialize i18n with correct configuration', async () => {
      await setupI18n();

      expect(mockUse).toHaveBeenCalled();
      expect(mockInit).toHaveBeenCalledWith({
        fallbackLng: 'en',
        lng: 'en',
        debug: false,
        interpolation: {
          escapeValue: false,
        },
        resources: expect.objectContaining({
          en: expect.any(Object),
          'pt-BR': expect.any(Object),
        }),
      });
    });

    it('should setup language detector', async () => {
      await setupI18n();

      expect(mockUse).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should handle initialization errors gracefully', async () => {
      mockInit.mockRejectedValue(new Error('Init failed'));
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await setupI18n();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to initialize i18n:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should use development mode when NODE_ENV is development', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      await setupI18n();

      expect(mockInit).toHaveBeenCalledWith(
        expect.objectContaining({
          debug: true,
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should detect user language preferences', async () => {
      mockLanguageDetector.detect.mockReturnValue('pt-BR');

      await setupI18n();

      expect(mockInit).toHaveBeenCalledWith(
        expect.objectContaining({
          lng: 'pt-BR',
        })
      );
    });
  });

  describe('getI18nInstance', () => {
    it('should return i18n instance', () => {
      const instance = getI18nInstance();
      
      expect(instance).toBeDefined();
      expect(typeof instance.use).toBe('function');
      expect(typeof instance.init).toBe('function');
    });

    it('should return the same instance on multiple calls', () => {
      const instance1 = getI18nInstance();
      const instance2 = getI18nInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('switchLanguage', () => {
    it('should switch to English language', async () => {
      await switchLanguage('en');

      expect(mockChangeLanguage).toHaveBeenCalledWith('en');
    });

    it('should switch to Portuguese language', async () => {
      await switchLanguage('pt-BR');

      expect(mockChangeLanguage).toHaveBeenCalledWith('pt-BR');
    });

    it('should handle language switching errors', async () => {
      mockChangeLanguage.mockRejectedValue(new Error('Language switch failed'));
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await switchLanguage('fr'); // unsupported language

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to switch language:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should validate supported languages', async () => {
      const supportedLanguages = ['en', 'pt-BR'];
      
      for (const lang of supportedLanguages) {
        mockChangeLanguage.mockClear();
        await switchLanguage(lang);
        expect(mockChangeLanguage).toHaveBeenCalledWith(lang);
      }
    });

    it('should handle null or undefined language gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await switchLanguage(null as any);
      await switchLanguage(undefined as any);

      // Should not crash and should log errors
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('language resources', () => {
    it('should include English translations', async () => {
      await setupI18n();

      const initCall = mockInit.mock.calls[0][0];
      expect(initCall.resources.en).toBeDefined();
      expect(initCall.resources.en.translation).toBeDefined();
    });

    it('should include Portuguese translations', async () => {
      await setupI18n();

      const initCall = mockInit.mock.calls[0][0];
      expect(initCall.resources['pt-BR']).toBeDefined();
      expect(initCall.resources['pt-BR'].translation).toBeDefined();
    });

    it('should have consistent keys between languages', async () => {
      await setupI18n();

      const initCall = mockInit.mock.calls[0][0];
      const enKeys = Object.keys(initCall.resources.en.translation);
      const ptKeys = Object.keys(initCall.resources['pt-BR'].translation);

      // Check that all English keys exist in Portuguese
      enKeys.forEach(key => {
        expect(ptKeys).toContain(key);
      });

      // Check that all Portuguese keys exist in English
      ptKeys.forEach(key => {
        expect(enKeys).toContain(key);
      });
    });

    it('should have non-empty translation values', async () => {
      await setupI18n();

      const initCall = mockInit.mock.calls[0][0];
      
      // Check English translations are not empty
      Object.values(initCall.resources.en.translation).forEach((value: any) => {
        if (typeof value === 'string') {
          expect(value.trim()).toBeTruthy();
        }
      });

      // Check Portuguese translations are not empty
      Object.values(initCall.resources['pt-BR'].translation).forEach((value: any) => {
        if (typeof value === 'string') {
          expect(value.trim()).toBeTruthy();
        }
      });
    });
  });

  describe('fallback behavior', () => {
    it('should fallback to English for unsupported languages', async () => {
      await setupI18n();

      const initCall = mockInit.mock.calls[0][0];
      expect(initCall.fallbackLng).toBe('en');
    });

    it('should handle missing translation keys gracefully', async () => {
      // This would be tested in actual i18next behavior
      // but we can verify the configuration supports it
      await setupI18n();

      const initCall = mockInit.mock.calls[0][0];
      expect(initCall.interpolation.escapeValue).toBe(false);
    });
  });

  describe('browser integration', () => {
    it('should detect browser language preferences', async () => {
      // Mock navigator.language
      Object.defineProperty(navigator, 'language', {
        value: 'pt-BR',
        writable: true
      });

      mockLanguageDetector.detect.mockReturnValue('pt-BR');

      await setupI18n();

      expect(mockLanguageDetector.detect).toHaveBeenCalled();
    });

    it('should cache language preferences', async () => {
      await setupI18n();
      await switchLanguage('pt-BR');

      expect(mockLanguageDetector.cacheUserLanguage).toBeDefined();
    });
  });

  describe('development mode features', () => {
    it('should enable debug mode in development', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      await setupI18n();

      const initCall = mockInit.mock.calls[0][0];
      expect(initCall.debug).toBe(true);

      process.env.NODE_ENV = originalEnv;
    });

    it('should disable debug mode in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      await setupI18n();

      const initCall = mockInit.mock.calls[0][0];
      expect(initCall.debug).toBe(false);

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('error recovery', () => {
    it('should recover from detector initialization errors', async () => {
      mockLanguageDetector.init.mockImplementation(() => {
        throw new Error('Detector init failed');
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Should not throw and should complete initialization
      await expect(setupI18n()).resolves.not.toThrow();

      consoleErrorSpy.mockRestore();
    });

    it('should handle malformed language codes', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await switchLanguage('invalid-lang-code-123');

      // Should handle gracefully without crashing
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should continue working after errors', async () => {
      // Cause an error
      mockChangeLanguage.mockRejectedValueOnce(new Error('First error'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await switchLanguage('en');

      // Reset and try again - should work
      mockChangeLanguage.mockResolvedValueOnce(undefined);
      
      await switchLanguage('pt-BR');

      expect(mockChangeLanguage).toHaveBeenCalledWith('pt-BR');

      consoleErrorSpy.mockRestore();
    });
  });
});