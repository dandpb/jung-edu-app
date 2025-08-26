/**
 * I18n Test Utilities
 * Provides mock configurations, test helpers, and utilities for internationalization testing
 */

import React from 'react';
import { I18nProvider } from '../contexts/I18nContext';

// Mock translation database
const DEFAULT_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    'language.switch': 'Switch Language',
    'language.english': 'English',
    'language.portuguese': 'Portuguese',
    'language.spanish': 'Spanish',
    'language.french': 'French',
    'language.german': 'German',
    'language.current': 'Current: {{language}}',
    'language.select': 'Select Language',
    'language.loading': 'Loading...',
    'language.error': 'Error switching language',
    'hello.name': 'Hello {{name}}',
    'count.items_one': '1 item',
    'count.items_other': '{{count}} items',
    'test.key': 'Test Value',
    'nested.deep.key': 'Deep Value',
    'button.save': 'Save',
    'button.cancel': 'Cancel',
    'form.submit': 'Submit',
    'form.reset': 'Reset'
  },
  'pt-BR': {
    'language.switch': 'Alternar Idioma',
    'language.english': 'Inglês',
    'language.portuguese': 'Português',
    'language.spanish': 'Espanhol',
    'language.french': 'Francês',
    'language.german': 'Alemão',
    'language.current': 'Atual: {{language}}',
    'language.select': 'Selecionar Idioma',
    'language.loading': 'Carregando...',
    'language.error': 'Erro ao alternar idioma',
    'hello.name': 'Olá {{name}}',
    'count.items_one': '1 item',
    'count.items_other': '{{count}} itens',
    'test.key': 'Valor de Teste',
    'nested.deep.key': 'Valor Profundo',
    'button.save': 'Salvar',
    'button.cancel': 'Cancelar',
    'form.submit': 'Enviar',
    'form.reset': 'Limpar'
  },
  es: {
    'language.switch': 'Cambiar Idioma',
    'language.english': 'Inglés',
    'language.portuguese': 'Portugués',
    'language.spanish': 'Español',
    'language.french': 'Francés',
    'language.german': 'Alemán',
    'language.current': 'Actual: {{language}}',
    'language.select': 'Seleccionar Idioma',
    'language.loading': 'Cargando...',
    'language.error': 'Error al cambiar idioma',
    'hello.name': 'Hola {{name}}',
    'count.items_one': '1 artículo',
    'count.items_other': '{{count}} artículos',
    'test.key': 'Valor de Prueba',
    'nested.deep.key': 'Valor Profundo',
    'button.save': 'Guardar',
    'button.cancel': 'Cancelar',
    'form.submit': 'Enviar',
    'form.reset': 'Restablecer'
  }
};

// Mock i18n instance configuration
interface MockI18nConfig {
  language?: string;
  languages?: string[];
  isInitialized?: boolean;
  changeLanguage?: jest.MockedFunction<(lang: string) => Promise<void>>;
  loadNamespaces?: jest.MockedFunction<(namespaces: string[]) => Promise<void>>;
  exists?: jest.MockedFunction<(key: string) => boolean>;
  getResourceBundle?: jest.MockedFunction<(lang: string, namespace: string) => any>;
  getResource?: jest.MockedFunction<(lang: string, namespace: string, key: string) => string>;
  store?: {
    data: Record<string, Record<string, Record<string, string>>>;
  };
}

/**
 * Creates a mock i18n instance for testing
 */
export const createMockI18nInstance = (config: MockI18nConfig = {}) => {
  const {
    language = 'en',
    languages = ['en', 'pt-BR', 'es'],
    isInitialized = true,
    changeLanguage = jest.fn().mockResolvedValue(undefined),
    loadNamespaces = jest.fn().mockResolvedValue(undefined),
    exists = jest.fn().mockReturnValue(true),
    getResourceBundle = jest.fn().mockImplementation((lang: string, ns: string) => {
      return DEFAULT_TRANSLATIONS[lang] || {};
    }),
    getResource = jest.fn().mockImplementation((lang: string, ns: string, key: string) => {
      return DEFAULT_TRANSLATIONS[lang]?.[key] || `${lang}_${ns}_${key}`;
    }),
    store = {
      data: {
        'en': { translation: DEFAULT_TRANSLATIONS.en },
        'pt-BR': { translation: DEFAULT_TRANSLATIONS['pt-BR'] },
        'es': { translation: DEFAULT_TRANSLATIONS.es }
      }
    }
  } = config;

  return {
    language,
    languages,
    isInitialized,
    changeLanguage,
    loadNamespaces,
    exists,
    getResourceBundle,
    getResource,
    hasResourceBundle: jest.fn().mockReturnValue(true),
    store,
    // Additional i18next methods that might be needed
    options: {
      fallbackLng: 'en',
      debug: false
    },
    isLanguageChangingTo: jest.fn().mockReturnValue(false),
    getFixedT: jest.fn(),
    dir: jest.fn().mockReturnValue('ltr'),
    format: jest.fn(),
    init: jest.fn().mockResolvedValue(undefined),
    use: jest.fn().mockReturnThis(),
    cloneInstance: jest.fn(),
    createInstance: jest.fn()
  };
};

/**
 * Translation function configuration
 */
interface MockTranslationConfig {
  [key: string]: string;
}

/**
 * Creates a mock translation function
 */
export const createMockTranslationFunction = (customTranslations: MockTranslationConfig = {}) => {
  return jest.fn().mockImplementation((key: string, options: any = {}) => {
    // Check custom translations first
    if (customTranslations[key]) {
      return customTranslations[key];
    }

    // Check default translations
    const currentLang = options.lng || 'en';
    const translations = DEFAULT_TRANSLATIONS[currentLang] || DEFAULT_TRANSLATIONS.en;
    
    if (translations[key]) {
      let translation = translations[key];
      
      // Handle interpolation
      if (options && typeof options === 'object') {
        Object.keys(options).forEach(optionKey => {
          if (optionKey !== 'defaultValue' && optionKey !== 'count' && optionKey !== 'lng') {
            translation = translation.replace(
              new RegExp(`{{\\s*${optionKey}\\s*}}`, 'g'), 
              String(options[optionKey])
            );
          }
        });
      }
      
      return translation;
    }

    // Handle default value
    if (options.defaultValue || (typeof options === 'string')) {
      return typeof options === 'string' ? options : options.defaultValue;
    }

    // Handle pluralization
    if (options.count !== undefined) {
      const pluralKey = options.count === 1 ? `${key}_one` : `${key}_other`;
      const pluralTranslation = translations[pluralKey];
      
      if (pluralTranslation) {
        return pluralTranslation.replace('{{count}}', String(options.count));
      }
      
      // Fallback pluralization
      return options.count === 1 ? '1 item' : `${options.count} items`;
    }

    // Special handling for common patterns
    if (key === 'hello.name' && options.name) {
      return `Hello ${options.name}`;
    }

    // Fallback to prefixed key
    return `translated_${key}`;
  });
};

/**
 * I18n Provider wrapper configuration
 */
interface I18nWrapperConfig {
  language?: string;
  supportedLanguages?: string[];
  translations?: MockTranslationConfig;
  isLoading?: boolean;
  isReady?: boolean;
  mockI18nInstance?: any;
}

/**
 * Creates a test wrapper component with I18nProvider
 */
export const createI18nTestWrapper = (config: I18nWrapperConfig = {}) => {
  const {
    language = 'en',
    supportedLanguages = ['en', 'pt-BR'],
    translations = {},
    isLoading = false,
    isReady = true,
    mockI18nInstance
  } = config;

  const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Mock the context values if needed
    const contextValue = {
      language,
      supportedLanguages,
      isLoading,
      isReady,
      ...config
    };

    return (
      <I18nProvider {...contextValue}>
        {children}
      </I18nProvider>
    );
  };

  return TestWrapper;
};

/**
 * Mock setup configuration
 */
interface MockSetupConfig {
  language?: string;
  supportedLanguages?: string[];
  translations?: MockTranslationConfig;
  isLoading?: boolean;
  isReady?: boolean;
}

// Global mock instances for reuse
let globalMockI18nInstance: any;
let globalMockT: any;

/**
 * Sets up all i18n mocks for testing
 */
export const setupI18nMocks = (config: MockSetupConfig = {}) => {
  const {
    language = 'en',
    supportedLanguages = ['en', 'pt-BR'],
    translations = {},
    isLoading = false,
    isReady = true
  } = config;

  // Create or update global mock instances
  globalMockI18nInstance = createMockI18nInstance({
    language,
    languages: supportedLanguages
  });
  
  globalMockT = createMockTranslationFunction(translations);

  // Clear all mock call counts
  jest.clearAllMocks();

  return {
    mockI18nInstance: globalMockI18nInstance,
    mockT: globalMockT
  };
};

/**
 * Resets all i18n mocks to default state
 */
export const resetI18nMocks = () => {
  if (globalMockI18nInstance) {
    globalMockI18nInstance.language = 'en';
    globalMockI18nInstance.languages = ['en', 'pt-BR'];
    globalMockI18nInstance.isInitialized = true;
  }

  // Clear all mock implementations and call counts
  jest.clearAllMocks();
  jest.restoreAllMocks();

  // Recreate with defaults
  return setupI18nMocks();
};

/**
 * Helper to create test scenarios
 */
export const createI18nTestScenarios = () => {
  return {
    // Basic scenarios
    englishOnly: {
      language: 'en',
      supportedLanguages: ['en'],
      isReady: true
    },
    
    bilingual: {
      language: 'en',
      supportedLanguages: ['en', 'pt-BR'],
      isReady: true
    },
    
    multilingual: {
      language: 'en',
      supportedLanguages: ['en', 'pt-BR', 'es', 'fr', 'de'],
      isReady: true
    },
    
    // Loading states
    loading: {
      language: 'en',
      supportedLanguages: ['en', 'pt-BR'],
      isLoading: true,
      isReady: false
    },
    
    // Error states
    notReady: {
      language: 'en',
      supportedLanguages: ['en', 'pt-BR'],
      isLoading: false,
      isReady: false
    },
    
    // Portuguese default
    portuguese: {
      language: 'pt-BR',
      supportedLanguages: ['en', 'pt-BR'],
      isReady: true
    },
    
    // Edge cases
    emptyLanguages: {
      language: 'en',
      supportedLanguages: [],
      isReady: true
    },
    
    unknownLanguage: {
      language: 'unknown',
      supportedLanguages: ['en', 'pt-BR'],
      isReady: true
    }
  };
};

/**
 * Mock error creators for testing error scenarios
 */
export const createI18nErrors = () => {
  return {
    languageChangeError: new Error('Failed to change language'),
    namespaceLoadError: new Error('Failed to load namespace'),
    translationError: new Error('Translation not found'),
    initializationError: new Error('Failed to initialize i18n'),
    networkError: new Error('Network error loading translations')
  };
};

/**
 * Creates async mock functions with delays for testing loading states
 */
export const createAsyncI18nMocks = () => {
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  return {
    slowLanguageChange: jest.fn().mockImplementation(async (lang: string) => {
      await delay(100);
      return undefined;
    }),
    
    fastLanguageChange: jest.fn().mockImplementation(async (lang: string) => {
      await delay(10);
      return undefined;
    }),
    
    failingLanguageChange: jest.fn().mockImplementation(async (lang: string) => {
      await delay(50);
      throw new Error('Language change failed');
    }),
    
    slowNamespaceLoad: jest.fn().mockImplementation(async (namespaces: string[]) => {
      await delay(200);
      return undefined;
    })
  };
};

/**
 * Performance testing utilities
 */
export const createPerformanceTestUtils = () => {
  return {
    measureTranslationPerformance: (t: any, keys: string[], iterations: number = 100) => {
      const start = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        keys.forEach(key => t(key));
      }
      
      const end = performance.now();
      return end - start;
    },
    
    createLargeTranslationSet: (size: number) => {
      const translations: MockTranslationConfig = {};
      
      for (let i = 0; i < size; i++) {
        translations[`key.${i}`] = `Value ${i}`;
      }
      
      return translations;
    }
  };
};

/**
 * Validation utilities for testing
 */
export const createValidationUtils = () => {
  return {
    validateLanguageCode: (code: string) => {
      return /^[a-z]{2}(-[A-Z]{2})?$/.test(code);
    },
    
    validateTranslationKey: (key: string) => {
      return /^[a-zA-Z][a-zA-Z0-9._]*$/.test(key);
    },
    
    validateInterpolation: (text: string) => {
      return /{{\s*\w+\s*}}/.test(text);
    }
  };
};

// Export default configurations for easy use
export const DEFAULT_I18N_CONFIG = {
  language: 'en',
  supportedLanguages: ['en', 'pt-BR'],
  isReady: true,
  isLoading: false
};

export const DEFAULT_MULTILINGUAL_CONFIG = {
  language: 'en',
  supportedLanguages: ['en', 'pt-BR', 'es', 'fr', 'de'],
  isReady: true,
  isLoading: false
};
