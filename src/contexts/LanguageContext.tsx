/**
 * LanguageContext - Simple Language Preference Context
 * Manages language preference with localStorage persistence
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';

export interface LanguageContextType {
  currentLanguage: string;
  availableLanguages: string[];
  setLanguage: (language: string) => void;
  isLanguageSupported: (language: string) => boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
  defaultLanguage?: string;
  availableLanguages?: string[];
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
  defaultLanguage = 'en',
  availableLanguages = ['en', 'pt-BR']
}) => {
  const [currentLanguage, setCurrentLanguage] = useState<string>(defaultLanguage);

  // Load language preference from localStorage on mount
  useEffect(() => {
    try {
      const storedLanguage = localStorage.getItem('jung-edu-language');
      if (storedLanguage && availableLanguages.includes(storedLanguage)) {
        setCurrentLanguage(storedLanguage);
      }
    } catch (error) {
      console.error('Failed to load language preference from localStorage:', error);
    }
  }, [availableLanguages]);

  const setLanguage = useCallback((language: string) => {
    if (availableLanguages.includes(language)) {
      setCurrentLanguage(language);
      try {
        localStorage.setItem('jung-edu-language', language);
      } catch (error) {
        console.error('Failed to save language preference to localStorage:', error);
        // Continue operation - language is still updated in memory
      }
    }
  }, [availableLanguages]);

  const isLanguageSupported = useCallback((language: string) => {
    return availableLanguages.includes(language);
  }, [availableLanguages]);

  const value: LanguageContextType = useMemo(() => ({
    currentLanguage,
    availableLanguages,
    setLanguage,
    isLanguageSupported
  }), [currentLanguage, availableLanguages, setLanguage, isLanguageSupported]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};