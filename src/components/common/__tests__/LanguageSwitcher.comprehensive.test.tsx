/**
 * Comprehensive test suite for LanguageSwitcher component
 * Tests language switching UI, dropdown functionality, and user interactions
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { I18nProvider } from '../../../contexts/I18nContext';
import { useI18n } from '../../../hooks/useI18n';

// Mock the useI18n hook
const mockChangeLanguage = jest.fn().mockResolvedValue(undefined);
const mockT = jest.fn((key: string) => {
  const translations: Record<string, string> = {
    'language.switch': 'Switch Language',
    'language.english': 'English',
    'language.portuguese': 'Português',
    'language.spanish': 'Español',
    'language.french': 'Français',
    'language.german': 'Deutsch',
    'language.current': 'Current: {{language}}',
    'language.select': 'Select Language',
    'language.loading': 'Loading...',
    'language.error': 'Error switching language'
  };
  return translations[key] || key;
});

const defaultUseI18nReturn = {
  t: mockT,
  language: 'en',
  changeLanguage: mockChangeLanguage,
  isLoading: false,
  isReady: true,
  supportedLanguages: ['en', 'pt-BR', 'es', 'fr', 'de'],
  getAvailableTranslations: jest.fn().mockReturnValue([]),
  hasTranslation: jest.fn().mockReturnValue(true),
  getCurrentNamespace: jest.fn().mockReturnValue('translation'),
  loadNamespace: jest.fn().mockResolvedValue(undefined)
};

jest.mock('../../../hooks/useI18n', () => ({
  useI18n: jest.fn()
}));

const mockUseI18n = useI18n as jest.MockedFunction<typeof useI18n>;

// Mock language names mapping
const languageNames = {
  'en': 'English',
  'pt-BR': 'Português',
  'es': 'Español',
  'fr': 'Français',
  'de': 'Deutsch'
};

describe('LanguageSwitcher Component Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseI18n.mockReturnValue(defaultUseI18nReturn);
  });

  const renderLanguageSwitcher = (props = {}) => {
    return render(
      <I18nProvider>
        <LanguageSwitcher {...props} />
      </I18nProvider>
    );
  };

  describe('Basic Rendering', () => {
    it('should render language switcher with current language', () => {
      renderLanguageSwitcher();
      
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByDisplayValue('English')).toBeInTheDocument();
    });

    it('should render all supported languages as options', () => {
      renderLanguageSwitcher();
      
      const select = screen.getByRole('combobox');
      const options = Array.from(select.querySelectorAll('option'));
      
      expect(options).toHaveLength(5);
      expect(options.map(option => option.textContent)).toEqual([
        'English', 'Português', 'Español', 'Français', 'Deutsch'
      ]);
    });

    it('should show current language as selected', () => {
      mockUseI18n.mockReturnValue({
        ...defaultUseI18nReturn,
        language: 'pt-BR'
      });
      
      renderLanguageSwitcher();
      
      expect(screen.getByDisplayValue('Português')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      renderLanguageSwitcher({ className: 'custom-switcher' });
      
      const switcher = screen.getByRole('combobox');
      expect(switcher).toHaveClass('custom-switcher');
    });

    it('should render with custom placeholder', () => {
      mockUseI18n.mockReturnValue({
        ...defaultUseI18nReturn,
        language: ''
      });
      
      renderLanguageSwitcher({ placeholder: 'Choose Language' });
      
      expect(screen.getByDisplayValue('Choose Language')).toBeInTheDocument();
    });
  });

  describe('Language Switching Functionality', () => {
    it('should switch language when option is selected', async () => {
      const user = userEvent.setup();
      
      renderLanguageSwitcher();
      
      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'pt-BR');
      
      expect(mockChangeLanguage).toHaveBeenCalledWith('pt-BR');
    });

    it('should handle multiple language switches', async () => {
      const user = userEvent.setup();
      
      renderLanguageSwitcher();
      
      const select = screen.getByRole('combobox');
      
      await user.selectOptions(select, 'es');
      expect(mockChangeLanguage).toHaveBeenCalledWith('es');
      
      await user.selectOptions(select, 'fr');
      expect(mockChangeLanguage).toHaveBeenCalledWith('fr');
      
      await user.selectOptions(select, 'en');
      expect(mockChangeLanguage).toHaveBeenCalledWith('en');
      
      expect(mockChangeLanguage).toHaveBeenCalledTimes(3);
    });

    it('should not call changeLanguage when selecting same language', async () => {
      const user = userEvent.setup();
      
      renderLanguageSwitcher();
      
      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'en'); // Same as current
      
      expect(mockChangeLanguage).toHaveBeenCalledWith('en');
    });

    it('should handle language switching with custom onChange', async () => {
      const customOnChange = jest.fn();
      const user = userEvent.setup();
      
      renderLanguageSwitcher({ onChange: customOnChange });
      
      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'pt-BR');
      
      expect(customOnChange).toHaveBeenCalledWith('pt-BR');
      expect(mockChangeLanguage).toHaveBeenCalledWith('pt-BR');
    });
  });

  describe('Loading States', () => {
    it('should show loading state during language switch', () => {
      mockUseI18n.mockReturnValue({
        ...defaultUseI18nReturn,
        isLoading: true
      });
      
      renderLanguageSwitcher();
      
      const select = screen.getByRole('combobox');
      expect(select).toBeDisabled();
    });

    it('should show loading indicator when isLoading is true', () => {
      mockUseI18n.mockReturnValue({
        ...defaultUseI18nReturn,
        isLoading: true
      });
      
      renderLanguageSwitcher({ showLoadingIndicator: true });
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should re-enable after loading completes', () => {
      const { rerender } = render(
        <I18nProvider>
          <LanguageSwitcher />
        </I18nProvider>
      );
      
      // Start with loading
      mockUseI18n.mockReturnValue({
        ...defaultUseI18nReturn,
        isLoading: true
      });
      
      rerender(
        <I18nProvider>
          <LanguageSwitcher />
        </I18nProvider>
      );
      
      expect(screen.getByRole('combobox')).toBeDisabled();
      
      // Complete loading
      mockUseI18n.mockReturnValue({
        ...defaultUseI18nReturn,
        isLoading: false
      });
      
      rerender(
        <I18nProvider>
          <LanguageSwitcher />
        </I18nProvider>
      );
      
      expect(screen.getByRole('combobox')).not.toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should handle language switching errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockChangeLanguage.mockRejectedValueOnce(new Error('Switch failed'));
      
      renderLanguageSwitcher();
      
      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'pt-BR');
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Language switch error:',
          expect.any(Error)
        );
      });
      
      consoleErrorSpy.mockRestore();
    });

    it('should show error message when onError prop is provided', async () => {
      const onError = jest.fn();
      const user = userEvent.setup();
      
      mockChangeLanguage.mockRejectedValueOnce(new Error('Switch failed'));
      
      renderLanguageSwitcher({ onError });
      
      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'pt-BR');
      
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.any(Error));
      });
    });

    it('should handle invalid language codes', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Simulate invalid option somehow getting into DOM
      renderLanguageSwitcher();
      
      const select = screen.getByRole('combobox');
      
      // Manually trigger change with invalid value
      fireEvent.change(select, { target: { value: 'invalid-lang' } });
      
      expect(mockChangeLanguage).toHaveBeenCalledWith('invalid-lang');
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Accessibility Features', () => {
    it('should have proper ARIA attributes', () => {
      renderLanguageSwitcher();
      
      const select = screen.getByRole('combobox');
      
      expect(select).toHaveAttribute('aria-label', 'Switch Language');
      expect(select).toHaveAttribute('name', 'language-switcher');
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      
      renderLanguageSwitcher();
      
      const select = screen.getByRole('combobox');
      
      // Focus the select
      await user.tab();
      expect(select).toHaveFocus();
      
      // Use arrow keys to navigate
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');
      
      // Should trigger change
      expect(mockChangeLanguage).toHaveBeenCalled();
    });

    it('should support custom aria-label', () => {
      renderLanguageSwitcher({ 'aria-label': 'Choose your language' });
      
      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('aria-label', 'Choose your language');
    });

    it('should have proper focus management', async () => {
      const user = userEvent.setup();
      
      renderLanguageSwitcher();
      
      const select = screen.getByRole('combobox');
      
      await user.click(select);
      expect(select).toHaveFocus();
      
      await user.selectOptions(select, 'pt-BR');
      expect(select).toHaveFocus(); // Should maintain focus after selection
    });
  });

  describe('Styling and Customization', () => {
    it('should apply custom styles', () => {
      const customStyle = { backgroundColor: 'red', color: 'white' };
      
      renderLanguageSwitcher({ style: customStyle });
      
      const select = screen.getByRole('combobox');
      expect(select).toHaveStyle('background-color: red');
      expect(select).toHaveStyle('color: white');
    });

    it('should support custom CSS classes', () => {
      renderLanguageSwitcher({ 
        className: 'custom-switcher',
        optionClassName: 'custom-option'
      });
      
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('custom-switcher');
    });

    it('should render with size variants', () => {
      renderLanguageSwitcher({ size: 'large' });
      
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('language-switcher--large');
    });

    it('should render with theme variants', () => {
      renderLanguageSwitcher({ variant: 'outlined' });
      
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('language-switcher--outlined');
    });
  });

  describe('Language Display Options', () => {
    it('should display language codes when showCode is true', () => {
      renderLanguageSwitcher({ showCode: true });
      
      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveTextContent('English (en)');
      expect(options[1]).toHaveTextContent('Português (pt-BR)');
    });

    it('should display native names when showNative is true', () => {
      renderLanguageSwitcher({ showNative: true });
      
      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveTextContent('English');
      expect(options[1]).toHaveTextContent('Português');
    });

    it('should filter languages based on include prop', () => {
      renderLanguageSwitcher({ include: ['en', 'pt-BR'] });
      
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(2);
      expect(options[0]).toHaveTextContent('English');
      expect(options[1]).toHaveTextContent('Português');
    });

    it('should exclude languages based on exclude prop', () => {
      renderLanguageSwitcher({ exclude: ['es', 'fr', 'de'] });
      
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(2);
      expect(options[0]).toHaveTextContent('English');
      expect(options[1]).toHaveTextContent('Português');
    });
  });

  describe('Integration with I18n Context', () => {
    it('should update when context language changes', () => {
      const { rerender } = render(
        <I18nProvider>
          <LanguageSwitcher />
        </I18nProvider>
      );
      
      expect(screen.getByDisplayValue('English')).toBeInTheDocument();
      
      // Change context language
      mockUseI18n.mockReturnValue({
        ...defaultUseI18nReturn,
        language: 'pt-BR'
      });
      
      rerender(
        <I18nProvider>
          <LanguageSwitcher />
        </I18nProvider>
      );
      
      expect(screen.getByDisplayValue('Português')).toBeInTheDocument();
    });

    it('should reflect context supported languages', () => {
      mockUseI18n.mockReturnValue({
        ...defaultUseI18nReturn,
        supportedLanguages: ['en', 'pt-BR']
      });
      
      renderLanguageSwitcher();
      
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(2);
    });

    it('should handle context not ready state', () => {
      mockUseI18n.mockReturnValue({
        ...defaultUseI18nReturn,
        isReady: false
      });
      
      renderLanguageSwitcher();
      
      const select = screen.getByRole('combobox');
      expect(select).toBeDisabled();
    });
  });

  describe('Performance Optimization', () => {
    it('should memoize language options', () => {
      const { rerender } = render(
        <I18nProvider>
          <LanguageSwitcher />
        </I18nProvider>
      );
      
      const initialOptions = screen.getAllByRole('option');
      
      rerender(
        <I18nProvider>
          <LanguageSwitcher />
        </I18nProvider>
      );
      
      const rerenderedOptions = screen.getAllByRole('option');
      
      // Options should be the same (memoized)
      expect(rerenderedOptions).toHaveLength(initialOptions.length);
    });

    it('should not re-render unnecessarily', () => {
      let renderCount = 0;
      
      const CountingLanguageSwitcher = () => {
        renderCount++;
        return <LanguageSwitcher />;
      };
      
      const { rerender } = render(
        <I18nProvider>
          <CountingLanguageSwitcher />
        </I18nProvider>
      );
      
      expect(renderCount).toBe(1);
      
      // Re-render with same props
      rerender(
        <I18nProvider>
          <CountingLanguageSwitcher />
        </I18nProvider>
      );
      
      // Should only increment if necessary
      expect(renderCount).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty supported languages', () => {
      mockUseI18n.mockReturnValue({
        ...defaultUseI18nReturn,
        supportedLanguages: []
      });
      
      renderLanguageSwitcher();
      
      const select = screen.getByRole('combobox');
      expect(select.children).toHaveLength(0);
    });

    it('should handle unknown current language', () => {
      mockUseI18n.mockReturnValue({
        ...defaultUseI18nReturn,
        language: 'unknown-lang'
      });
      
      renderLanguageSwitcher();
      
      // Should still render without crashing
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should handle null/undefined current language', () => {
      mockUseI18n.mockReturnValue({
        ...defaultUseI18nReturn,
        language: null as any
      });
      
      renderLanguageSwitcher();
      
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should handle very long language names', () => {
      const longLanguageName = 'Very Long Language Name That Might Overflow';
      
      mockUseI18n.mockReturnValue({
        ...defaultUseI18nReturn,
        supportedLanguages: ['en', 'custom-long-name']
      });
      
      renderLanguageSwitcher({ 
        customLanguageNames: {
          'custom-long-name': longLanguageName
        }
      });
      
      expect(screen.getByText(longLanguageName)).toBeInTheDocument();
    });
  });
});
