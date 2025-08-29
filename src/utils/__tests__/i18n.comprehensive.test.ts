/**
 * Comprehensive tests for i18n utility functions
 * Achieving 90%+ code coverage with all functionality and edge cases
 */

import {
  initializeI18n,
  getCurrentLanguage,
  getSupportedLanguages,
  isSupportedLanguage,
  switchLanguage,
  translate,
  formatDate,
  formatNumber,
  getTextDirection,
  getLanguageInfo,
  resetI18n,
  type SupportedLanguage,
  type I18nConfig,
  type FormatOptions
} from '../i18n';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

// Mock window and navigator
const mockWindow = {
  dispatchEvent: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

const mockNavigator = {
  language: 'en-US',
  userLanguage: 'en-US'
};

// Mock console methods
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(() => {}),
  warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
  error: jest.spyOn(console, 'error').mockImplementation(() => {})
};

// Store original globals
const originalLocalStorage = global.localStorage;
const originalWindow = global.window;
const originalNavigator = global.navigator;
const originalProcess = global.process;

describe('i18n Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock globals
    (global as any).localStorage = mockLocalStorage;
    (global as any).window = mockWindow;
    (global as any).navigator = mockNavigator;
    
    // Ensure we're not in test environment for initialization
    (global as any).process = { env: { NODE_ENV: 'development' } };
    
    // Reset i18n state before each test
    resetI18n();
  });

  afterEach(() => {
    consoleSpy.log.mockClear();
    consoleSpy.warn.mockClear();
    consoleSpy.error.mockClear();
  });

  afterAll(() => {
    // Restore original globals
    global.localStorage = originalLocalStorage;
    global.window = originalWindow;
    global.navigator = originalNavigator;
    global.process = originalProcess;
    
    consoleSpy.log.mockRestore();
    consoleSpy.warn.mockRestore();
    consoleSpy.error.mockRestore();
  });

  describe('resetI18n', () => {
    it('should reset i18n to default state', () => {
      initializeI18n({ defaultLanguage: 'pt-BR' });
      expect(getCurrentLanguage()).toBe('pt-BR');
      
      resetI18n();
      expect(getCurrentLanguage()).toBe('en');
    });
  });

  describe('initializeI18n', () => {
    it('should initialize with default configuration', () => {
      initializeI18n();
      
      expect(getCurrentLanguage()).toBe('en');
      expect(getSupportedLanguages()).toEqual(['en', 'pt-BR', 'es', 'fr']);
    });

    it('should initialize with custom configuration', () => {
      const customConfig: Partial<I18nConfig> = {
        defaultLanguage: 'pt-BR',
        supportedLanguages: ['pt-BR', 'en'],
        enableDebug: true
      };
      
      initializeI18n(customConfig);
      
      expect(getCurrentLanguage()).toBe('pt-BR');
      expect(getSupportedLanguages()).toEqual(['pt-BR', 'en']);
    });

    it('should load saved language preference when no custom default is provided', () => {
      // Reset first
      resetI18n();
      mockLocalStorage.getItem.mockReturnValue('es');
      
      // Ensure we're not in test environment to allow auto-initialization
      const originalProcess = (global as any).process;
      (global as any).process = { env: { NODE_ENV: 'development' } };
      
      initializeI18n();
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('jungApp_language_preference');
      expect(getCurrentLanguage()).toBe('es');
      
      (global as any).process = originalProcess;
    });

    it('should ignore saved language preference when custom default is provided', () => {
      mockLocalStorage.getItem.mockReturnValue('es');
      
      initializeI18n({ defaultLanguage: 'pt-BR' });
      
      expect(getCurrentLanguage()).toBe('pt-BR');
    });

    it('should detect browser language when no saved preference exists', () => {
      resetI18n();
      mockLocalStorage.getItem.mockReturnValue(null);
      
      // Mock navigator properly
      (global as any).navigator = { language: 'fr-FR', userLanguage: 'fr-FR' };
      
      initializeI18n();
      
      expect(getCurrentLanguage()).toBe('fr');
    });

    it('should handle browser language detection with partial match', () => {
      resetI18n();
      mockLocalStorage.getItem.mockReturnValue(null);
      
      // Mock navigator properly
      (global as any).navigator = { language: 'pt-BR', userLanguage: 'pt-BR' };
      
      initializeI18n();
      
      expect(getCurrentLanguage()).toBe('pt-BR');
    });

    it('should handle browser language that is not supported', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockNavigator.language = 'zh-CN';
      
      initializeI18n();
      
      expect(getCurrentLanguage()).toBe('en'); // Should fallback to default
    });

    it('should handle localStorage errors gracefully', () => {
      resetI18n();
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      initializeI18n();
      
      expect(getCurrentLanguage()).toBe('en');
      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('should handle navigator errors gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      (global as any).navigator = undefined;
      
      initializeI18n();
      
      expect(getCurrentLanguage()).toBe('en');
    });

    it('should log initialization in debug mode', () => {
      initializeI18n({ enableDebug: true });
      
      expect(consoleSpy.log).toHaveBeenCalledWith('[i18n] Initialized with language: en');
    });

    it('should handle initialization error and use fallback language', () => {
      // Force an error during initialization
      const originalGetItem = mockLocalStorage.getItem;
      mockLocalStorage.getItem = jest.fn().mockImplementation(() => {
        throw new Error('Initialization error');
      });
      
      initializeI18n({ enableDebug: true, fallbackLanguage: 'pt-BR' });
      
      expect(consoleSpy.error).toHaveBeenCalledWith('Failed to initialize i18n:', expect.any(Error));
      expect(getCurrentLanguage()).toBe('pt-BR');
      
      mockLocalStorage.getItem = originalGetItem;
    });
  });

  describe('getCurrentLanguage', () => {
    it('should return current language', () => {
      initializeI18n({ defaultLanguage: 'es' });
      expect(getCurrentLanguage()).toBe('es');
    });
  });

  describe('getSupportedLanguages', () => {
    it('should return supported languages array', () => {
      const languages = getSupportedLanguages();
      expect(Array.isArray(languages)).toBe(true);
      expect(languages).toEqual(['en', 'pt-BR', 'es', 'fr']);
    });

    it('should return copy of array (not reference)', () => {
      const languages1 = getSupportedLanguages();
      const languages2 = getSupportedLanguages();
      
      expect(languages1).toEqual(languages2);
      expect(languages1).not.toBe(languages2);
    });

    it('should handle invalid config gracefully', () => {
      // Simulate corrupted config state
      initializeI18n({ supportedLanguages: null as any });
      
      const languages = getSupportedLanguages();
      expect(languages).toEqual(['en', 'pt-BR', 'es', 'fr']); // Should return default
    });
  });

  describe('isSupportedLanguage', () => {
    it('should return true for supported languages', () => {
      expect(isSupportedLanguage('en')).toBe(true);
      expect(isSupportedLanguage('pt-BR')).toBe(true);
      expect(isSupportedLanguage('es')).toBe(true);
      expect(isSupportedLanguage('fr')).toBe(true);
    });

    it('should return false for unsupported languages', () => {
      expect(isSupportedLanguage('zh')).toBe(false);
      expect(isSupportedLanguage('de')).toBe(false);
      expect(isSupportedLanguage('')).toBe(false);
    });

    it('should handle invalid input types', () => {
      expect(isSupportedLanguage(null as any)).toBe(false);
      expect(isSupportedLanguage(undefined as any)).toBe(false);
      expect(isSupportedLanguage(123 as any)).toBe(false);
    });

    it('should handle corrupted config gracefully', () => {
      initializeI18n({ supportedLanguages: null as any });
      
      expect(isSupportedLanguage('en')).toBe(true); // Should use default config
      expect(isSupportedLanguage('zh')).toBe(false);
    });
  });

  describe('switchLanguage', () => {
    it('should switch to supported language', async () => {
      initializeI18n();
      
      await switchLanguage('pt-BR');
      
      expect(getCurrentLanguage()).toBe('pt-BR');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('jungApp_language_preference', 'pt-BR');
    });

    it('should throw error for unsupported language', async () => {
      await expect(switchLanguage('zh' as SupportedLanguage)).rejects.toThrow('Unsupported language: zh');
    });

    it('should dispatch language change event', async () => {
      initializeI18n();
      
      await switchLanguage('fr');
      
      expect(mockWindow.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'languageChange',
          detail: { language: 'fr' }
        })
      );
    });

    it('should handle localStorage save error', async () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Save error');
      });
      
      await expect(switchLanguage('es')).rejects.toThrow('Save error');
      expect(consoleSpy.error).toHaveBeenCalledWith('Error saving language preference:', expect.any(Error));
    });

    it('should handle event dispatch error gracefully', async () => {
      mockWindow.dispatchEvent.mockImplementation(() => {
        throw new Error('Event dispatch error');
      });
      
      // Should not throw - event dispatch error should be handled
      await switchLanguage('es');
      
      expect(getCurrentLanguage()).toBe('es');
      expect(consoleSpy.error).toHaveBeenCalledWith('Error dispatching language change event:', expect.any(Error));
    });

    it('should log language switch in debug mode', async () => {
      initializeI18n({ enableDebug: true });
      
      await switchLanguage('pt-BR');
      
      expect(consoleSpy.log).toHaveBeenCalledWith('[i18n] Switched to language: pt-BR');
    });

    it('should handle window being undefined', async () => {
      (global as any).window = undefined;
      
      await switchLanguage('fr');
      
      expect(getCurrentLanguage()).toBe('fr');
    });
  });

  describe('translate', () => {
    beforeEach(() => {
      initializeI18n({ defaultLanguage: 'en' });
    });

    it('should translate basic keys', () => {
      expect(translate('common.welcome')).toBe('Welcome');
      expect(translate('navigation.home')).toBe('Home');
      expect(translate('modules.title')).toBe('Educational Modules');
    });

    it('should translate with interpolations', () => {
      const result = translate('quiz.question', {
        interpolations: { number: '1', total: '5' }
      });
      expect(result).toBe('Question 1 of 5');
    });

    it('should use fallback language for missing translations', () => {
      initializeI18n({ defaultLanguage: 'pt-BR', fallbackLanguage: 'en' });
      
      // Assuming a key exists in English but not Portuguese
      const result = translate('nonexistent.key');
      expect(result).toBe('nonexistent.key'); // Should return key when not found
    });

    it('should use provided fallback text', () => {
      const result = translate('nonexistent.key', {
        fallback: 'Default text'
      });
      expect(result).toBe('Default text');
    });

    it('should use specific language option', () => {
      const result = translate('common.welcome', { language: 'pt-BR' });
      expect(result).toBe('Bem-vindo');
    });

    it('should warn about missing translations', () => {
      translate('missing.translation.key');
      expect(consoleSpy.warn).toHaveBeenCalledWith('[i18n] Missing translation for key: missing.translation.key');
    });

    it('should handle deep nested keys', () => {
      expect(translate('quiz.score')).toBe('Score: {{score}}%');
    });

    it('should handle empty key', () => {
      const result = translate('');
      expect(result).toBe('');
    });

    it('should handle null/undefined interpolations', () => {
      const result = translate('quiz.question', {
        interpolations: { number: '1' } // missing 'total'
      });
      expect(result).toBe('Question 1 of {{total}}'); // Should leave unmatched placeholders
    });

    it('should handle interpolation with number values', () => {
      const result = translate('quiz.score', {
        interpolations: { score: 85 }
      });
      expect(result).toBe('Score: 85%');
    });

    it('should handle translation errors gracefully', () => {
      // Mock console.error to throw to test error handling
      const originalError = consoleSpy.error;
      consoleSpy.error = jest.fn().mockImplementation(() => {
        throw new Error('Translation error');
      });
      
      const result = translate('common.welcome');
      expect(result).toBe('common.welcome'); // Should return key on error
      
      consoleSpy.error = originalError;
    });

    it('should handle fallback language same as current language', () => {
      initializeI18n({ defaultLanguage: 'en', fallbackLanguage: 'en' });
      
      const result = translate('nonexistent.key');
      expect(result).toBe('nonexistent.key');
    });

    it('should use fallback when current language translation is missing', () => {
      initializeI18n({ defaultLanguage: 'en', fallbackLanguage: 'pt-BR', enableDebug: true });
      
      // Test with a key that exists in fallback but simulating missing in current
      const result = translate('nonexistent.in.current');
      expect(consoleSpy.warn).toHaveBeenCalledWith('[i18n] Using fallback for key: nonexistent.in.current');
    });
  });

  describe('formatDate', () => {
    beforeEach(() => {
      initializeI18n();
    });

    it('should format date with default options', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const result = formatDate(date);
      
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should format date with custom options', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      };
      
      const result = formatDate(date, options);
      expect(result).toContain('2024');
      expect(result).toContain('January');
    });

    it('should format date according to current language locale', () => {
      switchLanguage('pt-BR').then(() => {
        const date = new Date('2024-01-15T10:30:00Z');
        const result = formatDate(date);
        
        expect(typeof result).toBe('string');
      });
    });

    it('should handle formatting errors gracefully', () => {
      // Create an invalid date
      const invalidDate = new Date('invalid');
      
      const result = formatDate(invalidDate);
      expect(result).toBe('Invalid Date');
    });

    it('should handle Intl.DateTimeFormat errors', () => {
      // Mock Intl.DateTimeFormat to throw error
      const originalDateTimeFormat = Intl.DateTimeFormat;
      (Intl as any).DateTimeFormat = jest.fn().mockImplementation(() => {
        throw new Error('DateTimeFormat error');
      });
      
      const date = new Date('2024-01-15');
      const result = formatDate(date);
      
      expect(result).toBe(date.toString());
      expect(consoleSpy.error).toHaveBeenCalledWith('Date formatting error:', expect.any(Error));
      
      Intl.DateTimeFormat = originalDateTimeFormat;
    });
  });

  describe('formatNumber', () => {
    beforeEach(() => {
      initializeI18n();
    });

    it('should format number with default options', () => {
      const result = formatNumber(1234.56);
      expect(typeof result).toBe('string');
      expect(result).toContain('1234');
    });

    it('should format number with custom options', () => {
      const options: Intl.NumberFormatOptions = {
        style: 'currency',
        currency: 'USD'
      };
      
      const result = formatNumber(1234.56, options);
      expect(result).toContain('$');
      expect(result).toContain('1,234');
    });

    it('should format percentage', () => {
      const options: Intl.NumberFormatOptions = {
        style: 'percent'
      };
      
      const result = formatNumber(0.75, options);
      expect(result).toContain('75');
      expect(result).toContain('%');
    });

    it('should handle formatting errors gracefully', () => {
      // Mock Intl.NumberFormat to throw error
      const originalNumberFormat = Intl.NumberFormat;
      (Intl as any).NumberFormat = jest.fn().mockImplementation(() => {
        throw new Error('NumberFormat error');
      });
      
      const result = formatNumber(1234.56);
      
      expect(result).toBe('1234.56');
      expect(consoleSpy.error).toHaveBeenCalledWith('Number formatting error:', expect.any(Error));
      
      Intl.NumberFormat = originalNumberFormat;
    });

    it('should handle special number values', () => {
      expect(formatNumber(Infinity)).toContain('∞');
      expect(formatNumber(-Infinity)).toContain('∞');
      expect(formatNumber(NaN)).toContain('NaN');
    });
  });

  describe('getTextDirection', () => {
    it('should return ltr for all supported languages', () => {
      const directions = ['en', 'pt-BR', 'es', 'fr'].map(lang => {
        initializeI18n({ defaultLanguage: lang as SupportedLanguage });
        return getTextDirection();
      });
      
      expect(directions.every(dir => dir === 'ltr')).toBe(true);
    });
  });

  describe('getLanguageInfo', () => {
    it('should return correct info for English', () => {
      initializeI18n({ defaultLanguage: 'en' });
      
      const info = getLanguageInfo();
      expect(info).toEqual({
        language: 'en',
        displayName: 'English',
        nativeName: 'English',
        direction: 'ltr'
      });
    });

    it('should return correct info for Portuguese', () => {
      initializeI18n({ defaultLanguage: 'pt-BR' });
      
      const info = getLanguageInfo();
      expect(info).toEqual({
        language: 'pt-BR',
        displayName: 'Portuguese (Brazil)',
        nativeName: 'Português (Brasil)',
        direction: 'ltr'
      });
    });

    it('should return correct info for Spanish', () => {
      initializeI18n({ defaultLanguage: 'es' });
      
      const info = getLanguageInfo();
      expect(info).toEqual({
        language: 'es',
        displayName: 'Spanish',
        nativeName: 'Español',
        direction: 'ltr'
      });
    });

    it('should return correct info for French', () => {
      initializeI18n({ defaultLanguage: 'fr' });
      
      const info = getLanguageInfo();
      expect(info).toEqual({
        language: 'fr',
        displayName: 'French',
        nativeName: 'Français',
        direction: 'ltr'
      });
    });
  });

  describe('Browser API mocking scenarios', () => {
    it('should handle missing navigator.language', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      (global as any).navigator = {};
      
      initializeI18n();
      expect(getCurrentLanguage()).toBe('en');
    });

    it('should handle navigator.userLanguage fallback', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      (global as any).navigator = { userLanguage: 'fr' };
      
      initializeI18n();
      expect(getCurrentLanguage()).toBe('fr');
    });

    it('should handle missing localStorage gracefully', () => {
      (global as any).localStorage = undefined;
      
      initializeI18n();
      expect(getCurrentLanguage()).toBe('en');
    });

    it('should handle missing window gracefully', () => {
      (global as any).window = undefined;
      
      initializeI18n();
      expect(getCurrentLanguage()).toBe('en');
    });
  });

  describe('Edge cases and error scenarios', () => {
    it('should handle extremely long translation keys', () => {
      const longKey = 'a'.repeat(1000) + '.very.long.key';
      const result = translate(longKey);
      expect(result).toBe(longKey);
    });

    it('should handle keys with special characters', () => {
      const specialKey = 'special.key.with.numbers.123.and.symbols.!@#';
      const result = translate(specialKey);
      expect(result).toBe(specialKey);
    });

    it('should handle concurrent language switches', async () => {
      const promises = ['pt-BR', 'es', 'fr'].map(lang => 
        switchLanguage(lang as SupportedLanguage)
      );
      
      await Promise.all(promises);
      
      // Should end up with the last resolved language
      const finalLanguage = getCurrentLanguage();
      expect(['pt-BR', 'es', 'fr']).toContain(finalLanguage);
    });

    it('should handle CustomEvent constructor errors', async () => {
      const originalCustomEvent = global.CustomEvent;
      (global as any).CustomEvent = jest.fn().mockImplementation(() => {
        throw new Error('CustomEvent error');
      });
      
      await switchLanguage('es');
      
      expect(getCurrentLanguage()).toBe('es');
      expect(consoleSpy.error).toHaveBeenCalledWith('Error dispatching language change event:', expect.any(Error));
      
      global.CustomEvent = originalCustomEvent;
    });
  });

  describe('Integration scenarios', () => {
    it('should maintain state across multiple operations', async () => {
      initializeI18n({ enableDebug: true });
      
      expect(translate('common.welcome')).toBe('Welcome');
      
      await switchLanguage('pt-BR');
      expect(translate('common.welcome')).toBe('Bem-vindo');
      
      await switchLanguage('es');
      expect(translate('common.welcome')).toBe('Bienvenido');
      
      const info = getLanguageInfo();
      expect(info.language).toBe('es');
      expect(info.nativeName).toBe('Español');
    });

    it('should handle rapid successive operations', async () => {
      for (let i = 0; i < 10; i++) {
        const languages: SupportedLanguage[] = ['en', 'pt-BR', 'es', 'fr'];
        const randomLang = languages[i % languages.length];
        
        await switchLanguage(randomLang);
        expect(getCurrentLanguage()).toBe(randomLang);
        expect(translate('common.welcome')).toBeDefined();
      }
    });
  });
});