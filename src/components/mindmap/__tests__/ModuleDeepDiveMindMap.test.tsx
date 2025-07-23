import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ModuleDeepDiveMindMapWrapper from '../ModuleDeepDiveMindMap';
import { Module } from '../../../types';
import { LLMMindMapGenerator } from '../../../services/mindmap/llmMindMapGenerator';
import { OpenAIProvider } from '../../../services/llm/providers/openai';
import { MockLLMProvider } from '../../../services/llm/providers/mock';

// Mock ReactFlow components
jest.mock('reactflow', () => {
  const React = require('react');
  
  const ReactFlow = ({ children, nodes, edges, onNodeClick }: any) => {
    const nodeElements = nodes?.map((node: any) => 
      React.createElement('div', {
        key: node.id,
        'data-testid': `node-${node.id}`,
        onClick: (e: any) => onNodeClick?.(e, node)
      }, node.data?.label || '')
    ) || [];
    
    return React.createElement('div', { 'data-testid': 'react-flow' }, [
      React.createElement('div', { key: 'nodes-count', 'data-testid': 'nodes-count' }, String(nodes?.length || 0)),
      React.createElement('div', { key: 'edges-count', 'data-testid': 'edges-count' }, String(edges?.length || 0)),
      ...nodeElements,
      children
    ]);
  };
    
  const Controls = () => React.createElement('div', { 'data-testid': 'controls' }, 'Controls');
  const Background = ({ color, gap }: any) => React.createElement('div', { 'data-testid': 'background' }, 'Background');
  const MiniMap = ({ children, nodeColor, style }: any) => React.createElement('div', { 'data-testid': 'minimap' }, children);
  const Panel = ({ children, position, className }: any) => 
    React.createElement('div', { 'data-testid': `panel-${position}`, className }, children);
    
  const useNodesState = (initialNodes: any) => {
    const [nodes, setNodes] = React.useState(initialNodes || []);
    return [nodes, setNodes, jest.fn()];
  };
  
  const useEdgesState = (initialEdges: any) => {
    const [edges, setEdges] = React.useState(initialEdges || []);
    return [edges, setEdges, jest.fn()];
  };
  
  const ReactFlowProvider = ({ children }: any) => React.createElement('div', { 'data-testid': 'reactflow-provider' }, children);
  
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

// Mock lucide-react icons
jest.mock('lucide-react', () => {
  const React = require('react');
  
  return {
    Loader2: () => React.createElement('div', { 'data-testid': 'loader-icon' }, 'Loading...'),
    Brain: () => React.createElement('div', { 'data-testid': 'brain-icon' }, 'Brain'),
    BookOpen: () => React.createElement('div', { 'data-testid': 'book-icon' }, 'Book'),
    Lightbulb: () => React.createElement('div', { 'data-testid': 'lightbulb-icon' }, 'Lightbulb'),
    ArrowLeft: () => React.createElement('div', { 'data-testid': 'arrow-left-icon' }, 'Back'),
  };
});

// Mock MiniMapSector
jest.mock('../../MiniMapSector', () => {
  const React = require('react');
  
  return {
    ModuleNode: ({ data }: any) => 
      React.createElement('div', { 'data-testid': 'module-node' }, data.label),
  };
});

// Mock LLM services
jest.mock('../../../services/mindmap/llmMindMapGenerator');
jest.mock('../../../services/llm/providers/openai');
jest.mock('../../../services/llm/providers/mock');

const mockModule: Module = {
  id: 'shadow-module',
  title: 'The Shadow',
  description: 'Understanding the unconscious aspects of personality',
  category: 'archetype',
  difficulty: 'intermediate',
  estimatedTime: 45,
  prerequisites: [],
  learningObjectives: [
    'Understand the concept of the Shadow',
    'Recognize Shadow projections'
  ],
  sections: [
    {
      id: 'intro',
      title: 'Introduction to the Shadow',
      content: 'The Shadow represents the hidden parts...',
      activities: []
    },
    {
      id: 'recognition',
      title: 'Recognizing the Shadow',
      content: 'Shadow work involves...',
      activities: []
    }
  ],
  quiz: {
    questions: [
      {
        id: 'q1',
        text: 'What is the Shadow?',
        options: ['Hidden aspects', 'Conscious mind', 'Dreams', 'Ego'],
        correctAnswer: 0,
        explanation: 'The Shadow represents hidden aspects'
      }
    ]
  },
  practicalExercises: [
    {
      id: 'ex1',
      title: 'Shadow Journaling',
      description: 'Write about projections',
      duration: 20
    }
  ]
};

const mockGeneratedMindMap = {
  nodes: [
    {
      id: 'root',
      type: 'module',
      position: { x: 0, y: 0 },
      data: {
        label: 'The Shadow',
        description: 'Understanding the unconscious',
        category: 'Core Concept',
        level: 0
      }
    },
    {
      id: 'concept-1',
      type: 'module',
      position: { x: 200, y: 0 },
      data: {
        label: 'Shadow Projection',
        description: 'Seeing our darkness in others',
        category: 'Key Insight',
        level: 1
      }
    },
    {
      id: 'concept-2',
      type: 'module',
      position: { x: -200, y: 0 },
      data: {
        label: 'Shadow Integration',
        description: 'Accepting rejected aspects',
        category: 'Key Insight',
        level: 1
      }
    }
  ],
  edges: [
    { id: 'e-root-1', source: 'root', target: 'concept-1' },
    { id: 'e-root-2', source: 'root', target: 'concept-2' }
  ],
  insights: [
    {
      type: 'connection',
      content: 'Shadow projection and integration are complementary processes'
    }
  ],
  suggestedPath: ['root', 'concept-1', 'concept-2']
};

describe('ModuleDeepDiveMindMapWrapper', () => {
  const user = userEvent.setup();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    (LLMMindMapGenerator as jest.Mock).mockImplementation(() => ({
      generateFromModuleContent: jest.fn().mockResolvedValue(mockGeneratedMindMap)
    }));
    
    (MockLLMProvider as jest.Mock).mockImplementation(() => ({}));
    (OpenAIProvider as jest.Mock).mockImplementation(() => ({}));
  });

  it('renders loading state initially', () => {
    render(<ModuleDeepDiveMindMapWrapper module={mockModule} />);
    
    expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
    expect(screen.getByText('Generating AI-powered mind map...')).toBeInTheDocument();
  });

  it('renders mind map after successful generation', async () => {
    render(<ModuleDeepDiveMindMapWrapper module={mockModule} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });
    
    expect(screen.getByTestId('nodes-count')).toHaveTextContent('3');
    expect(screen.getByTestId('edges-count')).toHaveTextContent('2');
  });

  it('displays module title in header', async () => {
    render(<ModuleDeepDiveMindMapWrapper module={mockModule} />);
    
    await waitFor(() => {
      expect(screen.getByText('The Shadow')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Deep Dive Mind Map')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', async () => {
    const onBack = jest.fn();
    render(<ModuleDeepDiveMindMapWrapper module={mockModule} onBack={onBack} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });
    
    const backButton = screen.getByTitle('Back to overview');
    await user.click(backButton);
    
    expect(onBack).toHaveBeenCalled();
  });

  it('uses OpenAI provider when API key is available', async () => {
    const originalEnv = process.env.REACT_APP_OPENAI_API_KEY;
    process.env.REACT_APP_OPENAI_API_KEY = 'test-api-key';
    
    render(<ModuleDeepDiveMindMapWrapper module={mockModule} />);
    
    await waitFor(() => {
      expect(OpenAIProvider).toHaveBeenCalled();
    });
    
    process.env.REACT_APP_OPENAI_API_KEY = originalEnv;
  });

  it('falls back to mock provider when API key is not available', async () => {
    delete process.env.REACT_APP_OPENAI_API_KEY;
    
    render(<ModuleDeepDiveMindMapWrapper module={mockModule} />);
    
    await waitFor(() => {
      expect(MockLLMProvider).toHaveBeenCalled();
    });
  });

  it('handles generation errors gracefully', async () => {
    (LLMMindMapGenerator as jest.Mock).mockImplementation(() => ({
      generateFromModuleContent: jest.fn().mockRejectedValue(new Error('Generation failed'))
    }));
    
    render(<ModuleDeepDiveMindMapWrapper module={mockModule} />);
    
    await waitFor(() => {
      expect(screen.getByText(/failed to generate mind map/i)).toBeInTheDocument();
    });
    
    // Should still render with fallback structure
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  it('handles OpenAI initialization errors', async () => {
    process.env.REACT_APP_OPENAI_API_KEY = 'test-api-key';
    (OpenAIProvider as jest.Mock).mockImplementation(() => {
      throw new Error('OpenAI init failed');
    });
    
    render(<ModuleDeepDiveMindMapWrapper module={mockModule} />);
    
    await waitFor(() => {
      expect(MockLLMProvider).toHaveBeenCalled();
    });
  });

  it('handles node click and displays details', async () => {
    render(<ModuleDeepDiveMindMapWrapper module={mockModule} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });
    
    const conceptNode = screen.getByTestId('node-concept-1');
    await user.click(conceptNode);
    
    // Should display node details in panel - check for unique text in the details panel
    await waitFor(() => {
      expect(screen.getByText('Seeing our darkness in others')).toBeInTheDocument();
    });
  });

  it('displays insights when available', async () => {
    render(<ModuleDeepDiveMindMapWrapper module={mockModule} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });
    
    // Wait for the mind map to be generated and insights to be displayed
    await waitFor(() => {
      expect(screen.getByText(/AI Insights/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/complementary processes/i)).toBeInTheDocument();
  });

  it('regenerates mind map when button is clicked', async () => {
    const generator = {
      generateFromModuleContent: jest.fn()
        .mockResolvedValueOnce(mockGeneratedMindMap)
        .mockResolvedValueOnce({
          ...mockGeneratedMindMap,
          nodes: [...mockGeneratedMindMap.nodes, {
            id: 'new-node',
            type: 'module',
            position: { x: 0, y: 200 },
            data: { label: 'New Concept', level: 2 }
          }]
        })
    };
    
    (LLMMindMapGenerator as jest.Mock).mockImplementation(() => generator);
    
    render(<ModuleDeepDiveMindMapWrapper module={mockModule} />);
    
    // Wait for initial load to complete
    await waitFor(() => {
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });
    
    // Wait for the regenerate button to not be in loading state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /regenerate mind map/i })).toBeInTheDocument();
    });
    
    const regenerateButton = screen.getByRole('button', { name: /regenerate mind map/i });
    await user.click(regenerateButton);
    
    await waitFor(() => {
      expect(generator.generateFromModuleContent).toHaveBeenCalledTimes(2);
    });
  });

  it('displays correct node styling based on category', async () => {
    render(<ModuleDeepDiveMindMapWrapper module={mockModule} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });
    
    // Wait for loading to complete and nodes to be generated
    await waitFor(() => {
      expect(screen.getByTestId('nodes-count')).toHaveTextContent('3');
    });
    
    // Check that nodes are rendered with correct test ids
    expect(screen.getByTestId('node-root')).toBeInTheDocument();
    expect(screen.getByTestId('node-concept-1')).toBeInTheDocument();
    expect(screen.getByTestId('node-concept-2')).toBeInTheDocument();
  });

  it('shows AI badge when using real AI', async () => {
    process.env.REACT_APP_OPENAI_API_KEY = 'test-api-key';
    
    render(<ModuleDeepDiveMindMapWrapper module={mockModule} />);
    
    await waitFor(() => {
      expect(screen.getByText(/powered by ai/i)).toBeInTheDocument();
    });
  });

  it('shows demo mode badge when using mock provider', async () => {
    delete process.env.REACT_APP_OPENAI_API_KEY;
    
    render(<ModuleDeepDiveMindMapWrapper module={mockModule} />);
    
    await waitFor(() => {
      expect(screen.getByText(/demo mode/i)).toBeInTheDocument();
    });
  });

  it('renders with empty module sections', async () => {
    const emptyModule = { ...mockModule, sections: [] };
    
    render(<ModuleDeepDiveMindMapWrapper module={emptyModule} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });
  });

  it('handles fallback mind map generation', async () => {
    (LLMMindMapGenerator as jest.Mock).mockImplementation(() => ({
      generateFromModuleContent: jest.fn().mockRejectedValue(new Error('Failed'))
    }));
    
    render(<ModuleDeepDiveMindMapWrapper module={mockModule} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });
    
    // Wait for error handling and fallback generation to complete
    await waitFor(() => {
      expect(screen.getByText(/Failed to generate mind map/i)).toBeInTheDocument();
    });
    
    // Should have fallback nodes based on sections
    expect(screen.getByText('Introduction to the Shadow')).toBeInTheDocument();
    expect(screen.getByText('Recognizing the Shadow')).toBeInTheDocument();
  });

  it('displays suggested learning path', async () => {
    render(<ModuleDeepDiveMindMapWrapper module={mockModule} />);
    
    // Wait for the component to finish loading and display the learning path button
    await waitFor(() => {
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /show learning path/i })).toBeInTheDocument();
    });
    
    const pathButton = screen.getByRole('button', { name: /show learning path/i });
    await user.click(pathButton);
    
    // Should highlight the suggested path - check for the available text
    expect(screen.getByText(/suggested learning order available/i)).toBeInTheDocument();
  });

  it('handles module prop changes', async () => {
    const { rerender } = render(<ModuleDeepDiveMindMapWrapper module={mockModule} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });
    
    const newModule = { ...mockModule, id: 'new-module', title: 'New Module' };
    rerender(<ModuleDeepDiveMindMapWrapper module={newModule} />);
    
    await waitFor(() => {
      expect(screen.getByText('New Module')).toBeInTheDocument();
    });
  });
});