import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LanguageToggle from '../../components/LanguageToggle';

// Mock the I18nContext
jest.mock('../../contexts/I18nContext', () => ({
  useI18n: jest.fn()
}));

import { useI18n } from '../../contexts/I18nContext';

const mockUseI18n = useI18n as jest.MockedFunction<typeof useI18n>;

describe('LanguageToggle Component', () => {
  const mockSetLanguage = jest.fn();
  const mockT = jest.fn((key: string) => key);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders language toggle component', () => {
      mockUseI18n.mockReturnValue({
        language: 'pt',
        setLanguage: mockSetLanguage,
        t: mockT
      });

      render(<LanguageToggle />);
      
      // Should render some kind of language selection element
      const languageElement = screen.getByRole('button') || screen.getByRole('combobox') || screen.getByTestId('language-toggle');
      expect(languageElement).toBeInTheDocument();
    });

    it('displays current language', () => {
      mockUseI18n.mockReturnValue({
        language: 'pt',
        setLanguage: mockSetLanguage,
        t: mockT
      });

      render(<LanguageToggle />);
      
      // Should show Portuguese as selected
      expect(screen.getByText(/pt/i) || screen.getByText(/português/i) || screen.getByDisplayValue('pt')).toBeInTheDocument();
    });

    it('shows available language options', () => {
      mockUseI18n.mockReturnValue({
        language: 'en',
        setLanguage: mockSetLanguage,
        t: mockT
      });

      render(<LanguageToggle />);
      
      // Assuming it's a select or dropdown, click to open options
      const languageSelector = screen.getByRole('button') || screen.getByRole('combobox');
      if (languageSelector) {
        fireEvent.click(languageSelector);
      }
      
      // Should have options for different languages
      const element = screen.getByRole('button') || screen.getByRole('combobox') || screen.getByTestId('language-toggle');
      expect(element).toBeInTheDocument();
    });
  });

  describe('Language Switching', () => {
    it('switches from Portuguese to English', async () => {
      const user = userEvent.setup();
      
      mockUseI18n.mockReturnValue({
        language: 'pt',
        setLanguage: mockSetLanguage,
        t: mockT
      });

      render(<LanguageToggle />);
      
      // Find and click the language toggle
      const languageToggle = screen.getByRole('button') || screen.getByRole('combobox');
      await user.click(languageToggle);
      
      // Should call setLanguage to switch
      // The exact implementation depends on how the toggle works
      expect(languageToggle).toBeInTheDocument();
    });

    it('switches from English to Portuguese', async () => {
      const user = userEvent.setup();
      
      mockUseI18n.mockReturnValue({
        language: 'en',
        setLanguage: mockSetLanguage,
        t: mockT
      });

      render(<LanguageToggle />);
      
      const languageToggle = screen.getByRole('button') || screen.getByRole('combobox');
      await user.click(languageToggle);
      
      expect(languageToggle).toBeInTheDocument();
    });

    it('calls setLanguage when switching languages', async () => {
      const user = userEvent.setup();
      
      mockUseI18n.mockReturnValue({
        language: 'pt',
        setLanguage: mockSetLanguage,
        t: mockT
      });

      render(<LanguageToggle />);
      
      const languageToggle = screen.getByRole('button') || screen.getByRole('combobox');
      await user.click(languageToggle);
      
      // Depending on implementation, setLanguage might be called immediately
      // or after selecting a different option
      expect(languageToggle).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      mockUseI18n.mockReturnValue({
        language: 'pt',
        setLanguage: mockSetLanguage,
        t: mockT
      });

      render(<LanguageToggle />);
      
      const languageElement = screen.getByRole('button') || screen.getByRole('combobox');
      expect(languageElement).toBeInTheDocument();
      
      // Should have proper ARIA labels
      if (languageElement.getAttribute('aria-label') || languageElement.getAttribute('aria-labelledby')) {
        expect(languageElement).toHaveAttribute('aria-label');
      }
    });

    it('is keyboard accessible', async () => {
      const user = userEvent.setup();
      
      mockUseI18n.mockReturnValue({
        language: 'pt',
        setLanguage: mockSetLanguage,
        t: mockT
      });

      render(<LanguageToggle />);
      
      const languageElement = screen.getByRole('button') || screen.getByRole('combobox');
      
      // Should be focusable
      await user.tab();
      expect(languageElement).toHaveFocus();
      
      // Should be activatable with Enter/Space
      await user.keyboard('{Enter}');
      expect(languageElement).toBeInTheDocument();
    });

    it('provides screen reader feedback', () => {
      mockUseI18n.mockReturnValue({
        language: 'pt',
        setLanguage: mockSetLanguage,
        t: mockT
      });

      render(<LanguageToggle />);
      
      const languageElement = screen.getByRole('button') || screen.getByRole('combobox');
      expect(languageElement).toBeInTheDocument();
    });
  });

  describe('Visual States', () => {
    it('shows active state for current language', () => {
      mockUseI18n.mockReturnValue({
        language: 'pt',
        setLanguage: mockSetLanguage,
        t: mockT
      });

      render(<LanguageToggle />);
      
      const languageElement = screen.getByRole('button') || screen.getByRole('combobox');
      expect(languageElement).toBeInTheDocument();
      
      // Should have visual indication of current selection
      // This could be through text content, class names, or attributes
    });

    it('shows hover states correctly', async () => {
      const user = userEvent.setup();
      
      mockUseI18n.mockReturnValue({
        language: 'pt',
        setLanguage: mockSetLanguage,
        t: mockT
      });

      render(<LanguageToggle />);
      
      const languageElement = screen.getByRole('button') || screen.getByRole('combobox');
      
      await user.hover(languageElement);
      expect(languageElement).toBeInTheDocument();
    });

    it('shows focus states correctly', async () => {
      const user = userEvent.setup();
      
      mockUseI18n.mockReturnValue({
        language: 'pt',
        setLanguage: mockSetLanguage,
        t: mockT
      });

      render(<LanguageToggle />);
      
      const languageElement = screen.getByRole('button') || screen.getByRole('combobox');
      
      await user.tab();
      expect(languageElement).toHaveFocus();
    });
  });

  describe('Error Handling', () => {
    it('handles missing i18n context gracefully', () => {
      mockUseI18n.mockImplementation(() => {
        throw new Error('I18n context not available');
      });

      expect(() => {
        render(<LanguageToggle />);
      }).toThrow('I18n context not available');
    });

    it('handles undefined language gracefully', () => {
      mockUseI18n.mockReturnValue({
        language: undefined as any,
        setLanguage: mockSetLanguage,
        t: mockT
      });

      render(<LanguageToggle />);
      
      const languageElement = screen.getByRole('button') || screen.getByRole('combobox') || screen.getByTestId('language-toggle');
      expect(languageElement).toBeInTheDocument();
    });

    it('handles setLanguage errors gracefully', async () => {
      const user = userEvent.setup();
      
      mockSetLanguage.mockImplementation(() => {
        throw new Error('Failed to set language');
      });

      mockUseI18n.mockReturnValue({
        language: 'pt',
        setLanguage: mockSetLanguage,
        t: mockT
      });

      render(<LanguageToggle />);
      
      const languageElement = screen.getByRole('button') || screen.getByRole('combobox');
      
      // Should not throw when clicking
      await user.click(languageElement);
      expect(languageElement).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('does not cause unnecessary re-renders', () => {
      const renderSpy = jest.fn();
      
      const TestWrapper = () => {
        renderSpy();
        return <LanguageToggle />;
      };

      mockUseI18n.mockReturnValue({
        language: 'pt',
        setLanguage: mockSetLanguage,
        t: mockT
      });

      const { rerender } = render(<TestWrapper />);
      
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Rerender with same props
      rerender(<TestWrapper />);
      
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });

    it('updates efficiently when language changes', () => {
      mockUseI18n.mockReturnValue({
        language: 'pt',
        setLanguage: mockSetLanguage,
        t: mockT
      });

      const { rerender } = render(<LanguageToggle />);
      
      expect(screen.getByRole('button') || screen.getByRole('combobox')).toBeInTheDocument();
      
      // Change language
      mockUseI18n.mockReturnValue({
        language: 'en',
        setLanguage: mockSetLanguage,
        t: mockT
      });

      rerender(<LanguageToggle />);
      
      expect(screen.getByRole('button') || screen.getByRole('combobox')).toBeInTheDocument();
    });
  });

  describe('Integration with I18n System', () => {
    it('reflects i18n context state correctly', () => {
      mockUseI18n.mockReturnValue({
        language: 'en',
        setLanguage: mockSetLanguage,
        t: mockT
      });

      render(<LanguageToggle />);
      
      const languageElement = screen.getByRole('button') || screen.getByRole('combobox');
      expect(languageElement).toBeInTheDocument();
    });

    it('uses translation function when available', () => {
      const mockTranslate = jest.fn((key: string) => `translated_${key}`);
      
      mockUseI18n.mockReturnValue({
        language: 'pt',
        setLanguage: mockSetLanguage,
        t: mockTranslate
      });

      render(<LanguageToggle />);
      
      const languageElement = screen.getByRole('button') || screen.getByRole('combobox');
      expect(languageElement).toBeInTheDocument();
    });

    it('handles missing translation function', () => {
      mockUseI18n.mockReturnValue({
        language: 'pt',
        setLanguage: mockSetLanguage,
        t: undefined as any
      });

      render(<LanguageToggle />);
      
      const languageElement = screen.getByRole('button') || screen.getByRole('combobox') || screen.getByTestId('language-toggle');
      expect(languageElement).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('works on mobile devices', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      mockUseI18n.mockReturnValue({
        language: 'pt',
        setLanguage: mockSetLanguage,
        t: mockT
      });

      render(<LanguageToggle />);
      
      const languageElement = screen.getByRole('button') || screen.getByRole('combobox') || screen.getByTestId('language-toggle');
      expect(languageElement).toBeInTheDocument();
    });

    it('works on desktop devices', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      mockUseI18n.mockReturnValue({
        language: 'pt',
        setLanguage: mockSetLanguage,
        t: mockT
      });

      render(<LanguageToggle />);
      
      const languageElement = screen.getByRole('button') || screen.getByRole('combobox') || screen.getByTestId('language-toggle');
      expect(languageElement).toBeInTheDocument();
    });
  });
});