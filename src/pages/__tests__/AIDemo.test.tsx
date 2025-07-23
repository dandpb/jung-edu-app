import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AIDemo from '../AIDemo';

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {component}
    </BrowserRouter>
  );
};

describe('AIDemo Component', () => {
  test('renders page title and main heading', () => {
    renderWithRouter(<AIDemo />);

    expect(screen.getByText('Mapas Mentais com IA')).toBeInTheDocument();
    expect(screen.getByText(/Experimente o futuro do conteúdo educacional/)).toBeInTheDocument();
  });

  test('renders how it works section', () => {
    renderWithRouter(<AIDemo />);

    expect(screen.getByText('Como Funciona')).toBeInTheDocument();
    expect(screen.getByText('Clique em Qualquer Módulo')).toBeInTheDocument();
    expect(screen.getByText('IA Analisa o Conteúdo')).toBeInTheDocument();
    expect(screen.getByText('Explore o Mapa Interativo')).toBeInTheDocument();
  });

  test('renders all steps with descriptions', () => {
    renderWithRouter(<AIDemo />);

    expect(screen.getByText(/Navegue até o Mapa Mental IA/)).toBeInTheDocument();
    expect(screen.getByText(/Nossa IA extrai conceitos-chave/)).toBeInTheDocument();
    expect(screen.getByText(/Navegue pelos conceitos, veja exemplos/)).toBeInTheDocument();
  });

  test('renders features list', () => {
    renderWithRouter(<AIDemo />);

    expect(screen.getByText('Recursos')).toBeInTheDocument();
    expect(screen.getByText('Extração automática de conceitos')).toBeInTheDocument();
    expect(screen.getByText('Organização hierárquica')).toBeInTheDocument();
    expect(screen.getByText('Mapeamento visual de relacionamentos')).toBeInTheDocument();
    expect(screen.getByText('Exemplos interativos')).toBeInTheDocument();
    expect(screen.getByText('Caminhos de aprendizagem sugeridos')).toBeInTheDocument();
    expect(screen.getByText('Geração em tempo real')).toBeInTheDocument();
  });

  test('renders CTA button with correct link', () => {
    renderWithRouter(<AIDemo />);

    const ctaButton = screen.getByRole('link', { name: /Experimente Mapas Mentais com IA/i });
    expect(ctaButton).toBeInTheDocument();
    expect(ctaButton).toHaveAttribute('href', '/enhanced-mindmap');
  });

  test('renders alternative demo link', () => {
    renderWithRouter(<AIDemo />);

    const altLink = screen.getByRole('link', { name: /demonstração de setores do minimapa/i });
    expect(altLink).toBeInTheDocument();
    expect(altLink).toHaveAttribute('href', '/minimap-demo');
  });

  test('renders configuration options section', () => {
    renderWithRouter(<AIDemo />);

    expect(screen.getByText('Opções de Configuração')).toBeInTheDocument();
    expect(screen.getByText('🤖 Modo IA Completo (Recomendado)')).toBeInTheDocument();
    expect(screen.getByText('📝 Modo Demonstração')).toBeInTheDocument();
  });

  test('displays API configuration instructions', () => {
    renderWithRouter(<AIDemo />);

    expect(screen.getByText(/Obtenha a experiência completa de IA/)).toBeInTheDocument();
    // Check for the configuration block containing API key info
    const configBlock = screen.getByText(/REACT_APP_OPENAI_API_KEY=your-key/);
    expect(configBlock).toBeInTheDocument();
    expect(configBlock.textContent).toContain('REACT_APP_OPENAI_MODEL=gpt-4');
  });

  test('displays demo mode information', () => {
    renderWithRouter(<AIDemo />);

    expect(screen.getByText(/Experimente o recurso com conteúdo pré-estruturado/)).toBeInTheDocument();
    expect(screen.getByText('Pronto para usar! Nenhuma configuração necessária.')).toBeInTheDocument();
  });

  test('renders all feature icons', () => {
    renderWithRouter(<AIDemo />);

    // Check for each Sparkles icon individually
    expect(screen.getByTestId('lucide-sparkles-1')).toBeInTheDocument();
    expect(screen.getByTestId('lucide-sparkles-2')).toBeInTheDocument();
    expect(screen.getByTestId('lucide-sparkles-3')).toBeInTheDocument();
    expect(screen.getByTestId('lucide-sparkles-4')).toBeInTheDocument();
    expect(screen.getByTestId('lucide-sparkles-5')).toBeInTheDocument();
    expect(screen.getByTestId('lucide-sparkles-6')).toBeInTheDocument();
  });

  test('renders brain icon in header', () => {
    renderWithRouter(<AIDemo />);

    const brainIcon = screen.getByTestId('lucide-brain');
    expect(brainIcon).toBeInTheDocument();
  });

  test('renders arrow icon in CTA button', () => {
    renderWithRouter(<AIDemo />);

    const arrowIcon = screen.getByTestId('lucide-arrow-right');
    expect(arrowIcon).toBeInTheDocument();
  });

  test('renders step numbers correctly', () => {
    renderWithRouter(<AIDemo />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  test('applies correct styling classes', () => {
    renderWithRouter(<AIDemo />);

    // Check gradient background
    const mainContainer = screen.getByText('Mapas Mentais com IA').closest('div[class*="bg-gradient-to-br"]');
    expect(mainContainer).toBeInTheDocument();

    // Check CTA button styling
    const ctaButton = screen.getByRole('link', { name: /Experimente Mapas Mentais com IA/i });
    expect(ctaButton).toHaveClass('bg-primary-600');
  });

  test('renders configuration boxes with borders', () => {
    renderWithRouter(<AIDemo />);

    const configBoxes = screen.getAllByText(/Modo/i)
      .filter(el => el.className.includes('font-semibold'))
      .map(el => el.closest('.border'));
    
    expect(configBoxes.length).toBe(2);
    configBoxes.forEach(box => {
      expect(box).toHaveClass('border-gray-200');
    });
  });

  test('renders responsive grid layouts', () => {
    renderWithRouter(<AIDemo />);

    // Check for md:grid-cols-2 classes
    const grids = document.querySelectorAll('.md\\:grid-cols-2');
    expect(grids.length).toBeGreaterThan(0);
  });

  test('all text content is properly structured', () => {
    renderWithRouter(<AIDemo />);

    // Check hierarchy of headings
    const h1 = screen.getByRole('heading', { level: 1, name: 'Mapas Mentais com IA' });
    const h2 = screen.getByRole('heading', { level: 2, name: 'Como Funciona' });
    const h3Elements = screen.getAllByRole('heading', { level: 3 });

    expect(h1).toBeInTheDocument();
    expect(h2).toBeInTheDocument();
    expect(h3Elements.length).toBeGreaterThan(0);
  });
});