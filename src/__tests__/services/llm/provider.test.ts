import { OpenAIProvider, MockLLMProvider } from '../../../services/llm/provider';

// Set timeout for tests that involve retries
jest.setTimeout(10000);

// Mock openai module
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

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider;
  let mockOpenAIApi: any;
  const mockApiKey = 'test-api-key';
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock OpenAI API instance
    mockOpenAIApi = {
      chat: {
        completions: {
          create: jest.fn()
        }
      },
      models: {
        list: jest.fn()
      }
    };
    
    // Reset the module and re-mock
    jest.resetModules();
    jest.doMock('openai', () => ({
      OpenAI: jest.fn().mockImplementation(() => mockOpenAIApi)
    }));
    
    // Now require the provider after mocking
    const { OpenAIProvider: OpenAIProviderClass } = require('../../../services/llm/provider');
    provider = new OpenAIProviderClass(mockApiKey, 'gpt-3.5-turbo');
  });
  
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    // Clear any module cache to ensure fresh mocks
    jest.resetModules();
  });
  
  describe('constructor', () => {
    it('should initialize with OpenAI provider', () => {
      expect(provider).toBeDefined();
      // Check that provider has the expected methods instead of instanceof check
      expect(typeof provider.generateCompletion).toBe('function');
      expect(typeof provider.generateStructuredOutput).toBe('function');
      expect(typeof provider.getTokenCount).toBe('function');
      expect(typeof provider.isAvailable).toBe('function');
    });
  });
  
  describe('generateCompletion', () => {
    it('should generate completion successfully', async () => {
      mockOpenAIApi.chat.completions.create.mockResolvedValueOnce({
        choices: [{
          message: {
            content: 'Generated content about Jungian psychology'
          }
        }]
      });
      
      const result = await provider.generateCompletion('Test prompt');
      
      expect(result).toBeDefined();
      expect(result.content).toBe('Generated content about Jungian psychology');
      expect(mockOpenAIApi.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: expect.any(String) },
          { role: 'user', content: 'Test prompt' }
        ],
        temperature: 0.7,
        max_tokens: 3000
      });
    });
    
    it('should handle API errors', async () => {
      // Mock the delay to speed up test
      jest.spyOn(provider as any, 'delay').mockImplementation(() => Promise.resolve());
      
      mockOpenAIApi.chat.completions.create
        .mockRejectedValueOnce(new Error('Rate limit exceeded'))
        .mockRejectedValueOnce(new Error('Rate limit exceeded'))
        .mockRejectedValueOnce(new Error('Rate limit exceeded'));
      
      await expect(provider.generateCompletion('Test prompt'))
        .rejects.toThrow('Failed after 3 attempts: Rate limit exceeded');
      
      expect(mockOpenAIApi.chat.completions.create).toHaveBeenCalledTimes(3);
    });
    
    it('should retry on temporary failures', async () => {
      // Mock the delay to speed up test
      jest.spyOn(provider as any, 'delay').mockImplementation(() => Promise.resolve());
      
      mockOpenAIApi.chat.completions.create
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          choices: [{
            message: { content: 'Success after retry' }
          }]
        });
      
      const result = await provider.generateCompletion('Test prompt');
      
      expect(result.content).toBe('Success after retry');
      expect(mockOpenAIApi.chat.completions.create).toHaveBeenCalledTimes(2);
    });
    
    it('should respect temperature and max tokens options', async () => {
      mockOpenAIApi.chat.completions.create.mockResolvedValueOnce({
        choices: [{
          message: { content: 'Test response' }
        }]
      });
      
      const result = await provider.generateCompletion('Test prompt', {
        temperature: 0.5,
        maxTokens: 1000
      });
      
      expect(result).toBeDefined();
      
      expect(mockOpenAIApi.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.5,
          max_tokens: 1000
        })
      );
    });
  });
  
  describe('generateStructuredOutput', () => {
    it('should generate and parse JSON output', async () => {
      const mockStructuredData = {
        title: 'Test Title',
        concepts: ['concept1', 'concept2']
      };
      
      mockOpenAIApi.chat.completions.create.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify(mockStructuredData)
          }
        }]
      });
      
      const result = await provider.generateStructuredOutput(
        'Generate a module outline',
        {
          type: 'object',
          properties: {
            title: { type: 'string' },
            concepts: { type: 'array', items: { type: 'string' } }
          }
        }
      );
      
      expect(result).toEqual(mockStructuredData);
    });
    
    it('should handle invalid JSON responses', async () => {
      // Mock the delay to speed up test
      jest.spyOn(provider as any, 'delay').mockImplementation(() => Promise.resolve());
      
      mockOpenAIApi.chat.completions.create
        .mockResolvedValueOnce({
          choices: [{
            message: {
              content: 'Invalid JSON content'
            }
          }]
        })
        .mockResolvedValueOnce({
          choices: [{
            message: {
              content: 'Still invalid'
            }
          }]
        })
        .mockResolvedValueOnce({
          choices: [{
            message: {
              content: 'Third try invalid'
            }
          }]
        });
      
      await expect(provider.generateStructuredOutput('Test', { type: 'object' }))
        .rejects.toThrow('Failed to generate valid JSON after 3 attempts');
    });
  });
  
  describe('getTokenCount', () => {
    it('should estimate token count', () => {
      const text = 'This is a test string';
      const tokenCount = provider.getTokenCount(text);
      
      // Rough approximation: text.length / 4
      expect(tokenCount).toBe(Math.ceil(text.length / 4));
    });
  });
  
  describe('isAvailable', () => {
    it('should check API availability', async () => {
      mockOpenAIApi.models.list.mockResolvedValueOnce({ data: [] });
      
      const isAvailable = await provider.isAvailable();
      
      expect(isAvailable).toBe(true);
      expect(mockOpenAIApi.models.list).toHaveBeenCalled();
    });
    
    it('should handle unavailable API', async () => {
      mockOpenAIApi.models.list.mockRejectedValueOnce(new Error('API Error'));
      
      const isAvailable = await provider.isAvailable();
      
      expect(isAvailable).toBe(false);
    });
  });
});

describe('MockLLMProvider', () => {
  let mockProvider: MockLLMProvider;
  
  beforeEach(() => {
    mockProvider = new MockLLMProvider(10); // 10ms delay
  });
  
  it('should generate mock completions', async () => {
    const result = await mockProvider.generateCompletion('Generate an introduction');
    
    expect(result.content).toContain('mock introduction');
    expect(result.content).toContain('Jungian psychology');
  });
  
  it('should generate mock structured responses', async () => {
    const result = await mockProvider.generateStructuredOutput(
      'Generate quiz',
      { type: 'array' }
    );
    
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(5); // Default is 5 questions when no count is specified
    expect(result[0]).toHaveProperty('question');
    expect(result[0]).toHaveProperty('correctAnswer');
  });
  
  it('should always be available', async () => {
    const isAvailable = await mockProvider.isAvailable();
    expect(isAvailable).toBe(true);
  });
});