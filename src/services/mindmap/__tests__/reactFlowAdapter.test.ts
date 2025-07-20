import { ReactFlowAdapter } from '../reactFlowAdapter';
import { MindMapNode, MindMapEdge, Module } from '../../../types';
import { MindMapLayouts, LayoutType } from '../mindMapLayouts';

// Mock the generator
jest.mock('../mindMapGenerator', () => ({
  MindMapGenerator: jest.fn().mockImplementation(() => ({
    generateFromModule: jest.fn().mockResolvedValue({
      nodes: [
        { id: 'concept1', label: 'Concept 1', category: 'concept', position: { x: 0, y: 0 } },
        { id: 'concept2', label: 'Concept 2', category: 'concept', position: { x: 0, y: 0 } }
      ],
      edges: [
        { id: 'edge1', source: 'concept1', target: 'concept2' }
      ]
    })
  }))
}));

describe('ReactFlowAdapter', () => {
  let adapter: ReactFlowAdapter;
  let mockNodes: MindMapNode[];
  let mockEdges: MindMapEdge[];
  let mockModule: Module;

  beforeEach(() => {
    adapter = new ReactFlowAdapter();
    
    mockNodes = [
      { id: 'node1', label: 'Test Node 1', category: 'concept', position: { x: 100, y: 100 } },
      { id: 'node2', label: 'Test Node 2', category: 'theory', position: { x: 200, y: 200 } },
      { id: 'node3', label: 'Test Node 3', category: 'archetype', position: { x: 300, y: 300 } }
    ];
    
    mockEdges = [
      { id: 'edge1', source: 'node1', target: 'node2' },
      { id: 'edge2', source: 'node2', target: 'node3' }
    ];
    
    mockModule = {
      id: 'test-module',
      title: 'Test Module',
      description: 'A test module',
      difficulty: 'beginner',
      estimatedTime: 30,
      sections: [],
      videos: [],
      quiz: {
        questions: [],
        passingScore: 80
      },
      mindMap: {
        centerNode: 'Test Center',
        nodes: mockNodes,
        edges: mockEdges
      }
    };
  });

  describe('convertToReactFlow', () => {
    test('converts mind map nodes to React Flow format', () => {
      const result = adapter.convertToReactFlow(mockNodes, mockEdges);
      
      expect(result.nodes).toHaveLength(3);
      expect(result.edges).toHaveLength(2);
      
      // Check node structure
      result.nodes.forEach((node, index) => {
        expect(node.id).toBe(mockNodes[index].id);
        expect(node.data.label).toBe(mockNodes[index].label);
        expect(node.position).toBeDefined();
        expect(node.type).toBe('default');
      });
      
      // Check edge structure
      result.edges.forEach((edge, index) => {
        expect(edge.id).toBe(mockEdges[index].id);
        expect(edge.source).toBe(mockEdges[index].source);
        expect(edge.target).toBe(mockEdges[index].target);
      });
    });

    test('handles empty nodes and edges', () => {
      const result = adapter.convertToReactFlow([], []);
      
      expect(result.nodes).toEqual([]);
      expect(result.edges).toEqual([]);
    });

    test('applies category-based styling', () => {
      const result = adapter.convertToReactFlow(mockNodes, mockEdges);
      
      result.nodes.forEach(node => {
        expect(node.style).toBeDefined();
        expect(node.className).toContain('mindmap-node');
      });
    });
  });

  describe('convertFromReactFlow', () => {
    test('converts React Flow nodes back to mind map format', () => {
      const reactFlowData = adapter.convertToReactFlow(mockNodes, mockEdges);
      const result = adapter.convertFromReactFlow(reactFlowData.nodes, reactFlowData.edges);
      
      expect(result.nodes).toHaveLength(3);
      expect(result.edges).toHaveLength(2);
      
      // Check that conversion preserves essential data
      result.nodes.forEach((node, index) => {
        expect(node.id).toBe(mockNodes[index].id);
        expect(node.label).toBe(mockNodes[index].label);
        expect(node.category).toBe(mockNodes[index].category);
      });
    });
  });

  describe('generateFromModule', () => {
    test('generates React Flow data from module', async () => {
      const result = await adapter.generateFromModule(mockModule);
      
      expect(result.nodes).toBeDefined();
      expect(result.edges).toBeDefined();
      expect(result.nodes.length).toBeGreaterThan(0);
    });

    test('handles module without mind map data', async () => {
      const moduleWithoutMindMap = { ...mockModule, mindMap: undefined };
      
      const result = await adapter.generateFromModule(moduleWithoutMindMap);
      
      expect(result.nodes).toBeDefined();
      expect(result.edges).toBeDefined();
    });
  });

  describe('applyLayout', () => {
    test('applies layout to React Flow data', () => {
      const reactFlowData = adapter.convertToReactFlow(mockNodes, mockEdges);
      const result = adapter.applyLayout(reactFlowData.nodes, reactFlowData.edges, LayoutType.HIERARCHICAL);
      
      expect(result.nodes).toHaveLength(3);
      expect(result.edges).toHaveLength(2);
      
      // Check that positions were updated
      result.nodes.forEach(node => {
        expect(typeof node.position.x).toBe('number');
        expect(typeof node.position.y).toBe('number');
      });
    });
  });

  describe('generateStudyPath', () => {
    test('generates optimal study path from nodes', () => {
      const result = adapter.generateStudyPath(mockNodes, mockEdges);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      // Check that all returned nodes exist in original set
      result.forEach(nodeId => {
        expect(mockNodes.some(node => node.id === nodeId)).toBe(true);
      });
    });

    test('handles disconnected components in study path', () => {
      const disconnectedNodes = [
        ...mockNodes,
        { id: 'isolated', label: 'Isolated Node', category: 'concept', position: { x: 400, y: 400 } }
      ];
      
      const result = adapter.generateStudyPath(disconnectedNodes, mockEdges);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('filterByCategory', () => {
    test('filters nodes by category', () => {
      const reactFlowData = adapter.convertToReactFlow(mockNodes, mockEdges);
      const result = adapter.filterByCategory(reactFlowData.nodes, reactFlowData.edges, 'concept');
      
      expect(result.nodes.length).toBeLessThanOrEqual(mockNodes.length);
      
      // All returned nodes should be of the specified category
      result.nodes.forEach(node => {
        const originalNode = mockNodes.find(n => n.id === node.id);
        expect(originalNode?.category).toBe('concept');
      });
    });

    test('handles non-existent category', () => {
      const reactFlowData = adapter.convertToReactFlow(mockNodes, mockEdges);
      const result = adapter.filterByCategory(reactFlowData.nodes, reactFlowData.edges, 'nonexistent');
      
      expect(result.nodes).toEqual([]);
      expect(result.edges).toEqual([]);
    });
  });

  describe('highlightPath', () => {
    test('highlights nodes in a study path', () => {
      const reactFlowData = adapter.convertToReactFlow(mockNodes, mockEdges);
      const path = ['node1', 'node2'];
      
      const result = adapter.highlightPath(reactFlowData.nodes, reactFlowData.edges, path);
      
      expect(result.nodes).toHaveLength(3);
      
      // Check that highlighted nodes have proper styling
      const highlightedNodes = result.nodes.filter(node => path.includes(node.id));
      highlightedNodes.forEach(node => {
        expect(node.className).toContain('highlighted');
      });
    });
  });

  describe('suggestLayout', () => {
    test('suggests appropriate layout for graph structure', () => {
      const suggestion = adapter.suggestLayout(mockNodes, mockEdges);
      
      expect(Object.values(LayoutType)).toContain(suggestion);
    });

    test('handles empty graph', () => {
      const suggestion = adapter.suggestLayout([], []);
      
      expect(Object.values(LayoutType)).toContain(suggestion);
    });
  });

  describe('Error Handling', () => {
    test('handles malformed node data gracefully', () => {
      const malformedNodes = [
        { id: 'bad1', label: '', category: 'concept', position: { x: NaN, y: 0 } },
        { id: 'bad2', label: 'Good Label', category: '', position: { x: 0, y: NaN } }
      ];
      
      const result = adapter.convertToReactFlow(malformedNodes, []);
      
      expect(result.nodes).toHaveLength(2);
      result.nodes.forEach(node => {
        expect(typeof node.position.x).toBe('number');
        expect(typeof node.position.y).toBe('number');
        expect(isNaN(node.position.x)).toBe(false);
        expect(isNaN(node.position.y)).toBe(false);
      });
    });

    test('handles malformed edge data gracefully', () => {
      const malformedEdges = [
        { id: 'bad1', source: '', target: 'node2' },
        { id: 'bad2', source: 'node1', target: '' }
      ];
      
      const result = adapter.convertToReactFlow(mockNodes, malformedEdges);
      
      expect(result.edges).toHaveLength(0); // Malformed edges should be filtered out
    });
  });
});