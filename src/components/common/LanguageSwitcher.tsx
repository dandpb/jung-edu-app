/**
 * LanguageSwitcher - Dropdown component for language selection
 */

import React from 'react';
import { useI18n } from '../../hooks/useI18n';

export interface LanguageSwitcherProps {
  className?: string;
  'aria-label'?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className = '',
  'aria-label': ariaLabel = 'Select language'
}) => {
  const { language, changeLanguage, supportedLanguages } = useI18n();

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = event.target.value;
    if (newLanguage && newLanguage !== language) {
      changeLanguage(newLanguage);
    }
  };

  const getLanguageDisplayName = (languageCode: string): string => {
    const languageNames: Record<string, string> = {
      'en': 'English',
      'pt-BR': 'Português (Brasil)',
      'es': 'Español',
      'fr': 'Français',
      'de': 'Deutsch'
    };
    return languageNames[languageCode] || languageCode;
  };

  return (
    <select
      value={language}
      onChange={handleLanguageChange}
      className={`language-switcher ${className}`.trim()}
      aria-label={ariaLabel}
      role="combobox"
    >
      {supportedLanguages.map((lang) => (
        <option key={lang} value={lang}>
          {getLanguageDisplayName(lang)}
        </option>
      ))}
    </select>
  );
};

export default LanguageSwitcher;