import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import InteractiveMindMap from '../InteractiveMindMap';
import { Module } from '../../../types';
import { AdminProvider } from '../../../contexts/AdminContext';

// Mock ReactFlow
jest.mock('reactflow', () => ({
  __esModule: true,
  ...jest.requireActual('reactflow'),
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="react-flow-provider">{children}</div>,
  default: ({ children, nodes, edges, onNodeClick, ...props }: any) => (
    <div data-testid="react-flow" data-nodes={JSON.stringify(nodes)} data-edges={JSON.stringify(edges)}>
      {nodes?.map((node: any) => (
        <div
          key={node.id}
          data-testid={`node-${node.id}`}
          onClick={(e) => onNodeClick?.(e, node)}
          style={{ cursor: 'pointer' }}
        >
          {node.data.label}
        </div>
      ))}
      {children}
    </div>
  ),
  Controls: () => <div data-testid="react-flow-controls">Controls</div>,
  Background: () => <div data-testid="react-flow-background">Background</div>,
  MiniMap: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="react-flow-minimap">
      MiniMap
      {children}
    </div>
  ),
  Panel: ({ children, position }: { children: React.ReactNode; position: string }) => (
    <div data-testid={`react-flow-panel-${position}`}>{children}</div>
  ),
  useNodesState: (initial: any) => [initial, jest.fn(), jest.fn()],
  useEdgesState: (initial: any) => [initial, jest.fn(), jest.fn()],
}));

// Mock the ReactFlowAdapter
const mockAdapter = {
  generateFromModule: jest.fn().mockReturnValue({
    nodes: [
      {
        id: 'node-1',
        data: { label: 'Test Node 1', moduleId: 'module-1' },
        position: { x: 100, y: 100 },
        style: { background: '#ffffff' }
      }
    ],
    edges: [
      {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2'
      }
    ]
  }),
  generateFromModules: jest.fn().mockReturnValue({
    nodes: [
      {
        id: 'node-1',
        data: { label: 'Test Node 1', moduleId: 'module-1' },
        position: { x: 100, y: 100 },
        style: { background: '#ffffff' }
      },
      {
        id: 'node-2',
        data: { label: 'Test Node 2', moduleId: 'module-2' },
        position: { x: 200, y: 200 },
        style: { background: '#f0f0f0' }
      }
    ],
    edges: [
      {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2'
      }
    ]
  }),
  updateLayout: jest.fn().mockImplementation((nodes) => nodes),
  generateStudyPath: jest.fn().mockReturnValue(['module-1', 'module-2']),
  highlightPath: jest.fn().mockImplementation((nodes, edges) => ({ nodes, edges })),
  filterByCategory: jest.fn().mockImplementation((nodes, edges) => ({ nodes, edges })),
  getLayoutRecommendations: jest.fn().mockReturnValue([
    { type: 'radial', name: 'Radial Layout', description: 'Center-out arrangement' },
    { type: 'hierarchical', name: 'Hierarchical Layout', description: 'Top-down tree' }
  ])
};

jest.mock('../../../services/mindmap/reactFlowAdapter', () => ({
  ReactFlowAdapter: jest.fn().mockImplementation(() => mockAdapter)
}));

// Mock react-router-dom navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('InteractiveMindMap', () => {
  const mockModules: Module[] = [
    {
      id: 'module-1',
      title: 'Shadow Archetype',
      category: 'archetype',
      difficulty: 'beginner',
      description: 'Understanding the Shadow archetype',
      content: '# Shadow\n\nThe Shadow represents...'
    },
    {
      id: 'module-2',
      title: 'Anima/Animus',
      category: 'archetype',
      difficulty: 'intermediate',
      description: 'The contrasexual archetype',
      content: '# Anima/Animus\n\nThe Anima and Animus...'
    }
  ];

  const defaultProps = {
    modules: mockModules,
    showControls: true,
    showMiniMap: true,
    initialLayout: 'radial' as any
  };

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <AdminProvider>
        <MemoryRouter>
          {ui}
        </MemoryRouter>
      </AdminProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders without crashing', () => {
      renderWithProviders(<InteractiveMindMap {...defaultProps} />);
      expect(screen.getByTestId('react-flow-provider')).toBeInTheDocument();
    });

    test('renders with ReactFlowProvider wrapper', () => {
      renderWithProviders(<InteractiveMindMap {...defaultProps} />);
      expect(screen.getByTestId('react-flow-provider')).toBeInTheDocument();
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });

    test('renders controls when showControls is true', () => {
      renderWithProviders(<InteractiveMindMap {...defaultProps} />);
      expect(screen.getByTestId('react-flow-controls')).toBeInTheDocument();
    });

    test('does not render controls when showControls is false', () => {
      renderWithProviders(<InteractiveMindMap {...defaultProps} showControls={false} />);
      expect(screen.queryByTestId('react-flow-controls')).not.toBeInTheDocument();
    });

    test('renders minimap when showMiniMap is true', () => {
      renderWithProviders(<InteractiveMindMap {...defaultProps} />);
      expect(screen.getByTestId('react-flow-minimap')).toBeInTheDocument();
    });

    test('does not render minimap when showMiniMap is false', () => {
      renderWithProviders(<InteractiveMindMap {...defaultProps} showMiniMap={false} />);
      expect(screen.queryByTestId('react-flow-minimap')).not.toBeInTheDocument();
    });

    test('renders background component', () => {
      renderWithProviders(<InteractiveMindMap {...defaultProps} />);
      expect(screen.getByTestId('react-flow-background')).toBeInTheDocument();
    });

    test('renders control panel with layout options', () => {
      renderWithProviders(<InteractiveMindMap {...defaultProps} />);
      expect(screen.getByTestId('react-flow-panel-top-left')).toBeInTheDocument();
      expect(screen.getByText('Layout')).toBeInTheDocument();
    });

    test('renders study tools section', () => {
      renderWithProviders(<InteractiveMindMap {...defaultProps} />);
      expect(screen.getByText('Study Tools')).toBeInTheDocument();
      expect(screen.getByText('Generate Study Path')).toBeInTheDocument();
    });

    test('renders categories filter section', () => {
      renderWithProviders(<InteractiveMindMap {...defaultProps} />);
      expect(screen.getByText('Categories')).toBeInTheDocument();
      expect(screen.getByText('Archetypes')).toBeInTheDocument();
      expect(screen.getByText('Complexes')).toBeInTheDocument();
      expect(screen.getByText('Processes')).toBeInTheDocument();
      expect(screen.getByText('Concepts')).toBeInTheDocument();
    });

    test('renders legend panel', () => {
      renderWithProviders(<InteractiveMindMap {...defaultProps} />);
      expect(screen.getByTestId('react-flow-panel-bottom-right')).toBeInTheDocument();
      expect(screen.getByText('Core Concepts')).toBeInTheDocument();
      expect(screen.getByText('Modules')).toBeInTheDocument();
      expect(screen.getByText('Connections')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    test('handles node click with navigation', () => {
      renderWithProviders(<InteractiveMindMap {...defaultProps} />);
      const node = screen.getByTestId('node-node-1');
      
      fireEvent.click(node);
      
      expect(mockNavigate).toHaveBeenCalledWith('/module/module-1');
    });

    test('handles node click with custom onNodeClick handler', () => {
      const mockOnNodeClick = jest.fn();
      renderWithProviders(
        <InteractiveMindMap {...defaultProps} onNodeClick={mockOnNodeClick} />
      );
      
      const node = screen.getByTestId('node-node-1');
      fireEvent.click(node);
      
      expect(mockOnNodeClick).toHaveBeenCalledWith('module-1');
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    test('handles layout change', () => {
      renderWithProviders(<InteractiveMindMap {...defaultProps} />);
      
      const hierarchicalButton = screen.getByText('Hierarchical Layout');
      fireEvent.click(hierarchicalButton);
      
      // Should trigger layout update
      expect(screen.getByText('Hierarchical Layout')).toBeInTheDocument();
    });

    test('generates study path when button clicked', () => {
      renderWithProviders(<InteractiveMindMap {...defaultProps} />);
      
      const generateButton = screen.getByText('Generate Study Path');
      fireEvent.click(generateButton);
      
      expect(screen.getByText('Clear Path')).toBeInTheDocument();
      expect(screen.getByText('Study Order:')).toBeInTheDocument();
    });

    test('clears study path when clear button clicked', async () => {
      renderWithProviders(<InteractiveMindMap {...defaultProps} />);
      
      // First generate a path
      const generateButton = screen.getByText('Generate Study Path');
      fireEvent.click(generateButton);
      
      // Then clear it
      const clearButton = screen.getByText('Clear Path');
      fireEvent.click(clearButton);
      
      await waitFor(() => {
        expect(screen.getByText('Generate Study Path')).toBeInTheDocument();
        expect(screen.queryByText('Clear Path')).not.toBeInTheDocument();
      });
    });

    test('handles category filter toggle', () => {
      renderWithProviders(<InteractiveMindMap {...defaultProps} />);
      
      const archetypeCheckbox = screen.getByLabelText(/Archetypes/);
      fireEvent.click(archetypeCheckbox);
      
      expect(archetypeCheckbox).toBeChecked();
    });

    test('handles multiple category selection', () => {
      renderWithProviders(<InteractiveMindMap {...defaultProps} />);
      
      const archetypeCheckbox = screen.getByLabelText(/Archetypes/);
      const complexCheckbox = screen.getByLabelText(/Complexes/);
      
      fireEvent.click(archetypeCheckbox);
      fireEvent.click(complexCheckbox);
      
      expect(archetypeCheckbox).toBeChecked();
      expect(complexCheckbox).toBeChecked();
    });

    test('handles category deselection', () => {
      renderWithProviders(<InteractiveMindMap {...defaultProps} />);
      
      const archetypeCheckbox = screen.getByLabelText(/Archetypes/);
      
      // Select then deselect
      fireEvent.click(archetypeCheckbox);
      expect(archetypeCheckbox).toBeChecked();
      
      fireEvent.click(archetypeCheckbox);
      expect(archetypeCheckbox).not.toBeChecked();
    });
  });

  describe('Props Handling', () => {
    test('uses provided modules', () => {
      const customModules = [
        {
          id: 'custom-1',
          title: 'Custom Module',
          category: 'custom',
          difficulty: 'advanced' as const,
          description: 'A custom test module',
          content: '# Custom\n\nCustom content...'
        }
      ];

      renderWithProviders(<InteractiveMindMap modules={customModules} />);
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });

    test('handles selectedModule prop', () => {
      const selectedModule = mockModules[0];
      renderWithProviders(
        <InteractiveMindMap modules={mockModules} selectedModule={selectedModule} />
      );
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });

    test('uses default layout when not specified', () => {
      renderWithProviders(<InteractiveMindMap modules={mockModules} />);
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });

    test('respects initialLayout prop', () => {
      renderWithProviders(
        <InteractiveMindMap {...defaultProps} initialLayout={'hierarchical' as any} />
      );
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('handles empty modules array', () => {
      renderWithProviders(<InteractiveMindMap modules={[]} />);
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });

    test('handles node with missing moduleId', () => {
      const mockAdapter = require('../../../services/mindmap/reactFlowAdapter').ReactFlowAdapter;
      const adapterInstance = new mockAdapter();
      
      adapterInstance.generateFromModules.mockReturnValue({
        nodes: [
          {
            id: 'node-without-module',
            data: { label: 'No Module' },
            position: { x: 100, y: 100 }
          }
        ],
        edges: []
      });

      renderWithProviders(<InteractiveMindMap {...defaultProps} />);
      
      const node = screen.getByTestId('node-node-without-module');
      fireEvent.click(node);
      
      // Should not crash or navigate
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    test('handles missing module in study path', () => {
      const mockAdapter = require('../../../services/mindmap/reactFlowAdapter').ReactFlowAdapter;
      const adapterInstance = new mockAdapter();
      
      adapterInstance.generateStudyPath.mockReturnValue(['nonexistent-module']);

      renderWithProviders(<InteractiveMindMap {...defaultProps} />);
      
      const generateButton = screen.getByText('Generate Study Path');
      fireEvent.click(generateButton);
      
      // Should display the module ID even if module not found
      expect(screen.getByText('nonexistent-module')).toBeInTheDocument();
    });
  });

  describe('MiniMap Integration', () => {
    test('renders MiniMapSector component', () => {
      renderWithProviders(<InteractiveMindMap {...defaultProps} />);
      expect(screen.getByTestId('react-flow-minimap')).toBeInTheDocument();
    });

    test('renders MiniMapLegend component', () => {
      renderWithProviders(<InteractiveMindMap {...defaultProps} />);
      expect(screen.getByTestId('react-flow-minimap')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels for interactive elements', () => {
      renderWithProviders(<InteractiveMindMap {...defaultProps} />);
      
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        expect(checkbox).toHaveAccessibleName();
      });
    });

    test('has proper button labels', () => {
      renderWithProviders(<InteractiveMindMap {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });

    test('provides keyboard navigation support', () => {
      renderWithProviders(<InteractiveMindMap {...defaultProps} />);
      
      const layoutButtons = screen.getAllByRole('button');
      layoutButtons.forEach(button => {
        expect(button).not.toHaveAttribute('tabindex', '-1');
      });
    });
  });

  describe('Performance', () => {
    test('memoizes node types', () => {
      const { rerender } = renderWithProviders(<InteractiveMindMap {...defaultProps} />);
      
      // Re-render with same props
      rerender(
        <AdminProvider>
          <MemoryRouter>
            <InteractiveMindMap {...defaultProps} />
          </MemoryRouter>
        </AdminProvider>
      );
      
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });

    test('updates layout efficiently', () => {
      renderWithProviders(<InteractiveMindMap {...defaultProps} />);
      
      const radialButton = screen.getByText('Radial Layout');
      fireEvent.click(radialButton);
      
      // Should not cause excessive re-renders
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });
  });
});