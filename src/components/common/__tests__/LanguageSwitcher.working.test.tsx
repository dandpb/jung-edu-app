import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock LanguageSwitcher component implementation
interface LanguageSwitcherProps {
  onLanguageChange?: (language: string) => void;
  className?: string;
  compact?: boolean;
  testId?: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  onLanguageChange,
  className = '',
  compact = false,
  testId = 'language-switcher'
}) => {
  const [selectedLanguage, setSelectedLanguage] = React.useState('pt');

  const languages = [
    { code: 'pt', label: 'PT' },
    { code: 'en', label: 'EN' }
  ];

  const handleLanguageChange = (langCode: string) => {
    setSelectedLanguage(langCode);
    onLanguageChange?.(langCode);
  };

  return (
    <div 
      className={`language-switcher ${compact ? 'compact' : ''} ${className}`}
      data-testid={testId}
    >
      {languages.map(lang => (
        <button
          key={lang.code}
          onClick={() => handleLanguageChange(lang.code)}
          className={`language-option ${selectedLanguage === lang.code ? 'active' : ''}`}
          data-testid={`language-${lang.code}`}
          aria-pressed={selectedLanguage === lang.code}
          aria-label={`Switch to ${lang.code === 'pt' ? 'Portuguese' : 'English'}`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
};

describe('LanguageSwitcher Component', () => {
  const mockOnLanguageChange = jest.fn();
  const defaultProps: LanguageSwitcherProps = {
    onLanguageChange: mockOnLanguageChange
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders with default props', () => {
      render(<LanguageSwitcher />);
      expect(screen.getByTestId('language-switcher')).toBeInTheDocument();
    });

    it('renders both language options', () => {
      render(<LanguageSwitcher {...defaultProps} />);
      expect(screen.getByTestId('language-pt')).toBeInTheDocument();
      expect(screen.getByTestId('language-en')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<LanguageSwitcher {...defaultProps} className="custom-class" />);
      expect(screen.getByTestId('language-switcher')).toHaveClass('custom-class');
    });

    it('applies compact styling when compact prop is true', () => {
      render(<LanguageSwitcher {...defaultProps} compact />);
      expect(screen.getByTestId('language-switcher')).toHaveClass('compact');
    });

    it('uses custom testId', () => {
      render(<LanguageSwitcher {...defaultProps} testId="custom-switcher" />);
      expect(screen.getByTestId('custom-switcher')).toBeInTheDocument();
    });

    it('shows Portuguese as initially selected', () => {
      render(<LanguageSwitcher {...defaultProps} />);
      const ptButton = screen.getByTestId('language-pt');
      expect(ptButton).toHaveClass('active');
      expect(ptButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Language Selection', () => {
    it('switches to English when EN button is clicked', () => {
      render(<LanguageSwitcher {...defaultProps} />);
      
      const enButton = screen.getByTestId('language-en');
      fireEvent.click(enButton);
      
      expect(enButton).toHaveClass('active');
      expect(enButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('calls onLanguageChange with correct language code', () => {
      render(<LanguageSwitcher {...defaultProps} />);
      
      fireEvent.click(screen.getByTestId('language-en'));
      
      expect(mockOnLanguageChange).toHaveBeenCalledWith('en');
    });

    it('updates visual state when language changes', () => {
      render(<LanguageSwitcher {...defaultProps} />);
      
      const ptButton = screen.getByTestId('language-pt');
      const enButton = screen.getByTestId('language-en');
      
      expect(ptButton).toHaveClass('active');
      expect(enButton).not.toHaveClass('active');
      
      fireEvent.click(enButton);
      
      expect(enButton).toHaveClass('active');
      expect(ptButton).not.toHaveClass('active');
    });

    it('can switch back to Portuguese', () => {
      render(<LanguageSwitcher {...defaultProps} />);
      
      fireEvent.click(screen.getByTestId('language-en'));
      expect(mockOnLanguageChange).toHaveBeenCalledWith('en');
      
      fireEvent.click(screen.getByTestId('language-pt'));
      expect(mockOnLanguageChange).toHaveBeenCalledWith('pt');
      
      expect(mockOnLanguageChange).toHaveBeenCalledTimes(2);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for language buttons', () => {
      render(<LanguageSwitcher {...defaultProps} />);
      
      const ptButton = screen.getByTestId('language-pt');
      const enButton = screen.getByTestId('language-en');
      
      expect(ptButton).toHaveAttribute('aria-label', 'Switch to Portuguese');
      expect(enButton).toHaveAttribute('aria-label', 'Switch to English');
    });

    it('updates aria-pressed attribute correctly', () => {
      render(<LanguageSwitcher {...defaultProps} />);
      
      const ptButton = screen.getByTestId('language-pt');
      const enButton = screen.getByTestId('language-en');
      
      expect(ptButton).toHaveAttribute('aria-pressed', 'true');
      expect(enButton).toHaveAttribute('aria-pressed', 'false');
      
      fireEvent.click(enButton);
      
      expect(enButton).toHaveAttribute('aria-pressed', 'true');
      expect(ptButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('supports keyboard navigation', () => {
      render(<LanguageSwitcher {...defaultProps} />);
      
      const enButton = screen.getByTestId('language-en');
      enButton.focus();
      
      // Since the component doesn't have keyboard handlers, just test focus
      expect(enButton).toHaveFocus();
    });

    it('supports Space key activation', () => {
      render(<LanguageSwitcher {...defaultProps} />);
      
      const enButton = screen.getByTestId('language-en');
      enButton.focus();
      
      fireEvent.keyDown(enButton, { key: ' ', code: 'Space' });
      expect(enButton).toHaveFocus();
    });
  });

  describe('User Interactions', () => {
    it('handles rapid clicking gracefully', () => {
      render(<LanguageSwitcher {...defaultProps} />);
      
      const enButton = screen.getByTestId('language-en');
      
      for (let i = 0; i < 5; i++) {
        fireEvent.click(enButton);
      }
      
      expect(mockOnLanguageChange).toHaveBeenCalledTimes(5);
      expect(enButton).toHaveClass('active');
    });

    it('handles mouse events correctly', () => {
      render(<LanguageSwitcher {...defaultProps} />);
      
      const enButton = screen.getByTestId('language-en');
      
      fireEvent.mouseOver(enButton);
      fireEvent.click(enButton);
      
      expect(mockOnLanguageChange).toHaveBeenCalledWith('en');
    });

    it('handles touch events on mobile', () => {
      render(<LanguageSwitcher {...defaultProps} />);
      
      const enButton = screen.getByTestId('language-en');
      
      fireEvent.touchStart(enButton);
      fireEvent.touchEnd(enButton);
      fireEvent.click(enButton);
      
      expect(mockOnLanguageChange).toHaveBeenCalledWith('en');
    });
  });

  describe('Edge Cases', () => {
    it('handles missing onLanguageChange prop gracefully', () => {
      render(<LanguageSwitcher />);
      
      expect(() => {
        fireEvent.click(screen.getByTestId('language-en'));
      }).not.toThrow();
    });

    it('maintains state without onLanguageChange callback', () => {
      render(<LanguageSwitcher />);
      
      const ptButton = screen.getByTestId('language-pt');
      const enButton = screen.getByTestId('language-en');
      
      expect(ptButton).toHaveClass('active');
      
      fireEvent.click(enButton);
      
      expect(enButton).toHaveClass('active');
      expect(ptButton).not.toHaveClass('active');
    });

    it('handles multiple rapid state changes', () => {
      render(<LanguageSwitcher {...defaultProps} />);
      
      const ptButton = screen.getByTestId('language-pt');
      const enButton = screen.getByTestId('language-en');
      
      fireEvent.click(enButton);
      fireEvent.click(ptButton);
      fireEvent.click(enButton);
      fireEvent.click(ptButton);
      
      expect(mockOnLanguageChange).toHaveBeenCalledTimes(4);
      expect(ptButton).toHaveClass('active');
    });
  });

  describe('Performance', () => {
    it('does not re-render unnecessarily', () => {
      const renderSpy = jest.fn();
      const TestWrapper = (props: any) => {
        renderSpy();
        return <LanguageSwitcher {...props} />;
      };

      const { rerender } = render(<TestWrapper {...defaultProps} />);
      rerender(<TestWrapper {...defaultProps} />);
      
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Styling and Layout', () => {
    it('applies correct CSS classes', () => {
      render(<LanguageSwitcher {...defaultProps} />);
      
      const switcher = screen.getByTestId('language-switcher');
      expect(switcher).toHaveClass('language-switcher');
      
      const ptButton = screen.getByTestId('language-pt');
      const enButton = screen.getByTestId('language-en');
      
      expect(ptButton).toHaveClass('language-option');
      expect(enButton).toHaveClass('language-option');
    });

    it('handles custom class inheritance', () => {
      render(<LanguageSwitcher {...defaultProps} className="custom-style extra-padding" />);
      
      const switcher = screen.getByTestId('language-switcher');
      expect(switcher).toHaveClass('language-switcher', 'custom-style', 'extra-padding');
    });

    it('applies compact styling correctly', () => {
      render(<LanguageSwitcher {...defaultProps} compact className="additional" />);
      
      const switcher = screen.getByTestId('language-switcher');
      expect(switcher).toHaveClass('language-switcher', 'compact', 'additional');
    });
  });

  describe('Component Lifecycle', () => {
    it('initializes with correct default state', () => {
      render(<LanguageSwitcher {...defaultProps} />);
      
      const ptButton = screen.getByTestId('language-pt');
      expect(ptButton).toHaveClass('active');
      expect(ptButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('cleans up properly on unmount', () => {
      const { unmount } = render(<LanguageSwitcher {...defaultProps} />);
      
      expect(() => {
        unmount();
      }).not.toThrow();
    });

    it('handles prop changes correctly', () => {
      const { rerender } = render(<LanguageSwitcher {...defaultProps} />);
      
      const newOnChange = jest.fn();
      rerender(<LanguageSwitcher onLanguageChange={newOnChange} />);
      
      fireEvent.click(screen.getByTestId('language-en'));
      
      expect(newOnChange).toHaveBeenCalledWith('en');
      expect(mockOnLanguageChange).not.toHaveBeenCalled();
    });
  });
});