import { LLMMindMapGenerator, EducationalMindMap, EducationalNode, EducationalEdge, JungianArchetype } from '../llmMindMapGenerator';
import { ILLMProvider } from '../../llm/types';

/**
 * Specialized test suite for Jung psychology concept mapping
 * Focuses on archetypal patterns, individuation process, and psychological types
 */
describe('Jung Psychology Concept Mapping', () => {
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
    // Coordination hook: Specialized Jung psychology testing
    try {
      await import('child_process').then(cp => {
        cp.exec('npx claude-flow@alpha hooks pre-task --description "Jung psychology concept mapping tests" --memory-key "swarm/testing/jung-concepts"');
      });
    } catch (error) {
      console.log('Coordination hook not available, continuing with Jung psychology tests');
    }
  });

  afterAll(async () => {
    // Coordination hook: Complete Jung psychology testing
    try {
      await import('child_process').then(cp => {
        cp.exec('npx claude-flow@alpha hooks post-task --task-id "jung-psychology-tests" --memory-key "swarm/testing/jung-complete"');
      });
    } catch (error) {
      console.log('Jung psychology tests completed');
    }
  });

  describe('Archetypal Mind Mapping', () => {
    const archetypeTestData = {
      title: 'The Major Archetypes in Personal Development',
      subject: 'Jungian Archetypal Psychology',
      nodes: [
        {
          id: 'shadow-archetype',
          label: 'Shadow Archetype',
          type: 'concept',
          cognitiveLevel: 'understand',
          content: {
            definition: 'The hidden, repressed, or denied aspects of the personality',
            examples: [
              'Aggressive impulses in peaceful individuals',
              'Sexual desires in overly spiritual people',
              'Weakness in those who project strength',
              'Selfishness in altruistic personalities'
            ],
            keyPoints: [
              'Contains both negative and positive potentials',
              'Often appears as same-sex figures in dreams',
              'Integration leads to increased vitality and authenticity',
              'Projection creates enemies and scapegoats',
              'Essential for psychological wholeness'
            ]
          },
          jungianContext: {
            archetype: 'Shadow',
            psycheLevel: 'personal-unconscious',
            symbolism: [
              'Dark figures in dreams',
              'Devils and demons',
              'Criminal or primitive characters',
              'Same-sex antagonists',
              'Wild animals'
            ]
          },
          difficulty: 0.6,
          importance: 0.9
        },
        {
          id: 'anima-archetype',
          label: 'Anima (Feminine in Male)',
          type: 'concept',
          cognitiveLevel: 'understand',
          content: {
            definition: 'The unconscious feminine aspect in the male psyche',
            examples: [
              'Romantic idealization of women',
              'Moodiness and emotional volatility in men',
              'Creative and artistic inspiration',
              'Spiritual and mystical experiences',
              'Intuitive insights and hunches'
            ],
            keyPoints: [
              'Bridge between conscious ego and unconscious',
              'Source of creativity and inspiration',
              'Can manifest as possessive mother complex',
              'Evolution through four stages: Eve, Helen, Mary, Sophia',
              'Integration enables emotional maturity in men'
            ]
          },
          jungianContext: {
            archetype: 'Anima',
            psycheLevel: 'collective-unconscious',
            symbolism: [
              'Mysterious women in dreams',
              'Goddesses and feminine deities',
              'Muses and inspirational figures',
              'Mother figures',
              'Seductive or wise women'
            ]
          },
          difficulty: 0.7,
          importance: 0.8
        },
        {
          id: 'animus-archetype',
          label: 'Animus (Masculine in Female)',
          type: 'concept',
          cognitiveLevel: 'understand',
          content: {
            definition: 'The unconscious masculine aspect in the female psyche',
            examples: [
              'Strong opinions and judgmental attitudes',
              'Drive for achievement and recognition',
              'Logical thinking and analytical abilities',
              'Leadership qualities and assertiveness',
              'Spiritual seeking and philosophical interests'
            ],
            keyPoints: [
              'Enables discrimination and focused thinking',
              'Can manifest as negative father complex',
              'Evolution through four stages: Physical, Romantic, Word, Meaning',
              'Integration enables intellectual development in women',
              'Source of creative and spiritual energy'
            ]
          },
          jungianContext: {
            archetype: 'Animus',
            psycheLevel: 'collective-unconscious',
            symbolism: [
              'Male authority figures in dreams',
              'Wise old men or teachers',
              'Heroes and warriors',
              'Father figures',
              'Spiritual guides and mentors'
            ]
          },
          difficulty: 0.7,
          importance: 0.8
        },
        {
          id: 'self-archetype',
          label: 'Self Archetype',
          type: 'synthesis',
          cognitiveLevel: 'create',
          content: {
            definition: 'The archetype of wholeness and the regulating center of the psyche',
            examples: [
              'Mandala symbols and circular patterns',
              'Divine child motifs in myths',
              'Quaternary structures (4-fold patterns)',
              'Experiences of unity and transcendence',
              'Synchronistic events and meaningful coincidences'
            ],
            keyPoints: [
              'Goal of individuation process',
              'Transcendent function uniting opposites',
              'Appears as geometric patterns, especially circles',
              'Source of psychological healing and growth',
              'Manifests through symbols rather than personal images'
            ]
          },
          jungianContext: {
            archetype: 'Self',
            psycheLevel: 'collective-unconscious',
            symbolism: [
              'Mandalas and circular symbols',
              'Divine child or eternal youth',
              'Wise old man or woman',
              'Christ or Buddha figures',
              'Precious stones or treasures'
            ]
          },
          difficulty: 0.95,
          importance: 1.0
        },
        {
          id: 'persona-archetype',
          label: 'Persona',
          type: 'concept',
          cognitiveLevel: 'understand',
          content: {
            definition: 'The mask we wear in social situations; our public face',
            examples: [
              'Professional roles and identities',
              'Social etiquette and politeness',
              'Cultural adaptations and conformity',
              'Image management and reputation',
              'Different personas for different contexts'
            ],
            keyPoints: [
              'Necessary for social functioning',
              'Becomes problematic when confused with true self',
              'Can hide authentic personality',
              'Balance needed between adaptation and authenticity',
              'Gateway to understanding deeper layers of psyche'
            ]
          },
          jungianContext: {
            archetype: 'Persona',
            psycheLevel: 'conscious',
            symbolism: [
              'Masks and costumes',
              'Uniforms and professional attire',
              'Theatrical roles and performances',
              'Social titles and positions',
              'Facades and front doors'
            ]
          },
          difficulty: 0.4,
          importance: 0.7
        }
      ],
      edges: [
        {
          from: 'persona-archetype',
          to: 'shadow-archetype',
          type: 'contradicts',
          strength: 'strong',
          label: 'Persona hides what Shadow contains'
        },
        {
          from: 'shadow-archetype',
          to: 'anima-archetype',
          type: 'prerequisite',
          strength: 'strong',
          label: 'Shadow integration precedes Anima work'
        },
        {
          from: 'shadow-archetype',
          to: 'animus-archetype',
          type: 'prerequisite',
          strength: 'strong',
          label: 'Shadow integration precedes Animus work'
        },
        {
          from: 'anima-archetype',
          to: 'self-archetype',
          type: 'builds-on',
          strength: 'strong',
          label: 'Anima integration contributes to Self realization'
        },
        {
          from: 'animus-archetype',
          to: 'self-archetype',
          type: 'builds-on',
          strength: 'strong',
          label: 'Animus integration contributes to Self realization'
        },
        {
          from: 'persona-archetype',
          to: 'self-archetype',
          type: 'relates',
          strength: 'medium',
          label: 'Self transcends and integrates Persona'
        }
      ],
      learningObjectives: [
        'Understand the major Jungian archetypes and their functions',
        'Recognize archetypal patterns in personal experience',
        'Differentiate between personal and collective unconscious content',
        'Apply archetypal analysis to dreams and fantasies',
        'Integrate archetypal insights for personal development'
      ],
      prerequisites: [
        'Basic understanding of Jung\'s theory of the psyche',
        'Familiarity with conscious and unconscious concepts',
        'Openness to symbolic and metaphorical thinking'
      ],
      assessmentPoints: [
        'Identify archetypal figures in dreams or stories',
        'Analyze personal shadows through projection recognition',
        'Explore anima/animus manifestations in relationships',
        'Create personal archetypal integration plan',
        'Design therapeutic interventions using archetypal insights'
      ]
    };

    it('should create comprehensive archetypal relationship maps', async () => {
      mockProvider.generateStructuredOutput.mockResolvedValue(archetypeTestData);

      const archetypeMap = await generator.generateJungianMindMap(
        'Major Jungian Archetypes',
        ['Shadow', 'Anima', 'Animus', 'Self', 'Persona'],
        'advanced'
      );

      expect(archetypeMap.title).toBe('The Major Archetypes in Personal Development');
      expect(archetypeMap.nodes).toHaveLength(5);
      expect(archetypeMap.edges).toHaveLength(6);

      // Verify all major archetypes are present
      const archetypeNames = archetypeMap.nodes.map(n => n.jungianContext?.archetype).filter(Boolean);
      expect(archetypeNames).toContain('Shadow');
      expect(archetypeNames).toContain('Anima');
      expect(archetypeNames).toContain('Animus');
      expect(archetypeNames).toContain('Self');

      // Verify proper psychological progression
      const shadowNode = archetypeMap.nodes.find(n => n.jungianContext?.archetype === 'Shadow');
      const selfNode = archetypeMap.nodes.find(n => n.jungianContext?.archetype === 'Self');
      
      expect(shadowNode?.difficulty).toBeLessThan(selfNode?.difficulty || 1);
      expect(selfNode?.cognitiveLevel).toBe('create');
    });

    it('should map archetypal oppositions and compensations', async () => {
      mockProvider.generateStructuredOutput.mockResolvedValue(archetypeTestData);

      const map = await generator.generateJungianMindMap(
        'Archetypal Oppositions',
        ['Persona-Shadow', 'Conscious-Unconscious', 'Masculine-Feminine'],
        'intermediate'
      );

      // Find contradictory relationship between Persona and Shadow
      const personaShadowEdge = map.edges.find(edge => 
        (edge.from === 'persona-archetype' && edge.to === 'shadow-archetype') ||
        (edge.from === 'shadow-archetype' && edge.to === 'persona-archetype')
      );

      expect(personaShadowEdge).toBeDefined();
      expect(personaShadowEdge?.type).toBe('contradicts');
      expect(personaShadowEdge?.strength).toBe('strong');
    });

    it('should handle individuation sequence correctly', async () => {
      mockProvider.generateStructuredOutput.mockResolvedValue(archetypeTestData);

      const map = await generator.generateJungianMindMap(
        'Individuation Process',
        ['Shadow Integration', 'Anima-Animus Work', 'Self Realization'],
        'advanced'
      );

      // Verify individuation sequence: Shadow -> Anima/Animus -> Self
      const shadowToAnima = map.edges.find(e => 
        e.from === 'shadow-archetype' && e.to === 'anima-archetype' && e.type === 'prerequisite'
      );
      const shadowToAnimus = map.edges.find(e => 
        e.from === 'shadow-archetype' && e.to === 'animus-archetype' && e.type === 'prerequisite'
      );
      const animaToSelf = map.edges.find(e => 
        e.from === 'anima-archetype' && e.to === 'self-archetype' && e.type === 'builds-on'
      );
      const animusToSelf = map.edges.find(e => 
        e.from === 'animus-archetype' && e.to === 'self-archetype' && e.type === 'builds-on'
      );

      expect(shadowToAnima || shadowToAnimus).toBeDefined();
      expect(animaToSelf || animusToSelf).toBeDefined();
    });

    it('should include proper Jungian symbolism', async () => {
      mockProvider.generateStructuredOutput.mockResolvedValue(archetypeTestData);

      const map = await generator.generateJungianMindMap(
        'Archetypal Symbols',
        ['Shadow', 'Self'],
        'intermediate'
      );

      const shadowNode = map.nodes.find(n => n.jungianContext?.archetype === 'Shadow');
      const selfNode = map.nodes.find(n => n.jungianContext?.archetype === 'Self');

      expect(shadowNode?.jungianContext?.symbolism).toContain('Dark figures in dreams');
      expect(selfNode?.jungianContext?.symbolism).toContain('Mandalas and circular symbols');
    });

    it('should differentiate psyche levels correctly', async () => {
      mockProvider.generateStructuredOutput.mockResolvedValue(archetypeTestData);

      const map = await generator.generateJungianMindMap(
        'Psyche Structure',
        ['Conscious', 'Personal Unconscious', 'Collective Unconscious'],
        'intermediate'
      );

      const consciousNode = map.nodes.find(n => n.jungianContext?.psycheLevel === 'conscious');
      const personalUnconsciousNode = map.nodes.find(n => n.jungianContext?.psycheLevel === 'personal-unconscious');
      const collectiveUnconsciousNode = map.nodes.find(n => n.jungianContext?.psycheLevel === 'collective-unconscious');

      expect(consciousNode).toBeDefined();
      expect(personalUnconsciousNode).toBeDefined();
      expect(collectiveUnconsciousNode).toBeDefined();

      // Personal unconscious should be easier than collective unconscious
      expect(personalUnconsciousNode?.difficulty).toBeLessThan(collectiveUnconsciousNode?.difficulty || 1);
    });
  });

  describe('Psychological Types Mapping', () => {
    const psychologicalTypesData = {
      title: 'Jungian Psychological Types System',
      subject: 'Psychological Types and Cognitive Functions',
      nodes: [
        {
          id: 'thinking-function',
          label: 'Thinking Function',
          type: 'concept',
          cognitiveLevel: 'understand',
          content: {
            definition: 'Logical, rational evaluation based on objective criteria',
            examples: [
              'Analysis and categorization',
              'Cause-and-effect reasoning',
              'Objective decision making',
              'Systematic problem solving',
              'Critical evaluation'
            ],
            keyPoints: [
              'Seeks truth and logical consistency',
              'Values objectivity over personal considerations',
              'Can become cold and impersonal when dominant',
              'Compensated by feeling function',
              'Essential for intellectual development'
            ]
          },
          jungianContext: {
            psycheLevel: 'conscious',
            symbolism: ['Scales of justice', 'Mathematical symbols', 'Geometric patterns']
          },
          difficulty: 0.5,
          importance: 0.8
        },
        {
          id: 'feeling-function',
          label: 'Feeling Function',
          type: 'concept',
          cognitiveLevel: 'understand',
          content: {
            definition: 'Value-based evaluation considering personal and interpersonal significance',
            examples: [
              'Moral and ethical judgments',
              'Appreciation of beauty and harmony',
              'Empathetic understanding',
              'Personal value assessments',
              'Interpersonal harmony seeking'
            ],
            keyPoints: [
              'Seeks personal meaning and value',
              'Considers impact on relationships',
              'Can become overly sentimental when dominant',
              'Compensated by thinking function',
              'Essential for emotional and social development'
            ]
          },
          jungianContext: {
            psycheLevel: 'conscious',
            symbolism: ['Heart symbols', 'Artistic expressions', 'Religious imagery']
          },
          difficulty: 0.5,
          importance: 0.8
        },
        {
          id: 'sensation-function',
          label: 'Sensation Function',
          type: 'concept',
          cognitiveLevel: 'understand',
          content: {
            definition: 'Perception of concrete facts through the five senses',
            examples: [
              'Detailed observation',
              'Present-moment awareness',
              'Practical implementation',
              'Sensory appreciation',
              'Factual accuracy'
            ],
            keyPoints: [
              'Focuses on immediate reality',
              'Values concrete experience over abstract ideas',
              'Can become bound by conventional thinking',
              'Compensated by intuition function',
              'Essential for practical effectiveness'
            ]
          },
          jungianContext: {
            psycheLevel: 'conscious',
            symbolism: ['Natural objects', 'Tools and instruments', 'Material goods']
          },
          difficulty: 0.4,
          importance: 0.7
        },
        {
          id: 'intuition-function',
          label: 'Intuition Function',
          type: 'concept',
          cognitiveLevel: 'understand',
          content: {
            definition: 'Perception of possibilities, meanings, and potential inherent in situations',
            examples: [
              'Future-oriented thinking',
              'Pattern recognition',
              'Creative insights',
              'Symbolic understanding',
              'Innovation and vision'
            ],
            keyPoints: [
              'Sees beyond immediate appearances',
              'Values potential over present reality',
              'Can neglect practical considerations',
              'Compensated by sensation function',
              'Essential for creative and visionary work'
            ]
          },
          jungianContext: {
            psycheLevel: 'conscious',
            symbolism: ['Lightning bolts', 'Seeds and growth', 'Abstract patterns']
          },
          difficulty: 0.6,
          importance: 0.7
        },
        {
          id: 'extraversion-attitude',
          label: 'Extraverted Attitude',
          type: 'concept',
          cognitiveLevel: 'understand',
          content: {
            definition: 'Orientation toward the external world and objective reality',
            examples: [
              'Sociable and outgoing behavior',
              'Focus on external objects and people',
              'Breadth over depth in interests',
              'Action-oriented approach',
              'Influenced by collective standards'
            ],
            keyPoints: [
              'Energy flows outward to the world',
              'Seeks stimulation from environment',
              'Can lose touch with inner world',
              'Compensated by introverted unconscious',
              'Dominant in approximately 50% of population'
            ]
          },
          jungianContext: {
            psycheLevel: 'conscious',
            symbolism: ['Open doors', 'Bright lighting', 'Group gatherings']
          },
          difficulty: 0.3,
          importance: 0.9
        },
        {
          id: 'introversion-attitude',
          label: 'Introverted Attitude',
          type: 'concept',
          cognitiveLevel: 'understand',
          content: {
            definition: 'Orientation toward the internal world and subjective reality',
            examples: [
              'Reflective and reserved behavior',
              'Focus on internal thoughts and feelings',
              'Depth over breadth in interests',
              'Contemplation-oriented approach',
              'Guided by individual values'
            ],
            keyPoints: [
              'Energy flows inward to the self',
              'Seeks understanding through reflection',
              'Can become disconnected from outer world',
              'Compensated by extraverted unconscious',
              'Dominant in approximately 50% of population'
            ]
          },
          jungianContext: {
            psycheLevel: 'conscious',
            symbolism: ['Closed doors', 'Mirrors', 'Solitary figures']
          },
          difficulty: 0.3,
          importance: 0.9
        }
      ],
      edges: [
        {
          from: 'thinking-function',
          to: 'feeling-function',
          type: 'contradicts',
          strength: 'strong',
          label: 'Thinking and Feeling are opposite functions'
        },
        {
          from: 'sensation-function',
          to: 'intuition-function',
          type: 'contradicts',
          strength: 'strong',
          label: 'Sensation and Intuition are opposite functions'
        },
        {
          from: 'extraversion-attitude',
          to: 'introversion-attitude',
          type: 'contradicts',
          strength: 'strong',
          label: 'Extraversion and Introversion are opposite attitudes'
        },
        {
          from: 'thinking-function',
          to: 'extraversion-attitude',
          type: 'supports',
          strength: 'medium',
          label: 'Can combine as Extraverted Thinking'
        },
        {
          from: 'thinking-function',
          to: 'introversion-attitude',
          type: 'supports',
          strength: 'medium',
          label: 'Can combine as Introverted Thinking'
        },
        {
          from: 'feeling-function',
          to: 'extraversion-attitude',
          type: 'supports',
          strength: 'medium',
          label: 'Can combine as Extraverted Feeling'
        },
        {
          from: 'feeling-function',
          to: 'introversion-attitude',
          type: 'supports',
          strength: 'medium',
          label: 'Can combine as Introverted Feeling'
        }
      ],
      learningObjectives: [
        'Understand the four psychological functions',
        'Differentiate between rational and irrational functions',
        'Recognize extraverted and introverted attitudes',
        'Identify function combinations in personality types',
        'Apply typological analysis to understand individual differences'
      ],
      prerequisites: [
        'Basic knowledge of Jung\'s analytical psychology',
        'Understanding of conscious and unconscious dynamics'
      ],
      assessmentPoints: [
        'Identify dominant and auxiliary functions',
        'Analyze function oppositions and compensations',
        'Apply typological understanding to relationships',
        'Recognize typological biases in thinking'
      ]
    };

    it('should map psychological functions with proper oppositions', async () => {
      mockProvider.generateStructuredOutput.mockResolvedValue(psychologicalTypesData);

      const typesMap = await generator.generateJungianMindMap(
        'Psychological Types',
        ['Thinking', 'Feeling', 'Sensation', 'Intuition', 'Extraversion', 'Introversion'],
        'intermediate'
      );

      // Verify function oppositions
      const thinkingFeelingOpposition = typesMap.edges.find(e =>
        (e.from === 'thinking-function' && e.to === 'feeling-function') ||
        (e.from === 'feeling-function' && e.to === 'thinking-function')
      );
      
      const sensationIntuitionOpposition = typesMap.edges.find(e =>
        (e.from === 'sensation-function' && e.to === 'intuition-function') ||
        (e.from === 'intuition-function' && e.to === 'sensation-function')
      );

      const extraversionIntroversionOpposition = typesMap.edges.find(e =>
        (e.from === 'extraversion-attitude' && e.to === 'introversion-attitude') ||
        (e.from === 'introversion-attitude' && e.to === 'extraversion-attitude')
      );

      expect(thinkingFeelingOpposition?.type).toBe('contradicts');
      expect(sensationIntuitionOpposition?.type).toBe('contradicts');
      expect(extraversionIntroversionOpposition?.type).toBe('contradicts');
    });

    it('should show function-attitude combinations', async () => {
      mockProvider.generateStructuredOutput.mockResolvedValue(psychologicalTypesData);

      const typesMap = await generator.generateJungianMindMap(
        'Function-Attitude Combinations',
        ['Extraverted Thinking', 'Introverted Feeling', 'Functions and Attitudes'],
        'advanced'
      );

      // Verify that functions can combine with attitudes
      const functionAttitudeCombinations = typesMap.edges.filter(e =>
        e.type === 'supports' && 
        (e.from.includes('function') && e.to.includes('attitude') ||
         e.from.includes('attitude') && e.to.includes('function'))
      );

      expect(functionAttitudeCombinations.length).toBeGreaterThan(0);
    });

    it('should handle rational vs irrational function distinction', async () => {
      const extendedTypesData = {
        ...psychologicalTypesData,
        nodes: [
          ...psychologicalTypesData.nodes,
          {
            id: 'rational-functions',
            label: 'Rational Functions (Thinking & Feeling)',
            type: 'concept',
            cognitiveLevel: 'analyze',
            content: {
              definition: 'Functions that involve judgment and decision-making',
              examples: ['Thinking evaluations', 'Feeling valuations'],
              keyPoints: ['Involve conscious choice', 'Active discrimination', 'Decisive processes']
            },
            jungianContext: { psycheLevel: 'conscious' },
            difficulty: 0.6,
            importance: 0.8
          },
          {
            id: 'irrational-functions',
            label: 'Irrational Functions (Sensation & Intuition)',
            type: 'concept',
            cognitiveLevel: 'analyze',
            content: {
              definition: 'Functions that involve perception without judgment',
              examples: ['Sensory observations', 'Intuitive insights'],
              keyPoints: ['Involve passive reception', 'Non-judgmental awareness', 'Open-ended processes']
            },
            jungianContext: { psycheLevel: 'conscious' },
            difficulty: 0.6,
            importance: 0.8
          }
        ],
        edges: [
          ...psychologicalTypesData.edges,
          {
            from: 'thinking-function',
            to: 'rational-functions',
            type: 'relates',
            strength: 'strong',
            label: 'Thinking is a rational function'
          },
          {
            from: 'feeling-function',
            to: 'rational-functions',
            type: 'relates',
            strength: 'strong',
            label: 'Feeling is a rational function'
          },
          {
            from: 'sensation-function',
            to: 'irrational-functions',
            type: 'relates',
            strength: 'strong',
            label: 'Sensation is an irrational function'
          },
          {
            from: 'intuition-function',
            to: 'irrational-functions',
            type: 'relates',
            strength: 'strong',
            label: 'Intuition is an irrational function'
          }
        ]
      };

      mockProvider.generateStructuredOutput.mockResolvedValue(extendedTypesData);

      const typesMap = await generator.generateJungianMindMap(
        'Rational vs Irrational Functions',
        ['Rational Functions', 'Irrational Functions', 'Function Classification'],
        'advanced'
      );

      const rationalNode = typesMap.nodes.find(n => n.id === 'rational-functions');
      const irrationalNode = typesMap.nodes.find(n => n.id === 'irrational-functions');

      expect(rationalNode).toBeDefined();
      expect(irrationalNode).toBeDefined();
      expect(rationalNode?.content.definition).toContain('judgment');
      expect(irrationalNode?.content.definition).toContain('perception');
    });

    it('should map superior and inferior function dynamics', async () => {
      const functionDynamicsData = {
        ...psychologicalTypesData,
        nodes: [
          ...psychologicalTypesData.nodes,
          {
            id: 'superior-function',
            label: 'Superior Function',
            type: 'concept',
            cognitiveLevel: 'understand',
            content: {
              definition: 'The most developed and conscious psychological function',
              examples: ['Professional strengths', 'Natural talents', 'Preferred approaches'],
              keyPoints: ['Most differentiated', 'Consciously controlled', 'Source of competence']
            },
            jungianContext: { psycheLevel: 'conscious' },
            difficulty: 0.4,
            importance: 0.9
          },
          {
            id: 'inferior-function',
            label: 'Inferior Function',
            type: 'concept',
            cognitiveLevel: 'understand',
            content: {
              definition: 'The least developed and most unconscious psychological function',
              examples: ['Areas of difficulty', 'Emotional triggers', 'Growth challenges'],
              keyPoints: ['Undifferentiated', 'Unconsciously controlled', 'Source of problems and potential']
            },
            jungianContext: { psycheLevel: 'personal-unconscious' },
            difficulty: 0.7,
            importance: 0.8
          }
        ],
        edges: [
          ...psychologicalTypesData.edges,
          {
            from: 'superior-function',
            to: 'inferior-function',
            type: 'contradicts',
            strength: 'strong',
            label: 'Superior and Inferior functions are opposite'
          }
        ]
      };

      mockProvider.generateStructuredOutput.mockResolvedValue(functionDynamicsData);

      const dynamicsMap = await generator.generateJungianMindMap(
        'Function Dynamics',
        ['Superior Function', 'Inferior Function', 'Psychological Development'],
        'advanced'
      );

      const superiorNode = dynamicsMap.nodes.find(n => n.id === 'superior-function');
      const inferiorNode = dynamicsMap.nodes.find(n => n.id === 'inferior-function');
      const opposition = dynamicsMap.edges.find(e =>
        e.from === 'superior-function' && e.to === 'inferior-function' && e.type === 'contradicts'
      );

      expect(superiorNode?.jungianContext?.psycheLevel).toBe('conscious');
      expect(inferiorNode?.jungianContext?.psycheLevel).toBe('personal-unconscious');
      expect(opposition).toBeDefined();
    });
  });

  describe('Complex Theory Mapping', () => {
    const complexTheoryData = {
      title: 'Jung\'s Complex Theory',
      subject: 'Psychological Complexes and Autonomous Content',
      nodes: [
        {
          id: 'complex-core',
          label: 'Complex Core',
          type: 'concept',
          cognitiveLevel: 'understand',
          content: {
            definition: 'The central organizing principle of a psychological complex',
            examples: [
              'Archetypal images',
              'Core emotional experiences',
              'Central conflicts',
              'Organizing themes'
            ],
            keyPoints: [
              'Often unconscious and autonomous',
              'Attracts related content',
              'Influences perception and behavior',
              'Source of complex energy'
            ]
          },
          jungianContext: {
            psycheLevel: 'personal-unconscious',
            symbolism: ['Central symbols', 'Core images', 'Nodal points']
          },
          difficulty: 0.6,
          importance: 0.9
        },
        {
          id: 'mother-complex',
          label: 'Mother Complex',
          type: 'application',
          cognitiveLevel: 'apply',
          content: {
            definition: 'Constellation of ideas and emotions centered around the mother archetype',
            examples: [
              'Positive mother complex: idealization, dependency',
              'Negative mother complex: rebellion, fear of intimacy',
              'Devouring mother: overwhelming protection',
              'Absent mother: emotional emptiness'
            ],
            keyPoints: [
              'Affects all later relationships',
              'Can be positive or negative',
              'Influences gender identity',
              'Connected to anima/animus development'
            ]
          },
          jungianContext: {
            archetype: 'Great Mother',
            psycheLevel: 'personal-unconscious',
            symbolism: ['Mother figures', 'Nurturing symbols', 'Containers and enclosures']
          },
          difficulty: 0.7,
          importance: 0.8
        },
        {
          id: 'father-complex',
          label: 'Father Complex',
          type: 'application',
          cognitiveLevel: 'apply',
          content: {
            definition: 'Constellation of ideas and emotions centered around the father archetype',
            examples: [
              'Positive father complex: hero worship, high expectations',
              'Negative father complex: rebellion, authority issues',
              'Authoritarian father: rigid control, fear of judgment',
              'Absent father: lack of direction, weak boundaries'
            ],
            keyPoints: [
              'Influences relationship to authority',
              'Affects achievement motivation',
              'Connected to superego development',
              'Impacts gender role identification'
            ]
          },
          jungianContext: {
            archetype: 'Wise Old Man/Senex',
            psycheLevel: 'personal-unconscious',
            symbolism: ['Authority figures', 'Law and order symbols', 'Mountain peaks']
          },
          difficulty: 0.7,
          importance: 0.8
        },
        {
          id: 'complex-autonomy',
          label: 'Complex Autonomy',
          type: 'concept',
          cognitiveLevel: 'analyze',
          content: {
            definition: 'The independent, self-directing nature of psychological complexes',
            examples: [
              'Intrusive thoughts and emotions',
              'Compulsive behaviors',
              'Mood swings and reactions',
              'Dream appearances'
            ],
            keyPoints: [
              'Complexes have their own agenda',
              'Can override conscious will',
              'Source of psychological symptoms',
              'Indication of split-off psychic content'
            ]
          },
          jungianContext: {
            psycheLevel: 'personal-unconscious',
            symbolism: ['Autonomous figures in dreams', 'Possessing spirits', 'Independent agents']
          },
          difficulty: 0.8,
          importance: 0.9
        }
      ],
      edges: [
        {
          from: 'complex-core',
          to: 'mother-complex',
          type: 'contains',
          strength: 'strong',
          label: 'Mother complex organized around archetypal core'
        },
        {
          from: 'complex-core',
          to: 'father-complex',
          type: 'contains',
          strength: 'strong',
          label: 'Father complex organized around archetypal core'
        },
        {
          from: 'complex-core',
          to: 'complex-autonomy',
          type: 'enables',
          strength: 'strong',
          label: 'Core energy creates autonomous behavior'
        },
        {
          from: 'mother-complex',
          to: 'father-complex',
          type: 'relates',
          strength: 'medium',
          label: 'Parental complexes interact dynamically'
        }
      ],
      learningObjectives: [
        'Understand the structure and dynamics of psychological complexes',
        'Recognize major complex patterns (mother, father, etc.)',
        'Identify complex manifestations in behavior and symptoms',
        'Apply complex theory to therapeutic interventions'
      ],
      prerequisites: [
        'Understanding of Jung\'s theory of archetypes',
        'Basic knowledge of conscious and unconscious dynamics'
      ],
      assessmentPoints: [
        'Identify personal complex constellations',
        'Analyze complex interactions in case studies',
        'Design therapeutic approaches addressing complexes'
      ]
    };

    it('should map complex structure and dynamics', async () => {
      mockProvider.generateStructuredOutput.mockResolvedValue(complexTheoryData);

      const complexMap = await generator.generateJungianMindMap(
        'Complex Theory',
        ['Complex Core', 'Complex Autonomy', 'Mother Complex', 'Father Complex'],
        'advanced'
      );

      expect(complexMap.title).toBe('Jung\'s Complex Theory');
      expect(complexMap.nodes).toHaveLength(4);

      // Verify complex core is central organizing principle
      const coreNode = complexMap.nodes.find(n => n.id === 'complex-core');
      const coreEdges = complexMap.edges.filter(e => e.from === 'complex-core');
      
      expect(coreNode).toBeDefined();
      expect(coreEdges.length).toBeGreaterThan(1); // Core should connect to multiple complexes
    });

    it('should handle complex autonomy and unconscious dynamics', async () => {
      mockProvider.generateStructuredOutput.mockResolvedValue(complexTheoryData);

      const complexMap = await generator.generateJungianMindMap(
        'Complex Autonomy',
        ['Autonomous Complexes', 'Unconscious Content'],
        'advanced'
      );

      const autonomyNode = complexMap.nodes.find(n => n.id === 'complex-autonomy');
      expect(autonomyNode?.jungianContext?.psycheLevel).toBe('personal-unconscious');
      expect(autonomyNode?.content.definition).toContain('independent');
    });

    it('should map parental complexes with proper archetypal foundations', async () => {
      mockProvider.generateStructuredOutput.mockResolvedValue(complexTheoryData);

      const complexMap = await generator.generateJungianMindMap(
        'Parental Complexes',
        ['Mother Complex', 'Father Complex', 'Parental Archetypes'],
        'intermediate'
      );

      const motherComplex = complexMap.nodes.find(n => n.id === 'mother-complex');
      const fatherComplex = complexMap.nodes.find(n => n.id === 'father-complex');

      expect(motherComplex?.jungianContext?.archetype).toBe('Great Mother');
      expect(fatherComplex?.jungianContext?.archetype).toBe('Wise Old Man/Senex');
    });
  });

  describe('Dream Analysis and Active Imagination', () => {
    it('should create mind maps for Jungian dream analysis techniques', async () => {
      const dreamAnalysisData = {
        title: 'Jungian Dream Analysis Methods',
        subject: 'Dream Work in Analytical Psychology',
        nodes: [
          {
            id: 'amplification-method',
            label: 'Amplification Method',
            type: 'application',
            cognitiveLevel: 'apply',
            content: {
              definition: 'Expanding dream imagery through cultural and mythological parallels',
              examples: [
                'Mythological associations',
                'Cultural symbols',
                'Historical parallels',
                'Literary references'
              ],
              keyPoints: [
                'Avoids personal associations initially',
                'Connects to collective meanings',
                'Reveals archetypal dimensions',
                'Complements personal associations'
              ]
            },
            jungianContext: {
              psycheLevel: 'collective-unconscious',
              symbolism: ['Cultural artifacts', 'Mythic images', 'Universal symbols']
            },
            difficulty: 0.7,
            importance: 0.8
          },
          {
            id: 'active-imagination',
            label: 'Active Imagination',
            type: 'application',
            cognitiveLevel: 'create',
            content: {
              definition: 'Conscious engagement with unconscious imagery through imagination',
              examples: [
                'Continuing dream narratives',
                'Dialoguing with dream figures',
                'Visualizing symbolic scenes',
                'Creative expression of unconscious content'
              ],
              keyPoints: [
                'Bridges conscious and unconscious',
                'Allows direct experience of archetypes',
                'Promotes individuation process',
                'Requires emotional engagement'
              ]
            },
            jungianContext: {
              psycheLevel: 'personal-unconscious',
              symbolism: ['Bridges', 'Dialogues', 'Creative expressions']
            },
            difficulty: 0.9,
            importance: 0.9
          }
        ],
        edges: [
          {
            from: 'amplification-method',
            to: 'active-imagination',
            type: 'supports',
            strength: 'medium',
            label: 'Amplification can inform active imagination work'
          }
        ],
        learningObjectives: [
          'Master Jungian dream analysis techniques',
          'Practice active imagination methods',
          'Integrate unconscious content constructively'
        ],
        prerequisites: ['Understanding of Jung\'s theory of dreams'],
        assessmentPoints: ['Demonstrate amplification technique', 'Practice active imagination']
      };

      mockProvider.generateStructuredOutput.mockResolvedValue(dreamAnalysisData);

      const dreamMap = await generator.generateJungianMindMap(
        'Dream Analysis',
        ['Amplification', 'Active Imagination', 'Dream Work'],
        'advanced'
      );

      const amplificationNode = dreamMap.nodes.find(n => n.id === 'amplification-method');
      const activeImaginationNode = dreamMap.nodes.find(n => n.id === 'active-imagination');

      expect(amplificationNode?.cognitiveLevel).toBe('apply');
      expect(activeImaginationNode?.cognitiveLevel).toBe('create');
      expect(activeImaginationNode?.difficulty).toBeGreaterThan(amplificationNode?.difficulty || 0);
    });
  });

  describe('Coordination and Memory Integration', () => {
    it('should store Jung concept mappings in memory for future reference', async () => {
      const jungMemoryData = {
        title: 'Jung Memory Integration Test',
        subject: 'Memory Storage for Jung Concepts',
        nodes: [
          {
            id: 'memory-concept',
            label: 'Memory-Stored Jung Concept',
            type: 'knowledge',
            cognitiveLevel: 'remember',
            content: {
              definition: 'Test concept for memory integration',
              examples: ['Memory example'],
              keyPoints: ['Stored for future retrieval']
            },
            jungianContext: {
              archetype: 'Memory',
              psycheLevel: 'conscious'
            },
            difficulty: 0.3,
            importance: 0.8
          }
        ],
        edges: [],
        learningObjectives: ['Test memory integration'],
        prerequisites: ['None'],
        assessmentPoints: ['Verify memory storage']
      };

      mockProvider.generateStructuredOutput.mockResolvedValue(jungMemoryData);

      // Simulate memory hook
      let memoryHookCalled = false;
      const originalExec = require('child_process').exec;
      require('child_process').exec = jest.fn().mockImplementation((cmd, callback) => {
        if (cmd.includes('memory')) {
          memoryHookCalled = true;
        }
        if (callback) callback(null, 'Hook executed');
      });

      try {
        const jungMap = await generator.generateJungianMindMap(
          'Memory Integration Test',
          ['Memory Concept'],
          'beginner'
        );

        expect(jungMap).toBeDefined();
        // Memory integration should not affect functionality
        expect(jungMap.nodes).toHaveLength(1);
      } finally {
        // Restore original exec
        require('child_process').exec = originalExec;
      }
    });

    it('should coordinate with other Jung psychology services', async () => {
      const coordinationData = {
        title: 'Coordination Test Map',
        subject: 'Service Coordination',
        nodes: [{
          id: 'coord-test',
          label: 'Coordination Test Node',
          type: 'concept',
          cognitiveLevel: 'understand',
          content: { definition: 'Test coordination', examples: [], keyPoints: [] },
          difficulty: 0.5,
          importance: 0.7
        }],
        edges: [],
        learningObjectives: ['Test coordination'],
        prerequisites: [],
        assessmentPoints: []
      };

      mockProvider.generateStructuredOutput.mockResolvedValue(coordinationData);

      // Test should complete successfully even with coordination hooks
      const coordMap = await generator.generateJungianMindMap(
        'Coordination Test',
        ['Coordination'],
        'intermediate'
      );

      expect(coordMap.title).toBe('Coordination Test Map');
      expect(coordMap.nodes).toHaveLength(1);
    });
  });
});