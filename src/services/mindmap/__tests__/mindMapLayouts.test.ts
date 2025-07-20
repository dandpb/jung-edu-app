import { MindMapLayouts, LayoutType, LayoutConfig } from '../mindMapLayouts';
import { MindMapNode, MindMapEdge } from '../../../types';

describe('MindMapLayouts', () => {
  let layouts: MindMapLayouts;
  let mockNodes: MindMapNode[];
  let mockEdges: MindMapEdge[];
  
  beforeEach(() => {
    layouts = new MindMapLayouts();
    
    mockNodes = [
      { id: 'node1', label: 'Node 1', category: 'concept', position: { x: 0, y: 0 } },
      { id: 'node2', label: 'Node 2', category: 'concept', position: { x: 0, y: 0 } },
      { id: 'node3', label: 'Node 3', category: 'concept', position: { x: 0, y: 0 } }
    ];
    
    mockEdges = [
      { id: 'edge1', source: 'node1', target: 'node2' },
      { id: 'edge2', source: 'node1', target: 'node3' }
    ];
  });

  describe('Basic Layout Application', () => {
    test('applies hierarchical layout correctly', () => {
      const result = layouts.applyLayout(mockNodes, mockEdges, LayoutType.HIERARCHICAL);
      
      expect(result.nodes).toHaveLength(3);
      expect(result.edges).toEqual(mockEdges);
      
      // Check that positions have been updated
      result.nodes.forEach(node => {
        expect(typeof node.position.x).toBe('number');
        expect(typeof node.position.y).toBe('number');
      });
    });

    test('applies radial layout correctly', () => {
      const result = layouts.applyLayout(mockNodes, mockEdges, LayoutType.RADIAL);
      
      expect(result.nodes).toHaveLength(3);
      expect(result.edges).toEqual(mockEdges);
      
      // Check that positions are different from original
      result.nodes.forEach((node, index) => {
        expect(node.position.x).not.toBe(mockNodes[index].position.x);
        expect(node.position.y).not.toBe(mockNodes[index].position.y);
      });
    });

    test('applies force-directed layout correctly', () => {
      const result = layouts.applyLayout(mockNodes, mockEdges, LayoutType.FORCE_DIRECTED);
      
      expect(result.nodes).toHaveLength(3);
      expect(result.edges).toEqual(mockEdges);
    });

    test('applies circular layout correctly', () => {
      const result = layouts.applyLayout(mockNodes, mockEdges, LayoutType.CIRCULAR);
      
      expect(result.nodes).toHaveLength(3);
      expect(result.edges).toEqual(mockEdges);
    });

    test('applies tree layout correctly', () => {
      const result = layouts.applyLayout(mockNodes, mockEdges, LayoutType.TREE);
      
      expect(result.nodes).toHaveLength(3);
      expect(result.edges).toEqual(mockEdges);
    });
  });

  describe('Configuration Handling', () => {
    test('uses custom configuration', () => {
      const customConfig: Partial<LayoutConfig> = {
        width: 1600,
        height: 1000,
        padding: 100
      };
      
      const result = layouts.applyLayout(mockNodes, mockEdges, LayoutType.HIERARCHICAL, customConfig);
      
      expect(result.nodes).toHaveLength(3);
    });

    test('falls back to default configuration', () => {
      const result = layouts.applyLayout(mockNodes, mockEdges, LayoutType.HIERARCHICAL);
      
      expect(result.nodes).toHaveLength(3);
    });
  });

  describe('Layout Recommendations', () => {
    test('suggests appropriate layout for different graph structures', () => {
      const suggestion = layouts.suggestOptimalLayout(mockNodes, mockEdges);
      
      expect(Object.values(LayoutType)).toContain(suggestion);
    });
  });

  describe('Edge Cases', () => {
    test('handles empty node array', () => {
      const emptyNodes: MindMapNode[] = [];
      const emptyEdges: MindMapEdge[] = [];
      
      const result = layouts.applyLayout(emptyNodes, emptyEdges, LayoutType.HIERARCHICAL);
      expect(result.nodes).toEqual([]);
      expect(result.edges).toEqual([]);
    });

    test('handles single node', () => {
      const singleNode = [mockNodes[0]];
      const noEdges: MindMapEdge[] = [];
      
      const result = layouts.applyLayout(singleNode, noEdges, LayoutType.HIERARCHICAL);
      expect(result.nodes).toHaveLength(1);
      expect(result.edges).toEqual([]);
    });

    test('handles disconnected components', () => {
      const disconnectedNodes = [
        ...mockNodes,
        { id: 'isolated', label: 'Isolated', category: 'concept', position: { x: 0, y: 0 } }
      ];
      
      const result = layouts.applyLayout(disconnectedNodes, mockEdges, LayoutType.HIERARCHICAL);
      expect(result.nodes).toHaveLength(4);
    });
  });

  describe('Performance', () => {
    test('handles large graphs efficiently', () => {
      const largeNodes: MindMapNode[] = Array.from({ length: 100 }, (_, i) => ({
        id: `node${i}`,
        label: `Node ${i}`,
        category: 'concept',
        position: { x: 0, y: 0 }
      }));
      
      const largeEdges: MindMapEdge[] = Array.from({ length: 99 }, (_, i) => ({
        id: `edge${i}`,
        source: `node${i}`,
        target: `node${i + 1}`
      }));
      
      const startTime = performance.now();
      const result = layouts.applyLayout(largeNodes, largeEdges, LayoutType.HIERARCHICAL);
      const endTime = performance.now();
      
      expect(result.nodes).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
    });
  });

  describe('Utility Functions', () => {
    test('prepares nodes for layout correctly', () => {
      const result = layouts.applyLayout(mockNodes, mockEdges, LayoutType.HIERARCHICAL);
      
      expect(result.nodes).toHaveLength(mockNodes.length);
      result.nodes.forEach(node => {
        expect(node.id).toBeDefined();
        expect(node.label).toBeDefined();
        expect(node.position).toBeDefined();
      });
    });
  });
});