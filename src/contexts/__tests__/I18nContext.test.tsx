/**
 * Comprehensive test suite for I18nContext
 * Tests context provider, hooks, and language switching functionality
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider, useI18n } from '../I18nContext';

// Mock i18next
const mockT = jest.fn((key: string) => key);
const mockChangeLanguage = jest.fn().mockResolvedValue(undefined);

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
    i18n: {
      changeLanguage: mockChangeLanguage,
      language: 'en'
    }
  })
}));

// Test component to access context
const TestComponent = () => {
  const { t, language, changeLanguage, isLoading, supportedLanguages } = useI18n();
  
  return (
    <div>
      <span data-testid="current-language">{language}</span>
      <span data-testid="loading-state">{isLoading ? 'loading' : 'loaded'}</span>
      <span data-testid="translated-text">{t('test.key')}</span>
      <span data-testid="supported-languages">{supportedLanguages.join(',')}</span>
      <button 
        data-testid="switch-to-portuguese"
        onClick={() => changeLanguage('pt-BR')}
      >
        Switch to Portuguese
      </button>
      <button 
        data-testid="switch-to-english"
        onClick={() => changeLanguage('en')}
      >
        Switch to English
      </button>
    </div>
  );
};

const TestComponentWithError = () => {
  try {
    useI18n();
    return <div>Should not render</div>;
  } catch (error) {
    return <div data-testid="error-message">{(error as Error).message}</div>;
  }
};

describe('I18nContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockT.mockImplementation((key: string) => key);
  });

  describe('I18nProvider', () => {
    it('should provide i18n context to children', () => {
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      expect(screen.getByTestId('loading-state')).toHaveTextContent('loaded');
      expect(screen.getByTestId('translated-text')).toHaveTextContent('test.key');
    });

    it('should provide supported languages list', () => {
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      const supportedLanguagesElement = screen.getByTestId('supported-languages');
      expect(supportedLanguagesElement).toHaveTextContent('en,pt-BR');
    });

    it('should handle language switching', async () => {
      const user = userEvent.setup();
      
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      const switchButton = screen.getByTestId('switch-to-portuguese');
      await user.click(switchButton);

      expect(mockChangeLanguage).toHaveBeenCalledWith('pt-BR');
    });

    it('should show loading state during language switch', async () => {
      const user = userEvent.setup();
      
      // Make changeLanguage take some time
      mockChangeLanguage.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      const switchButton = screen.getByTestId('switch-to-portuguese');
      
      act(() => {
        user.click(switchButton);
      });

      // Should show loading state briefly
      expect(screen.getByTestId('loading-state')).toHaveTextContent('loading');

      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('loaded');
      }, { timeout: 200 });
    });

    it('should handle language switching errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockChangeLanguage.mockRejectedValue(new Error('Language switch failed'));

      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      const switchButton = screen.getByTestId('switch-to-portuguese');
      await user.click(switchButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to change language:',
          expect.any(Error)
        );
      });

      // Should still show loaded state after error
      expect(screen.getByTestId('loading-state')).toHaveTextContent('loaded');

      consoleErrorSpy.mockRestore();
    });

    it('should handle multiple language switches', async () => {
      const user = userEvent.setup();
      mockChangeLanguage.mockResolvedValue(undefined);

      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      const portugueseButton = screen.getByTestId('switch-to-portuguese');
      const englishButton = screen.getByTestId('switch-to-english');

      await user.click(portugueseButton);
      expect(mockChangeLanguage).toHaveBeenCalledWith('pt-BR');

      await user.click(englishButton);
      expect(mockChangeLanguage).toHaveBeenCalledWith('en');

      expect(mockChangeLanguage).toHaveBeenCalledTimes(2);
    });

    it('should prevent multiple concurrent language switches', async () => {
      const user = userEvent.setup();
      
      // Make changeLanguage take some time
      let resolvePromise: () => void;
      const slowPromise = new Promise<void>(resolve => {
        resolvePromise = resolve;
      });
      mockChangeLanguage.mockReturnValue(slowPromise);

      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      const switchButton = screen.getByTestId('switch-to-portuguese');

      // Click multiple times rapidly
      act(() => {
        user.click(switchButton);
        user.click(switchButton);
        user.click(switchButton);
      });

      // Should only call changeLanguage once
      expect(mockChangeLanguage).toHaveBeenCalledTimes(1);

      // Resolve the promise to cleanup
      act(() => {
        resolvePromise!();
      });

      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('loaded');
      });
    });

    it('should provide translation function that works', () => {
      mockT.mockReturnValue('Translated text');

      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      expect(screen.getByTestId('translated-text')).toHaveTextContent('Translated text');
      expect(mockT).toHaveBeenCalledWith('test.key');
    });
  });

  describe('useI18n hook', () => {
    it('should throw error when used outside provider', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<TestComponentWithError />);

      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'useI18n must be used within an I18nProvider'
      );

      consoleErrorSpy.mockRestore();
    });

    it('should return all required context values', () => {
      let contextValue: any;

      const TestHookComponent = () => {
        contextValue = useI18n();
        return <div>Test</div>;
      };

      render(
        <I18nProvider>
          <TestHookComponent />
        </I18nProvider>
      );

      expect(contextValue).toHaveProperty('t');
      expect(contextValue).toHaveProperty('language');
      expect(contextValue).toHaveProperty('changeLanguage');
      expect(contextValue).toHaveProperty('isLoading');
      expect(contextValue).toHaveProperty('supportedLanguages');

      expect(typeof contextValue.t).toBe('function');
      expect(typeof contextValue.changeLanguage).toBe('function');
      expect(typeof contextValue.language).toBe('string');
      expect(typeof contextValue.isLoading).toBe('boolean');
      expect(Array.isArray(contextValue.supportedLanguages)).toBe(true);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle invalid language codes', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockChangeLanguage.mockRejectedValue(new Error('Invalid language'));

      const CustomTestComponent = () => {
        const { changeLanguage } = useI18n();
        
        return (
          <button 
            data-testid="invalid-language"
            onClick={() => changeLanguage('invalid-lang')}
          >
            Invalid Language
          </button>
        );
      };

      render(
        <I18nProvider>
          <CustomTestComponent />
        </I18nProvider>
      );

      const invalidButton = screen.getByTestId('invalid-language');
      await user.click(invalidButton);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to change language:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle empty string language', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const CustomTestComponent = () => {
        const { changeLanguage } = useI18n();
        
        return (
          <button 
            data-testid="empty-language"
            onClick={() => changeLanguage('')}
          >
            Empty Language
          </button>
        );
      };

      render(
        <I18nProvider>
          <CustomTestComponent />
        </I18nProvider>
      );

      const emptyButton = screen.getByTestId('empty-language');
      await user.click(emptyButton);

      // Should handle gracefully
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle null/undefined language', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const CustomTestComponent = () => {
        const { changeLanguage } = useI18n();
        
        return (
          <button 
            data-testid="null-language"
            onClick={() => changeLanguage(null as any)}
          >
            Null Language
          </button>
        );
      };

      render(
        <I18nProvider>
          <CustomTestComponent />
        </I18nProvider>
      );

      const nullButton = screen.getByTestId('null-language');
      await user.click(nullButton);

      // Should handle gracefully
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('context persistence', () => {
    it('should maintain state across re-renders', () => {
      const { rerender } = render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      expect(screen.getByTestId('current-language')).toHaveTextContent('en');

      rerender(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
    });

    it('should handle provider remounting', () => {
      const { unmount } = render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      unmount();

      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
    });
  });

  describe('supported languages validation', () => {
    it('should only include valid language codes', () => {
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      const supportedLanguages = screen.getByTestId('supported-languages').textContent?.split(',');
      
      expect(supportedLanguages).toContain('en');
      expect(supportedLanguages).toContain('pt-BR');
      expect(supportedLanguages).toHaveLength(2);
    });
  });
});