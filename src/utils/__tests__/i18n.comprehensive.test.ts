/**
 * Comprehensive Unit Tests for i18n.ts
 * Tests: Internationalization utilities, language switching, formatting, and fallbacks
 * Coverage Target: 100%
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
  SupportedLanguage
} from '../i18n';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

// Mock navigator.language
const mockNavigator = {
  language: 'en-US',
  userLanguage: undefined
};

Object.defineProperty(window, 'navigator', {
  value: mockNavigator,
  writable: true
});

// Mock console methods
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

// Mock CustomEvent and window.dispatchEvent
const mockDispatchEvent = jest.fn();
Object.defineProperty(window, 'dispatchEvent', {
  value: mockDispatchEvent,
  writable: true
});

describe('i18n utilities - Comprehensive Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
    consoleErrorSpy.mockClear();
    consoleWarnSpy.mockClear();
    consoleLogSpy.mockClear();
    mockDispatchEvent.mockClear();
    
    // Reset navigator language
    mockNavigator.language = 'en-US';
    mockNavigator.userLanguage = undefined;
    
    // Reinitialize i18n for each test
    initializeI18n();
  });

  afterAll(() => {
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
      const customConfig = {
        defaultLanguage: 'pt-BR' as SupportedLanguage,
        supportedLanguages: ['en', 'pt-BR'] as SupportedLanguage[],
        enableDebug: true
      };
      
      initializeI18n(customConfig);
      
      expect(getCurrentLanguage()).toBe('pt-BR');
      expect(getSupportedLanguages()).toEqual(['en', 'pt-BR']);
    });

    it('should load saved language preference from localStorage', () => {
      mockLocalStorage.setItem('jungApp_language_preference', 'es');
      
      initializeI18n();
      
      expect(getCurrentLanguage()).toBe('es');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('jungApp_language_preference');
    });

    it('should detect browser language when no saved preference exists', () => {
      mockNavigator.language = 'fr-FR';
      mockLocalStorage.getItem.mockReturnValue(null);
      
      initializeI18n();
      
      expect(getCurrentLanguage()).toBe('fr');
    });

    it('should fall back to default when browser language is unsupported', () => {
      mockNavigator.language = 'de-DE'; // Unsupported language
      mockLocalStorage.getItem.mockReturnValue(null);
      
      initializeI18n();
      
      expect(getCurrentLanguage()).toBe('en');
    });

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage access denied');
      });
      
      initializeI18n();
      
      expect(getCurrentLanguage()).toBe('en');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading language preference:', expect.any(Error));
    });

    it('should handle initialization errors and fallback to default language', () => {
      const customConfig = {
        defaultLanguage: null as any, // Invalid config to trigger error
      };
      
      initializeI18n(customConfig);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to initialize i18n:', expect.any(Error));
      expect(getCurrentLanguage()).toBe('en'); // Should fallback
    });

    it('should log debug information when debug is enabled', () => {
      initializeI18n({ enableDebug: true });
      
      expect(consoleLogSpy).toHaveBeenCalledWith('[i18n] Initialized with language: en');
    });

    it('should handle userLanguage fallback in older browsers', () => {
      mockNavigator.language = undefined as any;
      (mockNavigator as any).userLanguage = 'pt-BR';
      mockLocalStorage.getItem.mockReturnValue(null);
      
      initializeI18n();
      
      expect(getCurrentLanguage()).toBe('pt-BR');
    });
  });

  describe('getCurrentLanguage', () => {
    it('should return the current language', () => {
      initializeI18n({ defaultLanguage: 'es' });
      
      expect(getCurrentLanguage()).toBe('es');
    });

    it('should return updated language after switching', async () => {
      initializeI18n();
      await switchLanguage('pt-BR');
      
      expect(getCurrentLanguage()).toBe('pt-BR');
    });
  });

  describe('getSupportedLanguages', () => {
    it('should return all supported languages', () => {
      const languages = getSupportedLanguages();
      
      expect(languages).toEqual(['en', 'pt-BR', 'es', 'fr']);
    });

    it('should return a copy of the array', () => {
      const languages1 = getSupportedLanguages();
      const languages2 = getSupportedLanguages();
      
      expect(languages1).toEqual(languages2);
      expect(languages1).not.toBe(languages2); // Different array instances
    });

    it('should respect custom supported languages configuration', () => {
      initializeI18n({ supportedLanguages: ['en', 'pt-BR'] });
      
      const languages = getSupportedLanguages();
      
      expect(languages).toEqual(['en', 'pt-BR']);
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
      expect(isSupportedLanguage('de')).toBe(false);
      expect(isSupportedLanguage('ja')).toBe(false);
      expect(isSupportedLanguage('invalid')).toBe(false);
    });

    it('should handle null and undefined gracefully', () => {
      expect(isSupportedLanguage(null as any)).toBe(false);
      expect(isSupportedLanguage(undefined as any)).toBe(false);
    });

    it('should be case sensitive', () => {
      expect(isSupportedLanguage('EN')).toBe(false);
      expect(isSupportedLanguage('pt-br')).toBe(false);
    });
  });

  describe('switchLanguage', () => {
    it('should switch to a supported language successfully', async () => {
      await switchLanguage('pt-BR');
      
      expect(getCurrentLanguage()).toBe('pt-BR');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('jungApp_language_preference', 'pt-BR');
    });

    it('should dispatch language change event', async () => {
      await switchLanguage('es');
      
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'languageChange',
          detail: { language: 'es' }
        })
      );
    });

    it('should throw error for unsupported languages', async () => {
      await expect(switchLanguage('de' as SupportedLanguage)).rejects.toThrow('Unsupported language: de');
      
      // Should not change current language
      expect(getCurrentLanguage()).toBe('en');
    });

    it('should handle localStorage save errors', async () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      await expect(switchLanguage('fr')).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error saving language preference:', expect.any(Error));
    });

    it('should log debug information when debug is enabled', async () => {
      initializeI18n({ enableDebug: true });
      
      await switchLanguage('es');
      
      expect(consoleLogSpy).toHaveBeenCalledWith('[i18n] Switched to language: es');
    });

    it('should handle event dispatch errors gracefully', async () => {
      mockDispatchEvent.mockImplementation(() => {
        throw new Error('Event dispatch failed');
      });
      
      // Should not throw despite event dispatch error
      await expect(switchLanguage('fr')).resolves.not.toThrow();
      expect(getCurrentLanguage()).toBe('fr');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error dispatching language change event:', expect.any(Error));
    });
  });

  describe('translate', () => {
    beforeEach(() => {
      initializeI18n();
    });

    it('should translate simple keys in English', () => {
      expect(translate('common.welcome')).toBe('Welcome');
      expect(translate('common.loading')).toBe('Loading...');
      expect(translate('navigation.home')).toBe('Home');
    });

    it('should translate keys in different languages', async () => {
      await switchLanguage('pt-BR');
      
      expect(translate('common.welcome')).toBe('Bem-vindo');
      expect(translate('navigation.home')).toBe('Início');
    });

    it('should handle interpolation in translations', () => {
      const result = translate('quiz.question', {
        interpolations: { number: 3, total: 10 }
      });
      
      expect(result).toBe('Question 3 of 10');
    });

    it('should handle complex interpolation scenarios', () => {
      const result = translate('quiz.score', {
        interpolations: { score: 85.5 }
      });
      
      expect(result).toBe('Score: 85.5%');
    });

    it('should fall back to fallback language when translation missing', () => {
      // Switch to Portuguese but try to translate a key that might be missing
      const result = translate('nonexistent.key');
      
      expect(result).toBe('nonexistent.key'); // Should return key when no translation found
      expect(consoleWarnSpy).toHaveBeenCalledWith('[i18n] Missing translation for key: nonexistent.key');
    });

    it('should use explicit language override', () => {
      const result = translate('common.welcome', { language: 'es' });
      
      expect(result).toBe('Bienvenido');
      expect(getCurrentLanguage()).toBe('en'); // Should not change current language
    });

    it('should use custom fallback text', () => {
      const result = translate('nonexistent.key', { fallback: 'Default Text' });
      
      expect(result).toBe('Default Text');
    });

    it('should handle nested key paths', () => {
      expect(translate('modules.title')).toBe('Educational Modules');
      expect(translate('errors.networkError')).toBe('Network error. Please check your connection.');
    });

    it('should handle translation errors gracefully', () => {
      // Mock a scenario where translation throws an error
      const result = translate('common.welcome', {
        interpolations: { circular: {} as any }
      });
      
      // Should still return something meaningful
      expect(result).toBe('Welcome');
    });

    it('should handle missing interpolation values', () => {
      const result = translate('quiz.question', {
        interpolations: { number: 5 } // missing 'total'
      });
      
      expect(result).toBe('Question 5 of {{total}}'); // Should leave unmatched placeholders
    });

    it('should warn about fallback usage when debug enabled', () => {
      initializeI18n({ enableDebug: true });
      
      // Try to get a missing translation to trigger fallback
      translate('missing.key');
      
      expect(consoleWarnSpy).toHaveBeenCalledWith('[i18n] Missing translation for key: missing.key');
    });
  });

  describe('formatDate', () => {
    const testDate = new Date('2023-12-25T10:30:00');

    it('should format dates in English locale', () => {
      const result = formatDate(testDate);
      
      expect(result).toContain('12'); // Month
      expect(result).toContain('25'); // Day
      expect(result).toContain('2023'); // Year
    });

    it('should format dates in different locales', async () => {
      await switchLanguage('pt-BR');
      
      const result = formatDate(testDate);
      
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should accept custom formatting options', () => {
      const result = formatDate(testDate, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      expect(result).toContain('December');
      expect(result).toContain('25');
      expect(result).toContain('2023');
    });

    it('should handle formatting errors gracefully', () => {
      // Mock Intl.DateTimeFormat to throw an error
      const originalDateTimeFormat = Intl.DateTimeFormat;
      (Intl as any).DateTimeFormat = jest.fn().mockImplementation(() => {
        throw new Error('Formatting error');
      });
      
      const result = formatDate(testDate);
      
      expect(result).toBe(testDate.toString());
      expect(consoleErrorSpy).toHaveBeenCalledWith('Date formatting error:', expect.any(Error));
      
      // Restore original
      (Intl as any).DateTimeFormat = originalDateTimeFormat;
    });
  });

  describe('formatNumber', () => {
    it('should format numbers in English locale', () => {
      const result = formatNumber(1234.56);
      
      expect(result).toBe('1,234.56');
    });

    it('should format numbers in different locales', async () => {
      await switchLanguage('pt-BR');
      
      const result = formatNumber(1234.56);
      
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should accept custom formatting options', () => {
      const result = formatNumber(0.85, {
        style: 'percent'
      });
      
      expect(result).toBe('85%');
    });

    it('should format currency', () => {
      const result = formatNumber(29.99, {
        style: 'currency',
        currency: 'USD'
      });
      
      expect(result).toContain('$29.99');
    });

    it('should handle large numbers', () => {
      const result = formatNumber(1000000);
      
      expect(result).toBe('1,000,000');
    });

    it('should handle negative numbers', () => {
      const result = formatNumber(-123.45);
      
      expect(result).toContain('-123.45');
    });

    it('should handle formatting errors gracefully', () => {
      // Mock Intl.NumberFormat to throw an error
      const originalNumberFormat = Intl.NumberFormat;
      (Intl as any).NumberFormat = jest.fn().mockImplementation(() => {
        throw new Error('Number formatting error');
      });
      
      const result = formatNumber(123.45);
      
      expect(result).toBe('123.45');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Number formatting error:', expect.any(Error));
      
      // Restore original
      (Intl as any).NumberFormat = originalNumberFormat;
    });
  });

  describe('getTextDirection', () => {
    it('should return left-to-right for all supported languages', () => {
      const languages: SupportedLanguage[] = ['en', 'pt-BR', 'es', 'fr'];
      
      for (const lang of languages) {
        expect(getTextDirection()).toBe('ltr');
      }
    });

    it('should return consistent direction regardless of current language', async () => {
      expect(getTextDirection()).toBe('ltr');
      
      await switchLanguage('pt-BR');
      expect(getTextDirection()).toBe('ltr');
      
      await switchLanguage('es');
      expect(getTextDirection()).toBe('ltr');
    });
  });

  describe('getLanguageInfo', () => {
    it('should return correct info for English', () => {
      const info = getLanguageInfo();
      
      expect(info).toEqual({
        language: 'en',
        displayName: 'English',
        nativeName: 'English',
        direction: 'ltr'
      });
    });

    it('should return correct info for Portuguese', async () => {
      await switchLanguage('pt-BR');
      
      const info = getLanguageInfo();
      
      expect(info).toEqual({
        language: 'pt-BR',
        displayName: 'Portuguese (Brazil)',
        nativeName: 'Português (Brasil)',
        direction: 'ltr'
      });
    });

    it('should return correct info for Spanish', async () => {
      await switchLanguage('es');
      
      const info = getLanguageInfo();
      
      expect(info).toEqual({
        language: 'es',
        displayName: 'Spanish',
        nativeName: 'Español',
        direction: 'ltr'
      });
    });

    it('should return correct info for French', async () => {
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

  describe('Browser compatibility and edge cases', () => {
    it('should handle undefined navigator gracefully', () => {
      const originalNavigator = global.navigator;
      delete (global as any).navigator;
      
      initializeI18n();
      
      expect(getCurrentLanguage()).toBe('en'); // Should fallback to default
      
      // Restore navigator
      (global as any).navigator = originalNavigator;
    });

    it('should handle undefined localStorage gracefully', () => {
      const originalLocalStorage = global.localStorage;
      delete (global as any).localStorage;
      
      // Should not throw during initialization
      expect(() => initializeI18n()).not.toThrow();
      
      // Restore localStorage
      (global as any).localStorage = originalLocalStorage;
    });

    it('should handle missing CustomEvent gracefully', async () => {
      const originalCustomEvent = global.CustomEvent;
      delete (global as any).CustomEvent;
      
      // Should not throw during language switching
      await expect(switchLanguage('es')).resolves.not.toThrow();
      
      // Restore CustomEvent
      (global as any).CustomEvent = originalCustomEvent;
    });

    it('should handle server-side rendering environment', () => {
      const originalWindow = global.window;
      delete (global as any).window;
      
      // Should not throw during initialization
      expect(() => initializeI18n()).not.toThrow();
      
      // Restore window
      (global as any).window = originalWindow;
    });

    it('should handle malformed language preference in storage', () => {
      mockLocalStorage.setItem('jungApp_language_preference', 'invalid-language-code');
      
      initializeI18n();
      
      expect(getCurrentLanguage()).toBe('en'); // Should fallback to default
    });

    it('should handle empty string as language preference', () => {
      mockLocalStorage.setItem('jungApp_language_preference', '');
      
      initializeI18n();
      
      expect(getCurrentLanguage()).toBe('en'); // Should fallback to default
    });
  });

  describe('Translation consistency and completeness', () => {
    it('should have consistent translation keys across all languages', () => {
      const languages: SupportedLanguage[] = ['en', 'pt-BR', 'es', 'fr'];
      const testKeys = [
        'common.welcome',
        'common.loading',
        'navigation.home',
        'modules.title',
        'quiz.question',
        'errors.networkError'
      ];
      
      for (const key of testKeys) {
        for (const lang of languages) {
          const translation = translate(key, { language: lang });
          
          expect(translation).not.toBe(key); // Should not return the key itself
          expect(translation.length).toBeGreaterThan(0);
          expect(typeof translation).toBe('string');
        }
      }
    });

    it('should handle deeply nested translation paths', () => {
      const deepKey = 'modules.difficulty';
      const result = translate(deepKey);
      
      expect(result).toBe('Difficulty');
      expect(result).not.toBe(deepKey);
    });

    it('should handle interpolation with special characters', () => {
      const result = translate('quiz.question', {
        interpolations: {
          number: '3 & < > "',
          total: "10 ' `"
        }
      });
      
      expect(result).toContain('3 & < > "');
      expect(result).toContain("10 ' `");
    });
  });
});