import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock LanguageToggle component implementation
interface Language {
  code: string;
  name: string;
  flag: string;
}

interface LanguageToggleProps {
  currentLanguage?: string;
  onLanguageChange?: (languageCode: string) => void;
  availableLanguages?: Language[];
  disabled?: boolean;
  variant?: 'dropdown' | 'buttons';
  showFlags?: boolean;
  className?: string;
  testId?: string;
}

const LanguageToggle: React.FC<LanguageToggleProps> = ({
  currentLanguage = 'pt',
  onLanguageChange,
  availableLanguages = [
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' }
  ],
  disabled = false,
  variant = 'dropdown',
  showFlags = true,
  className = '',
  testId = 'language-toggle'
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleLanguageSelect = (languageCode: string) => {
    if (disabled) return;
    onLanguageChange?.(languageCode);
    setIsOpen(false);
  };

  const currentLang = availableLanguages.find(lang => lang.code === currentLanguage);

  if (variant === 'buttons') {
    return (
      <div className={`language-toggle-buttons ${className}`} data-testid={testId}>
        {availableLanguages.map(language => (
          <button
            key={language.code}
            onClick={() => handleLanguageSelect(language.code)}
            disabled={disabled}
            className={`language-button ${currentLanguage === language.code ? 'active' : ''}`}
            data-testid={`language-button-${language.code}`}
            aria-label={`Switch to ${language.name}`}
          >
            {showFlags && language.flag} {language.name}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`language-toggle-dropdown ${className}`} data-testid={testId}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="language-toggle-trigger"
        data-testid="language-toggle-trigger"
        aria-label="Change language"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {showFlags && currentLang?.flag} {currentLang?.name}
        <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>
      
      {isOpen && (
        <div 
          className="language-dropdown" 
          data-testid="language-dropdown"
          role="listbox"
        >
          {availableLanguages.map(language => (
            <button
              key={language.code}
              onClick={() => handleLanguageSelect(language.code)}
              className={`language-option ${currentLanguage === language.code ? 'selected' : ''}`}
              data-testid={`language-option-${language.code}`}
              role="option"
              aria-selected={currentLanguage === language.code}
            >
              {showFlags && language.flag} {language.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

describe('LanguageToggle Component', () => {
  const mockOnLanguageChange = jest.fn();
  const defaultProps: LanguageToggleProps = {
    currentLanguage: 'pt',
    onLanguageChange: mockOnLanguageChange,
    availableLanguages: [
      { code: 'pt', name: 'Português', flag: '🇧🇷' },
      { code: 'en', name: 'English', flag: '🇺🇸' },
      { code: 'es', name: 'Español', flag: '🇪🇸' }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders with default props', () => {
      render(<LanguageToggle />);
      expect(screen.getByTestId('language-toggle')).toBeInTheDocument();
      expect(screen.getByTestId('language-toggle-trigger')).toBeInTheDocument();
    });

    it('renders current language correctly', () => {
      render(<LanguageToggle {...defaultProps} />);
      expect(screen.getByTestId('language-toggle-trigger')).toHaveTextContent('🇧🇷 Português');
    });

    it('renders without flags when showFlags is false', () => {
      render(<LanguageToggle {...defaultProps} showFlags={false} />);
      const trigger = screen.getByTestId('language-toggle-trigger');
      expect(trigger).toHaveTextContent('Português');
      expect(trigger).not.toHaveTextContent('🇧🇷');
    });

    it('applies custom className', () => {
      render(<LanguageToggle {...defaultProps} className="custom-class" />);
      expect(screen.getByTestId('language-toggle')).toHaveClass('custom-class');
    });

    it('uses custom testId', () => {
      render(<LanguageToggle {...defaultProps} testId="custom-toggle" />);
      expect(screen.getByTestId('custom-toggle')).toBeInTheDocument();
    });
  });

  describe('Dropdown Variant', () => {
    it('shows dropdown when trigger is clicked', async () => {
      render(<LanguageToggle {...defaultProps} />);
      
      const trigger = screen.getByTestId('language-toggle-trigger');
      fireEvent.click(trigger);
      
      await waitFor(() => {
        expect(screen.getByTestId('language-dropdown')).toBeInTheDocument();
      });
    });

    it('shows all available languages in dropdown', async () => {
      render(<LanguageToggle {...defaultProps} />);
      
      fireEvent.click(screen.getByTestId('language-toggle-trigger'));
      
      await waitFor(() => {
        expect(screen.getByTestId('language-option-pt')).toBeInTheDocument();
        expect(screen.getByTestId('language-option-en')).toBeInTheDocument();
        expect(screen.getByTestId('language-option-es')).toBeInTheDocument();
      });
    });

    it('marks current language as selected', async () => {
      render(<LanguageToggle {...defaultProps} currentLanguage="en" />);
      
      fireEvent.click(screen.getByTestId('language-toggle-trigger'));
      
      await waitFor(() => {
        const selectedOption = screen.getByTestId('language-option-en');
        expect(selectedOption).toHaveClass('selected');
        expect(selectedOption).toHaveAttribute('aria-selected', 'true');
      });
    });
  });

  describe('Button Variant', () => {
    it('renders language buttons when variant is buttons', () => {
      render(<LanguageToggle {...defaultProps} variant="buttons" />);
      
      expect(screen.getByTestId('language-button-pt')).toBeInTheDocument();
      expect(screen.getByTestId('language-button-en')).toBeInTheDocument();
      expect(screen.getByTestId('language-button-es')).toBeInTheDocument();
    });

    it('marks current language button as active', () => {
      render(<LanguageToggle {...defaultProps} variant="buttons" currentLanguage="en" />);
      
      const activeButton = screen.getByTestId('language-button-en');
      expect(activeButton).toHaveClass('active');
    });

    it('shows flags in buttons when showFlags is true', () => {
      render(<LanguageToggle {...defaultProps} variant="buttons" />);
      
      const ptButton = screen.getByTestId('language-button-pt');
      expect(ptButton).toHaveTextContent('🇧🇷 Português');
    });
  });

  describe('User Interactions', () => {
    it('calls onLanguageChange when dropdown option is selected', async () => {
      render(<LanguageToggle {...defaultProps} />);
      
      fireEvent.click(screen.getByTestId('language-toggle-trigger'));
      
      await waitFor(() => {
        expect(screen.getByTestId('language-dropdown')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('language-option-en'));
      
      expect(mockOnLanguageChange).toHaveBeenCalledWith('en');
    });

    it('calls onLanguageChange when button is clicked', () => {
      render(<LanguageToggle {...defaultProps} variant="buttons" />);
      
      fireEvent.click(screen.getByTestId('language-button-en'));
      
      expect(mockOnLanguageChange).toHaveBeenCalledWith('en');
    });

    it('closes dropdown after language selection', async () => {
      render(<LanguageToggle {...defaultProps} />);
      
      fireEvent.click(screen.getByTestId('language-toggle-trigger'));
      
      await waitFor(() => {
        expect(screen.getByTestId('language-dropdown')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('language-option-en'));
      
      await waitFor(() => {
        expect(screen.queryByTestId('language-dropdown')).not.toBeInTheDocument();
      });
    });
  });

  describe('Disabled State', () => {
    it('disables trigger when disabled prop is true', () => {
      render(<LanguageToggle {...defaultProps} disabled />);
      
      const trigger = screen.getByTestId('language-toggle-trigger');
      expect(trigger).toBeDisabled();
    });

    it('disables all buttons when disabled prop is true', () => {
      render(<LanguageToggle {...defaultProps} variant="buttons" disabled />);
      
      expect(screen.getByTestId('language-button-pt')).toBeDisabled();
      expect(screen.getByTestId('language-button-en')).toBeDisabled();
      expect(screen.getByTestId('language-button-es')).toBeDisabled();
    });

    it('does not call onLanguageChange when disabled', () => {
      render(<LanguageToggle {...defaultProps} variant="buttons" disabled />);
      
      fireEvent.click(screen.getByTestId('language-button-en'));
      
      expect(mockOnLanguageChange).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes for dropdown', () => {
      render(<LanguageToggle {...defaultProps} />);
      
      const trigger = screen.getByTestId('language-toggle-trigger');
      expect(trigger).toHaveAttribute('aria-label', 'Change language');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    });

    it('updates aria-expanded when dropdown is opened', async () => {
      render(<LanguageToggle {...defaultProps} />);
      
      const trigger = screen.getByTestId('language-toggle-trigger');
      fireEvent.click(trigger);
      
      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('has proper ARIA attributes for dropdown options', async () => {
      render(<LanguageToggle {...defaultProps} />);
      
      fireEvent.click(screen.getByTestId('language-toggle-trigger'));
      
      await waitFor(() => {
        const dropdown = screen.getByTestId('language-dropdown');
        expect(dropdown).toHaveAttribute('role', 'listbox');
        
        const options = screen.getAllByRole('option');
        options.forEach(option => {
          expect(option).toHaveAttribute('aria-selected');
        });
      });
    });

    it('has proper ARIA labels for button variant', () => {
      render(<LanguageToggle {...defaultProps} variant="buttons" />);
      
      const ptButton = screen.getByTestId('language-button-pt');
      expect(ptButton).toHaveAttribute('aria-label', 'Switch to Português');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty availableLanguages array', () => {
      render(<LanguageToggle {...defaultProps} availableLanguages={[]} />);
      
      expect(screen.getByTestId('language-toggle')).toBeInTheDocument();
    });

    it('handles missing onLanguageChange prop', () => {
      render(<LanguageToggle currentLanguage="pt" variant="buttons" />);
      
      expect(() => {
        fireEvent.click(screen.getByTestId('language-button-pt'));
      }).not.toThrow();
    });

    it('handles invalid currentLanguage code', () => {
      render(<LanguageToggle {...defaultProps} currentLanguage="invalid" />);
      
      expect(screen.getByTestId('language-toggle')).toBeInTheDocument();
    });

    it('handles single language option', () => {
      const singleLang = [{ code: 'pt', name: 'Português', flag: '🇧🇷' }];
      render(<LanguageToggle {...defaultProps} availableLanguages={singleLang} />);
      
      fireEvent.click(screen.getByTestId('language-toggle-trigger'));
      
      expect(screen.getByTestId('language-option-pt')).toBeInTheDocument();
    });
  });
});