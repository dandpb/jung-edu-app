/**
 * Internationalization (i18n) utility functions
 * Handles language switching, translations, and locale management
 */

// Language types and interfaces
export type SupportedLanguage = 'en' | 'pt-BR' | 'es' | 'fr';

export interface TranslationResource {
  [key: string]: string | TranslationResource;
}

export interface I18nConfig {
  defaultLanguage: SupportedLanguage;
  supportedLanguages: SupportedLanguage[];
  fallbackLanguage: SupportedLanguage;
  enableDebug: boolean;
}

export interface FormatOptions {
  language?: SupportedLanguage;
  fallback?: string;
  interpolations?: Record<string, string | number>;
}

// Default configuration
const DEFAULT_CONFIG: I18nConfig = {
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'pt-BR', 'es', 'fr'],
  fallbackLanguage: 'en',
  enableDebug: process.env.NODE_ENV === 'development'
};

// Translation resources
const TRANSLATIONS: Record<SupportedLanguage, TranslationResource> = {
  'en': {
    common: {
      welcome: 'Welcome',
      loading: 'Loading...',
      error: 'An error occurred',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
      confirm: 'Confirm',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      finish: 'Finish'
    },
    navigation: {
      home: 'Home',
      modules: 'Modules',
      progress: 'Progress',
      notes: 'Notes',
      settings: 'Settings',
      logout: 'Logout'
    },
    modules: {
      title: 'Educational Modules',
      completed: 'Completed',
      inProgress: 'In Progress',
      notStarted: 'Not Started',
      difficulty: 'Difficulty',
      estimatedTime: 'Estimated Time',
      prerequisites: 'Prerequisites'
    },
    quiz: {
      question: 'Question {{number}} of {{total}}',
      score: 'Score: {{score}}%',
      passed: 'Congratulations! You passed!',
      failed: 'You need to score at least {{passingScore}}% to pass',
      retry: 'Try Again',
      viewResults: 'View Results'
    },
    errors: {
      networkError: 'Network error. Please check your connection.',
      notFound: 'The requested resource was not found.',
      unauthorized: 'You are not authorized to access this resource.',
      validationError: 'Please check your input and try again.',
      unknownError: 'An unexpected error occurred. Please try again later.'
    }
  },
  'pt-BR': {
    common: {
      welcome: 'Bem-vindo',
      loading: 'Carregando...',
      error: 'Ocorreu um erro',
      save: 'Salvar',
      cancel: 'Cancelar',
      delete: 'Excluir',
      edit: 'Editar',
      close: 'Fechar',
      confirm: 'Confirmar',
      back: 'Voltar',
      next: 'Próximo',
      previous: 'Anterior',
      finish: 'Finalizar'
    },
    navigation: {
      home: 'Início',
      modules: 'Módulos',
      progress: 'Progresso',
      notes: 'Anotações',
      settings: 'Configurações',
      logout: 'Sair'
    },
    modules: {
      title: 'Módulos Educacionais',
      completed: 'Concluído',
      inProgress: 'Em Progresso',
      notStarted: 'Não Iniciado',
      difficulty: 'Dificuldade',
      estimatedTime: 'Tempo Estimado',
      prerequisites: 'Pré-requisitos'
    },
    quiz: {
      question: 'Pergunta {{number}} de {{total}}',
      score: 'Pontuação: {{score}}%',
      passed: 'Parabéns! Você passou!',
      failed: 'Você precisa de pelo menos {{passingScore}}% para passar',
      retry: 'Tentar Novamente',
      viewResults: 'Ver Resultados'
    },
    errors: {
      networkError: 'Erro de rede. Verifique sua conexão.',
      notFound: 'O recurso solicitado não foi encontrado.',
      unauthorized: 'Você não tem autorização para acessar este recurso.',
      validationError: 'Verifique sua entrada e tente novamente.',
      unknownError: 'Ocorreu um erro inesperado. Tente novamente mais tarde.'
    }
  },
  'es': {
    common: {
      welcome: 'Bienvenido',
      loading: 'Cargando...',
      error: 'Ocurrió un error',
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      edit: 'Editar',
      close: 'Cerrar',
      confirm: 'Confirmar',
      back: 'Atrás',
      next: 'Siguiente',
      previous: 'Anterior',
      finish: 'Finalizar'
    },
    navigation: {
      home: 'Inicio',
      modules: 'Módulos',
      progress: 'Progreso',
      notes: 'Notas',
      settings: 'Configuración',
      logout: 'Cerrar Sesión'
    },
    modules: {
      title: 'Módulos Educativos',
      completed: 'Completado',
      inProgress: 'En Progreso',
      notStarted: 'Sin Comenzar',
      difficulty: 'Dificultad',
      estimatedTime: 'Tiempo Estimado',
      prerequisites: 'Prerrequisitos'
    },
    quiz: {
      question: 'Pregunta {{number}} de {{total}}',
      score: 'Puntuación: {{score}}%',
      passed: '¡Felicidades! ¡Aprobaste!',
      failed: 'Necesitas al menos {{passingScore}}% para aprobar',
      retry: 'Intentar de Nuevo',
      viewResults: 'Ver Resultados'
    },
    errors: {
      networkError: 'Error de red. Verifica tu conexión.',
      notFound: 'El recurso solicitado no fue encontrado.',
      unauthorized: 'No estás autorizado para acceder a este recurso.',
      validationError: 'Verifica tu entrada e intenta nuevamente.',
      unknownError: 'Ocurrió un error inesperado. Inténtalo más tarde.'
    }
  },
  'fr': {
    common: {
      welcome: 'Bienvenue',
      loading: 'Chargement...',
      error: 'Une erreur est survenue',
      save: 'Enregistrer',
      cancel: 'Annuler',
      delete: 'Supprimer',
      edit: 'Modifier',
      close: 'Fermer',
      confirm: 'Confirmer',
      back: 'Retour',
      next: 'Suivant',
      previous: 'Précédent',
      finish: 'Terminer'
    },
    navigation: {
      home: 'Accueil',
      modules: 'Modules',
      progress: 'Progrès',
      notes: 'Notes',
      settings: 'Paramètres',
      logout: 'Déconnexion'
    },
    modules: {
      title: 'Modules Éducatifs',
      completed: 'Terminé',
      inProgress: 'En Cours',
      notStarted: 'Non Commencé',
      difficulty: 'Difficulté',
      estimatedTime: 'Temps Estimé',
      prerequisites: 'Prérequis'
    },
    quiz: {
      question: 'Question {{number}} de {{total}}',
      score: 'Score : {{score}}%',
      passed: 'Félicitations ! Vous avez réussi !',
      failed: 'Vous devez obtenir au moins {{passingScore}}% pour réussir',
      retry: 'Réessayer',
      viewResults: 'Voir les Résultats'
    },
    errors: {
      networkError: 'Erreur réseau. Vérifiez votre connexion.',
      notFound: 'La ressource demandée n\'a pas été trouvée.',
      unauthorized: 'Vous n\'êtes pas autorisé à accéder à cette ressource.',
      validationError: 'Vérifiez votre saisie et réessayez.',
      unknownError: 'Une erreur inattendue s\'est produite. Réessayez plus tard.'
    }
  }
};

// Current language state
let currentLanguage: SupportedLanguage = DEFAULT_CONFIG.defaultLanguage;
let config: I18nConfig = { ...DEFAULT_CONFIG };

// Storage key for persisting language preference
const LANGUAGE_STORAGE_KEY = 'jungApp_language_preference';

/**
 * Initialize the i18n system
 */
export function initializeI18n(customConfig?: Partial<I18nConfig>): void {
  try {
    if (customConfig) {
      config = { ...DEFAULT_CONFIG, ...customConfig };
    }

    // Try to load saved language preference
    const savedLanguage = loadLanguagePreference();
    if (savedLanguage && isSupportedLanguage(savedLanguage)) {
      currentLanguage = savedLanguage;
    } else {
      // Detect browser language
      const browserLanguage = detectBrowserLanguage();
      if (browserLanguage && isSupportedLanguage(browserLanguage)) {
        currentLanguage = browserLanguage;
      }
    }

    if (config.enableDebug) {
      console.log(`[i18n] Initialized with language: ${currentLanguage}`);
    }
  } catch (error) {
    console.error('Failed to initialize i18n:', error);
    currentLanguage = config.fallbackLanguage;
  }
}

/**
 * Get the current language
 */
export function getCurrentLanguage(): SupportedLanguage {
  return currentLanguage;
}

/**
 * Get all supported languages
 */
export function getSupportedLanguages(): SupportedLanguage[] {
  return [...config.supportedLanguages];
}

/**
 * Check if a language is supported
 */
export function isSupportedLanguage(language: string): language is SupportedLanguage {
  return config.supportedLanguages.includes(language as SupportedLanguage);
}

/**
 * Switch to a different language
 */
export async function switchLanguage(language: SupportedLanguage): Promise<void> {
  try {
    if (!isSupportedLanguage(language)) {
      throw new Error(`Unsupported language: ${language}`);
    }

    currentLanguage = language;
    await saveLanguagePreference(language);

    if (config.enableDebug) {
      console.log(`[i18n] Switched to language: ${language}`);
    }

    // Trigger any language change listeners
    dispatchLanguageChange(language);
  } catch (error) {
    console.error('Failed to switch language:', error);
    throw error;
  }
}

/**
 * Get a translated string
 */
export function translate(key: string, options?: FormatOptions): string {
  try {
    const language = options?.language || currentLanguage;
    const translation = getNestedTranslation(TRANSLATIONS[language], key);
    
    if (translation !== null) {
      return interpolateString(translation, options?.interpolations);
    }

    // Try fallback language
    if (language !== config.fallbackLanguage) {
      const fallbackTranslation = getNestedTranslation(
        TRANSLATIONS[config.fallbackLanguage], 
        key
      );
      if (fallbackTranslation !== null) {
        if (config.enableDebug) {
          console.warn(`[i18n] Using fallback for key: ${key}`);
        }
        return interpolateString(fallbackTranslation, options?.interpolations);
      }
    }

    // Return fallback or key if no translation found
    if (options?.fallback) {
      return options.fallback;
    }

    if (config.enableDebug) {
      console.warn(`[i18n] Missing translation for key: ${key}`);
    }

    return key;
  } catch (error) {
    console.error('Translation error:', error);
    return options?.fallback || key;
  }
}

/**
 * Format a date according to current locale
 */
export function formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
  try {
    const locale = getLocaleFromLanguage(currentLanguage);
    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch (error) {
    console.error('Date formatting error:', error);
    return date.toString();
  }
}

/**
 * Format a number according to current locale
 */
export function formatNumber(number: number, options?: Intl.NumberFormatOptions): string {
  try {
    const locale = getLocaleFromLanguage(currentLanguage);
    return new Intl.NumberFormat(locale, options).format(number);
  } catch (error) {
    console.error('Number formatting error:', error);
    return number.toString();
  }
}

/**
 * Get the text direction for the current language
 */
export function getTextDirection(): 'ltr' | 'rtl' {
  // All currently supported languages use left-to-right text direction
  return 'ltr';
}

/**
 * Get language-specific formatting information
 */
export function getLanguageInfo(): {
  language: SupportedLanguage;
  displayName: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
} {
  const languageInfo = {
    'en': { displayName: 'English', nativeName: 'English' },
    'pt-BR': { displayName: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)' },
    'es': { displayName: 'Spanish', nativeName: 'Español' },
    'fr': { displayName: 'French', nativeName: 'Français' }
  };

  return {
    language: currentLanguage,
    displayName: languageInfo[currentLanguage].displayName,
    nativeName: languageInfo[currentLanguage].nativeName,
    direction: getTextDirection()
  };
}

// Utility functions

function getNestedTranslation(obj: TranslationResource, key: string): string | null {
  const keys = key.split('.');
  let current: any = obj;

  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      return null;
    }
  }

  return typeof current === 'string' ? current : null;
}

function interpolateString(template: string, values?: Record<string, string | number>): string {
  if (!values) return template;

  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return values[key] !== undefined ? String(values[key]) : match;
  });
}

function detectBrowserLanguage(): string | null {
  try {
    if (typeof navigator !== 'undefined') {
      return navigator.language || (navigator as any).userLanguage;
    }
    return null;
  } catch (error) {
    console.error('Error detecting browser language:', error);
    return null;
  }
}

function loadLanguagePreference(): string | null {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(LANGUAGE_STORAGE_KEY);
    }
    return null;
  } catch (error) {
    console.error('Error loading language preference:', error);
    return null;
  }
}

async function saveLanguagePreference(language: SupportedLanguage): Promise<void> {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    }
  } catch (error) {
    console.error('Error saving language preference:', error);
    throw error;
  }
}

function getLocaleFromLanguage(language: SupportedLanguage): string {
  const localeMap: Record<SupportedLanguage, string> = {
    'en': 'en-US',
    'pt-BR': 'pt-BR',
    'es': 'es-ES',
    'fr': 'fr-FR'
  };

  return localeMap[language] || 'en-US';
}

function dispatchLanguageChange(language: SupportedLanguage): void {
  try {
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      const event = new CustomEvent('languageChange', {
        detail: { language }
      });
      window.dispatchEvent(event);
    }
  } catch (error) {
    console.error('Error dispatching language change event:', error);
  }
}

// Initialize on module load
initializeI18n();