import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import AIDemo from '../AIDemo';

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Brain: ({ className }: { className?: string }) => <div className={className} data-testid="lucide-brain" />,
  ArrowRight: ({ className }: { className?: string }) => <div className={className} data-testid="lucide-arrow-right" />,
  Sparkles: ({ className }: { className?: string }) => <div className={className} data-testid="lucide-sparkles-1" />
}));

const renderWithRouter = (component: React.ReactElement, initialEntries?: string[]) => {
  if (initialEntries) {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        {component}
      </MemoryRouter>
    );
  }
  return render(
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {component}
    </BrowserRouter>
  );
};

describe('AIDemo - Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders the main page structure correctly', () => {
      renderWithRouter(<AIDemo />);

      // Check main page structure
      expect(screen.getByText('Mapas Mentais com IA')).toBeInTheDocument();
      expect(screen.getByText(/Experimente o futuro do conteúdo educacional/)).toBeInTheDocument();
      
      // Check sections are present
      expect(screen.getByText('Como Funciona')).toBeInTheDocument();
      expect(screen.getByText('Recursos')).toBeInTheDocument();
      expect(screen.getByText('Opções de Configuração')).toBeInTheDocument();
    });

    it('renders with proper semantic HTML structure', () => {
      renderWithRouter(<AIDemo />);

      // Check heading hierarchy
      const h1 = screen.getByRole('heading', { level: 1, name: 'Mapas Mentais com IA' });
      const h2 = screen.getByRole('heading', { level: 2, name: 'Como Funciona' });
      const h3Elements = screen.getAllByRole('heading', { level: 3 });

      expect(h1).toBeInTheDocument();
      expect(h2).toBeInTheDocument();
      expect(h3Elements.length).toBeGreaterThanOrEqual(6); // Multiple h3 elements
    });

    it('applies correct CSS classes for styling', () => {
      renderWithRouter(<AIDemo />);

      // Check main container has gradient background
      const mainContainer = screen.getByText('Mapas Mentais com IA').closest('div');
      const gradientContainer = mainContainer?.closest('.bg-gradient-to-br');
      expect(gradientContainer).toBeInTheDocument();

      // Check responsive layout classes
      const gridElements = document.querySelectorAll('.md\\:grid-cols-2');
      expect(gridElements.length).toBeGreaterThan(0);
    });

    it('renders icons correctly', () => {
      renderWithRouter(<AIDemo />);

      // Check main brain icon
      expect(screen.getByTestId('lucide-brain')).toBeInTheDocument();
      
      // Check arrow icon in CTA button
      expect(screen.getByTestId('lucide-arrow-right')).toBeInTheDocument();
      
      // Check sparkles icons (at least one should be present)
      expect(screen.getByTestId('lucide-sparkles-1')).toBeInTheDocument();
    });

    it('renders all step numbers in correct sequence', () => {
      renderWithRouter(<AIDemo />);

      // Check that step numbers 1, 2, 3 are present in the correct context
      const steps = ['1', '2', '3'];
      steps.forEach(step => {
        const stepElement = screen.getByText(step);
        expect(stepElement).toBeInTheDocument();
        expect(stepElement.closest('.bg-primary-100')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation Links', () => {
    it('renders main CTA button with correct attributes', () => {
      renderWithRouter(<AIDemo />);

      const ctaButton = screen.getByRole('link', { name: /Experimente Mapas Mentais com IA/i });
      expect(ctaButton).toBeInTheDocument();
      expect(ctaButton).toHaveClass('bg-primary-600', 'text-white');
    });

    it('renders alternative demo link with correct attributes', () => {
      renderWithRouter(<AIDemo />);

      const altLink = screen.getByRole('link', { name: /demonstração de setores do minimapa/i });
      expect(altLink).toBeInTheDocument();
      expect(altLink).toHaveAttribute('href', '/minimap-demo');
      expect(altLink).toHaveClass('text-primary-600', 'hover:underline');
    });

    it('CTA button contains arrow icon', () => {
      renderWithRouter(<AIDemo />);

      const ctaButton = screen.getByRole('link', { name: /Experimente Mapas Mentais com IA/i });
      const arrowIcon = within(ctaButton).getByTestId('lucide-arrow-right');
      expect(arrowIcon).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('supports keyboard navigation for links', async () => {
      const user = userEvent.setup();
      renderWithRouter(<AIDemo />);

      const ctaButton = screen.getByRole('link', { name: /Experimente Mapas Mentais com IA/i });
      
      await user.tab(); // Should focus the first focusable element
      // Continue tabbing until we reach our button
      let attempts = 0;
      while (document.activeElement !== ctaButton && attempts < 20) {
        await user.tab();
        attempts++;
      }
      
      expect(document.activeElement).toBe(ctaButton);
    });

    it('supports mouse interactions with hover effects', async () => {
      const user = userEvent.setup();
      renderWithRouter(<AIDemo />);

      const ctaButton = screen.getByRole('link', { name: /Experimente Mapas Mentais com IA/i });
      
      await user.hover(ctaButton);
      expect(ctaButton).toHaveClass('hover:bg-primary-700');
      
      await user.unhover(ctaButton);
    });

    it('allows clicking on alternative demo link', async () => {
      const user = userEvent.setup();
      renderWithRouter(<AIDemo />);

      const altLink = screen.getByRole('link', { name: /demonstração de setores do minimapa/i });
      
      // Just test that the link is clickable and has proper attributes
      expect(altLink).toBeInTheDocument();
      await user.hover(altLink);
      expect(altLink).toHaveClass('hover:underline');
    });
  });

  describe('Responsive Design', () => {
    it('has responsive grid layouts', () => {
      renderWithRouter(<AIDemo />);

      // Check for responsive grid classes
      const mdGridElements = document.querySelectorAll('.md\\:grid-cols-2');
      expect(mdGridElements.length).toBeGreaterThan(0);
    });

    it('uses responsive spacing classes', () => {
      renderWithRouter(<AIDemo />);

      // Check for responsive padding/margin classes
      const mainContainer = screen.getByText('Mapas Mentais com IA').closest('.max-w-7xl');
      expect(mainContainer).toBeInTheDocument();
      expect(mainContainer).toHaveClass('mx-auto', 'px-4');
    });

    it('has proper mobile-friendly button sizing', () => {
      renderWithRouter(<AIDemo />);

      const ctaButton = screen.getByRole('link', { name: /Experimente Mapas Mentais com IA/i });
      expect(ctaButton).toHaveClass('px-8', 'py-4', 'text-lg');
    });
  });

  describe('Content Structure and Layout', () => {
    it('maintains proper content hierarchy', () => {
      renderWithRouter(<AIDemo />);

      const container = screen.getByText('Mapas Mentais com IA').closest('.max-w-7xl');
      expect(container).toBeInTheDocument();

      // Check sections are in proper order
      const howItWorksSection = screen.getByText('Como Funciona');
      const featuresSection = screen.getByText('Recursos');
      const configSection = screen.getByText('Opções de Configuração');

      expect(howItWorksSection).toBeInTheDocument();
      expect(featuresSection).toBeInTheDocument();
      expect(configSection).toBeInTheDocument();
    });

    it('has proper content spacing and alignment', () => {
      renderWithRouter(<AIDemo />);

      // Check centered text alignment for hero section
      const heroText = screen.getByText(/Experimente o futuro do conteúdo educacional/);
      const heroContainer = heroText.closest('.text-center');
      expect(heroContainer).toBeInTheDocument();

      // Check grid layouts have proper gap spacing
      const grids = document.querySelectorAll('.gap-12, .gap-8, .gap-4');
      expect(grids.length).toBeGreaterThan(0);
    });

    it('uses proper card/box layouts', () => {
      renderWithRouter(<AIDemo />);

      // Features card should have proper styling
      const featuresCard = screen.getByText('Recursos').closest('.bg-white');
      expect(featuresCard).toBeInTheDocument();
      expect(featuresCard).toHaveClass('rounded-xl', 'shadow-lg');

      // Configuration section should have proper card styling  
      const configCard = screen.getByText('Opções de Configuração').closest('.bg-white');
      expect(configCard).toBeInTheDocument();
      expect(configCard).toHaveClass('rounded-xl', 'shadow-lg');
    });
  });

  describe('Text Content Verification', () => {
    it('displays correct Portuguese text content', () => {
      renderWithRouter(<AIDemo />);

      const portugueseTexts = [
        'Mapas Mentais com IA',
        'Experimente o futuro do conteúdo educacional',
        'Como Funciona',
        'Clique em Qualquer Módulo',
        'IA Analisa o Conteúdo',
        'Explore o Mapa Interativo',
        'Recursos',
        'Opções de Configuração'
      ];

      portugueseTexts.forEach(text => {
        expect(screen.getByText(text)).toBeInTheDocument();
      });
    });

    it('displays proper technical configuration text', () => {
      renderWithRouter(<AIDemo />);

      // Check for environment variable names
      expect(screen.getByText(/REACT_APP_OPENAI_API_KEY/)).toBeInTheDocument();
      expect(screen.getByText(/REACT_APP_OPENAI_MODEL/)).toBeInTheDocument();
    });
  });

  describe('Visual Design Elements', () => {
    it('uses proper color scheme classes', () => {
      renderWithRouter(<AIDemo />);

      // Check primary color usage
      const brainIconContainer = screen.getByTestId('lucide-brain').closest('.bg-primary-600');
      expect(brainIconContainer).toBeInTheDocument();

      const ctaButton = screen.getByRole('link', { name: /Experimente Mapas Mentais com IA/i });
      expect(ctaButton).toHaveClass('bg-primary-600');

      // Check step number styling
      const stepNumbers = document.querySelectorAll('.text-primary-600.font-bold');
      expect(stepNumbers.length).toBe(3);
    });

    it('has proper background and border styling', () => {
      renderWithRouter(<AIDemo />);

      // Check gradient background
      const gradientBg = document.querySelector('.bg-gradient-to-br.from-primary-50.to-indigo-100');
      expect(gradientBg).toBeInTheDocument();

      // Check card backgrounds
      const whiteCards = document.querySelectorAll('.bg-white.rounded-xl.shadow-lg');
      expect(whiteCards.length).toBeGreaterThanOrEqual(2);
    });

    it('uses proper icon sizing and spacing', () => {
      renderWithRouter(<AIDemo />);

      const brainIcon = screen.getByTestId('lucide-brain');
      expect(brainIcon).toHaveClass('w-12', 'h-12');

      const arrowIcon = screen.getByTestId('lucide-arrow-right');
      expect(arrowIcon).toHaveClass('w-5', 'h-5');
    });
  });

  describe('Component Integration', () => {
    it('integrates properly with React Router', () => {
      renderWithRouter(<AIDemo />);

      // Links should be properly integrated with router
      const ctaLink = screen.getByRole('link', { name: /Experimente Mapas Mentais com IA/i });
      const altLink = screen.getByRole('link', { name: /demonstração de setores do minimapa/i });

      expect(altLink.getAttribute('href')).toBe('/minimap-demo');
    });

    it('renders consistently across different router states', () => {
      // Test with MemoryRouter at different initial routes
      const routes = ['/', '/ai-demo', '/some-other-route'];
      
      routes.forEach(route => {
        const { unmount } = renderWithRouter(<AIDemo />, [route]);
        
        expect(screen.getByText('Mapas Mentais com IA')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Experimente Mapas Mentais com IA/i })).toBeInTheDocument();
        
        unmount();
      });
    });
  });

  describe('Performance and Accessibility', () => {
    it('has no duplicate IDs', () => {
      renderWithRouter(<AIDemo />);

      const allElements = document.querySelectorAll('[id]');
      const ids = Array.from(allElements).map(el => el.id);
      const uniqueIds = [...new Set(ids)];
      
      expect(ids.length).toBe(uniqueIds.length);
    });

    it('has proper heading structure for screen readers', () => {
      renderWithRouter(<AIDemo />);

      const h1Elements = screen.getAllByRole('heading', { level: 1 });
      const h2Elements = screen.getAllByRole('heading', { level: 2 });
      const h3Elements = screen.getAllByRole('heading', { level: 3 });

      // Should have exactly one h1
      expect(h1Elements.length).toBe(1);
      // Should have at least one h2
      expect(h2Elements.length).toBeGreaterThanOrEqual(1);
      // Should have multiple h3 elements
      expect(h3Elements.length).toBeGreaterThanOrEqual(6);
    });

    it('provides meaningful text for links', () => {
      renderWithRouter(<AIDemo />);

      const ctaButton = screen.getByRole('link', { name: /Experimente Mapas Mentais com IA/i });
      const altLink = screen.getByRole('link', { name: /demonstração de setores do minimapa/i });

      // Links should have descriptive text
      expect(ctaButton.textContent).toContain('Experimente Mapas Mentais com IA');
      expect(altLink.textContent).toContain('demonstração de setores do minimapa');
    });
  });
});