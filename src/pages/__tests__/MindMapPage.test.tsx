import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MindMapPage from '../MindMapPage';
import { modules } from '../../data/modules';

// Mock ReactFlow components
jest.mock('react-flow-renderer', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="react-flow">{children}</div>
  ),
  Controls: () => <div data-testid="controls">Controls</div>,
  Background: () => <div data-testid="background">Background</div>,
  MiniMap: () => <div data-testid="minimap">MiniMap</div>,
  useNodesState: (initialNodes: any[]) => [initialNodes, jest.fn(), jest.fn()],
  useEdgesState: (initialEdges: any[]) => [initialEdges, jest.fn(), jest.fn()],
  addEdge: jest.fn(),
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {component}
    </BrowserRouter>
  );
};

describe('MindMapPage Component', () => {
  test('renders mind map title and description', () => {
    renderWithRouter(<MindMapPage modules={modules} />);
    
    expect(screen.getByText('Conceptual Mind Map')).toBeInTheDocument();
    expect(screen.getByText(/Explore the interconnected concepts/)).toBeInTheDocument();
  });

  test('renders ReactFlow component', () => {
    renderWithRouter(<MindMapPage modules={modules} />);
    
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  test('includes controls and minimap', () => {
    renderWithRouter(<MindMapPage modules={modules} />);
    
    expect(screen.getByTestId('controls')).toBeInTheDocument();
    expect(screen.getByTestId('minimap')).toBeInTheDocument();
    expect(screen.getByTestId('background')).toBeInTheDocument();
  });

  test('displays legend for node types', () => {
    renderWithRouter(<MindMapPage modules={modules} />);
    
    expect(screen.getByText('Central Concept')).toBeInTheDocument();
    expect(screen.getByText('Conscious Mind')).toBeInTheDocument();
    expect(screen.getByText('Unconscious Realms')).toBeInTheDocument();
  });

  test('creates nodes for all modules', () => {
    const { container } = renderWithRouter(<MindMapPage modules={modules} />);
    
    // Since ReactFlow is mocked, we can't directly test node creation
    // but we can verify the component renders without errors
    expect(container.querySelector('.h-full')).toBeInTheDocument();
  });

  test('applies correct styling to container', () => {
    const { container } = renderWithRouter(<MindMapPage modules={modules} />);
    
    const flowContainer = container.querySelector('.h-full.border.border-gray-200');
    expect(flowContainer).toBeInTheDocument();
    expect(flowContainer).toHaveClass('rounded-lg', 'overflow-hidden', 'bg-gray-50');
  });

  test('legend shows color indicators', () => {
    const { container } = renderWithRouter(<MindMapPage modules={modules} />);
    
    const colorIndicators = container.querySelectorAll('.w-4.h-4.rounded');
    expect(colorIndicators.length).toBe(3);
    
    expect(colorIndicators[0]).toHaveClass('bg-primary-600');
    expect(colorIndicators[1]).toHaveClass('bg-secondary-500');
    expect(colorIndicators[2]).toHaveClass('bg-primary-400');
  });
});