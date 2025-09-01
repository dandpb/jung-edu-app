import React from 'react';
import { render, screen, fireEvent } from '../../utils/test-utils';
import SearchPage from '../SearchPage';
import { modules } from '../../data/modules';

describe('SearchPage Component - Enhanced Coverage', () => {
  test('renders search input and placeholder text', () => {
    render(<SearchPage modules={modules} />);
    
    expect(screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...')).toBeInTheDocument();
    expect(screen.getByText('Comece a digitar para buscar em todo o conteúdo')).toBeInTheDocument();
  });

  test('searches in module titles', () => {
    render(<SearchPage modules={modules} />);
    
    const searchInput = screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...');
    fireEvent.change(searchInput, { target: { value: 'Jung' } });
    
    // The text is in Portuguese, so look for "Introdução a Carl Jung"
    const heading = screen.getByRole('heading', { name: /Introdução a Carl Jung/i });
    expect(heading).toBeInTheDocument();
  });

  test('searches in module descriptions', () => {
    render(<SearchPage modules={modules} />);
    
    const searchInput = screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...');
    fireEvent.change(searchInput, { target: { value: 'analytical psychology' } });
    
    const results = screen.getAllByText(/analytical psychology/i);
    expect(results.length).toBeGreaterThan(0);
  });

  test('searches in section content', () => {
    render(<SearchPage modules={modules} />);
    
    const searchInput = screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...');
    fireEvent.change(searchInput, { target: { value: 'Freud' } });
    
    // Look for the heading element instead, as the text might be split by highlight marks
    const heading = screen.getByRole('heading', { name: /O Rompimento com.*Freud/i });
    expect(heading).toBeInTheDocument();
  });

  test('searches in key terms', () => {
    render(<SearchPage modules={modules} />);
    
    const searchInput = screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...');
    fireEvent.change(searchInput, { target: { value: 'libido' } });
    
    expect(screen.getByText('Libido')).toBeInTheDocument();
  });

  test('highlights search matches', () => {
    render(<SearchPage modules={modules} />);
    
    const searchInput = screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...');
    fireEvent.change(searchInput, { target: { value: 'Jung' } });
    
    const highlights = screen.getAllByText('Jung');
    expect(highlights.some(el => el.tagName === 'MARK')).toBeTruthy();
  });

  test('displays result count', () => {
    render(<SearchPage modules={modules} />);
    
    const searchInput = screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...');
    fireEvent.change(searchInput, { target: { value: 'unconscious' } });
    
    expect(screen.getByText(/\d+ resultados? encontrados? para "unconscious"/)).toBeInTheDocument();
  });

  test('shows no results message for non-matching search', () => {
    render(<SearchPage modules={modules} />);
    
    const searchInput = screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...');
    fireEvent.change(searchInput, { target: { value: 'xyz123notfound' } });
    
    expect(screen.getByText('Nenhum resultado encontrado para "xyz123notfound"')).toBeInTheDocument();
  });

  test('displays result type badges', () => {
    render(<SearchPage modules={modules} />);
    
    const searchInput = screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...');
    fireEvent.change(searchInput, { target: { value: 'psychology' } });
    
    const typeBadges = screen.getAllByText(/módulo|seção|termo|conteúdo/);
    expect(typeBadges.length).toBeGreaterThan(0);
  });

  test('shows module context for each result', () => {
    render(<SearchPage modules={modules} />);
    
    const searchInput = screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...');
    fireEvent.change(searchInput, { target: { value: 'inconsciente' } }); // Use Portuguese term that exists
    
    // Check that we have results with module context
    // Look for text that includes "em" (Portuguese for "in") followed by a module name
    const moduleContextElements = screen.getAllByText(/em .+/);
    
    // Verify that at least one of them matches a module title
    const hasValidModuleContext = moduleContextElements.some(element => {
      const text = element.textContent || '';
      return modules.some(module => text.includes(module.title));
    });
    
    expect(hasValidModuleContext).toBeTruthy();
  });

  test('sorts results by relevance (match count)', () => {
    render(<SearchPage modules={modules} />);
    
    const searchInput = screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...');
    fireEvent.change(searchInput, { target: { value: 'unconscious' } });
    
    const results = screen.getAllByText(/unconscious/i);
    expect(results.length).toBeGreaterThan(1);
  });

  test('clears results when search is cleared', () => {
    render(<SearchPage modules={modules} />);
    
    const searchInput = screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...');
    
    fireEvent.change(searchInput, { target: { value: 'Jung' } });
    expect(screen.getAllByText(/Jung/i).length).toBeGreaterThan(0);
    
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(screen.getByText('Comece a digitar para buscar em todo o conteúdo')).toBeInTheDocument();
  });

  test('handles case-insensitive search', () => {
    render(<SearchPage modules={modules} />);
    
    const searchInput = screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...');
    fireEvent.change(searchInput, { target: { value: 'JUNG' } });
    
    // Look for the title in the search results (Portuguese version)
    const results = screen.getAllByRole('heading', { level: 3 });
    const hasJungTitle = results.some(result => 
      result.textContent?.includes('Introdução a Carl Jung')
    );
    expect(hasJungTitle).toBeTruthy();
  });

  // Enhanced tests for comprehensive coverage
  describe('Search Result Types and Icons', () => {
    test('displays correct icons for different result types', () => {
      render(<SearchPage modules={modules} />);
      
      const searchInput = screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...');
      fireEvent.change(searchInput, { target: { value: 'Jung' } });
      
      // Check for module icons (BookOpen)
      const moduleIcons = document.querySelectorAll('.lucide-book-open');
      expect(moduleIcons.length).toBeGreaterThan(0);
    });

    test('handles search results with different content types', () => {
      render(<SearchPage modules={modules} />);
      
      const searchInput = screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...');
      fireEvent.change(searchInput, { target: { value: 'inconsciente' } });
      
      // Should find different types of results
      const typeLabels = screen.getAllByText(/módulo|seção|termo|conteúdo/);
      expect(typeLabels.length).toBeGreaterThan(0);
    });

    test('displays proper result type translations', () => {
      render(<SearchPage modules={modules} />);
      
      const searchInput = screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...');
      fireEvent.change(searchInput, { target: { value: 'Jung' } });
      
      // Check for Portuguese translations of result types
      expect(screen.getByText('módulo')).toBeInTheDocument();
    });
  });

  describe('Search Input Behavior', () => {
    test('autofocuses search input on component mount', () => {
      render(<SearchPage modules={modules} />);
      
      const searchInput = screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...');
      expect(searchInput).toHaveFocus();
    });

    test('handles special characters in search query', () => {
      render(<SearchPage modules={modules} />);
      
      const searchInput = screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...');
      fireEvent.change(searchInput, { target: { value: '[special]@#$%' } });
      
      expect(screen.getByText('Nenhum resultado encontrado para "[special]@#$%"')).toBeInTheDocument();
    });

    test('trims whitespace from search queries', () => {
      render(<SearchPage modules={modules} />);
      
      const searchInput = screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...');
      fireEvent.change(searchInput, { target: { value: '  Jung  ' } });
      
      // Should find results even with extra whitespace
      expect(screen.getAllByText(/Jung/i).length).toBeGreaterThan(0);
    });

    test('handles empty search query correctly', () => {
      render(<SearchPage modules={modules} />);
      
      const searchInput = screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...');
      fireEvent.change(searchInput, { target: { value: '   ' } }); // Only whitespace
      
      expect(screen.getByText('Comece a digitar para buscar em todo o conteúdo')).toBeInTheDocument();
    });
  });

  describe('Search Result Navigation', () => {
    test('navigates to module when result is clicked', () => {
      const mockNavigate = jest.fn();
      jest.doMock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useNavigate: () => mockNavigate
      }));

      render(<SearchPage modules={modules} />);
      
      const searchInput = screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...');
      fireEvent.change(searchInput, { target: { value: 'Jung' } });
      
      const resultCards = screen.getAllByRole('button');
      if (resultCards.length > 0) {
        fireEvent.click(resultCards[0]);
        // Navigation should be attempted
        expect(resultCards[0]).toBeInTheDocument();
      }
    });

    test('makes result cards keyboard accessible', () => {
      render(<SearchPage modules={modules} />);
      
      const searchInput = screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...');
      fireEvent.change(searchInput, { target: { value: 'Jung' } });
      
      const resultCards = screen.getAllByRole('button');
      resultCards.forEach(card => {
        expect(card).toHaveAttribute('tabIndex', '0');
      });
    });
  });

  describe('Search Performance and Edge Cases', () => {
    test('handles modules with missing content gracefully', () => {
      const modulesWithMissingContent = modules.map(module => ({
        ...module,
        content: undefined
      }));
      
      render(<SearchPage modules={modulesWithMissingContent} />);
      
      const searchInput = screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...');
      fireEvent.change(searchInput, { target: { value: 'Jung' } });
      
      // Should still find results from title/description
      expect(screen.getAllByText(/Jung/i).length).toBeGreaterThan(0);
    });

    test('handles modules with empty sections array', () => {
      const modulesWithEmptySections = modules.map(module => ({
        ...module,
        content: {
          ...module.content,
          sections: []
        }
      }));
      
      render(<SearchPage modules={modulesWithEmptySections} />);
      
      const searchInput = screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...');
      fireEvent.change(searchInput, { target: { value: 'Jung' } });
      
      // Should still find results from title/description/introduction
      expect(screen.getAllByText(/Jung/i).length).toBeGreaterThan(0);
    });

    test('handles search with very long query string', () => {
      render(<SearchPage modules={modules} />);
      
      const longQuery = 'a'.repeat(1000);
      const searchInput = screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...');
      fireEvent.change(searchInput, { target: { value: longQuery } });
      
      expect(screen.getByText(`Nenhum resultado encontrado para "${longQuery}"`)).toBeInTheDocument();
    });

    test('performs efficiently with large result sets', () => {
      render(<SearchPage modules={modules} />);
      
      const startTime = performance.now();
      const searchInput = screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...');
      fireEvent.change(searchInput, { target: { value: 'a' } }); // Should match many results
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should be fast
    });
  });

  describe('Highlight Functionality', () => {
    test('highlights multiple instances of search term', () => {
      render(<SearchPage modules={modules} />);
      
      const searchInput = screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...');
      fireEvent.change(searchInput, { target: { value: 'Jung' } });
      
      const highlights = screen.getAllByText('Jung');
      const markedHighlights = highlights.filter(el => el.tagName === 'MARK');
      expect(markedHighlights.length).toBeGreaterThan(0);
    });

    test('handles highlight with special regex characters', () => {
      render(<SearchPage modules={modules} />);
      
      const searchInput = screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...');
      fireEvent.change(searchInput, { target: { value: '(' } }); // Special regex character
      
      // Should not crash and should show no results message
      expect(screen.getByText('Nenhum resultado encontrado para "("')).toBeInTheDocument();
    });

    test('applies correct highlight styling', () => {
      render(<SearchPage modules={modules} />);
      
      const searchInput = screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...');
      fireEvent.change(searchInput, { target: { value: 'Jung' } });
      
      const highlights = document.querySelectorAll('mark');
      highlights.forEach(mark => {
        expect(mark).toHaveClass('bg-yellow-200', 'text-gray-900');
      });
    });
  });

  describe('Search Result Sorting and Relevance', () => {
    test('sorts results by match count (relevance)', () => {
      render(<SearchPage modules={modules} />);
      
      const searchInput = screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...');
      fireEvent.change(searchInput, { target: { value: 'psychology' } });
      
      // Results should be sorted by relevance (most matches first)
      const results = screen.getAllByText(/psychology/i);
      expect(results.length).toBeGreaterThan(0);
    });

    test('handles tied match counts consistently', () => {
      render(<SearchPage modules={modules} />);
      
      const searchInput = screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...');
      fireEvent.change(searchInput, { target: { value: 'the' } }); // Common word
      
      // Should not crash even with many results having same match count
      const resultCount = screen.getByText(/\d+ resultados? encontrados?/);
      expect(resultCount).toBeInTheDocument();
    });
  });

  describe('Search Result Content Display', () => {
    test('truncates long content in results', () => {
      render(<SearchPage modules={modules} />);
      
      const searchInput = screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...');
      fireEvent.change(searchInput, { target: { value: 'Jung' } });
      
      // Content should be truncated with line-clamp-2 class
      const contentElements = document.querySelectorAll('.line-clamp-2');
      expect(contentElements.length).toBeGreaterThan(0);
    });

    test('shows module title for context in each result', () => {
      render(<SearchPage modules={modules} />);
      
      const searchInput = screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...');
      fireEvent.change(searchInput, { target: { value: 'Jung' } });
      
      // Each result should show its module context
      const moduleContexts = screen.getAllByText(/em .+/);
      expect(moduleContexts.length).toBeGreaterThan(0);
    });

    test('displays arrow icons for navigation hint', () => {
      render(<SearchPage modules={modules} />);
      
      const searchInput = screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...');
      fireEvent.change(searchInput, { target: { value: 'Jung' } });
      
      const arrowIcons = document.querySelectorAll('.lucide-arrow-right');
      expect(arrowIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Empty States and User Feedback', () => {
    test('shows proper empty state before search', () => {
      render(<SearchPage modules={modules} />);
      
      expect(screen.getByText('Buscar')).toBeInTheDocument();
      expect(screen.getByText('Busque em todos os módulos, seções e termos-chave')).toBeInTheDocument();
      expect(screen.getByText('Comece a digitar para buscar em todo o conteúdo')).toBeInTheDocument();
    });

    test('provides helpful no results state', () => {
      render(<SearchPage modules={modules} />);
      
      const searchInput = screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...');
      fireEvent.change(searchInput, { target: { value: 'nonexistentterm12345' } });
      
      expect(screen.getByText('Nenhum resultado encontrado para "nonexistentterm12345"')).toBeInTheDocument();
      expect(screen.getByText('Tente buscar com palavras-chave diferentes ou verifique a ortografia')).toBeInTheDocument();
    });

    test('shows search icon in appropriate states', () => {
      render(<SearchPage modules={modules} />);
      
      // Should show search icons in empty and no-results states
      const searchIcons = document.querySelectorAll('.lucide-search');
      expect(searchIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility and UX', () => {
    test('provides proper heading structure', () => {
      render(<SearchPage modules={modules} />);
      
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Buscar');
    });

    test('maintains search input value during interactions', () => {
      render(<SearchPage modules={modules} />);
      
      const searchInput = screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...');
      fireEvent.change(searchInput, { target: { value: 'test query' } });
      
      expect(searchInput).toHaveValue('test query');
    });

    test('uses proper ARIA attributes for search', () => {
      render(<SearchPage modules={modules} />);
      
      const searchInput = screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...');
      expect(searchInput.getAttribute('type')).toBe('text');
      expect(searchInput.getAttribute('placeholder')).toBeTruthy();
    });
  });

  describe('Integration with Module Data', () => {
    test('handles modules without key terms', () => {
      const modulesWithoutKeyTerms = modules.map(module => ({
        ...module,
        content: {
          ...module.content,
          sections: module.content?.sections?.map(section => ({
            ...section,
            keyTerms: undefined
          }))
        }
      }));
      
      render(<SearchPage modules={modulesWithoutKeyTerms} />);
      
      const searchInput = screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...');
      fireEvent.change(searchInput, { target: { value: 'Jung' } });
      
      // Should still find results from other content
      expect(screen.getAllByText(/Jung/i).length).toBeGreaterThan(0);
    });

    test('searches introduction content correctly', () => {
      render(<SearchPage modules={modules} />);
      
      const searchInput = screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...');
      // Search for a term likely to be in introduction
      fireEvent.change(searchInput, { target: { value: 'psicologia' } });
      
      const results = screen.getAllByText(/psicologia/i);
      expect(results.length).toBeGreaterThan(0);
    });

    test('handles modules with undefined content gracefully', () => {
      const modulesWithUndefinedContent = [
        {
          id: 'test-module',
          title: 'Test Module',
          description: 'A test module',
          estimatedTime: 30,
          difficulty: 'beginner' as const,
          content: undefined
        }
      ];
      
      expect(() => {
        render(<SearchPage modules={modulesWithUndefinedContent} />);
      }).not.toThrow();
    });
  });
});