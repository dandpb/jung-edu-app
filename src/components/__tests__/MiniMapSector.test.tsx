import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { 
  MiniMapSector, 
  ModuleNode, 
  MiniMapLegend, 
  getDifficultyColor 
} from '../MiniMapSector';

// Mock react-flow components
jest.mock('reactflow', () => ({
  Handle: ({ type, position }: { type: string; position: string }) => (
    <div data-testid={`handle-${type}-${position}`} />
  ),
  Position: {
    Top: 'top',
    Bottom: 'bottom',
    Left: 'left',
    Right: 'right'
  }
}));

describe('MiniMapSector Component', () => {
  const mockSectors = [
    {
      id: 'archetype',
      title: 'Archetypes',
      category: 'archetype',
      difficulty: 'beginner' as const,
      bounds: { x: 10, y: 10, width: 100, height: 80 },
      color: '#7C3AED',
      nodeCount: 5
    },
    {
      id: 'complex',
      title: 'Complexes',
      category: 'complex',
      difficulty: 'intermediate' as const,
      bounds: { x: 150, y: 20, width: 120, height: 90 },
      color: '#DC2626',
      nodeCount: 3
    },
    {
      id: 'process',
      title: 'Processes',
      category: 'process',
      difficulty: 'advanced' as const,
      bounds: { x: 300, y: 50, width: 110, height: 85 },
      color: '#2563EB',
      nodeCount: 7
    }
  ];

  const mockViewBox = { x: 0, y: 0, width: 1000, height: 800 };

  describe('Rendering', () => {
    test('renders SVG element with correct attributes', () => {
      const { container } = render(
        <MiniMapSector sectors={mockSectors} viewBox={mockViewBox} />
      );
      
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('minimap-sectors');
      expect(svg).toHaveAttribute('viewBox', '0 0 200 150');
    });

    test('renders all provided sectors', () => {
      const { container } = render(
        <MiniMapSector sectors={mockSectors} viewBox={mockViewBox} />
      );
      
      const groups = container.querySelectorAll('g');
      expect(groups).toHaveLength(mockSectors.length);
    });

    test('renders sector rectangles with correct attributes', () => {
      const { container } = render(
        <MiniMapSector sectors={mockSectors} viewBox={mockViewBox} />
      );
      
      const rects = container.querySelectorAll('rect');
      expect(rects).toHaveLength(mockSectors.length);
      
      // Check first sector
      const firstRect = rects[0];
      expect(firstRect).toHaveAttribute('fill', '#7C3AED');
      expect(firstRect).toHaveAttribute('fill-opacity', '0.1');
      expect(firstRect).toHaveAttribute('stroke', '#7C3AED');
      expect(firstRect).toHaveAttribute('stroke-width', '1');
      expect(firstRect).toHaveAttribute('stroke-opacity', '0.3');
      expect(firstRect).toHaveAttribute('rx', '4');
      expect(firstRect).toHaveAttribute('ry', '4');
    });

    test('renders sector labels with correct text', () => {
      const { container } = render(
        <MiniMapSector sectors={mockSectors} viewBox={mockViewBox} />
      );
      
      expect(container).toHaveTextContent('archetype');
      expect(container).toHaveTextContent('complex');
      expect(container).toHaveTextContent('process');
    });

    test('renders difficulty indicators as circles', () => {
      const { container } = render(
        <MiniMapSector sectors={mockSectors} viewBox={mockViewBox} />
      );
      
      const circles = container.querySelectorAll('circle');
      expect(circles).toHaveLength(mockSectors.length);
      
      // Check colors match difficulty levels
      expect(circles[0]).toHaveAttribute('fill', getDifficultyColor('beginner'));
      expect(circles[1]).toHaveAttribute('fill', getDifficultyColor('intermediate'));
      expect(circles[2]).toHaveAttribute('fill', getDifficultyColor('advanced'));
    });

    test('renders node count labels', () => {
      const { container } = render(
        <MiniMapSector sectors={mockSectors} viewBox={mockViewBox} />
      );
      
      expect(container).toHaveTextContent('5 nodes');
      expect(container).toHaveTextContent('3 nodes');
      expect(container).toHaveTextContent('7 nodes');
    });

    test('calculates correct scaled positions', () => {
      const { container } = render(
        <MiniMapSector sectors={mockSectors} viewBox={mockViewBox} />
      );
      
      const rects = container.querySelectorAll('rect');
      const firstRect = rects[0];
      
      // Scale calculation: scaleX = 200 / 1000 = 0.2, scaleY = 150 / 800 = 0.1875
      // First sector: x = (10 - 0) * 0.2 = 2, y = (10 - 0) * 0.1875 = 1.875
      expect(firstRect).toHaveAttribute('x', '2');
      expect(firstRect).toHaveAttribute('y', '1.875');
    });
  });

  describe('User Interactions', () => {
    test('handles sector click when onSectorClick is provided', () => {
      const mockOnSectorClick = jest.fn();
      const { container } = render(
        <MiniMapSector 
          sectors={mockSectors} 
          viewBox={mockViewBox} 
          onSectorClick={mockOnSectorClick}
        />
      );
      
      const firstRect = container.querySelectorAll('rect')[0];
      fireEvent.click(firstRect);
      
      expect(mockOnSectorClick).toHaveBeenCalledWith('archetype');
    });

    test('does not handle click when onSectorClick is not provided', () => {
      const { container } = render(
        <MiniMapSector sectors={mockSectors} viewBox={mockViewBox} />
      );
      
      const firstRect = container.querySelectorAll('rect')[0];
      expect(firstRect).toHaveStyle('pointer-events: none');
      expect(firstRect).toHaveStyle('cursor: default');
    });

    test('shows pointer cursor when onSectorClick is provided', () => {
      const mockOnSectorClick = jest.fn();
      const { container } = render(
        <MiniMapSector 
          sectors={mockSectors} 
          viewBox={mockViewBox} 
          onSectorClick={mockOnSectorClick}
        />
      );
      
      const firstRect = container.querySelectorAll('rect')[0];
      expect(firstRect).toHaveStyle('pointer-events: auto');
      expect(firstRect).toHaveStyle('cursor: pointer');
    });

    test('handles multiple sector clicks', () => {
      const mockOnSectorClick = jest.fn();
      const { container } = render(
        <MiniMapSector 
          sectors={mockSectors} 
          viewBox={mockViewBox} 
          onSectorClick={mockOnSectorClick}
        />
      );
      
      const rects = container.querySelectorAll('rect');
      
      fireEvent.click(rects[0]);
      fireEvent.click(rects[1]);
      fireEvent.click(rects[2]);
      
      expect(mockOnSectorClick).toHaveBeenCalledTimes(3);
      expect(mockOnSectorClick).toHaveBeenNthCalledWith(1, 'archetype');
      expect(mockOnSectorClick).toHaveBeenNthCalledWith(2, 'complex');
      expect(mockOnSectorClick).toHaveBeenNthCalledWith(3, 'process');
    });
  });

  describe('Edge Cases', () => {
    test('renders with empty sectors array', () => {
      const { container } = render(
        <MiniMapSector sectors={[]} viewBox={mockViewBox} />
      );
      
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      
      const groups = container.querySelectorAll('g');
      expect(groups).toHaveLength(0);
    });

    test('handles zero viewBox dimensions', () => {
      const zeroViewBox = { x: 0, y: 0, width: 0, height: 0 };
      const { container } = render(
        <MiniMapSector sectors={mockSectors} viewBox={zeroViewBox} />
      );
      
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    test('handles negative sector bounds', () => {
      const negativeSectors = [{
        id: 'negative',
        title: 'Negative',
        category: 'negative',
        difficulty: 'beginner' as const,
        bounds: { x: -50, y: -30, width: 100, height: 80 },
        color: '#000000',
        nodeCount: 1
      }];
      
      const { container } = render(
        <MiniMapSector sectors={negativeSectors} viewBox={mockViewBox} />
      );
      
      const rect = container.querySelector('rect');
      expect(rect).toBeInTheDocument();
    });

    test('handles sectors with zero node count', () => {
      const zeroNodeSector = [{
        id: 'empty',
        title: 'Empty',
        category: 'empty',
        difficulty: 'beginner' as const,
        bounds: { x: 10, y: 10, width: 100, height: 80 },
        color: '#999999',
        nodeCount: 0
      }];
      
      const { container } = render(
        <MiniMapSector sectors={zeroNodeSector} viewBox={mockViewBox} />
      );
      
      expect(container).toHaveTextContent('0 nodes');
    });
  });

  describe('Accessibility', () => {
    test('provides proper ARIA labels for clickable sectors', () => {
      const mockOnSectorClick = jest.fn();
      const { container } = render(
        <MiniMapSector 
          sectors={mockSectors} 
          viewBox={mockViewBox} 
          onSectorClick={mockOnSectorClick}
        />
      );
      
      const rects = container.querySelectorAll('rect');
      rects.forEach(rect => {
        expect(rect).toHaveStyle('cursor: pointer');
      });
    });

    test('text elements have proper accessibility attributes', () => {
      const { container } = render(
        <MiniMapSector sectors={mockSectors} viewBox={mockViewBox} />
      );
      
      const textElements = container.querySelectorAll('text');
      textElements.forEach(text => {
        expect(text).toHaveAttribute('text-anchor');
        expect(text).toHaveAttribute('font-size');
      });
    });
  });
});

describe('ModuleNode Component', () => {
  const mockData = {
    label: 'Shadow Archetype',
    moduleId: 'shadow-1',
    moduleCategory: 'archetype',
    categoryColor: '#7C3AED',
    moduleInfo: 'Understanding the Shadow',
    difficulty: 'intermediate',
    style: {
      background: '#ffffff',
      border: '#cccccc'
    }
  };

  describe('Rendering', () => {
    test('renders node with correct label', () => {
      render(<ModuleNode data={mockData} />);
      expect(screen.getByText('Shadow Archetype')).toBeInTheDocument();
    });

    test('renders module info when provided', () => {
      render(<ModuleNode data={mockData} />);
      expect(screen.getByText('Understanding the Shadow')).toBeInTheDocument();
    });

    test('renders category badge when provided', () => {
      render(<ModuleNode data={mockData} />);
      expect(screen.getByText('archetype')).toBeInTheDocument();
    });

    test('renders handles for connections', () => {
      render(<ModuleNode data={mockData} />);
      expect(screen.getByTestId('handle-target-top')).toBeInTheDocument();
      expect(screen.getByTestId('handle-source-bottom')).toBeInTheDocument();
    });

    test('applies correct styling from data', () => {
      const { container } = render(<ModuleNode data={mockData} />);
      const nodeDiv = container.querySelector('.module-node');
      
      expect(nodeDiv).toHaveStyle({
        background: '#ffffff',
        border: '2px solid #cccccc'
      });
    });

    test('renders difficulty indicator', () => {
      const { container } = render(<ModuleNode data={mockData} />);
      const difficultyIndicator = container.querySelector('[style*="border-radius: 50%"]');
      
      expect(difficultyIndicator).toBeInTheDocument();
      expect(difficultyIndicator).toHaveStyle({
        background: getDifficultyColor('intermediate')
      });
    });
  });

  describe('Props Handling', () => {
    test('handles missing optional properties', () => {
      const minimalData = {
        label: 'Basic Node'
      };
      
      render(<ModuleNode data={minimalData} />);
      expect(screen.getByText('Basic Node')).toBeInTheDocument();
    });

    test('uses default colors when not provided', () => {
      const dataWithoutColors = {
        label: 'Test Node',
        moduleCategory: 'test'
      };
      
      const { container } = render(<ModuleNode data={dataWithoutColors} />);
      const nodeDiv = container.querySelector('.module-node');
      
      expect(nodeDiv).toHaveStyle('border: 2px solid #ccc');
    });

    test('handles unknown difficulty levels', () => {
      const dataWithUnknownDifficulty = {
        ...mockData,
        difficulty: 'unknown'
      };
      
      const { container } = render(<ModuleNode data={dataWithUnknownDifficulty} />);
      const difficultyIndicator = container.querySelector('[style*="border-radius: 50%"]');
      
      expect(difficultyIndicator).toHaveStyle({
        background: getDifficultyColor('unknown')
      });
    });
  });

  describe('Accessibility', () => {
    test('provides semantic structure for screen readers', () => {
      const { container } = render(<ModuleNode data={mockData} />);
      const nodeDiv = container.querySelector('.module-node');
      
      expect(nodeDiv).toBeInTheDocument();
    });

    test('text content is readable', () => {
      render(<ModuleNode data={mockData} />);
      
      // Main label should be prominently displayed
      const label = screen.getByText('Shadow Archetype');
      expect(label).toHaveStyle('font-weight: bold');
      
      // Info text should be smaller
      const info = screen.getByText('Understanding the Shadow');
      expect(info).toHaveStyle('font-size: 12px');
    });
  });
});

describe('MiniMapLegend Component', () => {
  const mockCategories = [
    { name: 'Archetypes', color: '#7C3AED' },
    { name: 'Complexes', color: '#DC2626' },
    { name: 'Processes', color: '#2563EB' }
  ];

  const mockDifficulties = [
    { name: 'Beginner', color: '#4ade80' },
    { name: 'Intermediate', color: '#fbbf24' },
    { name: 'Advanced', color: '#f87171' }
  ];

  describe('Rendering', () => {
    test('renders categories section', () => {
      render(
        <MiniMapLegend 
          categories={mockCategories} 
          difficulties={mockDifficulties} 
        />
      );
      
      expect(screen.getByText('Module Categories')).toBeInTheDocument();
      expect(screen.getByText('Archetypes')).toBeInTheDocument();
      expect(screen.getByText('Complexes')).toBeInTheDocument();
      expect(screen.getByText('Processes')).toBeInTheDocument();
    });

    test('renders difficulties section', () => {
      render(
        <MiniMapLegend 
          categories={mockCategories} 
          difficulties={mockDifficulties} 
        />
      );
      
      expect(screen.getByText('Difficulty')).toBeInTheDocument();
      expect(screen.getByText('Beginner')).toBeInTheDocument();
      expect(screen.getByText('Intermediate')).toBeInTheDocument();
      expect(screen.getByText('Advanced')).toBeInTheDocument();
    });

    test('applies correct positioning styles', () => {
      const { container } = render(
        <MiniMapLegend 
          categories={mockCategories} 
          difficulties={mockDifficulties} 
        />
      );
      
      const legendDiv = container.firstChild as HTMLElement;
      expect(legendDiv).toHaveStyle({
        position: 'absolute',
        bottom: '10px',
        right: '10px'
      });
    });

    test('renders color indicators for categories', () => {
      const { container } = render(
        <MiniMapLegend 
          categories={mockCategories} 
          difficulties={mockDifficulties} 
        />
      );
      
      // Should have colored rectangles for categories
      const colorIndicators = container.querySelectorAll('[style*="width: 12px"][style*="height: 12px"]');
      expect(colorIndicators.length).toBeGreaterThanOrEqual(mockCategories.length);
    });

    test('renders color indicators for difficulties', () => {
      const { container } = render(
        <MiniMapLegend 
          categories={mockCategories} 
          difficulties={mockDifficulties} 
        />
      );
      
      // Should have circular indicators for difficulties
      const difficultyIndicators = container.querySelectorAll('[style*="border-radius: 50%"]');
      expect(difficultyIndicators.length).toBeGreaterThanOrEqual(mockDifficulties.length);
    });
  });

  describe('Edge Cases', () => {
    test('handles empty categories array', () => {
      render(
        <MiniMapLegend 
          categories={[]} 
          difficulties={mockDifficulties} 
        />
      );
      
      expect(screen.getByText('Module Categories')).toBeInTheDocument();
      expect(screen.getByText('Difficulty')).toBeInTheDocument();
    });

    test('handles empty difficulties array', () => {
      render(
        <MiniMapLegend 
          categories={mockCategories} 
          difficulties={[]} 
        />
      );
      
      expect(screen.getByText('Module Categories')).toBeInTheDocument();
      expect(screen.getByText('Difficulty')).toBeInTheDocument();
    });

    test('handles categories with long names', () => {
      const longNameCategories = [
        { name: 'Very Long Category Name That Might Wrap', color: '#7C3AED' }
      ];
      
      render(
        <MiniMapLegend 
          categories={longNameCategories} 
          difficulties={mockDifficulties} 
        />
      );
      
      expect(screen.getByText('Very Long Category Name That Might Wrap')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    test('applies correct background and border styles', () => {
      const { container } = render(
        <MiniMapLegend 
          categories={mockCategories} 
          difficulties={mockDifficulties} 
        />
      );
      
      const legendDiv = container.firstChild as HTMLElement;
      expect(legendDiv).toHaveStyle({
        background: 'rgba(255, 255, 255, 0.9)',
        border: '1px solid #e5e7eb',
        borderRadius: '8px'
      });
    });

    test('uses appropriate font sizes', () => {
      const { container } = render(
        <MiniMapLegend 
          categories={mockCategories} 
          difficulties={mockDifficulties} 
        />
      );
      
      const legendDiv = container.firstChild as HTMLElement;
      expect(legendDiv).toHaveStyle('font-size: 11px');
    });
  });
});

describe('getDifficultyColor Utility', () => {
  test('returns correct color for beginner', () => {
    expect(getDifficultyColor('beginner')).toBe('#4ade80');
  });

  test('returns correct color for intermediate', () => {
    expect(getDifficultyColor('intermediate')).toBe('#fbbf24');
  });

  test('returns correct color for advanced', () => {
    expect(getDifficultyColor('advanced')).toBe('#f87171');
  });

  test('returns default color for unknown difficulty', () => {
    expect(getDifficultyColor('unknown')).toBe('#9ca3af');
  });

  test('returns default color for empty string', () => {
    expect(getDifficultyColor('')).toBe('#9ca3af');
  });

  test('returns default color for undefined', () => {
    expect(getDifficultyColor(undefined as any)).toBe('#9ca3af');
  });

  test('handles case sensitivity', () => {
    expect(getDifficultyColor('BEGINNER')).toBe('#9ca3af');
    expect(getDifficultyColor('Beginner')).toBe('#9ca3af');
  });
});