import { OpenAIProvider } from '../openai';
import { LLMGenerationOptions } from '../../types';

// Mock fetch globally
global.fetch = jest.fn();

// Mock TextEncoder and TextDecoder for Node.js environment
global.TextEncoder = class TextEncoder {
  encode(text: string): Uint8Array {
    return new Uint8Array(Buffer.from(text, 'utf8'));
  }
};

global.TextDecoder = class TextDecoder {
  decode(bytes: Uint8Array): string {
    return Buffer.from(bytes).toString('utf8');
  }
};

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider;
  const mockApiKey = 'test-api-key';
  const mockModel = 'gpt-3.5-turbo';

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    process.env.REACT_APP_OPENAI_API_KEY = '';
    process.env.REACT_APP_OPENAI_MODEL = '';
  });

  describe('constructor', () => {
    it('should initialize with provided API key and model', () => {
      provider = new OpenAIProvider(mockApiKey, mockModel);
      expect(provider).toBeDefined();
    });

    it('should use environment variables when no parameters provided', () => {
      process.env.REACT_APP_OPENAI_API_KEY = 'env-api-key';
      process.env.REACT_APP_OPENAI_MODEL = 'gpt-4';
      
      provider = new OpenAIProvider();
      expect(provider).toBeDefined();
    });

    it('should throw error when no API key is available', () => {
      expect(() => new OpenAIProvider()).toThrow('OpenAI API key is required');
    });

    it('should use default model when not specified', () => {
      process.env.REACT_APP_OPENAI_API_KEY = mockApiKey;
      provider = new OpenAIProvider();
      expect(provider).toBeDefined();
    });
  });

  describe('generateCompletion', () => {
    beforeEach(() => {
      provider = new OpenAIProvider(mockApiKey, mockModel);
    });

    it('should successfully generate completion', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'Test response content'
          }
        }],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await provider.generateCompletion('Test prompt');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockApiKey}`
          },
          body: JSON.stringify({
            model: mockModel,
            messages: [{
              role: 'user',
              content: 'Test prompt'
            }],
            temperature: 0.7,
            max_tokens: 2000,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
            stop: undefined
          })
        })
      );

      expect(result).toEqual({
        content: 'Test response content',
        usage: {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30
        }
      });
    });

    it('should handle custom options', async () => {
      const options: LLMGenerationOptions = {
        temperature: 0.5,
        maxTokens: 1000,
        topP: 0.9,
        frequencyPenalty: 0.1,
        presencePenalty: 0.2,
        stopSequences: ['\\n', 'END']
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Response' } }],
          usage: { prompt_tokens: 5, completion_tokens: 10, total_tokens: 15 }
        })
      });

      await provider.generateCompletion('Test', options);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"temperature":0.5')
        })
      );

      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody.temperature).toBe(0.5);
      expect(callBody.max_tokens).toBe(1000);
      expect(callBody.top_p).toBe(0.9);
      expect(callBody.frequency_penalty).toBe(0.1);
      expect(callBody.presence_penalty).toBe(0.2);
      expect(callBody.stop).toEqual(['\\n', 'END']);
    });

    it('should throw error on API failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request'
      });

      await expect(provider.generateCompletion('Test'))
        .rejects.toThrow('OpenAI API error: Bad Request');
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(provider.generateCompletion('Test'))
        .rejects.toThrow('Network error');
    });
  });

  describe('generateStructuredOutput', () => {
    beforeEach(() => {
      provider = new OpenAIProvider(mockApiKey, mockModel);
    });

    it('should generate and parse structured JSON output', async () => {
      const schema = {
        concepts: [{
          id: 'string',
          label: 'string',
          importance: 'string'
        }]
      };

      const mockStructuredData = {
        concepts: [{
          id: '1',
          label: 'Test Concept',
          importance: 'high'
        }]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify(mockStructuredData)
            }
          }],
          usage: { prompt_tokens: 50, completion_tokens: 30, total_tokens: 80 }
        })
      });

      const result = await provider.generateStructuredOutput('Extract concepts', schema);

      expect(result).toEqual(mockStructuredData);
      
      // Verify the prompt was enhanced with schema
      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody.messages[0].content).toContain('Extract concepts');
      expect(callBody.messages[0].content).toContain('JSON');
      expect(callBody.temperature).toBe(0.3); // Lower temperature for structured output
    });

    it('should handle JSON in markdown code blocks', async () => {
      const mockData = { test: 'value' };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: '```json\n' + JSON.stringify(mockData) + '\n```'
            }
          }],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
        })
      });

      const result = await provider.generateStructuredOutput('Test', {});
      expect(result).toEqual(mockData);
    });

    it('should handle JSON with backticks', async () => {
      const mockData = { test: 'value' };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: '`' + JSON.stringify(mockData) + '`'
            }
          }],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
        })
      });

      const result = await provider.generateStructuredOutput('Test', {});
      expect(result).toEqual(mockData);
    });

    it('should extract JSON from mixed content', async () => {
      const mockData = { test: 'value' };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: 'Here is the JSON response: ' + JSON.stringify(mockData) + ' That\'s all!'
            }
          }],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
        })
      });

      const result = await provider.generateStructuredOutput('Test', {});
      expect(result).toEqual(mockData);
    });

    it('should handle JSON arrays', async () => {
      const mockData = [{ id: 1 }, { id: 2 }];
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify(mockData)
            }
          }],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
        })
      });

      const result = await provider.generateStructuredOutput('Test', []);
      expect(result).toEqual(mockData);
    });

    it('should throw error when no valid JSON found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: 'This is not JSON at all'
            }
          }],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
        })
      });

      await expect(provider.generateStructuredOutput('Test', {}))
        .rejects.toThrow('Nenhum JSON válido encontrado na resposta');
    });

    it('should handle options in structured output', async () => {
      const options: LLMGenerationOptions = {
        temperature: 0.1,
        maxTokens: 500
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: { content: '{"result": "test"}' }
          }],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
        })
      });

      await provider.generateStructuredOutput('Test', {}, options);

      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody.temperature).toBe(0.3); // Should override to 0.3 for structured output
      expect(callBody.max_tokens).toBe(500); // Should respect maxTokens
    });
  });

  describe('streamCompletion', () => {
    beforeEach(() => {
      provider = new OpenAIProvider(mockApiKey, mockModel);
    });

    it('should stream completion chunks', async () => {
      const chunks: string[] = [];
      const onChunk = jest.fn((chunk: string) => chunks.push(chunk));

      const mockStreamData = [
        'data: {"choices":[{"delta":{"content":"Hello"}}]}\n',
        'data: {"choices":[{"delta":{"content":" world"}}]}\n',
        'data: {"choices":[{"delta":{"content":"!"}}]}\n',
        'data: [DONE]\n'
      ];

      const encoder = new TextEncoder();
      let currentIndex = 0;

      const mockReader = {
        read: jest.fn().mockImplementation(async () => {
          if (currentIndex < mockStreamData.length) {
            const chunk = mockStreamData[currentIndex++];
            return { done: false, value: encoder.encode(chunk) };
          }
          return { done: true, value: undefined };
        }),
        releaseLock: jest.fn()
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => mockReader
        }
      });

      await provider.streamCompletion('Test prompt', onChunk);

      expect(onChunk).toHaveBeenCalledTimes(3);
      expect(chunks).toEqual(['Hello', ' world', '!']);
      expect(mockReader.releaseLock).toHaveBeenCalled();
    });

    it('should handle streaming with options', async () => {
      const onChunk = jest.fn();
      const options: LLMGenerationOptions = {
        temperature: 0.9,
        maxTokens: 100
      };

      const mockReader = {
        read: jest.fn().mockResolvedValueOnce({ 
          done: false, 
          value: new TextEncoder().encode('data: [DONE]\n') 
        }),
        releaseLock: jest.fn()
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => mockReader }
      });

      await provider.streamCompletion('Test', onChunk, options);

      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody.stream).toBe(true);
      expect(callBody.temperature).toBe(0.9);
      expect(callBody.max_tokens).toBe(100);
    });

    it('should handle streaming API errors', async () => {
      const onChunk = jest.fn();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error'
      });

      await expect(provider.streamCompletion('Test', onChunk))
        .rejects.toThrow('OpenAI API error: Internal Server Error');
    });

    it('should handle missing response body', async () => {
      const onChunk = jest.fn();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: null
      });

      await expect(provider.streamCompletion('Test', onChunk))
        .rejects.toThrow('No response body reader available');
    });

    it('should skip invalid JSON lines in stream', async () => {
      const chunks: string[] = [];
      const onChunk = jest.fn((chunk: string) => chunks.push(chunk));

      const mockStreamData = [
        'data: {"choices":[{"delta":{"content":"Valid"}}]}\n',
        'data: invalid json\n',
        'data: {"choices":[{"delta":{"content":" chunk"}}]}\n',
        'data: [DONE]\n'
      ];

      const encoder = new TextEncoder();
      let currentIndex = 0;

      const mockReader = {
        read: jest.fn().mockImplementation(async () => {
          if (currentIndex < mockStreamData.length) {
            const chunk = mockStreamData[currentIndex++];
            return { done: false, value: encoder.encode(chunk) };
          }
          return { done: true, value: undefined };
        }),
        releaseLock: jest.fn()
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => mockReader }
      });

      await provider.streamCompletion('Test', onChunk);

      expect(chunks).toEqual(['Valid', ' chunk']);
    });

    it('should handle empty delta content', async () => {
      const onChunk = jest.fn();

      const mockStreamData = [
        'data: {"choices":[{"delta":{}}]}\n',
        'data: {"choices":[{"delta":{"content":"Test"}}]}\n',
        'data: {"choices":[{"delta":{"role":"assistant"}}]}\n',
        'data: [DONE]\n'
      ];

      const encoder = new TextEncoder();
      let currentIndex = 0;

      const mockReader = {
        read: jest.fn().mockImplementation(async () => {
          if (currentIndex < mockStreamData.length) {
            const chunk = mockStreamData[currentIndex++];
            return { done: false, value: encoder.encode(chunk) };
          }
          return { done: true, value: undefined };
        }),
        releaseLock: jest.fn()
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => mockReader }
      });

      await provider.streamCompletion('Test', onChunk);

      expect(onChunk).toHaveBeenCalledTimes(1);
      expect(onChunk).toHaveBeenCalledWith('Test');
    });

    it('should release lock even on error', async () => {
      const onChunk = jest.fn();
      const mockReader = {
        read: jest.fn().mockRejectedValueOnce(new Error('Read error')),
        releaseLock: jest.fn()
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => mockReader }
      });

      await expect(provider.streamCompletion('Test', onChunk))
        .rejects.toThrow('Read error');

      expect(mockReader.releaseLock).toHaveBeenCalled();
    });
  });
});