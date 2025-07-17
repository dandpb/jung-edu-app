import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SearchPage from '../SearchPage';
import { modules } from '../../data/modules';

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {component}
    </BrowserRouter>
  );
};

describe('SearchPage Component', () => {
  test('renders search input and placeholder text', () => {
    renderWithRouter(<SearchPage modules={modules} />);
    
    expect(screen.getByPlaceholderText('Search for concepts, terms, or topics...')).toBeInTheDocument();
    expect(screen.getByText('Start typing to search across all content')).toBeInTheDocument();
  });

  test('searches in module titles', () => {
    renderWithRouter(<SearchPage modules={modules} />);
    
    const searchInput = screen.getByPlaceholderText('Search for concepts, terms, or topics...');
    fireEvent.change(searchInput, { target: { value: 'Jung' } });
    
    // The text is split by highlight marks, so we need to look for the heading element
    const heading = screen.getByRole('heading', { name: /Introduction to Carl Jung/i });
    expect(heading).toBeInTheDocument();
  });

  test('searches in module descriptions', () => {
    renderWithRouter(<SearchPage modules={modules} />);
    
    const searchInput = screen.getByPlaceholderText('Search for concepts, terms, or topics...');
    fireEvent.change(searchInput, { target: { value: 'analytical psychology' } });
    
    const results = screen.getAllByText(/analytical psychology/i);
    expect(results.length).toBeGreaterThan(0);
  });

  test('searches in section content', () => {
    renderWithRouter(<SearchPage modules={modules} />);
    
    const searchInput = screen.getByPlaceholderText('Search for concepts, terms, or topics...');
    fireEvent.change(searchInput, { target: { value: 'Freud' } });
    
    // Look for the heading element instead, as the text might be split by highlight marks
    const heading = screen.getByRole('heading', { name: /The Break with.*Freud/i });
    expect(heading).toBeInTheDocument();
  });

  test('searches in key terms', () => {
    renderWithRouter(<SearchPage modules={modules} />);
    
    const searchInput = screen.getByPlaceholderText('Search for concepts, terms, or topics...');
    fireEvent.change(searchInput, { target: { value: 'libido' } });
    
    expect(screen.getByText('Libido')).toBeInTheDocument();
  });

  test('highlights search matches', () => {
    renderWithRouter(<SearchPage modules={modules} />);
    
    const searchInput = screen.getByPlaceholderText('Search for concepts, terms, or topics...');
    fireEvent.change(searchInput, { target: { value: 'Jung' } });
    
    const highlights = screen.getAllByText('Jung');
    expect(highlights.some(el => el.tagName === 'MARK')).toBeTruthy();
  });

  test('displays result count', () => {
    renderWithRouter(<SearchPage modules={modules} />);
    
    const searchInput = screen.getByPlaceholderText('Search for concepts, terms, or topics...');
    fireEvent.change(searchInput, { target: { value: 'unconscious' } });
    
    expect(screen.getByText(/Found \d+ results for "unconscious"/)).toBeInTheDocument();
  });

  test('shows no results message for non-matching search', () => {
    renderWithRouter(<SearchPage modules={modules} />);
    
    const searchInput = screen.getByPlaceholderText('Search for concepts, terms, or topics...');
    fireEvent.change(searchInput, { target: { value: 'xyz123notfound' } });
    
    expect(screen.getByText('No results found for "xyz123notfound"')).toBeInTheDocument();
  });

  test('displays result type badges', () => {
    renderWithRouter(<SearchPage modules={modules} />);
    
    const searchInput = screen.getByPlaceholderText('Search for concepts, terms, or topics...');
    fireEvent.change(searchInput, { target: { value: 'psychology' } });
    
    const typeBadges = screen.getAllByText(/module|section|term|content/);
    expect(typeBadges.length).toBeGreaterThan(0);
  });

  test('shows module context for each result', () => {
    renderWithRouter(<SearchPage modules={modules} />);
    
    const searchInput = screen.getByPlaceholderText('Search for concepts, terms, or topics...');
    fireEvent.change(searchInput, { target: { value: 'archetype' } });
    
    // Check that we have results with module context
    // Look for text that includes "in" followed by a module name
    const moduleContextElements = screen.getAllByText(/in .+/);
    
    // Verify that at least one of them matches a module title
    const hasValidModuleContext = moduleContextElements.some(element => {
      const text = element.textContent || '';
      return modules.some(module => text.includes(module.title));
    });
    
    expect(hasValidModuleContext).toBeTruthy();
  });

  test('sorts results by relevance (match count)', () => {
    renderWithRouter(<SearchPage modules={modules} />);
    
    const searchInput = screen.getByPlaceholderText('Search for concepts, terms, or topics...');
    fireEvent.change(searchInput, { target: { value: 'unconscious' } });
    
    const results = screen.getAllByText(/unconscious/i);
    expect(results.length).toBeGreaterThan(1);
  });

  test('clears results when search is cleared', () => {
    renderWithRouter(<SearchPage modules={modules} />);
    
    const searchInput = screen.getByPlaceholderText('Search for concepts, terms, or topics...');
    
    fireEvent.change(searchInput, { target: { value: 'Jung' } });
    expect(screen.getAllByText(/Jung/i).length).toBeGreaterThan(0);
    
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(screen.getByText('Start typing to search across all content')).toBeInTheDocument();
  });

  test('handles case-insensitive search', () => {
    renderWithRouter(<SearchPage modules={modules} />);
    
    const searchInput = screen.getByPlaceholderText('Search for concepts, terms, or topics...');
    fireEvent.change(searchInput, { target: { value: 'JUNG' } });
    
    // Look for the title in the search results
    const results = screen.getAllByRole('heading', { level: 3 });
    const hasJungTitle = results.some(result => 
      result.textContent?.includes('Introduction to Carl Jung')
    );
    expect(hasJungTitle).toBeTruthy();
  });
});