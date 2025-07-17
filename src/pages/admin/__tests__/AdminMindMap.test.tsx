import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminMindMap from '../AdminMindMap';
import { MindMapNode, MindMapEdge } from '../../../types';

// Mock ReactFlow components
jest.mock('reactflow', () => {
  const React = require('react');
  return {
    ...jest.requireActual('reactflow'),
    __esModule: true,
    default: ({ children, nodes, edges, onNodeClick, onNodeDoubleClick, onConnect }: any) => (
      <div data-testid="react-flow">
        <div>Nodes: {nodes.length}</div>
        <div>Edges: {edges.length}</div>
        {nodes.map((node: any) => (
          <div 
            key={node.id} 
            data-testid={`node-${node.id}`}
            onClick={(e) => onNodeClick && onNodeClick(e, node)}
            onDoubleClick={(e) => onNodeDoubleClick && onNodeDoubleClick(e, node)}
          >
            {node.data.label}
          </div>
        ))}
        {children}
      </div>
    ),
    ReactFlowProvider: ({ children }: any) => <div>{children}</div>,
    Controls: () => <div data-testid="controls">Controls</div>,
    Background: () => <div data-testid="background">Background</div>,
    Panel: ({ children, position }: any) => <div data-testid={`panel-${position}`}>{children}</div>,
    useNodesState: (initialNodes: any) => {
      const [nodes, setNodes] = React.useState(initialNodes);
      return [nodes, setNodes, jest.fn()];
    },
    useEdgesState: (initialEdges: any) => {
      const [edges, setEdges] = React.useState(initialEdges);
      return [edges, setEdges, jest.fn()];
    },
    addEdge: jest.fn((edge, edges) => [...edges, edge]),
    ConnectionMode: { Loose: 'loose' },
    MarkerType: { ArrowClosed: 'arrowClosed' }
  };
});

// Mock the useAdmin hook
jest.mock('../../../contexts/AdminContext', () => ({
  useAdmin: jest.fn()
}));

const mockNodes: MindMapNode[] = [
  {
    id: 'node-1',
    type: 'default',
    position: { x: 100, y: 100 },
    data: {
      label: 'Jung',
      description: 'Carl Gustav Jung'
    }
  },
  {
    id: 'node-2',
    type: 'default',
    position: { x: 200, y: 200 },
    data: {
      label: 'Collective Unconscious',
      description: 'Shared psychic system'
    }
  },
  {
    id: 'node-3',
    type: 'default',
    position: { x: 300, y: 300 },
    data: {
      label: 'Archetypes',
      description: 'Universal patterns'
    }
  }
];

const mockEdges: MindMapEdge[] = [
  {
    id: 'edge-1',
    source: 'node-1',
    target: 'node-2',
    type: 'smoothstep'
  },
  {
    id: 'edge-2',
    source: 'node-2',
    target: 'node-3',
    type: 'smoothstep'
  }
];

const mockUpdateMindMap = jest.fn();

const mockUseAdmin = () => ({
  isAdmin: true,
  currentAdmin: { username: 'admin', role: 'admin', lastLogin: Date.now() },
  login: jest.fn(),
  logout: jest.fn(),
  modules: [],
  updateModules: jest.fn(),
  mindMapNodes: mockNodes,
  mindMapEdges: mockEdges,
  updateMindMap: mockUpdateMindMap
});

// Mock window methods
const mockAlert = jest.fn();
const mockCreateObjectURL = jest.fn(() => 'mock-url');
const mockRevokeObjectURL = jest.fn();

describe('AdminMindMap Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    const { useAdmin } = require('../../../contexts/AdminContext');
    (useAdmin as jest.Mock).mockReturnValue(mockUseAdmin());
    
    // Mock window methods
    window.alert = mockAlert;
    window.URL.createObjectURL = mockCreateObjectURL;
    window.URL.revokeObjectURL = mockRevokeObjectURL;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders mind map editor with correct title and description', () => {
    render(<AdminMindMap />);
    
    expect(screen.getByText('Mind Map Editor')).toBeInTheDocument();
    expect(screen.getByText('Create and edit the interactive concept mind map')).toBeInTheDocument();
  });

  test('renders add node and save changes buttons', () => {
    render(<AdminMindMap />);
    
    expect(screen.getByRole('button', { name: /Add Node/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save Changes/i })).toBeInTheDocument();
  });

  test('displays correct number of nodes and edges', () => {
    render(<AdminMindMap />);
    
    expect(screen.getByText('Nodes: 3')).toBeInTheDocument();
    expect(screen.getByText('Edges: 2')).toBeInTheDocument();
  });

  test('renders all nodes with correct labels and categories', () => {
    render(<AdminMindMap />);
    
    expect(screen.getByText('Jung')).toBeInTheDocument();
    expect(screen.getByText('Collective Unconscious')).toBeInTheDocument();
    expect(screen.getByText('Archetypes')).toBeInTheDocument();
  });

  test('renders ReactFlow controls and background', () => {
    render(<AdminMindMap />);
    
    expect(screen.getByTestId('controls')).toBeInTheDocument();
    expect(screen.getByTestId('background')).toBeInTheDocument();
  });

  test('clicking add node button shows node form', async () => {
    render(<AdminMindMap />);
    
    const addButton = screen.getByRole('button', { name: /Add Node/i });
    await user.click(addButton);
    
    expect(screen.getByText('Add New Node')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter node label')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument(); // Category select
    expect(screen.getByPlaceholderText('Enter node description')).toBeInTheDocument();
  });

  test('can fill and submit node form to add new node', async () => {
    render(<AdminMindMap />);
    
    // Open form
    await user.click(screen.getByRole('button', { name: /Add Node/i }));
    
    // Fill form
    await user.type(screen.getByPlaceholderText('Enter node label'), 'Shadow');
    await user.selectOptions(screen.getByRole('combobox'), 'primary');
    await user.type(screen.getByPlaceholderText('Enter node description'), 'The dark side of personality');
    
    // Submit form - look for the button with exact text "Add Node" inside the form
    const addNodeButtons = screen.getAllByRole('button', { name: 'Add Node' });
    const formAddButton = addNodeButtons.find(btn => btn.className.includes('btn-primary') && !btn.querySelector('svg'));
    expect(formAddButton).toBeDefined();
    await user.click(formAddButton!);
    
    // Form should close
    expect(screen.queryByText('Add New Node')).not.toBeInTheDocument();
  });

  test('can cancel adding a node', async () => {
    render(<AdminMindMap />);
    
    await user.click(screen.getByRole('button', { name: /Add Node/i }));
    expect(screen.getByText('Add New Node')).toBeInTheDocument();
    
    await user.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(screen.queryByText('Add New Node')).not.toBeInTheDocument();
  });

  test('clicking on a node selects it', async () => {
    render(<AdminMindMap />);
    
    const jungNode = screen.getByTestId('node-node-1');
    fireEvent.click(jungNode);
    
    // Should show selected node panel with "Selected Node" header
    await waitFor(() => {
      expect(screen.getByText('Selected Node')).toBeInTheDocument();
    });
  });

  test('double clicking on a node opens edit mode', async () => {
    render(<AdminMindMap />);
    
    const jungNode = screen.getByTestId('node-node-1');
    fireEvent.doubleClick(jungNode);
    
    // Should show edit form
    expect(screen.getByDisplayValue('Jung')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Carl Gustav Jung')).toBeInTheDocument();
  });

  test('can save edited node', async () => {
    render(<AdminMindMap />);
    
    // Double click to edit
    const jungNode = screen.getByTestId('node-node-1');
    fireEvent.doubleClick(jungNode);
    
    // Edit label
    const labelInput = screen.getByDisplayValue('Jung');
    await user.clear(labelInput);
    await user.type(labelInput, 'C.G. Jung');
    
    // Save button is a green check icon button in the Edit Node panel
    const editPanel = screen.getByText('Edit Node').closest('div');
    const saveButton = editPanel?.querySelector('button.text-green-600');
    expect(saveButton).toBeDefined();
    fireEvent.click(saveButton!);
    
    // Edit form should close - editing state should be cleared
    await waitFor(() => {
      expect(screen.queryByText('Edit Node')).not.toBeInTheDocument();
    });
  });

  test('can cancel editing a node', async () => {
    render(<AdminMindMap />);
    
    const jungNode = screen.getByTestId('node-node-1');
    fireEvent.doubleClick(jungNode);
    
    expect(screen.getByDisplayValue('Jung')).toBeInTheDocument();
    
    // Cancel button is a red X icon button in the Edit Node panel
    const editPanel = screen.getByText('Edit Node').closest('div');
    const cancelButton = editPanel?.querySelector('button.text-red-600');
    expect(cancelButton).toBeDefined();
    fireEvent.click(cancelButton!);
    
    // Edit form should close
    await waitFor(() => {
      expect(screen.queryByText('Edit Node')).not.toBeInTheDocument();
    });
  });

  test('can delete selected node', async () => {
    render(<AdminMindMap />);
    
    // Select a node
    const jungNode = screen.getByTestId('node-node-1');
    fireEvent.click(jungNode);
    
    // Wait for selected node panel to appear
    await waitFor(() => {
      expect(screen.getByText('Selected Node')).toBeInTheDocument();
    });
    
    // Delete button is in the selected node panel - look for red trash icon button
    const selectedNodePanel = screen.getByText('Selected Node').closest('div');
    const deleteButton = selectedNodePanel?.querySelector('button.text-red-600');
    expect(deleteButton).toBeDefined();
    await user.click(deleteButton!);
    
    // Node should be deleted
    await waitFor(() => {
      expect(screen.getByText('Nodes: 2')).toBeInTheDocument(); // Should have 2 nodes instead of 3
    });
  });

  test('save changes button calls updateMindMap and shows success message', async () => {
    render(<AdminMindMap />);
    
    const saveButton = screen.getByRole('button', { name: /Save Changes/i });
    await user.click(saveButton);
    
    expect(mockUpdateMindMap).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 'node-1' }),
        expect.objectContaining({ id: 'node-2' }),
        expect.objectContaining({ id: 'node-3' })
      ]),
      expect.arrayContaining([
        expect.objectContaining({ id: 'edge-1' }),
        expect.objectContaining({ id: 'edge-2' })
      ])
    );
    
    expect(mockAlert).toHaveBeenCalledWith('Mind map saved successfully!');
  });

  test('export button creates and downloads JSON file', async () => {
    render(<AdminMindMap />);
    
    // Create mock elements
    const mockAnchor = document.createElement('a');
    const clickSpy = jest.spyOn(mockAnchor, 'click');
    jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
    
    const exportButton = screen.getByRole('button', { name: /Export/i });
    await user.click(exportButton);
    
    // Verify file creation
    expect(mockCreateObjectURL).toHaveBeenCalledWith(
      expect.any(Blob)
    );
    expect(mockAnchor.download).toMatch(/jung-mindmap-\d+\.json/);
    expect(clickSpy).toHaveBeenCalled();
    
    // Wait for cleanup timeout if the component uses setTimeout
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(mockRevokeObjectURL).toHaveBeenCalled();
  });

  test('import button handles file upload correctly', async () => {
    render(<AdminMindMap />);
    
    const fileContent = JSON.stringify({
      nodes: [{ id: 'imported-1', data: { label: 'Imported Node' } }],
      edges: [],
      timestamp: new Date().toISOString()
    });
    
    const file = new File([fileContent], 'mindmap.json', { type: 'application/json' });
    
    const input = screen.getByLabelText(/Import/i);
    await user.upload(input, file);
    
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Mind map imported successfully!');
    });
  });

  test('import shows error for invalid file format', async () => {
    render(<AdminMindMap />);
    
    const file = new File(['invalid json'], 'bad.json', { type: 'application/json' });
    
    const input = screen.getByLabelText(/Import/i);
    await user.upload(input, file);
    
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Failed to import mind map. Please check the file format.');
    });
  });

  test('renders toolbar panels with correct controls', () => {
    render(<AdminMindMap />);
    
    expect(screen.getByTestId('panel-top-left')).toBeInTheDocument();
    expect(screen.getByTestId('panel-bottom-left')).toBeInTheDocument();
    expect(screen.getByText('Node Categories')).toBeInTheDocument();
    expect(screen.getByText('Export')).toBeInTheDocument();
    expect(screen.getByText('Import')).toBeInTheDocument();
  });

  test('handles empty nodes and edges gracefully', () => {
    const { useAdmin } = require('../../../contexts/AdminContext');
    (useAdmin as jest.Mock).mockReturnValue({
      ...mockUseAdmin(),
      mindMapNodes: [],
      mindMapEdges: []
    });
    
    render(<AdminMindMap />);
    
    expect(screen.getByText('Nodes: 0')).toBeInTheDocument();
    expect(screen.getByText('Edges: 0')).toBeInTheDocument();
  });
});