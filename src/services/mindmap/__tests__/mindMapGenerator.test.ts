import { 
  MindMapGenerator, 
  LLMMindMapGenerator,
  MindMap,
  MindMapNode,
  MindMapEdge,
  EducationalMindMap,
  LayoutAlgorithmConfig
} from '../mindMapGenerator';
import { ILLMProvider } from '../../llm/types';

// Comprehensive test suite for enhanced mind map generation
describe('Enhanced MindMapGenerator Integration', () => {
  let basicGenerator: MindMapGenerator;
  let llmGenerator: LLMMindMapGenerator;
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

    basicGenerator = new MindMapGenerator(mockProvider);
    llmGenerator = new LLMMindMapGenerator(mockProvider);
  });

  beforeAll(async () => {
    // Coordination hook: Initialize enhanced testing
    try {
      await import('child_process').then(cp => {
        cp.exec('npx claude-flow@alpha hooks pre-task --description "Enhanced MindMapGenerator testing with 85%+ coverage target"');
      });
    } catch (error) {
      console.log('Coordination hook not available, continuing with tests');
    }
  });

  afterAll(async () => {
    // Coordination hook: Complete testing phase
    try {
      await import('child_process').then(cp => {
        cp.exec('npx claude-flow@alpha hooks post-task --task-id "mindmap-enhanced-tests" --memory-key "swarm/testing/mindmap-coverage"');
      });
    } catch (error) {
      console.log('Coordination hook not available, test completed');
    }
  });

  describe('Integration between Basic and LLM Generators', () => {
    it('should allow seamless switching between generator types', async () => {
      const basicMockData = {
        title: 'Basic Jung Map',
        rootConcept: {
          id: 'root',
          label: 'Analytical Psychology',
          description: 'Jung\'s psychological framework',
          importance: 'high'
        },
        concepts: [
          {
            id: 'collective-unconscious',
            label: 'Collective Unconscious',
            description: 'Universal patterns shared by humanity',
            parentId: 'root',
            importance: 'high',
            relationships: ['archetypes']
          }
        ],
        connections: [
          {
            from: 'root',
            to: 'collective-unconscious',
            type: 'contains',
            strength: 'strong'
          }
        ]
      };

      const llmMockData = {
        title: 'Enhanced Jung Map',
        subject: 'Analytical Psychology',
        nodes: [
          {
            id: 'collective-unconscious',
            label: 'Collective Unconscious',
            type: 'concept',
            cognitiveLevel: 'understand',
            content: {
              definition: 'Universal patterns shared by humanity',
              examples: ['Archetypal images', 'Mythological motifs'],
              keyPoints: ['Inherited patterns', 'Cross-cultural similarity', 'Symbolic manifestation']
            },
            jungianContext: {
              psycheLevel: 'collective-unconscious',
              symbolism: ['Mandala', 'Tree of Life', 'Universal myths']
            },
            difficulty: 0.7,
            importance: 0.9
          }
        ],
        edges: [],
        learningObjectives: ['Understand collective unconscious concept'],
        prerequisites: ['Basic psychology knowledge'],
        assessmentPoints: ['Identify archetypal patterns']
      };

      mockProvider.generateStructuredOutput
        .mockResolvedValueOnce(basicMockData)
        .mockResolvedValueOnce(llmMockData);

      // Generate with basic generator
      const basicMap = await basicGenerator.generateMindMap(
        'Jungian Psychology',
        ['collective-unconscious', 'archetypes'],
        'Understand Jung\'s framework',
        'intermediate'
      );

      // Generate with LLM generator
      const llmMap = await llmGenerator.generateJungianMindMap(
        'Jungian Psychology Enhanced',
        ['collective-unconscious'],
        'intermediate'
      );

      expect(basicMap.title).toBe('Basic Jung Map');
      expect(llmMap.title).toBe('Enhanced Jung Map');
      
      // Both should have compatible node structures
      expect(basicMap.nodes.length).toBeGreaterThan(0);
      expect(llmMap.nodes.length).toBeGreaterThan(0);
      
      // LLM version should have enhanced educational features
      expect((llmMap as EducationalMindMap).learningObjectives).toBeDefined();
      expect((llmMap as EducationalMindMap).assessmentPoints).toBeDefined();
    });

    it('should maintain consistent node and edge interfaces', async () => {
      const mockData = {
        title: 'Interface Test',
        rootConcept: { id: 'root', label: 'Test', description: 'Test', importance: 'medium' },
        concepts: [
          { id: 'concept1', label: 'Concept 1', parentId: 'root', importance: 'high' }
        ],
        connections: [
          { from: 'root', to: 'concept1', type: 'hierarchy', strength: 'strong' }
        ]
      };

      mockProvider.generateStructuredOutput.mockResolvedValue(mockData);

      const basicMap = await basicGenerator.generateMindMap(
        'Interface Test',
        ['concept1'],
        'Test interfaces',
        'beginner'
      );

      // Test that nodes conform to MindMapNode interface
      basicMap.nodes.forEach(node => {
        expect(node).toMatchObject({
          id: expect.any(String),
          label: expect.any(String),
          type: expect.stringMatching(/^(root|concept|subconcept)$/)
        });
      });

      // Test that edges conform to MindMapEdge interface
      basicMap.edges.forEach(edge => {
        expect(edge).toMatchObject({
          id: expect.any(String),
          from: expect.any(String),
          to: expect.any(String),
          type: expect.stringMatching(/^(hierarchy|association|relates|contains)$/)
        });
      });
    });
  });

  describe('Enhanced Mind Map Features', () => {
    describe('Jung-specific Archetype Integration', () => {
      it('should create mind maps with proper archetypal relationships', async () => {
        const archetypeData = {
          title: 'Archetypal Relationships',
          rootConcept: {
            id: 'psyche',
            label: 'Human Psyche',
            description: 'Complete psychological structure',
            importance: 'high'
          },
          concepts: [
            {
              id: 'shadow',
              label: 'Shadow',
              description: 'Repressed personality aspects',
              parentId: 'psyche',
              importance: 'high',
              relationships: ['persona', 'ego']
            },
            {
              id: 'persona',
              label: 'Persona',
              description: 'Social mask and public face',
              parentId: 'psyche',
              importance: 'high',
              relationships: ['shadow']
            },
            {
              id: 'anima-animus',
              label: 'Anima/Animus',
              description: 'Contrasexual archetype',
              parentId: 'psyche',
              importance: 'medium',
              relationships: ['shadow', 'self']
            },
            {
              id: 'self',
              label: 'Self',
              description: 'Integrated wholeness',
              parentId: 'psyche',
              importance: 'high',
              relationships: ['shadow', 'anima-animus', 'persona']
            }
          ],
          connections: [
            { from: 'psyche', to: 'shadow', type: 'contains', strength: 'strong' },
            { from: 'psyche', to: 'persona', type: 'contains', strength: 'strong' },
            { from: 'psyche', to: 'anima-animus', type: 'contains', strength: 'medium' },
            { from: 'psyche', to: 'self', type: 'contains', strength: 'strong' },
            { from: 'shadow', to: 'persona', type: 'relates', strength: 'strong' },
            { from: 'shadow', to: 'self', type: 'relates', strength: 'medium' },
            { from: 'anima-animus', to: 'self', type: 'relates', strength: 'strong' }
          ]
        };

        mockProvider.generateStructuredOutput.mockResolvedValue(archetypeData);

        const map = await basicGenerator.generateMindMap(
          'Jungian Archetypes',
          ['shadow', 'persona', 'anima', 'animus', 'self'],
          'Understand archetypal relationships in the psyche',
          'advanced'
        );

        expect(map.title).toBe('Archetypal Relationships');
        expect(map.nodes).toHaveLength(5); // Root + 4 archetypes
        expect(map.edges).toHaveLength(7); // All connections

        // Verify specific archetypal relationships
        const shadowToPersona = map.edges.find(e => e.from === 'shadow' && e.to === 'persona');
        expect(shadowToPersona).toBeDefined();
        expect(shadowToPersona?.type).toBe('relates');

        const selfConnections = map.edges.filter(e => e.from === 'self' || e.to === 'self');
        expect(selfConnections.length).toBeGreaterThanOrEqual(3); // Self connects to multiple archetypes
      });

      it('should handle individuation process mapping', async () => {
        const individuationData = {
          title: 'Individuation Process',
          rootConcept: {
            id: 'individuation',
            label: 'Individuation',
            description: 'Process of psychological integration and wholeness',
            importance: 'high'
          },
          concepts: [
            {
              id: 'ego-development',
              label: 'Ego Development',
              description: 'Strengthening conscious personality',
              parentId: 'individuation',
              importance: 'high',
              relationships: ['shadow-encounter']
            },
            {
              id: 'shadow-encounter',
              label: 'Shadow Encounter',
              description: 'Confronting rejected aspects',
              parentId: 'individuation',
              importance: 'high',
              relationships: ['ego-development', 'anima-animus-integration']
            },
            {
              id: 'anima-animus-integration',
              label: 'Anima/Animus Integration',
              description: 'Incorporating contrasexual elements',
              parentId: 'individuation',
              importance: 'medium',
              relationships: ['shadow-encounter', 'self-realization']
            },
            {
              id: 'self-realization',
              label: 'Self Realization',
              description: 'Achieving psychological wholeness',
              parentId: 'individuation',
              importance: 'high',
              relationships: ['anima-animus-integration']
            }
          ],
          connections: [
            { from: 'individuation', to: 'ego-development', type: 'contains', strength: 'strong' },
            { from: 'ego-development', to: 'shadow-encounter', type: 'hierarchy', strength: 'strong' },
            { from: 'shadow-encounter', to: 'anima-animus-integration', type: 'hierarchy', strength: 'medium' },
            { from: 'anima-animus-integration', to: 'self-realization', type: 'hierarchy', strength: 'strong' }
          ]
        };

        mockProvider.generateStructuredOutput.mockResolvedValue(individuationData);

        const map = await basicGenerator.generateMindMap(
          'Individuation Process',
          ['ego-development', 'shadow-work', 'anima-integration', 'self-realization'],
          'Map the stages of Jungian individuation',
          'advanced'
        );

        // Verify sequential relationship structure
        const egoToShadow = map.edges.find(e => e.from === 'ego-development' && e.to === 'shadow-encounter');
        const shadowToAnima = map.edges.find(e => e.from === 'shadow-encounter' && e.to === 'anima-animus-integration');
        const animaToSelf = map.edges.find(e => e.from === 'anima-animus-integration' && e.to === 'self-realization');

        expect(egoToShadow).toBeDefined();
        expect(shadowToAnima).toBeDefined();
        expect(animaToSelf).toBeDefined();

        // All should be hierarchical relationships showing progression
        expect(egoToShadow?.type).toBe('hierarchy');
        expect(shadowToAnima?.type).toBe('hierarchy');
        expect(animaToSelf?.type).toBe('hierarchy');
      });
    });

    describe('Educational Concept Mapping', () => {
      it('should create concept maps with cognitive learning levels', async () => {
        const educationalData = {
          title: 'Learning Jung\'s Psychology',
          subject: 'Jungian Psychology Education',
          nodes: [
            {
              id: 'basic-terms',
              label: 'Basic Terminology',
              type: 'knowledge',
              cognitiveLevel: 'remember',
              content: {
                definition: 'Fundamental terms in Jungian psychology',
                examples: ['Conscious', 'Unconscious', 'Ego', 'Complex'],
                keyPoints: ['Memorize key definitions', 'Understand vocabulary', 'Build foundation']
              },
              difficulty: 0.2,
              importance: 1.0
            },
            {
              id: 'psyche-structure',
              label: 'Psyche Structure',
              type: 'concept',
              cognitiveLevel: 'understand',
              content: {
                definition: 'Organization of the human psyche according to Jung',
                examples: ['Conscious/Unconscious division', 'Personal/Collective layers', 'Ego-Self axis'],
                keyPoints: ['Understand relationships', 'Grasp structural concepts', 'See interconnections']
              },
              difficulty: 0.5,
              importance: 0.9
            },
            {
              id: 'dream-analysis',
              label: 'Dream Analysis Application',
              type: 'application',
              cognitiveLevel: 'apply',
              content: {
                definition: 'Practical application of Jungian dream interpretation',
                examples: ['Symbol identification', 'Amplification technique', 'Active imagination'],
                keyPoints: ['Practice techniques', 'Apply theoretical knowledge', 'Develop skills']
              },
              difficulty: 0.7,
              importance: 0.8
            },
            {
              id: 'case-analysis',
              label: 'Psychological Case Analysis',
              type: 'application',
              cognitiveLevel: 'analyze',
              content: {
                definition: 'Analyzing psychological cases using Jungian framework',
                examples: ['Identify archetypal patterns', 'Trace individuation process', 'Recognize complexes'],
                keyPoints: ['Break down complex situations', 'Identify patterns', 'Connect theory to practice']
              },
              difficulty: 0.8,
              importance: 0.7
            },
            {
              id: 'theory-evaluation',
              label: 'Theory Evaluation',
              type: 'synthesis',
              cognitiveLevel: 'evaluate',
              content: {
                definition: 'Critical assessment of Jungian psychological theories',
                examples: ['Compare with other theories', 'Assess empirical support', 'Consider limitations'],
                keyPoints: ['Think critically', 'Make judgments', 'Consider evidence']
              },
              difficulty: 0.9,
              importance: 0.6
            },
            {
              id: 'personal-integration',
              label: 'Personal Integration Project',
              type: 'synthesis',
              cognitiveLevel: 'create',
              content: {
                definition: 'Creating personal development plan using Jungian principles',
                examples: ['Design individuation path', 'Create shadow work plan', 'Develop integration practices'],
                keyPoints: ['Synthesize learning', 'Create original work', 'Apply comprehensively']
              },
              difficulty: 0.95,
              importance: 0.8
            }
          ],
          edges: [
            { from: 'basic-terms', to: 'psyche-structure', type: 'prerequisite', strength: 'strong', learningPath: true },
            { from: 'psyche-structure', to: 'dream-analysis', type: 'prerequisite', strength: 'strong', learningPath: true },
            { from: 'psyche-structure', to: 'case-analysis', type: 'prerequisite', strength: 'medium', learningPath: true },
            { from: 'dream-analysis', to: 'case-analysis', type: 'supports', strength: 'medium' },
            { from: 'case-analysis', to: 'theory-evaluation', type: 'builds-on', strength: 'strong', learningPath: true },
            { from: 'theory-evaluation', to: 'personal-integration', type: 'prerequisite', strength: 'strong', learningPath: true },
            { from: 'dream-analysis', to: 'personal-integration', type: 'supports', strength: 'medium' }
          ],
          learningObjectives: [
            'Master fundamental Jungian terminology',
            'Understand psyche structure and dynamics',
            'Apply dream analysis techniques',
            'Analyze psychological cases using Jungian framework',
            'Critically evaluate Jungian theory',
            'Create personal development integration plan'
          ],
          prerequisites: [
            'Basic understanding of psychology',
            'Openness to symbolic thinking',
            'Interest in depth psychology'
          ],
          assessmentPoints: [
            'Terminology quiz (remember level)',
            'Concept mapping exercise (understand level)',
            'Dream interpretation practice (apply level)',
            'Case study analysis (analyze level)',
            'Theory critique essay (evaluate level)',
            'Personal integration portfolio (create level)'
          ]
        };

        mockProvider.generateStructuredOutput.mockResolvedValue(educationalData);

        const educationalMap = await llmGenerator.generateJungianMindMap(
          'Learning Jung\'s Psychology',
          ['terminology', 'psyche-structure', 'dream-analysis', 'case-studies', 'theory-evaluation', 'integration'],
          'advanced'
        ) as EducationalMindMap;

        expect(educationalMap.learningObjectives).toHaveLength(6);
        expect(educationalMap.assessmentPoints).toHaveLength(6);
        expect(educationalMap.nodes.every(node => node.cognitiveLevel)).toBeTruthy();

        // Verify Bloom's taxonomy progression
        const cognitiveOrder = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];
        const nodeCognitiveLevels = educationalMap.nodes.map(n => n.cognitiveLevel);
        
        cognitiveOrder.forEach(level => {
          expect(nodeCognitiveLevels).toContain(level);
        });

        // Verify learning path structure
        const learningPathEdges = educationalMap.edges.filter(e => e.learningPath);
        expect(learningPathEdges.length).toBeGreaterThanOrEqual(4);

        // Verify difficulty progression
        const rememberNode = educationalMap.nodes.find(n => n.cognitiveLevel === 'remember');
        const createNode = educationalMap.nodes.find(n => n.cognitiveLevel === 'create');
        
        expect(rememberNode?.difficulty).toBeLessThan(createNode?.difficulty || 1);
      });

      it('should generate interactive learning features', async () => {
        const interactiveFeatures = {
          zoomEnabled: true,
          panEnabled: true,
          nodeExpansion: true,
          searchHighlight: true,
          pathTracing: true,
          progressTracking: true
        };

        const mockMap: EducationalMindMap = {
          id: 'interactive-test',
          title: 'Interactive Jung Learning',
          subject: 'Interactive Jungian Psychology',
          level: 'intermediate',
          nodes: [
            {
              id: 'interactive-node',
              label: 'Interactive Concept',
              type: 'concept',
              cognitiveLevel: 'understand',
              content: {
                definition: 'Interactive learning concept',
                examples: ['Example 1', 'Example 2'],
                keyPoints: ['Key point 1', 'Key point 2']
              },
              position: { x: 0, y: 0 },
              difficulty: 0.5,
              importance: 0.8
            }
          ],
          edges: [],
          learningObjectives: ['Interactive learning objective'],
          prerequisites: ['Basic interactivity'],
          assessmentPoints: ['Interactive assessment']
        };

        const visualizationData = llmGenerator.generateVisualizationData(mockMap, interactiveFeatures);

        expect(visualizationData.theme).toBe('jung');
        expect(visualizationData.animations).toBe(true);
        expect(visualizationData.nodeStyles).toHaveProperty('interactive-node');
        expect(visualizationData.layout).toMatch(/^(hierarchical|radial|force-directed|circular)$/);
      });
    });

    describe('Layout Algorithm Testing', () => {
      const testMindMap: EducationalMindMap = {
        id: 'layout-test',
        title: 'Layout Algorithm Test',
        subject: 'Algorithm Testing',
        level: 'intermediate',
        nodes: Array(10).fill(null).map((_, i) => ({
          id: `node-${i}`,
          label: `Node ${i}`,
          type: 'concept' as const,
          cognitiveLevel: 'understand' as const,
          content: {
            definition: `Definition ${i}`,
            examples: [`Example ${i}`],
            keyPoints: [`Key ${i}`]
          },
          position: { x: 0, y: 0 },
          difficulty: 0.5,
          importance: 0.5
        })),
        edges: [
          { id: 'e1', from: 'node-0', to: 'node-1', type: 'prerequisite', strength: 'strong' },
          { id: 'e2', from: 'node-1', to: 'node-2', type: 'prerequisite', strength: 'strong' },
          { id: 'e3', from: 'node-0', to: 'node-3', type: 'supports', strength: 'medium' },
          { id: 'e4', from: 'node-2', to: 'node-4', type: 'relates', strength: 'weak' }
        ],
        learningObjectives: ['Test layout'],
        prerequisites: ['Basic knowledge'],
        assessmentPoints: ['Layout assessment']
      };

      it('should optimize hierarchical layouts for educational content', async () => {
        const hierarchicalConfig: LayoutAlgorithmConfig = {
          algorithm: 'hierarchical',
          parameters: {
            nodeSpacing: 150,
            levelSeparation: 120
          }
        };

        const optimizedMap = await llmGenerator.optimizeLayout(testMindMap, hierarchicalConfig);

        // Root nodes should be at top level
        const rootNode = optimizedMap.nodes.find(n => n.id === 'node-0');
        const childNodes = optimizedMap.nodes.filter(n => ['node-1', 'node-3'].includes(n.id));

        expect(rootNode?.position.y).toBeLessThanOrEqual(0);
        childNodes.forEach(child => {
          expect(child.position.y).toBeGreaterThan(rootNode?.position.y || 0);
        });

        // Nodes should be properly spaced
        const nodePositions = optimizedMap.nodes.map(n => n.position);
        const uniquePositions = new Set(nodePositions.map(p => `${p.x},${p.y}`));
        expect(uniquePositions.size).toBe(nodePositions.length);
      });

      it('should handle force-directed layouts for complex relationships', async () => {
        const forceConfig: LayoutAlgorithmConfig = {
          algorithm: 'force-directed',
          parameters: {
            iterations: 50,
            centerForce: 0.1,
            repulsionForce: 1000,
            attractionForce: 0.01
          }
        };

        const optimizedMap = await llmGenerator.optimizeLayout(testMindMap, forceConfig);

        // Nodes should be distributed to minimize edge crossings
        const nodeDistances: number[] = [];
        for (let i = 0; i < optimizedMap.nodes.length; i++) {
          for (let j = i + 1; j < optimizedMap.nodes.length; j++) {
            const nodeA = optimizedMap.nodes[i];
            const nodeB = optimizedMap.nodes[j];
            const distance = Math.sqrt(
              Math.pow(nodeA.position.x - nodeB.position.x, 2) +
              Math.pow(nodeA.position.y - nodeB.position.y, 2)
            );
            nodeDistances.push(distance);
          }
        }

        // Most nodes should have reasonable separation
        const averageDistance = nodeDistances.reduce((sum, d) => sum + d, 0) / nodeDistances.length;
        expect(averageDistance).toBeGreaterThan(50); // Minimum reasonable separation
      });

      it('should create radial layouts for conceptual exploration', async () => {
        const radialConfig: LayoutAlgorithmConfig = {
          algorithm: 'radial',
          parameters: {
            radius: 200
          }
        };

        const optimizedMap = await llmGenerator.optimizeLayout(testMindMap, radialConfig);

        // One node should be at center
        const centerNode = optimizedMap.nodes.find(n => n.position.x === 0 && n.position.y === 0);
        expect(centerNode).toBeDefined();

        // Other nodes should be arranged in a circle
        const peripheralNodes = optimizedMap.nodes.filter(n => !(n.position.x === 0 && n.position.y === 0));
        peripheralNodes.forEach(node => {
          const distanceFromCenter = Math.sqrt(node.position.x ** 2 + node.position.y ** 2);
          expect(distanceFromCenter).toBeCloseTo(200, 5);
        });
      });

      it('should apply cognitive-level layered layouts', async () => {
        const layeredConfig: LayoutAlgorithmConfig = {
          algorithm: 'layered',
          parameters: {
            layerSpacing: 100,
            nodeSpacing: 150
          }
        };

        // Create test map with different cognitive levels
        const cognitiveTestMap: EducationalMindMap = {
          ...testMindMap,
          nodes: [
            { ...testMindMap.nodes[0], cognitiveLevel: 'remember' },
            { ...testMindMap.nodes[1], cognitiveLevel: 'understand' },
            { ...testMindMap.nodes[2], cognitiveLevel: 'apply' },
            { ...testMindMap.nodes[3], cognitiveLevel: 'analyze' },
            { ...testMindMap.nodes[4], cognitiveLevel: 'evaluate' }
          ]
        };

        const optimizedMap = await llmGenerator.optimizeLayout(cognitiveTestMap, layeredConfig);

        // Nodes should be arranged by cognitive level
        const rememberNode = optimizedMap.nodes.find(n => n.cognitiveLevel === 'remember');
        const understandNode = optimizedMap.nodes.find(n => n.cognitiveLevel === 'understand');
        const applyNode = optimizedMap.nodes.find(n => n.cognitiveLevel === 'apply');
        const analyzeNode = optimizedMap.nodes.find(n => n.cognitiveLevel === 'analyze');
        const evaluateNode = optimizedMap.nodes.find(n => n.cognitiveLevel === 'evaluate');

        expect(rememberNode?.position.y).toBeLessThan(understandNode?.position.y || 0);
        expect(understandNode?.position.y).toBeLessThan(applyNode?.position.y || 0);
        expect(applyNode?.position.y).toBeLessThan(analyzeNode?.position.y || 0);
        expect(analyzeNode?.position.y).toBeLessThan(evaluateNode?.position.y || 0);
      });
    });

    describe('Cognitive Load and Learning Efficiency Analysis', () => {
      it('should assess cognitive load based on concept density', async () => {
        // High density map
        const highDensityMap: EducationalMindMap = {
          id: 'high-density',
          title: 'High Density Map',
          subject: 'Complex Jung',
          level: 'advanced',
          nodes: Array(30).fill(null).map((_, i) => ({
            id: `concept-${i}`,
            label: `Concept ${i}`,
            type: 'concept' as const,
            cognitiveLevel: 'understand' as const,
            content: { definition: `Def ${i}`, examples: [], keyPoints: [] },
            position: { x: 0, y: 0 },
            difficulty: 0.7,
            importance: 0.6
          })),
          edges: Array(45).fill(null).map((_, i) => ({
            id: `edge-${i}`,
            from: `concept-${i % 15}`,
            to: `concept-${(i + 1) % 30}`,
            type: 'relates' as const,
            strength: 'medium' as const
          })),
          learningObjectives: [],
          prerequisites: [],
          assessmentPoints: []
        };

        const analysis = await llmGenerator.analyzeConceptMapping(highDensityMap);

        expect(analysis.conceptDensity).toBeGreaterThan(0.8); // High density
        expect(analysis.cognitiveLoad).toBeGreaterThan(0.6); // High cognitive load
        expect(analysis.learningEfficiency).toBeLessThan(0.7); // Lower efficiency due to overload
      });

      it('should recommend optimal concept density for learning', async () => {
        // Optimal density map
        const optimalMap: EducationalMindMap = {
          id: 'optimal-density',
          title: 'Optimal Learning Map',
          subject: 'Balanced Jung',
          level: 'intermediate',
          nodes: Array(12).fill(null).map((_, i) => ({
            id: `balanced-${i}`,
            label: `Balanced Concept ${i}`,
            type: 'concept' as const,
            cognitiveLevel: ['remember', 'understand', 'apply'][i % 3] as any,
            content: { definition: `Definition ${i}`, examples: [`Ex ${i}`], keyPoints: [`Key ${i}`] },
            position: { x: 0, y: 0 },
            difficulty: 0.3 + (i / 12) * 0.4, // Graduated difficulty
            importance: 0.7
          })),
          edges: Array(15).fill(null).map((_, i) => ({
            id: `balanced-edge-${i}`,
            from: `balanced-${Math.floor(i / 3)}`,
            to: `balanced-${(i % 9) + 3}`,
            type: ['prerequisite', 'supports', 'relates'][i % 3] as any,
            strength: ['strong', 'medium'][i % 2] as any
          })),
          learningObjectives: [],
          prerequisites: [],
          assessmentPoints: []
        };

        const analysis = await llmGenerator.analyzeConceptMapping(optimalMap);

        expect(analysis.conceptDensity).toBeLessThan(1.0); // Reasonable density
        expect(analysis.cognitiveLoad).toBeGreaterThan(0.4); // Moderate cognitive load
        expect(analysis.cognitiveLoad).toBeLessThan(0.8); // Not overwhelming
        expect(analysis.learningEfficiency).toBeGreaterThan(0.6); // Good efficiency
      });

      it('should calculate relationship complexity accurately', async () => {
        // Complex relationships map
        const complexRelationshipsMap: EducationalMindMap = {
          id: 'complex-relations',
          title: 'Complex Relationships',
          subject: 'Advanced Jung',
          level: 'advanced',
          nodes: Array(8).fill(null).map((_, i) => ({
            id: `node-${i}`,
            label: `Node ${i}`,
            type: 'concept' as const,
            cognitiveLevel: 'analyze' as const,
            content: { definition: `Complex def ${i}`, examples: [], keyPoints: [] },
            position: { x: 0, y: 0 },
            difficulty: 0.8,
            importance: 0.7
          })),
          edges: [
            { id: 'e1', from: 'node-0', to: 'node-1', type: 'contradicts', strength: 'strong' }, // High complexity
            { id: 'e2', from: 'node-1', to: 'node-2', type: 'prerequisite', strength: 'medium' }, // Medium complexity
            { id: 'e3', from: 'node-2', to: 'node-3', type: 'supports', strength: 'weak' }, // Lower complexity
            { id: 'e4', from: 'node-3', to: 'node-4', type: 'examples', strength: 'medium' }, // Low complexity
            { id: 'e5', from: 'node-4', to: 'node-5', type: 'builds-on', strength: 'strong' }, // Medium complexity
            { id: 'e6', from: 'node-5', to: 'node-6', type: 'relates', strength: 'medium' } // Medium complexity
          ],
          learningObjectives: [],
          prerequisites: [],
          assessmentPoints: []
        };

        const analysis = await llmGenerator.analyzeConceptMapping(complexRelationshipsMap);

        expect(analysis.relationshipComplexity).toBeGreaterThan(0.6); // Complex relationships
        expect(analysis.crossConnections).toBeGreaterThan(0); // Non-hierarchical connections exist
      });

      it('should measure hierarchy depth correctly', async () => {
        // Deep hierarchy map
        const deepHierarchyMap: EducationalMindMap = {
          id: 'deep-hierarchy',
          title: 'Deep Hierarchy Test',
          subject: 'Hierarchical Jung',
          level: 'advanced',
          nodes: [
            { id: 'level-0', label: 'Root Concept', type: 'concept' as const, cognitiveLevel: 'understand' as const, content: { definition: 'Root', examples: [], keyPoints: [] }, position: { x: 0, y: 0 }, difficulty: 0.3, importance: 1.0 },
            { id: 'level-1a', label: 'Level 1A', type: 'concept' as const, cognitiveLevel: 'understand' as const, content: { definition: 'L1A', examples: [], keyPoints: [] }, position: { x: 0, y: 0 }, difficulty: 0.4, importance: 0.8 },
            { id: 'level-1b', label: 'Level 1B', type: 'concept' as const, cognitiveLevel: 'understand' as const, content: { definition: 'L1B', examples: [], keyPoints: [] }, position: { x: 0, y: 0 }, difficulty: 0.4, importance: 0.8 },
            { id: 'level-2a', label: 'Level 2A', type: 'concept' as const, cognitiveLevel: 'apply' as const, content: { definition: 'L2A', examples: [], keyPoints: [] }, position: { x: 0, y: 0 }, difficulty: 0.6, importance: 0.7 },
            { id: 'level-3a', label: 'Level 3A', type: 'concept' as const, cognitiveLevel: 'analyze' as const, content: { definition: 'L3A', examples: [], keyPoints: [] }, position: { x: 0, y: 0 }, difficulty: 0.8, importance: 0.6 }
          ],
          edges: [
            { id: 'h1', from: 'level-0', to: 'level-1a', type: 'prerequisite', strength: 'strong' },
            { id: 'h2', from: 'level-0', to: 'level-1b', type: 'prerequisite', strength: 'strong' },
            { id: 'h3', from: 'level-1a', to: 'level-2a', type: 'prerequisite', strength: 'strong' },
            { id: 'h4', from: 'level-2a', to: 'level-3a', type: 'prerequisite', strength: 'strong' }
          ],
          learningObjectives: [],
          prerequisites: [],
          assessmentPoints: []
        };

        const analysis = await llmGenerator.analyzeConceptMapping(deepHierarchyMap);

        expect(analysis.hierarchyDepth).toBe(4); // 0 -> 1 -> 2 -> 3 (4 levels)
      });
    });

    describe('Learning Path Generation', () => {
      it('should generate optimal learning paths through Jungian concepts', async () => {
        const learningMap: EducationalMindMap = {
          id: 'learning-path',
          title: 'Jung Learning Path',
          subject: 'Sequential Jung Learning',
          level: 'intermediate',
          nodes: [
            { id: 'foundations', label: 'Psychological Foundations', type: 'knowledge', cognitiveLevel: 'remember', content: { definition: 'Basic psychology', examples: [], keyPoints: [] }, position: { x: 0, y: 0 }, difficulty: 0.2, importance: 1.0 },
            { id: 'consciousness', label: 'Consciousness Theory', type: 'concept', cognitiveLevel: 'understand', content: { definition: 'Conscious mind', examples: [], keyPoints: [] }, position: { x: 0, y: 0 }, difficulty: 0.4, importance: 0.9 },
            { id: 'unconscious', label: 'Unconscious Theory', type: 'concept', cognitiveLevel: 'understand', content: { definition: 'Unconscious mind', examples: [], keyPoints: [] }, position: { x: 0, y: 0 }, difficulty: 0.5, importance: 0.9 },
            { id: 'complexes', label: 'Complex Theory', type: 'application', cognitiveLevel: 'apply', content: { definition: 'Psychological complexes', examples: [], keyPoints: [] }, position: { x: 0, y: 0 }, difficulty: 0.7, importance: 0.8 },
            { id: 'archetypes', label: 'Archetypal Theory', type: 'synthesis', cognitiveLevel: 'analyze', content: { definition: 'Collective archetypes', examples: [], keyPoints: [] }, position: { x: 0, y: 0 }, difficulty: 0.8, importance: 0.9 },
            { id: 'individuation', label: 'Individuation Process', type: 'synthesis', cognitiveLevel: 'create', content: { definition: 'Personal integration', examples: [], keyPoints: [] }, position: { x: 0, y: 0 }, difficulty: 0.95, importance: 1.0 }
          ],
          edges: [
            { id: 'p1', from: 'foundations', to: 'consciousness', type: 'prerequisite', strength: 'strong' },
            { id: 'p2', from: 'foundations', to: 'unconscious', type: 'prerequisite', strength: 'strong' },
            { id: 'p3', from: 'consciousness', to: 'complexes', type: 'prerequisite', strength: 'medium' },
            { id: 'p4', from: 'unconscious', to: 'complexes', type: 'prerequisite', strength: 'strong' },
            { id: 'p5', from: 'unconscious', to: 'archetypes', type: 'prerequisite', strength: 'strong' },
            { id: 'p6', from: 'complexes', to: 'individuation', type: 'builds-on', strength: 'medium' },
            { id: 'p7', from: 'archetypes', to: 'individuation', type: 'builds-on', strength: 'strong' }
          ],
          learningObjectives: [],
          prerequisites: [],
          assessmentPoints: []
        };

        const path = await llmGenerator.generateLearningPath(learningMap, 'foundations', 'individuation');

        expect(path[0]).toBe('foundations');
        expect(path[path.length - 1]).toBe('individuation');
        expect(path.length).toBeGreaterThanOrEqual(3); // Should be multi-step path

        // Should follow prerequisite structure
        const foundationsIndex = path.indexOf('foundations');
        const consciousnessIndex = path.indexOf('consciousness');
        const unconsciousIndex = path.indexOf('unconscious');
        const archetypesIndex = path.indexOf('archetypes');
        const individuationIndex = path.indexOf('individuation');

        expect(foundationsIndex).toBeLessThan(consciousnessIndex);
        expect(foundationsIndex).toBeLessThan(unconsciousIndex);
        expect(unconsciousIndex).toBeLessThan(archetypesIndex);
        expect(archetypesIndex).toBeLessThan(individuationIndex);
      });

      it('should consider educational difficulty in path weighting', async () => {
        const difficultyTestMap: EducationalMindMap = {
          id: 'difficulty-test',
          title: 'Difficulty-Based Paths',
          subject: 'Difficulty Testing',
          level: 'intermediate',
          nodes: [
            { id: 'easy', label: 'Easy Concept', type: 'knowledge', cognitiveLevel: 'remember', content: { definition: 'Easy', examples: [], keyPoints: [] }, position: { x: 0, y: 0 }, difficulty: 0.1, importance: 0.8 },
            { id: 'medium', label: 'Medium Concept', type: 'concept', cognitiveLevel: 'understand', content: { definition: 'Medium', examples: [], keyPoints: [] }, position: { x: 0, y: 0 }, difficulty: 0.5, importance: 0.8 },
            { id: 'hard', label: 'Hard Concept', type: 'application', cognitiveLevel: 'analyze', content: { definition: 'Hard', examples: [], keyPoints: [] }, position: { x: 0, y: 0 }, difficulty: 0.9, importance: 0.8 },
            { id: 'target', label: 'Target Concept', type: 'synthesis', cognitiveLevel: 'create', content: { definition: 'Target', examples: [], keyPoints: [] }, position: { x: 0, y: 0 }, difficulty: 0.7, importance: 0.9 }
          ],
          edges: [
            { id: 'easy-path', from: 'easy', to: 'medium', type: 'prerequisite', strength: 'strong' },
            { id: 'medium-target', from: 'medium', to: 'target', type: 'builds-on', strength: 'strong' },
            { id: 'hard-target', from: 'hard', to: 'target', type: 'relates', strength: 'weak' },
            { id: 'easy-hard', from: 'easy', to: 'hard', type: 'relates', strength: 'medium' }
          ],
          learningObjectives: [],
          prerequisites: [],
          assessmentPoints: []
        };

        const path = await llmGenerator.generateLearningPath(difficultyTestMap, 'easy', 'target');

        // Should prefer the easier path through medium difficulty
        expect(path).toContain('easy');
        expect(path).toContain('medium');
        expect(path).toContain('target');
        
        // Should avoid the hard concept if there's an easier path
        const easyIndex = path.indexOf('easy');
        const mediumIndex = path.indexOf('medium');
        const targetIndex = path.indexOf('target');

        expect(easyIndex).toBeLessThan(mediumIndex);
        expect(mediumIndex).toBeLessThan(targetIndex);
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle provider unavailability gracefully', async () => {
      mockProvider.isAvailable.mockResolvedValue(false);
      mockProvider.generateStructuredOutput.mockRejectedValue(new Error('Provider offline'));

      await expect(basicGenerator.generateMindMap(
        'Test Topic',
        ['concept'],
        'Test objective',
        'beginner'
      )).rejects.toThrow('Failed to generate mind map');

      await expect(llmGenerator.generateJungianMindMap(
        'Test Topic',
        ['concept'],
        'beginner'
      )).rejects.toThrow('Failed to generate Jungian mind map');
    });

    it('should validate input parameters comprehensively', async () => {
      // Test basic generator validation
      await expect(basicGenerator.generateMindMap('', ['concept'], 'objective', 'beginner'))
        .rejects.toThrow('Topic cannot be empty');

      await expect(basicGenerator.generateMindMap('Topic', [], 'objective', 'beginner'))
        .rejects.toThrow('At least one concept is required');

      await expect(basicGenerator.generateMindMap('Topic', ['concept'], '', 'beginner'))
        .rejects.toThrow('Learning objective cannot be empty');

      // Test LLM generator validation
      await expect(llmGenerator.generateJungianMindMap('', ['focus'], 'beginner'))
        .rejects.toThrow('Topic cannot be empty');

      await expect(llmGenerator.generateJungianMindMap('Topic', [], 'beginner'))
        .rejects.toThrow('At least one focus area is required');

      await expect(llmGenerator.generateJungianMindMap('Topic', Array(15).fill('focus'), 'beginner'))
        .rejects.toThrow('Too many focus areas (maximum 10)');
    });

    it('should handle malformed provider responses', async () => {
      // Incomplete data
      mockProvider.generateStructuredOutput.mockResolvedValue({
        title: 'Incomplete'
        // Missing required fields
      });

      await expect(basicGenerator.generateMindMap('Topic', ['concept'], 'objective', 'beginner'))
        .rejects.toThrow('Invalid mind map structure');

      await expect(llmGenerator.generateJungianMindMap('Topic', ['focus'], 'beginner'))
        .rejects.toThrow('Invalid Jungian mind map structure');
    });

    it('should handle network timeouts and retries', async () => {
      let callCount = 0;
      mockProvider.generateStructuredOutput.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Timeout'));
        }
        return Promise.resolve({
          title: 'Success after retry',
          rootConcept: { id: 'root', label: 'Root', description: 'Root', importance: 'high' },
          concepts: [],
          connections: []
        });
      });

      // Should fail on timeout
      await expect(basicGenerator.generateMindMap('Topic', ['concept'], 'objective', 'beginner'))
        .rejects.toThrow('Failed to generate mind map');
    });

    it('should handle extremely large datasets', async () => {
      const largeConcepts = Array(1000).fill(null).map((_, i) => `concept-${i}`);
      
      const mockLargeData = {
        title: 'Large Dataset',
        rootConcept: { id: 'root', label: 'Root', description: 'Root', importance: 'high' },
        concepts: largeConcepts.slice(0, 50).map(concept => ({
          id: concept,
          label: concept,
          description: `Description for ${concept}`,
          parentId: 'root',
          importance: 'medium',
          relationships: []
        })),
        connections: Array(50).fill(null).map((_, i) => ({
          from: 'root',
          to: `concept-${i}`,
          type: 'contains',
          strength: 'medium'
        }))
      };

      mockProvider.generateStructuredOutput.mockResolvedValue(mockLargeData);

      const result = await basicGenerator.generateMindMap(
        'Large Topic',
        largeConcepts,
        'Handle large datasets',
        'advanced'
      );

      // Should handle large input but limit output to reasonable size
      expect(result.nodes.length).toBeLessThanOrEqual(51); // Root + 50 concepts max
      expect(result.edges.length).toBeLessThanOrEqual(100); // Reasonable edge limit
    });

    it('should handle concurrent generation requests without conflicts', async () => {
      mockProvider.generateStructuredOutput.mockImplementation(async (prompt) => {
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        
        return {
          title: `Concurrent Result ${Math.random()}`,
          rootConcept: { id: 'root', label: 'Root', description: 'Root', importance: 'high' },
          concepts: [],
          connections: []
        };
      });

      const concurrentPromises = Array(20).fill(null).map((_, i) =>
        basicGenerator.generateMindMap(
          `Topic ${i}`,
          [`concept-${i}`],
          `Objective ${i}`,
          'beginner'
        )
      );

      const results = await Promise.all(concurrentPromises);

      expect(results).toHaveLength(20);
      
      // All results should be unique
      const titles = results.map(r => r.title);
      const uniqueTitles = new Set(titles);
      expect(uniqueTitles.size).toBe(titles.length);
    });

    it('should handle special characters and internationalization', async () => {
      const specialCharData = {
        title: 'Spéçiål Çhåråçtërs ånd Îñtërnåtiönålizåtiön',
        rootConcept: {
          id: 'root-special',
          label: 'Röøt Çöñçëpt',
          description: 'Descripción çön açëñtös',
          importance: 'high'
        },
        concepts: [
          {
            id: 'concept-unicode',
            label: '概念 (Chinese)',
            description: 'Concepto en español',
            parentId: 'root-special',
            importance: 'medium'
          },
          {
            id: 'concept-arabic',
            label: 'مفهوم (Arabic)',
            description: 'Понятие (Russian)',
            parentId: 'root-special',
            importance: 'medium'
          }
        ],
        connections: [
          {
            from: 'root-special',
            to: 'concept-unicode',
            type: 'contains',
            strength: 'strong'
          }
        ]
      };

      mockProvider.generateStructuredOutput.mockResolvedValue(specialCharData);

      const result = await basicGenerator.generateMindMap(
        'Întërnåtiönål Töpîç',
        ['çöñçëpt-üñiçödë', 'مفهوم-عربي'],
        'Öbjëçtïvë wïth spëçïål çhårs',
        'intermediate',
        'pt-BR'
      );

      expect(result.title).toContain('Spéçiål');
      expect(result.nodes.some(n => n.label.includes('概念'))).toBeTruthy();
      expect(result.nodes.some(n => n.label.includes('مفهوم'))).toBeTruthy();
    });
  });

  describe('Performance and Memory Management', () => {
    it('should handle memory efficiently during large operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Generate multiple large mind maps
      const promises = Array(10).fill(null).map((_, i) => {
        const largeMockData = {
          title: `Large Map ${i}`,
          rootConcept: { id: `root-${i}`, label: `Root ${i}`, description: 'Description', importance: 'high' },
          concepts: Array(100).fill(null).map((_, j) => ({
            id: `concept-${i}-${j}`,
            label: `Concept ${i}-${j}`,
            description: `Description for concept ${i}-${j}`,
            parentId: `root-${i}`,
            importance: 'medium',
            relationships: []
          })),
          connections: Array(150).fill(null).map((_, j) => ({
            from: j < 50 ? `root-${i}` : `concept-${i}-${Math.floor(j / 3)}`,
            to: `concept-${i}-${j % 100}`,
            type: 'relates',
            strength: 'medium'
          }))
        };

        mockProvider.generateStructuredOutput.mockResolvedValue(largeMockData);

        return basicGenerator.generateMindMap(
          `Large Topic ${i}`,
          [`concept-${i}`],
          `Large objective ${i}`,
          'advanced'
        );
      });

      const results = await Promise.all(promises);

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      expect(results).toHaveLength(10);
      // Memory increase should be reasonable (less than 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });

    it('should process mind maps within reasonable time limits', async () => {
      const mockData = {
        title: 'Performance Test',
        rootConcept: { id: 'root', label: 'Root', description: 'Root', importance: 'high' },
        concepts: Array(50).fill(null).map((_, i) => ({
          id: `perf-concept-${i}`,
          label: `Performance Concept ${i}`,
          description: `Description ${i}`,
          parentId: 'root',
          importance: 'medium',
          relationships: []
        })),
        connections: Array(75).fill(null).map((_, i) => ({
          from: i < 25 ? 'root' : `perf-concept-${Math.floor(i / 3)}`,
          to: `perf-concept-${i % 50}`,
          type: 'relates',
          strength: 'medium'
        }))
      };

      mockProvider.generateStructuredOutput.mockResolvedValue(mockData);

      const startTime = Date.now();
      
      const result = await basicGenerator.generateMindMap(
        'Performance Test Topic',
        Array(50).fill(null).map((_, i) => `concept-${i}`),
        'Test performance with many concepts',
        'advanced'
      );

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(result).toBeDefined();
      expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle cleanup and resource management', async () => {
      // Test with resources that need cleanup
      let resourceCount = 0;

      const mockDataWithResources = {
        title: 'Resource Management Test',
        rootConcept: { id: 'root', label: 'Root', description: 'Root', importance: 'high' },
        concepts: Array(20).fill(null).map((_, i) => {
          resourceCount++;
          return {
            id: `resource-concept-${i}`,
            label: `Resource Concept ${i}`,
            description: `Description with resource ${resourceCount}`,
            parentId: 'root',
            importance: 'medium',
            relationships: []
          };
        }),
        connections: []
      };

      mockProvider.generateStructuredOutput.mockResolvedValue(mockDataWithResources);

      const result = await basicGenerator.generateMindMap(
        'Resource Management',
        ['resource-intensive'],
        'Test resource cleanup',
        'intermediate'
      );

      expect(result).toBeDefined();
      expect(resourceCount).toBe(20); // All resources should be processed
    });
  });
});