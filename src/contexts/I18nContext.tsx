/**
 * I18nContext - Internationalization Context Provider
 * Provides i18n functionality with translation management, language switching, and resource loading
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { setupI18n, switchLanguage, getI18nInstance } from '../config/i18n';

export interface I18nOptions {
  fallbackLanguage?: string;
  debug?: boolean;
  namespace?: string;
}

export interface I18nContextType {
  // Translation function
  t: (key: string, options?: any) => string;
  
  // Language management
  language: string;
  supportedLanguages: string[];
  changeLanguage: (lang: string, options?: { namespace?: string }) => Promise<void>;
  
  // State management
  isLoading: boolean;
  isReady: boolean;
  
  // Resource management
  getAvailableTranslations: (namespace?: string) => string[];
  hasTranslation: (key: string) => boolean;
  
  // Namespace management
  getCurrentNamespace: () => string;
  loadNamespace: (namespace: string | string[]) => Promise<void>;
}

export const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

interface I18nProviderProps {
  children: ReactNode;
  options?: I18nOptions;
  debug?: boolean;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ 
  children, 
  options = {},
  debug = false 
}) => {
  const { t, i18n, ready } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [currentNamespace, setCurrentNamespace] = useState('translation');

  // Initialize i18n on mount
  useEffect(() => {
    const initializeI18n = async () => {
      try {
        await setupI18n({
          debug,
          fallbackLanguage: 'en',
          ...options
        });
      } catch (error) {
        console.error('Failed to initialize i18n:', error);
      }
    };

    if (!i18n.isInitialized) {
      initializeI18n();
    }
  }, [i18n.isInitialized, options, debug]);

  // Enhanced language switching with validation and error handling
  const changeLanguage = useCallback(async (
    lang: string, 
    switchOptions?: { namespace?: string }
  ) => {
    if (!lang || typeof lang !== 'string' || lang.trim() === '') {
      console.error('Invalid language code provided:', lang);
      return;
    }

    setIsLoading(true);
    
    try {
      await i18n.changeLanguage(lang);
      await switchLanguage(lang);
      
      if (switchOptions?.namespace) {
        await i18n.loadNamespaces([switchOptions.namespace]);
        setCurrentNamespace(switchOptions.namespace);
      }
    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      setIsLoading(false);
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
    const ns = namespace || currentNamespace;
    const resourceBundle = i18n.getResourceBundle(i18n.language, ns);
    return resourceBundle ? Object.keys(resourceBundle) : [];
  }, [i18n, currentNamespace]);

  // Check if translation exists
  const hasTranslation = useCallback((key: string) => {
    return i18n.exists(key);
  }, [i18n]);

  // Get current namespace
  const getCurrentNamespace = useCallback(() => {
    return currentNamespace;
  }, [currentNamespace]);

  const value: I18nContextType = {
    t,
    language: i18n.language,
    supportedLanguages: ['en', 'pt-BR'], // Based on config
    changeLanguage,
    isLoading,
    isReady: ready && i18n.isInitialized,
    getAvailableTranslations,
    hasTranslation,
    getCurrentNamespace,
    loadNamespace,
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};