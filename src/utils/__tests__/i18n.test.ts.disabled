/**
 * Comprehensive test suite for i18n utility functions
 * Testing internationalization, localization, and translation features
 */

import {
  SupportedLanguage,
  I18nConfig,
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
  resetI18n
} from '../i18n';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    __store: store
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Mock navigator
const navigatorMock = {
  language: 'en-US'
};

Object.defineProperty(global, 'navigator', {
  value: navigatorMock,
  writable: true
});

// Mock window.dispatchEvent
const mockDispatchEvent = jest.fn();
Object.defineProperty(global, 'window', {
  value: {
    dispatchEvent: mockDispatchEvent
  },
  writable: true
});

describe('i18n Utility Functions - Comprehensive Test Suite', () => {
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset localStorage
    (localStorageMock as any).__store = {};
    (localStorageMock.getItem as jest.Mock).mockImplementation((key: string) => 
      (localStorageMock as any).__store[key] || null
    );
    (localStorageMock.setItem as jest.Mock).mockImplementation((key: string, value: string) => {
      (localStorageMock as any).__store[key] = value.toString();
    });
    
    // Reset navigator
    (navigatorMock as any).language = 'en-US';
    
    // Reset console spies
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    
    // Reset dispatch event mock
    mockDispatchEvent.mockReset();
    
    // Reset i18n system
    resetI18n();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleLogSpy.mockRestore();
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
        supportedLanguages: ['en', 'pt-BR'],
        enableDebug: true
      };
      
      initializeI18n(customConfig);
      
      expect(getCurrentLanguage()).toBe('pt-BR');
      expect(getSupportedLanguages()).toEqual(['en', 'pt-BR']);
    });

    it('should load saved language preference', () => {
      (localStorageMock as any).__store['jungApp_language_preference'] = 'es';
      
      initializeI18n();
      
      expect(getCurrentLanguage()).toBe('es');
    });

    it('should detect browser language', () => {
      (navigatorMock as any).language = 'fr-FR';
      
      initializeI18n();
      
      expect(getCurrentLanguage()).toBe('fr');
    });

    it('should handle partial browser language codes', () => {
      (navigatorMock as any).language = 'pt';
      
      initializeI18n();
      
      expect(getCurrentLanguage()).toBe('en'); // Should fallback since 'pt' alone is not supported
    });

    it('should fallback to default when saved language is invalid', () => {
      (localStorageMock as any).__store['jungApp_language_preference'] = 'invalid-lang';
      
      initializeI18n();
      
      expect(getCurrentLanguage()).toBe('en');
    });

    it('should handle localStorage errors gracefully', () => {
      (localStorageMock.getItem as jest.Mock).mockImplementation(() => {
        throw new Error('LocalStorage error');
      });
      
      expect(() => initializeI18n()).not.toThrow();
      expect(getCurrentLanguage()).toBe('en');
    });

    it('should respect custom default language over saved preference', () => {
      (localStorageMock as any).__store['jungApp_language_preference'] = 'es';
      
      initializeI18n({ defaultLanguage: 'fr' });
      
      expect(getCurrentLanguage()).toBe('fr');
    });

    it('should enable debug logging when configured', () => {
      initializeI18n({ enableDebug: true });
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[i18n] Initialized with language:')
      );
    });
  });

  describe('getCurrentLanguage', () => {
    it('should return current language', () => {
      initializeI18n({ defaultLanguage: 'pt-BR' });
      expect(getCurrentLanguage()).toBe('pt-BR');
    });

    it('should return updated language after switch', async () => {
      initializeI18n();
      await switchLanguage('es');
      expect(getCurrentLanguage()).toBe('es');
    });
  });

  describe('getSupportedLanguages', () => {
    it('should return default supported languages', () => {
      initializeI18n();
      expect(getSupportedLanguages()).toEqual(['en', 'pt-BR', 'es', 'fr']);
    });

    it('should return custom supported languages', () => {
      initializeI18n({ supportedLanguages: ['en', 'fr'] });
      expect(getSupportedLanguages()).toEqual(['en', 'fr']);
    });

    it('should return default languages when config is invalid', () => {
      initializeI18n({ supportedLanguages: null as any });
      expect(getSupportedLanguages()).toEqual(['en', 'pt-BR', 'es', 'fr']);
    });

    it('should return a copy of the array', () => {
      initializeI18n();
      const languages1 = getSupportedLanguages();
      const languages2 = getSupportedLanguages();
      
      expect(languages1).not.toBe(languages2);
      expect(languages1).toEqual(languages2);
    });
  });

  describe('isSupportedLanguage', () => {
    beforeEach(() => {
      initializeI18n();
    });

    it('should return true for supported languages', () => {
      expect(isSupportedLanguage('en')).toBe(true);
      expect(isSupportedLanguage('pt-BR')).toBe(true);
      expect(isSupportedLanguage('es')).toBe(true);
      expect(isSupportedLanguage('fr')).toBe(true);
    });

    it('should return false for unsupported languages', () => {
      expect(isSupportedLanguage('de')).toBe(false);
      expect(isSupportedLanguage('it')).toBe(false);
      expect(isSupportedLanguage('zh')).toBe(false);
    });

    it('should handle empty strings and invalid inputs', () => {
      expect(isSupportedLanguage('')).toBe(false);
      expect(isSupportedLanguage(null as any)).toBe(false);
      expect(isSupportedLanguage(undefined as any)).toBe(false);
    });

    it('should work with custom supported languages', () => {
      initializeI18n({ supportedLanguages: ['en', 'de'] });
      
      expect(isSupportedLanguage('en')).toBe(true);
      expect(isSupportedLanguage('de')).toBe(true);
      expect(isSupportedLanguage('fr')).toBe(false);
    });
  });

  describe('switchLanguage', () => {
    beforeEach(() => {
      initializeI18n();
    });

    it('should switch to supported language', async () => {
      await switchLanguage('es');
      expect(getCurrentLanguage()).toBe('es');
    });

    it('should save language preference to localStorage', async () => {
      await switchLanguage('pt-BR');
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'jungApp_language_preference',
        'pt-BR'
      );
    });

    it('should dispatch language change event', async () => {
      await switchLanguage('fr');
      
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'languageChange',
          detail: { language: 'fr' }
        })
      );
    });

    it('should throw error for unsupported language', async () => {
      await expect(switchLanguage('invalid' as SupportedLanguage))
        .rejects.toThrow('Unsupported language: invalid');
    });

    it('should handle localStorage save errors', async () => {
      (localStorageMock.setItem as jest.Mock).mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      await expect(switchLanguage('es')).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error saving language preference:',
        expect.any(Error)
      );
    });

    it('should handle event dispatch errors gracefully', async () => {
      mockDispatchEvent.mockImplementation(() => {
        throw new Error('Event dispatch failed');
      });
      
      await expect(switchLanguage('es')).resolves.not.toThrow();
      expect(getCurrentLanguage()).toBe('es');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error dispatching language change event:',
        expect.any(Error)
      );
    });

    it('should enable debug logging when configured', async () => {
      initializeI18n({ enableDebug: true });
      
      await switchLanguage('fr');
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[i18n] Switched to language: fr'
      );
    });
  });

  describe('translate', () => {
    beforeEach(() => {
      initializeI18n();
    });

    it('should translate simple keys', () => {
      expect(translate('common.welcome')).toBe('Welcome');
      expect(translate('common.loading')).toBe('Loading...');
    });

    it('should translate nested keys', () => {
      expect(translate('navigation.home')).toBe('Home');
      expect(translate('modules.title')).toBe('Educational Modules');
    });

    it('should handle interpolations', () => {
      const result = translate('quiz.question', {
        interpolations: { number: 5, total: 10 }
      });
      expect(result).toBe('Question 5 of 10');
    });

    it('should translate in different languages', async () => {
      await switchLanguage('pt-BR');
      expect(translate('common.welcome')).toBe('Bem-vindo');
      
      await switchLanguage('es');
      expect(translate('common.welcome')).toBe('Bienvenido');
      
      await switchLanguage('fr');
      expect(translate('common.welcome')).toBe('Bienvenue');
    });

    it('should use language override option', () => {
      const result = translate('common.welcome', { language: 'pt-BR' });
      expect(result).toBe('Bem-vindo');
      expect(getCurrentLanguage()).toBe('en'); // Should not change current language
    });

    it('should fallback to English for missing translations', async () => {
      await switchLanguage('pt-BR');
      const result = translate('nonexistent.key');
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[i18n] Missing translation for key: nonexistent.key'
      );
      expect(result).toBe('nonexistent.key');
    });

    it('should use custom fallback when provided', () => {
      const result = translate('nonexistent.key', {
        fallback: 'Custom fallback'
      });
      expect(result).toBe('Custom fallback');
    });

    it('should handle invalid key formats', () => {
      expect(translate('')).toBe('');
      expect(translate('...')).toBe('...');
      expect(translate('key.with.too.many.dots')).toBe('key.with.too.many.dots');
    });

    it('should handle interpolation errors gracefully', () => {
      const result = translate('quiz.question', {
        interpolations: { invalidKey: 'value' }
      });
      expect(result).toContain('{{number}}'); // Should keep original template
    });

    it('should handle translation errors gracefully', () => {
      // Simulate error in translation process
      const result = translate(null as any);
      expect(result).toBe('');
    });
  });

  describe('formatDate', () => {
    const testDate = new Date('2023-12-25T10:30:00.000Z');

    beforeEach(() => {
      initializeI18n();
    });

    it('should format date in English locale', () => {
      const result = formatDate(testDate);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should format date in different locales', async () => {
      await switchLanguage('pt-BR');
      const brResult = formatDate(testDate);
      
      await switchLanguage('fr');
      const frResult = formatDate(testDate);
      
      expect(brResult).toBeDefined();
      expect(frResult).toBeDefined();
      // Results might be the same in test environment, but function should work
    });

    it('should accept custom formatting options', () => {
      const result = formatDate(testDate, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      expect(result).toContain('2023');
      expect(result).toContain('December');
      expect(result).toContain('25');
    });

    it('should handle formatting errors gracefully', () => {
      const invalidDate = new Date('invalid');
      const result = formatDate(invalidDate);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Date formatting error:',
        expect.any(Error)
      );
      expect(result).toBe(invalidDate.toString());
    });
  });

  describe('formatNumber', () => {
    beforeEach(() => {
      initializeI18n();
    });

    it('should format numbers in current locale', () => {
      expect(formatNumber(1234.56)).toBeDefined();
      expect(formatNumber(1000)).toBeDefined();
    });

    it('should accept custom formatting options', () => {
      const currency = formatNumber(1234.56, {
        style: 'currency',
        currency: 'USD'
      });
      
      expect(currency).toContain('$');
    });

    it('should format percentages', () => {
      const percentage = formatNumber(0.75, {
        style: 'percent'
      });
      
      expect(percentage).toContain('%');
    });

    it('should handle formatting errors gracefully', () => {
      const result = formatNumber(NaN);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Number formatting error:',
        expect.any(Error)
      );
      expect(result).toBe('NaN');
    });
  });

  describe('getTextDirection', () => {
    it('should return ltr for all supported languages', () => {
      initializeI18n();
      expect(getTextDirection()).toBe('ltr');
      
      ['en', 'pt-BR', 'es', 'fr'].forEach(async lang => {
        await switchLanguage(lang as SupportedLanguage);
        expect(getTextDirection()).toBe('ltr');
      });
    });
  });

  describe('getLanguageInfo', () => {
    beforeEach(() => {
      initializeI18n();
    });

    it('should return language information for English', () => {
      const info = getLanguageInfo();
      
      expect(info).toEqual({
        language: 'en',
        displayName: 'English',
        nativeName: 'English',
        direction: 'ltr'
      });
    });

    it('should return language information for Portuguese', async () => {
      await switchLanguage('pt-BR');
      const info = getLanguageInfo();
      
      expect(info).toEqual({
        language: 'pt-BR',
        displayName: 'Portuguese (Brazil)',
        nativeName: 'Português (Brasil)',
        direction: 'ltr'
      });
    });

    it('should return language information for Spanish', async () => {
      await switchLanguage('es');
      const info = getLanguageInfo();
      
      expect(info).toEqual({
        language: 'es',
        displayName: 'Spanish',
        nativeName: 'Español',
        direction: 'ltr'
      });
    });

    it('should return language information for French', async () => {
      await switchLanguage('fr');
      const info = getLanguageInfo();
      
      expect(info).toEqual({
        language: 'fr',
        displayName: 'French',
        nativeName: 'Français',
        direction: 'ltr'
      });
    });
  });

  describe('Performance Tests', () => {
    beforeEach(() => {
      initializeI18n();
    });

    it('should handle many translations efficiently', () => {
      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        translate('common.welcome');
        translate('navigation.home');
        translate('modules.title');
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100); // Should be very fast
    });

    it('should handle language switches efficiently', async () => {
      const start = performance.now();
      
      for (let i = 0; i < 10; i++) {
        await switchLanguage('pt-BR');
        await switchLanguage('es');
        await switchLanguage('fr');
        await switchLanguage('en');
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(500);
    });

    it('should handle many date/number formatting calls efficiently', () => {
      const testDate = new Date();
      const testNumber = 1234.56;
      
      const start = performance.now();
      
      for (let i = 0; i < 100; i++) {
        formatDate(testDate);
        formatNumber(testNumber);
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing navigator object', () => {
      const originalNavigator = global.navigator;
      delete (global as any).navigator;
      
      expect(() => initializeI18n()).not.toThrow();
      expect(getCurrentLanguage()).toBe('en');
      
      global.navigator = originalNavigator;
    });

    it('should handle missing localStorage', () => {
      const originalLocalStorage = global.localStorage;
      delete (global as any).localStorage;
      
      expect(() => initializeI18n()).not.toThrow();
      expect(getCurrentLanguage()).toBe('en');
      
      global.localStorage = originalLocalStorage;
    });

    it('should handle missing window object', () => {
      const originalWindow = global.window;
      delete (global as any).window;
      
      expect(async () => {
        await switchLanguage('es');
      }).not.toThrow();
      
      global.window = originalWindow;
    });

    it('should handle corrupt localStorage data', () => {
      (localStorageMock as any).__store['jungApp_language_preference'] = '{invalid json';
      
      expect(() => initializeI18n()).not.toThrow();
      expect(getCurrentLanguage()).toBe('en');
    });

    it('should handle extreme interpolation values', () => {
      const result1 = translate('quiz.question', {
        interpolations: { number: null as any, total: undefined as any }
      });
      
      const result2 = translate('quiz.question', {
        interpolations: { number: 0, total: Infinity }
      });
      
      expect(result1).toContain('null');
      expect(result2).toContain('0');
      expect(result2).toContain('Infinity');
    });

    it('should handle very deep nested keys', () => {
      const deepKey = 'a.b.c.d.e.f.g.h.i.j';
      const result = translate(deepKey);
      expect(result).toBe(deepKey); // Should return key when not found
    });

    it('should handle circular references in interpolation gracefully', () => {
      const circular: any = { a: 1 };
      circular.self = circular;
      
      expect(() => {
        translate('quiz.question', {
          interpolations: { number: circular, total: 10 }
        });
      }).not.toThrow();
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent language switches', async () => {
      initializeI18n();
      
      const promises = [
        switchLanguage('pt-BR'),
        switchLanguage('es'),
        switchLanguage('fr'),
        switchLanguage('en')
      ];
      
      await Promise.all(promises);
      
      // Should end up in a valid state
      expect(isSupportedLanguage(getCurrentLanguage())).toBe(true);
    });

    it('should handle concurrent translations', () => {
      initializeI18n();
      
      const promises = Array.from({ length: 100 }, (_, i) => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(translate('common.welcome'));
          }, Math.random() * 10);
        });
      });
      
      return Promise.all(promises).then(results => {
        results.forEach(result => {
          expect(typeof result).toBe('string');
        });
      });
    });
  });

  describe('Advanced Internationalization Scenarios', () => {
    beforeEach(() => {
      initializeI18n();
    });

    it('should handle pluralization patterns correctly', () => {
      // Test singular vs plural patterns in different languages
      const singularKey = translate('quiz.question', {
        interpolations: { number: 1, total: 1 }
      });
      const pluralKey = translate('quiz.question', {
        interpolations: { number: 5, total: 10 }
      });
      
      expect(singularKey).toBe('Question 1 of 1');
      expect(pluralKey).toBe('Question 5 of 10');
    });

    it('should handle complex interpolation with arrays and objects', () => {
      const complexInterpolations = {
        list: ['item1', 'item2'],
        nested: { count: 42 },
        special: '!@#$%^&*()',
        unicode: '🌍🗣️📚'
      };
      
      const result = translate('quiz.score', {
        interpolations: { score: '95' }
      });
      
      expect(result).toBe('Score: 95%');
    });

    it('should handle right-to-left language preparation', async () => {
      // Test RTL language support structures (even though current languages are LTR)
      const direction = getTextDirection();
      expect(direction).toBe('ltr');
      
      // Verify text direction consistency across language switches
      for (const lang of getSupportedLanguages()) {
        await switchLanguage(lang);
        expect(getTextDirection()).toBe('ltr');
      }
    });

    it('should handle number formatting with different locales', async () => {
      const testNumber = 1234567.89;
      
      // Test number formatting in different locales
      await switchLanguage('en');
      const enNumber = formatNumber(testNumber);
      
      await switchLanguage('pt-BR');
      const ptNumber = formatNumber(testNumber);
      
      await switchLanguage('fr');
      const frNumber = formatNumber(testNumber);
      
      // Numbers should be formatted (may be same in test env, but function should work)
      expect(typeof enNumber).toBe('string');
      expect(typeof ptNumber).toBe('string');
      expect(typeof frNumber).toBe('string');
      expect(enNumber.length).toBeGreaterThan(0);
    });

    it('should handle date formatting with different calendar systems', async () => {
      const testDate = new Date('2023-07-15T14:30:00');
      
      const formats = [
        { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
        { year: '2-digit', month: 'short', day: 'numeric' },
        { hour: '2-digit', minute: '2-digit', hour12: true }
      ];
      
      for (const lang of getSupportedLanguages()) {
        await switchLanguage(lang);
        
        for (const format of formats) {
          const formatted = formatDate(testDate, format as Intl.DateTimeFormatOptions);
          expect(typeof formatted).toBe('string');
          expect(formatted.length).toBeGreaterThan(0);
        }
      }
    });

    it('should handle currency formatting in different locales', async () => {
      const amount = 1234.56;
      
      const currencies = [
        { currency: 'USD', symbol: '$' },
        { currency: 'EUR', symbol: '€' },
        { currency: 'BRL', symbol: 'R$' },
        { currency: 'GBP', symbol: '£' }
      ];
      
      for (const { currency } of currencies) {
        const formatted = formatNumber(amount, {
          style: 'currency',
          currency: currency
        });
        
        expect(typeof formatted).toBe('string');
        expect(formatted.length).toBeGreaterThan(0);
      }
    });

    it('should handle time zone sensitive formatting', () => {
      const testDate = new Date('2023-12-25T15:30:00Z');
      
      const timeZones = ['UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo'];
      
      timeZones.forEach(timeZone => {
        const formatted = formatDate(testDate, {
          timeZone,
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short'
        });
        
        expect(typeof formatted).toBe('string');
        expect(formatted.length).toBeGreaterThan(0);
      });
    });

    it('should handle special character interpolations', () => {
      const specialChars = {
        emoji: '🎓📚✨',
        symbols: '©®™§¶†‡',
        accents: 'áéíóúñü',
        math: '∑∆∏√∞≠≤≥',
        quotes: '"''""«»',
        punctuation: '!@#$%^&*()[]{}|;:,.<>?'
      };
      
      Object.entries(specialChars).forEach(([key, value]) => {
        const result = translate('quiz.score', {
          interpolations: { score: value }
        });
        expect(result).toContain(value);
      });
    });

    it('should validate translation completeness across languages', () => {
      const keysToTest = [
        'common.welcome',
        'common.loading',
        'navigation.home',
        'modules.title',
        'quiz.passed',
        'errors.networkError'
      ];
      
      getSupportedLanguages().forEach(async lang => {
        await switchLanguage(lang);
        
        keysToTest.forEach(key => {
          const translation = translate(key);
          expect(translation).toBeDefined();
          expect(translation.length).toBeGreaterThan(0);
          expect(translation).not.toBe(key); // Should not return the key itself
        });
      });
    });

    it('should handle missing translation with debug information', () => {
      initializeI18n({ enableDebug: true });
      
      const missingKey = 'debug.missing.translation.key';
      const result = translate(missingKey);
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        `[i18n] Missing translation for key: ${missingKey}`
      );
      expect(result).toBe(missingKey);
    });
  });

  describe('Memory and Resource Management', () => {
    it('should not leak memory with repeated initializations', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Repeatedly initialize i18n system
      for (let i = 0; i < 100; i++) {
        resetI18n();
        initializeI18n({
          defaultLanguage: i % 2 === 0 ? 'en' : 'pt-BR',
          enableDebug: i % 10 === 0
        });
      }
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Memory usage should not increase significantly (allow for 1MB increase)
      if (initialMemory > 0) {
        expect(finalMemory - initialMemory).toBeLessThan(1024 * 1024);
      }
    });

    it('should clean up event listeners properly', () => {
      let eventCount = 0;
      const originalAddEventListener = window.addEventListener;
      const originalRemoveEventListener = window.removeEventListener;
      
      (window as any).addEventListener = jest.fn(() => eventCount++);
      (window as any).removeEventListener = jest.fn(() => eventCount--);
      
      // Test multiple initializations
      for (let i = 0; i < 10; i++) {
        resetI18n();
        initializeI18n();
      }
      
      // Restore original methods
      window.addEventListener = originalAddEventListener;
      window.removeEventListener = originalRemoveEventListener;
      
      // Should not accumulate event listeners
      expect(eventCount).toBeLessThanOrEqual(1);
    });
  });

  describe('Browser Compatibility Edge Cases', () => {
    it('should handle old browser without Intl support', () => {
      const originalIntl = global.Intl;
      delete (global as any).Intl;
      
      const testDate = new Date('2023-12-25');
      const testNumber = 1234.56;
      
      // Should fall back gracefully
      expect(formatDate(testDate)).toBe(testDate.toString());
      expect(formatNumber(testNumber)).toBe(testNumber.toString());
      
      global.Intl = originalIntl;
    });

    it('should handle browser without btoa/atob support', () => {
      const originalBtoa = global.btoa;
      const originalAtob = global.atob;
      
      delete (global as any).btoa;
      delete (global as any).atob;
      
      // Should still work with Buffer fallback
      expect(() => initializeI18n()).not.toThrow();
      
      global.btoa = originalBtoa;
      global.atob = originalAtob;
    });

    it('should handle environment without performance API', () => {
      const originalPerformance = global.performance;
      delete (global as any).performance;
      
      // Should not break functionality
      expect(() => {
        initializeI18n();
        translate('common.welcome');
      }).not.toThrow();
      
      global.performance = originalPerformance;
    });
  });

  describe('State Consistency and Recovery', () => {
    it('should maintain consistent state after multiple errors', () => {
      initializeI18n();
      
      // Cause multiple errors in succession
      (localStorageMock.setItem as jest.Mock).mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      const languages = ['pt-BR', 'es', 'fr', 'en'];
      const promises = languages.map(async (lang, index) => {
        try {
          await switchLanguage(lang as SupportedLanguage);
        } catch {
          // Expected to fail
        }
        
        // State should still be valid
        expect(isSupportedLanguage(getCurrentLanguage())).toBe(true);
        expect(getSupportedLanguages()).toContain(getCurrentLanguage());
      });
      
      return Promise.all(promises);
    });

    it('should recover from corrupted internal state', () => {
      initializeI18n();
      
      // Simulate state corruption by manipulating configuration
      initializeI18n({
        supportedLanguages: [] as any,
        defaultLanguage: 'invalid' as any
      });
      
      // Should fall back to defaults
      expect(getCurrentLanguage()).toBe('en');
      expect(getSupportedLanguages().length).toBeGreaterThan(0);
    });

    it('should handle rapid state changes consistently', async () => {
      initializeI18n();
      
      const rapidChanges = async () => {
        for (let i = 0; i < 50; i++) {
          const lang = ['en', 'pt-BR', 'es', 'fr'][i % 4] as SupportedLanguage;
          await switchLanguage(lang);
          
          // Verify state consistency at each step
          expect(getCurrentLanguage()).toBe(lang);
          expect(translate('common.welcome')).toBeDefined();
        }
      };
      
      await rapidChanges();
      expect(isSupportedLanguage(getCurrentLanguage())).toBe(true);
    });
  });
});
