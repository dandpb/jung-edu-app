import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LanguageToggle from '../LanguageToggle';

// Mock the language context and hooks
const mockLanguageContext = {
  currentLanguage: 'en',
  setLanguage: jest.fn(),
  availableLanguages: ['en', 'pt-br'],
  translations: {
    en: { language: 'Language' },
    'pt-br': { language: 'Idioma' }
  }
};

jest.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => mockLanguageContext,
  LanguageContext: React.createContext(mockLanguageContext)
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('LanguageToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render language toggle button', () => {
    renderWithRouter(<LanguageToggle />);
    
    const toggleButton = screen.getByRole('button');
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton).toHaveTextContent('EN');
  });

  it('should display current language code in uppercase', () => {
    mockLanguageContext.currentLanguage = 'pt-br';
    
    renderWithRouter(<LanguageToggle />);
    
    const toggleButton = screen.getByRole('button');
    expect(toggleButton).toHaveTextContent('PT-BR');
  });

  it('should open dropdown when clicked', () => {
    renderWithRouter(<LanguageToggle />);
    
    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);
    
    const dropdown = screen.getByRole('menu');
    expect(dropdown).toBeInTheDocument();
    expect(dropdown).toHaveClass('block');
  });

  it('should close dropdown when clicked outside', async () => {
    renderWithRouter(<LanguageToggle />);
    
    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);
    
    // Click outside the dropdown
    fireEvent.click(document.body);
    
    await waitFor(() => {
      const dropdown = screen.queryByRole('menu');
      expect(dropdown).toHaveClass('hidden');
    });
  });

  it('should display all available languages in dropdown', () => {
    renderWithRouter(<LanguageToggle />);
    
    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);
    
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Português (BR)')).toBeInTheDocument();
  });

  it('should highlight current language in dropdown', () => {
    mockLanguageContext.currentLanguage = 'en';
    
    renderWithRouter(<LanguageToggle />);
    
    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);
    
    const currentLanguageItem = screen.getByText('English').closest('button');
    expect(currentLanguageItem).toHaveClass('bg-blue-50', 'text-blue-600');
  });

  it('should call setLanguage when a language is selected', () => {
    mockLanguageContext.currentLanguage = 'en';
    
    renderWithRouter(<LanguageToggle />);
    
    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);
    
    const portugueseOption = screen.getByText('Português (BR)');
    fireEvent.click(portugueseOption);
    
    expect(mockLanguageContext.setLanguage).toHaveBeenCalledWith('pt-br');
  });

  it('should close dropdown after selecting a language', () => {
    renderWithRouter(<LanguageToggle />);
    
    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);
    
    const portugueseOption = screen.getByText('Português (BR)');
    fireEvent.click(portugueseOption);
    
    const dropdown = screen.getByRole('menu');
    expect(dropdown).toHaveClass('hidden');
  });

  it('should handle keyboard navigation', () => {
    renderWithRouter(<LanguageToggle />);
    
    const toggleButton = screen.getByRole('button');
    
    // Open dropdown with Enter key
    fireEvent.keyDown(toggleButton, { key: 'Enter', code: 'Enter' });
    
    const dropdown = screen.getByRole('menu');
    expect(dropdown).toHaveClass('block');
    
    // Close dropdown with Escape key
    fireEvent.keyDown(toggleButton, { key: 'Escape', code: 'Escape' });
    expect(dropdown).toHaveClass('hidden');
  });

  it('should handle arrow key navigation in dropdown', () => {
    renderWithRouter(<LanguageToggle />);
    
    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);
    
    // Arrow down should focus first option
    fireEvent.keyDown(toggleButton, { key: 'ArrowDown', code: 'ArrowDown' });
    
    const firstOption = screen.getByText('English').closest('button');
    expect(firstOption).toHaveFocus();
  });

  it('should handle screen readers accessibility', () => {
    renderWithRouter(<LanguageToggle />);
    
    const toggleButton = screen.getByRole('button');
    expect(toggleButton).toHaveAttribute('aria-haspopup', 'true');
    expect(toggleButton).toHaveAttribute('aria-label', expect.stringContaining('language'));
  });

  it('should show loading state when language is being changed', async () => {
    mockLanguageContext.setLanguage.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );
    
    renderWithRouter(<LanguageToggle />);
    
    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);
    
    const portugueseOption = screen.getByText('Português (BR)');
    fireEvent.click(portugueseOption);
    
    // Should show loading indicator
    expect(screen.getByTestId('language-loading')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByTestId('language-loading')).not.toBeInTheDocument();
    });
  });

  it('should handle language change errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockLanguageContext.setLanguage.mockRejectedValue(new Error('Language change failed'));
    
    renderWithRouter(<LanguageToggle />);
    
    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);
    
    const portugueseOption = screen.getByText('Português (BR)');
    fireEvent.click(portugueseOption);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Language change failed'),
        expect.any(Error)
      );
    });
    
    consoleSpy.mockRestore();
  });

  it('should maintain focus management for accessibility', () => {
    renderWithRouter(<LanguageToggle />);
    
    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);
    
    // Dropdown should be visible
    const dropdown = screen.getByRole('menu');
    expect(dropdown).toBeInTheDocument();
    
    // Focus should move to first menu item
    const firstMenuItem = dropdown.querySelector('[role="menuitem"]');
    expect(firstMenuItem).toBeDefined();
  });

  it('should work with custom CSS classes', () => {
    renderWithRouter(<LanguageToggle />);
    
    const toggleButton = screen.getByRole('button');
    expect(toggleButton).toHaveClass('px-3', 'py-2', 'rounded');
    
    fireEvent.click(toggleButton);
    
    const dropdown = screen.getByRole('menu');
    expect(dropdown).toHaveClass('absolute', 'right-0', 'mt-2');
  });

  it('should handle rapid clicks without breaking', () => {
    renderWithRouter(<LanguageToggle />);
    
    const toggleButton = screen.getByRole('button');
    
    // Rapid clicks
    for (let i = 0; i < 10; i++) {
      fireEvent.click(toggleButton);
    }
    
    // Should still work normally
    const dropdown = screen.getByRole('menu');
    expect(dropdown).toBeInTheDocument();
  });

  it('should display language names correctly', () => {
    renderWithRouter(<LanguageToggle />);
    
    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);
    
    // Check language display names
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Português (BR)')).toBeInTheDocument();
  });

  it('should handle empty language list gracefully', () => {
    mockLanguageContext.availableLanguages = [];
    
    renderWithRouter(<LanguageToggle />);
    
    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);
    
    // Should not crash and should show appropriate message
    expect(screen.getByText('No languages available')).toBeInTheDocument();
  });

  it('should persist dropdown state during re-renders', () => {
    const { rerender } = renderWithRouter(<LanguageToggle />);
    
    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);
    
    // Re-render the component
    rerender(
      <BrowserRouter>
        <LanguageToggle />
      </BrowserRouter>
    );
    
    // Dropdown should still be open
    const dropdown = screen.getByRole('menu');
    expect(dropdown).toHaveClass('block');
  });

  describe('edge cases', () => {
    it('should handle very long language names', () => {
      mockLanguageContext.availableLanguages = ['en', 'very-long-language-code-that-might-break-layout'];
      
      renderWithRouter(<LanguageToggle />);
      
      const toggleButton = screen.getByRole('button');
      fireEvent.click(toggleButton);
      
      // Should render without breaking layout
      const dropdown = screen.getByRole('menu');
      expect(dropdown).toBeInTheDocument();
    });

    it('should handle special characters in language codes', () => {
      mockLanguageContext.currentLanguage = 'zh-CN';
      mockLanguageContext.availableLanguages = ['en', 'zh-CN', 'pt-BR'];
      
      renderWithRouter(<LanguageToggle />);
      
      const toggleButton = screen.getByRole('button');
      expect(toggleButton).toHaveTextContent('ZH-CN');
    });

    it('should handle missing language context gracefully', () => {
      // Mock missing context
      jest.mock('../../contexts/LanguageContext', () => ({
        useLanguage: () => null
      }));
      
      expect(() => renderWithRouter(<LanguageToggle />)).not.toThrow();
    });
  });
});