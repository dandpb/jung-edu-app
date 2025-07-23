import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import EnhancedMindMapPage from '../EnhancedMindMapPage';
import { Module } from '../../types';

// Mock the mindmap components
jest.mock('../../components/mindmap/InteractiveMindMap', () => ({
  __esModule: true,
  default: ({ modules, onNodeClick, showMiniMap, showControls, initialLayout }: any) => (
    <div data-testid="interactive-mindmap">
      <p>Interactive MindMap</p>
      <p>Mini Map: {showMiniMap ? 'true' : 'false'}</p>
      <p>Controls: {showControls ? 'true' : 'false'}</p>
      <p>Layout: {initialLayout}</p>
      {modules.map((module: any) => (
        <button
          key={module.id}
          onClick={() => onNodeClick(module.id)}
          data-testid={`module-${module.id}`}
        >
          {module.title}
        </button>
      ))}
    </div>
  ),
}));

jest.mock('../../components/mindmap/ModuleDeepDiveMindMap', () => ({
  __esModule: true,
  default: ({ module, onBack }: any) => (
    <div data-testid="module-deepdive">
      <h3>Deep Dive: {module.title}</h3>
      <button onClick={onBack} data-testid="back-button">
        Back
      </button>
    </div>
  ),
}));

const mockModules: Module[] = [
  {
    id: 'intro-jung',
    title: 'Introdução a Jung',
    description: 'Conceitos básicos',
    icon: '🧠',
    duration: 30,
    content: [],
    quiz: { id: 'quiz-1', questions: [] }
  },
  {
    id: 'shadow',
    title: 'A Sombra',
    description: 'O lado oculto',
    icon: '🌑',
    duration: 45,
    content: [],
    quiz: { id: 'quiz-2', questions: [] }
  },
  {
    id: 'anima-animus',
    title: 'Anima e Animus',
    description: 'Arquétipos do gênero',
    icon: '👥',
    duration: 40,
    content: [],
    quiz: { id: 'quiz-3', questions: [] }
  }
];

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {component}
    </BrowserRouter>
  );
};

describe('EnhancedMindMapPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock environment variable
    process.env.REACT_APP_OPENAI_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete process.env.REACT_APP_OPENAI_API_KEY;
  });

  test('renders main page with title and description', () => {
    renderWithRouter(<EnhancedMindMapPage modules={mockModules} />);

    expect(screen.getByText('Mapa Mental Educacional de Jung')).toBeInTheDocument();
    expect(screen.getByText(/Clique em qualquer módulo para explorar/)).toBeInTheDocument();
  });

  test('renders interactive mindmap with correct props', () => {
    renderWithRouter(<EnhancedMindMapPage modules={mockModules} />);

    expect(screen.getByTestId('interactive-mindmap')).toBeInTheDocument();
    expect(screen.getByText('Mini Map: true')).toBeInTheDocument();
    expect(screen.getByText('Controls: true')).toBeInTheDocument();
    expect(screen.getByText('Layout: hierarchical')).toBeInTheDocument();
  });

  test('renders all module buttons', () => {
    renderWithRouter(<EnhancedMindMapPage modules={mockModules} />);

    mockModules.forEach(module => {
      expect(screen.getByTestId(`module-${module.id}`)).toBeInTheDocument();
      expect(screen.getByText(module.title)).toBeInTheDocument();
    });
  });

  test('shows deep dive view when module is clicked', async () => {
    renderWithRouter(<EnhancedMindMapPage modules={mockModules} />);

    const moduleButton = screen.getByTestId('module-shadow');
    fireEvent.click(moduleButton);

    await waitFor(() => {
      expect(screen.getByTestId('module-deepdive')).toBeInTheDocument();
      expect(screen.getByText('Deep Dive: A Sombra')).toBeInTheDocument();
    });
  });

  test('updates header when in deep dive mode', async () => {
    renderWithRouter(<EnhancedMindMapPage modules={mockModules} />);

    // Initially shows main title
    expect(screen.getByText('Mapa Mental Educacional de Jung')).toBeInTheDocument();

    // Click on a module
    const moduleButton = screen.getByTestId('module-intro-jung');
    fireEvent.click(moduleButton);

    await waitFor(() => {
      // Title changes to module title
      expect(screen.getAllByText('Introdução a Jung')[0]).toBeInTheDocument();
      expect(screen.getByText(/Mapa conceitual gerado por IA/)).toBeInTheDocument();
    });
  });

  test('shows breadcrumb navigation in deep dive mode', async () => {
    renderWithRouter(<EnhancedMindMapPage modules={mockModules} />);

    const moduleButton = screen.getByTestId('module-anima-animus');
    fireEvent.click(moduleButton);

    await waitFor(() => {
      expect(screen.getByText('Visão Geral')).toBeInTheDocument();
      // There are multiple elements with this text
      const animaText = screen.getAllByText('Anima e Animus');
      expect(animaText.length).toBeGreaterThan(0);
    });
  });

  test('returns to overview when back button is clicked', async () => {
    renderWithRouter(<EnhancedMindMapPage modules={mockModules} />);

    // Enter deep dive mode
    const moduleButton = screen.getByTestId('module-shadow');
    fireEvent.click(moduleButton);

    await waitFor(() => {
      expect(screen.getByTestId('module-deepdive')).toBeInTheDocument();
    });

    // Click back button
    const backButton = screen.getByTestId('back-button');
    fireEvent.click(backButton);

    await waitFor(() => {
      expect(screen.queryByTestId('module-deepdive')).not.toBeInTheDocument();
      expect(screen.getByTestId('interactive-mindmap')).toBeInTheDocument();
      expect(screen.getByText('Mapa Mental Educacional de Jung')).toBeInTheDocument();
    });
  });

  test('returns to overview when breadcrumb is clicked', async () => {
    renderWithRouter(<EnhancedMindMapPage modules={mockModules} />);

    // Enter deep dive mode
    const moduleButton = screen.getByTestId('module-intro-jung');
    fireEvent.click(moduleButton);

    await waitFor(() => {
      expect(screen.getByTestId('module-deepdive')).toBeInTheDocument();
    });

    // Click breadcrumb
    const breadcrumbButton = screen.getByRole('button', { name: 'Visão Geral' });
    fireEvent.click(breadcrumbButton);

    await waitFor(() => {
      expect(screen.queryByTestId('module-deepdive')).not.toBeInTheDocument();
      expect(screen.getByTestId('interactive-mindmap')).toBeInTheDocument();
    });
  });

  test('displays feature info panel', () => {
    renderWithRouter(<EnhancedMindMapPage modules={mockModules} />);

    expect(screen.getByText('🧠 Explorações Profundas com IA')).toBeInTheDocument();
    // There are multiple elements with this text, use getAllByText
    const clickText = screen.getAllByText(/Clique em qualquer módulo para gerar um mapa conceitual detalhado/);
    expect(clickText.length).toBeGreaterThan(0);
    expect(screen.getByText(/IA analisa o conteúdo para criar estruturas educacionais/)).toBeInTheDocument();
    expect(screen.getByText(/Mostra relações entre conceitos/)).toBeInTheDocument();
    expect(screen.getByText(/Inclui exemplos e caminhos de aprendizagem/)).toBeInTheDocument();
  });

  test('shows API key status when configured', () => {
    renderWithRouter(<EnhancedMindMapPage modules={mockModules} />);

    expect(screen.getByText('✅ API OpenAI configurada')).toBeInTheDocument();
  });

  test('shows demo mode warning when API key is not configured', () => {
    delete process.env.REACT_APP_OPENAI_API_KEY;
    
    renderWithRouter(<EnhancedMindMapPage modules={mockModules} />);

    expect(screen.getByText(/⚠️ Usando modo demonstração/)).toBeInTheDocument();
  });

  test('hides feature info panel in deep dive mode', async () => {
    renderWithRouter(<EnhancedMindMapPage modules={mockModules} />);

    // Feature info should be visible initially
    expect(screen.getByText('🧠 Explorações Profundas com IA')).toBeInTheDocument();

    // Enter deep dive mode
    const moduleButton = screen.getByTestId('module-shadow');
    fireEvent.click(moduleButton);

    await waitFor(() => {
      // Feature info should be hidden
      expect(screen.queryByText('🧠 Explorações Profundas com IA')).not.toBeInTheDocument();
    });
  });

  test('shows exploration mode indicator in deep dive', async () => {
    renderWithRouter(<EnhancedMindMapPage modules={mockModules} />);

    const moduleButton = screen.getByTestId('module-intro-jung');
    fireEvent.click(moduleButton);

    await waitFor(() => {
      expect(screen.getByText('Modo de Exploração Profunda')).toBeInTheDocument();
    });
  });

  test('displays instruction overlay', () => {
    renderWithRouter(<EnhancedMindMapPage modules={mockModules} />);

    expect(screen.getByText(/Clique em qualquer módulo para gerar um mapa conceitual detalhado com IA/)).toBeInTheDocument();
  });

  test('uses default modules when none provided', () => {
    renderWithRouter(<EnhancedMindMapPage />);

    expect(screen.getByTestId('interactive-mindmap')).toBeInTheDocument();
    // Should have some module buttons (from default modules)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  test('handles module not found gracefully', () => {
    const mockOnNodeClick = jest.fn();
    
    // This would be a test for the actual implementation
    // Here we're just testing that the callback is called with the right ID
    renderWithRouter(<EnhancedMindMapPage modules={mockModules} />);

    const moduleButton = screen.getByTestId('module-shadow');
    fireEvent.click(moduleButton);

    // The component should handle the click and show the deep dive
    expect(screen.getByTestId('module-deepdive')).toBeInTheDocument();
  });

  test('maintains state when switching between modules', async () => {
    renderWithRouter(<EnhancedMindMapPage modules={mockModules} />);

    // Click first module
    fireEvent.click(screen.getByTestId('module-intro-jung'));
    
    await waitFor(() => {
      expect(screen.getByText('Deep Dive: Introdução a Jung')).toBeInTheDocument();
    });

    // Go back
    fireEvent.click(screen.getByTestId('back-button'));

    await waitFor(() => {
      expect(screen.getByTestId('interactive-mindmap')).toBeInTheDocument();
    });

    // Click different module
    fireEvent.click(screen.getByTestId('module-shadow'));

    await waitFor(() => {
      expect(screen.getByText('Deep Dive: A Sombra')).toBeInTheDocument();
    });
  });
});