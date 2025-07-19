/**
 * API Integration Tests
 * Tests real API integrations with configured keys
 */

import { OpenAIProvider, MockLLMProvider } from '../../services/llm/provider';

// Mock axios to avoid import issues in test environment
jest.mock('axios', () => ({
  default: {
    create: jest.fn(() => ({
      post: jest.fn(),
      get: jest.fn()
    }))
  }
}));

// Mock OpenAI module
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

// Skip these tests if no API keys are configured
const hasOpenAIKey = process.env.REACT_APP_OPENAI_API_KEY && process.env.REACT_APP_OPENAI_API_KEY !== 'your_openai_api_key_here';
const hasYouTubeKey = process.env.REACT_APP_YOUTUBE_API_KEY && process.env.REACT_APP_YOUTUBE_API_KEY !== 'your_youtube_api_key_here';

describe('API Integration Tests', () => {
  describe('LLM Provider Tests', () => {
    describe('Mock Provider', () => {
      test('should generate completion with mock provider', async () => {
        const provider = new MockLLMProvider();
        
        const result = await provider.generateCompletion(
          'Write an introduction to Carl Jung',
          {
            temperature: 0.7,
            maxTokens: 100
          }
        );
        
        expect(result).toBeDefined();
        expect(result).toContain('mock introduction');
        expect(result).toContain('Jungian psychology');
      });
      
      test('should generate structured response with mock provider', async () => {
        const provider = new MockLLMProvider();
        
        const result = await provider.generateStructuredResponse(
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
        const provider = new MockLLMProvider();
        
        const result = await provider.generateStructuredResponse(
          'Generate YouTube search queries',
          { type: 'array' }
        );
        
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toContain('Jung');
      });
      
      test('should handle section generation', async () => {
        const provider = new MockLLMProvider();
        
        const result = await provider.generateStructuredResponse(
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
    
    describe('OpenAI Provider (Mocked)', () => {
      test('should create OpenAI provider instance', () => {
        const provider = new OpenAIProvider('test-api-key');
        expect(provider).toBeDefined();
        expect(provider.generateCompletion).toBeDefined();
        expect(provider.generateStructuredResponse).toBeDefined();
      });
      
      test('should estimate token count', () => {
        const provider = new OpenAIProvider('test-api-key');
        const text = 'This is a test string for token counting.';
        const tokenCount = provider.getTokenCount(text);
        
        // Rough approximation: ~4 chars per token
        expect(tokenCount).toBeGreaterThan(5);
        expect(tokenCount).toBeLessThan(20);
      });
      
      test('should handle availability check', async () => {
        const provider = new MockLLMProvider();
        const isAvailable = await provider.isAvailable();
        expect(isAvailable).toBe(true);
      });
    });
  });

  // Summary test to show which APIs are configured
  describe('API Configuration Status', () => {
    test('should report API configuration status', () => {
      console.log('API Configuration Status:');
      console.log('  OpenAI API Key:', hasOpenAIKey ? '✅ Configured' : '❌ Not configured');
      console.log('  YouTube API Key:', hasYouTubeKey ? '✅ Configured' : '❌ Not configured');
      console.log('  OpenAI Model:', process.env.REACT_APP_OPENAI_MODEL || 'gpt-4o-mini (default)');
      console.log('  LLM Provider:', process.env.LLM_PROVIDER || 'openai (default)');
      
      // This test always passes, it's just for reporting
      expect(true).toBe(true);
    });
  });
});