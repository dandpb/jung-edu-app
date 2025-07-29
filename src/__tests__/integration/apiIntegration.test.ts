/**
 * API Integration Tests
 * Tests real API integrations with configured keys
 */

import { OpenAIProvider, MockLLMProvider } from '../../services/llm/provider';
import { 
  setupIntegrationTest, 
  getTestLLMProvider, 
  testWithAPI, 
  getAPIStatus,
  measureAPICall 
} from '../../test-utils/integrationTestHelpers';

// Mock axios to avoid import issues in test environment
jest.mock('axios', () => ({
  default: {
    create: jest.fn(() => ({
      post: jest.fn(),
      get: jest.fn()
    }))
  }
}));

// Mock OpenAI module when not using real API
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn()
      }
    },
    models: {
      list: jest.fn()
    }
  }))
}));

describe('API Integration Tests', () => {
  setupIntegrationTest('API Integration Tests');
  
  // Display API configuration status
  beforeAll(() => {
    console.log(getAPIStatus());
  });
  
  describe('LLM Provider Tests', () => {
    describe('Mock Provider (Always Available)', () => {
      test('should generate completion with mock provider', async () => {
        const provider = new MockLLMProvider(50); // Fast mock with 50ms delay
        
        const { result, duration } = await measureAPICall(
          'Mock completion',
          () => provider.generateCompletion(
            'Write an introduction to Carl Jung',
            {
              temperature: 0.7,
              maxTokens: 100
            }
          )
        );
        
        expect(result).toBeDefined();
        expect(result.content).toContain('mock introduction');
        expect(result.content).toContain('Jungian psychology');
        expect(duration).toBeLessThan(100); // Mocks should be fast
      });
      
      test('should generate structured response with mock provider', async () => {
        const provider = new MockLLMProvider(50); // Fast mock with 50ms delay
        
        const result = await provider.generateStructuredOutput(
          'Generate quiz questions about Jung',
          { type: 'array' },
          { temperature: 0.2 }
        );
        
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        
        // For quiz questions, check the structure
        if (result.length > 0 && typeof result[0] === 'object') {
          expect(result[0]).toHaveProperty('question');
          expect(result[0]).toHaveProperty('correctAnswer');
        }
      });
      
      test('should handle video search queries', async () => {
        const provider = new MockLLMProvider(50); // Fast mock with 50ms delay
        
        const result = await provider.generateStructuredOutput(
          'Generate YouTube search queries',
          { type: 'array' }
        );
        
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toContain('Jung');
      });
      
      test('should handle section generation', async () => {
        const provider = new MockLLMProvider(50); // Fast mock with 50ms delay
        
        const result = await provider.generateStructuredOutput(
          'Generate sections outline',
          { type: 'array' }
        );
        
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        if (typeof result[0] === 'object') {
          expect(result[0]).toHaveProperty('title');
          expect(result[0]).toHaveProperty('concepts');
        }
      });
    });
    
    describe('Dynamic Provider Tests', () => {
      test('should use appropriate provider based on configuration', async () => {
        const provider = await getTestLLMProvider();
        
        expect(provider).toBeDefined();
        expect(provider.generateCompletion).toBeDefined();
        expect(provider.generateStructuredOutput).toBeDefined();
        
        const isAvailable = await provider.isAvailable();
        expect(isAvailable).toBe(true);
      });
      
      testWithAPI('openai', 'should generate real completion from OpenAI', async () => {
        const provider = await getTestLLMProvider();
        
        const { result, duration } = await measureAPICall(
          'OpenAI completion',
          () => provider.generateCompletion(
            'Write a brief introduction to Carl Jung in 50 words',
            {
              temperature: 0.7,
              maxTokens: 100
            }
          )
        );
        
        expect(result).toBeDefined();
        expect(result.length).toBeGreaterThan(50);
        expect(result.toLowerCase()).toContain('jung');
        console.log(`✅ Real API response received (${result.length} chars in ${duration.toFixed(0)}ms)`);
      });
      
      testWithAPI('openai', 'should generate structured quiz from OpenAI', async () => {
        const provider = await getTestLLMProvider();
        
        const { result, duration } = await measureAPICall(
          'OpenAI structured response',
          () => provider.generateStructuredOutput(
            'Generate 2 quiz questions about Carl Jung\'s concept of the collective unconscious',
            { 
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  question: { type: 'string' },
                  options: { type: 'array', items: { type: 'string' } },
                  correctAnswer: { type: 'number' },
                  explanation: { type: 'string' }
                }
              }
            },
            { temperature: 0.2 }
          )
        );
        
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(2);
        expect(result[0]).toHaveProperty('question');
        expect(result[0]).toHaveProperty('correctAnswer');
        console.log(`✅ Generated ${result.length} quiz questions in ${duration.toFixed(0)}ms`);
      });
    });
    
    describe('Provider Capabilities', () => {
      test('should estimate token count correctly', async () => {
        const provider = await getTestLLMProvider();
        const text = 'This is a test string for token counting.';
        const tokenCount = provider.getTokenCount(text);
        
        // Rough approximation: ~4 chars per token
        expect(tokenCount).toBeGreaterThan(5);
        expect(tokenCount).toBeLessThan(20);
      });
      
      test('should handle availability check', async () => {
        const provider = await getTestLLMProvider();
        const isAvailable = await provider.isAvailable();
        expect(isAvailable).toBe(true);
      });
    });
  });

  // Summary test to show which APIs are configured
  describe('API Configuration Summary', () => {
    test('should report final API configuration status', () => {
      const config = {
        mode: process.env.USE_REAL_API === 'true' ? 'REAL' : 'MOCK',
        openAI: process.env.REACT_APP_OPENAI_API_KEY ? '✅' : '❌',
        youTube: process.env.REACT_APP_YOUTUBE_API_KEY ? '✅' : '❌',
        model: process.env.REACT_APP_OPENAI_MODEL || 'gpt-4o-mini',
        provider: process.env.LLM_PROVIDER || 'openai'
      };
      
      console.log(`
📊 Test Summary:
   Mode: ${config.mode}
   OpenAI: ${config.openAI}
   YouTube: ${config.youTube}
   Model: ${config.model}
   Provider: ${config.provider}
      `);
      
      // This test always passes, it's just for reporting
      expect(true).toBe(true);
    });
  });
});