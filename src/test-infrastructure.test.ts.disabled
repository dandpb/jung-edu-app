/**
 * Infrastructure validation test
 * Tests basic Jest setup, imports, and coverage collection
 */

import { MockLLMProvider } from './services/llm/providers/mock';
import { ModuleGenerator } from './services/modules/moduleGenerator';
import { DifficultyLevel } from './schemas/module.schema';

describe('Jest Infrastructure Validation', () => {
  it('should import modules correctly', () => {
    expect(MockLLMProvider).toBeDefined();
    expect(ModuleGenerator).toBeDefined();
    expect(DifficultyLevel).toBeDefined();
  });

  it('should create mock LLM provider instance', async () => {
    const provider = new MockLLMProvider(100);
    expect(provider).toBeDefined();
    expect(await provider.isAvailable()).toBe(true);
  });

  it('should generate mock completion with proper content', async () => {
    const provider = new MockLLMProvider(0); // No delay for testing
    
    const response = await provider.generateCompletion('Generate a title for Jungian psychology');
    
    expect(response).toBeDefined();
    expect(response.content).toBeDefined();
    expect(typeof response.content).toBe('string');
    expect(response.content).toBe('Introduction to Jungian Psychology');
    expect(response.usage).toBeDefined();
  });

  it('should create module generator with mock provider', () => {
    const provider = new MockLLMProvider(0);
    const generator = new ModuleGenerator(provider);
    
    expect(generator).toBeDefined();
  });

  it('should handle basic module generation flow', async () => {
    const provider = new MockLLMProvider(0);
    const generator = new ModuleGenerator(provider);
    
    const options = {
      topic: 'Collective Unconscious',
      difficulty: DifficultyLevel.INTERMEDIATE,
      duration: 60,
      language: 'en',
      includeVideos: false,
      includeQuiz: false,
      includeBibliography: false
    };
    
    // This should not throw an error
    expect(async () => {
      await generator.generateModule(options);
    }).not.toThrow();
  });
});