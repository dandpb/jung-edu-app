/**
 * Unit tests for LanguageContext
 * Tests the LanguageProvider component and useLanguage hook functionality
 */

import React, { ReactNode } from 'react';
import { render, screen, act, renderHook } from '@testing-library/react';
import { LanguageProvider, useLanguage, LanguageContextType } from '../LanguageContext';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock console.error to test error handling
let mockConsoleError: jest.SpyInstance;

describe('LanguageContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    mockConsoleError.mockRestore();
  });

  describe('useLanguage hook', () => {
    it('should throw error when used outside LanguageProvider', () => {
      // Suppress React error boundary console errors for this test
      const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        renderHook(() => useLanguage());
      }).toThrow('useLanguage must be used within a LanguageProvider');
      
      mockConsoleError.mockRestore();
    });

    it('should return context value when used within LanguageProvider', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <LanguageProvider>{children}</LanguageProvider>
      );

      const { result } = renderHook(() => useLanguage(), { wrapper });

      expect(result.current).toEqual(
        expect.objectContaining({
          currentLanguage: 'en',
          availableLanguages: ['en', 'pt-BR'],
          setLanguage: expect.any(Function),
          isLanguageSupported: expect.any(Function),
        })
      );
    });
  });

  describe('LanguageProvider', () => {
    it('should render children correctly', () => {
      render(
        <LanguageProvider>
          <div data-testid="test-child">Test Child</div>
        </LanguageProvider>
      );

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });

    it('should use default language when no localStorage value exists', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const TestComponent = () => {
        const { currentLanguage } = useLanguage();
        return <div data-testid="current-language">{currentLanguage}</div>;
      };

      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('jung-edu-language');
    });

    it('should use custom default language when provided', () => {
      const TestComponent = () => {
        const { currentLanguage } = useLanguage();
        return <div data-testid="current-language">{currentLanguage}</div>;
      };

      render(
        <LanguageProvider defaultLanguage="pt-BR">
          <TestComponent />
        </LanguageProvider>
      );

      expect(screen.getByTestId('current-language')).toHaveTextContent('pt-BR');
    });

    it('should use custom available languages when provided', () => {
      const TestComponent = () => {
        const { availableLanguages } = useLanguage();
        return <div data-testid="available-languages">{availableLanguages.join(',')}</div>;
      };

      render(
        <LanguageProvider availableLanguages={['en', 'es', 'fr']}>
          <TestComponent />
        </LanguageProvider>
      );

      expect(screen.getByTestId('available-languages')).toHaveTextContent('en,es,fr');
    });

    it('should load language from localStorage when valid', () => {
      localStorageMock.getItem.mockReturnValue('pt-BR');

      const TestComponent = () => {
        const { currentLanguage } = useLanguage();
        return <div data-testid="current-language">{currentLanguage}</div>;
      };

      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      expect(screen.getByTestId('current-language')).toHaveTextContent('pt-BR');
    });

    it('should ignore invalid language from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('invalid-language');

      const TestComponent = () => {
        const { currentLanguage } = useLanguage();
        return <div data-testid="current-language">{currentLanguage}</div>;
      };

      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
    });

    it('should handle localStorage getItem error gracefully', async () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const TestComponent = () => {
        const { currentLanguage } = useLanguage();
        return <div data-testid="current-language">{currentLanguage}</div>;
      };

      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      
      // Wait for useEffect to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Failed to load language preference from localStorage:',
        expect.any(Error)
      );
    });
  });

  describe('setLanguage functionality', () => {
    it('should update current language when valid language is provided', () => {
      const TestComponent = () => {
        const { currentLanguage, setLanguage } = useLanguage();
        return (
          <div>
            <div data-testid="current-language">{currentLanguage}</div>
            <button onClick={() => setLanguage('pt-BR')} data-testid="change-language">
              Change Language
            </button>
          </div>
        );
      };

      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      expect(screen.getByTestId('current-language')).toHaveTextContent('en');

      act(() => {
        screen.getByTestId('change-language').click();
      });

      expect(screen.getByTestId('current-language')).toHaveTextContent('pt-BR');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('jung-edu-language', 'pt-BR');
    });

    it('should not update language when invalid language is provided', () => {
      const TestComponent = () => {
        const { currentLanguage, setLanguage } = useLanguage();
        return (
          <div>
            <div data-testid="current-language">{currentLanguage}</div>
            <button onClick={() => setLanguage('invalid-lang')} data-testid="change-language">
              Change Language
            </button>
          </div>
        );
      };

      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      expect(screen.getByTestId('current-language')).toHaveTextContent('en');

      act(() => {
        screen.getByTestId('change-language').click();
      });

      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should handle localStorage setItem error gracefully', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage setItem error');
      });

      const TestComponent = () => {
        const { currentLanguage, setLanguage } = useLanguage();
        return (
          <div>
            <div data-testid="current-language">{currentLanguage}</div>
            <button onClick={() => setLanguage('pt-BR')} data-testid="change-language">
              Change Language
            </button>
          </div>
        );
      };

      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      await act(async () => {
        screen.getByTestId('change-language').click();
      });

      // Language should still be updated in memory even if localStorage fails
      expect(screen.getByTestId('current-language')).toHaveTextContent('pt-BR');
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Failed to save language preference to localStorage:',
        expect.any(Error)
      );
    });
  });

  describe('isLanguageSupported functionality', () => {
    it('should return true for supported languages', () => {
      const TestComponent = () => {
        const { isLanguageSupported } = useLanguage();
        return (
          <div>
            <div data-testid="en-supported">{isLanguageSupported('en').toString()}</div>
            <div data-testid="pt-supported">{isLanguageSupported('pt-BR').toString()}</div>
          </div>
        );
      };

      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      expect(screen.getByTestId('en-supported')).toHaveTextContent('true');
      expect(screen.getByTestId('pt-supported')).toHaveTextContent('true');
    });

    it('should return false for unsupported languages', () => {
      const TestComponent = () => {
        const { isLanguageSupported } = useLanguage();
        return (
          <div>
            <div data-testid="es-supported">{isLanguageSupported('es').toString()}</div>
            <div data-testid="fr-supported">{isLanguageSupported('fr').toString()}</div>
          </div>
        );
      };

      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      expect(screen.getByTestId('es-supported')).toHaveTextContent('false');
      expect(screen.getByTestId('fr-supported')).toHaveTextContent('false');
    });

    it('should work with custom available languages', () => {
      const TestComponent = () => {
        const { isLanguageSupported } = useLanguage();
        return (
          <div>
            <div data-testid="es-supported">{isLanguageSupported('es').toString()}</div>
            <div data-testid="fr-supported">{isLanguageSupported('fr').toString()}</div>
            <div data-testid="pt-supported">{isLanguageSupported('pt-BR').toString()}</div>
          </div>
        );
      };

      render(
        <LanguageProvider availableLanguages={['en', 'es', 'fr']}>
          <TestComponent />
        </LanguageProvider>
      );

      expect(screen.getByTestId('es-supported')).toHaveTextContent('true');
      expect(screen.getByTestId('fr-supported')).toHaveTextContent('true');
      expect(screen.getByTestId('pt-supported')).toHaveTextContent('false');
    });
  });

  describe('context value memoization', () => {
    it('should provide consistent context value object when no state changes', () => {
      const TestComponent = () => {
        const context = useLanguage();
        return (
          <div>
            <div data-testid="current-language">{context.currentLanguage}</div>
            <div data-testid="available-count">{context.availableLanguages.length}</div>
            <div data-testid="has-methods">
              {typeof context.setLanguage === 'function' && typeof context.isLanguageSupported === 'function' ? 'true' : 'false'}
            </div>
          </div>
        );
      };

      const { rerender } = render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      expect(screen.getByTestId('available-count')).toHaveTextContent('2');
      expect(screen.getByTestId('has-methods')).toHaveTextContent('true');

      // Re-render with same props should maintain the same values
      rerender(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      expect(screen.getByTestId('available-count')).toHaveTextContent('2');
      expect(screen.getByTestId('has-methods')).toHaveTextContent('true');
    });
  });

  describe('integration with localStorage', () => {
    it('should persist language changes across provider remounts', () => {
      localStorageMock.getItem.mockReturnValue('pt-BR');

      const TestComponent = () => {
        const { currentLanguage } = useLanguage();
        return <div data-testid="current-language">{currentLanguage}</div>;
      };

      const { unmount } = render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      expect(screen.getByTestId('current-language')).toHaveTextContent('pt-BR');

      unmount();

      // Re-mount and verify it loads from localStorage
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      expect(screen.getByTestId('current-language')).toHaveTextContent('pt-BR');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('jung-edu-language');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string language gracefully', () => {
      const TestComponent = () => {
        const { currentLanguage, setLanguage } = useLanguage();
        return (
          <div>
            <div data-testid="current-language">{currentLanguage}</div>
            <button onClick={() => setLanguage('')} data-testid="set-empty">
              Set Empty
            </button>
          </div>
        );
      };

      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      act(() => {
        screen.getByTestId('set-empty').click();
      });

      // Should not change language for empty string
      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
    });

    it('should handle null/undefined languages gracefully', () => {
      const TestComponent = () => {
        const { isLanguageSupported } = useLanguage();
        return (
          <div>
            <div data-testid="null-supported">
              {isLanguageSupported(null as any).toString()}
            </div>
            <div data-testid="undefined-supported">
              {isLanguageSupported(undefined as any).toString()}
            </div>
          </div>
        );
      };

      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      expect(screen.getByTestId('null-supported')).toHaveTextContent('false');
      expect(screen.getByTestId('undefined-supported')).toHaveTextContent('false');
    });
  });

  describe('context type completeness', () => {
    it('should provide all expected context properties', () => {
      const TestComponent = () => {
        const context = useLanguage();
        const hasAllProperties = 
          'currentLanguage' in context &&
          'availableLanguages' in context &&
          'setLanguage' in context &&
          'isLanguageSupported' in context;
        
        return <div data-testid="has-all-props">{hasAllProperties.toString()}</div>;
      };

      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      expect(screen.getByTestId('has-all-props')).toHaveTextContent('true');
    });

    it('should have correct types for context properties', () => {
      const TestComponent = () => {
        const { currentLanguage, availableLanguages, setLanguage, isLanguageSupported } = useLanguage();
        
        const typesAreCorrect = 
          typeof currentLanguage === 'string' &&
          Array.isArray(availableLanguages) &&
          typeof setLanguage === 'function' &&
          typeof isLanguageSupported === 'function';
        
        return <div data-testid="types-correct">{typesAreCorrect.toString()}</div>;
      };

      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      expect(screen.getByTestId('types-correct')).toHaveTextContent('true');
    });
  });
});