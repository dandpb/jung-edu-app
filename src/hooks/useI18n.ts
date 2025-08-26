/**
 * useI18n Hook - Enhanced Internationalization Hook
 * Provides comprehensive i18n functionality with advanced features
 */

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { switchLanguage } from '../config/i18n';

export interface UseI18nReturn {
  // Core translation
  t: (key: string, options?: any) => string;
  
  // Language management
  language: string;
  supportedLanguages: string[];
  changeLanguage: (lang: string, options?: { namespace?: string }) => Promise<void>;
  
  // State
  isLoading: boolean;
  isReady: boolean;
  
  // Resource management  
  getAvailableTranslations: (namespace?: string) => string[];
  hasTranslation: (key: string) => boolean;
  
  // Namespace management
  getCurrentNamespace: () => string;
  loadNamespace: (namespace: string | string[]) => Promise<void>;
}

export const useI18n = (): UseI18nReturn => {
  const { t, i18n, ready } = useTranslation();

  // Enhanced language switching with validation and error handling
  const changeLanguage = useCallback(async (
    lang: string, 
    options?: { namespace?: string }
  ) => {
    if (!lang || typeof lang !== 'string' || lang.trim() === '') {
      console.error('Invalid language code provided:', lang);
      return;
    }

    try {
      await i18n.changeLanguage(lang);
      await switchLanguage(lang);
      
      if (options?.namespace) {
        await i18n.loadNamespaces([options.namespace]);
      }
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  }, [i18n]);

  // Load additional namespaces
  const loadNamespace = useCallback(async (namespace: string | string[]) => {
    try {
      const namespaces = Array.isArray(namespace) ? namespace : [namespace];
      await i18n.loadNamespaces(namespaces);
    } catch (error) {
      console.error('Failed to load namespace:', error);
    }
  }, [i18n]);

  // Get available translations for current language and namespace
  const getAvailableTranslations = useCallback((namespace?: string) => {
    const ns = namespace || 'translation';
    const resourceBundle = i18n.getResourceBundle(i18n.language, ns);
    return resourceBundle ? Object.keys(resourceBundle) : [];
  }, [i18n]);

  // Check if translation exists
  const hasTranslation = useCallback((key: string) => {
    return i18n.exists(key);
  }, [i18n]);

  // Get current namespace
  const getCurrentNamespace = useCallback(() => {
    return 'translation'; // Default namespace
  }, []);

  return {
    t,
    language: i18n.language,
    supportedLanguages: ['en', 'pt-BR'], // Based on app config
    changeLanguage,
    isLoading: false, // Would be managed by context in real app
    isReady: ready && i18n.isInitialized,
    getAvailableTranslations,
    hasTranslation,
    getCurrentNamespace,
    loadNamespace,
  };
};