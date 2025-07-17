import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BibliographyPage from '../BibliographyPage';
import { Module } from '../../types';

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
          author: 'Test Author',
          year: 2020,
          type: 'book',
          url: 'https://example.com'
        },
        {
          id: 'bib-2',
          title: 'Test Article',
          author: 'Another Author',
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

describe('BibliographyPage Component', () => {
  test('renders page title and description', () => {
    render(<BibliographyPage modules={mockModules} />);
    
    expect(screen.getByText('Resources & References')).toBeInTheDocument();
    expect(screen.getByText(/Explore books, articles, and films/)).toBeInTheDocument();
  });

  test('displays tabs for books and films', () => {
    render(<BibliographyPage modules={mockModules} />);
    
    expect(screen.getByText('Books & Articles')).toBeInTheDocument();
    expect(screen.getByText('Films')).toBeInTheDocument();
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
    
    const filmsTab = screen.getByText('Films');
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
    
    const viewLink = screen.getByText('View Resource');
    expect(viewLink).toBeInTheDocument();
    expect(viewLink.closest('a')).toHaveAttribute('href', 'https://example.com');
    expect(viewLink.closest('a')).toHaveAttribute('target', '_blank');
  });

  test('shows trailer link for films', () => {
    render(<BibliographyPage modules={mockModules} />);
    
    fireEvent.click(screen.getByText('Films'));
    
    const trailerLink = screen.getByText('Watch Trailer');
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
    
    expect(screen.getByText('Recommended Starting Points')).toBeInTheDocument();
    expect(screen.getByText(/Memories, Dreams, Reflections/)).toBeInTheDocument();
    expect(screen.getByText(/Man and His Symbols/)).toBeInTheDocument();
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
    
    expect(screen.getByText('No bibliography entries available yet.')).toBeInTheDocument();
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
    
    const booksTab = screen.getByText('Books & Articles').closest('button');
    const filmsTab = screen.getByText('Films').closest('button');
    
    expect(booksTab).toHaveClass('border-primary-600', 'text-primary-600');
    expect(filmsTab).not.toHaveClass('border-primary-600');
    
    fireEvent.click(filmsTab!);
    
    expect(filmsTab).toHaveClass('border-primary-600', 'text-primary-600');
    expect(booksTab).not.toHaveClass('border-primary-600');
  });
});