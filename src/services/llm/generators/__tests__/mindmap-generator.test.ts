import { MindMapGenerator } from '../mindmap-generator';
import { ILLMProvider } from '../../types';

// Mock the provider
jest.mock('../../provider');

// Mock mind map layout utilities (inline for testing)
const mockCalculateNodePositions = jest.fn().mockReturnValue({
  nodes: [
    { id: 'root', x: 0, y: 0 },
    { id: 'child1', x: 100, y: 50 }
  ]
});
const mockOptimizeLayout = jest.fn();

describe('MindMapGenerator', () => {
  let generator: MindMapGenerator;
  let mockProvider: jest.Mocked<ILLMProvider>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockProvider = {
      generateStructuredOutput: jest.fn(),
      generateCompletion: jest.fn(),
      getTokenCount: jest.fn(),
      isAvailable: jest.fn().mockResolvedValue(true),
      streamCompletion: jest.fn()
    } as any;

    generator = new MindMapGenerator(mockProvider);
  });

  describe('generateMindMap', () => {
    const mockMindMapData = {
      title: 'Jungian Archetypes',
      rootConcept: {
        id: 'root',
        label: 'Archetypes',
        description: 'Universal patterns in the collective unconscious',
        importance: 'high'
      },
      concepts: [
        {
          id: 'shadow',
          label: 'Shadow',
          description: 'Hidden aspects of personality',
          parentId: 'root',
          importance: 'high',
          relationships: ['anima', 'persona']
        },
        {
          id: 'anima',
          label: 'Anima',
          description: 'Feminine aspect in male psyche',
          parentId: 'root',
          importance: 'medium',
          relationships: ['shadow']
        }
      ],
      connections: [
        {
          from: 'root',
          to: 'shadow',
          type: 'contains',
          strength: 'strong'
        },
        {
          from: 'root',
          to: 'anima',
          type: 'contains',
          strength: 'strong'
        },
        {
          from: 'shadow',
          to: 'anima',
          type: 'relates',
          strength: 'medium'
        }
      ]
    };

    it('should generate mind map with proper structure', async () => {
      mockProvider.generateStructuredOutput.mockResolvedValue(mockMindMapData);

      const mindMap = await generator.generateMindMap(
        'Jungian Archetypes',
        ['archetype', 'shadow', 'anima', 'persona'],
        'Explore the fundamental archetypes in Jungian psychology',
        'intermediate'
      );

      expect(mindMap.title).toBe('Jungian Archetypes');
      expect(mindMap.nodes).toHaveLength(3); // root + 2 concepts
      expect(mindMap.edges).toHaveLength(3);
      expect(mindMap.nodes[0]).toMatchObject({
        id: 'root',
        label: 'Archetypes',
        type: 'root'
      });

      expect(mockProvider.generateStructuredOutput).toHaveBeenCalledWith(
        expect.stringContaining('Generate a comprehensive mind map'),
        expect.objectContaining({
          type: 'object',
          properties: expect.objectContaining({
            title: { type: 'string' },
            rootConcept: expect.any(Object),
            concepts: expect.any(Object),
            connections: expect.any(Object)
          })
        }),
        { temperature: 0.6 }
      );
    });

    it('should handle Portuguese language generation', async () => {
      const portugueseMindMap = {
        ...mockMindMapData,
        title: 'Arquétipos Junguianos',
        rootConcept: {
          id: 'root',
          label: 'Arquétipos',
          description: 'Padrões universais do inconsciente coletivo',
          importance: 'high'
        }
      };

      mockProvider.generateStructuredOutput.mockResolvedValue(portugueseMindMap);

      const mindMap = await generator.generateMindMap(
        'Arquétipos Junguianos',
        ['arquétipo', 'sombra', 'anima'],
        'Explorar os arquétipos fundamentais',
        'intermediate',
        'pt-BR'
      );

      expect(mindMap.title).toBe('Arquétipos Junguianos');
      expect(mockProvider.generateStructuredOutput).toHaveBeenCalledWith(
        expect.stringContaining('Gere um mapa mental abrangente'),
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should handle provider errors gracefully', async () => {
      mockProvider.generateStructuredOutput.mockRejectedValue(new Error('Provider error'));

      await expect(generator.generateMindMap(
        'Test Topic',
        ['concept1'],
        'Test objective',
        'beginner'
      )).rejects.toThrow('Failed to generate mind map');
    });

    it('should handle malformed provider response', async () => {
      mockProvider.generateStructuredOutput.mockResolvedValue({
        title: 'Incomplete',
        // Missing required fields
      });

      await expect(generator.generateMindMap(
        'Test Topic',
        ['concept1'],
        'Test objective',
        'beginner'
      )).rejects.toThrow('Invalid mind map structure');
    });

    it('should validate input parameters', async () => {
      await expect(generator.generateMindMap(
        '',
        ['concept'],
        'objective',
        'beginner'
      )).rejects.toThrow('Topic cannot be empty');

      await expect(generator.generateMindMap(
        'Topic',
        [],
        'objective',
        'beginner'
      )).rejects.toThrow('At least one concept is required');

      await expect(generator.generateMindMap(
        'Topic',
        ['concept'],
        '',
        'beginner'
      )).rejects.toThrow('Learning objective cannot be empty');
    });

    it('should handle large concept arrays', async () => {
      const largeConcepts = Array(50).fill(null).map((_, i) => `concept${i}`);
      
      mockProvider.generateStructuredOutput.mockResolvedValue({
        ...mockMindMapData,
        concepts: largeConcepts.slice(0, 20).map((concept, i) => ({
          id: concept,
          label: concept,
          description: `Description for ${concept}`,
          parentId: i < 5 ? 'root' : `concept${Math.floor(i / 5) - 1}`,
          importance: 'medium',
          relationships: []
        }))
      });

      const mindMap = await generator.generateMindMap(
        'Large Topic',
        largeConcepts,
        'Handle many concepts',
        'advanced'
      );

      expect(mindMap.nodes.length).toBeGreaterThan(10);
      expect(mindMap.nodes.length).toBeLessThanOrEqual(21); // Root + max 20 concepts
    });
  });

  describe('generateConceptMap', () => {
    const mockContent = `
      Jung's theory of archetypes describes universal patterns found in the collective unconscious.
      The shadow represents repressed or hidden aspects of personality.
      The anima is the feminine aspect within the male psyche.
      The persona is the mask we wear in social situations.
    `;

    it('should extract concepts from content and create map', async () => {
      const conceptMapData = {
        title: 'Content Concept Map',
        extractedConcepts: [
          { term: 'archetypes', importance: 0.9, category: 'core' },
          { term: 'collective unconscious', importance: 0.8, category: 'foundation' },
          { term: 'shadow', importance: 0.7, category: 'archetype' },
          { term: 'anima', importance: 0.6, category: 'archetype' }
        ],
        relationships: [
          { from: 'archetypes', to: 'collective unconscious', type: 'found_in' },
          { from: 'shadow', to: 'archetypes', type: 'is_a' },
          { from: 'anima', to: 'archetypes', type: 'is_a' }
        ]
      };

      mockProvider.generateStructuredOutput.mockResolvedValue(conceptMapData);

      const conceptMap = await generator.generateConceptMap(mockContent, 'Jungian Theory');

      expect(conceptMap.title).toBe('Content Concept Map');
      expect(conceptMap.nodes).toHaveLength(4);
      expect(conceptMap.edges).toHaveLength(3);
      expect(conceptMap.nodes[0].importance).toBeDefined();
    });

    it('should handle content without clear concepts', async () => {
      const vagueMockData = {
        title: 'General Concepts',
        extractedConcepts: [
          { term: 'general concept', importance: 0.3, category: 'general' }
        ],
        relationships: []
      };

      mockProvider.generateStructuredOutput.mockResolvedValue(vagueMockData);

      const conceptMap = await generator.generateConceptMap(
        'This is very general content without specific concepts.',
        'General Topic'
      );

      expect(conceptMap.nodes).toHaveLength(1);
      expect(conceptMap.edges).toHaveLength(0);
    });

    it('should limit extraction to reasonable number of concepts', async () => {
      const manyConcepts = Array(100).fill(null).map((_, i) => ({
        term: `concept${i}`,
        importance: Math.random(),
        category: 'auto'
      }));

      mockProvider.generateStructuredOutput.mockResolvedValue({
        title: 'Many Concepts',
        extractedConcepts: manyConcepts,
        relationships: []
      });

      const conceptMap = await generator.generateConceptMap(
        'Content with many concepts',
        'Complex Topic'
      );

      expect(conceptMap.nodes.length).toBeLessThanOrEqual(30); // Should limit concepts
    });
  });

  describe('generateHierarchicalMap', () => {
    const mockHierarchy = {
      rootTopic: 'Jungian Psychology',
      levels: [
        {
          level: 0,
          concepts: [
            { id: 'jung-psych', label: 'Jungian Psychology', children: ['theories', 'concepts'] }
          ]
        },
        {
          level: 1,
          concepts: [
            { id: 'theories', label: 'Core Theories', children: ['collective-unconscious', 'individuation'] },
            { id: 'concepts', label: 'Key Concepts', children: ['archetypes', 'complexes'] }
          ]
        },
        {
          level: 2,
          concepts: [
            { id: 'collective-unconscious', label: 'Collective Unconscious', children: [] },
            { id: 'individuation', label: 'Individuation', children: [] },
            { id: 'archetypes', label: 'Archetypes', children: [] },
            { id: 'complexes', label: 'Complexes', children: [] }
          ]
        }
      ]
    };

    it('should generate hierarchical mind map structure', async () => {
      mockProvider.generateStructuredOutput.mockResolvedValue(mockHierarchy);

      const hierarchicalMap = await generator.generateHierarchicalMap(
        'Jungian Psychology',
        ['psychology', 'archetypes', 'unconscious'],
        3
      );

      expect(hierarchicalMap.title).toBe('Jungian Psychology');
      expect(hierarchicalMap.levels).toHaveLength(3);
      expect(hierarchicalMap.nodes).toHaveLength(7); // 1 + 2 + 4 concepts across levels
      
      // Check hierarchical structure
      const rootNode = hierarchicalMap.nodes.find(n => n.level === 0);
      expect(rootNode).toBeDefined();
      expect(rootNode?.children).toHaveLength(2);
    });

    it('should handle single-level hierarchy', async () => {
      const simpleMockHierarchy = {
        rootTopic: 'Simple Topic',
        levels: [
          {
            level: 0,
            concepts: [
              { id: 'root', label: 'Simple Topic', children: [] }
            ]
          }
        ]
      };

      mockProvider.generateStructuredOutput.mockResolvedValue(simpleMockHierarchy);

      const hierarchicalMap = await generator.generateHierarchicalMap(
        'Simple Topic',
        ['concept'],
        1
      );

      expect(hierarchicalMap.levels).toHaveLength(1);
      expect(hierarchicalMap.nodes).toHaveLength(1);
    });

    it('should validate hierarchy depth limits', async () => {
      await expect(generator.generateHierarchicalMap(
        'Topic',
        ['concept'],
        0
      )).rejects.toThrow('Depth must be at least 1');

      await expect(generator.generateHierarchicalMap(
        'Topic',
        ['concept'],
        11
      )).rejects.toThrow('Depth cannot exceed 10');
    });
  });

  describe('optimizeLayout', () => {
    const mockMindMap = {
      id: 'test-map',
      title: 'Test Map',
      nodes: [
        { id: 'root', label: 'Root', type: 'root', x: 0, y: 0 },
        { id: 'child1', label: 'Child 1', type: 'concept', x: 100, y: 50 },
        { id: 'child2', label: 'Child 2', type: 'concept', x: -100, y: 50 }
      ],
      edges: [
        { id: 'edge1', from: 'root', to: 'child1', type: 'hierarchy' },
        { id: 'edge2', from: 'root', to: 'child2', type: 'hierarchy' }
      ]
    };

    it('should optimize node positions for better layout', async () => {
      const optimizedMap = await generator.optimizeLayout(mockMindMap);

      expect(optimizedMap.nodes).toHaveLength(mockMindMap.nodes.length);
      expect(optimizedMap.edges).toHaveLength(mockMindMap.edges.length);
      
      // Positions should be optimized (mocked function would change them)
      optimizedMap.nodes.forEach(node => {
        expect(node.x).toBeDefined();
        expect(node.y).toBeDefined();
      });
    });

    it('should handle maps with no nodes', async () => {
      const emptyMap = {
        ...mockMindMap,
        nodes: [],
        edges: []
      };

      const optimizedMap = await generator.optimizeLayout(emptyMap);

      expect(optimizedMap.nodes).toHaveLength(0);
      expect(optimizedMap.edges).toHaveLength(0);
    });

    it('should preserve node and edge properties during optimization', async () => {
      const optimizedMap = await generator.optimizeLayout(mockMindMap);

      optimizedMap.nodes.forEach((node, index) => {
        expect(node.id).toBe(mockMindMap.nodes[index].id);
        expect(node.label).toBe(mockMindMap.nodes[index].label);
        expect(node.type).toBe(mockMindMap.nodes[index].type);
      });

      optimizedMap.edges.forEach((edge, index) => {
        expect(edge.id).toBe(mockMindMap.edges[index].id);
        expect(edge.from).toBe(mockMindMap.edges[index].from);
        expect(edge.to).toBe(mockMindMap.edges[index].to);
      });
    });
  });

  describe('analyzeComplexity', () => {
    it('should analyze mind map complexity metrics', async () => {
      const complexMap = {
        nodes: Array(20).fill(null).map((_, i) => ({ 
          id: `node${i}`, 
          label: `Node ${i}`, 
          type: i === 0 ? 'root' : 'concept' 
        })),
        edges: Array(25).fill(null).map((_, i) => ({
          id: `edge${i}`,
          from: `node${Math.floor(i / 5)}`,
          to: `node${i % 19 + 1}`,
          type: 'hierarchy'
        }))
      };

      const complexity = await generator.analyzeComplexity(complexMap as any);

      expect(complexity.nodeCount).toBe(20);
      expect(complexity.edgeCount).toBe(25);
      expect(complexity.depth).toBeGreaterThan(0);
      expect(complexity.branchingFactor).toBeGreaterThan(0);
      expect(complexity.complexity).toMatch(/^(low|medium|high)$/);
    });

    it('should handle simple maps', async () => {
      const simpleMap = {
        nodes: [
          { id: 'root', label: 'Root', type: 'root' },
          { id: 'child', label: 'Child', type: 'concept' }
        ],
        edges: [
          { id: 'edge', from: 'root', to: 'child', type: 'hierarchy' }
        ]
      };

      const complexity = await generator.analyzeComplexity(simpleMap as any);

      expect(complexity.nodeCount).toBe(2);
      expect(complexity.edgeCount).toBe(1);
      expect(complexity.complexity).toBe('low');
    });

    it('should handle empty maps', async () => {
      const emptyMap = { nodes: [], edges: [] };

      const complexity = await generator.analyzeComplexity(emptyMap as any);

      expect(complexity.nodeCount).toBe(0);
      expect(complexity.edgeCount).toBe(0);
      expect(complexity.depth).toBe(0);
      expect(complexity.complexity).toBe('low');
    });
  });

  describe('generateProgressiveMindMap', () => {
    it('should generate mind map that builds concepts progressively', async () => {
      const progressiveData = {
        stages: [
          {
            stage: 1,
            title: 'Basic Concepts',
            concepts: ['archetype', 'unconscious'],
            connections: [{ from: 'archetype', to: 'unconscious' }]
          },
          {
            stage: 2,
            title: 'Specific Archetypes',
            concepts: ['shadow', 'anima'],
            connections: [
              { from: 'shadow', to: 'archetype' },
              { from: 'anima', to: 'archetype' }
            ]
          }
        ]
      };

      mockProvider.generateStructuredOutput.mockResolvedValue(progressiveData);

      const progressiveMap = await generator.generateProgressiveMindMap(
        'Jungian Archetypes',
        ['archetype', 'shadow', 'anima', 'unconscious'],
        ['Understand basic concepts', 'Learn specific archetypes'],
        2
      );

      expect(progressiveMap.stages).toHaveLength(2);
      expect(progressiveMap.totalNodes).toBe(4);
      expect(progressiveMap.stages[0].concepts).toHaveLength(2);
      expect(progressiveMap.stages[1].concepts).toHaveLength(2);
    });

    it('should validate stage parameters', async () => {
      await expect(generator.generateProgressiveMindMap(
        'Topic',
        ['concept'],
        ['objective'],
        0
      )).rejects.toThrow('Number of stages must be at least 1');

      await expect(generator.generateProgressiveMindMap(
        'Topic',
        ['concept'],
        ['objective'],
        11
      )).rejects.toThrow('Number of stages cannot exceed 10');
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle provider timeout', async () => {
      mockProvider.generateStructuredOutput.mockImplementation(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      await expect(generator.generateMindMap(
        'Topic',
        ['concept'],
        'objective',
        'beginner'
      )).rejects.toThrow('Failed to generate mind map');
    });

    it('should handle very large concept lists', async () => {
      const hugeConcepts = Array(1000).fill(null).map((_, i) => `concept${i}`);
      
      mockProvider.generateStructuredOutput.mockResolvedValue({
        ...mockMindMapData,
        concepts: hugeConcepts.slice(0, 50).map(concept => ({
          id: concept,
          label: concept,
          description: `Description for ${concept}`,
          parentId: 'root',
          importance: 'medium',
          relationships: []
        }))
      });

      const mindMap = await generator.generateMindMap(
        'Huge Topic',
        hugeConcepts,
        'Handle huge concept list',
        'advanced'
      );

      // Should limit the number of concepts in the result
      expect(mindMap.nodes.length).toBeLessThanOrEqual(51); // Root + max 50 concepts
    });

    it('should handle special characters in concept names', async () => {
      const specialConcepts = [
        'concept-with-dashes',
        'concept_with_underscores',
        'concept with spaces',
        'concept@with#symbols',
        'conceito-em-português',
        'концепция-кириллица'
      ];

      mockProvider.generateStructuredOutput.mockResolvedValue({
        ...mockMindMapData,
        concepts: specialConcepts.map((concept, i) => ({
          id: concept.replace(/[^a-zA-Z0-9]/g, '_'),
          label: concept,
          description: `Description for ${concept}`,
          parentId: 'root',
          importance: 'medium',
          relationships: []
        }))
      });

      const mindMap = await generator.generateMindMap(
        'Special Characters',
        specialConcepts,
        'Handle special characters',
        'intermediate'
      );

      expect(mindMap.nodes.length).toBe(specialConcepts.length + 1); // +1 for root
      specialConcepts.forEach(concept => {
        const node = mindMap.nodes.find(n => n.label === concept);
        expect(node).toBeDefined();
      });
    });

    it('should validate mind map structure completeness', async () => {
      const incompleteMockData = {
        title: 'Incomplete Map',
        rootConcept: {
          id: 'root',
          label: 'Root'
          // Missing required fields
        },
        concepts: [],
        connections: []
      };

      mockProvider.generateStructuredOutput.mockResolvedValue(incompleteMockData);

      await expect(generator.generateMindMap(
        'Incomplete Test',
        ['concept'],
        'objective',
        'beginner'
      )).rejects.toThrow('Invalid mind map structure');
    });
  });
});