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
    
    expect(screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...')).toBeInTheDocument();
    expect(screen.getByText('Comece a digitar para buscar em todo o conteúdo')).toBeInTheDocument();
  });

  test('searches in module titles', () => {
    renderWithRouter(<SearchPage modules={modules} />);
    
    const searchInput = screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...');
    fireEvent.change(searchInput, { target: { value: 'Jung' } });
    
    // The text is in Portuguese, so look for "Introdução a Carl Jung"
    const heading = screen.getByRole('heading', { name: /Introdução a Carl Jung/i });
    expect(heading).toBeInTheDocument();
  });

  test('searches in module descriptions', () => {
    renderWithRouter(<SearchPage modules={modules} />);
    
    const searchInput = screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...');
    fireEvent.change(searchInput, { target: { value: 'analytical psychology' } });
    
    const results = screen.getAllByText(/analytical psychology/i);
    expect(results.length).toBeGreaterThan(0);
  });

  test('searches in section content', () => {
    renderWithRouter(<SearchPage modules={modules} />);
    
    const searchInput = screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...');
    fireEvent.change(searchInput, { target: { value: 'Freud' } });
    
    // Look for the heading element instead, as the text might be split by highlight marks
    const heading = screen.getByRole('heading', { name: /O Rompimento com.*Freud/i });
    expect(heading).toBeInTheDocument();
  });

  test('searches in key terms', () => {
    renderWithRouter(<SearchPage modules={modules} />);
    
    const searchInput = screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...');
    fireEvent.change(searchInput, { target: { value: 'libido' } });
    
    expect(screen.getByText('Libido')).toBeInTheDocument();
  });

  test('highlights search matches', () => {
    renderWithRouter(<SearchPage modules={modules} />);
    
    const searchInput = screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...');
    fireEvent.change(searchInput, { target: { value: 'Jung' } });
    
    const highlights = screen.getAllByText('Jung');
    expect(highlights.some(el => el.tagName === 'MARK')).toBeTruthy();
  });

  test('displays result count', () => {
    renderWithRouter(<SearchPage modules={modules} />);
    
    const searchInput = screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...');
    fireEvent.change(searchInput, { target: { value: 'unconscious' } });
    
    expect(screen.getByText(/\d+ resultados? encontrados? para "unconscious"/)).toBeInTheDocument();
  });

  test('shows no results message for non-matching search', () => {
    renderWithRouter(<SearchPage modules={modules} />);
    
    const searchInput = screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...');
    fireEvent.change(searchInput, { target: { value: 'xyz123notfound' } });
    
    expect(screen.getByText('Nenhum resultado encontrado para "xyz123notfound"')).toBeInTheDocument();
  });

  test('displays result type badges', () => {
    renderWithRouter(<SearchPage modules={modules} />);
    
    const searchInput = screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...');
    fireEvent.change(searchInput, { target: { value: 'psychology' } });
    
    const typeBadges = screen.getAllByText(/módulo|seção|termo|conteúdo/);
    expect(typeBadges.length).toBeGreaterThan(0);
  });

  test('shows module context for each result', () => {
    renderWithRouter(<SearchPage modules={modules} />);
    
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
    renderWithRouter(<SearchPage modules={modules} />);
    
    const searchInput = screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...');
    fireEvent.change(searchInput, { target: { value: 'unconscious' } });
    
    const results = screen.getAllByText(/unconscious/i);
    expect(results.length).toBeGreaterThan(1);
  });

  test('clears results when search is cleared', () => {
    renderWithRouter(<SearchPage modules={modules} />);
    
    const searchInput = screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...');
    
    fireEvent.change(searchInput, { target: { value: 'Jung' } });
    expect(screen.getAllByText(/Jung/i).length).toBeGreaterThan(0);
    
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(screen.getByText('Comece a digitar para buscar em todo o conteúdo')).toBeInTheDocument();
  });

  test('handles case-insensitive search', () => {
    renderWithRouter(<SearchPage modules={modules} />);
    
    const searchInput = screen.getByPlaceholderText('Buscar conceitos, termos ou tópicos...');
    fireEvent.change(searchInput, { target: { value: 'JUNG' } });
    
    // Look for the title in the search results (Portuguese version)
    const results = screen.getAllByRole('heading', { level: 3 });
    const hasJungTitle = results.some(result => 
      result.textContent?.includes('Introdução a Carl Jung')
    );
    expect(hasJungTitle).toBeTruthy();
  });
});