/**
 * Debug test for ModuleGenerator to understand what's failing
 */

import { ModuleGenerator, GenerationOptions } from './services/modules/moduleGenerator';
import { MockLLMProvider } from './services/llm/providers/mock';
import { DifficultyLevel } from './schemas/module.schema';

// Mock the ModuleService
jest.mock('./services/modules/moduleService', () => ({
  ModuleService: {
    saveDraft: jest.fn().mockResolvedValue(undefined),
    getDrafts: jest.fn().mockResolvedValue([]),
    deleteDraft: jest.fn().mockResolvedValue(undefined),
    createModule: jest.fn().mockImplementation((module) => {
      console.log('📦 ModuleService.createModule called with:', module?.id);
      return Promise.resolve(module);
    })
  }
}));

describe('Debug ModuleGenerator', () => {
  it('should debug the generation process step by step', async () => {
    console.log('🔍 Starting debug test...');
    
    const mockProvider = new MockLLMProvider(0);
    const generator = new ModuleGenerator(mockProvider);
    
    const options: GenerationOptions = {
      topic: 'Test Topic',
      difficulty: DifficultyLevel.BEGINNER,
      duration: 60
    };

    console.log('🔧 Testing MockLLMProvider directly...');
    const titleResponse = await mockProvider.generateCompletion('Generate a title');
    console.log('📝 Title response:', titleResponse);
    
    const contentResponse = await mockProvider.generateStructuredOutput(
      'Create comprehensive educational content', 
      {}
    );
    console.log('📄 Content response:', contentResponse);

    console.log('🚀 Starting module generation...');
    
    let result;
    try {
      result = await generator.generateModule(options);
      console.log('✅ Generation result:', result ? 'defined' : 'undefined');
      console.log('📋 Result keys:', result ? Object.keys(result) : 'none');
    } catch (error) {
      console.error('❌ Generation error:', error);
    }

    // Test individual steps
    console.log('🔍 Testing individual methods...');
    try {
      const title = await (generator as any).generateTitle(options);
      console.log('📝 Title:', title);
      
      const description = await (generator as any).generateDescription(options);
      console.log('📄 Description:', description);
      
      const tags = await (generator as any).generateTags(options);
      console.log('🏷️ Tags:', tags);
    } catch (error) {
      console.error('❌ Individual method error:', error);
    }

    expect(true).toBe(true); // Always pass to see logs
  });
});