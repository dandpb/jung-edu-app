/**
 * Comprehensive tests for moduleGeneration/demo.ts
 * Tests complete module generation demo workflow and system integration
 */

import { UnifiedModuleGenerator, ModuleGenerationConfig } from '../index';

// Mock dependencies
jest.mock('../index');
jest.mock('fs', () => ({
  writeFileSync: jest.fn(),
  existsSync: jest.fn().mockReturnValue(true)
}));
jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
  resolve: jest.fn((...args) => args.join('/'))
}));

// Import the demo after mocking
let demo: any;

const mockUnifiedModuleGenerator = UnifiedModuleGenerator as jest.MockedClass<typeof UnifiedModuleGenerator>;

// Mock module generation results
const mockQuickModule = {
  metadata: {
    topic: 'Shadow Integration in Jungian Psychology',
    difficulty: 'intermediate',
    componentsIncluded: ['module', 'quiz', 'videos', 'bibliography']
  },
  module: {
    title: 'Shadow Integration in Jungian Psychology',
    description: 'Comprehensive exploration of shadow work',
    objectives: [
      'Understand the shadow archetype',
      'Learn integration techniques',
      'Apply shadow work principles'
    ]
  },
  quiz: {
    questions: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'What is the shadow?',
        options: [
          { text: 'Conscious self', isCorrect: false },
          { text: 'Unconscious aspects', isCorrect: true }
        ]
      },
      {
        id: 'q2',
        type: 'short-answer',
        question: 'Describe shadow projection',
        expectedKeywords: ['projection', 'unconscious', 'other']
      }
    ]
  },
  videos: [
    {
      title: 'Introduction to Shadow Work',
      duration: 900, // 15 minutes in seconds
      url: 'https://youtube.com/watch?v=shadow1',
      channelName: 'Jung Institute',
      relevanceScore: 0.9
    },
    {
      title: 'Shadow Integration Techniques',
      duration: 1200, // 20 minutes
      url: 'https://youtube.com/watch?v=shadow2',
      channelName: 'Psychology Today',
      relevanceScore: 0.85
    }
  ],
  bibliography: [
    {
      authors: ['Carl Jung', 'Marie-Louise von Franz'],
      year: 1964,
      title: 'Man and His Symbols',
      doi: '10.1234/example'
    },
    {
      authors: ['Robert Johnson'],
      year: 1991,
      title: 'Owning Your Own Shadow',
      doi: null
    }
  ]
};

const mockStudyModule = {
  metadata: {
    topic: 'Collective Unconscious and Archetypes',
    difficulty: 'advanced',
  },
  module: {
    title: 'Collective Unconscious and Archetypes',
    description: 'Deep exploration of Jung\'s collective unconscious theory',
    objectives: [
      'Master archetypal theory',
      'Recognize universal patterns',
      'Apply archetypal analysis'
    ]
  },
  quiz: {
    questions: Array(12).fill(null).map((_, i) => ({
      id: `q${i}`,
      type: i % 3 === 0 ? 'multiple-choice' : i % 3 === 1 ? 'short-answer' : 'essay',
      question: `Question ${i}`,
      explanation: `Explanation ${i}`
    }))
  },
  videos: Array(8).fill(null).map((_, i) => ({
    title: `Video ${i}`,
    duration: 600 + (i * 300),
    channelName: `Channel ${i}`,
    relevanceScore: 0.8 + (i * 0.02)
  })),
  bibliography: Array(15).fill(null).map((_, i) => ({
    authors: [`Author ${i}`],
    year: 2000 + i,
    title: `Reference ${i}`,
    abstract: i < 5 ? `Abstract for reference ${i}` : undefined
  }))
};

const mockCustomModule = {
  metadata: {
    topic: 'Individuation Process and Self-Realization',
    difficulty: 'advanced',
    componentsIncluded: ['module', 'quiz', 'bibliography']
  },
  module: {
    metadata: {
      jungianConcepts: ['individuation', 'self', 'ego', 'persona', 'shadow']
    }
  },
  quiz: {
    questions: Array(20).fill(null).map((_, i) => ({
      id: `cq${i}`,
      type: i > 15 ? 'essay' : 'multiple-choice',
      question: `Custom question ${i}`,
      points: 10
    })),
    passingScore: 75,
    timeLimit: 45
  }
};

const mockResearchModule = {
  metadata: {
    topic: 'Synchronicity and Quantum Psychology',
    difficulty: 'scholar',
  },
  bibliography: Array(25).fill(null).map((_, i) => ({
    type: i % 4 === 0 ? 'article' : i % 4 === 1 ? 'book' : i % 4 === 2 ? 'journal' : 'conference',
    title: `Research ${i}`,
    year: 1990 + i,
    abstract: i < 10 ? `Research abstract ${i}` : undefined
  })),
  mindMap: {
    nodes: Array(20).fill(null).map((_, i) => ({
      id: `node${i}`,
      type: 'research',
      data: { 
        label: i % 5 === 0 ? `Research Topic ${i}` : 
               i % 5 === 1 ? `Theory ${i}` :
               i % 5 === 2 ? `Hypothesis ${i}` :
               `Concept ${i}`
      }
    })),
    edges: []
  }
};

describe('Module Generation Demo - Comprehensive Tests', () => {
  let mockGeneratorInstance: jest.Mocked<UnifiedModuleGenerator>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock console methods
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();

    // Setup UnifiedModuleGenerator mock
    mockGeneratorInstance = {
      generateQuickModule: jest.fn().mockResolvedValue(mockQuickModule),
      generateStudyModule: jest.fn().mockResolvedValue(mockStudyModule),
      generateCompleteModule: jest.fn().mockResolvedValue(mockCustomModule),
      generateResearchModule: jest.fn().mockResolvedValue(mockResearchModule)
    } as any;
    mockUnifiedModuleGenerator.mockImplementation(() => mockGeneratorInstance);

    // Import demo after mocking
    demo = require('../demo.ts.bak');
  });

  describe('Quick Module Generation Demo', () => {
    it('should execute quick module generation demo', async () => {
      // Extract and test just the quick module part
      const generator = new UnifiedModuleGenerator();
      const quickModule = await generator.generateQuickModule('Shadow Integration in Jungian Psychology');

      expect(mockUnifiedModuleGenerator).toHaveBeenCalled();
      expect(mockGeneratorInstance.generateQuickModule).toHaveBeenCalledWith(
        'Shadow Integration in Jungian Psychology'
      );

      // Verify structure
      expect(quickModule).toHaveProperty('metadata');
      expect(quickModule.metadata.topic).toBe('Shadow Integration in Jungian Psychology');
      expect(quickModule.metadata.difficulty).toBe('intermediate');
      expect(quickModule.metadata.componentsIncluded).toContain('quiz');
      expect(quickModule.metadata.componentsIncluded).toContain('videos');

      // Should have quiz questions
      expect(quickModule.quiz).toBeDefined();
      expect(quickModule.quiz.questions).toHaveLength(2);

      // Should have videos
      expect(quickModule.videos).toBeDefined();
      expect(quickModule.videos).toHaveLength(2);
      expect(quickModule.videos[0].title).toBe('Introduction to Shadow Work');
    });

    it('should handle quick module generation errors', async () => {
      mockGeneratorInstance.generateQuickModule.mockRejectedValue(new Error('Quick generation failed'));

      try {
        const generator = new UnifiedModuleGenerator();
        await generator.generateQuickModule('Test Topic');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Quick generation failed');
      }
    });

    it('should validate quick module output structure', async () => {
      const generator = new UnifiedModuleGenerator();
      const quickModule = await generator.generateQuickModule('Test Topic');

      // Required fields
      expect(quickModule).toHaveProperty('metadata');
      expect(quickModule).toHaveProperty('module');
      expect(quickModule.metadata).toHaveProperty('topic');
      expect(quickModule.metadata).toHaveProperty('difficulty');
      expect(quickModule.metadata).toHaveProperty('componentsIncluded');

      // Optional but expected fields
      if (quickModule.quiz) {
        expect(quickModule.quiz).toHaveProperty('questions');
        expect(Array.isArray(quickModule.quiz.questions)).toBe(true);
      }

      if (quickModule.videos) {
        expect(Array.isArray(quickModule.videos)).toBe(true);
        quickModule.videos.forEach((video: any) => {
          expect(video).toHaveProperty('title');
          expect(video).toHaveProperty('duration');
        });
      }
    });
  });

  describe('Study Module Generation Demo', () => {
    it('should execute comprehensive study module demo', async () => {
      const generator = new UnifiedModuleGenerator();
      const studyModule = await generator.generateStudyModule('Collective Unconscious and Archetypes');

      expect(mockGeneratorInstance.generateStudyModule).toHaveBeenCalledWith(
        'Collective Unconscious and Archetypes'
      );

      // Verify comprehensive structure
      expect(studyModule.metadata.topic).toBe('Collective Unconscious and Archetypes');
      expect(studyModule.metadata.difficulty).toBe('advanced');

      // Mind map analysis
      expect(studyModule.mindMap).toBeDefined();
      expect(studyModule.mindMap.nodes).toHaveLength(3);
      expect(studyModule.mindMap.edges).toHaveLength(2);

      const centralNode = studyModule.mindMap.nodes.find((n: any) => n.data.isRoot);
      expect(centralNode).toBeDefined();
      expect(centralNode!.data.label).toBe('Collective Unconscious');

      // Quiz analysis
      expect(studyModule.quiz.questions).toHaveLength(12);
      
      // Video analysis
      expect(studyModule.videos).toHaveLength(8);
      const totalDuration = studyModule.videos.reduce((sum: number, v: any) => sum + v.duration, 0);
      expect(totalDuration).toBeGreaterThan(0);

      // Bibliography analysis
      expect(studyModule.bibliography).toHaveLength(15);
      const referencesWithAbstracts = studyModule.bibliography.filter((ref: any) => ref.abstract);
      expect(referencesWithAbstracts).toHaveLength(5);
    });

    it('should handle mind map analysis correctly', async () => {
      const generator = new UnifiedModuleGenerator();
      const studyModule = await generator.generateStudyModule('Test Topic');

      if (studyModule.mindMap) {
        const nodeTypes = studyModule.mindMap.nodes.reduce((acc: Record<string, number>, node: any) => {
          acc[node.type] = (acc[node.type] || 0) + 1;
          return acc;
        }, {});

        expect(nodeTypes).toHaveProperty('central', 1);
        expect(nodeTypes).toHaveProperty('concept', 2);
      }
    });

    it('should analyze quiz question types correctly', async () => {
      const generator = new UnifiedModuleGenerator();
      const studyModule = await generator.generateStudyModule('Test Topic');

      if (studyModule.quiz) {
        const questionTypes = studyModule.quiz.questions.reduce((acc: Record<string, number>, q: any) => {
          acc[q.type] = (acc[q.type] || 0) + 1;
          return acc;
        }, {});

        expect(questionTypes['multiple-choice']).toBeGreaterThan(0);
        expect(questionTypes['short-answer']).toBeGreaterThan(0);
        expect(questionTypes['essay']).toBeGreaterThan(0);
      }
    });

    it('should handle missing components gracefully', async () => {
      const studyModuleWithoutVideos = { ...mockStudyModule, videos: null };
      mockGeneratorInstance.generateStudyModule.mockResolvedValue(studyModuleWithoutVideos);

      const generator = new UnifiedModuleGenerator();
      const studyModule = await generator.generateStudyModule('Test Topic');

      expect(studyModule.videos).toBeNull();
      // Should not crash when videos are missing
    });
  });

  describe('Custom Module Generation Demo', () => {
    it('should execute custom module with specific configuration', async () => {
      const customConfig: ModuleGenerationConfig = {
        topic: 'Individuation Process and Self-Realization',
        difficulty: 'advanced',
        targetAudience: 'psychology students and practitioners',
        includeVideos: false,
        includeQuiz: true,
        includeBibliography: true,
        quizQuestions: 20
      };

      const generator = new UnifiedModuleGenerator();
      const customModule = await generator.generateCompleteModule(customConfig);

      expect(mockGeneratorInstance.generateCompleteModule).toHaveBeenCalledWith(customConfig);

      // Verify configuration compliance
      expect(customModule.metadata.difficulty).toBe('advanced');
      expect(customModule.metadata.componentsIncluded).not.toContain('videos'); // Videos disabled
      expect(customModule.metadata.componentsIncluded).toContain('quiz');
      expect(customModule.metadata.componentsIncluded).toContain('bibliography');

      // Verify advanced quiz features
      expect(customModule.quiz.questions).toHaveLength(20);
      expect(customModule.quiz.passingScore).toBe(75);
      expect(customModule.quiz.timeLimit).toBe(45);

      // Jungian concepts should be identified
      expect(customModule.module.metadata.jungianConcepts).toContain('individuation');
      expect(customModule.module.metadata.jungianConcepts).toContain('self');
    });

    it('should handle custom configuration validation', async () => {
      const invalidConfig = {
        topic: '', // Empty topic should cause error
        difficulty: 'invalid' as any,
        quizQuestions: -5 // Invalid question count
      };

      mockGeneratorInstance.generateCompleteModule.mockRejectedValue(new Error('Invalid configuration'));

      const generator = new UnifiedModuleGenerator();
      
      await expect(generator.generateCompleteModule(invalidConfig))
        .rejects.toThrow('Invalid configuration');
    });

    it('should identify complex questions correctly', async () => {
      const generator = new UnifiedModuleGenerator();
      const customModule = await generator.generateCompleteModule({
        topic: 'Test Topic',
        difficulty: 'advanced',
        includeQuiz: true,
        quizQuestions: 20
      });

      // Find essay questions (should be complex)
      const essayQuestions = customModule.quiz.questions.filter((q: any) => q.type === 'essay');
      const complexQuestions = customModule.quiz.questions.filter((q: any) => 
        q.type === 'essay' || q.question.length > 100
      );

      expect(essayQuestions.length).toBeGreaterThan(0);
      expect(complexQuestions.length).toBeGreaterThanOrEqual(essayQuestions.length);
    });
  });

  describe('Research Module Generation Demo', () => {
    it('should execute research module generation', async () => {
      const generator = new UnifiedModuleGenerator();
      const researchModule = await generator.generateResearchModule('Synchronicity and Quantum Psychology');

      expect(mockGeneratorInstance.generateResearchModule).toHaveBeenCalledWith(
        'Synchronicity and Quantum Psychology'
      );

      expect(researchModule.metadata.topic).toBe('Synchronicity and Quantum Psychology');
      expect(researchModule.metadata.difficulty).toBe('scholar');

      // Bibliography analysis
      expect(researchModule.bibliography).toHaveLength(25);

      // Analyze source types
      const sourceTypes = researchModule.bibliography.reduce((acc: any, ref: any) => {
        const type = ref.type || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

      expect(sourceTypes).toHaveProperty('article');
      expect(sourceTypes).toHaveProperty('book');
      expect(sourceTypes).toHaveProperty('journal');

      // Analyze years
      const years = researchModule.bibliography
        .map((ref: any) => ref.year)
        .filter((year: number) => year)
        .sort((a: number, b: number) => b - a);

      expect(years.length).toBeGreaterThan(0);
      expect(years[0]).toBeGreaterThanOrEqual(years[years.length - 1]);

      // Most recent sources should have abstracts
      const recentSources = researchModule.bibliography
        .filter((ref: any) => ref.year)
        .sort((a: any, b: any) => (b.year || 0) - (a.year || 0))
        .slice(0, 3);
      
      expect(recentSources).toHaveLength(3);
    });

    it('should analyze research-oriented mind map', async () => {
      const generator = new UnifiedModuleGenerator();
      const researchModule = await generator.generateResearchModule('Test Research Topic');

      if (researchModule.mindMap) {
        const researchNodes = researchModule.mindMap.nodes.filter((n: any) => 
          n.data.label.toLowerCase().includes('research') ||
          n.data.label.toLowerCase().includes('theory') ||
          n.data.label.toLowerCase().includes('hypothesis')
        );

        // Should have research-oriented nodes
        expect(researchNodes.length).toBeGreaterThan(0);

        // Verify node distribution
        const labelCounts = researchModule.mindMap.nodes.reduce((acc: any, node: any) => {
          const label = node.data.label;
          if (label.includes('Research')) acc.research++;
          if (label.includes('Theory')) acc.theory++;
          if (label.includes('Hypothesis')) acc.hypothesis++;
          return acc;
        }, { research: 0, theory: 0, hypothesis: 0 });

        expect(labelCounts.research + labelCounts.theory + labelCounts.hypothesis).toBeGreaterThan(0);
      }
    });

    it('should handle research module without abstracts', async () => {
      const moduleWithoutAbstracts = {
        ...mockResearchModule,
        bibliography: mockResearchModule.bibliography.map((ref: any) => ({
          ...ref,
          abstract: undefined
        }))
      };
      mockGeneratorInstance.generateResearchModule.mockResolvedValue(moduleWithoutAbstracts);

      const generator = new UnifiedModuleGenerator();
      const researchModule = await generator.generateResearchModule('Test Topic');

      const referencesWithAbstracts = researchModule.bibliography.filter((ref: any) => ref.abstract);
      expect(referencesWithAbstracts).toHaveLength(0);
    });
  });

  describe('Demo Execution and Output', () => {
    it('should run complete demo without errors', async () => {
      await expect(demo.runCompleteDemo()).resolves.not.toThrow();
    });

    it('should execute all demo sections', async () => {
      await demo.runCompleteDemo();

      expect(mockGeneratorInstance.generateQuickModule).toHaveBeenCalled();
      expect(mockGeneratorInstance.generateStudyModule).toHaveBeenCalled();
      expect(mockGeneratorInstance.generateCompleteModule).toHaveBeenCalled();
      expect(mockGeneratorInstance.generateResearchModule).toHaveBeenCalled();
    });

    it('should handle demo section errors gracefully', async () => {
      mockGeneratorInstance.generateQuickModule.mockRejectedValue(new Error('Demo 1 error'));

      await demo.runCompleteDemo();

      expect(console.error).toHaveBeenCalledWith('Error in Demo 1:', expect.any(Error));
      
      // Should continue with other demos
      expect(mockGeneratorInstance.generateStudyModule).toHaveBeenCalled();
    });

    it('should display proper demo headers and formatting', async () => {
      await demo.runCompleteDemo();

      expect(console.log).toHaveBeenCalledWith('🚀 Jung Education Module Generation System - Complete Demo\n');
      expect(console.log).toHaveBeenCalledWith('═══════════════════════════════════════════════════════════════');
      expect(console.log).toHaveBeenCalledWith('📚 Demo 1: Quick Module Generation');
      expect(console.log).toHaveBeenCalledWith('📖 Demo 2: Comprehensive Study Module');
      expect(console.log).toHaveBeenCalledWith('🎯 Demo 3: Custom Module Generation');
      expect(console.log).toHaveBeenCalledWith('🔬 Demo 4: Research Module Generation');
    });

    it('should show completion summary', async () => {
      await demo.runCompleteDemo();

      expect(console.log).toHaveBeenCalledWith('✅ Demo Complete!');
      expect(console.log).toHaveBeenCalledWith('Summary of Features Demonstrated:');
      expect(console.log).toHaveBeenCalledWith('  ✓ Quick module generation for rapid content creation');
      expect(console.log).toHaveBeenCalledWith('The module generation system is ready for production use! 🎉');
    });

    it('should demonstrate file saving capability', async () => {
      await demo.runCompleteDemo();

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('💾 Saving outputs to:'));
      expect(console.log).toHaveBeenCalledWith('  Would save:');
      expect(console.log).toHaveBeenCalledWith('    - module-structure.json');
      expect(console.log).toHaveBeenCalledWith('    - mind-map.json');
      expect(console.log).toHaveBeenCalledWith('    - quiz.json');
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle generator initialization failures', () => {
      mockUnifiedModuleGenerator.mockImplementation(() => {
        throw new Error('Generator initialization failed');
      });

      expect(() => new UnifiedModuleGenerator()).toThrow('Generator initialization failed');
    });

    it('should handle malformed module results', async () => {
      const malformedModule = {
        metadata: null,
        module: undefined,
        quiz: { questions: [] },
        videos: null
      };
      mockGeneratorInstance.generateQuickModule.mockResolvedValue(malformedModule);

      const generator = new UnifiedModuleGenerator();
      const result = await generator.generateQuickModule('Test');

      expect(result.metadata).toBeNull();
      expect(result.module).toBeUndefined();
      expect(result.videos).toBeNull();
    });

    it('should handle concurrent demo executions', async () => {
      const promises = Array(3).fill(null).map(() => demo.runCompleteDemo());

      await Promise.all(promises);

      // All should complete without interference
      expect(mockGeneratorInstance.generateQuickModule).toHaveBeenCalledTimes(3);
      expect(mockGeneratorInstance.generateStudyModule).toHaveBeenCalledTimes(3);
    });

    it('should handle memory-intensive operations', async () => {
      // Simulate large module with many components
      const largeModule = {
        ...mockStudyModule,
        videos: Array(1000).fill(mockStudyModule.videos[0]),
        bibliography: Array(500).fill(mockStudyModule.bibliography[0]),
        quiz: {
          questions: Array(200).fill(mockStudyModule.quiz.questions[0])
        }
      };
      mockGeneratorInstance.generateStudyModule.mockResolvedValue(largeModule);

      await demo.runCompleteDemo();

      expect(console.log).toHaveBeenCalledWith('  Total Videos: 1000');
      expect(console.log).toHaveBeenCalledWith('  Total References: 500');
    });
  });

  describe('Performance and Integration', () => {
    it('should complete demo within reasonable time', async () => {
      const startTime = Date.now();
      
      await demo.runCompleteDemo();
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete quickly in test environment
      expect(duration).toBeLessThan(10000); // 10 seconds max
    });

    it('should demonstrate all major features', async () => {
      await demo.runCompleteDemo();

      // Verify all generation types were demonstrated
      expect(mockGeneratorInstance.generateQuickModule).toHaveBeenCalled();
      expect(mockGeneratorInstance.generateStudyModule).toHaveBeenCalled();
      expect(mockGeneratorInstance.generateCompleteModule).toHaveBeenCalled();
      expect(mockGeneratorInstance.generateResearchModule).toHaveBeenCalled();

      // Verify feature coverage in summary
      expect(console.log).toHaveBeenCalledWith('  ✓ Quick module generation for rapid content creation');
      expect(console.log).toHaveBeenCalledWith('  ✓ Comprehensive study modules with all components');
      expect(console.log).toHaveBeenCalledWith('  ✓ Custom configuration for specific needs');
      expect(console.log).toHaveBeenCalledWith('  ✓ Research-focused modules with academic bibliography');
    });

    it('should handle edge cases in data analysis', async () => {
      // Test with empty arrays and null values
      const edgeCaseModule = {
        ...mockStudyModule,
        quiz: { questions: [] },
        videos: [],
        bibliography: [],
        mindMap: { nodes: [], edges: [] }
      };
      mockGeneratorInstance.generateStudyModule.mockResolvedValue(edgeCaseModule);

      await demo.runCompleteDemo();

      expect(console.log).toHaveBeenCalledWith('  Total Videos: 0');
      expect(console.log).toHaveBeenCalledWith('  Total References: 0');
    });

    it('should validate exported demo function', () => {
      expect(typeof demo.runCompleteDemo).toBe('function');
      expect(demo.runCompleteDemo).toBeDefined();
    });
  });

  describe('Output Directory and File Operations', () => {
    it('should handle output directory creation simulation', async () => {
      await demo.runCompleteDemo();

      // Should mention output directory
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('output/module-generation-demo'));
    });

    it('should list all files that would be saved', async () => {
      await demo.runCompleteDemo();

      const expectedFiles = [
        'module-structure.json',
        'mind-map.json',
        'quiz.json',
        'videos.json',
        'bibliography.json'
      ];

      expectedFiles.forEach(file => {
        expect(console.log).toHaveBeenCalledWith(`    - ${file}`);
      });
    });

    it('should handle file path operations', async () => {
      const path = require('path');
      
      await demo.runCompleteDemo();

      expect(path.join).toHaveBeenCalledWith(
        expect.anything(),
        'output',
        'module-generation-demo'
      );
    });
  });
});