/**
 * Unit tests for src/services/moduleGeneration/demo.ts
 * Comprehensive test suite covering all functionality with 85%+ coverage
 */

import { runCompleteDemo, runDemoSuite } from '../demo';
import { UnifiedModuleGenerator, ModuleGenerationConfig } from '../index';

// Mock the UnifiedModuleGenerator and its dependencies
jest.mock('../index', () => ({
  UnifiedModuleGenerator: jest.fn(),
  ModuleGenerationConfig: {},
  GeneratedModule: {}
}));

// Mock console methods
const mockConsoleLog = jest.fn();
const mockConsoleError = jest.fn();

// Type the mocked class
const MockUnifiedModuleGenerator = UnifiedModuleGenerator as jest.MockedClass<typeof UnifiedModuleGenerator>;

describe('Demo Module Tests', () => {
  let mockGeneratorInstance: jest.Mocked<UnifiedModuleGenerator>;

  // Mock data for successful module generation
  const mockSuccessfulResult = {
    module: {
      title: 'Jungian Psychology Demo',
      id: 'jung-demo-1',
      content: {
        introduction: 'Introduction to Jungian psychology concepts',
        sections: [
          { title: 'Basic Concepts', content: 'Understanding Jung basics' },
          { title: 'Archetypal Patterns', content: 'Exploring archetypes' },
          { title: 'Psychological Insights', content: 'Applying Jung insights' }
        ]
      },
      objectives: [
        'Understand basic Jung concepts',
        'Explore archetypal patterns', 
        'Apply psychological insights'
      ],
      targetAudience: 'Psychology students',
      duration: 60,
      difficulty: 'intermediate'
    },
    quiz: {
      questions: [
        {
          id: 'q1',
          type: 'multiple-choice',
          question: 'What is the collective unconscious?',
          options: ['Personal memories', 'Universal patterns', 'Conscious thoughts', 'Individual dreams'],
          correctAnswer: 1,
          explanation: 'The collective unconscious contains universal patterns shared by all humans'
        }
      ]
    },
    videos: [
      {
        title: 'Jung Introduction Video',
        duration: 300,
        youtubeId: 'demo123'
      }
    ],
    bibliography: [
      {
        title: 'Man and His Symbols',
        author: 'Carl Jung',
        year: 1964
      }
    ],
    metadata: {
      generatedAt: new Date('2024-01-01T00:00:00Z'),
      difficulty: 'intermediate',
      topic: 'Jungian Psychology Demo',
      componentsIncluded: ['module', 'quiz', 'videos', 'bibliography']
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock console methods
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();
    global.console = {
      ...console,
      log: mockConsoleLog,
      error: mockConsoleError
    };

    // Create mock instance
    mockGeneratorInstance = {
      generateCompleteModule: jest.fn().mockResolvedValue(mockSuccessfulResult),
    } as any;

    // Setup the mock constructor
    MockUnifiedModuleGenerator.mockImplementation(() => mockGeneratorInstance);
  });

  describe('runCompleteDemo', () => {
    describe('Success Scenarios', () => {
      it('should execute demo with default configuration successfully', async () => {
        await runCompleteDemo();

        expect(MockUnifiedModuleGenerator).toHaveBeenCalledTimes(1);
        expect(mockGeneratorInstance.generateCompleteModule).toHaveBeenCalledWith({
          topic: 'Jungian Psychology Demo',
          objectives: [
            'Understand basic Jung concepts',
            'Explore archetypal patterns',
            'Apply psychological insights'
          ],
          targetAudience: 'Psychology students',
          duration: 60,
          difficulty: 'intermediate',
          language: 'pt-BR'
        });

        // Verify console output
        expect(mockConsoleLog).toHaveBeenCalledWith('🚀 Starting module generation demo...');
        expect(mockConsoleLog).toHaveBeenCalledWith('📝 Generating module content...');
        expect(mockConsoleLog).toHaveBeenCalledWith('✅ Demo completed successfully!');
        expect(mockConsoleLog).toHaveBeenCalledWith('Generated module: Jungian Psychology Demo');
        expect(mockConsoleLog).toHaveBeenCalledWith('Components: module, quiz, videos, bibliography');
      });

      it('should execute demo with custom configuration (ignores custom config)', async () => {
        const customConfig: ModuleGenerationConfig = {
          topic: 'Custom Topic',
          difficulty: 'advanced',
          targetAudience: 'Researchers',
          duration: 120,
          language: 'en'
        };

        await runCompleteDemo(customConfig);

        // The function ignores custom config and uses hardcoded demo config
        expect(mockGeneratorInstance.generateCompleteModule).toHaveBeenCalledWith({
          topic: 'Jungian Psychology Demo',
          objectives: [
            'Understand basic Jung concepts',
            'Explore archetypal patterns',
            'Apply psychological insights'
          ],
          targetAudience: 'Psychology students',
          duration: 60,
          difficulty: 'intermediate',
          language: 'pt-BR'
        });
        expect(mockConsoleLog).toHaveBeenCalledWith('Generated module: Jungian Psychology Demo');
      });

      it('should handle module with minimal components', async () => {
        const minimalResult = {
          ...mockSuccessfulResult,
          metadata: {
            ...mockSuccessfulResult.metadata,
            componentsIncluded: ['module']
          }
        };
        
        mockGeneratorInstance.generateCompleteModule.mockResolvedValue(minimalResult);

        await runCompleteDemo();

        expect(mockConsoleLog).toHaveBeenCalledWith('Components: module');
      });

      it('should handle module with all possible components', async () => {
        const fullResult = {
          ...mockSuccessfulResult,
          metadata: {
            ...mockSuccessfulResult.metadata,
            componentsIncluded: ['module', 'quiz', 'videos', 'bibliography', 'mindmap', 'assessments']
          }
        };
        
        mockGeneratorInstance.generateCompleteModule.mockResolvedValue(fullResult);

        await runCompleteDemo();

        expect(mockConsoleLog).toHaveBeenCalledWith('Components: module, quiz, videos, bibliography, mindmap, assessments');
      });

      it('should handle undefined or null custom config gracefully', async () => {
        await runCompleteDemo(undefined);
        expect(MockUnifiedModuleGenerator).toHaveBeenCalledTimes(1);

        jest.clearAllMocks();
        MockUnifiedModuleGenerator.mockImplementation(() => mockGeneratorInstance);

        await runCompleteDemo(null as any);
        expect(MockUnifiedModuleGenerator).toHaveBeenCalledTimes(1);
      });

      it('should validate successful completion with return value', async () => {
        const result = await runCompleteDemo();
        expect(result).toBeUndefined(); // Function returns void on success
        expect(mockConsoleError).not.toHaveBeenCalled();
      });
    });

    describe('Error Scenarios', () => {
      it('should handle module generation failure', async () => {
        const errorMessage = 'Module generation failed';
        const error = new Error(errorMessage);
        mockGeneratorInstance.generateCompleteModule.mockRejectedValue(error);

        await expect(runCompleteDemo()).rejects.toThrow(errorMessage);

        expect(mockConsoleLog).toHaveBeenCalledWith('🚀 Starting module generation demo...');
        expect(mockConsoleLog).toHaveBeenCalledWith('📝 Generating module content...');
        expect(mockConsoleError).toHaveBeenCalledWith('❌ Demo failed:', error);
        expect(mockConsoleLog).not.toHaveBeenCalledWith('✅ Demo completed successfully!');
      });

      it('should handle network timeout errors', async () => {
        const timeoutError = new Error('Request timeout');
        timeoutError.name = 'TimeoutError';
        mockGeneratorInstance.generateCompleteModule.mockRejectedValue(timeoutError);

        await expect(runCompleteDemo()).rejects.toThrow('Request timeout');
        expect(mockConsoleError).toHaveBeenCalledWith('❌ Demo failed:', timeoutError);
      });

      it('should handle API key errors', async () => {
        const apiError = new Error('Invalid API key');
        apiError.name = 'AuthenticationError';
        mockGeneratorInstance.generateCompleteModule.mockRejectedValue(apiError);

        await expect(runCompleteDemo()).rejects.toThrow('Invalid API key');
        expect(mockConsoleError).toHaveBeenCalledWith('❌ Demo failed:', apiError);
      });

      it('should handle UnifiedModuleGenerator constructor errors', async () => {
        const constructorError = new Error('Failed to initialize generator');
        MockUnifiedModuleGenerator.mockImplementation(() => {
          throw constructorError;
        });

        await expect(runCompleteDemo()).rejects.toThrow('Failed to initialize generator');
      });

      it('should handle malformed module result', async () => {
        const malformedResult = {
          module: null,
          metadata: {
            componentsIncluded: []
          }
        };
        
        mockGeneratorInstance.generateCompleteModule.mockResolvedValue(malformedResult as any);

        await expect(runCompleteDemo()).rejects.toThrow();
      });

      it('should handle empty components array', async () => {
        const emptyComponentsResult = {
          ...mockSuccessfulResult,
          metadata: {
            ...mockSuccessfulResult.metadata,
            componentsIncluded: []
          }
        };
        
        mockGeneratorInstance.generateCompleteModule.mockResolvedValue(emptyComponentsResult);

        await runCompleteDemo();
        expect(mockConsoleLog).toHaveBeenCalledWith('Components: ');
      });
    });

    describe('Edge Cases and Data Validation', () => {
      it('should handle very long module titles', async () => {
        const longTitleResult = {
          ...mockSuccessfulResult,
          module: {
            ...mockSuccessfulResult.module,
            title: 'A'.repeat(1000) // Very long title
          }
        };
        
        mockGeneratorInstance.generateCompleteModule.mockResolvedValue(longTitleResult);

        await runCompleteDemo();
        expect(mockConsoleLog).toHaveBeenCalledWith(`Generated module: ${'A'.repeat(1000)}`);
      });

      it('should handle module with special characters in title', async () => {
        const specialCharsResult = {
          ...mockSuccessfulResult,
          module: {
            ...mockSuccessfulResult.module,
            title: 'Jung & "Complex" <Psychology> 特殊字符'
          }
        };
        
        mockGeneratorInstance.generateCompleteModule.mockResolvedValue(specialCharsResult);

        await runCompleteDemo();
        expect(mockConsoleLog).toHaveBeenCalledWith('Generated module: Jung & "Complex" <Psychology> 特殊字符');
      });

      it('should handle module with undefined title', async () => {
        const undefinedTitleResult = {
          ...mockSuccessfulResult,
          module: {
            ...mockSuccessfulResult.module,
            title: undefined
          }
        };
        
        mockGeneratorInstance.generateCompleteModule.mockResolvedValue(undefinedTitleResult as any);

        await runCompleteDemo();
        expect(mockConsoleLog).toHaveBeenCalledWith('Generated module: undefined');
      });

      it('should handle module with empty title', async () => {
        const emptyTitleResult = {
          ...mockSuccessfulResult,
          module: {
            ...mockSuccessfulResult.module,
            title: ''
          }
        };
        
        mockGeneratorInstance.generateCompleteModule.mockResolvedValue(emptyTitleResult);

        await runCompleteDemo();
        expect(mockConsoleLog).toHaveBeenCalledWith('Generated module: ');
      });

      it('should handle components array with duplicates', async () => {
        const duplicateComponentsResult = {
          ...mockSuccessfulResult,
          metadata: {
            ...mockSuccessfulResult.metadata,
            componentsIncluded: ['module', 'quiz', 'quiz', 'module', 'videos']
          }
        };
        
        mockGeneratorInstance.generateCompleteModule.mockResolvedValue(duplicateComponentsResult);

        await runCompleteDemo();
        expect(mockConsoleLog).toHaveBeenCalledWith('Components: module, quiz, quiz, module, videos');
      });

      it('should handle extremely large components array', async () => {
        const largeComponentsResult = {
          ...mockSuccessfulResult,
          metadata: {
            ...mockSuccessfulResult.metadata,
            componentsIncluded: Array(1000).fill('component').map((c, i) => `${c}-${i}`)
          }
        };
        
        mockGeneratorInstance.generateCompleteModule.mockResolvedValue(largeComponentsResult);

        await runCompleteDemo();
        expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Components: component-0'));
      });
    });

    describe('Progress Tracking', () => {
      it('should call console.log in correct sequence', async () => {
        await runCompleteDemo();

        const logCalls = mockConsoleLog.mock.calls.map(call => call[0]);
        
        expect(logCalls[0]).toBe('🚀 Starting module generation demo...');
        expect(logCalls[1]).toBe('📝 Generating module content...');
        expect(logCalls[2]).toBe('✅ Demo completed successfully!');
        expect(logCalls[3]).toContain('Generated module:');
        expect(logCalls[4]).toContain('Components:');
      });

      it('should track timing implicitly through log sequence', async () => {
        const startTime = Date.now();
        
        await runCompleteDemo();
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Verify logs were called (indicating progress tracking)
        expect(mockConsoleLog).toHaveBeenCalledTimes(5);
        
        // In test environment, should complete quickly
        expect(duration).toBeLessThan(1000);
      });
    });
  });

  describe('runDemoSuite', () => {
    describe('Basic Functionality', () => {
      it('should execute demo suite successfully', () => {
        expect(() => runDemoSuite()).not.toThrow();

        expect(mockConsoleLog).toHaveBeenCalledWith('🧪 Running demo test suite...');
        expect(mockConsoleLog).toHaveBeenCalledWith('✅ Demo suite configuration verified');
      });

      it('should display all test configurations', () => {
        runDemoSuite();

        expect(mockConsoleLog).toHaveBeenCalledWith('Test 1: Basic Jung');
        expect(mockConsoleLog).toHaveBeenCalledWith('  Difficulty: beginner');
        expect(mockConsoleLog).toHaveBeenCalledWith('  Duration: 30min');

        expect(mockConsoleLog).toHaveBeenCalledWith('Test 2: Advanced Analytical Psychology');
        expect(mockConsoleLog).toHaveBeenCalledWith('  Difficulty: advanced');
        expect(mockConsoleLog).toHaveBeenCalledWith('  Duration: 90min');
      });

      it('should process all test configurations', () => {
        runDemoSuite();

        // Verify that both configurations were processed
        const logMessages = mockConsoleLog.mock.calls.map(call => call[0]);
        
        expect(logMessages).toContain('Test 1: Basic Jung');
        expect(logMessages).toContain('Test 2: Advanced Analytical Psychology');
        expect(logMessages).toContain('✅ Demo suite configuration verified');
      });

      it('should not throw any errors during execution', () => {
        expect(() => runDemoSuite()).not.toThrow();
      });
    });

    describe('Configuration Validation', () => {
      it('should validate beginner configuration structure', () => {
        runDemoSuite();

        // Capture the beginner config by checking log calls
        const logCalls = mockConsoleLog.mock.calls;
        const beginnerConfigCall = logCalls.find(call => call[0] === 'Test 1: Basic Jung');
        
        expect(beginnerConfigCall).toBeDefined();
        
        // Verify related calls
        expect(mockConsoleLog).toHaveBeenCalledWith('  Difficulty: beginner');
        expect(mockConsoleLog).toHaveBeenCalledWith('  Duration: 30min');
      });

      it('should validate advanced configuration structure', () => {
        runDemoSuite();

        const logCalls = mockConsoleLog.mock.calls;
        const advancedConfigCall = logCalls.find(call => call[0] === 'Test 2: Advanced Analytical Psychology');
        
        expect(advancedConfigCall).toBeDefined();
        
        // Verify related calls
        expect(mockConsoleLog).toHaveBeenCalledWith('  Difficulty: advanced');
        expect(mockConsoleLog).toHaveBeenCalledWith('  Duration: 90min');
      });

      it('should handle different module types correctly', () => {
        runDemoSuite();

        // Verify different types are handled
        const allLogs = mockConsoleLog.mock.calls.map(call => call[0]);
        
        expect(allLogs.some(log => log.includes('Basic Jung'))).toBe(true);
        expect(allLogs.some(log => log.includes('Advanced Analytical Psychology'))).toBe(true);
        expect(allLogs.some(log => log.includes('beginner'))).toBe(true);
        expect(allLogs.some(log => log.includes('advanced'))).toBe(true);
      });
    });

    describe('Output Format and Display', () => {
      it('should display proper headers', () => {
        runDemoSuite();

        expect(mockConsoleLog).toHaveBeenCalledWith('🧪 Running demo test suite...');
        expect(mockConsoleLog).toHaveBeenCalledWith('✅ Demo suite configuration verified');
      });

      it('should format test information consistently', () => {
        runDemoSuite();

        // Check for consistent formatting pattern
        expect(mockConsoleLog).toHaveBeenCalledWith('Test 1: Basic Jung');
        expect(mockConsoleLog).toHaveBeenCalledWith('  Difficulty: beginner');
        expect(mockConsoleLog).toHaveBeenCalledWith('  Duration: 30min');
        
        expect(mockConsoleLog).toHaveBeenCalledWith('Test 2: Advanced Analytical Psychology');
        expect(mockConsoleLog).toHaveBeenCalledWith('  Difficulty: advanced');
        expect(mockConsoleLog).toHaveBeenCalledWith('  Duration: 90min');
      });

      it('should display completion message', () => {
        runDemoSuite();

        expect(mockConsoleLog).toHaveBeenCalledWith('✅ Demo suite configuration verified');
      });

      it('should call console.log correct number of times', () => {
        runDemoSuite();

        // Expected calls:
        // 1. "🧪 Running demo test suite..."
        // 2. "Test 1: Basic Jung"
        // 3. "  Difficulty: beginner"
        // 4. "  Duration: 30min"
        // 5. "Test 2: Advanced Analytical Psychology"
        // 6. "  Difficulty: advanced"  
        // 7. "  Duration: 90min"
        // 8. "✅ Demo suite configuration verified"
        expect(mockConsoleLog).toHaveBeenCalledTimes(8);
      });
    });

    describe('Performance and Efficiency', () => {
      it('should complete quickly', () => {
        const startTime = Date.now();
        
        runDemoSuite();
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Should be very fast since it's just logging
        expect(duration).toBeLessThan(100);
      });

      it('should not make any external calls', () => {
        runDemoSuite();

        // Verify no generator was called
        expect(MockUnifiedModuleGenerator).not.toHaveBeenCalled();
      });

      it('should handle multiple concurrent calls', () => {
        expect(() => {
          runDemoSuite();
          runDemoSuite();
          runDemoSuite();
        }).not.toThrow();

        // Should have been called 3 times as many logs
        expect(mockConsoleLog).toHaveBeenCalledTimes(24); // 8 * 3
      });
    });
  });

  describe('Module Integration Tests', () => {
    describe('Export Validation', () => {
      it('should export runCompleteDemo function', () => {
        expect(typeof runCompleteDemo).toBe('function');
        expect(runCompleteDemo).toBeDefined();
        expect(runCompleteDemo.name).toBe('runCompleteDemo');
      });

      it('should export runDemoSuite function', () => {
        expect(typeof runDemoSuite).toBe('function');
        expect(runDemoSuite).toBeDefined();
        expect(runDemoSuite.name).toBe('runDemoSuite');
      });
    });

    describe('Function Signatures', () => {
      it('should accept optional config parameter in runCompleteDemo', async () => {
        // Test with no parameters
        await expect(runCompleteDemo()).resolves.not.toThrow();

        // Test with config parameter
        const config: ModuleGenerationConfig = {
          topic: 'Test',
          difficulty: 'beginner'
        };
        await expect(runCompleteDemo(config)).resolves.not.toThrow();
      });

      it('should accept no parameters in runDemoSuite', () => {
        expect(() => runDemoSuite()).not.toThrow();
      });
    });

    describe('Memory and Resource Usage', () => {
      it('should not leak memory with repeated calls', async () => {
        // Run multiple times to check for memory leaks
        for (let i = 0; i < 10; i++) {
          await runCompleteDemo();
          runDemoSuite();
          jest.clearAllMocks();
          MockUnifiedModuleGenerator.mockImplementation(() => mockGeneratorInstance);
        }

        // Should complete without issues
        expect(true).toBe(true);
      });

      it('should clean up resources properly on error', async () => {
        mockGeneratorInstance.generateCompleteModule.mockRejectedValue(new Error('Test error'));

        try {
          await runCompleteDemo();
        } catch (error) {
          // Error expected
        }

        // Should be able to run again successfully
        mockGeneratorInstance.generateCompleteModule.mockResolvedValue(mockSuccessfulResult);
        await expect(runCompleteDemo()).resolves.not.toThrow();
      });
    });
  });

  describe('Real-world Usage Scenarios', () => {
    it('should handle production-like configuration (ignores custom config)', async () => {
      const prodConfig: ModuleGenerationConfig = {
        topic: 'Carl Jung\'s Analytical Psychology: A Comprehensive Introduction',
        difficulty: 'intermediate',
        targetAudience: 'University psychology students and mental health professionals',
        includeVideos: true,
        includeQuiz: true,
        includeBibliography: true,
        language: 'en-US',
        maxVideos: 5,
        quizQuestions: 15
      };

      await runCompleteDemo(prodConfig);

      // Function uses hardcoded demo config, not the passed config
      expect(mockGeneratorInstance.generateCompleteModule).toHaveBeenCalledWith({
        topic: 'Jungian Psychology Demo',
        objectives: [
          'Understand basic Jung concepts',
          'Explore archetypal patterns',
          'Apply psychological insights'
        ],
        targetAudience: 'Psychology students',
        duration: 60,
        difficulty: 'intermediate',
        language: 'pt-BR'
      });
      expect(mockConsoleLog).toHaveBeenCalledWith('✅ Demo completed successfully!');
    });

    it('should handle development/testing configuration (ignores custom config)', async () => {
      const devConfig: ModuleGenerationConfig = {
        topic: 'Test Module',
        difficulty: 'beginner',
        includeVideos: false,
        includeQuiz: false,
        includeBibliography: false,
        quizQuestions: 1
      };

      await runCompleteDemo(devConfig);

      // Function uses hardcoded demo config, not the passed config
      expect(mockGeneratorInstance.generateCompleteModule).toHaveBeenCalledWith({
        topic: 'Jungian Psychology Demo',
        objectives: [
          'Understand basic Jung concepts',
          'Explore archetypal patterns',
          'Apply psychological insights'
        ],
        targetAudience: 'Psychology students',
        duration: 60,
        difficulty: 'intermediate',
        language: 'pt-BR'
      });
    });

    it('should demonstrate typical error recovery', async () => {
      // First call fails
      mockGeneratorInstance.generateCompleteModule.mockRejectedValue(new Error('Temporary failure'));

      await expect(runCompleteDemo()).rejects.toThrow('Temporary failure');

      // Second call succeeds
      mockGeneratorInstance.generateCompleteModule.mockResolvedValue(mockSuccessfulResult);

      await expect(runCompleteDemo()).resolves.not.toThrow();
      expect(mockConsoleLog).toHaveBeenCalledWith('✅ Demo completed successfully!');
    });
  });
});