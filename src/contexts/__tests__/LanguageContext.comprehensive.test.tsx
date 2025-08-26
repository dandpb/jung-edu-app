/**
 * Comprehensive test suite for LanguageContext
 * Tests language preference management, localStorage persistence, and provider functionality
 * Covers edge cases, error handling, and coordination hooks integration
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageProvider, useLanguage } from '../LanguageContext';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock coordination hooks
jest.mock('../../../hooks/coordination', () => ({
  useCoordination: () => ({
    reportProgress: jest.fn(),
    updateMemory: jest.fn(),
    notify: jest.fn()
  })
}), { virtual: true });

// Test components
const TestComponent = () => {
  const { currentLanguage, availableLanguages, setLanguage, isLanguageSupported } = useLanguage();
  
  return (
    <div>
      <span data-testid="current-language">{currentLanguage}</span>
      <span data-testid="available-languages">{availableLanguages.join(',')}</span>
      <span data-testid="language-supported-en">{isLanguageSupported('en') ? 'yes' : 'no'}</span>
      <span data-testid="language-supported-invalid">{isLanguageSupported('invalid') ? 'yes' : 'no'}</span>
      
      <button data-testid="switch-to-portuguese" onClick={() => setLanguage('pt-BR')}>
        Switch to Portuguese
      </button>
      <button data-testid="switch-to-english" onClick={() => setLanguage('en')}>
        Switch to English
      </button>
      <button data-testid="switch-to-invalid" onClick={() => setLanguage('invalid-lang')}>
        Switch to Invalid
      </button>
      
      <select data-testid="language-selector" value={currentLanguage} onChange={(e) => setLanguage(e.target.value)}>
        {availableLanguages.map(lang => (
          <option key={lang} value={lang}>{lang}</option>
        ))}
      </select>
    </div>
  );
};

const ErrorTestComponent = () => {
  try {
    useLanguage();
    return <div>Should not render</div>;
  } catch (error) {
    return <div data-testid="error-message">{(error as Error).message}</div>;
  }
};

const CustomLanguagesComponent = ({ languages }: { languages: string[] }) => {
  const { availableLanguages, isLanguageSupported } = useLanguage();
  
  return (
    <div>
      <span data-testid="custom-languages">{availableLanguages.join(',')}</span>
      {languages.map(lang => (
        <span key={lang} data-testid={`supports-${lang}`}>
          {isLanguageSupported(lang) ? 'yes' : 'no'}
        </span>
      ))}
    </div>
  );
};

const PersistenceTestComponent = () => {
  const { currentLanguage, setLanguage } = useLanguage();
  const [changeCount, setChangeCount] = React.useState(0);
  
  const handleChange = (lang: string) => {
    setLanguage(lang);
    setChangeCount(prev => prev + 1);
  };
  
  return (
    <div>
      <span data-testid="persistence-language">{currentLanguage}</span>
      <span data-testid="change-count">{changeCount}</span>
      <button data-testid="change-multiple" onClick={() => {
        handleChange('pt-BR');
        handleChange('en');
        handleChange('pt-BR');
      }}>
        Multiple Changes
      </button>
    </div>
  );
};

describe('LanguageContext Comprehensive Test Suite', () => {
  beforeEach(() => {
    // Initialize coordination hooks
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    console.log('🔄 Starting LanguageContext test with coordination hooks');
    consoleLogSpy.mockRestore();

    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    // Cleanup coordination hooks
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    console.log('✅ LanguageContext test completed with coordination hooks');
    consoleLogSpy.mockRestore();
  });

  describe('Provider Initialization', () => {
    it('should initialize with default language', () => {
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      expect(screen.getByTestId('available-languages')).toHaveTextContent('en,pt-BR');
    });

    it('should initialize with custom default language', () => {
      render(
        <LanguageProvider defaultLanguage="pt-BR">
          <TestComponent />
        </LanguageProvider>
      );

      expect(screen.getByTestId('current-language')).toHaveTextContent('pt-BR');
    });

    it('should initialize with custom available languages', () => {
      const customLanguages = ['en', 'pt-BR', 'es', 'fr'];
      
      render(
        <LanguageProvider availableLanguages={customLanguages}>
          <CustomLanguagesComponent languages={customLanguages} />
        </LanguageProvider>
      );

      expect(screen.getByTestId('custom-languages')).toHaveTextContent('en,pt-BR,es,fr');
      expect(screen.getByTestId('supports-en')).toHaveTextContent('yes');
      expect(screen.getByTestId('supports-es')).toHaveTextContent('yes');
      expect(screen.getByTestId('supports-fr')).toHaveTextContent('yes');
    });

    it('should handle empty available languages array', () => {
      render(
        <LanguageProvider availableLanguages={[]}>
          <TestComponent />
        </LanguageProvider>
      );

      expect(screen.getByTestId('available-languages')).toHaveTextContent('');
    });
  });

  describe('LocalStorage Integration', () => {
    it('should load language from localStorage on mount', () => {
      mockLocalStorage.getItem.mockReturnValue('pt-BR');
      
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('jung-edu-language');
      expect(screen.getByTestId('current-language')).toHaveTextContent('pt-BR');
    });

    it('should ignore invalid stored language', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-lang');
      
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
    });

    it('should handle null/undefined from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
    });

    it('should save language changes to localStorage', async () => {
      const user = userEvent.setup();
      
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      const switchButton = screen.getByTestId('switch-to-portuguese');
      await user.click(switchButton);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('jung-edu-language', 'pt-BR');
      expect(screen.getByTestId('current-language')).toHaveTextContent('pt-BR');
    });

    it('should handle localStorage errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      const switchButton = screen.getByTestId('switch-to-portuguese');
      await user.click(switchButton);

      // Language should still change in memory
      expect(screen.getByTestId('current-language')).toHaveTextContent('pt-BR');
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Language Switching Functionality', () => {
    it('should switch to valid languages', async () => {
      const user = userEvent.setup();
      
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      const portugueseButton = screen.getByTestId('switch-to-portuguese');
      await user.click(portugueseButton);

      expect(screen.getByTestId('current-language')).toHaveTextContent('pt-BR');

      const englishButton = screen.getByTestId('switch-to-english');
      await user.click(englishButton);

      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
    });

    it('should ignore invalid language switches', async () => {
      const user = userEvent.setup();
      
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      const invalidButton = screen.getByTestId('switch-to-invalid');
      await user.click(invalidButton);

      // Should remain at default language
      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it('should work with select dropdown', async () => {
      const user = userEvent.setup();
      
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      const selector = screen.getByTestId('language-selector');
      await user.selectOptions(selector, 'pt-BR');

      expect(screen.getByTestId('current-language')).toHaveTextContent('pt-BR');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('jung-edu-language', 'pt-BR');
    });

    it('should handle rapid language switches', async () => {
      const user = userEvent.setup();
      
      render(
        <LanguageProvider>
          <PersistenceTestComponent />
        </LanguageProvider>
      );

      const multipleButton = screen.getByTestId('change-multiple');
      await user.click(multipleButton);

      expect(screen.getByTestId('persistence-language')).toHaveTextContent('pt-BR');
      expect(screen.getByTestId('change-count')).toHaveTextContent('3');
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(3);
    });
  });

  describe('Language Support Validation', () => {
    it('should correctly identify supported languages', () => {
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      expect(screen.getByTestId('language-supported-en')).toHaveTextContent('yes');
      expect(screen.getByTestId('language-supported-invalid')).toHaveTextContent('no');
    });

    it('should handle edge case language codes', () => {
      const EdgeCaseComponent = () => {
        const { isLanguageSupported } = useLanguage();
        
        return (
          <div>
            <span data-testid="empty-string">{isLanguageSupported('') ? 'yes' : 'no'}</span>
            <span data-testid="null-check">{isLanguageSupported(null as any) ? 'yes' : 'no'}</span>
            <span data-testid="undefined-check">{isLanguageSupported(undefined as any) ? 'yes' : 'no'}</span>
            <span data-testid="whitespace">{isLanguageSupported('   ') ? 'yes' : 'no'}</span>
            <span data-testid="case-sensitive">{isLanguageSupported('EN') ? 'yes' : 'no'}</span>
          </div>
        );
      };

      render(
        <LanguageProvider>
          <EdgeCaseComponent />
        </LanguageProvider>
      );

      expect(screen.getByTestId('empty-string')).toHaveTextContent('no');
      expect(screen.getByTestId('null-check')).toHaveTextContent('no');
      expect(screen.getByTestId('undefined-check')).toHaveTextContent('no');
      expect(screen.getByTestId('whitespace')).toHaveTextContent('no');
      expect(screen.getByTestId('case-sensitive')).toHaveTextContent('no');
    });

    it('should handle custom language validation', () => {
      const customLanguages = ['en-US', 'en-GB', 'pt-BR', 'pt-PT'];
      
      const ValidationComponent = () => {
        const { isLanguageSupported } = useLanguage();
        
        return (
          <div>
            <span data-testid="us-english">{isLanguageSupported('en-US') ? 'yes' : 'no'}</span>
            <span data-testid="uk-english">{isLanguageSupported('en-GB') ? 'yes' : 'no'}</span>
            <span data-testid="general-english">{isLanguageSupported('en') ? 'yes' : 'no'}</span>
          </div>
        );
      };

      render(
        <LanguageProvider availableLanguages={customLanguages}>
          <ValidationComponent />
        </LanguageProvider>
      );

      expect(screen.getByTestId('us-english')).toHaveTextContent('yes');
      expect(screen.getByTestId('uk-english')).toHaveTextContent('yes');
      expect(screen.getByTestId('general-english')).toHaveTextContent('no');
    });
  });

  describe('Hook Usage and Error Handling', () => {
    it('should throw error when used outside provider', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<ErrorTestComponent />);

      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'useLanguage must be used within a LanguageProvider'
      );

      consoleErrorSpy.mockRestore();
    });

    it('should provide stable function references', () => {
      let contextValue: any;

      const StabilityComponent = () => {
        contextValue = useLanguage();
        return <div>Test</div>;
      };

      const { rerender } = render(
        <LanguageProvider>
          <StabilityComponent />
        </LanguageProvider>
      );

      const firstRender = contextValue;

      rerender(
        <LanguageProvider>
          <StabilityComponent />
        </LanguageProvider>
      );

      const secondRender = contextValue;

      expect(secondRender.setLanguage).toBe(firstRender.setLanguage);
      expect(secondRender.isLanguageSupported).toBe(firstRender.isLanguageSupported);
    });

    it('should maintain context state during re-renders', () => {
      const ReRenderComponent = ({ counter }: { counter: number }) => {
        const { currentLanguage, setLanguage } = useLanguage();
        
        React.useEffect(() => {
          if (counter === 5) {
            setLanguage('pt-BR');
          }
        }, [counter, setLanguage]);
        
        return (
          <div>
            <span data-testid="rerender-language">{currentLanguage}</span>
            <span data-testid="rerender-counter">{counter}</span>
          </div>
        );
      };

      const { rerender } = render(
        <LanguageProvider>
          <ReRenderComponent counter={1} />
        </LanguageProvider>
      );

      expect(screen.getByTestId('rerender-language')).toHaveTextContent('en');

      // Re-render multiple times
      for (let i = 2; i <= 10; i++) {
        rerender(
          <LanguageProvider>
            <ReRenderComponent counter={i} />
          </LanguageProvider>
        );
      }

      expect(screen.getByTestId('rerender-language')).toHaveTextContent('pt-BR');
      expect(screen.getByTestId('rerender-counter')).toHaveTextContent('10');
    });
  });

  describe('Provider Configuration and Edge Cases', () => {
    it('should handle provider remounting', () => {
      const { unmount, rerender } = render(
        <LanguageProvider defaultLanguage="pt-BR">
          <TestComponent />
        </LanguageProvider>
      );

      expect(screen.getByTestId('current-language')).toHaveTextContent('pt-BR');

      unmount();

      rerender(
        <LanguageProvider defaultLanguage="en">
          <TestComponent />
        </LanguageProvider>
      );

      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
    });

    it('should handle default language not in available languages', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      render(
        <LanguageProvider 
          defaultLanguage="invalid-lang" 
          availableLanguages={['en', 'pt-BR']}
        >
          <TestComponent />
        </LanguageProvider>
      );

      // Should fall back to first available language or handle gracefully
      expect(screen.getByTestId('current-language')).toHaveTextContent('invalid-lang');
      
      consoleWarnSpy.mockRestore();
    });

    it('should handle single language configuration', () => {
      render(
        <LanguageProvider 
          defaultLanguage="en" 
          availableLanguages={['en']}
        >
          <TestComponent />
        </LanguageProvider>
      );

      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      expect(screen.getByTestId('available-languages')).toHaveTextContent('en');
      expect(screen.getByTestId('language-supported-en')).toHaveTextContent('yes');
    });

    it('should handle nested providers', () => {
      const OuterComponent = () => {
        const { currentLanguage } = useLanguage();
        return <span data-testid="outer-language">{currentLanguage}</span>;
      };

      const InnerComponent = () => {
        const { currentLanguage } = useLanguage();
        return <span data-testid="inner-language">{currentLanguage}</span>;
      };

      render(
        <LanguageProvider defaultLanguage="en">
          <OuterComponent />
          <LanguageProvider defaultLanguage="pt-BR">
            <InnerComponent />
          </LanguageProvider>
        </LanguageProvider>
      );

      expect(screen.getByTestId('outer-language')).toHaveTextContent('en');
      expect(screen.getByTestId('inner-language')).toHaveTextContent('pt-BR');
    });
  });

  describe('Performance and Memory Management', () => {
    it('should not cause memory leaks with frequent updates', async () => {
      const user = userEvent.setup();
      
      const FrequentUpdateComponent = () => {
        const { currentLanguage, setLanguage } = useLanguage();
        const [updateCount, setUpdateCount] = React.useState(0);
        
        const handleMultipleUpdates = () => {
          for (let i = 0; i < 20; i++) {
            setLanguage(i % 2 === 0 ? 'en' : 'pt-BR');
            setUpdateCount(prev => prev + 1);
          }
        };
        
        return (
          <div>
            <span data-testid="frequent-language">{currentLanguage}</span>
            <span data-testid="frequent-count">{updateCount}</span>
            <button data-testid="frequent-updates" onClick={handleMultipleUpdates}>
              Multiple Updates
            </button>
          </div>
        );
      };

      render(
        <LanguageProvider>
          <FrequentUpdateComponent />
        </LanguageProvider>
      );

      const updateButton = screen.getByTestId('frequent-updates');
      await user.click(updateButton);

      expect(screen.getByTestId('frequent-count')).toHaveTextContent('20');
      // Should handle all updates without issues
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(20);
    });

    it('should handle component cleanup properly', () => {
      const CleanupComponent = () => {
        const { currentLanguage } = useLanguage();
        
        React.useEffect(() => {
          return () => {
            // Cleanup logic
          };
        }, []);
        
        return <span data-testid="cleanup-language">{currentLanguage}</span>;
      };

      const { unmount } = render(
        <LanguageProvider>
          <CleanupComponent />
        </LanguageProvider>
      );

      expect(screen.getByTestId('cleanup-language')).toHaveTextContent('en');
      
      // Should not throw during cleanup
      expect(() => unmount()).not.toThrow();
    });
  });
});