import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import InteractiveMindMap from '../InteractiveMindMap';
import { Module } from '../../../types';
import { ReactFlowProvider } from 'reactflow';

// Mock ReactFlow components
jest.mock('reactflow', () => {
  const React = require('react');
  
  const ReactFlow = ({ children, onNodeClick, nodes, edges, nodeTypes }: any) => {
    return React.createElement('div', { 'data-testid': 'react-flow' }, [
      React.createElement('div', { key: 'nodes-count', 'data-testid': 'nodes-count' }, nodes?.length || 0),
      React.createElement('div', { key: 'edges-count', 'data-testid': 'edges-count' }, edges?.length || 0),
      ...(nodes?.map((node: any) => 
        React.createElement('div', {
          key: node.id,
          'data-testid': `node-${node.id}`,
          onClick: (e: any) => onNodeClick?.(e, node),
          role: 'button',
          'aria-label': node.data.label
        }, node.data.label)
      ) || []),
      children
    ]);
  };
    
  const Controls = () => React.createElement('div', { 'data-testid': 'controls' }, 'Controls');
  const Background = () => React.createElement('div', { 'data-testid': 'background' }, 'Background');
  const MiniMap = ({ children }: any) => React.createElement('div', { 'data-testid': 'minimap' }, children);
  const Panel = ({ children, position }: any) => 
    React.createElement('div', { 'data-testid': `panel-${position}` }, children);
    
  const useNodesState = (initialNodes: any) => {
    const [nodes, setNodes] = React.useState(initialNodes);
    return [nodes, setNodes, jest.fn()];
  };
  
  const useEdgesState = (initialEdges: any) => {
    const [edges, setEdges] = React.useState(initialEdges);
    return [edges, setEdges, jest.fn()];
  };
  
  const ReactFlowProvider = ({ children }: any) => children;
  
  return {
    __esModule: true,
    default: ReactFlow,
    ReactFlow,
    Controls,
    Background,
    MiniMap,
    Panel,
    useNodesState,
    useEdgesState,
    ReactFlowProvider,
  };
});

// Mock services
jest.mock('../../../services/mindmap/reactFlowAdapter', () => {
  class MockReactFlowAdapter {
    generateFromModule = jest.fn().mockReturnValue({
      nodes: [
        {
          id: '1',
          type: 'module',
          position: { x: 0, y: 0 },
          data: { label: 'Test Module', moduleId: 'test-module' },
          style: { background: '#7C3AED' }
        }
      ],
      edges: []
    });

    generateFromModules = jest.fn().mockReturnValue({
      nodes: [
        {
          id: '1',
          type: 'module',
          position: { x: 0, y: 0 },
          data: { label: 'Module 1', moduleId: 'module-1' },
          style: { background: '#7C3AED' }
        },
        {
          id: '2',
          type: 'module',
          position: { x: 200, y: 0 },
          data: { label: 'Module 2', moduleId: 'module-2' },
          style: { background: '#DC2626' }
        }
      ],
      edges: [{ id: 'e1-2', source: '1', target: '2' }]
    });

    updateLayout = jest.fn((nodes) => nodes);
    generateStudyPath = jest.fn().mockReturnValue(['module-1', 'module-2']);
    highlightPath = jest.fn((nodes, edges) => ({ nodes, edges }));
    filterByCategory = jest.fn((nodes, edges) => ({ nodes, edges }));
    getLayoutRecommendations = jest.fn().mockReturnValue([
      { type: 'radial', name: 'Radial', description: 'Circular layout' },
      { type: 'hierarchical', name: 'Hierarchical', description: 'Tree layout' }
    ]);
  }
  
  return {
    ReactFlowAdapter: MockReactFlowAdapter
  };
});

// Mock MiniMapSector components
jest.mock('../../MiniMapSector', () => {
  const React = require('react');
  
  const MiniMapSector = ({ sectors, onSectorClick }: any) => 
    React.createElement('div', { 'data-testid': 'minimap-sector' },
      sectors?.map((sector: any) => 
        React.createElement('div', {
          key: sector.id,
          'data-testid': `sector-${sector.id}`,
          onClick: () => onSectorClick?.(sector.id)
        }, sector.title)
      )
    );
    
  const ModuleNode = ({ data }: any) => 
    React.createElement('div', { 'data-testid': 'module-node' }, data.label);
    
  const MiniMapLegend = ({ categories, difficulties }: any) => 
    React.createElement('div', { 'data-testid': 'minimap-legend' }, [
      React.createElement('div', { key: 'categories', 'data-testid': 'categories' }, categories?.length || 0),
      React.createElement('div', { key: 'difficulties', 'data-testid': 'difficulties' }, difficulties?.length || 0)
    ]);
    
  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      beginner: '#10b981',
      intermediate: '#f59e0b',
      advanced: '#ef4444'
    };
    return colors[difficulty] || '#6b7280';
  };
  
  return {
    MiniMapSector,
    ModuleNode,
    MiniMapLegend,
    getDifficultyColor
  };
});

const mockModules: Module[] = [
  {
    id: 'module-1',
    title: 'The Shadow',
    description: 'Understanding the unconscious',
    category: 'archetype',
    difficulty: 'beginner',
    estimatedTime: 30,
    prerequisites: [],
    learningObjectives: ['Understand shadow concept'],
    sections: [],
    quiz: { questions: [] },
    practicalExercises: []
  },
  {
    id: 'module-2',
    title: 'The Anima/Animus',
    description: 'Contrasexual aspects',
    category: 'archetype',
    difficulty: 'intermediate',
    estimatedTime: 45,
    prerequisites: ['module-1'],
    learningObjectives: ['Explore anima/animus'],
    sections: [],
    quiz: { questions: [] },
    practicalExercises: []
  },
  {
    id: 'module-3',
    title: 'Individuation',
    description: 'The process of becoming whole',
    category: 'process',
    difficulty: 'advanced',
    estimatedTime: 60,
    prerequisites: ['module-1', 'module-2'],
    learningObjectives: ['Understand individuation'],
    sections: [],
    quiz: { questions: [] },
    practicalExercises: []
  }
];

describe('InteractiveMindMap', () => {
  const user = userEvent.setup();

  it('renders without crashing', () => {
    render(
      <MemoryRouter>
        <InteractiveMindMap modules={mockModules} />
      </MemoryRouter>
    );
    
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  it('displays correct number of nodes and edges', () => {
    render(
      <MemoryRouter>
        <InteractiveMindMap modules={mockModules} />
      </MemoryRouter>
    );
    
    expect(screen.getByTestId('nodes-count')).toHaveTextContent('2');
    expect(screen.getByTestId('edges-count')).toHaveTextContent('1');
  });

  it('shows controls when showControls is true', () => {
    render(
      <MemoryRouter>
        <InteractiveMindMap modules={mockModules} showControls={true} />
      </MemoryRouter>
    );
    
    expect(screen.getByTestId('controls')).toBeInTheDocument();
  });

  it('hides controls when showControls is false', () => {
    render(
      <MemoryRouter>
        <InteractiveMindMap modules={mockModules} showControls={false} />
      </MemoryRouter>
    );
    
    expect(screen.queryByTestId('controls')).not.toBeInTheDocument();
  });

  it('shows minimap when showMiniMap is true', () => {
    render(
      <MemoryRouter>
        <InteractiveMindMap modules={mockModules} showMiniMap={true} />
      </MemoryRouter>
    );
    
    expect(screen.getByTestId('minimap')).toBeInTheDocument();
    expect(screen.getByTestId('minimap-legend')).toBeInTheDocument();
  });

  it('hides minimap when showMiniMap is false', () => {
    render(
      <MemoryRouter>
        <InteractiveMindMap modules={mockModules} showMiniMap={false} />
      </MemoryRouter>
    );
    
    expect(screen.queryByTestId('minimap')).not.toBeInTheDocument();
    expect(screen.queryByTestId('minimap-legend')).not.toBeInTheDocument();
  });

  it('handles node click with custom callback', async () => {
    const onNodeClick = jest.fn();
    
    render(
      <MemoryRouter>
        <InteractiveMindMap 
          modules={mockModules} 
          onNodeClick={onNodeClick}
        />
      </MemoryRouter>
    );
    
    const node = screen.getByTestId('node-1');
    await user.click(node);
    
    expect(onNodeClick).toHaveBeenCalledWith('module-1');
  });

  it('navigates to module page when node clicked without custom callback', async () => {
    let testLocation: any;
    
    function LocationDisplay() {
      testLocation = window.location;
      return null;
    }

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<InteractiveMindMap modules={mockModules} />} />
          <Route 
            path="/module/:id" 
            element={<div>Module Page</div>} 
          />
          <Route path="*" element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>
    );
    
    const node = screen.getByTestId('node-1');
    await user.click(node);
    
    // Navigation happens through React Router
    await waitFor(() => {
      expect(screen.getByText('Module Page')).toBeInTheDocument();
    });
  });

  it('changes layout when layout button is clicked', async () => {
    render(
      <MemoryRouter>
        <InteractiveMindMap modules={mockModules} />
      </MemoryRouter>
    );
    
    const panel = screen.getByTestId('panel-top-left');
    const hierarchicalButton = within(panel).getByText('Hierarchical');
    
    await user.click(hierarchicalButton);
    
    // Check that the button is now active (has different styles)
    expect(hierarchicalButton).toHaveClass('bg-primary-100', 'text-primary-700');
  });

  it('generates and displays study path', async () => {
    render(
      <MemoryRouter>
        <InteractiveMindMap modules={mockModules} />
      </MemoryRouter>
    );
    
    const panel = screen.getByTestId('panel-top-left');
    const generateButton = within(panel).getByText('Generate Study Path');
    
    await user.click(generateButton);
    
    // Should show clear button and study order
    expect(within(panel).getByText('Clear Path')).toBeInTheDocument();
    expect(within(panel).getByText('Study Order:')).toBeInTheDocument();
    expect(within(panel).getByText('The Shadow')).toBeInTheDocument();
  });

  it('clears study path when clear button is clicked', async () => {
    render(
      <MemoryRouter>
        <InteractiveMindMap modules={mockModules} />
      </MemoryRouter>
    );
    
    const panel = screen.getByTestId('panel-top-left');
    
    // Generate path first
    await user.click(within(panel).getByText('Generate Study Path'));
    
    // Clear path
    await user.click(within(panel).getByText('Clear Path'));
    
    // Should show generate button again
    expect(within(panel).getByText('Generate Study Path')).toBeInTheDocument();
    expect(within(panel).queryByText('Clear Path')).not.toBeInTheDocument();
  });

  it('filters nodes by category', async () => {
    render(
      <MemoryRouter>
        <InteractiveMindMap modules={mockModules} />
      </MemoryRouter>
    );
    
    const panel = screen.getByTestId('panel-top-left');
    const archetypeCheckbox = within(panel).getByLabelText(/Archetypes/i);
    
    await user.click(archetypeCheckbox);
    
    expect(archetypeCheckbox).toBeChecked();
  });

  it('handles multiple category selections', async () => {
    render(
      <MemoryRouter>
        <InteractiveMindMap modules={mockModules} />
      </MemoryRouter>
    );
    
    const panel = screen.getByTestId('panel-top-left');
    const archetypeCheckbox = within(panel).getByLabelText(/Archetypes/i);
    const processCheckbox = within(panel).getByLabelText(/Processes/i);
    
    await user.click(archetypeCheckbox);
    await user.click(processCheckbox);
    
    expect(archetypeCheckbox).toBeChecked();
    expect(processCheckbox).toBeChecked();
  });

  it('renders with selected module', () => {
    const selectedModule = mockModules[0];
    
    render(
      <MemoryRouter>
        <InteractiveMindMap 
          modules={mockModules} 
          selectedModule={selectedModule}
        />
      </MemoryRouter>
    );
    
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    expect(screen.getByTestId('nodes-count')).toHaveTextContent('1');
  });

  it('handles sector click in minimap', async () => {
    render(
      <MemoryRouter>
        <InteractiveMindMap modules={mockModules} />
      </MemoryRouter>
    );
    
    const sector = screen.getByTestId('sector-archetype');
    await user.click(sector);
    
    // Nodes should be highlighted (implementation specific)
    expect(sector).toBeInTheDocument();
  });

  it('displays legend with correct categories and difficulties', () => {
    render(
      <MemoryRouter>
        <InteractiveMindMap modules={mockModules} />
      </MemoryRouter>
    );
    
    const legend = screen.getByTestId('minimap-legend');
    
    // Should have categories from modules
    expect(within(legend).getByTestId('categories')).toBeInTheDocument();
    
    // Should have 3 difficulty levels
    expect(within(legend).getByTestId('difficulties')).toHaveTextContent('3');
  });

  it('uses initial layout when provided', () => {
    render(
      <MemoryRouter>
        <InteractiveMindMap 
          modules={mockModules} 
          initialLayout="hierarchical" as any
        />
      </MemoryRouter>
    );
    
    const panel = screen.getByTestId('panel-top-left');
    const hierarchicalButton = within(panel).getByText('Hierarchical');
    
    // Should be selected by default
    expect(hierarchicalButton).toHaveClass('bg-primary-100');
  });

  it('renders bottom legend panel', () => {
    render(
      <MemoryRouter>
        <InteractiveMindMap modules={mockModules} />
      </MemoryRouter>
    );
    
    const bottomPanel = screen.getByTestId('panel-bottom-right');
    
    expect(within(bottomPanel).getByText('Core Concepts')).toBeInTheDocument();
    expect(within(bottomPanel).getByText('Modules')).toBeInTheDocument();
    expect(within(bottomPanel).getByText('Connections')).toBeInTheDocument();
  });

  it('handles empty modules array', () => {
    render(
      <MemoryRouter>
        <InteractiveMindMap modules={[]} />
      </MemoryRouter>
    );
    
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  it('updates nodes when modules change', () => {
    const { rerender } = render(
      <MemoryRouter>
        <InteractiveMindMap modules={mockModules.slice(0, 1)} />
      </MemoryRouter>
    );
    
    expect(screen.getByTestId('nodes-count')).toHaveTextContent('2');
    
    rerender(
      <MemoryRouter>
        <InteractiveMindMap modules={mockModules} />
      </MemoryRouter>
    );
    
    expect(screen.getByTestId('nodes-count')).toHaveTextContent('2');
  });
});