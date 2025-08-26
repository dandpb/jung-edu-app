/**
 * LanguageContext - Simple Language Preference Context
 * Manages language preference with localStorage persistence
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
    const storedLanguage = localStorage.getItem('jung-edu-language');
    if (storedLanguage && availableLanguages.includes(storedLanguage)) {
      setCurrentLanguage(storedLanguage);
    }
  }, [availableLanguages]);

  const setLanguage = (language: string) => {
    if (availableLanguages.includes(language)) {
      setCurrentLanguage(language);
      localStorage.setItem('jung-edu-language', language);
    }
  };

  const isLanguageSupported = (language: string) => {
    return availableLanguages.includes(language);
  };

  const value: LanguageContextType = {
    currentLanguage,
    availableLanguages,
    setLanguage,
    isLanguageSupported
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};