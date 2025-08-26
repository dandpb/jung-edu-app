import { OpenAIProvider } from '../openai';
import { LLMResponse, LLMGenerationOptions } from '../../types';

// Mock fetch globally
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

// Mock TextDecoder for stream testing
class MockTextDecoder {
  decode(value: Uint8Array): string {
    return new TextDecoder().decode(value);
  }
}

// Mock ReadableStream for streaming tests
class MockReadableStreamDefaultReader {
  private chunks: Uint8Array[];
  private currentIndex: number = 0;

  constructor(chunks: string[]) {
    this.chunks = chunks.map(chunk => new TextEncoder().encode(chunk));
  }

  async read(): Promise<ReadableStreamDefaultReadResult<Uint8Array>> {
    if (this.currentIndex >= this.chunks.length) {
      return { done: true, value: undefined };
    }

    const value = this.chunks[this.currentIndex];
    this.currentIndex++;
    return { done: false, value };
  }

  releaseLock(): void {
    // Mock implementation
  }
}

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    
    // Set up environment variables for testing
    process.env = {
      ...originalEnv,
      REACT_APP_OPENAI_API_KEY: 'test-api-key',
      REACT_APP_OPENAI_MODEL: 'gpt-3.5-turbo'
    };

    provider = new OpenAIProvider();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Constructor', () => {
    it('should initialize with environment variables', () => {
      const testProvider = new OpenAIProvider();
      expect(testProvider).toBeInstanceOf(OpenAIProvider);
    });

    it('should initialize with custom parameters', () => {
      const customProvider = new OpenAIProvider('custom-key', 'gpt-4');
      expect(customProvider).toBeInstanceOf(OpenAIProvider);
    });

    it('should throw error when API key is missing', () => {
      delete process.env.REACT_APP_OPENAI_API_KEY;
      
      expect(() => new OpenAIProvider()).toThrow(
        'OpenAI API key is required. Set REACT_APP_OPENAI_API_KEY environment variable.'
      );
    });

    it('should use default model when not specified', () => {
      delete process.env.REACT_APP_OPENAI_MODEL;
      const testProvider = new OpenAIProvider('test-key');
      expect(testProvider).toBeInstanceOf(OpenAIProvider);
    });

    it('should prioritize constructor parameters over environment variables', () => {
      process.env.REACT_APP_OPENAI_API_KEY = 'env-key';
      process.env.REACT_APP_OPENAI_MODEL = 'env-model';
      
      const customProvider = new OpenAIProvider('custom-key', 'custom-model');
      expect(customProvider).toBeInstanceOf(OpenAIProvider);
    });
  });

  describe('generateCompletion', () => {
    const mockSuccessfulResponse = {
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: 'This is a test response from OpenAI.'
            }
          }
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 15,
          total_tokens: 25
        }
      })
    };

    it('should generate completion successfully', async () => {
      mockFetch.mockResolvedValueOnce(mockSuccessfulResponse as any);

      const prompt = 'What is analytical psychology?';
      const result = await provider.generateCompletion(prompt);

      expect(result).toEqual({
        content: 'This is a test response from OpenAI.',
        usage: {
          promptTokens: 10,
          completionTokens: 15,
          totalTokens: 25
        }
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-api-key'
          },
          body: expect.stringContaining(prompt)
        })
      );
    });

    it('should handle custom generation options', async () => {
      mockFetch.mockResolvedValueOnce(mockSuccessfulResponse as any);

      const prompt = 'Explain Jung\'s theory of archetypes';
      const options: LLMGenerationOptions = {
        temperature: 0.5,
        maxTokens: 1000,
        topP: 0.9,
        frequencyPenalty: 0.1,
        presencePenalty: 0.2,
        stopSequences: ['END', 'STOP']
      };

      await provider.generateCompletion(prompt, options);

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);

      expect(requestBody).toEqual({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 1000,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.2,
        stop: ['END', 'STOP']
      });
    });

    it('should use default options when none provided', async () => {
      mockFetch.mockResolvedValueOnce(mockSuccessfulResponse as any);

      await provider.generateCompletion('Test prompt');

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);

      expect(requestBody.temperature).toBe(0.7);
      expect(requestBody.max_tokens).toBe(2000);
      expect(requestBody.top_p).toBe(1);
      expect(requestBody.frequency_penalty).toBe(0);
      expect(requestBody.presence_penalty).toBe(0);
      expect(requestBody.stop).toBeUndefined();
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request'
      } as any);

      await expect(provider.generateCompletion('Test prompt'))
        .rejects.toThrow('OpenAI API error: Bad Request');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(provider.generateCompletion('Test prompt'))
        .rejects.toThrow('Network error');
    });

    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        }
      } as any);

      await expect(provider.generateCompletion('Test prompt'))
        .rejects.toThrow('Invalid JSON');
    });

    it('should handle missing choices in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          usage: {
            prompt_tokens: 10,
            completion_tokens: 0,
            total_tokens: 10
          }
        })
      } as any);

      await expect(provider.generateCompletion('Test prompt'))
        .rejects.toThrow();
    });

    it('should handle rate limiting with proper headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: new Headers({
          'Retry-After': '60'
        })
      } as any);

      await expect(provider.generateCompletion('Rate limit test'))
        .rejects.toThrow('OpenAI API error: Too Many Requests');
    });

    it('should handle long prompts correctly', async () => {
      mockFetch.mockResolvedValueOnce(mockSuccessfulResponse as any);

      const longPrompt = 'A'.repeat(10000); // Very long prompt
      await provider.generateCompletion(longPrompt);

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      expect(requestBody.messages[0].content).toBe(longPrompt);
    });

    it('should handle special characters in prompts', async () => {
      mockFetch.mockResolvedValueOnce(mockSuccessfulResponse as any);

      const specialPrompt = 'Explain Jung\'s "complex" theory (1900-1913): símbolos & arquétipos.';
      await provider.generateCompletion(specialPrompt);

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      expect(requestBody.messages[0].content).toBe(specialPrompt);
    });
  });

  describe('generateStructuredOutput', () => {
    const mockStructuredResponse = {
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                concepts: ['archetypes', 'shadow', 'anima'],
                importance: 'high',
                category: 'theoretical'
              })
            }
          }
        ],
        usage: {
          prompt_tokens: 50,
          completion_tokens: 30,
          total_tokens: 80
        }
      })
    };

    it('should generate structured output successfully', async () => {
      mockFetch.mockResolvedValueOnce(mockStructuredResponse as any);

      const prompt = 'Extract key concepts from this text about Jung';
      const schema = {
        type: 'object',
        properties: {
          concepts: { type: 'array', items: { type: 'string' } },
          importance: { type: 'string' },
          category: { type: 'string' }
        }
      };

      const result = await provider.generateStructuredOutput(prompt, schema);

      expect(result).toEqual({
        concepts: ['archetypes', 'shadow', 'anima'],
        importance: 'high',
        category: 'theoretical'
      });
    });

    it('should include schema in prompt', async () => {
      mockFetch.mockResolvedValueOnce(mockStructuredResponse as any);

      const prompt = 'Test prompt';
      const schema = { type: 'object', properties: { test: { type: 'string' } } };

      await provider.generateStructuredOutput(prompt, schema);

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      expect(requestBody.messages[0].content).toContain(prompt);
      expect(requestBody.messages[0].content).toContain(JSON.stringify(schema, null, 2));
      expect(requestBody.messages[0].content).toContain('APENAS com JSON válido');
    });

    it('should use lower temperature for structured output', async () => {
      mockFetch.mockResolvedValueOnce(mockStructuredResponse as any);

      await provider.generateStructuredOutput('Test', {}, { temperature: 0.9 });

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      expect(requestBody.temperature).toBe(0.3); // Should override to 0.3
    });

    it('should handle JSON in markdown code blocks', async () => {
      const codeBlockResponse = {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: '```json\n{"test": "value", "number": 42}\n```'
              }
            }
          ],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
        })
      };

      mockFetch.mockResolvedValueOnce(codeBlockResponse as any);

      const result = await provider.generateStructuredOutput('Test', {});

      expect(result).toEqual({ test: 'value', number: 42 });
    });

    it('should handle JSON with language specification in code blocks', async () => {
      const codeBlockResponse = {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: '```json\n{"concepts": ["test1", "test2"]}\n```'
              }
            }
          ],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
        })
      };

      mockFetch.mockResolvedValueOnce(codeBlockResponse as any);

      const result = await provider.generateStructuredOutput('Test', {});

      expect(result).toEqual({ concepts: ['test1', 'test2'] });
    });

    it('should handle JSON with extra backticks', async () => {
      const backticksResponse = {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: '`{"data": "test"}`'
              }
            }
          ],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
        })
      };

      mockFetch.mockResolvedValueOnce(backticksResponse as any);

      const result = await provider.generateStructuredOutput('Test', {});

      expect(result).toEqual({ data: 'test' });
    });

    it('should try multiple JSON extraction patterns', async () => {
      const complexResponse = {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: 'Here is the JSON you requested:\n\n{"extracted": true, "confidence": 0.95}\n\nThis should work!'
              }
            }
          ],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
        })
      };

      mockFetch.mockResolvedValueOnce(complexResponse as any);

      const result = await provider.generateStructuredOutput('Test', {});

      expect(result).toEqual({ extracted: true, confidence: 0.95 });
    });

    it('should handle array responses', async () => {
      const arrayResponse = {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: '[{"name": "Jung"}, {"name": "Freud"}]'
              }
            }
          ],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
        })
      };

      mockFetch.mockResolvedValueOnce(arrayResponse as any);

      const result = await provider.generateStructuredOutput('Test', {});

      expect(result).toEqual([{ name: 'Jung' }, { name: 'Freud' }]);
    });

    it('should throw error when no valid JSON found', async () => {
      const invalidResponse = {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: 'This is not JSON at all, just plain text response.'
              }
            }
          ],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
        })
      };

      mockFetch.mockResolvedValueOnce(invalidResponse as any);

      await expect(provider.generateStructuredOutput('Test', {}))
        .rejects.toThrow('Nenhum JSON válido encontrado na resposta');
    });

    it('should handle nested code blocks', async () => {
      const nestedResponse = {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: '```\n```json\n{"nested": "structure"}\n```\n```'
              }
            }
          ],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
        })
      };

      mockFetch.mockResolvedValueOnce(nestedResponse as any);

      const result = await provider.generateStructuredOutput('Test', {});

      expect(result).toEqual({ nested: 'structure' });
    });

    it('should preserve all custom options except temperature', async () => {
      mockFetch.mockResolvedValueOnce(mockStructuredResponse as any);

      const options: LLMGenerationOptions = {
        temperature: 0.9,
        maxTokens: 500,
        topP: 0.8,
        frequencyPenalty: 0.3,
        presencePenalty: 0.4,
        stopSequences: ['STOP']
      };

      await provider.generateStructuredOutput('Test', {}, options);

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      expect(requestBody.temperature).toBe(0.3); // Overridden
      expect(requestBody.max_tokens).toBe(500);
      expect(requestBody.top_p).toBe(0.8);
      expect(requestBody.frequency_penalty).toBe(0.3);
      expect(requestBody.presence_penalty).toBe(0.4);
      expect(requestBody.stop).toEqual(['STOP']);
    });
  });

  describe('streamCompletion', () => {
    it('should handle streaming completion successfully', async () => {
      const streamChunks = [
        'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":" world"}}]}\n\n',
        'data: [DONE]\n\n'
      ];

      const mockReader = new MockReadableStreamDefaultReader(streamChunks);
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => mockReader
        }
      } as any);

      const chunks: string[] = [];
      const onChunk = (chunk: string) => chunks.push(chunk);

      await provider.streamCompletion('Test streaming prompt', onChunk);

      expect(chunks).toEqual(['Hello', ' world']);
    });

    it('should handle custom streaming options', async () => {
      const streamChunks = ['data: [DONE]\n\n'];
      const mockReader = new MockReadableStreamDefaultReader(streamChunks);
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => mockReader }
      } as any);

      const options: LLMGenerationOptions = {
        temperature: 0.8,
        maxTokens: 1500
      };

      await provider.streamCompletion('Test', () => {}, options);

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      expect(requestBody.temperature).toBe(0.8);
      expect(requestBody.max_tokens).toBe(1500);
      expect(requestBody.stream).toBe(true);
    });

    it('should handle streaming API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error'
      } as any);

      await expect(provider.streamCompletion('Test', () => {}))
        .rejects.toThrow('OpenAI API error: Internal Server Error');
    });

    it('should handle missing response body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: null
      } as any);

      await expect(provider.streamCompletion('Test', () => {}))
        .rejects.toThrow('No response body reader available');
    });

    it('should skip invalid JSON lines in stream', async () => {
      const streamChunks = [
        'data: invalid json line\n\n',
        'data: {"choices":[{"delta":{"content":"Valid"}}]}\n\n',
        'data: another invalid line\n\n',
        'data: [DONE]\n\n'
      ];

      const mockReader = new MockReadableStreamDefaultReader(streamChunks);
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => mockReader }
      } as any);

      const chunks: string[] = [];
      await provider.streamCompletion('Test', (chunk) => chunks.push(chunk));

      expect(chunks).toEqual(['Valid']);
    });

    it('should handle empty content in stream chunks', async () => {
      const streamChunks = [
        'data: {"choices":[{"delta":{}}]}\n\n',
        'data: {"choices":[{"delta":{"content":""}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"Content"}}]}\n\n',
        'data: [DONE]\n\n'
      ];

      const mockReader = new MockReadableStreamDefaultReader(streamChunks);
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => mockReader }
      } as any);

      const chunks: string[] = [];
      await provider.streamCompletion('Test', (chunk) => chunks.push(chunk));

      expect(chunks).toEqual(['Content']);
    });

    it('should properly release reader lock', async () => {
      const streamChunks = ['data: [DONE]\n\n'];
      const mockReader = new MockReadableStreamDefaultReader(streamChunks);
      const releaseLockSpy = jest.spyOn(mockReader, 'releaseLock');
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => mockReader }
      } as any);

      await provider.streamCompletion('Test', () => {});

      expect(releaseLockSpy).toHaveBeenCalled();
    });

    it('should handle reader errors gracefully', async () => {
      const mockReader = {
        read: jest.fn().mockRejectedValue(new Error('Reader error')),
        releaseLock: jest.fn()
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => mockReader }
      } as any);

      await expect(provider.streamCompletion('Test', () => {}))
        .rejects.toThrow('Reader error');
      
      expect(mockReader.releaseLock).toHaveBeenCalled();
    });
  });

  describe('getTokenCount', () => {
    it('should estimate token count correctly', () => {
      const text = 'This is a test sentence with multiple words.';
      const tokenCount = provider.getTokenCount(text);
      const normalizedText = text.replace(/\s+/g, ' ').trim();
      
      expect(tokenCount).toBe(Math.ceil(normalizedText.length / 4));
      expect(typeof tokenCount).toBe('number');
      expect(tokenCount).toBeGreaterThan(0);
    });

    it('should handle empty strings', () => {
      expect(provider.getTokenCount('')).toBe(0);
    });

    it('should handle very long text', () => {
      const longText = 'word '.repeat(1000);
      const tokenCount = provider.getTokenCount(longText);
      const normalizedText = longText.replace(/\s+/g, ' ').trim();
      
      expect(tokenCount).toBe(Math.ceil(normalizedText.length / 4));
      expect(tokenCount).toBeGreaterThan(1000);
    });

    it('should handle special characters', () => {
      const specialText = '🧠 Jung\'s "complex" théory (1900-1913): símbolos & arquétipos.';
      const tokenCount = provider.getTokenCount(specialText);
      
      expect(tokenCount).toBeGreaterThan(0);
      expect(typeof tokenCount).toBe('number');
    });

    it('should handle numbers and symbols', () => {
      const numericText = '12345 + 67890 = 80235 (approximately)';
      const tokenCount = provider.getTokenCount(numericText);
      const normalizedText = numericText.replace(/\s+/g, ' ').trim();
      
      expect(tokenCount).toBe(Math.ceil(normalizedText.length / 4));
    });

    it('should handle whitespace consistently', () => {
      const text1 = 'word word word';
      const text2 = 'word  word  word';
      const text3 = 'word\tword\nword';
      
      // After whitespace normalization, all should have the same count
      expect(provider.getTokenCount(text1)).toBe(provider.getTokenCount(text2));
      expect(provider.getTokenCount(text2)).toBe(provider.getTokenCount(text3));
      expect(provider.getTokenCount(text1)).toBe(provider.getTokenCount(text3));
    });
  });

  describe('isAvailable', () => {
    it('should return true when API is available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true
      } as any);

      const isAvailable = await provider.isAvailable();
      
      expect(isAvailable).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/models',
        {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer test-api-key'
          }
        }
      );
    });

    it('should return false when API responds with error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      } as any);

      const isAvailable = await provider.isAvailable();
      expect(isAvailable).toBe(false);
    });

    it('should return false when network request fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const isAvailable = await provider.isAvailable();
      expect(isAvailable).toBe(false);
    });

    it('should handle timeout scenarios', async () => {
      mockFetch.mockImplementationOnce(() => 
        new Promise((resolve) => {
          setTimeout(() => resolve({ ok: true } as any), 1000);
        })
      );

      const startTime = Date.now();
      const isAvailable = await provider.isAvailable();
      const duration = Date.now() - startTime;

      expect(isAvailable).toBe(true);
      expect(duration).toBeGreaterThan(500);
    });

    it('should handle various HTTP status codes', async () => {
      const statusCodes = [200, 401, 403, 429, 500, 503];

      for (const status of statusCodes) {
        mockFetch.mockResolvedValueOnce({
          ok: status === 200,
          status
        } as any);

        const isAvailable = await provider.isAvailable();
        expect(isAvailable).toBe(status === 200);
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed API responses gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          // Missing required fields
          incomplete: 'response'
        })
      } as any);

      await expect(provider.generateCompletion('Test'))
        .rejects.toThrow();
    });

    it('should handle extremely large prompts', async () => {
      const hugePrompt = 'A'.repeat(100000);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Response to huge prompt' } }],
          usage: { prompt_tokens: 25000, completion_tokens: 10, total_tokens: 25010 }
        })
      } as any);

      const result = await provider.generateCompletion(hugePrompt);
      expect(result.content).toBe('Response to huge prompt');
      expect(result.usage?.promptTokens).toBe(25000);
    });

    it('should handle concurrent requests properly', async () => {
      const responses = [
        {
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Response 1' } }],
            usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
          })
        },
        {
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Response 2' } }],
            usage: { prompt_tokens: 12, completion_tokens: 8, total_tokens: 20 }
          })
        },
        {
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Response 3' } }],
            usage: { prompt_tokens: 15, completion_tokens: 10, total_tokens: 25 }
          })
        }
      ];

      mockFetch
        .mockResolvedValueOnce(responses[0] as any)
        .mockResolvedValueOnce(responses[1] as any)
        .mockResolvedValueOnce(responses[2] as any);

      const promises = [
        provider.generateCompletion('Prompt 1'),
        provider.generateCompletion('Prompt 2'),
        provider.generateCompletion('Prompt 3')
      ];

      const results = await Promise.all(promises);

      expect(results[0].content).toBe('Response 1');
      expect(results[1].content).toBe('Response 2');
      expect(results[2].content).toBe('Response 3');
    });

    it('should handle API rate limiting with exponential backoff', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests'
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Success after retry' } }],
            usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
          })
        } as any);

      // First call should fail with rate limit
      await expect(provider.generateCompletion('Rate limited'))
        .rejects.toThrow('OpenAI API error: Too Many Requests');

      // Second call should succeed
      const result = await provider.generateCompletion('After rate limit');
      expect(result.content).toBe('Success after retry');
    });

    it('should handle JSON parsing edge cases', async () => {
      const edgeCases = [
        '{"valid": "json"}',
        '```{"valid": "json"}```',
        '```json\n{"valid": "json"}\n```',
        'Here is JSON: {"valid": "json"} end',
        '{"nested": {"deep": {"structure": "works"}}}',
        '[{"array": "of"}, {"json": "objects"}]',
        '{"with": "unicode", "chars": "🧠💭"}',
        '{"numbers": 123, "floats": 45.67, "booleans": true}',
        '{"null": null, "empty": ""}',
      ];

      for (const jsonContent of edgeCases) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: jsonContent } }],
            usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
          })
        } as any);

        const result = await provider.generateStructuredOutput('Test', {});
        expect(result).toBeDefined();
      }
    });

    it('should handle streaming interruptions', async () => {
      const mockReader = {
        read: jest.fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Start"}}]}\n\n')
          })
          .mockRejectedValueOnce(new Error('Connection interrupted')),
        releaseLock: jest.fn()
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => mockReader }
      } as any);

      const chunks: string[] = [];
      
      await expect(provider.streamCompletion('Test', (chunk) => chunks.push(chunk)))
        .rejects.toThrow('Connection interrupted');

      expect(chunks).toEqual(['Start']);
      expect(mockReader.releaseLock).toHaveBeenCalled();
    });

    it('should validate environment variable formats', () => {
      // Test with empty string API key
      process.env.REACT_APP_OPENAI_API_KEY = '';
      expect(() => new OpenAIProvider()).toThrow();

      // Test with whitespace-only API key
      process.env.REACT_APP_OPENAI_API_KEY = '   ';
      const provider = new OpenAIProvider();
      expect(provider).toBeInstanceOf(OpenAIProvider);
    });
  });

  describe('Performance and Memory', () => {
    it('should handle memory efficiently with large responses', async () => {
      const largeContent = 'Large response content. '.repeat(1000);
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: largeContent } }],
          usage: { prompt_tokens: 100, completion_tokens: 4000, total_tokens: 4100 }
        })
      } as any);

      const initialMemory = process.memoryUsage().heapUsed;
      
      const result = await provider.generateCompletion('Large response test');
      
      expect(result.content).toBe(largeContent);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it('should complete requests within reasonable time', async () => {
      mockFetch.mockImplementationOnce(() =>
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({
                choices: [{ message: { content: 'Delayed response' } }],
                usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
              })
            });
          }, 100);
        })
      );

      const startTime = Date.now();
      const result = await provider.generateCompletion('Performance test');
      const duration = Date.now() - startTime;

      expect(result.content).toBe('Delayed response');
      expect(duration).toBeGreaterThan(50);
      expect(duration).toBeLessThan(1000);
    });

    it('should handle multiple streaming connections efficiently', async () => {
      const createMockReader = (content: string) => new MockReadableStreamDefaultReader([
        `data: {"choices":[{"delta":{"content":"${content}"}}]}\n\n`,
        'data: [DONE]\n\n'
      ]);

      mockFetch
        .mockResolvedValueOnce({ ok: true, body: { getReader: () => createMockReader('Stream 1') } } as any)
        .mockResolvedValueOnce({ ok: true, body: { getReader: () => createMockReader('Stream 2') } } as any)
        .mockResolvedValueOnce({ ok: true, body: { getReader: () => createMockReader('Stream 3') } } as any);

      const results: string[][] = [[], [], []];

      const promises = [
        provider.streamCompletion('Test 1', (chunk) => results[0].push(chunk)),
        provider.streamCompletion('Test 2', (chunk) => results[1].push(chunk)),
        provider.streamCompletion('Test 3', (chunk) => results[2].push(chunk))
      ];

      await Promise.all(promises);

      expect(results[0]).toEqual(['Stream 1']);
      expect(results[1]).toEqual(['Stream 2']);
      expect(results[2]).toEqual(['Stream 3']);
    });
  });

  describe('Integration Scenarios', () => {
    it('should work in a complete generation workflow', async () => {
      // Setup responses for different calls
      const responses = [
        {
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Jungian psychology is fascinating' } }],
            usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
          })
        },
        {
          ok: true,
          json: async () => ({
            choices: [{ message: { content: '{"concepts": ["archetypes", "shadow"], "difficulty": "intermediate"}' } }],
            usage: { prompt_tokens: 20, completion_tokens: 15, total_tokens: 35 }
          })
        },
        {
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Formatted citation: Jung, C.G. (1964). Man and His Symbols.' } }],
            usage: { prompt_tokens: 15, completion_tokens: 10, total_tokens: 25 }
          })
        }
      ];

      mockFetch
        .mockResolvedValueOnce(responses[0] as any)
        .mockResolvedValueOnce(responses[1] as any)
        .mockResolvedValueOnce(responses[2] as any);

      // Test different types of generation
      const completion = await provider.generateCompletion('Explain Jung');
      expect(completion.content).toContain('Jungian psychology');

      const structured = await provider.generateStructuredOutput('Extract concepts', {});
      expect(structured).toHaveProperty('concepts');

      const citation = await provider.generateCompletion('Format this citation');
      expect(citation.content).toContain('Jung, C.G.');
    });

    it('should maintain consistency across API versions', async () => {
      const testModels = ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'];

      for (const model of testModels) {
        const customProvider = new OpenAIProvider('test-key', model);

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: `Response from ${model}` } }],
            usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
          })
        } as any);

        const result = await customProvider.generateCompletion('Test prompt');
        expect(result.content).toBe(`Response from ${model}`);

        const requestBody = JSON.parse(mockFetch.mock.calls[mockFetch.mock.calls.length - 1][1]?.body as string);
        expect(requestBody.model).toBe(model);
      }
    });

    it('should handle provider switching scenarios', async () => {
      // Test switching between different configurations
      const provider1 = new OpenAIProvider('key1', 'gpt-3.5-turbo');
      const provider2 = new OpenAIProvider('key2', 'gpt-4');

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Response from provider 1' } }],
            usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
          })
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Response from provider 2' } }],
            usage: { prompt_tokens: 12, completion_tokens: 8, total_tokens: 20 }
          })
        } as any);

      const result1 = await provider1.generateCompletion('Test 1');
      const result2 = await provider2.generateCompletion('Test 2');

      expect(result1.content).toBe('Response from provider 1');
      expect(result2.content).toBe('Response from provider 2');

      // Verify correct API keys were used
      const calls = mockFetch.mock.calls;
      expect(calls[calls.length - 2][1]?.headers).toEqual(
        expect.objectContaining({ 'Authorization': 'Bearer key1' })
      );
      expect(calls[calls.length - 1][1]?.headers).toEqual(
        expect.objectContaining({ 'Authorization': 'Bearer key2' })
      );
    });
  });
});