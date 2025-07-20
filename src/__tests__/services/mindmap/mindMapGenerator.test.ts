import { MindMapGenerator } from '../../../services/mindmap/mindMapGenerator';
import { MindMapNode, MindMapEdge } from '../../../types';

describe('MindMapGenerator', () => {
  let generator: MindMapGenerator;
  
  beforeEach(() => {
    generator = new MindMapGenerator();
  });
  
  describe('generateMindMap', () => {
    it('should generate a mind map from concepts', () => {
      const concepts = ['Jungian Psychology', 'Collective Unconscious', 'Archetypes', 'Shadow', 'Anima/Animus'];
      const result = generator.generateMindMap(concepts, 'Jungian Psychology');
      
      // Check nodes
      expect(result.nodes).toHaveLength(concepts.length);
      expect(result.nodes[0].data.label).toBe('Jungian Psychology');
      expect(result.nodes[0].data.level).toBe(0); // Root node
      
      // Check edges
      expect(result.edges.length).toBeGreaterThan(0);
      expect(result.edges[0].source).toBe(result.nodes[0].id);
    });
    
    it('should create hierarchical structure', () => {
      const concepts = [
        'Psychology',
        'Analytical Psychology',
        'Collective Unconscious',
        'Personal Unconscious',
        'Consciousness'
      ];
      
      const result = generator.generateMindMap(concepts, 'Psychology');
      
      // Verify hierarchy levels
      const rootNode = result.nodes.find(n => n.data.label === 'Psychology');
      const level1Nodes = result.nodes.filter(n => n.data.level === 1);
      const level2Nodes = result.nodes.filter(n => n.data.level === 2);
      
      expect(rootNode?.data.level).toBe(0);
      expect(level1Nodes.length).toBeGreaterThan(0);
      expect(level2Nodes.length).toBeGreaterThan(0);
    });
    
    it('should assign categories to nodes', () => {
      const concepts = ['Shadow', 'Persona', 'Self', 'Anima', 'Animus'];
      const result = generator.generateMindMap(concepts, 'Archetypes');
      
      result.nodes.forEach(node => {
        expect(node.data.category).toBeDefined();
        expect(['main', 'core-concept', 'sub-concept', 'detail']).toContain(node.data.category);
      });
    });
    
    it('should handle empty concepts array', () => {
      const result = generator.generateMindMap([], 'Empty');
      
      expect(result.nodes).toHaveLength(1); // Only root node
      expect(result.edges).toHaveLength(0);
    });
    
    it('should handle duplicate concepts', () => {
      const concepts = ['Shadow', 'Shadow', 'Persona', 'Shadow'];
      const result = generator.generateMindMap(concepts, 'Archetypes');
      
      // Should remove duplicates
      const uniqueLabels = new Set(result.nodes.map(n => n.data.label));
      expect(uniqueLabels.size).toBe(3); // Archetypes, Shadow, Persona
    });
  });
  
  describe('generateConceptMap', () => {
    it('should create interconnected concept map', () => {
      const concepts = {
        'Individuation': ['Shadow Integration', 'Self Realization'],
        'Shadow': ['Repressed Content', 'Dark Side'],
        'Self': ['Wholeness', 'Unity']
      };
      
      const result = generator.generateConceptMap(concepts);
      
      // Check all concepts are represented
      Object.keys(concepts).forEach(concept => {
        expect(result.nodes.some(n => n.data.label === concept)).toBe(true);
      });
      
      // Check relationships
      const shadowNode = result.nodes.find(n => n.data.label === 'Shadow');
      const relatedEdges = result.edges.filter(e => 
        e.source === shadowNode?.id || e.target === shadowNode?.id
      );
      expect(relatedEdges.length).toBeGreaterThan(0);
    });
    
    it('should detect and create cross-connections', () => {
      const concepts = {
        'Consciousness': ['Ego', 'Awareness'],
        'Unconscious': ['Shadow', 'Archetypes'],
        'Ego': ['Identity', 'Persona'],
        'Shadow': ['Repression', 'Projection']
      };
      
      const result = generator.generateConceptMap(concepts);
      
      // Find cross-connections (e.g., Ego appears in both Consciousness and as its own concept)
      const egoNode = result.nodes.find(n => n.data.label === 'Ego');
      const egoEdges = result.edges.filter(e => 
        e.source === egoNode?.id || e.target === egoNode?.id
      );
      
      expect(egoEdges.length).toBeGreaterThanOrEqual(2);
    });
  });
  
  describe('layout algorithms', () => {
    it('should apply hierarchical layout', () => {
      const concepts = ['Root', 'Child1', 'Child2', 'Grandchild1'];
      const result = generator.generateMindMap(concepts, 'Root', {
        layout: 'hierarchical',
        direction: 'TB'
      });
      
      // Check vertical arrangement (top to bottom)
      const rootNode = result.nodes.find(n => n.data.label === 'Root');
      const childNodes = result.nodes.filter(n => n.data.level === 1);
      
      childNodes.forEach(child => {
        expect(child.position.y).toBeGreaterThan(rootNode!.position.y);
      });
    });
    
    it('should apply radial layout', () => {
      const concepts = ['Center', 'Node1', 'Node2', 'Node3', 'Node4'];
      const result = generator.generateMindMap(concepts, 'Center', {
        layout: 'radial'
      });
      
      const centerNode = result.nodes.find(n => n.data.label === 'Center');
      const peripheralNodes = result.nodes.filter(n => n.data.level === 1);
      
      // Check nodes are arranged in a circle around center
      peripheralNodes.forEach(node => {
        const distance = Math.sqrt(
          Math.pow(node.position.x - centerNode!.position.x, 2) +
          Math.pow(node.position.y - centerNode!.position.y, 2)
        );
        expect(distance).toBeCloseTo(200, 0); // Default radius
      });
    });
    
    it('should apply force-directed layout', () => {
      const concepts = ['A', 'B', 'C', 'D', 'E'];
      const result = generator.generateMindMap(concepts, 'A', {
        layout: 'force-directed'
      });
      
      // Force-directed should spread nodes out
      const distances: number[] = [];
      for (let i = 0; i < result.nodes.length; i++) {
        for (let j = i + 1; j < result.nodes.length; j++) {
          const dist = Math.sqrt(
            Math.pow(result.nodes[i].position.x - result.nodes[j].position.x, 2) +
            Math.pow(result.nodes[i].position.y - result.nodes[j].position.y, 2)
          );
          distances.push(dist);
        }
      }
      
      // Average distance should be reasonable
      const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
      expect(avgDistance).toBeGreaterThan(50);
    });
  });
  
  describe('style customization', () => {
    it('should apply custom node styles', () => {
      const concepts = ['Main', 'Sub1', 'Sub2'];
      const customStyles = {
        nodeStyles: {
          main: { backgroundColor: '#ff0000', fontSize: 20 },
          'core-concept': { backgroundColor: '#00ff00', fontSize: 16 }
        }
      };
      
      const result = generator.generateMindMap(concepts, 'Main', customStyles);
      
      const mainNode = result.nodes.find(n => n.data.label === 'Main');
      expect(mainNode?.style?.backgroundColor).toBe('#ff0000');
      expect(mainNode?.style?.fontSize).toBe(20);
    });
    
    it('should apply custom edge styles', () => {
      const concepts = ['A', 'B', 'C'];
      const customStyles = {
        edgeStyles: {
          default: { strokeWidth: 3, stroke: '#0000ff' },
          animated: { animated: true, strokeDasharray: '5 5' }
        }
      };
      
      const result = generator.generateMindMap(concepts, 'A', customStyles);
      
      result.edges.forEach(edge => {
        expect(edge.style).toBeDefined();
        expect(edge.style?.strokeWidth).toBe(3);
      });
    });
  });
  
  describe('interactive features', () => {
    it('should add interaction handlers to nodes', () => {
      const concepts = ['Interactive', 'Node1', 'Node2'];
      const result = generator.generateMindMap(concepts, 'Interactive', {
        interactive: true
      });
      
      result.nodes.forEach(node => {
        expect(node.data.onClick).toBeDefined();
        expect(node.data.onHover).toBeDefined();
        expect(node.data.expandable).toBeDefined();
      });
    });
    
    it('should mark nodes as expandable when they have children', () => {
      const concepts = ['Parent', 'Child1', 'Child2'];
      const result = generator.generateMindMap(concepts, 'Parent', {
        interactive: true
      });
      
      const parentNode = result.nodes.find(n => n.data.label === 'Parent');
      const childNode = result.nodes.find(n => n.data.label === 'Child1');
      
      expect(parentNode?.data.expandable).toBe(true);
      expect(childNode?.data.expandable).toBe(false);
    });
  });
  
  describe('export functionality', () => {
    it('should export to JSON format', () => {
      const concepts = ['Export', 'Test'];
      const mindMap = generator.generateMindMap(concepts, 'Export');
      
      const exported = generator.exportToJSON(mindMap);
      const parsed = JSON.parse(exported);
      
      expect(parsed.nodes).toHaveLength(2);
      expect(parsed.edges).toBeDefined();
      expect(parsed.metadata).toBeDefined();
    });
    
    it('should export to DOT format for Graphviz', () => {
      const concepts = ['A', 'B', 'C'];
      const mindMap = generator.generateMindMap(concepts, 'A');
      
      const dot = generator.exportToDOT(mindMap);
      
      expect(dot).toContain('digraph MindMap');
      expect(dot).toContain('"A"');
      expect(dot).toContain('->');
    });
    
    it('should export to SVG format', () => {
      const concepts = ['SVG', 'Export'];
      const mindMap = generator.generateMindMap(concepts, 'SVG');
      
      const svg = generator.exportToSVG(mindMap);
      
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(svg).toContain('SVG');
    });
  });
  
  describe('performance optimization', () => {
    it('should handle large number of concepts efficiently', () => {
      const startTime = Date.now();
      const concepts = Array(100).fill(null).map((_, i) => `Concept${i}`);
      
      const result = generator.generateMindMap(concepts, 'Root');
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
      expect(result.nodes).toHaveLength(101); // 100 concepts + 1 root
    });
    
    it('should optimize edge creation for dense graphs', () => {
      const concepts = {
        'A': ['B', 'C', 'D', 'E'],
        'B': ['C', 'D', 'E', 'F'],
        'C': ['D', 'E', 'F', 'G'],
        'D': ['E', 'F', 'G', 'H'],
        'E': ['F', 'G', 'H', 'I']
      };
      
      const result = generator.generateConceptMap(concepts);
      
      // Should avoid duplicate edges
      const edgeSet = new Set(
        result.edges.map(e => `${e.source}-${e.target}`)
      );
      expect(edgeSet.size).toBe(result.edges.length);
    });
  });
  
  describe('error handling', () => {
    it('should handle invalid input gracefully', () => {
      expect(() => generator.generateMindMap(null as any, 'Root')).toThrow();
      expect(() => generator.generateMindMap(['A'], '')).toThrow();
      expect(() => generator.generateMindMap(['A'], null as any)).toThrow();
    });
    
    it('should validate layout options', () => {
      const concepts = ['A', 'B'];
      expect(() => generator.generateMindMap(concepts, 'A', {
        layout: 'invalid' as any
      })).toThrow('Invalid layout type');
    });
  });
});