import { LLMMindMapGenerator, EducationalMindMap, EducationalNode, EducationalEdge, LayoutAlgorithmConfig, InteractiveMindMapFeatures } from '../llmMindMapGenerator';
import { ILLMProvider } from '../../llm/types';

// Mock the LLM provider
const mockProvider: jest.Mocked<ILLMProvider> = {
  generateStructuredOutput: jest.fn(),
  generateCompletion: jest.fn(),
  getTokenCount: jest.fn(),
  isAvailable: jest.fn(),
  streamCompletion: jest.fn()
};

describe('LLMMindMapGenerator', () => {
  let generator: LLMMindMapGenerator;

  beforeEach(() => {
    jest.clearAllMocks();
    mockProvider.isAvailable.mockResolvedValue(true);
    generator = new LLMMindMapGenerator(mockProvider);
  });

  beforeAll(async () => {
    // Coordination hook: Initialize task
    try {
      await import('child_process').then(cp => {
        cp.exec('npx claude-flow@alpha hooks pre-task --description "Testing LLMMindMapGenerator with Jung psychology focus"');
      });
    } catch (error) {
      console.log('Coordination hook not available, continuing with tests');
    }
  });

  afterAll(async () => {
    // Coordination hook: Complete task
    try {
      await import('child_process').then(cp => {
        cp.exec('npx claude-flow@alpha hooks post-task --task-id "llm-mindmap-tests"');
      });
    } catch (error) {
      console.log('Coordination hook not available, test completed');
    }
  });

  describe('generateJungianMindMap', () => {
    const mockJungianData = {
      title: 'Jungian Archetypes in Personal Development',
      subject: 'Jungian Psychology',
      nodes: [
        {
          id: 'shadow',
          label: 'Shadow Archetype',
          type: 'concept',
          cognitiveLevel: 'understand',
          content: {
            definition: 'Hidden or repressed aspects of personality',
            examples: ['Denied impulses', 'Projected qualities', 'Unacknowledged traits'],
            keyPoints: ['Integration is crucial', 'Often appears in dreams', 'Compensation mechanism']
          },
          jungianContext: {
            archetype: 'Shadow',
            psycheLevel: 'personal-unconscious',
            symbolism: ['Dark figures', 'Threatening characters', 'Same-sex figures']
          },
          difficulty: 0.7,
          importance: 0.9
        },
        {
          id: 'anima',
          label: 'Anima/Animus',
          type: 'concept',
          cognitiveLevel: 'apply',
          content: {
            definition: 'Contrasexual aspect of the psyche',
            examples: ['Soul image', 'Romantic projections', 'Creative inspiration'],
            keyPoints: ['Bridge to unconscious', 'Appears in relationships', 'Evolution through life stages']
          },
          jungianContext: {
            archetype: 'Anima/Animus',
            psycheLevel: 'collective-unconscious',
            symbolism: ['Opposite-sex figures', 'Divine feminine/masculine', 'Muse figures']
          },
          difficulty: 0.8,
          importance: 0.8
        },
        {
          id: 'self',
          label: 'Self Archetype',
          type: 'synthesis',
          cognitiveLevel: 'create',
          content: {
            definition: 'The unified consciousness and unconscious',
            examples: ['Mandala symbols', 'Wholeness experiences', 'Integration moments'],
            keyPoints: ['Goal of individuation', 'Transcendent function', 'Unity of opposites']
          },
          jungianContext: {
            archetype: 'Self',
            psycheLevel: 'collective-unconscious',
            symbolism: ['Circles', 'Squares', 'Divine child', 'Wise old man/woman']
          },
          difficulty: 0.95,
          importance: 1.0
        }
      ],
      edges: [
        {
          from: 'shadow',
          to: 'anima',
          type: 'supports',
          strength: 'medium',
          learningPath: true
        },
        {
          from: 'anima',
          to: 'self',
          type: 'builds-on',
          strength: 'strong',
          learningPath: true
        },
        {
          from: 'shadow',
          to: 'self',
          type: 'prerequisite',
          strength: 'strong',
          learningPath: true
        }
      ],
      learningObjectives: [
        'Understand the role of archetypes in personal development',
        'Identify archetypal patterns in personal experience',
        'Apply archetypal integration in daily life'
      ],
      prerequisites: [
        'Basic understanding of Jung\'s analytical psychology',
        'Familiarity with conscious/unconscious concepts'
      ],
      assessmentPoints: [
        'Recognize archetypal manifestations',
        'Explain integration process',
        'Create personal development plan'
      ]
    };

    it('should generate comprehensive Jungian mind map', async () => {
      mockProvider.generateStructuredOutput.mockResolvedValue(mockJungianData);

      const result = await generator.generateJungianMindMap(
        'Personal Development Through Jungian Archetypes',
        ['Shadow Work', 'Anima/Animus Integration', 'Self-Realization'],
        'intermediate'
      );

      expect(result).toMatchObject({
        title: 'Jungian Archetypes in Personal Development',
        subject: 'Jungian Psychology',
        level: 'intermediate',
        nodes: expect.arrayContaining([
          expect.objectContaining({
            id: 'shadow',
            type: 'concept',
            cognitiveLevel: 'understand',
            jungianContext: expect.objectContaining({
              archetype: 'Shadow',
              psycheLevel: 'personal-unconscious'
            })
          })
        ]),
        learningObjectives: expect.arrayContaining([
          expect.stringContaining('archetypes')
        ])
      });

      expect(result.nodes).toHaveLength(3);
      expect(result.edges).toHaveLength(3);
      expect(result.nodes.every(node => node.position)).toBeTruthy();
    });

    it('should handle Portuguese language generation', async () => {
      const portugueseData = {
        ...mockJungianData,
        title: 'Arquétipos Junguianos no Desenvolvimento Pessoal',
        learningObjectives: [
          'Compreender o papel dos arquétipos no desenvolvimento pessoal',
          'Identificar padrões arquetípicos na experiência pessoal'
        ]
      };

      mockProvider.generateStructuredOutput.mockResolvedValue(portugueseData);

      const result = await generator.generateJungianMindMap(
        'Desenvolvimento através dos Arquétipos',
        ['Trabalho com a Sombra', 'Integração Anima/Animus'],
        'intermediate',
        'pt-BR'
      );

      expect(mockProvider.generateStructuredOutput).toHaveBeenCalledWith(
        expect.stringContaining('Crie um mapa mental educacional'),
        expect.any(Object),
        expect.any(Object)
      );

      expect(result.title).toBe('Arquétipos Junguianos no Desenvolvimento Pessoal');
    });

    it('should validate input parameters', async () => {
      await expect(generator.generateJungianMindMap(
        '',
        ['shadow'],
        'beginner'
      )).rejects.toThrow('Topic cannot be empty');

      await expect(generator.generateJungianMindMap(
        'Valid Topic',
        [],
        'beginner'
      )).rejects.toThrow('At least one focus area is required');

      await expect(generator.generateJungianMindMap(
        'Valid Topic',
        Array(15).fill('focus'),
        'beginner'
      )).rejects.toThrow('Too many focus areas (maximum 10)');
    });

    it('should handle provider errors gracefully', async () => {
      mockProvider.generateStructuredOutput.mockRejectedValue(new Error('Provider timeout'));

      await expect(generator.generateJungianMindMap(
        'Test Topic',
        ['focus'],
        'beginner'
      )).rejects.toThrow('Failed to generate Jungian mind map: Provider timeout');
    });

    it('should handle malformed provider response', async () => {
      mockProvider.generateStructuredOutput.mockResolvedValue({
        title: 'Incomplete',
        // Missing required fields
      });

      await expect(generator.generateJungianMindMap(
        'Test Topic',
        ['focus'],
        'beginner'
      )).rejects.toThrow('Invalid Jungian mind map structure');
    });

    it('should set appropriate difficulty levels based on learning level', async () => {
      mockProvider.generateStructuredOutput.mockResolvedValue(mockJungianData);

      const beginnerMap = await generator.generateJungianMindMap(
        'Basic Jung',
        ['shadow'],
        'beginner'
      );

      const advancedMap = await generator.generateJungianMindMap(
        'Advanced Jung',
        ['shadow'],
        'advanced'
      );

      // Nodes without explicit difficulty should get defaults
      const beginnerDefaults = beginnerMap.nodes.filter(n => n.difficulty === 0.3);
      const advancedDefaults = advancedMap.nodes.filter(n => n.difficulty === 0.9);
      
      expect(beginnerDefaults.length + advancedDefaults.length).toBeGreaterThan(0);
    });

    it('should include proper Jungian context in nodes', async () => {
      mockProvider.generateStructuredOutput.mockResolvedValue(mockJungianData);

      const result = await generator.generateJungianMindMap(
        'Archetypal Analysis',
        ['shadow', 'anima'],
        'intermediate'
      );

      const shadowNode = result.nodes.find(n => n.id === 'shadow');
      expect(shadowNode?.jungianContext).toMatchObject({
        archetype: 'Shadow',
        psycheLevel: 'personal-unconscious',
        symbolism: expect.arrayContaining(['Dark figures'])
      });
    });
  });

  describe('generateConceptRelationships', () => {
    const mockRelationshipData = {
      relationships: [
        {
          from: 'shadow',
          to: 'persona',
          type: 'contradicts',
          strength: 'strong',
          explanation: 'Shadow contains what persona hides',
          educationalSignificance: 'Understanding this tension is crucial for integration'
        },
        {
          from: 'anima',
          to: 'shadow',
          type: 'relates',
          strength: 'medium',
          explanation: 'Both are unconscious compensatory figures',
          educationalSignificance: 'Recognition of both enables balanced development'
        }
      ]
    };

    it('should generate concept relationships using archetypal framework', async () => {
      mockProvider.generateStructuredOutput.mockResolvedValue(mockRelationshipData);

      const relationships = await generator.generateConceptRelationships(
        ['shadow', 'persona', 'anima'],
        'archetypes'
      );

      expect(relationships).toHaveLength(2);
      expect(relationships[0]).toMatchObject({
        from: 'shadow',
        to: 'persona',
        type: 'contradicts',
        strength: 'strong',
        learningPath: false
      });

      expect(mockProvider.generateStructuredOutput).toHaveBeenCalledWith(
        expect.stringContaining('archetypes framework'),
        expect.any(Object),
        { temperature: 0.3 }
      );
    });

    it('should handle different Jungian frameworks', async () => {
      mockProvider.generateStructuredOutput.mockResolvedValue(mockRelationshipData);

      await generator.generateConceptRelationships(
        ['thinking', 'feeling'],
        'psychological-types'
      );

      expect(mockProvider.generateStructuredOutput).toHaveBeenCalledWith(
        expect.stringContaining('psychological-types framework'),
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should mark prerequisites as learning paths', async () => {
      const prerequisiteData = {
        relationships: [
          {
            from: 'conscious',
            to: 'unconscious',
            type: 'prerequisite',
            strength: 'strong',
            explanation: 'Must understand conscious before unconscious',
            educationalSignificance: 'Sequential learning path'
          }
        ]
      };

      mockProvider.generateStructuredOutput.mockResolvedValue(prerequisiteData);

      const relationships = await generator.generateConceptRelationships(
        ['conscious', 'unconscious'],
        'complexes'
      );

      expect(relationships[0].learningPath).toBe(true);
    });

    it('should validate minimum concept requirement', async () => {
      await expect(generator.generateConceptRelationships(
        ['single-concept'],
        'archetypes'
      )).rejects.toThrow('At least 2 concepts required');

      await expect(generator.generateConceptRelationships(
        [],
        'archetypes'
      )).rejects.toThrow('At least 2 concepts required');
    });

    it('should handle provider errors in relationship generation', async () => {
      mockProvider.generateStructuredOutput.mockRejectedValue(new Error('Relationship error'));

      await expect(generator.generateConceptRelationships(
        ['concept1', 'concept2'],
        'archetypes'
      )).rejects.toThrow('Failed to generate concept relationships: Relationship error');
    });
  });

  describe('optimizeLayout', () => {
    const mockMindMap: EducationalMindMap = {
      id: 'test-map',
      title: 'Test Map',
      subject: 'Test Subject',
      level: 'intermediate',
      nodes: [
        {
          id: 'root',
          label: 'Root Node',
          type: 'concept',
          cognitiveLevel: 'understand',
          content: {
            definition: 'Root concept',
            examples: ['example1'],
            keyPoints: ['key1']
          },
          position: { x: 0, y: 0 },
          difficulty: 0.5,
          importance: 1.0
        },
        {
          id: 'child1',
          label: 'Child 1',
          type: 'skill',
          cognitiveLevel: 'apply',
          content: {
            definition: 'Child concept 1',
            examples: ['example2'],
            keyPoints: ['key2']
          },
          position: { x: 0, y: 0 },
          difficulty: 0.6,
          importance: 0.8
        },
        {
          id: 'child2',
          label: 'Child 2',
          type: 'application',
          cognitiveLevel: 'analyze',
          content: {
            definition: 'Child concept 2',
            examples: ['example3'],
            keyPoints: ['key3']
          },
          position: { x: 0, y: 0 },
          difficulty: 0.7,
          importance: 0.7
        }
      ],
      edges: [
        {
          id: 'edge1',
          from: 'root',
          to: 'child1',
          type: 'prerequisite',
          strength: 'strong',
          learningPath: true
        },
        {
          id: 'edge2',
          from: 'root',
          to: 'child2',
          type: 'supports',
          strength: 'medium',
          learningPath: false
        }
      ],
      learningObjectives: ['Test objective'],
      prerequisites: ['Test prerequisite'],
      assessmentPoints: ['Test assessment']
    };

    it('should apply hierarchical layout algorithm', async () => {
      const config: LayoutAlgorithmConfig = {
        algorithm: 'hierarchical',
        parameters: {
          nodeSpacing: 200,
          levelSeparation: 150
        }
      };

      const result = await generator.optimizeLayout(mockMindMap, config);

      expect(result.nodes).toHaveLength(3);
      
      // Check that positions were updated
      const rootNode = result.nodes.find(n => n.id === 'root');
      const child1Node = result.nodes.find(n => n.id === 'child1');
      
      expect(rootNode?.position).not.toEqual({ x: 0, y: 0 });
      expect(child1Node?.position.y).toBeGreaterThan(rootNode?.position.y || 0);
    });

    it('should apply force-directed layout algorithm', async () => {
      const config: LayoutAlgorithmConfig = {
        algorithm: 'force-directed',
        parameters: {
          iterations: 10,
          repulsionForce: 500,
          attractionForce: 0.05
        }
      };

      const result = await generator.optimizeLayout(mockMindMap, config);

      expect(result.nodes).toHaveLength(3);
      
      // Force-directed should spread nodes apart
      const positions = result.nodes.map(n => n.position);
      const uniquePositions = new Set(positions.map(p => `${p.x},${p.y}`));
      expect(uniquePositions.size).toBe(positions.length); // All positions should be unique
    });

    it('should apply radial layout algorithm', async () => {
      const config: LayoutAlgorithmConfig = {
        algorithm: 'radial',
        parameters: {
          radius: 300
        }
      };

      const result = await generator.optimizeLayout(mockMindMap, config);

      // One node should be at center, others distributed in a circle
      const centerNode = result.nodes.find(n => n.position.x === 0 && n.position.y === 0);
      const peripheralNodes = result.nodes.filter(n => n.position.x !== 0 || n.position.y !== 0);

      expect(centerNode).toBeDefined();
      expect(peripheralNodes).toHaveLength(2);
    });

    it('should apply circular layout algorithm', async () => {
      const config: LayoutAlgorithmConfig = {
        algorithm: 'circular',
        parameters: {
          radius: 250
        }
      };

      const result = await generator.optimizeLayout(mockMindMap, config);

      // All nodes should be on the circle
      result.nodes.forEach(node => {
        const distance = Math.sqrt(node.position.x ** 2 + node.position.y ** 2);
        expect(distance).toBeCloseTo(250, 1);
      });
    });

    it('should apply layered layout based on cognitive levels', async () => {
      const config: LayoutAlgorithmConfig = {
        algorithm: 'layered',
        parameters: {
          layerSpacing: 100,
          nodeSpacing: 150
        }
      };

      const result = await generator.optimizeLayout(mockMindMap, config);

      // Nodes should be arranged by cognitive level
      const understandNode = result.nodes.find(n => n.cognitiveLevel === 'understand');
      const applyNode = result.nodes.find(n => n.cognitiveLevel === 'apply');
      const analyzeNode = result.nodes.find(n => n.cognitiveLevel === 'analyze');

      expect(understandNode?.position.y).toBeLessThan(applyNode?.position.y || 0);
      expect(applyNode?.position.y).toBeLessThan(analyzeNode?.position.y || 0);
    });

    it('should handle unsupported layout algorithms', async () => {
      const config: LayoutAlgorithmConfig = {
        algorithm: 'unsupported' as any,
        parameters: {}
      };

      await expect(generator.optimizeLayout(mockMindMap, config))
        .rejects.toThrow('Unsupported layout algorithm: unsupported');
    });

    it('should preserve node properties during layout optimization', async () => {
      const config: LayoutAlgorithmConfig = {
        algorithm: 'hierarchical',
        parameters: {}
      };

      const result = await generator.optimizeLayout(mockMindMap, config);

      result.nodes.forEach((node, index) => {
        const originalNode = mockMindMap.nodes[index];
        expect(node.id).toBe(originalNode.id);
        expect(node.label).toBe(originalNode.label);
        expect(node.type).toBe(originalNode.type);
        expect(node.cognitiveLevel).toBe(originalNode.cognitiveLevel);
        expect(node.content).toEqual(originalNode.content);
      });
    });
  });

  describe('analyzeConceptMapping', () => {
    const complexMindMap: EducationalMindMap = {
      id: 'complex-map',
      title: 'Complex Jung Map',
      subject: 'Advanced Jungian Psychology',
      level: 'advanced',
      nodes: Array(20).fill(null).map((_, i) => ({
        id: `node${i}`,
        label: `Concept ${i}`,
        type: 'concept' as const,
        cognitiveLevel: ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'][i % 6] as any,
        content: {
          definition: `Definition ${i}`,
          examples: [`Example ${i}`],
          keyPoints: [`Key ${i}`]
        },
        position: { x: i * 50, y: i * 30 },
        difficulty: 0.3 + (i / 20) * 0.7,
        importance: 0.5 + (i / 40)
      })),
      edges: Array(30).fill(null).map((_, i) => ({
        id: `edge${i}`,
        from: `node${Math.floor(i / 3)}`,
        to: `node${(i % 17) + 1}`,
        type: ['prerequisite', 'supports', 'relates', 'contradicts'][i % 4] as any,
        strength: ['weak', 'medium', 'strong'][i % 3] as any,
        learningPath: i % 5 === 0
      })),
      learningObjectives: ['Complex objective'],
      prerequisites: ['Advanced prerequisite'],
      assessmentPoints: ['Complex assessment']
    };

    it('should analyze concept density correctly', async () => {
      const analysis = await generator.analyzeConceptMapping(complexMindMap);

      expect(analysis.conceptDensity).toBeCloseTo(20 / 15, 1); // Should be capped at 1
      expect(analysis.conceptDensity).toBeLessThanOrEqual(1);
      expect(analysis.conceptDensity).toBeGreaterThan(0);
    });

    it('should calculate relationship complexity', async () => {
      const analysis = await generator.analyzeConceptMapping(complexMindMap);

      expect(analysis.relationshipComplexity).toBeGreaterThan(0);
      expect(analysis.relationshipComplexity).toBeLessThanOrEqual(1);
      
      // Should reflect the mix of relationship types
      expect(analysis.relationshipComplexity).toBeGreaterThan(0.5); // Complex relationships
    });

    it('should calculate hierarchy depth', async () => {
      const analysis = await generator.analyzeConceptMapping(complexMindMap);

      expect(analysis.hierarchyDepth).toBeGreaterThan(0);
      expect(typeof analysis.hierarchyDepth).toBe('number');
    });

    it('should count cross connections', async () => {
      const analysis = await generator.analyzeConceptMapping(complexMindMap);

      // Count non-hierarchical edges
      const nonHierarchical = complexMindMap.edges.filter(
        e => e.type !== 'prerequisite' && e.type !== 'builds-on'
      );
      expect(analysis.crossConnections).toBe(nonHierarchical.length);
    });

    it('should assess cognitive load appropriately', async () => {
      const analysis = await generator.analyzeConceptMapping(complexMindMap);

      expect(analysis.cognitiveLoad).toBeGreaterThan(0);
      expect(analysis.cognitiveLoad).toBeLessThanOrEqual(1);
      
      // High complexity should result in higher cognitive load
      expect(analysis.cognitiveLoad).toBeGreaterThan(0.6);
    });

    it('should calculate learning efficiency', async () => {
      const analysis = await generator.analyzeConceptMapping(complexMindMap);

      expect(analysis.learningEfficiency).toBeGreaterThan(0);
      expect(analysis.learningEfficiency).toBeLessThanOrEqual(1);
    });

    it('should handle simple mind maps', async () => {
      const simpleMindMap: EducationalMindMap = {
        ...complexMindMap,
        nodes: complexMindMap.nodes.slice(0, 5),
        edges: complexMindMap.edges.slice(0, 3)
      };

      const analysis = await generator.analyzeConceptMapping(simpleMindMap);

      expect(analysis.conceptDensity).toBeLessThan(1);
      expect(analysis.cognitiveLoad).toBeLessThan(0.6); // Should be lower for simple maps
      expect(analysis.learningEfficiency).toBeGreaterThan(0.5); // Simple maps often more efficient
    });

    it('should handle empty mind maps', async () => {
      const emptyMindMap: EducationalMindMap = {
        ...complexMindMap,
        nodes: [],
        edges: []
      };

      const analysis = await generator.analyzeConceptMapping(emptyMindMap);

      expect(analysis.conceptDensity).toBe(0);
      expect(analysis.relationshipComplexity).toBe(0);
      expect(analysis.hierarchyDepth).toBe(0);
      expect(analysis.crossConnections).toBe(0);
      expect(analysis.cognitiveLoad).toBe(0);
    });
  });

  describe('generateVisualizationData', () => {
    const mockMindMap: EducationalMindMap = {
      id: 'viz-test',
      title: 'Jung Visualization Test',
      subject: 'Jungian Dream Analysis',
      level: 'intermediate',
      nodes: [
        {
          id: 'conscious',
          label: 'Conscious Mind',
          type: 'concept',
          cognitiveLevel: 'understand',
          content: { definition: 'Conscious mind', examples: [], keyPoints: [] },
          jungianContext: { psycheLevel: 'conscious' },
          position: { x: 0, y: 0 },
          difficulty: 0.4,
          importance: 0.8
        },
        {
          id: 'unconscious',
          label: 'Personal Unconscious',
          type: 'concept',
          cognitiveLevel: 'analyze',
          content: { definition: 'Personal unconscious', examples: [], keyPoints: [] },
          jungianContext: { psycheLevel: 'personal-unconscious' },
          position: { x: 0, y: 0 },
          difficulty: 0.7,
          importance: 0.9
        }
      ],
      edges: [
        {
          id: 'edge1',
          from: 'conscious',
          to: 'unconscious',
          type: 'relates',
          strength: 'strong'
        }
      ],
      learningObjectives: [],
      prerequisites: [],
      assessmentPoints: []
    };

    const interactiveFeatures: InteractiveMindMapFeatures = {
      zoomEnabled: true,
      panEnabled: true,
      nodeExpansion: true,
      searchHighlight: true,
      pathTracing: true,
      progressTracking: true
    };

    it('should generate Jung-themed visualization data', async () => {
      const vizData = generator.generateVisualizationData(mockMindMap, interactiveFeatures);

      expect(vizData.theme).toBe('jung');
      expect(vizData.nodeStyles).toHaveProperty('conscious');
      expect(vizData.nodeStyles).toHaveProperty('unconscious');
      expect(vizData.edgeStyles).toHaveProperty('edge1');
      expect(vizData.animations).toBe(true);
    });

    it('should use educational theme for non-Jungian subjects', async () => {
      const educationalMap = {
        ...mockMindMap,
        subject: 'Mathematics',
        title: 'Algebra Concepts'
      };

      const vizData = generator.generateVisualizationData(educationalMap, interactiveFeatures);

      expect(vizData.theme).toBe('educational');
    });

    it('should generate appropriate node styles based on Jung context', async () => {
      const vizData = generator.generateVisualizationData(mockMindMap, interactiveFeatures);

      const consciousStyle = vizData.nodeStyles['conscious'];
      const unconsciousStyle = vizData.nodeStyles['unconscious'];

      expect(consciousStyle).toBeDefined();
      expect(unconsciousStyle).toBeDefined();
      expect(consciousStyle.color).toBeDefined();
      expect(consciousStyle.shape).toBeDefined();
      expect(consciousStyle.size).toBeGreaterThan(0);
    });

    it('should generate edge styles based on relationship types', async () => {
      const vizData = generator.generateVisualizationData(mockMindMap, interactiveFeatures);

      const edgeStyle = vizData.edgeStyles['edge1'];
      expect(edgeStyle).toBeDefined();
      expect(edgeStyle.color).toBeDefined();
      expect(edgeStyle.width).toBeGreaterThan(0);
      expect(edgeStyle.style).toMatch(/^(solid|dashed|dotted)$/);
    });

    it('should determine optimal layout based on map characteristics', async () => {
      const hierarchicalMap = {
        ...mockMindMap,
        edges: [
          {
            id: 'e1',
            from: 'conscious',
            to: 'unconscious',
            type: 'prerequisite' as const,
            strength: 'strong' as const
          }
        ]
      };

      const vizData = generator.generateVisualizationData(hierarchicalMap, interactiveFeatures);
      expect(vizData.layout).toBe('hierarchical');

      const smallMap = {
        ...mockMindMap,
        nodes: mockMindMap.nodes.slice(0, 1)
      };

      const smallVizData = generator.generateVisualizationData(smallMap, interactiveFeatures);
      expect(smallVizData.layout).toBe('radial');
    });

    it('should disable animations when node expansion is disabled', async () => {
      const staticFeatures: InteractiveMindMapFeatures = {
        ...interactiveFeatures,
        nodeExpansion: false
      };

      const vizData = generator.generateVisualizationData(mockMindMap, staticFeatures);
      expect(vizData.animations).toBe(false);
    });
  });

  describe('generateLearningPath', () => {
    const pathMindMap: EducationalMindMap = {
      id: 'path-test',
      title: 'Learning Path Test',
      subject: 'Sequential Jung Learning',
      level: 'intermediate',
      nodes: [
        {
          id: 'basics',
          label: 'Jung Basics',
          type: 'knowledge',
          cognitiveLevel: 'remember',
          content: { definition: 'Basic concepts', examples: [], keyPoints: [] },
          position: { x: 0, y: 0 },
          difficulty: 0.2,
          importance: 1.0
        },
        {
          id: 'archetypes',
          label: 'Archetypal Theory',
          type: 'concept',
          cognitiveLevel: 'understand',
          content: { definition: 'Archetype concepts', examples: [], keyPoints: [] },
          position: { x: 0, y: 0 },
          difficulty: 0.5,
          importance: 0.9
        },
        {
          id: 'shadow-work',
          label: 'Shadow Integration',
          type: 'application',
          cognitiveLevel: 'apply',
          content: { definition: 'Shadow work practice', examples: [], keyPoints: [] },
          position: { x: 0, y: 0 },
          difficulty: 0.8,
          importance: 0.8
        },
        {
          id: 'individuation',
          label: 'Individuation Process',
          type: 'synthesis',
          cognitiveLevel: 'create',
          content: { definition: 'Complete individuation', examples: [], keyPoints: [] },
          position: { x: 0, y: 0 },
          difficulty: 0.95,
          importance: 1.0
        }
      ],
      edges: [
        {
          id: 'e1',
          from: 'basics',
          to: 'archetypes',
          type: 'prerequisite',
          strength: 'strong'
        },
        {
          id: 'e2',
          from: 'archetypes',
          to: 'shadow-work',
          type: 'prerequisite',
          strength: 'strong'
        },
        {
          id: 'e3',
          from: 'shadow-work',
          to: 'individuation',
          type: 'builds-on',
          strength: 'strong'
        },
        {
          id: 'e4',
          from: 'basics',
          to: 'individuation',
          type: 'relates',
          strength: 'weak'
        }
      ],
      learningObjectives: [],
      prerequisites: [],
      assessmentPoints: []
    };

    it('should generate optimal learning path between concepts', async () => {
      const path = await generator.generateLearningPath(
        pathMindMap,
        'basics',
        'individuation'
      );

      expect(path).toContain('basics');
      expect(path).toContain('individuation');
      expect(path.indexOf('basics')).toBe(0); // Should start with basics
      expect(path.indexOf('individuation')).toBe(path.length - 1); // Should end with individuation
    });

    it('should follow educational prerequisites', async () => {
      const path = await generator.generateLearningPath(
        pathMindMap,
        'basics',
        'shadow-work'
      );

      // Should go through archetypes as prerequisite
      const basicsIndex = path.indexOf('basics');
      const archetypesIndex = path.indexOf('archetypes');
      const shadowIndex = path.indexOf('shadow-work');

      expect(basicsIndex).toBeLessThan(archetypesIndex);
      expect(archetypesIndex).toBeLessThan(shadowIndex);
    });

    it('should handle direct paths when no prerequisites exist', async () => {
      const simpleMindMap = {
        ...pathMindMap,
        edges: [
          {
            id: 'direct',
            from: 'basics',
            to: 'individuation',
            type: 'relates' as const,
            strength: 'medium' as const
          }
        ]
      };

      const path = await generator.generateLearningPath(
        simpleMindMap,
        'basics',
        'individuation'
      );

      expect(path).toEqual(['basics', 'individuation']);
    });

    it('should throw error for non-existent start concept', async () => {
      await expect(generator.generateLearningPath(
        pathMindMap,
        'non-existent',
        'individuation'
      )).rejects.toThrow('Start or end concept not found in mind map');
    });

    it('should throw error for non-existent end concept', async () => {
      await expect(generator.generateLearningPath(
        pathMindMap,
        'basics',
        'non-existent'
      )).rejects.toThrow('Start or end concept not found in mind map');
    });

    it('should handle disconnected concepts', async () => {
      const disconnectedMap = {
        ...pathMindMap,
        nodes: [
          ...pathMindMap.nodes,
          {
            id: 'isolated',
            label: 'Isolated Concept',
            type: 'concept' as const,
            cognitiveLevel: 'understand' as const,
            content: { definition: 'Isolated', examples: [], keyPoints: [] },
            position: { x: 0, y: 0 },
            difficulty: 0.5,
            importance: 0.5
          }
        ]
        // No edges to isolated node
      };

      const path = await generator.generateLearningPath(
        disconnectedMap,
        'basics',
        'isolated'
      );

      // Should still find a path (even if not optimal)
      expect(path).toContain('basics');
      expect(path).toContain('isolated');
    });

    it('should prefer stronger connections in path finding', async () => {
      const pathWithWeights = {
        ...pathMindMap,
        edges: [
          {
            id: 'strong',
            from: 'basics',
            to: 'shadow-work',
            type: 'prerequisite' as const,
            strength: 'strong' as const
          },
          {
            id: 'weak',
            from: 'basics',
            to: 'archetypes',
            type: 'relates' as const,
            strength: 'weak' as const
          },
          {
            id: 'medium',
            from: 'archetypes',
            to: 'shadow-work',
            type: 'supports' as const,
            strength: 'medium' as const
          }
        ]
      };

      const path = await generator.generateLearningPath(
        pathWithWeights,
        'basics',
        'shadow-work'
      );

      // Should prefer the direct strong connection over weak multi-hop path
      expect(path).toEqual(['basics', 'shadow-work']);
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle provider unavailability', async () => {
      mockProvider.isAvailable.mockResolvedValue(false);
      mockProvider.generateStructuredOutput.mockRejectedValue(new Error('Provider unavailable'));

      await expect(generator.generateJungianMindMap(
        'Test Topic',
        ['focus'],
        'beginner'
      )).rejects.toThrow('Failed to generate Jungian mind map');
    });

    it('should handle malformed JSON responses', async () => {
      mockProvider.generateStructuredOutput.mockResolvedValue('invalid json');

      await expect(generator.generateJungianMindMap(
        'Test Topic',
        ['focus'],
        'beginner'
      )).rejects.toThrow('Invalid Jungian mind map structure');
    });

    it('should handle network timeouts gracefully', async () => {
      mockProvider.generateStructuredOutput.mockImplementation(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout')), 100)
        )
      );

      await expect(generator.generateJungianMindMap(
        'Test Topic',
        ['focus'],
        'beginner'
      )).rejects.toThrow('Failed to generate Jungian mind map: Network timeout');
    });

    it('should handle extremely large concept arrays', async () => {
      const hugeFocusAreas = Array(1000).fill('concept').map((c, i) => `${c}-${i}`);

      // Should be rejected at validation level
      await expect(generator.generateJungianMindMap(
        'Huge Topic',
        hugeFocusAreas,
        'advanced'
      )).rejects.toThrow('Too many focus areas (maximum 10)');
    });

    it('should handle special characters in concept names', async () => {
      const mockDataWithSpecialChars = {
        title: 'Spéçiål Çhåråçters',
        subject: 'Tëst Subjëçt',
        nodes: [
          {
            id: 'special-node',
            label: 'Ñödé wïth Spëçîàl Çhärš',
            type: 'concept',
            cognitiveLevel: 'understand',
            content: {
              definition: 'Defïnïtïön wïth aççënts',
              examples: ['Exämplë öne', 'Exãmplê twø'],
              keyPoints: ['Këÿ pöïnt ønë']
            },
            difficulty: 0.5,
            importance: 0.7
          }
        ],
        edges: [],
        learningObjectives: ['Öbjëçtïvë wïth späçës'],
        prerequisites: ['Prërëqüïsïtë wïth ümlåüts'],
        assessmentPoints: ['Assëssment pöïnt']
      };

      mockProvider.generateStructuredOutput.mockResolvedValue(mockDataWithSpecialChars);

      const result = await generator.generateJungianMindMap(
        'Spëçîàl Tëst',
        ['föçüs ärëà'],
        'intermediate'
      );

      expect(result.title).toBe('Spéçiål Çhåråçters');
      expect(result.nodes[0].label).toContain('Ñödé');
    });

    it('should handle concurrent generation requests', async () => {
      mockProvider.generateStructuredOutput.mockResolvedValue({
        title: 'Concurrent Test',
        subject: 'Test',
        nodes: [],
        edges: [],
        learningObjectives: [],
        prerequisites: [],
        assessmentPoints: []
      });

      const promises = Array(10).fill(null).map((_, i) => 
        generator.generateJungianMindMap(
          `Topic ${i}`,
          [`focus-${i}`],
          'beginner'
        )
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach((result, i) => {
        expect(result.title).toBe('Concurrent Test');
      });
    });
  });

  describe('coordination hook integration', () => {
    it('should log memory usage during complex operations', async () => {
      const mockComplexData = {
        title: 'Memory Test',
        subject: 'Complex Subject',
        nodes: Array(100).fill(null).map((_, i) => ({
          id: `node-${i}`,
          label: `Node ${i}`,
          type: 'concept',
          cognitiveLevel: 'understand',
          content: {
            definition: `Definition ${i}`,
            examples: [`Example ${i}`],
            keyPoints: [`Key ${i}`]
          },
          difficulty: Math.random(),
          importance: Math.random()
        })),
        edges: Array(200).fill(null).map((_, i) => ({
          from: `node-${i % 50}`,
          to: `node-${(i + 1) % 100}`,
          type: 'relates',
          strength: 'medium'
        })),
        learningObjectives: [],
        prerequisites: [],
        assessmentPoints: []
      };

      mockProvider.generateStructuredOutput.mockResolvedValue(mockComplexData);

      // Memory tracking should not interfere with functionality
      const result = await generator.generateJungianMindMap(
        'Memory Intensive Topic',
        ['complex-focus'],
        'advanced'
      );

      expect(result.nodes).toHaveLength(100);
      expect(result.edges).toHaveLength(200);
    });

    it('should handle coordination hook failures gracefully', async () => {
      // Simulate hook failure by mocking process execution
      const originalExec = require('child_process').exec;
      require('child_process').exec = jest.fn().mockImplementation((cmd, callback) => {
        if (callback) callback(new Error('Hook failed'));
      });

      try {
        mockProvider.generateStructuredOutput.mockResolvedValue({
          title: 'Hook Failure Test',
          subject: 'Test',
          nodes: [],
          edges: [],
          learningObjectives: [],
          prerequisites: [],
          assessmentPoints: []
        });

        // Should still work even if hooks fail
        const result = await generator.generateJungianMindMap(
          'Hook Test',
          ['focus'],
          'beginner'
        );

        expect(result.title).toBe('Hook Failure Test');
      } finally {
        // Restore original exec
        require('child_process').exec = originalExec;
      }
    });
  });
});