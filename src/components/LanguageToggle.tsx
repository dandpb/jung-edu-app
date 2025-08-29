/**
 * LanguageToggle - Button component for toggling between languages
 */

import React from 'react';
import { useI18n } from '../hooks/useI18n';

export interface LanguageToggleProps {
  className?: string;
  'aria-label'?: string;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({
  className = '',
  'aria-label': ariaLabel = 'Toggle language'
}) => {
  const { language, changeLanguage, supportedLanguages, t } = useI18n();

  // Ensure supportedLanguages is an array
  const safeLanguages = supportedLanguages || [];

  const handleToggleLanguage = async () => {
    if (safeLanguages.length < 2) {
      return; // Can't toggle with less than 2 languages
    }

    try {
      const currentIndex = safeLanguages.indexOf(language);
      const nextIndex = (currentIndex + 1) % safeLanguages.length;
      const nextLanguage = safeLanguages[nextIndex];

      await changeLanguage(nextLanguage);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggleLanguage();
    }
  };

  const getLanguageDisplayName = (languageCode: string): string => {
    const languageNames: Record<string, string> = {
      'en': 'EN',
      'pt-BR': 'PT',
      'es': 'ES',
      'fr': 'FR',
      'de': 'DE'
    };
    return languageNames[languageCode] || languageCode.toUpperCase();
  };

  return (
    <button
      onClick={handleToggleLanguage}
      onKeyDown={handleKeyDown}
      className={`language-toggle ${className}`.trim()}
      aria-label={ariaLabel}
      role="button"
      type="button"
      disabled={safeLanguages.length < 2}
    >
      {getLanguageDisplayName(language || 'en')}
    </button>
  );
};

export default LanguageToggle;