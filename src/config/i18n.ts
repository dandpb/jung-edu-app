/**
 * i18n Configuration
 * Setup and configuration for internationalization
 */

import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

export interface I18nConfig {
  fallbackLanguage?: string;
  debug?: boolean;
  namespace?: string;
}

// Mock translations for testing
const resources = {
  en: {
    translation: {
      'test.key': 'Test Value',
      'nested.deep.key': 'Deep Value',
      'hello.name': 'Hello {{name}}',
      'count.items_one': '{{count}} item',
      'count.items_other': '{{count}} items'
    },
    common: {
      'button.save': 'Save',
      'button.cancel': 'Cancel'
    }
  },
  'pt-BR': {
    translation: {
      'test.key': 'Valor de Teste',
      'nested.deep.key': 'Valor Profundo',
      'hello.name': 'Olá {{name}}',
      'count.items_one': '{{count}} item',
      'count.items_other': '{{count}} itens'
    },
    common: {
      'button.save': 'Salvar',
      'button.cancel': 'Cancelar'
    }
  }
};

export const setupI18n = async (config: I18nConfig = {}) => {
  if (!i18next.isInitialized) {
    await i18next
      .use(initReactI18next)
      .init({
        resources,
        lng: 'en',
        fallbackLng: config.fallbackLanguage || 'en',
        debug: config.debug || false,
        
        interpolation: {
          escapeValue: false,
        },
        
        defaultNS: 'translation',
        ns: ['translation', 'common']
      });
  }
};

export const switchLanguage = async (language: string) => {
  await i18next.changeLanguage(language);
};

export const getI18nInstance = () => i18next;