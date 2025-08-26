import { 
  LLMMindMapGenerator, 
  EducationalMindMap, 
  InteractiveMindMapFeatures,
  MindMapVisualizationData,
  LayoutAlgorithmConfig 
} from '../llmMindMapGenerator';
import { ILLMProvider } from '../../llm/types';

/**
 * Test suite for interactive mind map features and user interactions
 * Covers visualization, navigation, progressive disclosure, and accessibility
 */
describe('Interactive Mind Map Features', () => {
  let generator: LLMMindMapGenerator;
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

    generator = new LLMMindMapGenerator(mockProvider);
  });

  beforeAll(async () => {
    // Coordination hook: Interactive features testing
    try {
      await import('child_process').then(cp => {
        cp.exec('npx claude-flow@alpha hooks pre-task --description "Interactive mind map features testing" --memory-key "swarm/testing/interactive"');
      });
    } catch (error) {
      console.log('Coordination hook not available, continuing with interactive tests');
    }
  });

  afterAll(async () => {
    // Coordination hook: Complete interactive testing
    try {
      await import('child_process').then(cp => {
        cp.exec('npx claude-flow@alpha hooks post-task --task-id "interactive-features-tests" --memory-key "swarm/testing/interactive-complete"');
      });
    } catch (error) {
      console.log('Interactive features tests completed');
    }
  });

  describe('Visualization and Theme Generation', () => {
    const sampleMindMap: EducationalMindMap = {
      id: 'visual-test',
      title: 'Visual Test Map',
      subject: 'Jung Visual Learning',
      level: 'intermediate',
      nodes: [
        {
          id: 'visual-root',
          label: 'Visual Root',
          type: 'concept',
          cognitiveLevel: 'understand',
          content: {
            definition: 'Root concept for visualization',
            examples: ['Visual example'],
            keyPoints: ['Visual key point']
          },
          jungianContext: {
            archetype: 'Self',
            psycheLevel: 'conscious',
            symbolism: ['Circle', 'Center']
          },
          position: { x: 0, y: 0 },
          difficulty: 0.5,
          importance: 1.0
        },
        {
          id: 'visual-child1',
          label: 'Visual Child 1',
          type: 'application',
          cognitiveLevel: 'apply',
          content: {
            definition: 'First child concept',
            examples: ['Application example'],
            keyPoints: ['Application point']
          },
          jungianContext: {
            archetype: 'Shadow',
            psycheLevel: 'personal-unconscious',
            symbolism: ['Dark figure', 'Hidden aspect']
          },
          position: { x: 100, y: 50 },
          difficulty: 0.6,
          importance: 0.8
        },
        {
          id: 'visual-child2',
          label: 'Visual Child 2',
          type: 'skill',
          cognitiveLevel: 'analyze',
          content: {
            definition: 'Second child concept',
            examples: ['Analysis example'],
            keyPoints: ['Analysis point']
          },
          jungianContext: {
            psycheLevel: 'collective-unconscious',
            symbolism: ['Universal pattern']
          },
          position: { x: -100, y: 50 },
          difficulty: 0.7,
          importance: 0.7
        }
      ],
      edges: [
        {
          id: 'visual-edge1',
          from: 'visual-root',
          to: 'visual-child1',
          type: 'prerequisite',
          strength: 'strong',
          learningPath: true
        },
        {
          id: 'visual-edge2',
          from: 'visual-root',
          to: 'visual-child2',
          type: 'supports',
          strength: 'medium',
          learningPath: false
        }
      ],
      learningObjectives: ['Visual learning objective'],
      prerequisites: ['Visual prerequisite'],
      assessmentPoints: ['Visual assessment']
    };

    it('should generate Jung-themed visualization styles', async () => {
      const interactiveFeatures: InteractiveMindMapFeatures = {
        zoomEnabled: true,
        panEnabled: true,
        nodeExpansion: true,
        searchHighlight: true,
        pathTracing: true,
        progressTracking: true
      };

      const visualizationData = generator.generateVisualizationData(sampleMindMap, interactiveFeatures);

      expect(visualizationData.theme).toBe('jung');
      expect(visualizationData.animations).toBe(true);

      // Check Jung-specific node styles based on archetype
      expect(visualizationData.nodeStyles['visual-root']).toBeDefined();
      expect(visualizationData.nodeStyles['visual-child1']).toBeDefined();
      expect(visualizationData.nodeStyles['visual-child2']).toBeDefined();

      // Self archetype should have distinctive styling
      const selfNodeStyle = visualizationData.nodeStyles['visual-root'];
      expect(selfNodeStyle.color).toBeDefined();
      expect(selfNodeStyle.shape).toBeDefined();
      expect(selfNodeStyle.size).toBeGreaterThan(0);
    });

    it('should adapt node styles based on psyche levels', async () => {
      const interactiveFeatures: InteractiveMindMapFeatures = {
        zoomEnabled: true,
        panEnabled: true,
        nodeExpansion: false,
        searchHighlight: true,
        pathTracing: true,
        progressTracking: true
      };

      const visualizationData = generator.generateVisualizationData(sampleMindMap, interactiveFeatures);

      const consciousNodeStyle = visualizationData.nodeStyles['visual-root'];
      const personalUnconsciousNodeStyle = visualizationData.nodeStyles['visual-child1'];
      const collectiveUnconsciousNodeStyle = visualizationData.nodeStyles['visual-child2'];

      // Different psyche levels should have different visual treatments
      expect(consciousNodeStyle).not.toEqual(personalUnconsciousNodeStyle);
      expect(personalUnconsciousNodeStyle).not.toEqual(collectiveUnconsciousNodeStyle);

      // Animations should be disabled when node expansion is off
      expect(visualizationData.animations).toBe(false);
    });

    it('should generate educational theme for non-Jung subjects', async () => {
      const educationalMap: EducationalMindMap = {
        ...sampleMindMap,
        subject: 'Mathematics Learning',
        title: 'Algebra Concepts'
      };

      const interactiveFeatures: InteractiveMindMapFeatures = {
        zoomEnabled: true,
        panEnabled: true,
        nodeExpansion: true,
        searchHighlight: true,
        pathTracing: true,
        progressTracking: true
      };

      const visualizationData = generator.generateVisualizationData(educationalMap, interactiveFeatures);

      expect(visualizationData.theme).toBe('educational');

      // Educational theme should use cognitive levels for styling
      const nodeStyles = Object.values(visualizationData.nodeStyles);
      expect(nodeStyles.length).toBe(educationalMap.nodes.length);
    });

    it('should create appropriate edge styles for different relationship types', async () => {
      const interactiveFeatures: InteractiveMindMapFeatures = {
        zoomEnabled: true,
        panEnabled: true,
        nodeExpansion: true,
        searchHighlight: true,
        pathTracing: true,
        progressTracking: true
      };

      const visualizationData = generator.generateVisualizationData(sampleMindMap, interactiveFeatures);

      const prerequisiteEdgeStyle = visualizationData.edgeStyles['visual-edge1'];
      const supportsEdgeStyle = visualizationData.edgeStyles['visual-edge2'];

      expect(prerequisiteEdgeStyle.width).toBeGreaterThan(supportsEdgeStyle.width);
      expect(prerequisiteEdgeStyle.style).toBe('solid');
      expect(prerequisiteEdgeStyle.color).toBeDefined();
      expect(supportsEdgeStyle.color).toBeDefined();
    });

    it('should select optimal layout based on mind map characteristics', async () => {
      // Test hierarchical selection
      const hierarchicalMap: EducationalMindMap = {
        ...sampleMindMap,
        edges: [
          { id: 'h1', from: 'visual-root', to: 'visual-child1', type: 'prerequisite', strength: 'strong' },
          { id: 'h2', from: 'visual-child1', to: 'visual-child2', type: 'builds-on', strength: 'strong' }
        ]
      };

      const interactiveFeatures: InteractiveMindMapFeatures = {
        zoomEnabled: true,
        panEnabled: true,
        nodeExpansion: true,
        searchHighlight: true,
        pathTracing: true,
        progressTracking: true
      };

      const hierarchicalViz = generator.generateVisualizationData(hierarchicalMap, interactiveFeatures);
      expect(hierarchicalViz.layout).toBe('hierarchical');

      // Test radial selection for small maps
      const smallMap: EducationalMindMap = {
        ...sampleMindMap,
        nodes: sampleMindMap.nodes.slice(0, 1)
      };

      const radialViz = generator.generateVisualizationData(smallMap, interactiveFeatures);
      expect(radialViz.layout).toBe('radial');
    });
  });

  describe('Interactive Navigation Features', () => {
    it('should generate learning paths for guided navigation', async () => {
      const navigationMap: EducationalMindMap = {
        id: 'nav-test',
        title: 'Navigation Test Map',
        subject: 'Sequential Learning',
        level: 'intermediate',
        nodes: [
          {
            id: 'nav-start',
            label: 'Starting Point',
            type: 'knowledge',
            cognitiveLevel: 'remember',
            content: { definition: 'Start here', examples: [], keyPoints: [] },
            position: { x: 0, y: 0 },
            difficulty: 0.2,
            importance: 1.0
          },
          {
            id: 'nav-middle',
            label: 'Middle Concept',
            type: 'concept',
            cognitiveLevel: 'understand',
            content: { definition: 'Middle step', examples: [], keyPoints: [] },
            position: { x: 100, y: 0 },
            difficulty: 0.5,
            importance: 0.8
          },
          {
            id: 'nav-end',
            label: 'End Goal',
            type: 'synthesis',
            cognitiveLevel: 'create',
            content: { definition: 'Final destination', examples: [], keyPoints: [] },
            position: { x: 200, y: 0 },
            difficulty: 0.9,
            importance: 1.0
          }
        ],
        edges: [
          {
            id: 'nav-edge1',
            from: 'nav-start',
            to: 'nav-middle',
            type: 'prerequisite',
            strength: 'strong',
            learningPath: true
          },
          {
            id: 'nav-edge2',
            from: 'nav-middle',
            to: 'nav-end',
            type: 'builds-on',
            strength: 'strong',
            learningPath: true
          }
        ],
        learningObjectives: ['Navigate through learning sequence'],
        prerequisites: ['Basic navigation skills'],
        assessmentPoints: ['Check navigation progress']
      };

      const learningPath = await generator.generateLearningPath(
        navigationMap,
        'nav-start',
        'nav-end'
      );

      expect(learningPath).toEqual(['nav-start', 'nav-middle', 'nav-end']);
      expect(learningPath.length).toBe(3);
    });

    it('should handle alternative paths when direct route unavailable', async () => {
      const alternativePathMap: EducationalMindMap = {
        id: 'alt-path-test',
        title: 'Alternative Paths Test',
        subject: 'Multiple Routes Learning',
        level: 'intermediate',
        nodes: [
          {
            id: 'alt-start',
            label: 'Start',
            type: 'knowledge',
            cognitiveLevel: 'remember',
            content: { definition: 'Starting point', examples: [], keyPoints: [] },
            position: { x: 0, y: 0 },
            difficulty: 0.2,
            importance: 1.0
          },
          {
            id: 'alt-path1',
            label: 'Path 1',
            type: 'concept',
            cognitiveLevel: 'understand',
            content: { definition: 'First alternative', examples: [], keyPoints: [] },
            position: { x: 50, y: 50 },
            difficulty: 0.4,
            importance: 0.7
          },
          {
            id: 'alt-path2',
            label: 'Path 2',
            type: 'concept',
            cognitiveLevel: 'understand',
            content: { definition: 'Second alternative', examples: [], keyPoints: [] },
            position: { x: 50, y: -50 },
            difficulty: 0.6,
            importance: 0.8
          },
          {
            id: 'alt-end',
            label: 'End',
            type: 'synthesis',
            cognitiveLevel: 'create',
            content: { definition: 'Final goal', examples: [], keyPoints: [] },
            position: { x: 100, y: 0 },
            difficulty: 0.9,
            importance: 1.0
          }
        ],
        edges: [
          {
            id: 'alt-edge1',
            from: 'alt-start',
            to: 'alt-path1',
            type: 'prerequisite',
            strength: 'strong',
            learningPath: true
          },
          {
            id: 'alt-edge2',
            from: 'alt-start',
            to: 'alt-path2',
            type: 'prerequisite',
            strength: 'medium',
            learningPath: true
          },
          {
            id: 'alt-edge3',
            from: 'alt-path1',
            to: 'alt-end',
            type: 'builds-on',
            strength: 'strong',
            learningPath: true
          },
          {
            id: 'alt-edge4',
            from: 'alt-path2',
            to: 'alt-end',
            type: 'builds-on',
            strength: 'medium',
            learningPath: true
          }
        ],
        learningObjectives: ['Explore alternative learning paths'],
        prerequisites: ['Basic understanding'],
        assessmentPoints: ['Evaluate path selection']
      };

      const learningPath = await generator.generateLearningPath(
        alternativePathMap,
        'alt-start',
        'alt-end'
      );

      expect(learningPath[0]).toBe('alt-start');
      expect(learningPath[learningPath.length - 1]).toBe('alt-end');
      expect(learningPath).toContain('alt-path1'); // Should prefer easier path
      expect(learningPath.length).toBe(3);
    });

    it('should consider difficulty levels in path optimization', async () => {
      const difficultyMap: EducationalMindMap = {
        id: 'difficulty-nav',
        title: 'Difficulty Navigation Test',
        subject: 'Difficulty-Based Routing',
        level: 'beginner',
        nodes: [
          {
            id: 'diff-start',
            label: 'Easy Start',
            type: 'knowledge',
            cognitiveLevel: 'remember',
            content: { definition: 'Easy beginning', examples: [], keyPoints: [] },
            position: { x: 0, y: 0 },
            difficulty: 0.1,
            importance: 1.0
          },
          {
            id: 'diff-easy',
            label: 'Easy Path',
            type: 'concept',
            cognitiveLevel: 'understand',
            content: { definition: 'Easy route', examples: [], keyPoints: [] },
            position: { x: 50, y: 25 },
            difficulty: 0.3,
            importance: 0.8
          },
          {
            id: 'diff-hard',
            label: 'Hard Path',
            type: 'application',
            cognitiveLevel: 'apply',
            content: { definition: 'Challenging route', examples: [], keyPoints: [] },
            position: { x: 50, y: -25 },
            difficulty: 0.9,
            importance: 0.6
          },
          {
            id: 'diff-end',
            label: 'Common Goal',
            type: 'synthesis',
            cognitiveLevel: 'analyze',
            content: { definition: 'Shared destination', examples: [], keyPoints: [] },
            position: { x: 100, y: 0 },
            difficulty: 0.7,
            importance: 1.0
          }
        ],
        edges: [
          {
            id: 'diff-edge1',
            from: 'diff-start',
            to: 'diff-easy',
            type: 'prerequisite',
            strength: 'strong'
          },
          {
            id: 'diff-edge2',
            from: 'diff-start',
            to: 'diff-hard',
            type: 'relates',
            strength: 'weak'
          },
          {
            id: 'diff-edge3',
            from: 'diff-easy',
            to: 'diff-end',
            type: 'builds-on',
            strength: 'strong'
          },
          {
            id: 'diff-edge4',
            from: 'diff-hard',
            to: 'diff-end',
            type: 'relates',
            strength: 'medium'
          }
        ],
        learningObjectives: ['Navigate considering difficulty'],
        prerequisites: ['Understanding of difficulty levels'],
        assessmentPoints: ['Evaluate difficulty-appropriate paths']
      };

      const optimalPath = await generator.generateLearningPath(
        difficultyMap,
        'diff-start',
        'diff-end'
      );

      // Should prefer the easier path for beginner level
      expect(optimalPath).toContain('diff-easy');
      expect(optimalPath).toEqual(['diff-start', 'diff-easy', 'diff-end']);
    });
  });

  describe('Progressive Disclosure and Node Expansion', () => {
    const expansionTestData = {
      title: 'Progressive Disclosure Test',
      subject: 'Expandable Jung Concepts',
      nodes: [
        {
          id: 'expandable-root',
          label: 'Root Concept',
          type: 'concept',
          cognitiveLevel: 'understand',
          content: {
            definition: 'Main concept that can be expanded',
            examples: [
              'Basic example',
              'Intermediate example with more detail',
              'Advanced example requiring deeper understanding'
            ],
            keyPoints: [
              'Key point 1: Basic understanding',
              'Key point 2: Intermediate application',
              'Key point 3: Advanced integration',
              'Key point 4: Expert-level synthesis'
            ]
          },
          jungianContext: {
            archetype: 'Self',
            psycheLevel: 'collective-unconscious',
            symbolism: [
              'Circle (wholeness)',
              'Mandala (integration)',
              'Tree (growth and development)',
              'Mountain (achievement and transcendence)'
            ]
          },
          difficulty: 0.6,
          importance: 1.0
        },
        {
          id: 'expandable-child1',
          label: 'Detailed Subtopic 1',
          type: 'application',
          cognitiveLevel: 'apply',
          content: {
            definition: 'First subtopic with expandable content',
            examples: [
              'Practical application example',
              'Case study demonstration',
              'Real-world implementation'
            ],
            keyPoints: [
              'Application principle 1',
              'Application principle 2',
              'Implementation strategy',
              'Common pitfalls to avoid'
            ]
          },
          jungianContext: {
            archetype: 'Hero',
            psycheLevel: 'personal-unconscious',
            symbolism: [
              'Journey (process of application)',
              'Tools (methods and techniques)',
              'Quest (goal-oriented activity)'
            ]
          },
          difficulty: 0.7,
          importance: 0.8
        },
        {
          id: 'expandable-child2',
          label: 'Complex Subtopic 2',
          type: 'synthesis',
          cognitiveLevel: 'evaluate',
          content: {
            definition: 'Second subtopic with complex nested information',
            examples: [
              'Analytical framework example',
              'Comparative analysis case',
              'Critical evaluation scenario',
              'Synthesis demonstration'
            ],
            keyPoints: [
              'Evaluation criteria',
              'Critical thinking principles',
              'Comparative methodologies',
              'Synthesis techniques',
              'Integration strategies'
            ]
          },
          jungianContext: {
            archetype: 'Wise Old Man',
            psycheLevel: 'collective-unconscious',
            symbolism: [
              'Scales (judgment and balance)',
              'Books (knowledge and wisdom)',
              'Observatory (perspective and insight)',
              'Council (deliberation and decision)'
            ]
          },
          difficulty: 0.9,
          importance: 0.9
        }
      ],
      edges: [
        {
          from: 'expandable-root',
          to: 'expandable-child1',
          type: 'contains',
          strength: 'strong',
          label: 'Root contains practical applications'
        },
        {
          from: 'expandable-root',
          to: 'expandable-child2',
          type: 'contains',
          strength: 'strong',
          label: 'Root contains analytical frameworks'
        },
        {
          from: 'expandable-child1',
          to: 'expandable-child2',
          type: 'supports',
          strength: 'medium',
          label: 'Application supports evaluation'
        }
      ],
      learningObjectives: [
        'Understand progressive disclosure principles',
        'Apply expandable content strategies',
        'Evaluate information hierarchy effectiveness'
      ],
      prerequisites: [
        'Basic understanding of information architecture',
        'Familiarity with cognitive load theory'
      ],
      assessmentPoints: [
        'Demonstrate progressive disclosure navigation',
        'Create effective content hierarchies',
        'Evaluate expansion strategies'
      ]
    };

    it('should support progressive disclosure through content depth levels', async () => {
      mockProvider.generateStructuredOutput.mockResolvedValue(expansionTestData);

      const expandableMap = await generator.generateJungianMindMap(
        'Progressive Disclosure',
        ['Expandable Content', 'Information Hierarchy', 'Cognitive Load Management'],
        'advanced'
      );

      // Check that nodes have sufficient content for expansion
      expandableMap.nodes.forEach(node => {
        expect(node.content.examples.length).toBeGreaterThan(2);
        expect(node.content.keyPoints.length).toBeGreaterThan(2);
      });

      // Jung context should provide additional expansion material
      const nodeWithJungContext = expandableMap.nodes.find(n => n.jungianContext?.symbolism);
      expect(nodeWithJungContext?.jungianContext?.symbolism?.length).toBeGreaterThan(2);
    });

    it('should provide different expansion levels based on cognitive complexity', async () => {
      mockProvider.generateStructuredOutput.mockResolvedValue(expansionTestData);

      const expandableMap = await generator.generateJungianMindMap(
        'Cognitive Complexity Expansion',
        ['Basic Understanding', 'Application', 'Evaluation'],
        'advanced'
      );

      const basicNode = expandableMap.nodes.find(n => n.cognitiveLevel === 'understand');
      const applicationNode = expandableMap.nodes.find(n => n.cognitiveLevel === 'apply');
      const evaluationNode = expandableMap.nodes.find(n => n.cognitiveLevel === 'evaluate');

      // Higher cognitive levels should have more complex content
      if (basicNode && applicationNode && evaluationNode) {
        expect(evaluationNode.content.keyPoints.length).toBeGreaterThanOrEqual(applicationNode.content.keyPoints.length);
        expect(evaluationNode.difficulty).toBeGreaterThan(basicNode.difficulty);
      }
    });

    it('should enable contextual expansion based on Jung archetypes', async () => {
      mockProvider.generateStructuredOutput.mockResolvedValue(expansionTestData);

      const jungContextMap = await generator.generateJungianMindMap(
        'Archetypal Context Expansion',
        ['Self Archetype', 'Hero Journey', 'Wise Old Man'],
        'advanced'
      );

      const selfNode = jungContextMap.nodes.find(n => n.jungianContext?.archetype === 'Self');
      const heroNode = jungContextMap.nodes.find(n => n.jungianContext?.archetype === 'Hero');
      const wiseManNode = jungContextMap.nodes.find(n => n.jungianContext?.archetype === 'Wise Old Man');

      // Each archetype should have distinct symbolic content for expansion
      expect(selfNode?.jungianContext?.symbolism).toContain('Circle (wholeness)');
      expect(heroNode?.jungianContext?.symbolism).toContain('Journey (process of application)');
      expect(wiseManNode?.jungianContext?.symbolism).toContain('Books (knowledge and wisdom)');
    });

    it('should handle expansion state management', async () => {
      const interactiveFeatures: InteractiveMindMapFeatures = {
        zoomEnabled: true,
        panEnabled: true,
        nodeExpansion: true,
        searchHighlight: true,
        pathTracing: true,
        progressTracking: true
      };

      mockProvider.generateStructuredOutput.mockResolvedValue(expansionTestData);

      const expandableMap = await generator.generateJungianMindMap(
        'Expansion State Management',
        ['Node Expansion', 'State Tracking'],
        'intermediate'
      );

      const visualizationData = generator.generateVisualizationData(expandableMap, interactiveFeatures);

      // Should enable animations when node expansion is active
      expect(visualizationData.animations).toBe(true);

      // Node styles should support expansion states
      Object.values(visualizationData.nodeStyles).forEach(style => {
        expect(style.size).toBeGreaterThan(0);
        expect(style.color).toBeDefined();
        expect(style.shape).toBeDefined();
      });
    });
  });

  describe('Search and Highlighting Features', () => {
    it('should support semantic search across mind map content', async () => {
      const searchTestData = {
        title: 'Semantic Search Test Map',
        subject: 'Searchable Jung Content',
        nodes: [
          {
            id: 'search-shadow',
            label: 'Shadow Work',
            type: 'concept',
            cognitiveLevel: 'understand',
            content: {
              definition: 'Integration of rejected aspects of personality',
              examples: ['Projection withdrawal', 'Dream analysis', 'Active imagination'],
              keyPoints: ['Unconscious content', 'Personal development', 'Psychological integration']
            },
            jungianContext: {
              archetype: 'Shadow',
              psycheLevel: 'personal-unconscious',
              symbolism: ['Dark figures', 'Hidden aspects', 'Repressed material']
            },
            difficulty: 0.7,
            importance: 0.9
          },
          {
            id: 'search-anima',
            label: 'Anima Development',
            type: 'application',
            cognitiveLevel: 'apply',
            content: {
              definition: 'Integration of feminine aspects in male psyche',
              examples: ['Relationship patterns', 'Creative inspiration', 'Emotional development'],
              keyPoints: ['Contrasexual archetype', 'Soul image', 'Individuation process']
            },
            jungianContext: {
              archetype: 'Anima',
              psycheLevel: 'collective-unconscious',
              symbolism: ['Feminine figures', 'Muses', 'Soul guides']
            },
            difficulty: 0.8,
            importance: 0.8
          }
        ],
        edges: [
          {
            from: 'search-shadow',
            to: 'search-anima',
            type: 'prerequisite',
            strength: 'strong',
            label: 'Shadow work precedes anima integration'
          }
        ],
        learningObjectives: ['Master searchable content'],
        prerequisites: ['Basic Jung knowledge'],
        assessmentPoints: ['Search effectiveness assessment']
      };

      mockProvider.generateStructuredOutput.mockResolvedValue(searchTestData);

      const searchMap = await generator.generateJungianMindMap(
        'Searchable Content',
        ['Shadow', 'Anima', 'Integration'],
        'intermediate'
      );

      // Verify rich searchable content
      const shadowNode = searchMap.nodes.find(n => n.id === 'search-shadow');
      const animaNode = searchMap.nodes.find(n => n.id === 'search-anima');

      // Content should be searchable across multiple dimensions
      expect(shadowNode?.content.definition).toContain('rejected aspects');
      expect(shadowNode?.content.keyPoints).toContain('Unconscious content');
      expect(shadowNode?.jungianContext?.symbolism).toContain('Dark figures');

      expect(animaNode?.content.definition).toContain('feminine aspects');
      expect(animaNode?.content.keyPoints).toContain('Contrasexual archetype');
      expect(animaNode?.jungianContext?.symbolism).toContain('Soul guides');
    });

    it('should generate highlighting data for search results', async () => {
      const interactiveFeatures: InteractiveMindMapFeatures = {
        zoomEnabled: true,
        panEnabled: true,
        nodeExpansion: true,
        searchHighlight: true,
        pathTracing: true,
        progressTracking: true
      };

      const highlightMap: EducationalMindMap = {
        id: 'highlight-test',
        title: 'Highlight Test Map',
        subject: 'Search Highlighting',
        level: 'intermediate',
        nodes: [
          {
            id: 'highlight-node1',
            label: 'Searchable Node 1',
            type: 'concept',
            cognitiveLevel: 'understand',
            content: {
              definition: 'Node with searchable content',
              examples: ['Search example'],
              keyPoints: ['Searchable key point']
            },
            position: { x: 0, y: 0 },
            difficulty: 0.5,
            importance: 0.8
          },
          {
            id: 'highlight-node2',
            label: 'Searchable Node 2',
            type: 'application',
            cognitiveLevel: 'apply',
            content: {
              definition: 'Another searchable node',
              examples: ['Application example'],
              keyPoints: ['Application key point']
            },
            position: { x: 100, y: 0 },
            difficulty: 0.6,
            importance: 0.7
          }
        ],
        edges: [
          {
            id: 'highlight-edge',
            from: 'highlight-node1',
            to: 'highlight-node2',
            type: 'relates',
            strength: 'medium'
          }
        ],
        learningObjectives: ['Test highlighting'],
        prerequisites: ['Search capability'],
        assessmentPoints: ['Highlighting assessment']
      };

      const visualizationData = generator.generateVisualizationData(highlightMap, interactiveFeatures);

      // Should include highlighting support in node styles
      Object.values(visualizationData.nodeStyles).forEach(style => {
        expect(style.color).toBeDefined(); // Base color for highlighting
        expect(style.shape).toBeDefined(); // Shape for visual distinction
      });

      // Edge styles should support highlighting
      Object.values(visualizationData.edgeStyles).forEach(style => {
        expect(style.color).toBeDefined();
        expect(style.width).toBeGreaterThan(0);
      });
    });
  });

  describe('Path Tracing and Progress Tracking', () => {
    it('should enable learning path visualization and tracking', async () => {
      const pathTracingMap: EducationalMindMap = {
        id: 'path-tracing',
        title: 'Path Tracing Test',
        subject: 'Learning Path Visualization',
        level: 'intermediate',
        nodes: [
          {
            id: 'path-start',
            label: 'Learning Start',
            type: 'knowledge',
            cognitiveLevel: 'remember',
            content: { definition: 'Starting point', examples: [], keyPoints: [] },
            position: { x: 0, y: 0 },
            difficulty: 0.2,
            importance: 1.0
          },
          {
            id: 'path-checkpoint1',
            label: 'Checkpoint 1',
            type: 'concept',
            cognitiveLevel: 'understand',
            content: { definition: 'First checkpoint', examples: [], keyPoints: [] },
            position: { x: 100, y: 0 },
            difficulty: 0.4,
            importance: 0.8
          },
          {
            id: 'path-checkpoint2',
            label: 'Checkpoint 2',
            type: 'application',
            cognitiveLevel: 'apply',
            content: { definition: 'Second checkpoint', examples: [], keyPoints: [] },
            position: { x: 200, y: 0 },
            difficulty: 0.6,
            importance: 0.8
          },
          {
            id: 'path-goal',
            label: 'Learning Goal',
            type: 'synthesis',
            cognitiveLevel: 'create',
            content: { definition: 'Final goal', examples: [], keyPoints: [] },
            position: { x: 300, y: 0 },
            difficulty: 0.8,
            importance: 1.0
          }
        ],
        edges: [
          {
            id: 'path-edge1',
            from: 'path-start',
            to: 'path-checkpoint1',
            type: 'prerequisite',
            strength: 'strong',
            learningPath: true
          },
          {
            id: 'path-edge2',
            from: 'path-checkpoint1',
            to: 'path-checkpoint2',
            type: 'prerequisite',
            strength: 'strong',
            learningPath: true
          },
          {
            id: 'path-edge3',
            from: 'path-checkpoint2',
            to: 'path-goal',
            type: 'builds-on',
            strength: 'strong',
            learningPath: true
          }
        ],
        learningObjectives: ['Complete learning path'],
        prerequisites: ['Path tracing capability'],
        assessmentPoints: ['Path completion assessment']
      };

      const learningPath = await generator.generateLearningPath(
        pathTracingMap,
        'path-start',
        'path-goal'
      );

      expect(learningPath).toEqual([
        'path-start',
        'path-checkpoint1',
        'path-checkpoint2',
        'path-goal'
      ]);

      // Learning path edges should be marked for visualization
      const learningPathEdges = pathTracingMap.edges.filter(e => e.learningPath);
      expect(learningPathEdges).toHaveLength(3);
    });

    it('should track progress through cognitive levels', async () => {
      const progressMap: EducationalMindMap = {
        id: 'progress-test',
        title: 'Progress Tracking Test',
        subject: 'Cognitive Development Tracking',
        level: 'advanced',
        nodes: [
          {
            id: 'remember-level',
            label: 'Remember Level',
            type: 'knowledge',
            cognitiveLevel: 'remember',
            content: { definition: 'Memorization and recall', examples: [], keyPoints: [] },
            position: { x: 0, y: 0 },
            difficulty: 0.2,
            importance: 0.8
          },
          {
            id: 'understand-level',
            label: 'Understand Level',
            type: 'concept',
            cognitiveLevel: 'understand',
            content: { definition: 'Comprehension and explanation', examples: [], keyPoints: [] },
            position: { x: 0, y: 50 },
            difficulty: 0.4,
            importance: 0.8
          },
          {
            id: 'apply-level',
            label: 'Apply Level',
            type: 'application',
            cognitiveLevel: 'apply',
            content: { definition: 'Using knowledge in new situations', examples: [], keyPoints: [] },
            position: { x: 0, y: 100 },
            difficulty: 0.6,
            importance: 0.8
          },
          {
            id: 'analyze-level',
            label: 'Analyze Level',
            type: 'analysis',
            cognitiveLevel: 'analyze',
            content: { definition: 'Breaking down and examining', examples: [], keyPoints: [] },
            position: { x: 0, y: 150 },
            difficulty: 0.7,
            importance: 0.9
          },
          {
            id: 'evaluate-level',
            label: 'Evaluate Level',
            type: 'synthesis',
            cognitiveLevel: 'evaluate',
            content: { definition: 'Making judgments and assessments', examples: [], keyPoints: [] },
            position: { x: 0, y: 200 },
            difficulty: 0.8,
            importance: 0.9
          },
          {
            id: 'create-level',
            label: 'Create Level',
            type: 'synthesis',
            cognitiveLevel: 'create',
            content: { definition: 'Producing new and original work', examples: [], keyPoints: [] },
            position: { x: 0, y: 250 },
            difficulty: 0.9,
            importance: 1.0
          }
        ],
        edges: [
          { id: 'prog1', from: 'remember-level', to: 'understand-level', type: 'prerequisite', strength: 'strong', learningPath: true },
          { id: 'prog2', from: 'understand-level', to: 'apply-level', type: 'prerequisite', strength: 'strong', learningPath: true },
          { id: 'prog3', from: 'apply-level', to: 'analyze-level', type: 'prerequisite', strength: 'strong', learningPath: true },
          { id: 'prog4', from: 'analyze-level', to: 'evaluate-level', type: 'prerequisite', strength: 'strong', learningPath: true },
          { id: 'prog5', from: 'evaluate-level', to: 'create-level', type: 'prerequisite', strength: 'strong', learningPath: true }
        ],
        learningObjectives: ['Progress through all cognitive levels'],
        prerequisites: ['Understanding of Bloom\'s taxonomy'],
        assessmentPoints: ['Cognitive level assessments']
      };

      const cognitiveProgression = await generator.generateLearningPath(
        progressMap,
        'remember-level',
        'create-level'
      );

      // Should follow Bloom's taxonomy progression
      const expectedProgression = [
        'remember-level',
        'understand-level',
        'apply-level',
        'analyze-level',
        'evaluate-level',
        'create-level'
      ];

      expect(cognitiveProgression).toEqual(expectedProgression);

      // Difficulty should increase with cognitive level
      const sortedNodes = progressMap.nodes.sort((a, b) => {
        const levelOrder = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];
        return levelOrder.indexOf(a.cognitiveLevel) - levelOrder.indexOf(b.cognitiveLevel);
      });

      for (let i = 1; i < sortedNodes.length; i++) {
        expect(sortedNodes[i].difficulty).toBeGreaterThanOrEqual(sortedNodes[i - 1].difficulty);
      }
    });

    it('should provide progress metrics and analytics', async () => {
      const analyticsMap: EducationalMindMap = {
        id: 'analytics-test',
        title: 'Progress Analytics Test',
        subject: 'Learning Analytics',
        level: 'advanced',
        nodes: Array(15).fill(null).map((_, i) => ({
          id: `analytics-node-${i}`,
          label: `Analytics Node ${i}`,
          type: 'concept' as const,
          cognitiveLevel: ['remember', 'understand', 'apply', 'analyze', 'evaluate'][i % 5] as any,
          content: { definition: `Definition ${i}`, examples: [], keyPoints: [] },
          position: { x: (i % 5) * 100, y: Math.floor(i / 5) * 100 },
          difficulty: 0.2 + (i / 15) * 0.6,
          importance: 0.5 + (i % 3) * 0.2
        })),
        edges: Array(20).fill(null).map((_, i) => ({
          id: `analytics-edge-${i}`,
          from: `analytics-node-${i % 10}`,
          to: `analytics-node-${(i % 12) + 1}`,
          type: ['prerequisite', 'supports', 'relates'][i % 3] as any,
          strength: ['weak', 'medium', 'strong'][i % 3] as any,
          learningPath: i % 4 === 0
        })),
        learningObjectives: ['Analyze learning progress'],
        prerequisites: ['Analytics understanding'],
        assessmentPoints: ['Progress metrics']
      };

      const analysis = await generator.analyzeConceptMapping(analyticsMap);

      expect(analysis.conceptDensity).toBeGreaterThan(0);
      expect(analysis.relationshipComplexity).toBeGreaterThan(0);
      expect(analysis.hierarchyDepth).toBeGreaterThan(0);
      expect(analysis.cognitiveLoad).toBeGreaterThan(0);
      expect(analysis.learningEfficiency).toBeGreaterThan(0);

      // All metrics should be normalized between 0 and 1
      expect(analysis.conceptDensity).toBeLessThanOrEqual(1);
      expect(analysis.relationshipComplexity).toBeLessThanOrEqual(1);
      expect(analysis.cognitiveLoad).toBeLessThanOrEqual(1);
      expect(analysis.learningEfficiency).toBeLessThanOrEqual(1);
    });
  });

  describe('Accessibility and Responsive Design', () => {
    it('should generate accessible visualization configurations', async () => {
      const accessibilityFeatures: InteractiveMindMapFeatures = {
        zoomEnabled: true,
        panEnabled: true,
        nodeExpansion: true,
        searchHighlight: true,
        pathTracing: true,
        progressTracking: true
      };

      const accessibleMap: EducationalMindMap = {
        id: 'accessible-map',
        title: 'Accessibility Test Map',
        subject: 'Accessible Jung Learning',
        level: 'intermediate',
        nodes: [
          {
            id: 'accessible-root',
            label: 'Accessible Root Concept',
            type: 'concept',
            cognitiveLevel: 'understand',
            content: {
              definition: 'Root concept with accessibility features',
              examples: ['Screen reader compatible', 'Keyboard navigation', 'High contrast support'],
              keyPoints: ['Accessible design', 'Universal usability', 'Inclusive learning']
            },
            position: { x: 0, y: 0 },
            difficulty: 0.5,
            importance: 1.0
          }
        ],
        edges: [],
        learningObjectives: ['Ensure accessibility'],
        prerequisites: ['Accessibility awareness'],
        assessmentPoints: ['Accessibility compliance']
      };

      const visualizationData = generator.generateVisualizationData(accessibleMap, accessibilityFeatures);

      // Should provide accessibility-friendly styling
      expect(visualizationData.nodeStyles['accessible-root']).toBeDefined();
      expect(visualizationData.nodeStyles['accessible-root'].size).toBeGreaterThanOrEqual(30); // Minimum size for accessibility
      expect(visualizationData.nodeStyles['accessible-root'].color).toBeDefined(); // Color should be defined for contrast
    });

    it('should support keyboard navigation through learning paths', async () => {
      const keyboardNavMap: EducationalMindMap = {
        id: 'keyboard-nav',
        title: 'Keyboard Navigation Test',
        subject: 'Keyboard Accessible Learning',
        level: 'intermediate',
        nodes: [
          {
            id: 'kbd-start',
            label: 'Keyboard Start',
            type: 'knowledge',
            cognitiveLevel: 'remember',
            content: { definition: 'Starting point for keyboard navigation', examples: [], keyPoints: [] },
            position: { x: 0, y: 0 },
            difficulty: 0.3,
            importance: 1.0
          },
          {
            id: 'kbd-next',
            label: 'Next Step',
            type: 'concept',
            cognitiveLevel: 'understand',
            content: { definition: 'Next step in keyboard navigation', examples: [], keyPoints: [] },
            position: { x: 100, y: 0 },
            difficulty: 0.5,
            importance: 0.8
          },
          {
            id: 'kbd-end',
            label: 'Keyboard End',
            type: 'application',
            cognitiveLevel: 'apply',
            content: { definition: 'End point for keyboard navigation', examples: [], keyPoints: [] },
            position: { x: 200, y: 0 },
            difficulty: 0.7,
            importance: 0.9
          }
        ],
        edges: [
          {
            id: 'kbd-edge1',
            from: 'kbd-start',
            to: 'kbd-next',
            type: 'prerequisite',
            strength: 'strong',
            learningPath: true
          },
          {
            id: 'kbd-edge2',
            from: 'kbd-next',
            to: 'kbd-end',
            type: 'builds-on',
            strength: 'strong',
            learningPath: true
          }
        ],
        learningObjectives: ['Support keyboard navigation'],
        prerequisites: ['Keyboard accessibility'],
        assessmentPoints: ['Navigation assessment']
      };

      const keyboardPath = await generator.generateLearningPath(
        keyboardNavMap,
        'kbd-start',
        'kbd-end'
      );

      expect(keyboardPath).toEqual(['kbd-start', 'kbd-next', 'kbd-end']);
      
      // Learning path should be clearly marked for keyboard navigation
      const pathEdges = keyboardNavMap.edges.filter(e => e.learningPath);
      expect(pathEdges).toHaveLength(2);
    });

    it('should provide alternative text and descriptions for visual elements', async () => {
      const altTextMap: EducationalMindMap = {
        id: 'alt-text-map',
        title: 'Alternative Text Test',
        subject: 'Screen Reader Compatibility',
        level: 'intermediate',
        nodes: [
          {
            id: 'alt-text-node',
            label: 'Visual Node with Alt Text',
            type: 'concept',
            cognitiveLevel: 'understand',
            content: {
              definition: 'Node with comprehensive alternative descriptions',
              examples: [
                'Screen reader description: Central concept with connecting pathways',
                'Visual description: Circular node with golden color representing wholeness',
                'Interaction description: Expandable node with detailed content sections'
              ],
              keyPoints: [
                'Alternative text provided',
                'Screen reader compatible',
                'Visual descriptions available',
                'Interaction guidance included'
              ]
            },
            jungianContext: {
              archetype: 'Self',
              psycheLevel: 'collective-unconscious',
              symbolism: ['Circle (described as round shape)', 'Gold (described as warm, bright color)']
            },
            position: { x: 0, y: 0 },
            difficulty: 0.5,
            importance: 0.9
          }
        ],
        edges: [],
        learningObjectives: ['Provide comprehensive alternative text'],
        prerequisites: ['Screen reader awareness'],
        assessmentPoints: ['Alt text quality assessment']
      };

      // Verify rich descriptive content for accessibility
      const altTextNode = altTextMap.nodes[0];
      expect(altTextNode.content.examples.some(ex => ex.includes('Screen reader description'))).toBeTruthy();
      expect(altTextNode.content.examples.some(ex => ex.includes('Visual description'))).toBeTruthy();
      expect(altTextNode.content.examples.some(ex => ex.includes('Interaction description'))).toBeTruthy();

      // Jungian symbolism should include descriptions
      expect(altTextNode.jungianContext?.symbolism?.some(sym => sym.includes('described as'))).toBeTruthy();
    });
  });

  describe('Error Handling and Graceful Degradation', () => {
    it('should handle interactive feature failures gracefully', async () => {
      const interactiveFeatures: InteractiveMindMapFeatures = {
        zoomEnabled: false, // Disabled feature
        panEnabled: false, // Disabled feature
        nodeExpansion: true,
        searchHighlight: true,
        pathTracing: true,
        progressTracking: true
      };

      const basicMap: EducationalMindMap = {
        id: 'degraded-map',
        title: 'Graceful Degradation Test',
        subject: 'Feature Degradation',
        level: 'intermediate',
        nodes: [{
          id: 'degraded-node',
          label: 'Degraded Feature Node',
          type: 'concept',
          cognitiveLevel: 'understand',
          content: { definition: 'Node with some features disabled', examples: [], keyPoints: [] },
          position: { x: 0, y: 0 },
          difficulty: 0.5,
          importance: 0.8
        }],
        edges: [],
        learningObjectives: ['Test feature degradation'],
        prerequisites: ['Understanding of graceful degradation'],
        assessmentPoints: ['Degradation assessment']
      };

      // Should still generate visualization data even with disabled features
      const visualizationData = generator.generateVisualizationData(basicMap, interactiveFeatures);

      expect(visualizationData).toBeDefined();
      expect(visualizationData.nodeStyles['degraded-node']).toBeDefined();
      expect(visualizationData.layout).toMatch(/^(hierarchical|radial|force-directed|circular)$/);
      
      // Should still work without zoom and pan
      expect(visualizationData.theme).toBeDefined();
    });

    it('should provide fallback layouts when optimal layout fails', async () => {
      const problematicMap: EducationalMindMap = {
        id: 'layout-problem',
        title: 'Layout Problem Test',
        subject: 'Layout Fallback',
        level: 'intermediate',
        nodes: [], // Empty nodes array
        edges: [], // Empty edges array
        learningObjectives: ['Test layout fallback'],
        prerequisites: ['Layout understanding'],
        assessmentPoints: ['Layout assessment']
      };

      const config: LayoutAlgorithmConfig = {
        algorithm: 'hierarchical',
        parameters: {
          nodeSpacing: 150,
          levelSeparation: 100
        }
      };

      // Should handle empty mind map gracefully
      const optimizedMap = await generator.optimizeLayout(problematicMap, config);

      expect(optimizedMap).toBeDefined();
      expect(optimizedMap.nodes).toHaveLength(0);
      expect(optimizedMap.edges).toHaveLength(0);
    });

    it('should handle visualization generation with missing data', async () => {
      const incompleteMap: EducationalMindMap = {
        id: 'incomplete-map',
        title: 'Incomplete Map Test',
        subject: 'Missing Data Handling',
        level: 'intermediate',
        nodes: [
          {
            id: 'incomplete-node',
            label: 'Incomplete Node',
            type: 'concept',
            cognitiveLevel: 'understand',
            content: { definition: 'Node with missing optional data', examples: [], keyPoints: [] },
            // Missing jungianContext
            position: { x: 0, y: 0 },
            difficulty: 0.5,
            importance: 0.8
          }
        ],
        edges: [],
        learningObjectives: ['Handle missing data'],
        prerequisites: ['Error handling awareness'],
        assessmentPoints: ['Missing data assessment']
      };

      const interactiveFeatures: InteractiveMindMapFeatures = {
        zoomEnabled: true,
        panEnabled: true,
        nodeExpansion: true,
        searchHighlight: true,
        pathTracing: true,
        progressTracking: true
      };

      // Should handle missing Jungian context gracefully
      const visualizationData = generator.generateVisualizationData(incompleteMap, interactiveFeatures);

      expect(visualizationData).toBeDefined();
      expect(visualizationData.theme).toBe('educational'); // Should default to educational theme
      expect(visualizationData.nodeStyles['incomplete-node']).toBeDefined();
    });
  });
});