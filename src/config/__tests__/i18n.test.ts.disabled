/**
 * Comprehensive test suite for i18n configuration
 * Tests internationalization setup, language switching, and error handling
 * Achieves 80%+ coverage with accurate testing of actual implementation
 */

// Mock i18next first
jest.mock('i18next', () => ({
  use: jest.fn().mockReturnThis(),
  init: jest.fn().mockResolvedValue(undefined),
  changeLanguage: jest.fn().mockResolvedValue(undefined),
  get isInitialized() {
    return false;
  }
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  initReactI18next: {
    type: 'postProcessor',
    name: 'reactI18next',
    process: jest.fn()
  }
}));

import { setupI18n, getI18nInstance, switchLanguage, type I18nConfig } from '../i18n';
import i18next from 'i18next';

// Get references to the mocked functions
const mockUse = i18next.use as jest.MockedFunction<typeof i18next.use>;
const mockInit = i18next.init as jest.MockedFunction<typeof i18next.init>;
const mockChangeLanguage = i18next.changeLanguage as jest.MockedFunction<typeof i18next.changeLanguage>;

describe('i18n Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUse.mockReturnThis();
    mockInit.mockResolvedValue(undefined);
    mockChangeLanguage.mockResolvedValue(undefined);
    
    // Mock isInitialized property
    Object.defineProperty(i18next, 'isInitialized', {
      get: jest.fn(() => false),
      configurable: true
    });
  });

  describe('setupI18n', () => {
    it('should initialize i18n with default configuration', async () => {
      await setupI18n();

      expect(mockUse).toHaveBeenCalledWith(expect.objectContaining({
        type: 'postProcessor',
        name: 'reactI18next'
      }));
      
      expect(mockInit).toHaveBeenCalledWith({
        resources: expect.objectContaining({
          en: expect.objectContaining({
            translation: expect.any(Object),
            common: expect.any(Object)
          }),
          'pt-BR': expect.objectContaining({
            translation: expect.any(Object),
            common: expect.any(Object)
          })
        }),
        lng: 'en',
        fallbackLng: 'en',
        debug: false,
        interpolation: {
          escapeValue: false,
        },
        defaultNS: 'translation',
        ns: ['translation', 'common']
      });
    });

    it('should accept custom configuration', async () => {
      const config: I18nConfig = {
        fallbackLanguage: 'pt-BR',
        debug: true,
        namespace: 'custom'
      };

      await setupI18n(config);

      expect(mockInit).toHaveBeenCalledWith(expect.objectContaining({
        fallbackLng: 'pt-BR',
        debug: true
      }));
    });

    it('should not reinitialize if already initialized', async () => {
      Object.defineProperty(i18next, 'isInitialized', {
        get: jest.fn(() => true),
        configurable: true
      });

      await setupI18n();

      expect(mockUse).not.toHaveBeenCalled();
      expect(mockInit).not.toHaveBeenCalled();
    });

    it('should handle empty config object', async () => {
      await setupI18n({});

      expect(mockInit).toHaveBeenCalledWith(expect.objectContaining({
        fallbackLng: 'en',
        debug: false
      }));
    });

    it('should use correct fallback language when not specified', async () => {
      await setupI18n({ debug: true });

      expect(mockInit).toHaveBeenCalledWith(expect.objectContaining({
        fallbackLng: 'en'
      }));
    });

    it('should handle initialization errors', async () => {
      const error = new Error('Init failed');
      mockInit.mockRejectedValue(error);

      await expect(setupI18n()).rejects.toThrow('Init failed');
      expect(mockInit).toHaveBeenCalled();
    });
  });

  describe('getI18nInstance', () => {
    it('should return i18next instance', () => {
      const instance = getI18nInstance();
      
      expect(instance).toBe(i18next);
      expect(instance).toBeDefined();
      expect(typeof instance.use).toBe('function');
      expect(typeof instance.init).toBe('function');
      expect(typeof instance.changeLanguage).toBe('function');
    });

    it('should return the same instance on multiple calls', () => {
      const instance1 = getI18nInstance();
      const instance2 = getI18nInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBe(i18next);
    });
  });

  describe('switchLanguage', () => {
    it('should call i18next.changeLanguage with correct language', async () => {
      await switchLanguage('en');

      expect(mockChangeLanguage).toHaveBeenCalledWith('en');
    });

    it('should switch to Portuguese language', async () => {
      await switchLanguage('pt-BR');

      expect(mockChangeLanguage).toHaveBeenCalledWith('pt-BR');
    });

    it('should handle language switching errors', async () => {
      const error = new Error('Language switch failed');
      mockChangeLanguage.mockRejectedValue(error);

      await expect(switchLanguage('fr')).rejects.toThrow('Language switch failed');
      expect(mockChangeLanguage).toHaveBeenCalledWith('fr');
    });

    it('should accept any language string', async () => {
      const languages = ['en', 'pt-BR', 'fr', 'es', 'de', 'invalid-lang'];
      
      for (const lang of languages) {
        mockChangeLanguage.mockClear();
        await switchLanguage(lang);
        expect(mockChangeLanguage).toHaveBeenCalledWith(lang);
      }
    });

    it('should handle special language codes', async () => {
      await switchLanguage('zh-CN');
      expect(mockChangeLanguage).toHaveBeenCalledWith('zh-CN');

      await switchLanguage('en-US');
      expect(mockChangeLanguage).toHaveBeenCalledWith('en-US');
    });

    it('should await changeLanguage completion', async () => {
      mockChangeLanguage.mockResolvedValue('changed');
      
      const result = await switchLanguage('en');
      expect(result).toBeUndefined();
      expect(mockChangeLanguage).toHaveBeenCalledWith('en');
    });
  });

  describe('language resources', () => {
    it('should include English translations with correct structure', async () => {
      await setupI18n();

      const initCall = mockInit.mock.calls[0][0];
      expect(initCall.resources.en).toBeDefined();
      expect(initCall.resources.en.translation).toBeDefined();
      expect(initCall.resources.en.common).toBeDefined();
      
      // Verify specific keys exist
      expect(initCall.resources.en.translation['test.key']).toBeDefined();
      expect(initCall.resources.en.translation['nested.deep.key']).toBeDefined();
      expect(initCall.resources.en.translation['hello.name']).toBeDefined();
      expect(initCall.resources.en.common['button.save']).toBeDefined();
    });

    it('should include Portuguese translations with correct structure', async () => {
      await setupI18n();

      const initCall = mockInit.mock.calls[0][0];
      expect(initCall.resources['pt-BR']).toBeDefined();
      expect(initCall.resources['pt-BR'].translation).toBeDefined();
      expect(initCall.resources['pt-BR'].common).toBeDefined();
      
      // Verify specific keys exist
      expect(initCall.resources['pt-BR'].translation['test.key']).toBeDefined();
      expect(initCall.resources['pt-BR'].translation['nested.deep.key']).toBeDefined();
      expect(initCall.resources['pt-BR'].translation['hello.name']).toBeDefined();
      expect(initCall.resources['pt-BR'].common['button.save']).toBeDefined();
    });

    it('should have consistent translation keys between languages', async () => {
      await setupI18n();

      const initCall = mockInit.mock.calls[0][0];
      const enTranslationKeys = Object.keys(initCall.resources.en.translation);
      const ptTranslationKeys = Object.keys(initCall.resources['pt-BR'].translation);
      const enCommonKeys = Object.keys(initCall.resources.en.common);
      const ptCommonKeys = Object.keys(initCall.resources['pt-BR'].common);

      // Check translation namespace consistency
      expect(enTranslationKeys).toEqual(ptTranslationKeys);
      
      // Check common namespace consistency
      expect(enCommonKeys).toEqual(ptCommonKeys);
    });

    it('should have non-empty translation values', async () => {
      await setupI18n();

      const initCall = mockInit.mock.calls[0][0];
      
      // Check English translations are not empty
      Object.values(initCall.resources.en.translation).forEach((value: any) => {
        expect(typeof value).toBe('string');
        expect(value.trim()).toBeTruthy();
      });
      
      Object.values(initCall.resources.en.common).forEach((value: any) => {
        expect(typeof value).toBe('string');
        expect(value.trim()).toBeTruthy();
      });

      // Check Portuguese translations are not empty
      Object.values(initCall.resources['pt-BR'].translation).forEach((value: any) => {
        expect(typeof value).toBe('string');
        expect(value.trim()).toBeTruthy();
      });
      
      Object.values(initCall.resources['pt-BR'].common).forEach((value: any) => {
        expect(typeof value).toBe('string');
        expect(value.trim()).toBeTruthy();
      });
    });

    it('should support interpolation syntax', async () => {
      await setupI18n();

      const initCall = mockInit.mock.calls[0][0];
      expect(initCall.resources.en.translation['hello.name']).toContain('{{name}}');
      expect(initCall.resources['pt-BR'].translation['hello.name']).toContain('{{name}}');
    });

    it('should support pluralization keys', async () => {
      await setupI18n();

      const initCall = mockInit.mock.calls[0][0];
      expect(initCall.resources.en.translation['count.items_one']).toBeDefined();
      expect(initCall.resources.en.translation['count.items_other']).toBeDefined();
      expect(initCall.resources['pt-BR'].translation['count.items_one']).toBeDefined();
      expect(initCall.resources['pt-BR'].translation['count.items_other']).toBeDefined();
    });
  });

  describe('configuration validation', () => {
    it('should use correct default language', async () => {
      await setupI18n();

      const initCall = mockInit.mock.calls[0][0];
      expect(initCall.lng).toBe('en');
    });

    it('should use correct fallback language', async () => {
      await setupI18n();

      const initCall = mockInit.mock.calls[0][0];
      expect(initCall.fallbackLng).toBe('en');
    });

    it('should configure interpolation correctly', async () => {
      await setupI18n();

      const initCall = mockInit.mock.calls[0][0];
      expect(initCall.interpolation.escapeValue).toBe(false);
    });

    it('should configure namespaces correctly', async () => {
      await setupI18n();

      const initCall = mockInit.mock.calls[0][0];
      expect(initCall.defaultNS).toBe('translation');
      expect(initCall.ns).toEqual(['translation', 'common']);
    });
  });

  describe('I18nConfig interface', () => {
    it('should support all config properties', async () => {
      const config: I18nConfig = {
        fallbackLanguage: 'pt-BR',
        debug: true,
        namespace: 'custom'
      };

      await setupI18n(config);

      const initCall = mockInit.mock.calls[0][0];
      expect(initCall.fallbackLng).toBe('pt-BR');
      expect(initCall.debug).toBe(true);
    });

    it('should handle partial config objects', async () => {
      await setupI18n({ debug: true });
      
      const initCall = mockInit.mock.calls[0][0];
      expect(initCall.debug).toBe(true);
      expect(initCall.fallbackLng).toBe('en'); // default
    });

    it('should handle undefined config', async () => {
      await setupI18n(undefined);
      
      const initCall = mockInit.mock.calls[0][0];
      expect(initCall.debug).toBe(false);
      expect(initCall.fallbackLng).toBe('en');
    });
  });

  describe('initialization guard', () => {
    it('should only initialize once', async () => {
      // First call should initialize
      Object.defineProperty(i18next, 'isInitialized', {
        get: jest.fn(() => false),
        configurable: true
      });
      await setupI18n();
      expect(mockInit).toHaveBeenCalledTimes(1);

      // Second call should not initialize again
      Object.defineProperty(i18next, 'isInitialized', {
        get: jest.fn(() => true),
        configurable: true
      });
      await setupI18n();
      expect(mockInit).toHaveBeenCalledTimes(1);
    });

    it('should check isInitialized property', async () => {
      Object.defineProperty(i18next, 'isInitialized', {
        get: jest.fn(() => true),
        configurable: true
      });
      
      await setupI18n();
      
      expect(mockUse).not.toHaveBeenCalled();
      expect(mockInit).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should propagate setup errors', async () => {
      const setupError = new Error('Setup failed');
      mockInit.mockRejectedValue(setupError);

      await expect(setupI18n()).rejects.toThrow('Setup failed');
    });

    it('should propagate language change errors', async () => {
      const changeError = new Error('Change failed');
      mockChangeLanguage.mockRejectedValue(changeError);

      await expect(switchLanguage('en')).rejects.toThrow('Change failed');
    });

    it('should handle mock initialization properly', async () => {
      Object.defineProperty(i18next, 'isInitialized', {
        get: jest.fn(() => false),
        configurable: true
      });
      mockUse.mockReturnThis();
      mockInit.mockResolvedValue(undefined);

      await setupI18n();

      expect(mockUse).toHaveBeenCalledWith(expect.objectContaining({
        type: 'postProcessor'
      }));
      expect(mockInit).toHaveBeenCalled();
    });
  });

  describe('integration', () => {
    it('should work with sequential operations', async () => {
      // Setup i18n
      await setupI18n({ debug: true });
      expect(mockInit).toHaveBeenCalled();

      // Switch language
      await switchLanguage('pt-BR');
      expect(mockChangeLanguage).toHaveBeenCalledWith('pt-BR');

      // Get instance
      const instance = getI18nInstance();
      expect(instance).toBe(i18next);
    });

    it('should maintain state between operations', async () => {
      const config = { fallbackLanguage: 'pt-BR', debug: true };
      
      await setupI18n(config);
      const instance1 = getI18nInstance();
      await switchLanguage('en');
      const instance2 = getI18nInstance();
      
      expect(instance1).toBe(instance2);
      expect(mockChangeLanguage).toHaveBeenCalledWith('en');
    });
  });
});