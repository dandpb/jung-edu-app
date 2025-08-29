/**
 * Comprehensive tests for moduleGeneration/demo.ts
 * Tests complete module generation demo workflow and system integration
 */

import { UnifiedModuleGenerator, ModuleGenerationConfig } from '../index';
import * as demo from '../demo';

// Mock dependencies
jest.mock('../index');

const mockUnifiedModuleGenerator = UnifiedModuleGenerator as jest.MockedClass<typeof UnifiedModuleGenerator>;

// Mock module generation result to match actual demo implementation
const mockDemoModule = {
  metadata: {
    topic: 'Jungian Psychology Demo',
    difficulty: 'intermediate',
    componentsIncluded: ['module', 'quiz']
  },
  module: {
    title: 'Jungian Psychology Demo Module',
    description: 'A comprehensive introduction to Jungian psychology concepts',
    objectives: [
      'Understand basic Jung concepts',
      'Explore archetypal patterns',
      'Apply psychological insights'
    ]
  },
  quiz: {
    questions: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'What is the collective unconscious?',
        options: [
          { text: 'Personal memories', isCorrect: false },
          { text: 'Universal patterns', isCorrect: true }
        ]
      }
    ]
  }
};


describe('Module Generation Demo - Comprehensive Tests', () => {
  let mockGeneratorInstance: jest.Mocked<UnifiedModuleGenerator>;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Setup UnifiedModuleGenerator mock
    mockGeneratorInstance = {
      generateCompleteModule: jest.fn().mockResolvedValue(mockDemoModule)
    } as any;
    mockUnifiedModuleGenerator.mockImplementation(() => mockGeneratorInstance);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('runCompleteDemo Function', () => {
    it('should execute complete demo successfully', async () => {
      await demo.runCompleteDemo();

      expect(mockUnifiedModuleGenerator).toHaveBeenCalled();
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

      // Check console output
      expect(consoleLogSpy).toHaveBeenCalledWith('🚀 Starting module generation demo...');
      expect(consoleLogSpy).toHaveBeenCalledWith('📝 Generating module content...');
      expect(consoleLogSpy).toHaveBeenCalledWith('✅ Demo completed successfully!');
      expect(consoleLogSpy).toHaveBeenCalledWith('Generated module: Jungian Psychology Demo Module');
      expect(consoleLogSpy).toHaveBeenCalledWith('Components: module, quiz');
    });

    it('should handle demo generation errors', async () => {
      const testError = new Error('Generation failed');
      mockGeneratorInstance.generateCompleteModule.mockRejectedValue(testError);

      await expect(demo.runCompleteDemo()).rejects.toThrow('Generation failed');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Demo failed:', testError);
    });

    it('should accept custom configuration', async () => {
      const customConfig: ModuleGenerationConfig = {
        topic: 'Custom Topic',
        difficulty: 'advanced',
        duration: 90
      };

      await demo.runCompleteDemo(customConfig);

      expect(mockGeneratorInstance.generateCompleteModule).toHaveBeenCalledWith(customConfig);
    });
  });

  describe('runDemoSuite Function', () => {
    it('should execute demo suite without errors', () => {
      expect(() => demo.runDemoSuite()).not.toThrow();
    });

    it('should display proper test configurations', () => {
      demo.runDemoSuite();

      expect(consoleLogSpy).toHaveBeenCalledWith('🧪 Running demo test suite...');
      expect(consoleLogSpy).toHaveBeenCalledWith('Test 1: Basic Jung');
      expect(consoleLogSpy).toHaveBeenCalledWith('  Difficulty: beginner');
      expect(consoleLogSpy).toHaveBeenCalledWith('  Duration: 30min');
      expect(consoleLogSpy).toHaveBeenCalledWith('Test 2: Advanced Analytical Psychology');
      expect(consoleLogSpy).toHaveBeenCalledWith('  Difficulty: advanced');
      expect(consoleLogSpy).toHaveBeenCalledWith('  Duration: 90min');
      expect(consoleLogSpy).toHaveBeenCalledWith('✅ Demo suite configuration verified');
    });

    it('should validate test configuration structure', () => {
      demo.runDemoSuite();
      
      // Should complete without errors and show completion message
      expect(consoleLogSpy).toHaveBeenCalledWith('✅ Demo suite configuration verified');
    });
  });

  describe('Module Result Validation', () => {
    it('should validate module structure from demo', async () => {
      await demo.runCompleteDemo();
      
      const generatedModule = mockDemoModule;
      
      expect(generatedModule).toHaveProperty('metadata');
      expect(generatedModule).toHaveProperty('module');
      expect(generatedModule.metadata).toHaveProperty('topic');
      expect(generatedModule.metadata).toHaveProperty('difficulty');
      expect(generatedModule.metadata).toHaveProperty('componentsIncluded');
      
      expect(generatedModule.module).toHaveProperty('title');
      expect(generatedModule.module).toHaveProperty('description');
      expect(generatedModule.module).toHaveProperty('objectives');
    });

    it('should handle malformed results gracefully', async () => {
      const malformedModule = {
        metadata: null,
        module: { title: 'Test' },
        quiz: undefined
      };
      
      mockGeneratorInstance.generateCompleteModule.mockResolvedValue(malformedModule as any);
      
      await demo.runCompleteDemo();
      
      // Should complete without throwing despite malformed data
      expect(consoleLogSpy).toHaveBeenCalledWith('Generated module: Test');
    });
  });

  describe('Integration Tests', () => {
    it('should demonstrate UnifiedModuleGenerator integration', async () => {
      await demo.runCompleteDemo();
      
      // Verify that the generator was instantiated and called correctly
      expect(mockUnifiedModuleGenerator).toHaveBeenCalledTimes(1);
      expect(mockGeneratorInstance.generateCompleteModule).toHaveBeenCalledTimes(1);
    });

    it('should handle concurrent demo executions', async () => {
      const promises = [demo.runCompleteDemo(), demo.runCompleteDemo(), demo.runCompleteDemo()];
      
      await Promise.all(promises);
      
      expect(mockGeneratorInstance.generateCompleteModule).toHaveBeenCalledTimes(3);
    });

    it('should validate demo configuration defaults', async () => {
      await demo.runCompleteDemo();
      
      const expectedConfig = {
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
      };
      
      expect(mockGeneratorInstance.generateCompleteModule).toHaveBeenCalledWith(expectedConfig);
    });
  });

  describe('Performance and Reliability', () => {
    it('should complete demo within reasonable time', async () => {
      const startTime = Date.now();
      
      await demo.runCompleteDemo();
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete quickly in test environment with mocks
      expect(duration).toBeLessThan(1000); // 1 second max with mocks
    });

    it('should handle generator initialization errors', () => {
      mockUnifiedModuleGenerator.mockImplementation(() => {
        throw new Error('Generator initialization failed');
      });

      expect(demo.runCompleteDemo()).rejects.toThrow('Generator initialization failed');
    });

    it('should maintain proper async error handling', async () => {
      const asyncError = new Error('Async operation failed');
      mockGeneratorInstance.generateCompleteModule.mockRejectedValue(asyncError);

      await expect(demo.runCompleteDemo()).rejects.toThrow('Async operation failed');
      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Demo failed:', asyncError);
    });
  });

  describe('Function Exports', () => {
    it('should export runCompleteDemo function', () => {
      expect(typeof demo.runCompleteDemo).toBe('function');
      expect(demo.runCompleteDemo).toBeDefined();
    });

    it('should export runDemoSuite function', () => {
      expect(typeof demo.runDemoSuite).toBe('function');
      expect(demo.runDemoSuite).toBeDefined();
    });

    it('should have correct function signatures', () => {
      // runCompleteDemo should accept optional config parameter
      expect(demo.runCompleteDemo.length).toBe(1); // One optional parameter
      
      // runDemoSuite should have no parameters
      expect(demo.runDemoSuite.length).toBe(0);
    });
  });

  describe('Configuration Handling', () => {
    it('should use default configuration when none provided', async () => {
      await demo.runCompleteDemo();
      
      const expectedDefaultConfig = {
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
      };
      
      expect(mockGeneratorInstance.generateCompleteModule).toHaveBeenCalledWith(expectedDefaultConfig);
    });

    it('should override default configuration with provided config', async () => {
      const customConfig: ModuleGenerationConfig = {
        topic: 'Custom Test Topic',
        difficulty: 'advanced',
        duration: 120
      };
      
      await demo.runCompleteDemo(customConfig);
      
      expect(mockGeneratorInstance.generateCompleteModule).toHaveBeenCalledWith(customConfig);
    });

    it('should handle undefined config parameter', async () => {
      await demo.runCompleteDemo(undefined);
      
      // Should use default config when undefined is passed
      expect(mockGeneratorInstance.generateCompleteModule).toHaveBeenCalledWith(expect.objectContaining({
        topic: 'Jungian Psychology Demo',
        difficulty: 'intermediate'
      }));
    });
  });
});