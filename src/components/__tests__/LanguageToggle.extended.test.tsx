/**
 * Comprehensive test suite for LanguageToggle component
 * Tests toggle functionality, language switching, and UI interactions
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageToggle } from '../LanguageToggle';
import { I18nProvider } from '../../contexts/I18nContext';
import { useI18n } from '../../hooks/useI18n';

// Mock the useI18n hook
const mockChangeLanguage = jest.fn().mockResolvedValue(undefined);
const mockT = jest.fn((key: string) => {
  const translations: Record<string, string> = {
    'language.toggle': 'Toggle Language',
    'language.english': 'EN',
    'language.portuguese': 'PT',
    'language.spanish': 'ES',
    'language.current': 'Current: {{language}}',
    'language.switch.to': 'Switch to {{language}}',
    'language.loading': 'Switching...',
    'language.error': 'Failed to switch'
  };
  return translations[key] || key;
});

const defaultUseI18nReturn = {
  t: mockT,
  language: 'en',
  changeLanguage: mockChangeLanguage,
  isLoading: false,
  isReady: true,
  supportedLanguages: ['en', 'pt-BR'],
  getAvailableTranslations: jest.fn().mockReturnValue([]),
  hasTranslation: jest.fn().mockReturnValue(true),
  getCurrentNamespace: jest.fn().mockReturnValue('translation'),
  loadNamespace: jest.fn().mockResolvedValue(undefined)
};

jest.mock('../../hooks/useI18n', () => ({
  useI18n: jest.fn()
}));

const mockUseI18n = useI18n as jest.MockedFunction<typeof useI18n>;

describe('LanguageToggle Component Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseI18n.mockReturnValue(defaultUseI18nReturn);
  });

  const renderLanguageToggle = (props = {}) => {
    return render(
      <I18nProvider>
        <LanguageToggle {...props} />
      </I18nProvider>
    );
  };

  describe('Basic Rendering', () => {
    it('should render toggle button with current language', () => {
      renderLanguageToggle();
      
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('EN')).toBeInTheDocument();
    });

    it('should display Portuguese when current language is pt-BR', () => {
      mockUseI18n.mockReturnValue({
        ...defaultUseI18nReturn,
        language: 'pt-BR'
      });
      
      renderLanguageToggle();
      
      expect(screen.getByText('PT')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      renderLanguageToggle({ className: 'custom-toggle' });
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-toggle');
    });

    it('should render with custom label', () => {
      renderLanguageToggle({ label: 'Lang' });
      
      expect(screen.getByText('Lang')).toBeInTheDocument();
    });

    it('should show full language names when showFullName is true', () => {
      renderLanguageToggle({ showFullName: true });
      
      expect(screen.getByText('English')).toBeInTheDocument();
    });
  });

  describe('Toggle Functionality', () => {
    it('should toggle from English to Portuguese', async () => {
      const user = userEvent.setup();
      
      renderLanguageToggle();
      
      const toggleButton = screen.getByRole('button');
      await user.click(toggleButton);
      
      expect(mockChangeLanguage).toHaveBeenCalledWith('pt-BR');
    });

    it('should toggle from Portuguese to English', async () => {
      const user = userEvent.setup();
      
      mockUseI18n.mockReturnValue({
        ...defaultUseI18nReturn,
        language: 'pt-BR'
      });
      
      renderLanguageToggle();
      
      const toggleButton = screen.getByRole('button');
      await user.click(toggleButton);
      
      expect(mockChangeLanguage).toHaveBeenCalledWith('en');
    });

    it('should handle rapid toggle clicks', async () => {
      const user = userEvent.setup();
      
      renderLanguageToggle();
      
      const toggleButton = screen.getByRole('button');
      
      // Rapid clicks
      await user.click(toggleButton);
      await user.click(toggleButton);
      await user.click(toggleButton);
      
      // All clicks should be handled
      expect(mockChangeLanguage).toHaveBeenCalledTimes(3);
    });

    it('should call custom onChange handler', async () => {
      const customOnChange = jest.fn();
      const user = userEvent.setup();
      
      renderLanguageToggle({ onChange: customOnChange });
      
      const toggleButton = screen.getByRole('button');
      await user.click(toggleButton);
      
      expect(customOnChange).toHaveBeenCalledWith('pt-BR');
      expect(mockChangeLanguage).toHaveBeenCalledWith('pt-BR');
    });

    it('should support custom language pairs', async () => {
      const user = userEvent.setup();
      
      mockUseI18n.mockReturnValue({
        ...defaultUseI18nReturn,
        supportedLanguages: ['en', 'es', 'fr']
      });
      
      renderLanguageToggle({ 
        languages: ['en', 'es'],
        languageLabels: { en: 'ENG', es: 'ESP' }
      });
      
      const toggleButton = screen.getByRole('button');
      await user.click(toggleButton);
      
      expect(mockChangeLanguage).toHaveBeenCalledWith('es');
    });
  });

  describe('Loading States', () => {
    it('should show loading state during language switch', () => {
      mockUseI18n.mockReturnValue({
        ...defaultUseI18nReturn,
        isLoading: true
      });
      
      renderLanguageToggle({ showLoading: true });
      
      expect(screen.getByText('Switching...')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should disable button when loading', () => {
      mockUseI18n.mockReturnValue({
        ...defaultUseI18nReturn,
        isLoading: true
      });
      
      renderLanguageToggle();
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should show spinner when loading', () => {
      mockUseI18n.mockReturnValue({
        ...defaultUseI18nReturn,
        isLoading: true
      });
      
      renderLanguageToggle({ showSpinner: true });
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should re-enable after loading completes', () => {
      const { rerender } = render(
        <I18nProvider>
          <LanguageToggle />
        </I18nProvider>
      );
      
      // Start with loading
      mockUseI18n.mockReturnValue({
        ...defaultUseI18nReturn,
        isLoading: true
      });
      
      rerender(
        <I18nProvider>
          <LanguageToggle />
        </I18nProvider>
      );
      
      expect(screen.getByRole('button')).toBeDisabled();
      
      // Complete loading
      mockUseI18n.mockReturnValue({
        ...defaultUseI18nReturn,
        isLoading: false
      });
      
      rerender(
        <I18nProvider>
          <LanguageToggle />
        </I18nProvider>
      );
      
      expect(screen.getByRole('button')).not.toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should handle language switching errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockChangeLanguage.mockRejectedValueOnce(new Error('Toggle failed'));
      
      renderLanguageToggle();
      
      const toggleButton = screen.getByRole('button');
      await user.click(toggleButton);
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Language toggle error:',
          expect.any(Error)
        );
      });
      
      consoleErrorSpy.mockRestore();
    });

    it('should call onError prop when error occurs', async () => {
      const onError = jest.fn();
      const user = userEvent.setup();
      
      mockChangeLanguage.mockRejectedValueOnce(new Error('Toggle failed'));
      
      renderLanguageToggle({ onError });
      
      const toggleButton = screen.getByRole('button');
      await user.click(toggleButton);
      
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.any(Error));
      });
    });

    it('should show error message when errorMessage prop is provided', async () => {
      const user = userEvent.setup();
      
      mockChangeLanguage.mockRejectedValueOnce(new Error('Toggle failed'));
      
      renderLanguageToggle({ 
        showErrorMessage: true,
        errorMessage: 'Switch failed!'
      });
      
      const toggleButton = screen.getByRole('button');
      await user.click(toggleButton);
      
      await waitFor(() => {
        expect(screen.getByText('Switch failed!')).toBeInTheDocument();
      });
    });

    it('should handle context not ready state', () => {
      mockUseI18n.mockReturnValue({
        ...defaultUseI18nReturn,
        isReady: false
      });
      
      renderLanguageToggle();
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Accessibility Features', () => {
    it('should have proper ARIA attributes', () => {
      renderLanguageToggle();
      
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('aria-label', 'Toggle Language');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should support custom aria-label', () => {
      renderLanguageToggle({ 'aria-label': 'Switch language toggle' });
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Switch language toggle');
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      
      renderLanguageToggle();
      
      const button = screen.getByRole('button');
      
      // Focus the button
      await user.tab();
      expect(button).toHaveFocus();
      
      // Activate with keyboard
      await user.keyboard('{Enter}');
      expect(mockChangeLanguage).toHaveBeenCalledWith('pt-BR');
      
      // Also test with Space
      jest.clearAllMocks();
      await user.keyboard(' ');
      expect(mockChangeLanguage).toHaveBeenCalledWith('pt-BR');
    });

    it('should indicate current language to screen readers', () => {
      renderLanguageToggle({ showCurrentLanguage: true });
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-describedby');
      
      const description = screen.getByText('Current: en');
      expect(description).toHaveClass('sr-only'); // Screen reader only
    });

    it('should announce state changes', () => {
      mockUseI18n.mockReturnValue({
        ...defaultUseI18nReturn,
        isLoading: true
      });
      
      renderLanguageToggle({ announceChanges: true });
      
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveTextContent('Switching languages...');
    });
  });

  describe('Visual Variations', () => {
    it('should render as icon button', () => {
      renderLanguageToggle({ variant: 'icon' });
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('language-toggle--icon');
    });

    it('should render with flag icons', () => {
      renderLanguageToggle({ showFlag: true });
      
      expect(screen.getByTestId('flag-en')).toBeInTheDocument();
    });

    it('should apply size variants', () => {
      renderLanguageToggle({ size: 'small' });
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('language-toggle--small');
    });

    it('should apply theme variants', () => {
      renderLanguageToggle({ theme: 'dark' });
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('language-toggle--dark');
    });

    it('should support custom button content', () => {
      const CustomContent = ({ language }: { language: string }) => (
        <span>Lang: {language.toUpperCase()}</span>
      );
      
      renderLanguageToggle({ 
        renderContent: CustomContent
      });
      
      expect(screen.getByText('Lang: EN')).toBeInTheDocument();
    });
  });

  describe('Animation and Transitions', () => {
    it('should apply transition classes during toggle', async () => {
      const user = userEvent.setup();
      
      renderLanguageToggle({ animated: true });
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(button).toHaveClass('language-toggle--transitioning');
    });

    it('should trigger animation callbacks', async () => {
      const onAnimationStart = jest.fn();
      const onAnimationEnd = jest.fn();
      const user = userEvent.setup();
      
      renderLanguageToggle({ 
        onAnimationStart,
        onAnimationEnd
      });
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(onAnimationStart).toHaveBeenCalled();
      
      // Simulate animation end
      button.dispatchEvent(new Event('animationend'));
      expect(onAnimationEnd).toHaveBeenCalled();
    });
  });

  describe('Integration with Context', () => {
    it('should update when context language changes', () => {
      const { rerender } = render(
        <I18nProvider>
          <LanguageToggle />
        </I18nProvider>
      );
      
      expect(screen.getByText('EN')).toBeInTheDocument();
      
      // Change context language
      mockUseI18n.mockReturnValue({
        ...defaultUseI18nReturn,
        language: 'pt-BR'
      });
      
      rerender(
        <I18nProvider>
          <LanguageToggle />
        </I18nProvider>
      );
      
      expect(screen.getByText('PT')).toBeInTheDocument();
    });

    it('should respect context supported languages', () => {
      mockUseI18n.mockReturnValue({
        ...defaultUseI18nReturn,
        supportedLanguages: ['en'] // Only English
      });
      
      renderLanguageToggle();
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled(); // Can't toggle with only one language
    });

    it('should handle context errors gracefully', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock context throwing error
      mockUseI18n.mockImplementation(() => {
        throw new Error('Context error');
      });
      
      expect(() => renderLanguageToggle()).not.toThrow();
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    it('should memoize toggle function', () => {
      const { rerender } = render(
        <I18nProvider>
          <LanguageToggle />
        </I18nProvider>
      );
      
      const initialButton = screen.getByRole('button');
      const initialOnClick = initialButton.onclick;
      
      rerender(
        <I18nProvider>
          <LanguageToggle />
        </I18nProvider>
      );
      
      const rerenderedButton = screen.getByRole('button');
      const rerenderedOnClick = rerenderedButton.onclick;
      
      expect(rerenderedOnClick).toBe(initialOnClick);
    });

    it('should not cause unnecessary re-renders', () => {
      let renderCount = 0;
      
      const CountingLanguageToggle = () => {
        renderCount++;
        return <LanguageToggle />;
      };
      
      const { rerender } = render(
        <I18nProvider>
          <CountingLanguageToggle />
        </I18nProvider>
      );
      
      expect(renderCount).toBe(1);
      
      // Re-render with same props
      rerender(
        <I18nProvider>
          <CountingLanguageToggle />
        </I18nProvider>
      );
      
      expect(renderCount).toBe(2); // Should only re-render when necessary
    });
  });

  describe('Edge Cases', () => {
    it('should handle unknown current language', () => {
      mockUseI18n.mockReturnValue({
        ...defaultUseI18nReturn,
        language: 'unknown-lang'
      });
      
      renderLanguageToggle();
      
      // Should render with fallback
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('??')).toBeInTheDocument(); // Fallback display
    });

    it('should handle null current language', () => {
      mockUseI18n.mockReturnValue({
        ...defaultUseI18nReturn,
        language: null as any
      });
      
      renderLanguageToggle();
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle empty supported languages', () => {
      mockUseI18n.mockReturnValue({
        ...defaultUseI18nReturn,
        supportedLanguages: []
      });
      
      renderLanguageToggle();
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should handle single supported language', () => {
      mockUseI18n.mockReturnValue({
        ...defaultUseI18nReturn,
        supportedLanguages: ['en']
      });
      
      renderLanguageToggle();
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Multi-language Support', () => {
    it('should cycle through multiple languages', async () => {
      const user = userEvent.setup();
      
      mockUseI18n.mockReturnValue({
        ...defaultUseI18nReturn,
        supportedLanguages: ['en', 'pt-BR', 'es', 'fr']
      });
      
      renderLanguageToggle({ cycleMultiple: true });
      
      const button = screen.getByRole('button');
      
      // First click: en -> pt-BR
      await user.click(button);
      expect(mockChangeLanguage).toHaveBeenCalledWith('pt-BR');
      
      // Simulate language changed
      mockUseI18n.mockReturnValue({
        ...defaultUseI18nReturn,
        language: 'pt-BR',
        supportedLanguages: ['en', 'pt-BR', 'es', 'fr']
      });
      
      // Second click: pt-BR -> es
      await user.click(button);
      expect(mockChangeLanguage).toHaveBeenCalledWith('es');
    });

    it('should show dropdown for many languages', () => {
      mockUseI18n.mockReturnValue({
        ...defaultUseI18nReturn,
        supportedLanguages: ['en', 'pt-BR', 'es', 'fr', 'de', 'it']
      });
      
      renderLanguageToggle({ dropdownThreshold: 4 });
      
      // Should render as dropdown instead of toggle
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });
});
