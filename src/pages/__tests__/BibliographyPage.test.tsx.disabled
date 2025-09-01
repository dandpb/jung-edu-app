import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BibliographyPage from '../BibliographyPage';
import { Module } from '../../types';

const mockBibliography = [
  {
    id: 'bib-1',
    title: 'Test Book',
    authors: ['Test Author'],
    year: 2023,
    type: 'book' as const,
    url: 'https://example.com/jung-book'
  }
];

const mockFilms = [
  {
    id: 'film-1',
    title: 'Test Film',
    director: 'Test Director',
    year: 2023,
    relevance: 'Relevant to Jung studies',
    trailer: 'https://example.com/trailer'
  }
];

const mockModules: Module[] = [
  {
    id: 'test-1',
    title: 'Test Module 1',
    description: 'Test description',
    icon: '📚',
    estimatedTime: 30,
    difficulty: 'beginner',
    content: {
      introduction: 'Test intro',
      sections: [],
      bibliography: [
        {
          id: 'bib-1',
          title: 'Test Book',
          authors: ['Test Author'],
          year: 2020,
          type: 'book',
          url: 'https://example.com'
        },
        {
          id: 'bib-2',
          title: 'Test Article',
          authors: ['Another Author'],
          year: 2021,
          type: 'article'
        }
      ],
      films: [
        {
          id: 'film-1',
          title: 'Test Film',
          director: 'Test Director',
          year: 2019,
          relevance: 'Explores Jungian themes',
          trailer: 'https://youtube.com/watch?v=test'
        }
      ]
    }
  }
];

describe('BibliographyPage Component - Enhanced Coverage', () => {
  test('renders page title and description', () => {
    render(<BibliographyPage modules={mockModules} />);
    
    expect(screen.getByText('Recursos e Referências')).toBeInTheDocument();
    expect(screen.getByText(/Explore livros, artigos e filmes/)).toBeInTheDocument();
  });

  test('displays tabs for books and films', () => {
    render(<BibliographyPage modules={mockModules} />);
    
    expect(screen.getByText('Livros e Artigos')).toBeInTheDocument();
    expect(screen.getByText('Filmes')).toBeInTheDocument();
  });

  test('shows count badges for each tab', () => {
    render(<BibliographyPage modules={mockModules} />);
    
    // 2 bibliography items
    expect(screen.getByText('2')).toBeInTheDocument();
    // 1 film
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  test('displays bibliography items by default', () => {
    render(<BibliographyPage modules={mockModules} />);
    
    expect(screen.getByText('Test Book')).toBeInTheDocument();
    expect(screen.getByText('Test Author')).toBeInTheDocument();
    expect(screen.getByText('2020')).toBeInTheDocument();
    
    expect(screen.getByText('Test Article')).toBeInTheDocument();
    expect(screen.getByText('Another Author')).toBeInTheDocument();
    expect(screen.getByText('2021')).toBeInTheDocument();
  });

  test('switches to films tab when clicked', () => {
    render(<BibliographyPage modules={mockModules} />);
    
    const filmsTab = screen.getByText('Filmes');
    fireEvent.click(filmsTab);
    
    expect(screen.getByText('Test Film')).toBeInTheDocument();
    expect(screen.getByText('Test Director')).toBeInTheDocument();
    expect(screen.getByText('2019')).toBeInTheDocument();
    expect(screen.getByText('Explores Jungian themes')).toBeInTheDocument();
  });

  test('displays appropriate icons for different types', () => {
    render(<BibliographyPage modules={mockModules} />);
    
    expect(screen.getByText('📚')).toBeInTheDocument(); // book icon
    expect(screen.getByText('📄')).toBeInTheDocument(); // article icon
  });

  test('shows external link for resources with URLs', () => {
    render(<BibliographyPage modules={mockModules} />);
    
    const viewLink = screen.getByText('Ver Recurso');
    expect(viewLink).toBeInTheDocument();
    expect(viewLink.closest('a')).toHaveAttribute('href', 'https://example.com');
    expect(viewLink.closest('a')).toHaveAttribute('target', '_blank');
  });

  test('shows trailer link for films', () => {
    render(<BibliographyPage modules={mockModules} />);
    
    fireEvent.click(screen.getByText('Filmes'));
    
    const trailerLink = screen.getByText('Assistir Trailer');
    expect(trailerLink).toBeInTheDocument();
    expect(trailerLink.closest('a')).toHaveAttribute('href', 'https://youtube.com/watch?v=test');
  });

  test('sorts items by year (newest first)', () => {
    render(<BibliographyPage modules={mockModules} />);
    
    const years = screen.getAllByText(/202\d/);
    expect(years[0]).toHaveTextContent('2021');
    expect(years[1]).toHaveTextContent('2020');
  });

  test('displays recommended starting points', () => {
    render(<BibliographyPage modules={mockModules} />);
    
    expect(screen.getByText('Pontos de Partida Recomendados')).toBeInTheDocument();
    expect(screen.getByText(/Memórias, Sonhos, Reflexões/)).toBeInTheDocument();
    expect(screen.getByText(/O Homem e Seus Símbolos/)).toBeInTheDocument();
  });

  test('handles empty bibliography gracefully', () => {
    const emptyModules: Module[] = [{
      ...mockModules[0],
      content: {
        ...mockModules[0].content,
        bibliography: [],
        films: []
      }
    }];
    
    render(<BibliographyPage modules={emptyModules} />);
    
    expect(screen.getByText(/Nenhuma.*bibliográfica.*disponível|Nenhum.*recurso.*encontrado/)).toBeInTheDocument();
  });

  test('removes duplicate entries', () => {
    const duplicateModules: Module[] = [
      mockModules[0],
      {
        ...mockModules[0],
        id: 'test-2',
        content: {
          ...mockModules[0].content,
          bibliography: [mockModules[0].content.bibliography![0]] // Same book
        }
      }
    ];
    
    render(<BibliographyPage modules={duplicateModules} />);
    
    // Should only show the book once, not twice
    const bookTitles = screen.getAllByText('Test Book');
    expect(bookTitles).toHaveLength(1);
  });

  test('highlights active tab', () => {
    render(<BibliographyPage modules={mockModules} />);
    
    const booksTab = screen.getByText('Livros e Artigos').closest('button');
    const filmsTab = screen.getByText('Filmes').closest('button');
    
    expect(booksTab).toHaveClass('border-primary-600', 'text-primary-600');
    expect(filmsTab).not.toHaveClass('border-primary-600');
    
    fireEvent.click(filmsTab!);
    
    expect(filmsTab).toHaveClass('border-primary-600', 'text-primary-600');
    expect(booksTab).not.toHaveClass('border-primary-600');
  });

  // Enhanced tests for comprehensive coverage
  describe('Tab Navigation and State Management', () => {
    test('maintains active tab state across interactions', () => {
      render(<BibliographyPage modules={mockModules} />);
      
      const booksTab = screen.getByRole('button', { name: /Livros e Artigos/ });
      const filmsTab = screen.getByRole('button', { name: /Filmes/ });
      
      // Initially books tab should be active
      expect(booksTab).toHaveClass('border-primary-600', 'text-primary-600');
      expect(filmsTab).toHaveClass('border-transparent', 'text-gray-500');
      
      // Switch to films tab
      fireEvent.click(filmsTab);
      
      expect(filmsTab).toHaveClass('border-primary-600', 'text-primary-600');
      expect(booksTab).toHaveClass('border-transparent', 'text-gray-500');
    });

    test('shows correct item counts in tab labels', () => {
      render(<BibliographyPage modules={mockModules} />);
      
      // Check that tab labels show correct counts
      expect(screen.getByText('2')).toBeInTheDocument(); // Bibliography count
      expect(screen.getByText('1')).toBeInTheDocument(); // Films count
    });

    test('updates content when switching tabs', () => {
      render(<BibliographyPage modules={mockModules} />);
      
      // Should initially show books content
      expect(screen.getByText('Test Book')).toBeInTheDocument();
      expect(screen.queryByText('Test Film')).not.toBeInTheDocument();
      
      // Switch to films tab
      const filmsTab = screen.getByRole('button', { name: /Filmes/ });
      fireEvent.click(filmsTab);
      
      // Should now show films content
      expect(screen.getByText('Test Film')).toBeInTheDocument();
      expect(screen.queryByText('Test Book')).not.toBeInTheDocument();
    });
  });

  describe('Data Processing and Deduplication', () => {
    test('removes duplicate bibliography entries', () => {
      const modulesWithDuplicates: Module[] = [
        {
          ...mockModules[0],
          content: {
            bibliography: [
              mockBibliography[0],
              { ...mockBibliography[0], id: 'duplicate-id' }, // Same content, different ID
              mockBibliography[0] // Exact duplicate
            ]
          }
        }
      ];
      
      render(<BibliographyPage modules={modulesWithDuplicates} />);
      
      // Should only show one instance of the book
      const bookTitles = screen.getAllByText('Test Book');
      expect(bookTitles).toHaveLength(1);
    });

    test('handles modules without bibliography or films', () => {
      const emptyModules: Module[] = [
        {
          id: 'empty-module',
          title: 'Empty Module',
          description: 'Module without content',
          estimatedTime: 30,
          difficulty: 'beginner',
          content: {
            introduction: 'Empty content',
            sections: []
          }
        }
      ];
      
      render(<BibliographyPage modules={emptyModules} />);
      
      expect(screen.getByText('Nenhuma entrada bibliográfica disponível ainda.')).toBeInTheDocument();
      
      // Switch to films
      const filmsTab = screen.getByRole('button', { name: /Filmes/ });
      fireEvent.click(filmsTab);
      
      expect(screen.getByText('Nenhuma entrada de filme disponível ainda.')).toBeInTheDocument();
    });
  });

  describe('Bibliography Entry Display', () => {
    test('handles multiple authors correctly', () => {
      const moduleWithMultipleAuthors: Module[] = [
        {
          ...mockModules[0],
          content: {
            bibliography: [{
              id: 'multi-author-book',
              title: 'Multi Author Book',
              authors: ['Author One', 'Author Two', 'Author Three'],
              year: 2023,
              type: 'book'
            }]
          }
        }
      ];
      
      render(<BibliographyPage modules={moduleWithMultipleAuthors} />);
      
      expect(screen.getByText('Author One, Author Two, Author Three')).toBeInTheDocument();
    });

    test('displays appropriate icons for different bibliography types', () => {
      const moduleWithDifferentTypes: Module[] = [
        {
          ...mockModules[0],
          content: {
            bibliography: [
              { id: '1', title: 'Book', authors: ['Author'], year: 2023, type: 'book' },
              { id: '2', title: 'Article', authors: ['Author'], year: 2023, type: 'article' },
              { id: '3', title: 'Journal', authors: ['Author'], year: 2023, type: 'journal' },
              { id: '4', title: 'Other', authors: ['Author'], year: 2023, type: 'online' }
            ]
          }
        }
      ];
      
      render(<BibliographyPage modules={moduleWithDifferentTypes} />);
      
      // Should display different emoji icons for different types
      expect(screen.getByText('📚')).toBeInTheDocument(); // book
      expect(screen.getByText('📄')).toBeInTheDocument(); // article
      expect(screen.getByText('📰')).toBeInTheDocument(); // journal
      expect(screen.getByText('📖')).toBeInTheDocument(); // other/default
    });

    test('handles bibliography entries without URLs', () => {
      const moduleWithoutUrls: Module[] = [
        {
          ...mockModules[0],
          content: {
            bibliography: [{
              id: 'no-url-book',
              title: 'Book Without URL',
              authors: ['Author'],
              year: 2023,
              type: 'book'
              // No URL field
            }]
          }
        }
      ];
      
      render(<BibliographyPage modules={moduleWithoutUrls} />);
      
      expect(screen.getByText('Book Without URL')).toBeInTheDocument();
      expect(screen.queryByText('Ver Recurso')).not.toBeInTheDocument();
    });
  });

  describe('Films Display and Functionality', () => {
    test('displays film emoji icon', () => {
      render(<BibliographyPage modules={mockModules} />);
      
      const filmsTab = screen.getByRole('button', { name: /Filmes/ });
      fireEvent.click(filmsTab);
      
      expect(screen.getByText('🎬')).toBeInTheDocument();
    });

    test('handles films without trailer links', () => {
      const moduleWithoutTrailer: Module[] = [
        {
          ...mockModules[0],
          content: {
            films: [{
              id: 'no-trailer-film',
              title: 'Film Without Trailer',
              director: 'Director',
              year: 2023,
              relevance: 'Relevant'
              // No trailer field
            }]
          }
        }
      ];
      
      render(<BibliographyPage modules={moduleWithoutTrailer} />);
      
      const filmsTab = screen.getByRole('button', { name: /Filmes/ });
      fireEvent.click(filmsTab);
      
      expect(screen.getByText('Film Without Trailer')).toBeInTheDocument();
      expect(screen.queryByText('Assistir Trailer')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('handles empty modules array', () => {
      render(<BibliographyPage modules={[]} />);
      
      expect(screen.getByText('0')).toBeInTheDocument(); // Bibliography count
      expect(screen.getByText('0')).toBeInTheDocument(); // Films count
      expect(screen.getByText('Nenhuma entrada bibliográfica disponível ainda.')).toBeInTheDocument();
    });

    test('handles modules with undefined content', () => {
      const modulesWithUndefinedContent: Module[] = [
        {
          id: 'undefined-content',
          title: 'Module',
          description: 'Description',
          estimatedTime: 30,
          difficulty: 'beginner',
          content: undefined
        }
      ];
      
      expect(() => {
        render(<BibliographyPage modules={modulesWithUndefinedContent} />);
      }).not.toThrow();
    });

    test('handles rapid tab switching without errors', () => {
      render(<BibliographyPage modules={mockModules} />);
      
      const booksTab = screen.getByRole('button', { name: /Livros e Artigos/ });
      const filmsTab = screen.getByRole('button', { name: /Filmes/ });
      
      // Rapidly switch between tabs
      for (let i = 0; i < 10; i++) {
        fireEvent.click(i % 2 === 0 ? filmsTab : booksTab);
      }
      
      // Should not crash and should be in consistent state
      expect(booksTab).toBeInTheDocument();
      expect(filmsTab).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('provides proper ARIA labels for tabs', () => {
      render(<BibliographyPage modules={mockModules} />);
      
      const booksTab = screen.getByRole('button', { name: /Livros e Artigos/ });
      const filmsTab = screen.getByRole('button', { name: /Filmes/ });
      
      expect(booksTab).toBeInTheDocument();
      expect(filmsTab).toBeInTheDocument();
    });

    test('provides proper link accessibility attributes', () => {
      render(<BibliographyPage modules={mockModules} />);
      
      const externalLinks = screen.getAllByText('Ver Recurso');
      expect(externalLinks[0]).toHaveAttribute('target', '_blank');
      expect(externalLinks[0]).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });
});