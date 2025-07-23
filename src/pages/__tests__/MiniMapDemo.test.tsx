import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MiniMapDemo from '../MiniMapDemo';

// Mock the InteractiveMindMap component
jest.mock('../../components/mindmap/InteractiveMindMap', () => ({
  __esModule: true,
  default: ({ modules, showMiniMap, showControls, initialLayout }: any) => (
    <div data-testid="interactive-mindmap">
      <p>Interactive MindMap</p>
      <p>Modules count: {modules.length}</p>
      <p>Show MiniMap: {showMiniMap ? 'true' : 'false'}</p>
      <p>Show Controls: {showControls ? 'true' : 'false'}</p>
      <p>Layout: {initialLayout}</p>
    </div>
  ),
}));

// Mock the modules data
jest.mock('../../data/modules', () => ({
  modules: [
    { id: '1', title: 'Module 1' },
    { id: '2', title: 'Module 2' },
    { id: '3', title: 'Module 3' },
  ],
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {component}
    </BrowserRouter>
  );
};

describe('MiniMapDemo Component', () => {
  test('renders page title', () => {
    renderWithRouter(<MiniMapDemo />);

    expect(screen.getByText('Demonstração de Setores do Minimapa - Educação Jung')).toBeInTheDocument();
  });

  test('renders "What\'s New" section', () => {
    renderWithRouter(<MiniMapDemo />);

    expect(screen.getByText('O Que Há de Novo?')).toBeInTheDocument();
  });

  test('renders all feature descriptions', () => {
    renderWithRouter(<MiniMapDemo />);

    expect(screen.getByText('Setores de Módulos:')).toBeInTheDocument();
    expect(screen.getByText(/O minimapa agora exibe setores visuais/)).toBeInTheDocument();
    
    expect(screen.getByText('Cores por Categoria:')).toBeInTheDocument();
    expect(screen.getByText(/Cada categoria de módulo tem sua própria cor/)).toBeInTheDocument();
    
    expect(screen.getByText('Indicadores de Dificuldade:')).toBeInTheDocument();
    expect(screen.getByText(/Pequenos círculos coloridos mostram o nível/)).toBeInTheDocument();
    
    expect(screen.getByText('Setores Interativos:')).toBeInTheDocument();
    expect(screen.getByText(/Clique em um setor no minimapa para destacar/)).toBeInTheDocument();
    
    expect(screen.getByText('Legenda:')).toBeInTheDocument();
    expect(screen.getByText(/Uma legenda abrangente mostra todas as categorias/)).toBeInTheDocument();
  });

  test('renders InteractiveMindMap with correct props', () => {
    renderWithRouter(<MiniMapDemo />);

    const mindMap = screen.getByTestId('interactive-mindmap');
    expect(mindMap).toBeInTheDocument();
    
    expect(screen.getByText('Show MiniMap: true')).toBeInTheDocument();
    expect(screen.getByText('Show Controls: true')).toBeInTheDocument();
    expect(screen.getByText('Layout: hierarchical')).toBeInTheDocument();
    expect(screen.getByText('Modules count: 3')).toBeInTheDocument();
  });

  test('renders usage instructions section', () => {
    renderWithRouter(<MiniMapDemo />);

    expect(screen.getByText('Como Usar o Minimapa Aprimorado')).toBeInTheDocument();
  });

  test('renders all usage steps', () => {
    renderWithRouter(<MiniMapDemo />);

    expect(screen.getByText('Observe o minimapa no canto inferior esquerdo')).toBeInTheDocument();
    expect(screen.getByText('Note os setores coloridos representando diferentes categorias de módulos')).toBeInTheDocument();
    expect(screen.getByText('Clique em qualquer setor para destacar esses módulos na visão principal')).toBeInTheDocument();
    expect(screen.getByText('Use a legenda para entender as cores das categorias e níveis de dificuldade')).toBeInTheDocument();
    expect(screen.getByText('Navegue pelo mapa mental normalmente - o minimapa atualiza em tempo real')).toBeInTheDocument();
  });

  test('applies correct styling classes to sections', () => {
    renderWithRouter(<MiniMapDemo />);

    // Check for feature section styling
    const featureSection = screen.getByText('O Que Há de Novo?').closest('div');
    expect(featureSection).toHaveClass('bg-white', 'rounded-lg', 'shadow-lg');

    // Check for instructions section styling
    const instructionsSection = screen.getByText('Como Usar o Minimapa Aprimorado').closest('div');
    expect(instructionsSection).toHaveClass('bg-blue-50', 'border', 'border-blue-200');
  });

  test('renders ordered list for usage instructions', () => {
    renderWithRouter(<MiniMapDemo />);

    // Get all lists and find the ordered one
    const lists = screen.getAllByRole('list');
    const orderedList = lists.find(list => list.tagName === 'OL');
    
    expect(orderedList).toBeInTheDocument();
    const listItems = orderedList!.querySelectorAll('li');
    
    // Should have 5 instruction steps
    expect(listItems.length).toBe(5);
  });

  test('sets correct height for mindmap container', () => {
    renderWithRouter(<MiniMapDemo />);

    const mindMapContainer = screen.getByTestId('interactive-mindmap').parentElement;
    expect(mindMapContainer).toHaveStyle({ height: '600px' });
  });

  test('uses proper semantic HTML structure', () => {
    renderWithRouter(<MiniMapDemo />);

    // Check headings hierarchy
    expect(screen.getByRole('heading', { level: 1, name: /Demonstração de Setores do Minimapa/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'O Que Há de Novo?' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Como Usar o Minimapa Aprimorado' })).toBeInTheDocument();
  });

  test('renders with proper container constraints', () => {
    renderWithRouter(<MiniMapDemo />);

    const mainContainer = screen.getByText('Demonstração de Setores do Minimapa - Educação Jung').closest('.max-w-7xl');
    expect(mainContainer).toBeInTheDocument();
    expect(mainContainer).toHaveClass('mx-auto');
  });

  test('all text content is properly formatted', () => {
    renderWithRouter(<MiniMapDemo />);

    // Check for strong/bold text
    const strongElements = screen.getAllByText((content, element) => {
      return element?.tagName === 'STRONG' && content.includes(':');
    });
    
    expect(strongElements.length).toBe(5); // 5 feature titles
  });

  test('page has proper background styling', () => {
    renderWithRouter(<MiniMapDemo />);

    const pageContainer = screen.getByText('Demonstração de Setores do Minimapa - Educação Jung').closest('.min-h-screen');
    expect(pageContainer).toBeInTheDocument();
    expect(pageContainer).toHaveClass('bg-gray-50');
  });
});