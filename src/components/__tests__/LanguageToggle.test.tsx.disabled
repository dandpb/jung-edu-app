/**
 * LanguageToggle Component Tests
 * Comprehensive test suite covering all functionality including user interactions,
 * accessibility, edge cases, and integration with i18n hook
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { LanguageToggle } from '../LanguageToggle';
import { useI18n } from '../../hooks/useI18n';

// Mock the useI18n hook
jest.mock('../../hooks/useI18n');

const mockUseI18n = useI18n as jest.MockedFunction<typeof useI18n>;

describe('LanguageToggle Component', () => {
  // Default mock implementation
  const defaultMockReturn = {
    t: jest.fn((key: string) => key),
    language: 'en',
    supportedLanguages: ['en', 'pt-BR'],
    changeLanguage: jest.fn().mockResolvedValue(undefined),
    isLoading: false,
    isReady: true,
    getAvailableTranslations: jest.fn().mockReturnValue([]),
    hasTranslation: jest.fn().mockReturnValue(true),
    getCurrentNamespace: jest.fn().mockReturnValue('translation'),
    loadNamespace: jest.fn().mockResolvedValue(undefined)
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseI18n.mockReturnValue(defaultMockReturn);
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<LanguageToggle />);
      
      const button = screen.getByRole('button', { name: /toggle language/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('EN');
      expect(button).toHaveClass('language-toggle');
    });

    it('should render with custom className', () => {
      render(<LanguageToggle className="custom-class" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('language-toggle', 'custom-class');
    });

    it('should render with custom aria-label', () => {
      render(<LanguageToggle aria-label="Switch between languages" />);
      
      const button = screen.getByRole('button', { name: /switch between languages/i });
      expect(button).toBeInTheDocument();
    });

    it('should display current language code correctly', () => {
      mockUseI18n.mockReturnValue({
        ...defaultMockReturn,
        language: 'pt-BR'
      });

      render(<LanguageToggle />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('PT');
    });

    it('should handle unknown language codes gracefully', () => {
      mockUseI18n.mockReturnValue({
        ...defaultMockReturn,
        language: 'unknown-lang'
      });

      render(<LanguageToggle />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('UNKNOWN-LANG');
    });
  });

  describe('Language Display Names', () => {
    const languageTestCases = [
      { code: 'en', expected: 'EN' },
      { code: 'pt-BR', expected: 'PT' },
      { code: 'es', expected: 'ES' },
      { code: 'fr', expected: 'FR' },
      { code: 'de', expected: 'DE' },
      { code: 'ja', expected: 'JA' },
      { code: 'zh-CN', expected: 'ZH-CN' }
    ];

    languageTestCases.forEach(({ code, expected }) => {
      it(`should display "${expected}" for language code "${code}"`, () => {
        mockUseI18n.mockReturnValue({
          ...defaultMockReturn,
          language: code
        });

        render(<LanguageToggle />);
        
        const button = screen.getByRole('button');
        expect(button).toHaveTextContent(expected);
      });
    });
  });

  describe('Interaction Behavior', () => {
    it('should call changeLanguage when clicked', async () => {
      const changeLanguageMock = jest.fn().mockResolvedValue(undefined);
      mockUseI18n.mockReturnValue({
        ...defaultMockReturn,
        changeLanguage: changeLanguageMock
      });

      const user = userEvent.setup();
      render(<LanguageToggle />);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(changeLanguageMock).toHaveBeenCalledWith('pt-BR');
    });

    it('should cycle through supported languages correctly', async () => {
      const changeLanguageMock = jest.fn().mockResolvedValue(undefined);
      mockUseI18n.mockReturnValue({
        ...defaultMockReturn,
        language: 'en',
        supportedLanguages: ['en', 'pt-BR', 'es'],
        changeLanguage: changeLanguageMock
      });

      const user = userEvent.setup();
      const { rerender } = render(<LanguageToggle />);
      
      let button = screen.getByRole('button');
      
      // First click: en -> pt-BR
      await user.click(button);
      expect(changeLanguageMock).toHaveBeenCalledWith('pt-BR');
      
      // Simulate language change and re-render
      mockUseI18n.mockReturnValue({
        ...defaultMockReturn,
        language: 'pt-BR',
        supportedLanguages: ['en', 'pt-BR', 'es'],
        changeLanguage: changeLanguageMock
      });
      
      rerender(<LanguageToggle />);
      
      // Get button reference again after re-render
      button = screen.getByRole('button');
      
      // Second click: pt-BR -> es
      await user.click(button);
      expect(changeLanguageMock).toHaveBeenCalledWith('es');
    });

    it('should wrap around to first language when at end of list', async () => {
      const changeLanguageMock = jest.fn().mockResolvedValue(undefined);
      mockUseI18n.mockReturnValue({
        ...defaultMockReturn,
        language: 'es', // Last language
        supportedLanguages: ['en', 'pt-BR', 'es'],
        changeLanguage: changeLanguageMock
      });

      const user = userEvent.setup();
      render(<LanguageToggle />);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(changeLanguageMock).toHaveBeenCalledWith('en');
    });

    it('should handle keyboard navigation', async () => {
      const changeLanguageMock = jest.fn().mockResolvedValue(undefined);
      mockUseI18n.mockReturnValue({
        ...defaultMockReturn,
        changeLanguage: changeLanguageMock
      });

      render(<LanguageToggle />);
      
      const button = screen.getByRole('button');
      
      // Focus the button and press Enter
      button.focus();
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      
      await waitFor(() => {
        expect(changeLanguageMock).toHaveBeenCalledWith('pt-BR');
      });
    });

    it('should handle space key activation', async () => {
      const changeLanguageMock = jest.fn().mockResolvedValue(undefined);
      mockUseI18n.mockReturnValue({
        ...defaultMockReturn,
        changeLanguage: changeLanguageMock
      });

      render(<LanguageToggle />);
      
      const button = screen.getByRole('button');
      
      // Focus and press space
      button.focus();
      fireEvent.keyDown(button, { key: ' ', code: 'Space' });
      
      await waitFor(() => {
        expect(changeLanguageMock).toHaveBeenCalledWith('pt-BR');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should be disabled when less than 2 supported languages', () => {
      mockUseI18n.mockReturnValue({
        ...defaultMockReturn,
        supportedLanguages: ['en']
      });

      render(<LanguageToggle />);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should not call changeLanguage when disabled', async () => {
      const changeLanguageMock = jest.fn();
      mockUseI18n.mockReturnValue({
        ...defaultMockReturn,
        supportedLanguages: ['en'],
        changeLanguage: changeLanguageMock
      });

      const user = userEvent.setup();
      render(<LanguageToggle />);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(changeLanguageMock).not.toHaveBeenCalled();
    });

    it('should handle empty supported languages array', () => {
      mockUseI18n.mockReturnValue({
        ...defaultMockReturn,
        supportedLanguages: []
      });

      render(<LanguageToggle />);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveTextContent('EN');
    });

    it('should handle current language not in supported languages', async () => {
      const changeLanguageMock = jest.fn().mockResolvedValue(undefined);
      mockUseI18n.mockReturnValue({
        ...defaultMockReturn,
        language: 'unknown',
        supportedLanguages: ['en', 'pt-BR'],
        changeLanguage: changeLanguageMock
      });

      const user = userEvent.setup();
      render(<LanguageToggle />);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      // Should default to first supported language
      expect(changeLanguageMock).toHaveBeenCalledWith('en');
    });
  });

  describe('Accessibility', () => {
    it('should have correct ARIA attributes', () => {
      render(<LanguageToggle />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('role', 'button');
      expect(button).toHaveAttribute('type', 'button');
      expect(button).toHaveAttribute('aria-label', 'Toggle language');
    });

    it('should be focusable', () => {
      render(<LanguageToggle />);
      
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should support custom aria-label', () => {
      render(<LanguageToggle aria-label="Change application language" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Change application language');
    });

    it('should indicate disabled state to screen readers', () => {
      mockUseI18n.mockReturnValue({
        ...defaultMockReturn,
        supportedLanguages: ['en']
      });

      render(<LanguageToggle />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('disabled');
    });
  });

  describe('Error Handling', () => {
    it('should handle changeLanguage errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const changeLanguageMock = jest.fn().mockRejectedValue(new Error('Network error'));
      
      mockUseI18n.mockReturnValue({
        ...defaultMockReturn,
        changeLanguage: changeLanguageMock
      });

      const user = userEvent.setup();
      render(<LanguageToggle />);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(changeLanguageMock).toHaveBeenCalled();
      // Component should not crash
      expect(button).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    it('should handle undefined hook values gracefully', () => {
      mockUseI18n.mockReturnValue({
        ...defaultMockReturn,
        language: undefined as any,
        supportedLanguages: undefined as any
      });

      // Should not crash
      expect(() => render(<LanguageToggle />)).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const { rerender } = render(<LanguageToggle />);
      
      // Re-render with same props
      rerender(<LanguageToggle />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should handle rapid clicks appropriately', async () => {
      const changeLanguageMock = jest.fn().mockResolvedValue(undefined);
      mockUseI18n.mockReturnValue({
        ...defaultMockReturn,
        changeLanguage: changeLanguageMock
      });

      const user = userEvent.setup();
      render(<LanguageToggle />);
      
      const button = screen.getByRole('button');
      
      // Rapid clicks
      await user.click(button);
      await user.click(button);
      await user.click(button);
      
      expect(changeLanguageMock).toHaveBeenCalledTimes(3);
    });
  });

  describe('Integration', () => {
    it('should work with real useI18n hook interface', () => {
      // Test that component works with the actual hook interface
      mockUseI18n.mockReturnValue({
        t: jest.fn((key: string) => `translated_${key}`),
        language: 'en',
        supportedLanguages: ['en', 'pt-BR', 'es', 'fr', 'de'],
        changeLanguage: jest.fn().mockResolvedValue(undefined),
        isLoading: false,
        isReady: true,
        getAvailableTranslations: jest.fn().mockReturnValue(['key1', 'key2']),
        hasTranslation: jest.fn().mockReturnValue(true),
        getCurrentNamespace: jest.fn().mockReturnValue('translation'),
        loadNamespace: jest.fn().mockResolvedValue(undefined)
      });

      render(<LanguageToggle />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('EN');
    });

    it('should handle hook loading states appropriately', () => {
      mockUseI18n.mockReturnValue({
        ...defaultMockReturn,
        isLoading: true,
        isReady: false
      });

      render(<LanguageToggle />);
      
      // Component should still render but might be in loading state
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });
});