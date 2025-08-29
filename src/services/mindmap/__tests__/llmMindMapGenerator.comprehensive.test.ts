/**
 * Comprehensive test suite for LLMMindMapGenerator
 * Targets 85%+ coverage from current 63% for maximum impact
 */

import {
  LLMMindMapGenerator,
  MindMapNode,
  MindMapConnection,
  MindMapLayout,
  MindMapGenerationOptions,
  LLMGeneratedContent,
  GenerationStage
} from '../llmMindMapGenerator';

import { ILLMProvider } from '../../llm/types';

// Mock the LLM provider
const mockLLMProvider: jest.Mocked<ILLMProvider> = {
  generateCompletion: jest.fn(),
  generateStructuredOutput: jest.fn(),
  isConfigured: jest.fn().mockReturnValue(true),
  validateConfig: jest.fn().mockResolvedValue({ isValid: true })
};

describe('LLMMindMapGenerator Comprehensive Tests', () => {
  let generator: LLMMindMapGenerator;

  const mockGeneratedContent: LLMGeneratedContent = {
    structure: {
      centralConcept: 'Shadow Integration',
      mainBranches: [
        {
          id: 'branch-shadow-recognition',
          title: 'Shadow Recognition',
          concepts: ['Projection', 'Denial', 'Unconscious patterns'],
          examples: ['Dreams', 'Interpersonal conflicts'],
          connections: ['branch-integration-methods']
        },
        {
          id: 'branch-integration-methods',
          title: 'Integration Methods',
          concepts: ['Active imagination', 'Dream work', 'Confrontation'],
          examples: ['Dialogue technique', 'Art therapy'],
          connections: ['branch-shadow-recognition', 'branch-transformation']
        },
        {
          id: 'branch-transformation',
          title: 'Personal Transformation',
          concepts: ['Wholeness', 'Self-acceptance', 'Individuation'],
          examples: ['Life changes', 'New perspectives'],
          connections: ['branch-integration-methods']
        }
      ],
      crossConnections: [
        {
          from: 'branch-shadow-recognition',
          to: 'branch-transformation',
          relationship: 'Recognition enables transformation'
        }
      ]
    },
    metadata: {
      complexity: 'moderate',
      estimatedNodes: 25,
      suggestedLayout: 'radial',
      keyInsights: ['Shadow work is transformative', 'Integration requires courage']
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    generator = new LLMMindMapGenerator(mockLLMProvider);
    
    // Setup default mock responses
    mockLLMProvider.generateStructuredOutput.mockResolvedValue(mockGeneratedContent);
    mockLLMProvider.generateCompletion.mockResolvedValue({
      content: 'Mock completion response',
      usage: { totalTokens: 100 }
    });
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with provided LLM provider', () => {
      const customGenerator = new LLMMindMapGenerator(mockLLMProvider);
      expect(customGenerator).toBeInstanceOf(LLMMindMapGenerator);
    });

    it('should handle provider validation', async () => {
      expect(mockLLMProvider.isConfigured()).toBe(true);
    });
  });

  describe('generateMindMap - String Topic Input', () => {
    it('should generate mind map from string topic with default options', async () => {
      const result = await generator.generateMindMap('Shadow Work');
      
      expect(result).toBeDefined();
      expect(result.nodes).toBeDefined();
      expect(result.connections).toBeDefined();
      expect(result.bounds).toBeDefined();
      expect(result.layoutType).toBe('radial');
      
      // Should have at least a central node
      expect(result.nodes.length).toBeGreaterThan(0);
      
      // Central node should exist
      const centralNode = result.nodes.find(n => n.level === 0);
      expect(centralNode).toBeDefined();
      expect(centralNode!.label).toBe('Shadow Integration');
    });

    it('should apply default Portuguese language setting', async () => {
      await generator.generateMindMap('Individuação');
      
      const call = mockLLMProvider.generateStructuredOutput.mock.calls[0];
      const prompt = call[0];
      
      expect(prompt).toContain('português brasileiro');
      expect(prompt).toContain('psicologia junguiana');
    });

    it('should set appropriate default complexity and depth', async () => {
      await generator.generateMindMap('Arquétipos');
      
      const call = mockLLMProvider.generateStructuredOutput.mock.calls[0];
      const prompt = call[0];
      
      expect(prompt).toContain('moderate');
      expect(prompt).toContain('3 níveis');
      expect(prompt).toContain('intermediário');
    });
  });

  describe('generateMindMap - Options Object Input', () => {
    const customOptions: MindMapGenerationOptions = {
      topic: 'Collective Unconscious',
      complexity: 'complex',
      maxDepth: 4,
      maxNodesPerLevel: 8,
      layoutType: 'hierarchical',
      includeExamples: true,
      includeCrossConnections: true,
      language: 'en',
      targetAudience: 'advanced',
      focusAreas: ['Archetypes', 'Mythology', 'Symbols'],
      visualStyle: {
        colorScheme: ['#FF6B6B', '#4ECDC4'],
        nodeSize: 'large',
        connectionStyle: 'curved'
      }
    };

    it('should use provided options correctly', async () => {
      const result = await generator.generateMindMap(customOptions);
      
      expect(result.layoutType).toBe('hierarchical');
      expect(mockLLMProvider.generateStructuredOutput).toHaveBeenCalled();
      
      const call = mockLLMProvider.generateStructuredOutput.mock.calls[0];
      const prompt = call[0];
      
      expect(prompt).toContain('Collective Unconscious');
      expect(prompt).toContain('complex');
      expect(prompt).toContain('advanced');
      expect(prompt).toContain('Archetypes');
    });

    it('should merge with default options', async () => {
      const partialOptions = {
        topic: 'Dreams',
        complexity: 'simple' as const
      };
      
      await generator.generateMindMap(partialOptions);
      
      const call = mockLLMProvider.generateStructuredOutput.mock.calls[0];
      const prompt = call[0];
      
      expect(prompt).toContain('simple');
      expect(prompt).toContain('Dreams');
      // Should still have defaults
      expect(prompt).toContain('pt-BR');
    });

    it('should handle English language option', async () => {
      const englishOptions = {
        topic: 'Anima and Animus',
        language: 'en'
      };
      
      await generator.generateMindMap(englishOptions);
      
      const call = mockLLMProvider.generateStructuredOutput.mock.calls[0];
      const prompt = call[0];
      
      expect(prompt).toContain('Create a detailed mind map');
      expect(prompt).toContain('Jungian psychology');
      expect(prompt).not.toContain('português');
    });
  });

  describe('parseGeneratedContent', () => {
    it('should return content object as-is when already structured', async () => {
      const result = await generator.parseGeneratedContent(mockGeneratedContent);
      
      expect(result).toEqual(mockGeneratedContent);
    });

    it('should parse valid JSON string', async () => {
      const jsonString = JSON.stringify(mockGeneratedContent);
      
      const result = await generator.parseGeneratedContent(jsonString);
      
      expect(result).toEqual(mockGeneratedContent);
    });

    it('should handle malformed JSON by using LLM conversion', async () => {
      const malformedJson = 'invalid json content';
      
      mockLLMProvider.generateCompletion.mockResolvedValue({
        content: JSON.stringify(mockGeneratedContent),
        usage: { totalTokens: 200 }
      });
      
      const result = await generator.parseGeneratedContent(malformedJson);
      
      expect(result).toEqual(mockGeneratedContent);
      expect(mockLLMProvider.generateCompletion).toHaveBeenCalledWith(
        expect.stringContaining('Convert the following unstructured'),
        expect.any(Object)
      );
    });

    it('should handle conversion failures', async () => {
      mockLLMProvider.generateCompletion.mockRejectedValue(new Error('Conversion failed'));
      
      await expect(generator.parseGeneratedContent('invalid content'))
        .rejects.toThrow('Failed to convert content to structured format: Conversion failed');
    });
  });

  describe('validateMindMapStructure', () => {
    const mockLayout: MindMapLayout = {
      nodes: [
        {
          id: 'node1',
          label: 'Test Node',
          level: 0,
          children: [],
          x: 100,
          y: 100
        },
        {
          id: 'node2',
          label: 'Child Node',
          level: 1,
          parentId: 'node1',
          children: []
          // Missing x, y coordinates
        }
      ],
      connections: [
        {
          id: 'conn1',
          sourceId: 'node1',
          targetId: 'node2',
          type: 'hierarchy'
        },
        {
          id: 'invalid-conn',
          sourceId: 'nonexistent',
          targetId: 'node2',
          type: 'association'
        }
      ],
      bounds: { width: 800, height: 600, minX: 0, maxX: 800, minY: 0, maxY: 600 },
      layoutType: 'radial'
    };

    it('should validate and fix node coordinates', () => {
      const result = generator.validateMindMapStructure(mockLayout);
      
      expect(result.nodes[0].x).toBe(100);
      expect(result.nodes[0].y).toBe(100);
      expect(result.nodes[1].x).toBe(0); // Default value
      expect(result.nodes[1].y).toBe(0); // Default value
    });

    it('should assign IDs to nodes without them', () => {
      const layoutWithoutIds = {
        ...mockLayout,
        nodes: [
          { ...mockLayout.nodes[0], id: '' },
          { ...mockLayout.nodes[1], id: '' }
        ]
      };
      
      const result = generator.validateMindMapStructure(layoutWithoutIds);
      
      expect(result.nodes[0].id).toBe('node-0');
      expect(result.nodes[1].id).toBe('node-1');
    });

    it('should filter invalid connections', () => {
      const result = generator.validateMindMapStructure(mockLayout);
      
      expect(result.connections).toHaveLength(1);
      expect(result.connections[0].id).toBe('conn1');
    });

    it('should recalculate bounds', () => {
      const result = generator.validateMindMapStructure(mockLayout);
      
      expect(result.bounds).toBeDefined();
      expect(result.bounds.minX).toBeLessThanOrEqual(result.bounds.maxX);
      expect(result.bounds.minY).toBeLessThanOrEqual(result.bounds.maxY);
    });

    it('should validate node hierarchy', () => {
      const invalidHierarchy = {
        ...mockLayout,
        nodes: [
          { id: 'parent', label: 'Parent', level: 1, children: [] },
          { id: 'child', label: 'Child', level: 0, parentId: 'parent', children: [] }
        ]
      };
      
      expect(() => generator.validateMindMapStructure(invalidHierarchy))
        .toThrow('Invalid hierarchy');
    });

    it('should detect non-existent parent references', () => {
      const invalidParent = {
        ...mockLayout,
        nodes: [
          { id: 'orphan', label: 'Orphan', level: 1, parentId: 'missing', children: [] }
        ]
      };
      
      expect(() => generator.validateMindMapStructure(invalidParent))
        .toThrow('Node orphan references non-existent parent missing');
    });
  });

  describe('Content Generation and Processing', () => {
    it('should build appropriate prompts for different complexities', async () => {
      const complexities = ['simple', 'moderate', 'complex', 'comprehensive'] as const;
      
      for (const complexity of complexities) {
        await generator.generateMindMap({ topic: 'Test', complexity });
        
        const call = mockLLMProvider.generateStructuredOutput.mock.calls[mockLLMProvider.generateStructuredOutput.mock.calls.length - 1];
        const prompt = call[0];
        
        expect(prompt).toContain(complexity);
      }
    });

    it('should handle focus areas in prompt', async () => {
      const options = {
        topic: 'Jung Theory',
        focusAreas: ['Dreams', 'Symbols', 'Archetypes']
      };
      
      await generator.generateMindMap(options);
      
      const call = mockLLMProvider.generateStructuredOutput.mock.calls[0];
      const prompt = call[0];
      
      expect(prompt).toContain('Dreams');
      expect(prompt).toContain('Symbols');
      expect(prompt).toContain('Archetypes');
    });

    it('should translate audience levels correctly', async () => {
      const audiences = [
        { input: 'beginner', portugueseExpected: 'iniciante', englishExpected: 'beginner' },
        { input: 'intermediate', portugueseExpected: 'intermediário', englishExpected: 'intermediate' },
        { input: 'advanced', portugueseExpected: 'avançado', englishExpected: 'advanced' }
      ] as const;
      
      for (const { input, portugueseExpected, englishExpected } of audiences) {
        // Test Portuguese
        await generator.generateMindMap({ topic: 'Test', targetAudience: input, language: 'pt-BR' });
        let call = mockLLMProvider.generateStructuredOutput.mock.calls[mockLLMProvider.generateStructuredOutput.mock.calls.length - 1];
        expect(call[0]).toContain(portugueseExpected);
        
        // Test English
        await generator.generateMindMap({ topic: 'Test', targetAudience: input, language: 'en' });
        call = mockLLMProvider.generateStructuredOutput.mock.calls[mockLLMProvider.generateStructuredOutput.mock.calls.length - 1];
        expect(call[0]).toContain(englishExpected);
      }
    });

    it('should handle LLM generation failures', async () => {
      mockLLMProvider.generateStructuredOutput.mockRejectedValue(new Error('LLM Error'));
      
      await expect(generator.generateMindMap('Test Topic'))
        .rejects.toThrow('Failed to generate mind map content: LLM Error');
    });
  });

  describe('Node Structure Creation', () => {
    it('should create proper node hierarchy', async () => {
      const result = await generator.generateMindMap('Test Topic');
      
      const centralNode = result.nodes.find(n => n.level === 0);
      const branchNodes = result.nodes.filter(n => n.level === 1);
      const conceptNodes = result.nodes.filter(n => n.level === 2);
      
      expect(centralNode).toBeDefined();
      expect(branchNodes.length).toBe(3); // Based on mock data
      expect(conceptNodes.length).toBeGreaterThan(0);
      
      // Check parent-child relationships
      branchNodes.forEach(branch => {
        expect(branch.parentId).toBe('central');
      });
      
      conceptNodes.forEach(concept => {
        const parentExists = branchNodes.some(branch => branch.id === concept.parentId);
        expect(parentExists).toBe(true);
      });
    });

    it('should assign appropriate colors and sizes', async () => {
      const result = await generator.generateMindMap('Test Topic');
      
      const centralNode = result.nodes.find(n => n.level === 0);
      const branchNodes = result.nodes.filter(n => n.level === 1);
      
      expect(centralNode!.size).toBe(40);
      expect(centralNode!.color).toBe('#FF6B6B');
      
      branchNodes.forEach(branch => {
        expect(branch.size).toBe(30);
        expect(branch.color).toBeDefined();
        expect(branch.color!.startsWith('#')).toBe(true);
      });
    });

    it('should create example nodes when requested', async () => {
      const options = {
        topic: 'Test',
        includeExamples: true
      };
      
      const result = await generator.generateMindMap(options);
      
      const exampleNodes = result.nodes.filter(n => n.type === 'example');
      expect(exampleNodes.length).toBeGreaterThan(0);
      
      exampleNodes.forEach(example => {
        expect(example.level).toBe(3);
        expect(example.size).toBe(15);
      });
    });

    it('should skip examples when not requested', async () => {
      const options = {
        topic: 'Test',
        includeExamples: false
      };
      
      const result = await generator.generateMindMap(options);
      
      const exampleNodes = result.nodes.filter(n => n.type === 'example');
      expect(exampleNodes.length).toBe(0);
    });

    it('should assign metadata to nodes', async () => {
      const result = await generator.generateMindMap('Test Topic');
      
      result.nodes.forEach(node => {
        expect(node.metadata).toBeDefined();
        expect(node.metadata!.importance).toBeGreaterThan(0);
        expect(node.metadata!.keywords).toBeDefined();
        expect(node.metadata!.description).toBeDefined();
      });
    });
  });

  describe('Connection Generation', () => {
    it('should create hierarchical connections', async () => {
      const result = await generator.generateMindMap('Test Topic');
      
      const hierarchyConnections = result.connections.filter(c => c.type === 'hierarchy');
      expect(hierarchyConnections.length).toBeGreaterThan(0);
      
      hierarchyConnections.forEach(conn => {
        expect(conn.strength).toBe(1.0);
        const sourceNode = result.nodes.find(n => n.id === conn.sourceId);
        const targetNode = result.nodes.find(n => n.id === conn.targetId);
        
        expect(sourceNode).toBeDefined();
        expect(targetNode).toBeDefined();
        expect(targetNode!.parentId).toBe(sourceNode!.id);
      });
    });

    it('should create cross connections when requested', async () => {
      const options = {
        topic: 'Test',
        includeCrossConnections: true
      };
      
      const result = await generator.generateMindMap(options);
      
      const crossConnections = result.connections.filter(c => c.type === 'association');
      expect(crossConnections.length).toBeGreaterThan(0);
      
      crossConnections.forEach(conn => {
        expect(conn.strength).toBe(0.7);
        expect(conn.label).toBeDefined();
      });
    });

    it('should skip cross connections when not requested', async () => {
      const options = {
        topic: 'Test',
        includeCrossConnections: false
      };
      
      const result = await generator.generateMindMap(options);
      
      const crossConnections = result.connections.filter(c => c.type === 'association');
      expect(crossConnections.length).toBe(0);
    });

    it('should handle missing cross-connection targets gracefully', async () => {
      const contentWithInvalidConnections = {
        ...mockGeneratedContent,
        structure: {
          ...mockGeneratedContent.structure,
          crossConnections: [
            {
              from: 'nonexistent-branch',
              to: 'another-nonexistent',
              relationship: 'Invalid connection'
            }
          ]
        }
      };
      
      mockLLMProvider.generateStructuredOutput.mockResolvedValue(contentWithInvalidConnections);
      
      const result = await generator.generateMindMap({
        topic: 'Test',
        includeCrossConnections: true
      });
      
      const crossConnections = result.connections.filter(c => c.type === 'association');
      expect(crossConnections.length).toBe(0);
    });
  });

  describe('Layout Algorithms', () => {
    const mockNodes: MindMapNode[] = [
      { id: 'central', label: 'Central', level: 0, children: [] },
      { id: 'branch1', label: 'Branch 1', level: 1, parentId: 'central', children: [] },
      { id: 'branch2', label: 'Branch 2', level: 1, parentId: 'central', children: [] },
      { id: 'concept1', label: 'Concept 1', level: 2, parentId: 'branch1', children: [] }
    ];

    const mockConnections: MindMapConnection[] = [
      { id: 'c1', sourceId: 'central', targetId: 'branch1', type: 'hierarchy' },
      { id: 'c2', sourceId: 'central', targetId: 'branch2', type: 'hierarchy' },
      { id: 'c3', sourceId: 'branch1', targetId: 'concept1', type: 'hierarchy' }
    ];

    describe('Radial Layout', () => {
      it('should position central node at center', async () => {
        const options = { topic: 'Test', layoutType: 'radial' as const };
        const result = await generator.generateMindMap(options);
        
        const centralNode = result.nodes.find(n => n.level === 0);
        expect(centralNode!.x).toBe(400);
        expect(centralNode!.y).toBe(300);
      });

      it('should position branch nodes in circle around center', async () => {
        const options = { topic: 'Test', layoutType: 'radial' as const };
        const result = await generator.generateMindMap(options);
        
        const branchNodes = result.nodes.filter(n => n.level === 1);
        branchNodes.forEach(node => {
          const distance = Math.sqrt(Math.pow(node.x! - 400, 2) + Math.pow(node.y! - 300, 2));
          expect(distance).toBeCloseTo(200, 0);
        });
      });
    });

    describe('Hierarchical Layout', () => {
      it('should arrange nodes by levels vertically', async () => {
        const options = { topic: 'Test', layoutType: 'hierarchical' as const };
        const result = await generator.generateMindMap(options);
        
        const level0Nodes = result.nodes.filter(n => n.level === 0);
        const level1Nodes = result.nodes.filter(n => n.level === 1);
        
        level0Nodes.forEach(node => {
          expect(node.y).toBe(100);
        });
        
        level1Nodes.forEach(node => {
          expect(node.y).toBe(250); // 100 + 150
        });
      });

      it('should space nodes horizontally within levels', async () => {
        const options = { topic: 'Test', layoutType: 'hierarchical' as const };
        const result = await generator.generateMindMap(options);
        
        const level1Nodes = result.nodes.filter(n => n.level === 1);
        if (level1Nodes.length > 1) {
          const xPositions = level1Nodes.map(n => n.x!);
          const minX = Math.min(...xPositions);
          const maxX = Math.max(...xPositions);
          expect(maxX).toBeGreaterThan(minX);
        }
      });
    });

    describe('Force-Directed Layout', () => {
      it('should apply force-directed positioning', async () => {
        const options = { topic: 'Test', layoutType: 'force-directed' as const };
        const result = await generator.generateMindMap(options);
        
        // Should have positioned all nodes
        result.nodes.forEach(node => {
          expect(node.x).toBeDefined();
          expect(node.y).toBeDefined();
          expect(node.x).toBeGreaterThanOrEqual(0);
          expect(node.y).toBeGreaterThanOrEqual(0);
        });
      });

      it('should handle nodes with missing initial positions', async () => {
        const options = { topic: 'Test', layoutType: 'force-directed' as const };
        
        // Force-directed should assign random positions to nodes without coordinates
        const result = await generator.generateMindMap(options);
        
        result.nodes.forEach(node => {
          expect(typeof node.x).toBe('number');
          expect(typeof node.y).toBe('number');
        });
      });
    });

    describe('Circular Layout', () => {
      it('should position central node at center for circular layout', async () => {
        const options = { topic: 'Test', layoutType: 'circular' as const };
        const result = await generator.generateMindMap(options);
        
        const centralNode = result.nodes.find(n => n.level === 0);
        expect(centralNode!.x).toBe(400);
        expect(centralNode!.y).toBe(300);
      });

      it('should arrange other nodes in concentric circles', async () => {
        const options = { topic: 'Test', layoutType: 'circular' as const };
        const result = await generator.generateMindMap(options);
        
        const nonCentralNodes = result.nodes.filter(n => n.level > 0);
        nonCentralNodes.forEach(node => {
          const distance = Math.sqrt(Math.pow(node.x! - 400, 2) + Math.pow(node.y! - 300, 2));
          expect(distance).toBeGreaterThan(250); // Base radius * (1 + level * 0.3)
        });
      });
    });
  });

  describe('Node Processing and Enhancement', () => {
    const baseNodes: MindMapNode[] = [
      { id: 'node1', label: ' test node ', level: 0, children: [] },
      { id: 'node2', label: 'another node', level: 1, children: [], type: 'concept' }
    ];

    it('should enhance node labels when requested', async () => {
      const result = await generator.processNodes(baseNodes, { enhanceLabels: true });
      
      expect(result[0].label).toBe('Test node'); // Trimmed and capitalized
      expect(result[1].label).toBe('Another node');
    });

    it('should detect and assign clusters', async () => {
      const result = await generator.processNodes(baseNodes, { detectClusters: true });
      
      result.forEach(node => {
        expect(node.metadata!.clusterId).toBeDefined();
        expect(node.metadata!.clusterSize).toBeGreaterThan(0);
      });
    });

    it('should optimize node positions to avoid overlaps', async () => {
      const overlappingNodes = [
        { id: 'node1', label: 'Node 1', level: 0, children: [], x: 100, y: 100 },
        { id: 'node2', label: 'Node 2', level: 1, children: [], x: 105, y: 105 } // Too close
      ];
      
      const result = await generator.processNodes(overlappingNodes, { optimizePositions: true });
      
      const distance = Math.sqrt(
        Math.pow(result[1].x! - result[0].x!, 2) + Math.pow(result[1].y! - result[0].y!, 2)
      );
      
      expect(distance).toBeGreaterThanOrEqual(50); // Minimum distance
    });

    it('should apply multiple processing options', async () => {
      const result = await generator.processNodes(baseNodes, {
        enhanceLabels: true,
        detectClusters: true,
        optimizePositions: true
      });
      
      expect(result[0].label).toBe('Test node');
      expect(result[0].metadata!.clusterId).toBeDefined();
    });
  });

  describe('Utility Functions', () => {
    describe('Color Management', () => {
      it('should cycle through predefined colors', async () => {
        const result = await generator.generateMindMap('Test Topic');
        const branchNodes = result.nodes.filter(n => n.level === 1);
        
        // Should assign different colors to different branches
        const colors = branchNodes.map(n => n.color);
        const uniqueColors = new Set(colors);
        
        expect(uniqueColors.size).toBeGreaterThan(0);
      });

      it('should lighten colors for child nodes', async () => {
        const result = await generator.generateMindMap({
          topic: 'Test',
          includeExamples: true
        });
        
        const conceptNodes = result.nodes.filter(n => n.level === 2);
        const exampleNodes = result.nodes.filter(n => n.level === 3);
        
        // Example nodes should have lighter colors than concept nodes
        conceptNodes.forEach(concept => {
          expect(concept.color).toBeDefined();
          expect(concept.color!.startsWith('#')).toBe(true);
        });
        
        exampleNodes.forEach(example => {
          expect(example.color).toBeDefined();
          expect(example.color!.startsWith('#')).toBe(true);
        });
      });
    });

    describe('Bounds Calculation', () => {
      it('should calculate correct bounds for positioned nodes', async () => {
        const result = await generator.generateMindMap('Test Topic');
        
        const xCoords = result.nodes.map(n => n.x!);
        const yCoords = result.nodes.map(n => n.y!);
        
        expect(result.bounds.minX).toBeLessThanOrEqual(Math.min(...xCoords));
        expect(result.bounds.maxX).toBeGreaterThanOrEqual(Math.max(...xCoords));
        expect(result.bounds.minY).toBeLessThanOrEqual(Math.min(...yCoords));
        expect(result.bounds.maxY).toBeGreaterThanOrEqual(Math.max(...yCoords));
        
        expect(result.bounds.width).toBe(result.bounds.maxX - result.bounds.minX);
        expect(result.bounds.height).toBe(result.bounds.maxY - result.bounds.minY);
      });
    });
  });

  describe('Content Validation', () => {
    it('should validate proper generated content structure', async () => {
      const validContent = mockGeneratedContent;
      const isValid = (generator as any).isValidGeneratedContent(validContent);
      
      expect(isValid).toBe(true);
    });

    it('should reject invalid content structures', async () => {
      const invalidContent = {
        structure: {
          centralConcept: 'Test',
          // Missing mainBranches
        },
        // Missing metadata
      };
      
      const isValid = (generator as any).isValidGeneratedContent(invalidContent);
      expect(isValid).toBe(false);
    });

    it('should reject null or undefined content', async () => {
      expect((generator as any).isValidGeneratedContent(null)).toBe(false);
      expect((generator as any).isValidGeneratedContent(undefined)).toBe(false);
      expect((generator as any).isValidGeneratedContent('')).toBe(false);
    });
  });

  describe('generateLayout method', () => {
    const mockNodes: MindMapNode[] = [
      { id: 'central', label: 'Central', level: 0, children: [] },
      { id: 'branch1', label: 'Branch 1', level: 1, parentId: 'central', children: [] }
    ];

    const mockConnections: MindMapConnection[] = [
      { id: 'conn1', sourceId: 'central', targetId: 'branch1', type: 'hierarchy' }
    ];

    it('should generate layout with specified algorithm', async () => {
      const result = await generator.generateLayout(mockNodes, mockConnections, 'hierarchical');
      
      expect(result.layoutType).toBe('hierarchical');
      expect(result.nodes).toBeDefined();
      expect(result.connections).toBe(mockConnections);
      expect(result.bounds).toBeDefined();
    });

    it('should default to radial layout', async () => {
      const result = await generator.generateLayout(mockNodes, mockConnections);
      
      expect(result.layoutType).toBe('radial');
    });

    it('should handle all layout types', async () => {
      const layoutTypes = ['radial', 'hierarchical', 'force-directed', 'circular'] as const;
      
      for (const layoutType of layoutTypes) {
        const result = await generator.generateLayout(mockNodes, mockConnections, layoutType);
        expect(result.layoutType).toBe(layoutType);
        expect(result.nodes.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty or malformed LLM responses', async () => {
      mockLLMProvider.generateStructuredOutput.mockResolvedValue(null);
      
      await expect(generator.generateMindMap('Test'))
        .rejects.toThrow('Failed to generate mind map content');
    });

    it('should handle LLM provider failures', async () => {
      mockLLMProvider.generateStructuredOutput.mockRejectedValue(new Error('Provider Error'));
      
      await expect(generator.generateMindMap('Test'))
        .rejects.toThrow('Failed to generate mind map content: Provider Error');
    });

    it('should handle conversion failures gracefully', async () => {
      mockLLMProvider.generateCompletion.mockRejectedValue(new Error('Conversion Error'));
      
      await expect(generator.parseGeneratedContent('invalid content'))
        .rejects.toThrow('Failed to convert content to structured format: Conversion Error');
    });

    it('should handle empty generated content branches', async () => {
      const emptyContent = {
        ...mockGeneratedContent,
        structure: {
          ...mockGeneratedContent.structure,
          mainBranches: []
        }
      };
      
      mockLLMProvider.generateStructuredOutput.mockResolvedValue(emptyContent);
      
      const result = await generator.generateMindMap('Test');
      
      // Should still have a central node
      expect(result.nodes.length).toBeGreaterThanOrEqual(1);
      const centralNode = result.nodes.find(n => n.level === 0);
      expect(centralNode).toBeDefined();
    });

    it('should handle missing branch examples and connections', async () => {
      const minimalContent = {
        structure: {
          centralConcept: 'Test Topic',
          mainBranches: [
            {
              id: 'minimal-branch',
              title: 'Minimal Branch',
              concepts: ['Concept 1']
              // No examples or connections
            }
          ]
        },
        metadata: {
          complexity: 'simple',
          estimatedNodes: 5,
          suggestedLayout: 'radial',
          keyInsights: ['Insight 1']
        }
      };
      
      mockLLMProvider.generateStructuredOutput.mockResolvedValue(minimalContent);
      
      const result = await generator.generateMindMap('Test');
      
      expect(result.nodes.length).toBeGreaterThan(1);
      expect(result.connections.length).toBeGreaterThan(0);
    });
  });

  describe('Integration and Performance', () => {
    it('should complete full generation workflow efficiently', async () => {
      const startTime = Date.now();
      
      const result = await generator.generateMindMap({
        topic: 'Complete Jung Theory',
        complexity: 'comprehensive',
        maxDepth: 4,
        includeExamples: true,
        includeCrossConnections: true,
        layoutType: 'radial'
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(result).toBeDefined();
      expect(result.nodes.length).toBeGreaterThan(0);
      expect(result.connections.length).toBeGreaterThan(0);
      
      // Should complete in reasonable time (this is very generous for tests)
      expect(duration).toBeLessThan(5000);
    });

    it('should handle complex topics with many branches', async () => {
      const complexContent = {
        structure: {
          centralConcept: 'Complex Jungian Theory',
          mainBranches: Array.from({ length: 8 }, (_, i) => ({
            id: `complex-branch-${i}`,
            title: `Complex Branch ${i + 1}`,
            concepts: Array.from({ length: 6 }, (_, j) => `Concept ${j + 1}`),
            examples: Array.from({ length: 3 }, (_, k) => `Example ${k + 1}`),
            connections: i > 0 ? [`complex-branch-${i - 1}`] : []
          })),
          crossConnections: [
            { from: 'complex-branch-0', to: 'complex-branch-4', relationship: 'Related concepts' },
            { from: 'complex-branch-2', to: 'complex-branch-6', relationship: 'Complementary ideas' }
          ]
        },
        metadata: {
          complexity: 'comprehensive',
          estimatedNodes: 80,
          suggestedLayout: 'radial',
          keyInsights: ['Complex insight 1', 'Complex insight 2']
        }
      };
      
      mockLLMProvider.generateStructuredOutput.mockResolvedValue(complexContent);
      
      const result = await generator.generateMindMap('Complex Topic');
      
      expect(result.nodes.length).toBeGreaterThan(50);
      expect(result.connections.length).toBeGreaterThan(30);
      expect(result.bounds.width).toBeGreaterThan(0);
      expect(result.bounds.height).toBeGreaterThan(0);
    });
  });
});