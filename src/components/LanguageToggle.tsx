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

  const handleToggleLanguage = () => {
    if (supportedLanguages.length < 2) {
      return; // Can't toggle with less than 2 languages
    }

    const currentIndex = supportedLanguages.indexOf(language);
    const nextIndex = (currentIndex + 1) % supportedLanguages.length;
    const nextLanguage = supportedLanguages[nextIndex];

    changeLanguage(nextLanguage);
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
      className={`language-toggle ${className}`.trim()}
      aria-label={ariaLabel}
      role="button"
      type="button"
      disabled={supportedLanguages.length < 2}
    >
      {getLanguageDisplayName(language)}
    </button>
  );
};

export default LanguageToggle;