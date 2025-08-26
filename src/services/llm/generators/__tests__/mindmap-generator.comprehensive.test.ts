import { 
  MindMapGenerator, 
  MindMap, 
  MindMapNode, 
  MindMapEdge, 
  HierarchicalMindMap, 
  ProgressiveMindMap,
  MindMapComplexity
} from '../mindmap-generator';
import { ILLMProvider, LLMResponse, LLMGenerationOptions } from '../../types';

// Mock provider for comprehensive testing
class MockMindMapProvider implements ILLMProvider {
  private shouldFail: boolean = false;
  private delay: number = 0;
  private mockResponse: any = null;
  private callCount: number = 0;

  constructor() {}

  setShouldFail(fail: boolean): void {
    this.shouldFail = fail;
  }

  setDelay(delay: number): void {
    this.delay = delay;
  }

  setMockResponse(response: any): void {
    this.mockResponse = response;
  }

  getCallCount(): number {
    return this.callCount;
  }

  resetCallCount(): void {
    this.callCount = 0;
  }

  async generateCompletion(
    prompt: string,
    options?: LLMGenerationOptions
  ): Promise<LLMResponse> {
    this.callCount++;

    if (this.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delay));
    }

    if (this.shouldFail) {
      throw new Error('Mock provider error for testing');
    }

    return {
      content: 'Mock completion response',
      usage: {
        promptTokens: Math.ceil(prompt.length / 4),
        completionTokens: 50,
        totalTokens: Math.ceil(prompt.length / 4) + 50
      }
    };
  }

  async generateStructuredOutput<T>(
    prompt: string,
    schema: any,
    options?: LLMGenerationOptions
  ): Promise<T> {
    this.callCount++;

    if (this.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delay));
    }

    if (this.shouldFail) {
      throw new Error('Mock provider error for testing');
    }

    if (this.mockResponse) {
      return this.mockResponse as T;
    }

    // Generate response based on prompt content
    if (prompt.includes('comprehensive mind map') || prompt.includes('mapa mental abrangente')) {
      return this.generateMockMindMap(prompt) as T;
    } else if (prompt.includes('Extract key concepts')) {
      return this.generateMockConceptMap(prompt) as T;
    } else if (prompt.includes('hierarchical mind map')) {
      return this.generateMockHierarchicalMap(prompt) as T;
    } else if (prompt.includes('progressive learning mind map')) {
      return this.generateMockProgressiveMap(prompt) as T;
    }

    return {} as T;
  }

  getTokenCount(text: string): number {
    return Math.ceil(text.length / 4);
  }

  async isAvailable(): Promise<boolean> {
    return !this.shouldFail;
  }

  private generateMockMindMap(prompt: string): any {
    return {
      title: 'Mock Mind Map: Jungian Psychology',
      rootConcept: {
        id: 'root-1',
        label: 'Jungian Psychology',
        description: 'Central concept of analytical psychology',
        importance: 'high'
      },
      concepts: [
        {
          id: 'concept-1',
          label: 'Collective Unconscious',
          description: 'Shared unconscious content across humanity',
          parentId: 'root-1',
          importance: 'high',
          relationships: ['concept-2', 'concept-3']
        },
        {
          id: 'concept-2',
          label: 'Archetypes',
          description: 'Universal patterns or images in the collective unconscious',
          parentId: 'concept-1',
          importance: 'high',
          relationships: ['concept-3']
        },
        {
          id: 'concept-3',
          label: 'Shadow',
          description: 'The repressed or hidden aspects of personality',
          parentId: 'root-1',
          importance: 'medium',
          relationships: ['concept-2']
        },
        {
          id: 'concept-4',
          label: 'Individuation',
          description: 'The process of psychological integration and self-realization',
          parentId: 'root-1',
          importance: 'high',
          relationships: []
        }
      ],
      connections: [
        {
          from: 'root-1',
          to: 'concept-1',
          type: 'hierarchy',
          strength: 'strong'
        },
        {
          from: 'root-1',
          to: 'concept-3',
          type: 'hierarchy',
          strength: 'strong'
        },
        {
          from: 'root-1',
          to: 'concept-4',
          type: 'hierarchy',
          strength: 'strong'
        },
        {
          from: 'concept-1',
          to: 'concept-2',
          type: 'hierarchy',
          strength: 'strong'
        },
        {
          from: 'concept-2',
          to: 'concept-3',
          type: 'association',
          strength: 'medium'
        }
      ]
    };
  }

  private generateMockConceptMap(prompt: string): any {
    return {
      title: 'Extracted Concepts Map',
      extractedConcepts: [
        {
          term: 'Analytical Psychology',
          importance: 0.9,
          category: 'theory'
        },
        {
          term: 'Dream Analysis',
          importance: 0.8,
          category: 'method'
        },
        {
          term: 'Active Imagination',
          importance: 0.7,
          category: 'technique'
        }
      ],
      relationships: [
        {
          from: 'analytical_psychology',
          to: 'dream_analysis',
          type: 'contains'
        },
        {
          from: 'analytical_psychology',
          to: 'active_imagination',
          type: 'contains'
        },
        {
          from: 'dream_analysis',
          to: 'active_imagination',
          type: 'relates'
        }
      ]
    };
  }

  private generateMockHierarchicalMap(prompt: string): any {
    return {
      rootTopic: 'Jungian Psychology Hierarchy',
      levels: [
        {
          level: 0,
          concepts: [
            {
              id: 'root',
              label: 'Jungian Psychology',
              children: ['level1-1', 'level1-2']
            }
          ]
        },
        {
          level: 1,
          concepts: [
            {
              id: 'level1-1',
              label: 'Theoretical Foundations',
              children: ['level2-1', 'level2-2']
            },
            {
              id: 'level1-2',
              label: 'Therapeutic Applications',
              children: ['level2-3']
            }
          ]
        },
        {
          level: 2,
          concepts: [
            {
              id: 'level2-1',
              label: 'Collective Unconscious',
              children: []
            },
            {
              id: 'level2-2',
              label: 'Individuation Process',
              children: []
            },
            {
              id: 'level2-3',
              label: 'Dream Work',
              children: []
            }
          ]
        }
      ]
    };
  }

  private generateMockProgressiveMap(prompt: string): any {
    const stagesMatch = prompt.match(/(\d+) stages/);
    const stageCount = stagesMatch ? parseInt(stagesMatch[1]) : 3;

    const stages = [];
    for (let i = 0; i < stageCount; i++) {
      stages.push({
        stage: i + 1,
        title: `Stage ${i + 1}: ${i === 0 ? 'Foundation' : i === 1 ? 'Development' : 'Advanced Application'}`,
        concepts: [
          `Stage ${i + 1} Concept A`,
          `Stage ${i + 1} Concept B`,
          `Stage ${i + 1} Concept C`
        ],
        connections: i > 0 ? [
          {
            from: `Stage ${i} Concept A`,
            to: `Stage ${i + 1} Concept A`,
            type: 'builds_upon'
          }
        ] : []
      });
    }

    return { stages };
  }
}

describe('MindMapGenerator', () => {
  let generator: MindMapGenerator;
  let mockProvider: MockMindMapProvider;

  beforeEach(() => {
    mockProvider = new MockMindMapProvider();
    generator = new MindMapGenerator(mockProvider);
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockProvider.resetCallCount();
  });

  describe('generateMindMap', () => {
    const validInputs = {
      topic: 'Jungian Psychology',
      concepts: ['archetypes', 'shadow', 'anima', 'individuation'],
      learningObjective: 'Understand core concepts of analytical psychology',
      difficulty: 'intermediate' as const
    };

    it('should generate a mind map with valid inputs', async () => {
      const result = await generator.generateMindMap(
        validInputs.topic,
        validInputs.concepts,
        validInputs.learningObjective,
        validInputs.difficulty
      );

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('nodes');
      expect(result).toHaveProperty('edges');
      expect(result.id).toMatch(/^mindmap-\d+$/);
      expect(result.title).toBe('Mock Mind Map: Jungian Psychology');
      expect(Array.isArray(result.nodes)).toBe(true);
      expect(Array.isArray(result.edges)).toBe(true);
    });

    it('should handle different difficulty levels', async () => {
      const difficulties: ('beginner' | 'intermediate' | 'advanced')[] = ['beginner', 'intermediate', 'advanced'];

      for (const difficulty of difficulties) {
        const result = await generator.generateMindMap(
          validInputs.topic,
          validInputs.concepts,
          validInputs.learningObjective,
          difficulty
        );

        expect(result).toHaveProperty('nodes');
        expect(result).toHaveProperty('edges');
      }
    });

    it('should handle Portuguese language input', async () => {
      const result = await generator.generateMindMap(
        'Psicologia Junguiana',
        ['arquétipos', 'sombra', 'individuação'],
        'Compreender conceitos fundamentais da psicologia analítica',
        'intermediate',
        'pt-BR'
      );

      expect(result).toHaveProperty('nodes');
      expect(result).toHaveProperty('edges');
      expect(mockProvider.getCallCount()).toBe(1);
    });

    it('should create nodes with correct structure', async () => {
      const result = await generator.generateMindMap(
        validInputs.topic,
        validInputs.concepts,
        validInputs.learningObjective,
        validInputs.difficulty
      );

      expect(result.nodes.length).toBeGreaterThan(0);
      
      const rootNode = result.nodes.find(node => node.type === 'root');
      expect(rootNode).toBeTruthy();
      expect(rootNode).toHaveProperty('id');
      expect(rootNode).toHaveProperty('label');
      expect(rootNode).toHaveProperty('type', 'root');
      expect(rootNode).toHaveProperty('x', 0);
      expect(rootNode).toHaveProperty('y', 0);
      expect(rootNode).toHaveProperty('level', 0);

      const conceptNodes = result.nodes.filter(node => node.type === 'concept');
      expect(conceptNodes.length).toBeGreaterThan(0);
      
      conceptNodes.forEach(node => {
        expect(node).toHaveProperty('id');
        expect(node).toHaveProperty('label');
        expect(node).toHaveProperty('type', 'concept');
        expect(node).toHaveProperty('level', 1);
      });
    });

    it('should create edges with correct structure', async () => {
      const result = await generator.generateMindMap(
        validInputs.topic,
        validInputs.concepts,
        validInputs.learningObjective,
        validInputs.difficulty
      );

      expect(result.edges.length).toBeGreaterThan(0);
      
      result.edges.forEach(edge => {
        expect(edge).toHaveProperty('id');
        expect(edge).toHaveProperty('from');
        expect(edge).toHaveProperty('to');
        expect(edge).toHaveProperty('type');
        expect(edge.id).toMatch(/^edge-\d+$/);
        expect(['hierarchy', 'association', 'relates', 'contains']).toContain(edge.type);
        expect(['weak', 'medium', 'strong']).toContain(edge.strength);
      });
    });

    it('should limit concepts to reasonable number', async () => {
      // Mock a response with too many concepts
      mockProvider.setMockResponse({
        title: 'Large Mind Map',
        rootConcept: {
          id: 'root',
          label: 'Root',
          description: 'Root concept',
          importance: 'high'
        },
        concepts: Array.from({length: 100}, (_, i) => ({
          id: `concept-${i}`,
          label: `Concept ${i}`,
          description: `Description ${i}`,
          parentId: 'root',
          importance: 'medium',
          relationships: []
        })),
        connections: []
      });

      const result = await generator.generateMindMap(
        validInputs.topic,
        validInputs.concepts,
        validInputs.learningObjective,
        validInputs.difficulty
      );

      // Should limit to 50 concepts + 1 root = 51 nodes maximum
      expect(result.nodes.length).toBeLessThanOrEqual(51);
    });

    it('should validate input parameters', async () => {
      // Empty topic
      await expect(generator.generateMindMap(
        '',
        validInputs.concepts,
        validInputs.learningObjective,
        validInputs.difficulty
      )).rejects.toThrow('Topic cannot be empty');

      // Empty concepts array
      await expect(generator.generateMindMap(
        validInputs.topic,
        [],
        validInputs.learningObjective,
        validInputs.difficulty
      )).rejects.toThrow('At least one concept is required');

      // Empty learning objective
      await expect(generator.generateMindMap(
        validInputs.topic,
        validInputs.concepts,
        '',
        validInputs.difficulty
      )).rejects.toThrow('Learning objective cannot be empty');

      // Whitespace-only inputs
      await expect(generator.generateMindMap(
        '   ',
        validInputs.concepts,
        validInputs.learningObjective,
        validInputs.difficulty
      )).rejects.toThrow('Topic cannot be empty');
    });

    it('should handle provider errors gracefully', async () => {
      mockProvider.setShouldFail(true);

      await expect(generator.generateMindMap(
        validInputs.topic,
        validInputs.concepts,
        validInputs.learningObjective,
        validInputs.difficulty
      )).rejects.toThrow('Failed to generate mind map: Mock provider error for testing');
    });

    it('should handle invalid response structure', async () => {
      // Mock invalid response
      mockProvider.setMockResponse({
        // Missing required fields
        invalidField: 'invalid'
      });

      await expect(generator.generateMindMap(
        validInputs.topic,
        validInputs.concepts,
        validInputs.learningObjective,
        validInputs.difficulty
      )).rejects.toThrow('Invalid mind map structure');
    });

    it('should parse importance values correctly', async () => {
      mockProvider.setMockResponse({
        title: 'Importance Test',
        rootConcept: {
          id: 'root',
          label: 'Root',
          description: 'Test',
          importance: 'high'
        },
        concepts: [
          {
            id: 'high-importance',
            label: 'High',
            description: 'Test',
            parentId: 'root',
            importance: 'high',
            relationships: []
          },
          {
            id: 'medium-importance',
            label: 'Medium',
            description: 'Test',
            parentId: 'root',
            importance: 'medium',
            relationships: []
          },
          {
            id: 'low-importance',
            label: 'Low',
            description: 'Test',
            parentId: 'root',
            importance: 'low',
            relationships: []
          },
          {
            id: 'numeric-importance',
            label: 'Numeric',
            description: 'Test',
            parentId: 'root',
            importance: 0.9,
            relationships: []
          },
          {
            id: 'no-importance',
            label: 'None',
            description: 'Test',
            parentId: 'root',
            relationships: []
          }
        ],
        connections: []
      });

      const result = await generator.generateMindMap(
        validInputs.topic,
        validInputs.concepts,
        validInputs.learningObjective,
        validInputs.difficulty
      );

      const highNode = result.nodes.find(n => n.id === 'high-importance');
      const mediumNode = result.nodes.find(n => n.id === 'medium-importance');
      const lowNode = result.nodes.find(n => n.id === 'low-importance');
      const numericNode = result.nodes.find(n => n.id === 'numeric-importance');
      const noneNode = result.nodes.find(n => n.id === 'no-importance');

      expect(highNode?.importance).toBe(0.8);
      expect(mediumNode?.importance).toBe(0.6);
      expect(lowNode?.importance).toBe(0.4);
      expect(numericNode?.importance).toBe(0.9);
      expect(noneNode?.importance).toBe(0.5);
    });
  });

  describe('generateConceptMap', () => {
    const sampleContent = `
      Carl Jung's analytical psychology emphasizes the collective unconscious, 
      a shared layer of unconscious content. Key concepts include archetypes, 
      which are universal patterns, and individuation, the process of psychological 
      development. Dream analysis and active imagination are important therapeutic 
      techniques in Jungian therapy.
    `;

    it('should extract concepts from content', async () => {
      const result = await generator.generateConceptMap(sampleContent, 'Jungian Analysis');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('nodes');
      expect(result).toHaveProperty('edges');
      expect(result.title).toContain('Jungian Analysis');
    });

    it('should create nodes from extracted concepts', async () => {
      const result = await generator.generateConceptMap(sampleContent, 'Test Topic');

      expect(result.nodes.length).toBeGreaterThan(0);
      
      result.nodes.forEach(node => {
        expect(node).toHaveProperty('id');
        expect(node).toHaveProperty('label');
        expect(node).toHaveProperty('type');
        expect(['root', 'concept']).toContain(node.type);
        
        if (node.importance !== undefined) {
          expect(typeof node.importance).toBe('number');
        }
        
        if (node.category !== undefined) {
          expect(typeof node.category).toBe('string');
        }
      });
    });

    it('should create edges from relationships', async () => {
      const result = await generator.generateConceptMap(sampleContent, 'Test Topic');

      expect(result.edges.length).toBeGreaterThan(0);
      
      result.edges.forEach(edge => {
        expect(edge).toHaveProperty('id');
        expect(edge).toHaveProperty('from');
        expect(edge).toHaveProperty('to');
        expect(edge).toHaveProperty('type');
        expect(edge.id).toMatch(/^concept-edge-\d+$/);
      });
    });

    it('should limit concepts to reasonable number', async () => {
      // Mock response with many concepts
      mockProvider.setMockResponse({
        title: 'Many Concepts',
        extractedConcepts: Array.from({length: 50}, (_, i) => ({
          term: `Concept ${i}`,
          importance: Math.random(),
          category: 'test'
        })),
        relationships: []
      });

      const result = await generator.generateConceptMap(sampleContent, 'Large Content');

      // Should limit to 30 concepts
      expect(result.nodes.length).toBeLessThanOrEqual(30);
    });

    it('should handle long content by truncating', async () => {
      const longContent = 'A'.repeat(5000); // Very long content
      
      const spy = jest.spyOn(mockProvider, 'generateStructuredOutput');

      await generator.generateConceptMap(longContent, 'Long Content Test');

      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining(longContent.substring(0, 2000)),
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should handle provider errors', async () => {
      mockProvider.setShouldFail(true);

      await expect(generator.generateConceptMap(sampleContent, 'Error Test'))
        .rejects.toThrow('Failed to generate concept map: Mock provider error for testing');
    });

    it('should sanitize node IDs', async () => {
      mockProvider.setMockResponse({
        title: 'ID Sanitization Test',
        extractedConcepts: [
          {
            term: 'Complex Concept Name With Spaces',
            importance: 0.8,
            category: 'test'
          },
          {
            term: 'Special-Characters!@#',
            importance: 0.7,
            category: 'test'
          }
        ],
        relationships: [
          {
            from: 'Complex Concept Name With Spaces',
            to: 'Special-Characters!@#',
            type: 'relates'
          }
        ]
      });

      const result = await generator.generateConceptMap(sampleContent, 'ID Test');

      const ids = result.nodes.map(node => node.id);
      expect(ids).toContain('complex_concept_name_with_spaces');
      expect(ids).toContain('special-characters!@#');

      const edge = result.edges[0];
      expect(edge.from).toBe('complex_concept_name_with_spaces');
      expect(edge.to).toBe('special-characters!@#');
    });
  });

  describe('generateHierarchicalMap', () => {
    const validInputs = {
      topic: 'Jungian Dream Analysis',
      concepts: ['dreams', 'symbols', 'interpretation', 'unconscious'],
      maxDepth: 3
    };

    it('should generate hierarchical mind map', async () => {
      const result = await generator.generateHierarchicalMap(
        validInputs.topic,
        validInputs.concepts,
        validInputs.maxDepth
      );

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('nodes');
      expect(result).toHaveProperty('edges');
      expect(result).toHaveProperty('levels');
      expect(result.title).toBe('Jungian Psychology Hierarchy');
    });

    it('should validate depth parameters', async () => {
      // Depth too low
      await expect(generator.generateHierarchicalMap(
        validInputs.topic,
        validInputs.concepts,
        0
      )).rejects.toThrow('Depth must be between 1 and 10');

      // Depth too high
      await expect(generator.generateHierarchicalMap(
        validInputs.topic,
        validInputs.concepts,
        11
      )).rejects.toThrow('Depth must be between 1 and 10');
    });

    it('should create hierarchical structure with levels', async () => {
      const result = await generator.generateHierarchicalMap(
        validInputs.topic,
        validInputs.concepts,
        validInputs.maxDepth
      );

      expect(Array.isArray(result.levels)).toBe(true);
      expect(result.levels.length).toBeGreaterThan(0);

      // Check level structure
      result.levels.forEach(level => {
        expect(level).toHaveProperty('level');
        expect(level).toHaveProperty('concepts');
        expect(typeof level.level).toBe('number');
        expect(Array.isArray(level.concepts)).toBe(true);
      });

      // Check that nodes are created for each level
      const expectedNodeCount = result.levels.reduce(
        (total, level) => total + level.concepts.length, 
        0
      );
      expect(result.nodes.length).toBe(expectedNodeCount);
    });

    it('should create correct node types by level', async () => {
      const result = await generator.generateHierarchicalMap(
        validInputs.topic,
        validInputs.concepts,
        validInputs.maxDepth
      );

      const level0Nodes = result.nodes.filter(node => node.level === 0);
      const nonRootNodes = result.nodes.filter(node => node.level! > 0);

      level0Nodes.forEach(node => {
        expect(node.type).toBe('root');
      });

      nonRootNodes.forEach(node => {
        expect(node.type).toBe('concept');
      });
    });

    it('should create hierarchical edges', async () => {
      const result = await generator.generateHierarchicalMap(
        validInputs.topic,
        validInputs.concepts,
        validInputs.maxDepth
      );

      result.edges.forEach(edge => {
        expect(edge).toHaveProperty('id');
        expect(edge).toHaveProperty('from');
        expect(edge).toHaveProperty('to');
        expect(edge).toHaveProperty('type', 'hierarchy');
        expect(edge.id).toMatch(/^hier-edge-\d+$/);
      });
    });

    it('should handle provider errors', async () => {
      mockProvider.setShouldFail(true);

      await expect(generator.generateHierarchicalMap(
        validInputs.topic,
        validInputs.concepts,
        validInputs.maxDepth
      )).rejects.toThrow('Failed to generate hierarchical mind map: Mock provider error for testing');
    });

    it('should handle edge case depths', async () => {
      // Minimum depth
      let result = await generator.generateHierarchicalMap(
        validInputs.topic,
        validInputs.concepts,
        1
      );
      expect(result).toHaveProperty('levels');

      // Maximum depth
      result = await generator.generateHierarchicalMap(
        validInputs.topic,
        validInputs.concepts,
        10
      );
      expect(result).toHaveProperty('levels');
    });
  });

  describe('generateProgressiveMindMap', () => {
    const validInputs = {
      topic: 'Learning Jungian Psychology',
      concepts: ['basic concepts', 'advanced theory', 'practical application'],
      objectives: ['Understand basics', 'Apply theory', 'Master practice'],
      stages: 3
    };

    it('should generate progressive mind map', async () => {
      const result = await generator.generateProgressiveMindMap(
        validInputs.topic,
        validInputs.concepts,
        validInputs.objectives,
        validInputs.stages
      );

      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('stages');
      expect(result).toHaveProperty('totalNodes');
      expect(Array.isArray(result.stages)).toBe(true);
      expect(result.stages.length).toBe(validInputs.stages);
    });

    it('should validate stage parameters', async () => {
      // Too few stages
      await expect(generator.generateProgressiveMindMap(
        validInputs.topic,
        validInputs.concepts,
        validInputs.objectives,
        0
      )).rejects.toThrow('Number of stages must be between 1 and 10');

      // Too many stages
      await expect(generator.generateProgressiveMindMap(
        validInputs.topic,
        validInputs.concepts,
        validInputs.objectives,
        11
      )).rejects.toThrow('Number of stages must be between 1 and 10');
    });

    it('should create stages with correct structure', async () => {
      const result = await generator.generateProgressiveMindMap(
        validInputs.topic,
        validInputs.concepts,
        validInputs.objectives,
        validInputs.stages
      );

      result.stages.forEach((stage, index) => {
        expect(stage).toHaveProperty('stage', index + 1);
        expect(stage).toHaveProperty('title');
        expect(stage).toHaveProperty('concepts');
        expect(stage).toHaveProperty('connections');
        expect(Array.isArray(stage.concepts)).toBe(true);
        expect(Array.isArray(stage.connections)).toBe(true);
      });
    });

    it('should calculate total nodes correctly', async () => {
      const result = await generator.generateProgressiveMindMap(
        validInputs.topic,
        validInputs.concepts,
        validInputs.objectives,
        validInputs.stages
      );

      const expectedTotal = result.stages.reduce(
        (total, stage) => total + stage.concepts.length,
        0
      );

      expect(result.totalNodes).toBe(expectedTotal);
    });

    it('should handle different numbers of stages', async () => {
      for (let stages = 1; stages <= 5; stages++) {
        const result = await generator.generateProgressiveMindMap(
          validInputs.topic,
          validInputs.concepts,
          validInputs.objectives,
          stages
        );

        expect(result.stages).toHaveLength(stages);
      }
    });

    it('should handle provider errors', async () => {
      mockProvider.setShouldFail(true);

      await expect(generator.generateProgressiveMindMap(
        validInputs.topic,
        validInputs.concepts,
        validInputs.objectives,
        validInputs.stages
      )).rejects.toThrow('Failed to generate progressive mind map: Mock provider error for testing');
    });
  });

  describe('optimizeLayout', () => {
    it('should optimize node positions', async () => {
      const mindMap: MindMap = {
        id: 'test-map',
        title: 'Test Map',
        nodes: [
          { id: 'node1', label: 'Node 1', type: 'root' },
          { id: 'node2', label: 'Node 2', type: 'concept' },
          { id: 'node3', label: 'Node 3', type: 'concept' }
        ],
        edges: []
      };

      const result = await generator.optimizeLayout(mindMap);

      expect(result.nodes).toHaveLength(3);
      result.nodes.forEach((node, index) => {
        expect(node).toHaveProperty('x');
        expect(node).toHaveProperty('y');
        expect(typeof node.x).toBe('number');
        expect(typeof node.y).toBe('number');
      });
    });

    it('should preserve existing positions when present', async () => {
      const mindMap: MindMap = {
        id: 'test-map',
        title: 'Test Map',
        nodes: [
          { id: 'node1', label: 'Node 1', type: 'root', x: 50, y: 60 },
          { id: 'node2', label: 'Node 2', type: 'concept', x: 100, y: 120 }
        ],
        edges: []
      };

      const result = await generator.optimizeLayout(mindMap);

      expect(result.nodes[0].x).toBe(50);
      expect(result.nodes[0].y).toBe(60);
      expect(result.nodes[1].x).toBe(100);
      expect(result.nodes[1].y).toBe(120);
    });

    it('should assign positions to nodes without coordinates', async () => {
      const mindMap: MindMap = {
        id: 'test-map',
        title: 'Test Map',
        nodes: [
          { id: 'node1', label: 'Node 1', type: 'root' },
          { id: 'node2', label: 'Node 2', type: 'concept' },
          { id: 'node3', label: 'Node 3', type: 'concept' }
        ],
        edges: []
      };

      const result = await generator.optimizeLayout(mindMap);

      expect(result.nodes[0].x).toBe(0);
      expect(result.nodes[0].y).toBe(0);
      expect(result.nodes[1].x).toBe(100);
      expect(result.nodes[1].y).toBe(0);
      expect(result.nodes[2].x).toBe(200);
      expect(result.nodes[2].y).toBe(0);
    });

    it('should handle empty mind map', async () => {
      const emptyMindMap: MindMap = {
        id: 'empty',
        title: 'Empty Map',
        nodes: [],
        edges: []
      };

      const result = await generator.optimizeLayout(emptyMindMap);

      expect(result.nodes).toHaveLength(0);
      expect(result.edges).toHaveLength(0);
    });

    it('should preserve all original properties', async () => {
      const mindMap: MindMap = {
        id: 'test-map',
        title: 'Test Map',
        nodes: [
          { 
            id: 'node1', 
            label: 'Node 1', 
            type: 'root',
            level: 0,
            importance: 0.9,
            category: 'main'
          }
        ],
        edges: [
          {
            id: 'edge1',
            from: 'node1',
            to: 'node2',
            type: 'hierarchy',
            strength: 'strong',
            label: 'connects'
          }
        ]
      };

      const result = await generator.optimizeLayout(mindMap);

      expect(result.id).toBe('test-map');
      expect(result.title).toBe('Test Map');
      expect(result.nodes[0].level).toBe(0);
      expect(result.nodes[0].importance).toBe(0.9);
      expect(result.nodes[0].category).toBe('main');
      expect(result.edges[0].label).toBe('connects');
    });
  });

  describe('analyzeComplexity', () => {
    it('should analyze mind map complexity correctly', async () => {
      const mindMap: MindMap = {
        id: 'test-map',
        title: 'Test Complexity',
        nodes: [
          { id: 'root', label: 'Root', type: 'root' },
          { id: 'node1', label: 'Node 1', type: 'concept' },
          { id: 'node2', label: 'Node 2', type: 'concept' },
          { id: 'node3', label: 'Node 3', type: 'concept' }
        ],
        edges: [
          { id: 'edge1', from: 'root', to: 'node1', type: 'hierarchy' },
          { id: 'edge2', from: 'root', to: 'node2', type: 'hierarchy' },
          { id: 'edge3', from: 'node1', to: 'node3', type: 'association' }
        ]
      };

      const result = await generator.analyzeComplexity(mindMap);

      expect(result).toHaveProperty('nodeCount', 4);
      expect(result).toHaveProperty('edgeCount', 3);
      expect(result).toHaveProperty('depth');
      expect(result).toHaveProperty('branchingFactor');
      expect(result).toHaveProperty('complexity');
      
      expect(typeof result.depth).toBe('number');
      expect(typeof result.branchingFactor).toBe('number');
      expect(['low', 'medium', 'high']).toContain(result.complexity);
    });

    it('should classify complexity levels correctly', async () => {
      // Low complexity
      const lowComplexityMap: MindMap = {
        id: 'low',
        title: 'Low Complexity',
        nodes: Array.from({length: 5}, (_, i) => ({
          id: `node${i}`,
          label: `Node ${i}`,
          type: i === 0 ? 'root' : 'concept'
        })),
        edges: []
      };

      let result = await generator.analyzeComplexity(lowComplexityMap);
      expect(result.complexity).toBe('low');

      // Medium complexity
      const mediumComplexityMap: MindMap = {
        id: 'medium',
        title: 'Medium Complexity',
        nodes: Array.from({length: 20}, (_, i) => ({
          id: `node${i}`,
          label: `Node ${i}`,
          type: i === 0 ? 'root' : 'concept'
        })),
        edges: []
      };

      result = await generator.analyzeComplexity(mediumComplexityMap);
      expect(['medium', 'low']).toContain(result.complexity); // Depends on depth

      // High complexity
      const highComplexityMap: MindMap = {
        id: 'high',
        title: 'High Complexity',
        nodes: Array.from({length: 40}, (_, i) => ({
          id: `node${i}`,
          label: `Node ${i}`,
          type: i === 0 ? 'root' : 'concept'
        })),
        edges: []
      };

      result = await generator.analyzeComplexity(highComplexityMap);
      expect(['high', 'medium']).toContain(result.complexity);
    });

    it('should calculate depth correctly', async () => {
      const deepMap: MindMap = {
        id: 'deep',
        title: 'Deep Map',
        nodes: [
          { id: 'root', label: 'Root', type: 'root' },
          { id: 'level1', label: 'Level 1', type: 'concept' },
          { id: 'level2', label: 'Level 2', type: 'concept' },
          { id: 'level3', label: 'Level 3', type: 'concept' }
        ],
        edges: [
          { id: 'e1', from: 'root', to: 'level1', type: 'hierarchy' },
          { id: 'e2', from: 'level1', to: 'level2', type: 'hierarchy' },
          { id: 'e3', from: 'level2', to: 'level3', type: 'hierarchy' }
        ]
      };

      const result = await generator.analyzeComplexity(deepMap);
      expect(result.depth).toBe(3);
    });

    it('should handle maps without root nodes', async () => {
      const noRootMap: MindMap = {
        id: 'no-root',
        title: 'No Root',
        nodes: [
          { id: 'node1', label: 'Node 1', type: 'concept' },
          { id: 'node2', label: 'Node 2', type: 'concept' }
        ],
        edges: []
      };

      const result = await generator.analyzeComplexity(noRootMap);
      expect(result.depth).toBe(0);
    });

    it('should calculate branching factor', async () => {
      const branchedMap: MindMap = {
        id: 'branched',
        title: 'Branched Map',
        nodes: [
          { id: 'root', label: 'Root', type: 'root' },
          { id: 'child1', label: 'Child 1', type: 'concept' },
          { id: 'child2', label: 'Child 2', type: 'concept' }
        ],
        edges: [
          { id: 'e1', from: 'root', to: 'child1', type: 'hierarchy' },
          { id: 'e2', from: 'root', to: 'child2', type: 'hierarchy' }
        ]
      };

      const result = await generator.analyzeComplexity(branchedMap);
      expect(result.branchingFactor).toBeCloseTo(2 / (3 - 1)); // 2 edges, 3 nodes
    });

    it('should handle empty or single-node maps', async () => {
      // Empty map
      const emptyMap: MindMap = {
        id: 'empty',
        title: 'Empty',
        nodes: [],
        edges: []
      };

      let result = await generator.analyzeComplexity(emptyMap);
      expect(result.nodeCount).toBe(0);
      expect(result.edgeCount).toBe(0);
      expect(result.branchingFactor).toBe(0);

      // Single node map
      const singleNodeMap: MindMap = {
        id: 'single',
        title: 'Single Node',
        nodes: [{ id: 'only', label: 'Only Node', type: 'root' }],
        edges: []
      };

      result = await generator.analyzeComplexity(singleNodeMap);
      expect(result.nodeCount).toBe(1);
      expect(result.branchingFactor).toBe(0);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle provider timeouts', async () => {
      mockProvider.setDelay(1000);
      
      const startTime = Date.now();
      const result = await generator.generateMindMap(
        'Timeout Test',
        ['concept'],
        'Test timeout handling',
        'beginner'
      );
      const duration = Date.now() - startTime;

      expect(result).toHaveProperty('nodes');
      expect(duration).toBeGreaterThan(500);
    }, 2000);

    it('should handle network errors gracefully', async () => {
      const networkErrorProvider = {
        ...mockProvider,
        generateStructuredOutput: jest.fn().mockRejectedValue(new Error('Network error'))
      };

      const networkGenerator = new MindMapGenerator(networkErrorProvider as any);

      await expect(networkGenerator.generateMindMap(
        'Network Test',
        ['concept'],
        'Test network errors',
        'beginner'
      )).rejects.toThrow('Failed to generate mind map: Network error');
    });

    it('should handle malformed responses', async () => {
      mockProvider.setMockResponse({
        // Missing required fields
        partialData: 'incomplete'
      });

      await expect(generator.generateMindMap(
        'Malformed Test',
        ['concept'],
        'Test malformed response',
        'beginner'
      )).rejects.toThrow('Invalid mind map structure');
    });

    it('should handle special characters in inputs', async () => {
      const specialTopic = 'Jung & Freud: A "Complex" Relationship (1900-1913)';
      const specialConcepts = ['öûa', 'ção', 'François', 'naïve'];

      const result = await generator.generateMindMap(
        specialTopic,
        specialConcepts,
        'Handle special characters',
        'intermediate'
      );

      expect(result).toHaveProperty('nodes');
      expect(result).toHaveProperty('edges');
    });

    it('should handle very large concept lists', async () => {
      const largeConcepts = Array.from({length: 100}, (_, i) => `concept-${i}`);

      const result = await generator.generateMindMap(
        'Large Concepts Test',
        largeConcepts,
        'Test large concept handling',
        'advanced'
      );

      expect(result).toHaveProperty('nodes');
      expect(result).toHaveProperty('edges');
    });

    it('should handle concurrent generation requests', async () => {
      const promises = Array.from({length: 3}, (_, i) =>
        generator.generateMindMap(
          `Concurrent Test ${i}`,
          [`concept-${i}`],
          `Objective ${i}`,
          'intermediate'
        )
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toHaveProperty('nodes');
        expect(result).toHaveProperty('edges');
        expect(result).toHaveProperty('id');
        
        // Each should have unique ID
        const uniqueIds = new Set(results.map(r => r.id));
        expect(uniqueIds.size).toBe(3);
      });
    });
  });

  describe('Performance and Memory Management', () => {
    it('should complete generation within reasonable time', async () => {
      const startTime = Date.now();

      const result = await generator.generateMindMap(
        'Performance Test',
        ['concept1', 'concept2', 'concept3'],
        'Test generation performance',
        'intermediate'
      );

      const duration = Date.now() - startTime;

      expect(result).toHaveProperty('nodes');
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it('should not leak memory with repeated generations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Generate multiple mind maps
      for (let i = 0; i < 5; i++) {
        await generator.generateMindMap(
          `Memory Test ${i}`,
          [`concept-${i}`],
          `Objective ${i}`,
          'beginner'
        );
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 5MB)
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024);
    });

    it('should handle large mind map optimization efficiently', async () => {
      const largeMindMap: MindMap = {
        id: 'large-map',
        title: 'Large Map',
        nodes: Array.from({length: 200}, (_, i) => ({
          id: `node-${i}`,
          label: `Node ${i}`,
          type: i === 0 ? 'root' : 'concept'
        })),
        edges: Array.from({length: 199}, (_, i) => ({
          id: `edge-${i}`,
          from: 'node-0',
          to: `node-${i + 1}`,
          type: 'hierarchy'
        }))
      };

      const startTime = Date.now();
      const result = await generator.optimizeLayout(largeMindMap);
      const duration = Date.now() - startTime;

      expect(result.nodes).toHaveLength(200);
      expect(duration).toBeLessThan(1000); // Should optimize within 1 second
    });

    it('should analyze complex maps efficiently', async () => {
      const complexMap: MindMap = {
        id: 'complex-analysis',
        title: 'Complex Analysis',
        nodes: Array.from({length: 100}, (_, i) => ({
          id: `node-${i}`,
          label: `Node ${i}`,
          type: i === 0 ? 'root' : 'concept'
        })),
        edges: Array.from({length: 150}, (_, i) => ({
          id: `edge-${i}`,
          from: `node-${Math.floor(i / 2)}`,
          to: `node-${Math.min(i + 1, 99)}`,
          type: 'hierarchy'
        }))
      };

      const startTime = Date.now();
      const result = await generator.analyzeComplexity(complexMap);
      const duration = Date.now() - startTime;

      expect(result.nodeCount).toBe(100);
      expect(result.edgeCount).toBe(150);
      expect(duration).toBeLessThan(500); // Should analyze within 0.5 seconds
    });
  });
});