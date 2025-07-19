import { OpenAIProvider, MockLLMProvider, ILLMProvider } from '../../../services/llm/provider';
import { mockLLMResponse, mockFetchResponses } from '../../mocks/mockData';

// Mock openai module
jest.mock('openai', () => ({
  Configuration: jest.fn(),
  OpenAIApi: jest.fn().mockImplementation(() => ({
    createChatCompletion: jest.fn(),
    listModels: jest.fn()
  }))
}));

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider;
  let mockOpenAIApi: any;
  const mockApiKey = 'test-api-key';
  
  beforeEach(() => {
    // Mock OpenAI API instance
    mockOpenAIApi = {
      createChatCompletion: jest.fn(),
      listModels: jest.fn()
    };
    
    const { OpenAIApi } = require('openai');
    OpenAIApi.mockImplementation(() => mockOpenAIApi);
    
    provider = new OpenAIProvider(mockApiKey, 'gpt-3.5-turbo');
  });
  
  afterEach(() => {
    jest.resetAllMocks();
  });
  
  describe('constructor', () => {
    it('should initialize with OpenAI provider', () => {
      expect(provider).toBeDefined();
      expect(provider).toBeInstanceOf(OpenAIProvider);
    });
  });
  
  describe('generateCompletion', () => {
    it('should generate completion successfully', async () => {
      mockOpenAIApi.createChatCompletion.mockResolvedValueOnce({
        data: {
          choices: [{
            message: {
              content: 'Generated content about Jungian psychology'
            }
          }]
        }
      });
      
      const result = await provider.generateCompletion('Test prompt');
      
      expect(result).toBeDefined();
      expect(result).toBe('Generated content about Jungian psychology');
      expect(mockOpenAIApi.createChatCompletion).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: expect.any(String) },
          { role: 'user', content: 'Test prompt' }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });
    });
    
    it('should handle API errors', async () => {
      mockOpenAIApi.createChatCompletion.mockRejectedValueOnce(
        new Error('Rate limit exceeded')
      );
      
      await expect(provider.generateCompletion('Test prompt'))
        .rejects.toThrow('Failed after 3 attempts: Rate limit exceeded');
      
      expect(mockOpenAIApi.createChatCompletion).toHaveBeenCalledTimes(3);
    });
    
    it('should retry on temporary failures', async () => {
      mockOpenAIApi.createChatCompletion
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          data: {
            choices: [{
              message: { content: 'Success after retry' }
            }]
          }
        });
      
      const result = await provider.generateCompletion('Test prompt', {
        retries: 2
      });
      
      expect(result).toBe('Success after retry');
      expect(mockOpenAIApi.createChatCompletion).toHaveBeenCalledTimes(2);
    });
    
    it('should respect temperature and max tokens options', async () => {
      mockOpenAIApi.createChatCompletion.mockResolvedValueOnce({
        data: {
          choices: [{
            message: { content: 'Test response' }
          }]
        }
      });
      
      await provider.generateCompletion('Test prompt', {
        temperature: 0.5,
        maxTokens: 1000
      });
      
      expect(mockOpenAIApi.createChatCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.5,
          max_tokens: 1000
        })
      );
    });
  });
  
  describe('generateStructuredResponse', () => {
    it('should generate and parse JSON output', async () => {
      const mockStructuredData = {
        title: 'Test Title',
        concepts: ['concept1', 'concept2']
      };
      
      mockOpenAIApi.createChatCompletion.mockResolvedValueOnce({
        data: {
          choices: [{
            message: {
              content: JSON.stringify(mockStructuredData)
            }
          }]
        }
      });
      
      const result = await provider.generateStructuredResponse(
        'Generate a module outline',
        {
          title: 'string',
          concepts: 'string[]'
        }
      );
      
      expect(result).toEqual(mockStructuredData);
    });
    
    it('should handle invalid JSON responses', async () => {
      mockOpenAIApi.createChatCompletion.mockResolvedValueOnce({
        data: {
          choices: [{
            message: {
              content: 'Invalid JSON content'
            }
          }]
        }
      });
      
      await expect(provider.generateStructuredResponse('Test', {}))
        .rejects.toThrow('Failed to parse structured response');
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
      mockOpenAIApi.listModels.mockResolvedValueOnce({ data: { models: [] } });
      
      const isAvailable = await provider.isAvailable();
      
      expect(isAvailable).toBe(true);
      expect(mockOpenAIApi.listModels).toHaveBeenCalled();
    });
    
    it('should handle unavailable API', async () => {
      mockOpenAIApi.listModels.mockRejectedValueOnce(new Error('API Error'));
      
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
    
    expect(result).toContain('mock introduction');
    expect(result).toContain('Jungian psychology');
  });
  
  it('should generate mock structured responses', async () => {
    const result = await mockProvider.generateStructuredResponse(
      'Generate quiz',
      {}
    );
    
    expect(result).toHaveProperty('questions');
    expect(result.questions).toHaveLength(1);
  });
  
  it('should always be available', async () => {
    const isAvailable = await mockProvider.isAvailable();
    expect(isAvailable).toBe(true);
  });
});