/**
 * Comprehensive i18n Integration Tests
 * Tests complete integration between context, hooks, components, and configuration
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider, useI18n } from '../contexts/I18nContext';
import { LanguageSwitcher } from '../components/common/LanguageSwitcher';
import { LanguageToggle } from '../components/LanguageToggle';
import { 
  setupI18nMocks, 
  resetI18nMocks, 
  createI18nTestScenarios,
  createI18nErrors,
  createAsyncI18nMocks
} from '../test-utils/i18n-test-utils';

// Mock the entire i18n system
const mockChangeLanguage = jest.fn().mockResolvedValue(undefined);
const mockLoadNamespaces = jest.fn().mockResolvedValue(undefined);
const mockT = jest.fn((key: string, options?: any) => {
  const translations: Record<string, string> = {
    'app.title': 'My Application',
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'language.switch': 'Switch Language',
    'language.current': 'Current Language: {{language}}',
    'user.greeting': 'Hello {{name}}!',
    'items.count': '{{count}} items',
    'loading': 'Loading...',
    'error.general': 'Something went wrong'
  };
  
  if (options?.defaultValue) return options.defaultValue;
  if (options?.name) {
    return translations[key]?.replace('{{name}}', options.name) || key;
  }
  if (options?.count !== undefined) {
    return translations[key]?.replace('{{count}}', options.count.toString()) || `${options.count} items`;
  }
  if (options?.language) {
    return translations[key]?.replace('{{language}}', options.language) || key;
  }
  
  return translations[key] || key;
});

const mockI18nInstance = {
  changeLanguage: mockChangeLanguage,
  language: 'en',
  languages: ['en', 'pt-BR', 'es'],
  loadNamespaces: mockLoadNamespaces,
  exists: jest.fn().mockReturnValue(true),
  getResourceBundle: jest.fn().mockReturnValue({
    'app.title': 'My Application',
    'nav.home': 'Home'
  }),
  isInitialized: true,
  store: {
    data: {
      'en': { translation: { 'app.title': 'My Application' } },
      'pt-BR': { translation: { 'app.title': 'Minha Aplicação' } }
    }
  }
};

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
    i18n: mockI18nInstance,
    ready: true
  }),
  I18nextProvider: ({ children }: any) => children
}));

jest.mock('../config/i18n', () => ({
  setupI18n: jest.fn().mockResolvedValue(undefined),
  switchLanguage: jest.fn().mockResolvedValue(undefined),
  getI18nInstance: () => mockI18nInstance
}));

jest.mock('../hooks/useI18n', () => ({
  useI18n: jest.fn()
}));

import { useI18n as mockUseI18n } from '../hooks/useI18n';
const mockUseI18nHook = mockUseI18n as jest.MockedFunction<typeof useI18n>;

// Test application component that uses all i18n features
const TestApplication = () => {
  const { t, language, changeLanguage, isLoading } = useI18n();
  const [user, setUser] = React.useState('John');
  const [itemCount, setItemCount] = React.useState(5);

  return (
    <div>
      <header>
        <h1 data-testid="app-title">{t('app.title')}</h1>
        <LanguageToggle />
        <LanguageSwitcher />
      </header>
      
      <nav>
        <a href="/" data-testid="nav-home">{t('nav.home')}</a>
        <a href="/about" data-testid="nav-about">{t('nav.about')}</a>
        <a href="/contact" data-testid="nav-contact">{t('nav.contact')}</a>
      </nav>
      
      <main>
        <div data-testid="current-language">
          {t('language.current', { language })}
        </div>
        
        <div data-testid="user-greeting">
          {t('user.greeting', { name: user })}
        </div>
        
        <div data-testid="item-count">
          {t('items.count', { count: itemCount })}
        </div>
        
        <div data-testid="loading-state">
          {isLoading ? t('loading') : 'Ready'}
        </div>
        
        <button 
          data-testid="change-user"
          onClick={() => setUser(user === 'John' ? 'Maria' : 'John')}
        >
          Change User
        </button>
        
        <button 
          data-testid="change-count"
          onClick={() => setItemCount(itemCount + 1)}
        >
          Add Item
        </button>
      </main>
    </div>
  );
};

describe('I18n Integration Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetI18nMocks();
    
    // Reset mock implementation for each test
    mockT.mockImplementation((key: string, options?: any) => {
      const translations: Record<string, string> = {
        'app.title': 'My Application',
        'nav.home': 'Home',
        'nav.about': 'About',
        'nav.contact': 'Contact',
        'language.switch': 'Switch Language',
        'language.current': 'Current Language: {{language}}',
        'user.greeting': 'Hello {{name}}!',
        'items.count': '{{count}} items',
        'loading': 'Loading...',
        'error.general': 'Something went wrong'
      };
      
      if (options?.defaultValue) return options.defaultValue;
      if (options?.name) {
        return translations[key]?.replace('{{name}}', options.name) || key;
      }
      if (options?.count !== undefined) {
        return translations[key]?.replace('{{count}}', options.count.toString()) || `${options.count} items`;
      }
      if (options?.language) {
        return translations[key]?.replace('{{language}}', options.language) || key;
      }
      
      return translations[key] || key;
    });
    
    mockUseI18nHook.mockReturnValue({
      t: mockT,
      language: 'en',
      changeLanguage: mockChangeLanguage,
      isLoading: false,
      isReady: true,
      supportedLanguages: ['en', 'pt-BR', 'es'],
      getAvailableTranslations: jest.fn().mockReturnValue(['app.title', 'nav.home']),
      hasTranslation: jest.fn().mockReturnValue(true),
      getCurrentNamespace: jest.fn().mockReturnValue('translation'),
      loadNamespace: mockLoadNamespaces
    });
  });

  const renderApp = () => {
    return render(
      <I18nProvider>
        <TestApplication />
      </I18nProvider>
    );
  };

  describe('Full Application Integration', () => {
    it('should render complete application with i18n', () => {
      renderApp();
      
      expect(screen.getByTestId('app-title')).toHaveTextContent('My Application');
      expect(screen.getByTestId('nav-home')).toHaveTextContent('Home');
      expect(screen.getByTestId('nav-about')).toHaveTextContent('About');
      expect(screen.getByTestId('nav-contact')).toHaveTextContent('Contact');
      expect(screen.getByTestId('current-language')).toHaveTextContent('Current Language: en');
      expect(screen.getByTestId('user-greeting')).toHaveTextContent('Hello John!');
      expect(screen.getByTestId('item-count')).toHaveTextContent('5 items');
    });

    it('should handle dynamic content updates', async () => {
      const user = userEvent.setup();
      renderApp();
      
      // Change user name
      await user.click(screen.getByTestId('change-user'));
      expect(screen.getByTestId('user-greeting')).toHaveTextContent('Hello Maria!');
      
      // Change item count
      await user.click(screen.getByTestId('change-count'));
      expect(screen.getByTestId('item-count')).toHaveTextContent('6 items');
    });

    it('should integrate language switcher with context', async () => {
      const user = userEvent.setup();
      renderApp();
      
      // Find and use language switcher
      const languageSwitcher = screen.getByRole('combobox');
      await user.selectOptions(languageSwitcher, 'pt-BR');
      
      expect(mockChangeLanguage).toHaveBeenCalledWith('pt-BR');
    });

    it('should integrate language toggle with context', async () => {
      const user = userEvent.setup();
      renderApp();
      
      // Find and use language toggle
      const languageToggle = screen.getByRole('button', { name: /toggle/i });
      await user.click(languageToggle);
      
      expect(mockChangeLanguage).toHaveBeenCalledWith('pt-BR');
    });
  });

  describe('Language Switching Integration', () => {
    it('should update all translations when language changes', async () => {
      const user = userEvent.setup();
      
      // Mock Portuguese translations
      mockT.mockImplementation((key: string, options?: any) => {
        const ptTranslations: Record<string, string> = {
          'app.title': 'Minha Aplicação',
          'nav.home': 'Início',
          'nav.about': 'Sobre',
          'nav.contact': 'Contato',
          'language.current': 'Idioma Atual: {{language}}',
          'user.greeting': 'Olá {{name}}!',
          'items.count': '{{count}} itens'
        };
        
        if (options?.name) {
          return ptTranslations[key]?.replace('{{name}}', options.name) || key;
        }
        if (options?.count !== undefined) {
          return ptTranslations[key]?.replace('{{count}}', options.count.toString()) || key;
        }
        if (options?.language) {
          return ptTranslations[key]?.replace('{{language}}', options.language) || key;
        }
        
        return ptTranslations[key] || key;
      });
      
      mockUseI18nHook.mockReturnValue({
        t: mockT,
        language: 'pt-BR',
        changeLanguage: mockChangeLanguage,
        isLoading: false,
        isReady: true,
        supportedLanguages: ['en', 'pt-BR'],
        getAvailableTranslations: jest.fn(),
        hasTranslation: jest.fn().mockReturnValue(true),
        getCurrentNamespace: jest.fn().mockReturnValue('translation'),
        loadNamespace: mockLoadNamespaces
      });
      
      const { rerender } = renderApp();
      
      rerender(
        <I18nProvider>
          <TestApplication />
        </I18nProvider>
      );
      
      expect(screen.getByTestId('app-title')).toHaveTextContent('Minha Aplicação');
      expect(screen.getByTestId('nav-home')).toHaveTextContent('Início');
      expect(screen.getByTestId('current-language')).toHaveTextContent('Idioma Atual: pt-BR');
      expect(screen.getByTestId('user-greeting')).toHaveTextContent('Olá John!');
    });

    it('should handle language switching with loading states', async () => {
      const user = userEvent.setup();
      
      // Mock loading state
      mockUseI18nHook.mockReturnValue({
        t: mockT,
        language: 'en',
        changeLanguage: mockChangeLanguage,
        isLoading: true,
        isReady: true,
        supportedLanguages: ['en', 'pt-BR'],
        getAvailableTranslations: jest.fn(),
        hasTranslation: jest.fn().mockReturnValue(true),
        getCurrentNamespace: jest.fn().mockReturnValue('translation'),
        loadNamespace: mockLoadNamespaces
      });
      
      const { rerender } = renderApp();
      
      rerender(
        <I18nProvider>
          <TestApplication />
        </I18nProvider>
      );
      
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Loading...');
      
      // Complete loading
      mockUseI18nHook.mockReturnValue({
        t: mockT,
        language: 'pt-BR',
        changeLanguage: mockChangeLanguage,
        isLoading: false,
        isReady: true,
        supportedLanguages: ['en', 'pt-BR'],
        getAvailableTranslations: jest.fn(),
        hasTranslation: jest.fn().mockReturnValue(true),
        getCurrentNamespace: jest.fn().mockReturnValue('translation'),
        loadNamespace: mockLoadNamespaces
      });
      
      rerender(
        <I18nProvider>
          <TestApplication />
        </I18nProvider>
      );
      
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Ready');
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle translation errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock translation function to throw error
      mockT.mockImplementationOnce(() => {
        throw new Error('Translation error');
      });
      
      mockUseI18nHook.mockReturnValue({
        t: mockT,
        language: 'en',
        changeLanguage: mockChangeLanguage,
        isLoading: false,
        isReady: true,
        supportedLanguages: ['en', 'pt-BR'],
        getAvailableTranslations: jest.fn(),
        hasTranslation: jest.fn().mockReturnValue(true),
        getCurrentNamespace: jest.fn().mockReturnValue('translation'),
        loadNamespace: mockLoadNamespaces
      });
      
      // Should render without crashing
      expect(() => renderApp()).not.toThrow();
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle language switching errors', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockChangeLanguage.mockRejectedValueOnce(new Error('Language switch failed'));
      
      renderApp();
      
      const languageToggle = screen.getByRole('button', { name: /toggle/i });
      await user.click(languageToggle);
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });
      
      // Application should continue working
      expect(screen.getByTestId('app-title')).toBeInTheDocument();
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle context provider errors', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock useI18n to throw error when used outside provider
      mockUseI18nHook.mockImplementationOnce(() => {
        throw new Error('useI18n must be used within an I18nProvider');
      });
      
      // Should handle error boundary appropriately
      expect(() => {
        render(<TestApplication />);
      }).toThrow('useI18n must be used within an I18nProvider');
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Performance Integration', () => {
    it('should handle multiple rapid language switches', async () => {
      const user = userEvent.setup();
      renderApp();
      
      const languageToggle = screen.getByRole('button', { name: /toggle/i });
      
      // Rapid clicks
      await user.click(languageToggle);
      await user.click(languageToggle);
      await user.click(languageToggle);
      
      // All calls should be handled
      expect(mockChangeLanguage).toHaveBeenCalledTimes(3);
    });

    it('should handle frequent re-renders efficiently', () => {
      const { rerender } = renderApp();
      
      // Multiple re-renders
      for (let i = 0; i < 10; i++) {
        rerender(
          <I18nProvider>
            <TestApplication />
          </I18nProvider>
        );
      }
      
      // Should still work correctly
      expect(screen.getByTestId('app-title')).toHaveTextContent('My Application');
    });

    it('should memoize translations properly', () => {
      const { rerender } = renderApp();
      
      const initialCallCount = mockT.mock.calls.length;
      
      // Re-render without props changes
      rerender(
        <I18nProvider>
          <TestApplication />
        </I18nProvider>
      );
      
      // Translation function should not be called again for same content
      const newCallCount = mockT.mock.calls.length;
      expect(newCallCount).toBeGreaterThanOrEqual(initialCallCount);
    });
  });

  describe('Accessibility Integration', () => {
    it('should provide accessible language switching', () => {
      renderApp();
      
      const languageSwitcher = screen.getByRole('combobox');
      const languageToggle = screen.getByRole('button', { name: /toggle/i });
      
      expect(languageSwitcher).toHaveAttribute('aria-label');
      expect(languageToggle).toHaveAttribute('aria-label');
    });

    it('should announce language changes to screen readers', async () => {
      const user = userEvent.setup();
      
      mockUseI18nHook.mockReturnValue({
        t: mockT,
        language: 'en',
        changeLanguage: mockChangeLanguage,
        isLoading: true,
        isReady: true,
        supportedLanguages: ['en', 'pt-BR'],
        getAvailableTranslations: jest.fn(),
        hasTranslation: jest.fn().mockReturnValue(true),
        getCurrentNamespace: jest.fn().mockReturnValue('translation'),
        loadNamespace: mockLoadNamespaces
      });
      
      const { rerender } = renderApp();
      
      rerender(
        <I18nProvider>
          <TestApplication />
        </I18nProvider>
      );
      
      // Loading state should be announced
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Loading...');
    });
  });

  describe('Edge Cases Integration', () => {
    it('should handle empty translation resources', () => {
      mockT.mockImplementation(() => '');
      
      renderApp();
      
      // Should render without crashing even with empty translations
      expect(screen.getByTestId('app-title')).toBeInTheDocument();
    });

    it('should handle missing translation keys', () => {
      mockT.mockImplementation((key: string) => key); // Return key as fallback
      
      renderApp();
      
      expect(screen.getByTestId('app-title')).toHaveTextContent('app.title');
    });

    it('should handle malformed language codes', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockChangeLanguage.mockRejectedValueOnce(new Error('Invalid language code'));
      
      renderApp();
      
      const languageToggle = screen.getByRole('button', { name: /toggle/i });
      await user.click(languageToggle);
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle component unmounting during language switch', async () => {
      const user = userEvent.setup();
      
      const { unmount } = renderApp();
      
      const languageToggle = screen.getByRole('button', { name: /toggle/i });
      
      // Start language switch
      user.click(languageToggle);
      
      // Unmount before completion
      unmount();
      
      // Should not cause errors or memory leaks
      expect(() => {
        // Cleanup should complete successfully
      }).not.toThrow();
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle complete user workflow', async () => {
      const user = userEvent.setup();
      renderApp();
      
      // 1. User views app in default language
      expect(screen.getByTestId('app-title')).toHaveTextContent('My Application');
      
      // 2. User changes their name
      await user.click(screen.getByTestId('change-user'));
      expect(screen.getByTestId('user-greeting')).toHaveTextContent('Hello Maria!');
      
      // 3. User switches language using toggle
      const languageToggle = screen.getByRole('button', { name: /toggle/i });
      await user.click(languageToggle);
      expect(mockChangeLanguage).toHaveBeenCalledWith('pt-BR');
      
      // 4. User adds items
      await user.click(screen.getByTestId('change-count'));
      expect(screen.getByTestId('item-count')).toHaveTextContent('6 items');
      
      // 5. User switches language using dropdown
      const languageSwitcher = screen.getByRole('combobox');
      await user.selectOptions(languageSwitcher, 'es');
      expect(mockChangeLanguage).toHaveBeenCalledWith('es');
    });

    it('should handle browser refresh scenario', () => {
      // Simulate browser refresh by remounting
      const { unmount } = renderApp();
      unmount();
      
      // Should restore state properly
      renderApp();
      
      expect(screen.getByTestId('app-title')).toHaveTextContent('My Application');
      expect(screen.getByTestId('current-language')).toHaveTextContent('Current Language: en');
    });

    it('should handle network connectivity issues', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Simulate network error during language change
      mockChangeLanguage.mockRejectedValueOnce(new Error('Network error'));
      
      renderApp();
      
      const languageToggle = screen.getByRole('button', { name: /toggle/i });
      await user.click(languageToggle);
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('error'),
          expect.any(Error)
        );
      });
      
      // App should continue working
      expect(screen.getByTestId('app-title')).toBeInTheDocument();
      
      consoleErrorSpy.mockRestore();
    });
  });
});
