/**
 * Final Infrastructure Test - Comprehensive validation
 * This test validates that the core Jest infrastructure is working properly
 */

import { MockLLMProvider } from './services/llm/providers/mock';
import { ModuleGenerator, GenerationOptions } from './services/modules/moduleGenerator';
import { DifficultyLevel } from './schemas/module.schema';

// Properly mock ModuleService for testing
jest.mock('./services/modules/moduleService', () => ({
  ModuleService: {
    saveDraft: jest.fn().mockResolvedValue(undefined),
    getDrafts: jest.fn().mockResolvedValue([]),
    deleteDraft: jest.fn().mockResolvedValue(undefined),
    createModule: jest.fn().mockImplementation(async (module) => {
      // Return the module with proper structure
      return {
        ...module,
        id: module.id || 'test-id',
        metadata: {
          ...module.metadata,
          status: 'published'
        }
      };
    })
  }
}));

describe('Final Infrastructure Test', () => {
  let provider: MockLLMProvider;
  let generator: ModuleGenerator;

  beforeEach(() => {
    provider = new MockLLMProvider(0);
    generator = new ModuleGenerator(provider);
  });

  it('should successfully import and instantiate all components', () => {
    expect(MockLLMProvider).toBeDefined();
    expect(ModuleGenerator).toBeDefined();
    expect(DifficultyLevel).toBeDefined();
    expect(provider).toBeInstanceOf(MockLLMProvider);
    expect(generator).toBeInstanceOf(ModuleGenerator);
  });

  it('should generate LLM responses correctly', async () => {
    const response = await provider.generateCompletion('Generate a title for Jungian psychology');
    expect(response).toBeDefined();
    expect(response.content).toBe('Introduction to Jungian Psychology');
    expect(response.usage).toBeDefined();
  });

  it('should generate structured content correctly', async () => {
    const content = await provider.generateStructuredOutput(
      'Create comprehensive educational content about shadow psychology',
      {}
    );
    expect(content).toBeDefined();
    expect(content).toHaveProperty('introduction');
    expect(content).toHaveProperty('sections');
    expect(Array.isArray((content as any).sections)).toBe(true);
  });

  it('should process a simple module generation without errors', async () => {
    const options: GenerationOptions = {
      topic: 'Shadow Work',
      difficulty: DifficultyLevel.BEGINNER,
      duration: 30,
      includeQuiz: false,
      includeVideos: false,
      includeBibliography: false
    };

    // Use a simplified approach to avoid complex generation
    let result;
    try {
      result = await generator.generateModule(options);
    } catch (error) {
      console.error('Generation failed:', error);
      throw error;
    }

    // Basic validation
    expect(result).toBeDefined();
    if (result) {
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('difficultyLevel');
      expect(result.difficultyLevel).toBe(DifficultyLevel.BEGINNER);
    }
  });

  it('should collect coverage data for source files', () => {
    // This test just exercises the code to ensure coverage is collected
    const provider2 = new MockLLMProvider(100);
    expect(provider2.getTokenCount('test string')).toBeGreaterThan(0);
    
    const generator2 = new ModuleGenerator();
    expect(generator2).toBeDefined();
  });

  it('should validate test environment setup', () => {
    // Validate crypto mocks
    expect(globalThis.crypto).toBeDefined();
    expect(globalThis.crypto.getRandomValues).toBeDefined();
    
    // Validate localStorage mock
    expect(localStorage).toBeDefined();
    expect(localStorage.setItem).toBeDefined();
    
    // Validate Jest setup
    expect(jest).toBeDefined();
    expect(jest.fn).toBeDefined();
  });
});