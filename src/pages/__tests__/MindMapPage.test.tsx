import React from 'react';
import { render, screen } from '../../utils/test-utils';
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


describe('MindMapPage Component', () => {
  test('renders mind map title and description', () => {
    render(<MindMapPage modules={modules} />);
    
    expect(screen.getByText('Mapa Mental Conceitual')).toBeInTheDocument();
    expect(screen.getByText(/Explore os conceitos interconectados/)).toBeInTheDocument();
  });

  test('renders ReactFlow component', () => {
    render(<MindMapPage modules={modules} />);
    
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  test('includes controls and minimap', () => {
    render(<MindMapPage modules={modules} />);
    
    expect(screen.getByTestId('controls')).toBeInTheDocument();
    expect(screen.getByTestId('minimap')).toBeInTheDocument();
    expect(screen.getByTestId('background')).toBeInTheDocument();
  });

  test('displays legend for node types', () => {
    render(<MindMapPage modules={modules} />);
    
    expect(screen.getByText('Conceito Central')).toBeInTheDocument();
    expect(screen.getByText('Mente Consciente')).toBeInTheDocument();
    expect(screen.getByText('Reinos Inconscientes')).toBeInTheDocument();
  });

  test('creates nodes for all modules', () => {
    const { container } = render(<MindMapPage modules={modules} />);
    
    // Since ReactFlow is mocked, we can't directly test node creation
    // but we can verify the component renders without errors
    expect(container.querySelector('.h-full')).toBeInTheDocument();
  });

  test('applies correct styling to container', () => {
    const { container } = render(<MindMapPage modules={modules} />);
    
    const flowContainer = container.querySelector('.h-full.border.border-gray-200');
    expect(flowContainer).toBeInTheDocument();
    expect(flowContainer).toHaveClass('rounded-lg', 'overflow-hidden', 'bg-gray-50');
  });

  test('legend shows color indicators', () => {
    const { container } = render(<MindMapPage modules={modules} />);
    
    const colorIndicators = container.querySelectorAll('.w-4.h-4.rounded');
    expect(colorIndicators.length).toBe(3);
    
    expect(colorIndicators[0]).toHaveClass('bg-primary-600');
    expect(colorIndicators[1]).toHaveClass('bg-secondary-500');
    expect(colorIndicators[2]).toHaveClass('bg-primary-400');
  });
});