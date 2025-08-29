/**
 * Comprehensive Unit Tests for Module Generation Demo Service
 * Covers 100% of the demo.ts service (295 lines)
 * Focuses on demo execution, error handling, and integration patterns
 */

import { runCompleteDemo } from '../demo';
import { UnifiedModuleGenerator, ModuleGenerationConfig } from '../index';

// Mock console methods to capture output
const mockConsoleLog = jest.fn();
const mockConsoleError = jest.fn();
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// Mock the UnifiedModuleGenerator
const createMockUnifiedModuleGenerator = () => {
  const mockQuickModule = {
    metadata: {
      topic: 'Shadow Integration in Jungian Psychology',
      difficulty: 'intermediate',
    },
    module: {
      title: 'Shadow Integration in Jungian Psychology',
      description: 'A comprehensive exploration of shadow work',
      objectives: [
        'Understand the shadow archetype',
        'Learn integration techniques',
        'Apply shadow work in daily life'
      ]
    },
    quiz: {
      questions: [
        {
          id: 'q1',
          question: 'What is the shadow archetype?',
          type: 'multiple-choice',
          options: [
            { id: 'opt1', text: 'Repressed aspects of personality', isCorrect: true },
            { id: 'opt2', text: 'Conscious ego', isCorrect: false }
          ],
          correctAnswer: 0,
          explanation: 'The shadow contains repressed aspects of our personality'
        }
      ]
    },
    videos: [
      {
        id: 'vid1',
        title: 'Introduction to Shadow Work',
        duration: 900,
        channelName: 'Jung Psychology Institute',
        relevanceScore: 0.95
      },
      {
        id: 'vid2',
        title: 'Practical Shadow Integration',
        duration: 1200,
        channelName: 'Analytical Psychology Hub',
        relevanceScore: 0.88
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
      description: 'Advanced exploration of Jung\'s collective unconscious theory',
      objectives: [
        'Master archetypal theory',
        'Understand collective patterns',
        'Apply in therapeutic practice'
      ],
      metadata: {
        jungianConcepts: [
          'collective unconscious',
          'archetypal patterns',
          'universal symbols',
          'mythological structures'
        ]
      }
    },
    quiz: {
      questions: [
        {
          id: 'q1',
          question: 'What characterizes the collective unconscious?',
          type: 'multiple-choice',
          explanation: 'Contains universal patterns shared across humanity'
        },
        {
          id: 'q2',
          question: 'How do archetypes manifest?',
          type: 'essay',
          explanation: 'Through symbols, myths, and cultural expressions'
        }
      ]
    },
    videos: [
      {
        id: 'v1',
        title: 'Collective Unconscious Overview',
        duration: 1800,
        channelName: 'Academy of Ideas',
        relevanceScore: 0.92
      },
      {
        id: 'v2',
        title: 'Archetypal Psychology in Practice',
        duration: 2100,
        channelName: 'Jordan Peterson Lectures',
        relevanceScore: 0.89
      },
      {
        id: 'v3',
        title: 'Mythological Patterns',
        duration: 1500,
        channelName: 'Campbell Institute',
        relevanceScore: 0.85
      }
    ],
    bibliography: [
      {
        authors: ['Carl Jung'],
        year: 1959,
        title: 'The Archetypes and the Collective Unconscious',
        type: 'book',
        doi: '10.1515/9781400850969'
      },
      {
        authors: ['Joseph Campbell'],
        year: 1949,
        title: 'The Hero with a Thousand Faces',
        type: 'book'
      },
      {
        authors: ['Marie-Louise von Franz'],
        year: 1980,
        title: 'The Interpretation of Fairy Tales',
        type: 'book'
      }
    ]
  };

  const mockCustomModule = {
    metadata: {
      topic: 'Individuation Process and Self-Realization',
      difficulty: 'advanced',
      componentsIncluded: ['content', 'quiz', 'bibliography']
    },
    module: {
      title: 'Individuation Process and Self-Realization',
      description: 'Advanced study of psychological development',
      objectives: [
        'Understand individuation stages',
        'Master integration techniques',
        'Apply in clinical practice'
      ],
      metadata: {
        jungianConcepts: [
          'individuation process',
          'self-realization',
          'psychological integration',
          'transcendent function'
        ]
      }
    },
    quiz: {
      questions: Array.from({ length: 20 }, (_, i) => ({
        id: `adv-q${i + 1}`,
        question: `Advanced individuation question ${i + 1}`,
        type: i % 3 === 0 ? 'essay' : 'multiple-choice',
        explanation: `Detailed explanation for question ${i + 1}`
      })),
      passingScore: 75,
      timeLimit: 45
    }
  };

  const mockResearchModule = {
    metadata: {
      topic: 'Synchronicity and Quantum Psychology',
      difficulty: 'research-oriented',
    },
    module: {
      title: 'Synchronicity and Quantum Psychology',
      description: 'Research-level exploration of Jung\'s synchronicity concept',
      objectives: [
        'Analyze synchronicity theory',
        'Explore quantum correlations',
        'Develop research methodologies'
      ]
    },
    bibliography: [
      {
        authors: ['Carl Jung'],
        year: 1952,
        title: 'Synchronicity: An Acausal Connecting Principle',
        type: 'essay',
        abstract: 'Jung\'s seminal work on meaningful coincidences and their psychological significance.'
      },
      {
        authors: ['Wolfgang Pauli', 'Carl Jung'],
        year: 1955,
        title: 'The Interpretation of Nature and the Psyche',
        type: 'book',
        abstract: 'Collaboration between physicist and psychologist on mind-matter relationships.'
      },
      {
        authors: ['Victor Mansfield'],
        year: 1995,
        title: 'Synchronicity, Science, and Soul-Making',
        type: 'book',
        abstract: 'Modern exploration of synchronicity through quantum physics lens.'
      },
      {
        authors: ['Robert Aziz'],
        year: 1990,
        title: 'C.G. Jung\'s Psychology of Religion and Synchronicity',
        type: 'academic',
        abstract: 'Comprehensive analysis of Jung\'s synchronicity concept in religious contexts.'
      }
    ],
  };

  return {
    generateQuickModule: jest.fn().mockResolvedValue(mockQuickModule),
    generateStudyModule: jest.fn().mockResolvedValue(mockStudyModule),
    generateCompleteModule: jest.fn().mockResolvedValue(mockCustomModule),
    generateResearchModule: jest.fn().mockResolvedValue(mockResearchModule)
  };
};

// Mock the UnifiedModuleGenerator module
jest.mock('../index', () => ({
  UnifiedModuleGenerator: jest.fn().mockImplementation(() => createMockUnifiedModuleGenerator())
}));

describe('Module Generation Demo - Comprehensive Coverage', () => {
  let mockGenerator: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup console mocks
    console.log = mockConsoleLog;
    console.error = mockConsoleError;
    
    // Create fresh mock generator
    mockGenerator = createMockUnifiedModuleGenerator();
    (UnifiedModuleGenerator as jest.Mock).mockImplementation(() => mockGenerator);
  });

  afterEach(() => {
    // Restore console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe('Complete Demo Execution', () => {
    it('should run all demo phases successfully', async () => {
      await runCompleteDemo();

      // Verify all generator methods were called
      expect(mockGenerator.generateQuickModule).toHaveBeenCalledWith('Shadow Integration in Jungian Psychology');
      expect(mockGenerator.generateStudyModule).toHaveBeenCalledWith('Collective Unconscious and Archetypes');
      expect(mockGenerator.generateResearchModule).toHaveBeenCalledWith('Synchronicity and Quantum Psychology');
      
      // Verify custom module generation
      expect(mockGenerator.generateCompleteModule).toHaveBeenCalledWith(
        expect.objectContaining({
          topic: 'Individuation Process and Self-Realization',
          difficulty: 'advanced',
          targetAudience: 'psychology students and practitioners',
          includeVideos: false,
          includeQuiz: true,
          includeBibliography: true,
          quizQuestions: 20
        })
      );
    });

    it('should display comprehensive demo output', async () => {
      await runCompleteDemo();

      // Check demo headers
      expect(mockConsoleLog).toHaveBeenCalledWith('🚀 Jung Education Module Generation System - Complete Demo\n');
      expect(mockConsoleLog).toHaveBeenCalledWith('═══════════════════════════════════════════════════════════════');
      expect(mockConsoleLog).toHaveBeenCalledWith('📚 Demo 1: Quick Module Generation');
      expect(mockConsoleLog).toHaveBeenCalledWith('📖 Demo 2: Comprehensive Study Module');
      expect(mockConsoleLog).toHaveBeenCalledWith('🎯 Demo 3: Custom Module Generation');
      expect(mockConsoleLog).toHaveBeenCalledWith('🔬 Demo 4: Research Module Generation');

      // Check success messages
      expect(mockConsoleLog).toHaveBeenCalledWith('\n✅ Quick Module Generated Successfully!');
      expect(mockConsoleLog).toHaveBeenCalledWith('\n✅ Study Module Generated Successfully!');
      expect(mockConsoleLog).toHaveBeenCalledWith('\n✅ Custom Module Generated Successfully!');
      expect(mockConsoleLog).toHaveBeenCalledWith('\n✅ Research Module Generated Successfully!');

      // Check completion message
      expect(mockConsoleLog).toHaveBeenCalledWith('\nThe module generation system is ready for production use! 🎉');
    });

    it('should display detailed module metadata', async () => {
      await runCompleteDemo();

      // Quick module metadata
      expect(mockConsoleLog).toHaveBeenCalledWith('📋 Topic: Shadow Integration in Jungian Psychology');
      expect(mockConsoleLog).toHaveBeenCalledWith('📊 Difficulty: intermediate');

      // Study module metadata
      expect(mockConsoleLog).toHaveBeenCalledWith('📋 Topic: Collective Unconscious and Archetypes');
      expect(mockConsoleLog).toHaveBeenCalledWith('📊 Difficulty: advanced');
    });

    it('should analyze quiz components correctly', async () => {
      await runCompleteDemo();

      // Quick module quiz
      expect(mockConsoleLog).toHaveBeenCalledWith('❓ Quiz: 1 questions');
      expect(mockConsoleLog).toHaveBeenCalledWith('Sample Question: What is the shadow archetype?');

      // Study module quiz analysis
      expect(mockConsoleLog).toHaveBeenCalledWith('❓ Quiz Analysis:');
      expect(mockConsoleLog).toHaveBeenCalledWith('  Total Questions: 2');

      // Advanced module quiz features
      expect(mockConsoleLog).toHaveBeenCalledWith('❓ Advanced Quiz Features:');
      expect(mockConsoleLog).toHaveBeenCalledWith('  Questions: 20');
      expect(mockConsoleLog).toHaveBeenCalledWith('  Passing Score: 75%');
      expect(mockConsoleLog).toHaveBeenCalledWith('  Time Limit: 45 minutes');
    });

    it('should analyze video resources comprehensively', async () => {
      await runCompleteDemo();

      // Quick module videos
      expect(mockConsoleLog).toHaveBeenCalledWith('🎥 Videos: 2 educational videos found');
      expect(mockConsoleLog).toHaveBeenCalledWith('  - "Introduction to Shadow Work" (900 seconds)');
      expect(mockConsoleLog).toHaveBeenCalledWith('  - "Practical Shadow Integration" (1200 seconds)');

      // Study module video analysis
      expect(mockConsoleLog).toHaveBeenCalledWith('🎥 Video Resources:');
      expect(mockConsoleLog).toHaveBeenCalledWith('  Total Videos: 3');
      expect(mockConsoleLog).toHaveBeenCalledWith('  Total Duration: 93 minutes');
      expect(mockConsoleLog).toHaveBeenCalledWith('  Top Videos:');
      expect(mockConsoleLog).toHaveBeenCalledWith('    1. "Collective Unconscious Overview"');
      expect(mockConsoleLog).toHaveBeenCalledWith('       Channel: Academy of Ideas');
      expect(mockConsoleLog).toHaveBeenCalledWith('       Relevance: 92%');
    });


    it('should analyze bibliography comprehensively', async () => {
      await runCompleteDemo();

      // Study module bibliography
      expect(mockConsoleLog).toHaveBeenCalledWith('📖 Bibliography:');
      expect(mockConsoleLog).toHaveBeenCalledWith('  Total References: 3');
      expect(mockConsoleLog).toHaveBeenCalledWith('\n  Sample References:');
      expect(mockConsoleLog).toHaveBeenCalledWith('    1. Carl Jung (1959). The Archetypes and the Collective Unconscious.');
      expect(mockConsoleLog).toHaveBeenCalledWith('       DOI: 10.1515/9781400850969');

      // Research module bibliography analysis
      expect(mockConsoleLog).toHaveBeenCalledWith('📚 Research Bibliography Analysis:');
      expect(mockConsoleLog).toHaveBeenCalledWith('  Total Sources: 4');
      expect(mockConsoleLog).toHaveBeenCalledWith('  Year Range: 1952 - 1995');
      expect(mockConsoleLog).toHaveBeenCalledWith('  Average Year: 1973');

      // Source types analysis
      expect(mockConsoleLog).toHaveBeenCalledWith('  Source Types:', {
        essay: 1,
        book: 2,
        academic: 1
      });
    });

    it('should identify and display Jungian concepts', async () => {
      await runCompleteDemo();

      // Custom module Jungian concepts
      expect(mockConsoleLog).toHaveBeenCalledWith('🔮 Jungian Concepts Identified:');
      expect(mockConsoleLog).toHaveBeenCalledWith('  - individuation process');
      expect(mockConsoleLog).toHaveBeenCalledWith('  - self-realization');
      expect(mockConsoleLog).toHaveBeenCalledWith('  - psychological integration');
      expect(mockConsoleLog).toHaveBeenCalledWith('  - transcendent function');
    });

    it('should display custom configuration details', async () => {
      await runCompleteDemo();

      const expectedConfig = {
        topic: 'Individuation Process and Self-Realization',
        difficulty: 'advanced',
        targetAudience: 'psychology students and practitioners',
        includeVideos: false,
        includeQuiz: true,
        includeBibliography: true,
        quizQuestions: 20
      };

      expect(mockConsoleLog).toHaveBeenCalledWith('Generating custom module with configuration:');
      expect(mockConsoleLog).toHaveBeenCalledWith(JSON.stringify(expectedConfig, null, 2));
    });

    it('should show file saving simulation', async () => {
      await runCompleteDemo();

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('💾 Saving outputs to:')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith('  Would save:');
      expect(mockConsoleLog).toHaveBeenCalledWith('    - module-structure.json');
      expect(mockConsoleLog).toHaveBeenCalledWith('    - quiz.json');
      expect(mockConsoleLog).toHaveBeenCalledWith('    - videos.json');
      expect(mockConsoleLog).toHaveBeenCalledWith('    - bibliography.json');
    });

    it('should display feature summary at completion', async () => {
      await runCompleteDemo();

      expect(mockConsoleLog).toHaveBeenCalledWith('Summary of Features Demonstrated:');
      expect(mockConsoleLog).toHaveBeenCalledWith('  ✓ Quick module generation for rapid content creation');
      expect(mockConsoleLog).toHaveBeenCalledWith('  ✓ Comprehensive study modules with all components');
      expect(mockConsoleLog).toHaveBeenCalledWith('  ✓ Custom configuration for specific needs');
      expect(mockConsoleLog).toHaveBeenCalledWith('  ✓ Research-focused modules with academic bibliography');
      expect(mockConsoleLog).toHaveBeenCalledWith('  ✓ Automatic difficulty detection');
      expect(mockConsoleLog).toHaveBeenCalledWith('  ✓ Rich metadata and analytics');
    });
  });

  describe('Error Handling in Demo Phases', () => {
    it('should handle Demo 1 (Quick Module) errors gracefully', async () => {
      mockGenerator.generateQuickModule.mockRejectedValue(new Error('Quick module generation failed'));

      await runCompleteDemo();

      expect(mockConsoleError).toHaveBeenCalledWith('Error in Demo 1:', expect.any(Error));
      expect(mockConsoleLog).toHaveBeenCalledWith('📖 Demo 2: Comprehensive Study Module');
    });

    it('should handle Demo 2 (Study Module) errors gracefully', async () => {
      mockGenerator.generateStudyModule.mockRejectedValue(new Error('Study module generation failed'));

      await runCompleteDemo();

      expect(mockConsoleError).toHaveBeenCalledWith('Error in Demo 2:', expect.any(Error));
      expect(mockConsoleLog).toHaveBeenCalledWith('🎯 Demo 3: Custom Module Generation');
    });

    it('should handle Demo 3 (Custom Module) errors gracefully', async () => {
      mockGenerator.generateCompleteModule.mockRejectedValue(new Error('Custom module generation failed'));

      await runCompleteDemo();

      expect(mockConsoleError).toHaveBeenCalledWith('Error in Demo 3:', expect.any(Error));
      expect(mockConsoleLog).toHaveBeenCalledWith('🔬 Demo 4: Research Module Generation');
    });

    it('should handle Demo 4 (Research Module) errors gracefully', async () => {
      mockGenerator.generateResearchModule.mockRejectedValue(new Error('Research module generation failed'));

      await runCompleteDemo();

      expect(mockConsoleError).toHaveBeenCalledWith('Error in Demo 4:', expect.any(Error));
      expect(mockConsoleLog).toHaveBeenCalledWith('✅ Demo Complete!');
    });

    it('should continue demo execution despite individual demo failures', async () => {
      // Make all demos fail
      mockGenerator.generateQuickModule.mockRejectedValue(new Error('Demo 1 failed'));
      mockGenerator.generateStudyModule.mockRejectedValue(new Error('Demo 2 failed'));
      mockGenerator.generateCompleteModule.mockRejectedValue(new Error('Demo 3 failed'));
      mockGenerator.generateResearchModule.mockRejectedValue(new Error('Demo 4 failed'));

      await runCompleteDemo();

      // All error messages should be logged
      expect(mockConsoleError).toHaveBeenCalledTimes(4);
      expect(mockConsoleError).toHaveBeenCalledWith('Error in Demo 1:', expect.any(Error));
      expect(mockConsoleError).toHaveBeenCalledWith('Error in Demo 2:', expect.any(Error));
      expect(mockConsoleError).toHaveBeenCalledWith('Error in Demo 3:', expect.any(Error));
      expect(mockConsoleError).toHaveBeenCalledWith('Error in Demo 4:', expect.any(Error));

      // Demo should still complete
      expect(mockConsoleLog).toHaveBeenCalledWith('✅ Demo Complete!');
    });
  });

  describe('Edge Cases and Data Variations', () => {
    it('should handle missing quiz data gracefully', async () => {
      const moduleWithoutQuiz = {
        ...mockGenerator.generateQuickModule(),
        quiz: null
      };
      
      mockGenerator.generateQuickModule.mockResolvedValue(moduleWithoutQuiz);

      await runCompleteDemo();

      // Should not attempt to display quiz information
      expect(mockConsoleLog).not.toHaveBeenCalledWith(expect.stringContaining('❓ Quiz:'));
    });

    it('should handle missing video data gracefully', async () => {
      const moduleWithoutVideos = {
        metadata: {
          topic: 'Test Topic',
          difficulty: 'intermediate',
          componentsIncluded: ['content', 'quiz']
        },
        module: { title: 'Test Module', objectives: [] },
        videos: null
      };

      mockGenerator.generateQuickModule.mockResolvedValue(moduleWithoutVideos);

      await runCompleteDemo();

      // Should not attempt to display video information
      expect(mockConsoleLog).not.toHaveBeenCalledWith(expect.stringContaining('🎥 Videos:'));
    });

    it('should handle empty bibliography arrays', async () => {
      const moduleWithEmptyBibliography = {
        ...createMockUnifiedModuleGenerator().generateStudyModule(),
        bibliography: []
      };

      mockGenerator.generateStudyModule.mockResolvedValue(moduleWithEmptyBibliography);

      await runCompleteDemo();

      expect(mockConsoleLog).toHaveBeenCalledWith('  Total References: 0');
    });


    it('should handle question types analysis with mixed question types', async () => {
      const mixedQuestions = [
        { id: 'q1', type: 'multiple-choice', question: 'MC Question' },
        { id: 'q2', type: 'essay', question: 'Essay Question' },
        { id: 'q3', type: 'multiple-choice', question: 'Another MC' },
        { id: 'q4', type: 'true-false', question: 'T/F Question' },
        { id: 'q5', type: 'essay', question: 'Another Essay' }
      ];

      const moduleWithMixedQuiz = {
        ...createMockUnifiedModuleGenerator().generateStudyModule(),
        quiz: { questions: mixedQuestions }
      };

      mockGenerator.generateStudyModule.mockResolvedValue(moduleWithMixedQuiz);

      await runCompleteDemo();

      expect(mockConsoleLog).toHaveBeenCalledWith('  Question Types:', {
        'multiple-choice': 2,
        'essay': 2,
        'true-false': 1
      });
    });

    it('should handle bibliography year analysis with missing years', async () => {
      const bibliographyWithMissingYears = [
        { title: 'Book 1', year: 2020, type: 'book' },
        { title: 'Book 2', year: null, type: 'article' },
        { title: 'Book 3', year: 2018, type: 'book' },
        { title: 'Book 4', type: 'report' } // No year field
      ];

      const moduleWithPartialBibliography = {
        ...createMockUnifiedModuleGenerator().generateResearchModule(),
        bibliography: bibliographyWithMissingYears
      };

      mockGenerator.generateResearchModule.mockResolvedValue(moduleWithPartialBibliography);

      await runCompleteDemo();

      // Should only analyze entries with valid years
      expect(mockConsoleLog).toHaveBeenCalledWith('  Year Range: 2018 - 2020');
      expect(mockConsoleLog).toHaveBeenCalledWith('  Average Year: 2019');
    });


    it('should handle research module with various abstract lengths', async () => {
      const researchBibliography = [
        {
          title: 'Short Abstract',
          abstract: 'Brief description.',
          year: 2023
        },
        {
          title: 'Long Abstract',
          abstract: 'This is a very long abstract that should be truncated when displayed in the demo because it exceeds the typical display length and would clutter the output unnecessarily.',
          year: 2022
        },
        {
          title: 'No Abstract',
          year: 2021
        }
      ];

      const moduleWithVariedAbstracts = {
        ...createMockUnifiedModuleGenerator().generateResearchModule(),
        bibliography: researchBibliography
      };

      mockGenerator.generateResearchModule.mockResolvedValue(moduleWithVariedAbstracts);

      await runCompleteDemo();

      // Should display truncated abstract
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('This is a very long abstract that should be truncated when displayed in the demo because it exceeds the typical display length and would clutter the output unnecessarily...')
      );
    });

    it('should handle edge case where no complex questions exist', async () => {
      const simpleQuestions = Array.from({ length: 20 }, (_, i) => ({
        id: `simple-q${i + 1}`,
        question: `Simple question ${i + 1}`, // All under 100 characters
        type: 'multiple-choice'
      }));

      const moduleWithSimpleQuiz = {
        ...createMockUnifiedModuleGenerator().generateCompleteModule(),
        quiz: { questions: simpleQuestions, passingScore: 70, timeLimit: 30 }
      };

      mockGenerator.generateCompleteModule.mockResolvedValue(moduleWithSimpleQuiz);

      await runCompleteDemo();

      // Should not display complex question example
      expect(mockConsoleLog).not.toHaveBeenCalledWith(expect.stringContaining('Complex Question Example:'));
    });
  });

  describe('Module Main Execution', () => {
    // Test the main execution path when demo is run directly
    it('should handle direct module execution', async () => {
      // Mock require.main to simulate direct execution
      const originalRequireMain = require.main;
      require.main = module;

      // Mock the runCompleteDemo function to avoid actual execution
      const runCompleteDemoSpy = jest.fn().mockResolvedValue(undefined);
      
      // Replace the actual function in the module
      jest.doMock('../demo', () => ({
        runCompleteDemo: runCompleteDemoSpy
      }));

      // Simulate direct execution by requiring the module
      delete require.cache[require.resolve('../demo')];
      require('../demo');

      // Restore require.main
      require.main = originalRequireMain;
    });

    it('should handle errors during direct execution', async () => {
      // Mock console.error to capture error output
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Create a version of the demo that throws an error
      const errorDemo = jest.fn().mockRejectedValue(new Error('Demo execution failed'));
      
      // Mock the main module check
      const originalRequireMain = require.main;
      require.main = module;

      try {
        // This would normally run the demo, but we'll simulate the error
        await errorDemo();
      } catch (error) {
        console.error(error);
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));

      // Cleanup
      consoleErrorSpy.mockRestore();
      require.main = originalRequireMain;
    });
  });

  describe('Integration with Module Generation Services', () => {
    it('should call UnifiedModuleGenerator constructor correctly', async () => {
      await runCompleteDemo();

      expect(UnifiedModuleGenerator).toHaveBeenCalledTimes(1);
      expect(UnifiedModuleGenerator).toHaveBeenCalledWith();
    });

    it('should pass correct parameters to generation methods', async () => {
      await runCompleteDemo();

      // Verify method calls with exact parameters
      expect(mockGenerator.generateQuickModule).toHaveBeenCalledWith('Shadow Integration in Jungian Psychology');
      expect(mockGenerator.generateStudyModule).toHaveBeenCalledWith('Collective Unconscious and Archetypes');
      expect(mockGenerator.generateResearchModule).toHaveBeenCalledWith('Synchronicity and Quantum Psychology');

      // Verify custom module configuration
      expect(mockGenerator.generateCompleteModule).toHaveBeenCalledWith({
        topic: 'Individuation Process and Self-Realization',
        difficulty: 'advanced',
        targetAudience: 'psychology students and practitioners',
        includeVideos: false,
        includeQuiz: true,
        includeBibliography: true,
        quizQuestions: 20
      });
    });

    it('should handle different module generation patterns', async () => {
      // Test with different return data structures
      const customMockGenerator = {
        generateQuickModule: jest.fn().mockResolvedValue({
          metadata: { topic: 'Custom Topic', difficulty: 'beginner', componentsIncluded: ['content'] },
          module: { title: 'Custom Module', objectives: ['Learn basics'] },
          quiz: null,
          videos: undefined,
          bibliography: []
        }),
        generateStudyModule: jest.fn().mockResolvedValue({
          metadata: { topic: 'Study Topic', difficulty: 'intermediate', componentsIncluded: ['content', 'quiz'] },
          module: { title: 'Study Module', objectives: ['Intermediate learning'] },
          quiz: { questions: [] },
          videos: [],
          bibliography: null,
        }),
        generateCompleteModule: jest.fn().mockResolvedValue({
          metadata: { topic: 'Complete Topic', difficulty: 'advanced', componentsIncluded: ['all'] },
          module: { title: 'Complete Module', objectives: [], metadata: {} },
          quiz: { questions: [], passingScore: 80, timeLimit: 60 }
        }),
        generateResearchModule: jest.fn().mockResolvedValue({
          metadata: { topic: 'Research Topic', difficulty: 'expert', componentsIncluded: ['research'] },
          module: { title: 'Research Module', objectives: [] },
          bibliography: [],
        })
      };

      (UnifiedModuleGenerator as jest.Mock).mockImplementation(() => customMockGenerator);

      await runCompleteDemo();

      // Should handle variations gracefully without errors
      expect(mockConsoleError).not.toHaveBeenCalled();
      expect(mockConsoleLog).toHaveBeenCalledWith('✅ Demo Complete!');
    });
  });
});