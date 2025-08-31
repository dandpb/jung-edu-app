/**
 * Comprehensive test suite for OpenAI Provider
 * Tests API integration, error handling, structured output, streaming, and security
 * Targets 90%+ coverage for LLM provider functionality
 */

import { OpenAIProvider } from '../openai';
import { setNodeEnv, restoreNodeEnv } from '../../../test-utils/nodeEnvHelper';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider;
  
  const mockApiKey = 'sk-test123456789012345678901234567890';
  const mockModel = 'gpt-3.5-turbo';

  const mockSuccessResponse = {
    ok: true,
    status: 200,
    json: jest.fn().mockResolvedValue({
      choices: [
        {
          message: {
            content: 'This is a test response from OpenAI.'
          }
        }
      ],
      usage: {
        prompt_tokens: 50,
        completion_tokens: 25,
        total_tokens: 75
      }
    })
  };

  const mockStreamResponse = {
    ok: true,
    status: 200,
    body: {
      getReader: () => ({
        read: jest.fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n')
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":" world"}}]}\n\n')
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: [DONE]\n\n')
          })
          .mockResolvedValueOnce({
            done: true,
            value: undefined
          }),
        releaseLock: jest.fn()
      })
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue(mockSuccessResponse as any);
  });

  describe('Constructor', () => {
    it('should initialize with provided API key and model', () => {
      provider = new OpenAIProvider(mockApiKey, mockModel);
      expect(provider['apiKey']).toBe(mockApiKey);
      expect(provider['model']).toBe(mockModel);
    });

    it('should use environment variables when not provided', () => {
      process.env.REACT_APP_OPENAI_API_KEY = 'sk-env123456789012345678901234567890';
      process.env.REACT_APP_OPENAI_MODEL = 'gpt-4';
      
      provider = new OpenAIProvider();
      expect(provider['apiKey']).toBe('sk-env123456789012345678901234567890');
      expect(provider['model']).toBe('gpt-4');
      
      // Clean up
      delete process.env.REACT_APP_OPENAI_API_KEY;
      delete process.env.REACT_APP_OPENAI_MODEL;
    });

    it('should use defaults when environment variables are empty', () => {
      process.env.REACT_APP_OPENAI_API_KEY = 'sk-default123456789012345678901234567890';
      process.env.REACT_APP_OPENAI_MODEL = '';
      
      provider = new OpenAIProvider();
      expect(provider['model']).toBe('gpt-3.5-turbo'); // Default model
      
      delete process.env.REACT_APP_OPENAI_API_KEY;
      delete process.env.REACT_APP_OPENAI_MODEL;
    });

    it('should throw error for missing API key', () => {
      expect(() => {
        new OpenAIProvider('');
      }).toThrow('OpenAI API key is required');
    });

    it('should throw error for invalid API key format', () => {
      expect(() => {
        new OpenAIProvider('invalid');
      }).toThrow('OpenAI API key is required');
      
      expect(() => {
        new OpenAIProvider('sk-short');
      }).toThrow('OpenAI API key is required');
    });

    it('should allow test keys in test environment', () => {
      setNodeEnv('test');
      
      expect(() => {
        new OpenAIProvider('test-key-for-testing');
      }).not.toThrow();
      
      expect(() => {
        new OpenAIProvider('mock-api-key-123');
      }).not.toThrow();
      
      setNodeEnv('development');
    });

    it('should reject invalid keys in non-test environments', () => {
      setNodeEnv('production');
      
      expect(() => {
        new OpenAIProvider('short-key');
      }).toThrow('OpenAI API key is required');
      
      setNodeEnv('development');
    });

    it('should validate key format for production keys', () => {
      setNodeEnv('production');
      
      expect(() => {
        new OpenAIProvider('not-sk-key-but-long-enough-for-length-validation');
      }).toThrow('OpenAI API key is required');
      
      setNodeEnv('development');
    });
  });

  describe('generateCompletion', () => {
    beforeEach(() => {
      provider = new OpenAIProvider(mockApiKey, mockModel);
    });

    it('should generate completion successfully', async () => {
      const prompt = 'Explain Jungian psychology';
      const result = await provider.generateCompletion(prompt);

      expect(result).toEqual({
        content: 'This is a test response from OpenAI.',
        usage: {
          promptTokens: 50,
          completionTokens: 25,
          totalTokens: 75
        }
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockApiKey}`
          },
          body: JSON.stringify({
            model: mockModel,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 2000,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
            stop: undefined
          })
        })
      );
    });

    it('should use custom generation options', async () => {
      const prompt = 'Test prompt';
      const options = {
        temperature: 0.5,
        maxTokens: 1000,
        topP: 0.9,
        frequencyPenalty: 0.1,
        presencePenalty: 0.2,
        stopSequences: ['STOP', 'END']
      };

      await provider.generateCompletion(prompt, options);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            model: mockModel,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.5,
            max_tokens: 1000,
            top_p: 0.9,
            frequency_penalty: 0.1,
            presence_penalty: 0.2,
            stop: ['STOP', 'END']
          })
        })
      );
    });

    it('should handle API errors', async () => {
      const errorResponse = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      };

      mockFetch.mockResolvedValue(errorResponse as any);

      await expect(provider.generateCompletion('test prompt'))
        .rejects.toThrow('OpenAI API error: Unauthorized');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(provider.generateCompletion('test prompt'))
        .rejects.toThrow('Network error');
    });

    it('should handle missing usage information', async () => {
      const responseWithoutUsage = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Response without usage' } }]
          // No usage field
        })
      };

      mockFetch.mockResolvedValue(responseWithoutUsage as any);

      const result = await provider.generateCompletion('test');

      expect(result.usage).toEqual({
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0
      });
    });

    it('should handle partial usage information', async () => {
      const responseWithPartialUsage = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Response with partial usage' } }],
          usage: {
            prompt_tokens: 30
            // Missing completion_tokens and total_tokens
          }
        })
      };

      mockFetch.mockResolvedValue(responseWithPartialUsage as any);

      const result = await provider.generateCompletion('test');

      expect(result.usage).toEqual({
        promptTokens: 30,
        completionTokens: 0,
        totalTokens: 0
      });
    });
  });

  describe('generateStructuredOutput', () => {
    beforeEach(() => {
      provider = new OpenAIProvider(mockApiKey, mockModel);
    });

    it('should generate and parse structured JSON output', async () => {
      const mockJsonResponse = {
        name: 'Carl Jung',
        concepts: ['collective unconscious', 'archetypes', 'individuation']
      };

      const jsonResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: JSON.stringify(mockJsonResponse) } }],
          usage: { prompt_tokens: 50, completion_tokens: 25, total_tokens: 75 }
        })
      };

      mockFetch.mockResolvedValue(jsonResponse as any);

      const schema = {
        name: 'string',
        concepts: ['string']
      };

      const result = await provider.generateStructuredOutput(
        'Generate information about Carl Jung',
        schema
      );

      expect(result).toEqual(mockJsonResponse);
    });

    it('should handle JSON in markdown code blocks', async () => {
      const mockData = { test: 'data' };
      const markdownResponse = `\`\`\`json\n${JSON.stringify(mockData)}\n\`\`\``;

      const jsonResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: markdownResponse } }]
        })
      };

      mockFetch.mockResolvedValue(jsonResponse as any);

      const result = await provider.generateStructuredOutput('test prompt', {});

      expect(result).toEqual(mockData);
    });

    it('should handle JSON with extra backticks', async () => {
      const mockData = { clean: 'data' };
      const backtickResponse = `\`\`\`${JSON.stringify(mockData)}\`\`\``;

      const jsonResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: backtickResponse } }]
        })
      };

      mockFetch.mockResolvedValue(jsonResponse as any);

      const result = await provider.generateStructuredOutput('test prompt', {});

      expect(result).toEqual(mockData);
    });

    it('should try multiple JSON extraction patterns', async () => {
      const mockData = { extracted: 'successfully' };
      const complexResponse = `Here is the JSON data:
        Some text before
        ${JSON.stringify(mockData)}
        Some text after`;

      const jsonResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: complexResponse } }]
        })
      };

      mockFetch.mockResolvedValue(jsonResponse as any);

      const result = await provider.generateStructuredOutput('test prompt', {});

      expect(result).toEqual(mockData);
    });

    it('should handle JSON arrays', async () => {
      const mockArray = [{ item: 1 }, { item: 2 }];
      const arrayResponse = JSON.stringify(mockArray);

      const jsonResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: arrayResponse } }]
        })
      };

      mockFetch.mockResolvedValue(jsonResponse as any);

      const result = await provider.generateStructuredOutput('test prompt', []);

      expect(result).toEqual(mockArray);
    });

    it('should throw error for invalid JSON', async () => {
      const invalidJsonResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'This is not valid JSON at all' } }]
        })
      };

      mockFetch.mockResolvedValue(invalidJsonResponse as any);

      await expect(provider.generateStructuredOutput('test prompt', {}))
        .rejects.toThrow('Nenhum JSON válido encontrado na resposta');
    });

    it('should use lower temperature for structured output', async () => {
      await provider.generateStructuredOutput('test prompt', {}, { temperature: 0.8 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify(expect.objectContaining({
            temperature: 0.3 // Should override to 0.3 for structured output
          }))
        })
      );
    });

    it('should include schema information in prompt', async () => {
      const schema = { name: 'string', age: 'number' };
      await provider.generateStructuredOutput('test prompt', schema);

      const callArgs = mockFetch.mock.calls[0][1] as any;
      const requestBody = JSON.parse(callArgs.body);
      const prompt = requestBody.messages[0].content;

      expect(prompt).toContain('JSON válido');
      expect(prompt).toContain(JSON.stringify(schema, null, 2));
    });

    it('should handle malformed JSON with recovery patterns', async () => {
      const almostValidJson = '{"name": "test", "value": ';
      const validJson = '{"recovered": "data"}';
      
      const response = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          choices: [{ 
            message: { 
              content: `Some text ${almostValidJson} more text ```json\n${validJson}\n``` end text` 
            } 
          }]
        })
      };

      mockFetch.mockResolvedValue(response as any);

      const result = await provider.generateStructuredOutput('test prompt', {});

      expect(result).toEqual({ recovered: 'data' });
    });
  });

  describe('streamCompletion', () => {
    beforeEach(() => {
      provider = new OpenAIProvider(mockApiKey, mockModel);
    });

    it('should stream completion chunks', async () => {
      mockFetch.mockResolvedValue(mockStreamResponse as any);

      const chunks: string[] = [];
      const onChunk = (chunk: string) => chunks.push(chunk);

      await provider.streamCompletion('Test streaming prompt', onChunk);

      expect(chunks).toEqual(['Hello', ' world']);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          body: JSON.stringify(expect.objectContaining({
            stream: true
          }))
        })
      );
    });

    it('should handle streaming with custom options', async () => {
      mockFetch.mockResolvedValue(mockStreamResponse as any);

      const options = {
        temperature: 0.3,
        maxTokens: 500,
        stopSequences: ['STOP']
      };

      await provider.streamCompletion('test', () => {}, options);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify(expect.objectContaining({
            temperature: 0.3,
            max_tokens: 500,
            stop: ['STOP'],
            stream: true
          }))
        })
      );
    });

    it('should handle streaming API errors', async () => {
      const errorResponse = {
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      };

      mockFetch.mockResolvedValue(errorResponse as any);

      await expect(provider.streamCompletion('test', () => {}))
        .rejects.toThrow('OpenAI API error: Too Many Requests');
    });

    it('should handle missing response body', async () => {
      const responseWithoutBody = {
        ok: true,
        status: 200,
        body: null
      };

      mockFetch.mockResolvedValue(responseWithoutBody as any);

      await expect(provider.streamCompletion('test', () => {}))
        .rejects.toThrow('No response body reader available');
    });

    it('should handle malformed streaming data', async () => {
      const malformedStreamResponse = {
        ok: true,
        status: 200,
        body: {
          getReader: () => ({
            read: jest.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: invalid json\n\n')
              })
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":"valid"}}]}\n\n')
              })
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: [DONE]\n\n')
              })
              .mockResolvedValueOnce({
                done: true,
                value: undefined
              }),
            releaseLock: jest.fn()
          })
        }
      };

      mockFetch.mkResolvedValue(malformedStreamResponse as any);

      const chunks: string[] = [];
      await provider.streamCompletion('test', (chunk) => chunks.push(chunk));

      // Should skip invalid JSON and only process valid chunks
      expect(chunks).toEqual(['valid']);
    });

    it('should properly release stream reader lock', async () => {
      const mockReader = {
        read: jest.fn()
          .mockResolvedValueOnce({ done: true, value: undefined }),
        releaseLock: jest.fn()
      };

      const streamResponse = {
        ok: true,
        status: 200,
        body: {
          getReader: () => mockReader
        }
      };

      mockFetch.mockResolvedValue(streamResponse as any);

      await provider.streamCompletion('test', () => {});

      expect(mockReader.releaseLock).toHaveBeenCalled();
    });

    it('should handle empty streaming chunks', async () => {
      const emptyStreamResponse = {
        ok: true,
        status: 200,
        body: {
          getReader: () => ({
            read: jest.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: {"choices":[{"delta":{}}]}\n\n')
              })
              .mockResolvedValueOnce({
                done: true,
                value: undefined
              }),
            releaseLock: jest.fn()
          })
        }
      };

      mockFetch.mockResolvedValue(emptyStreamResponse as any);

      const chunks: string[] = [];
      await provider.streamCompletion('test', (chunk) => chunks.push(chunk));

      expect(chunks).toEqual([]); // No content in delta
    });
  });

  describe('getTokenCount', () => {
    beforeEach(() => {
      provider = new OpenAIProvider(mockApiKey, mockModel);
    });

    it('should estimate token count based on character length', () => {
      expect(provider.getTokenCount('hello world')).toBe(3); // 11 chars / 4 = 2.75 -> 3
      expect(provider.getTokenCount('a')).toBe(1); // 1 char / 4 = 0.25 -> 1
      expect(provider.getTokenCount('test message with more content')).toBe(8); // 31 chars / 4 = 7.75 -> 8
    });

    it('should handle empty strings', () => {
      expect(provider.getTokenCount('')).toBe(0);
    });

    it('should normalize whitespace before counting', () => {
      expect(provider.getTokenCount('  hello   world  ')).toBe(3); // Normalized to "hello world"
      expect(provider.getTokenCount('\n\nhello\n\nworld\n\n')).toBe(3); // Normalized to "hello world"
      expect(provider.getTokenCount('hello\t\tworld')).toBe(3); // Normalized to "hello world"
    });

    it('should handle special characters', () => {
      const specialText = 'émojis: 😀😃🎉 and symbols: @#$%^&*()';
      const tokenCount = provider.getTokenCount(specialText);
      expect(tokenCount).toBeGreaterThan(0);
    });

    it('should handle very long text', () => {
      const longText = 'word '.repeat(1000); // 5000 characters
      const tokenCount = provider.getTokenCount(longText);
      expect(tokenCount).toBe(1250); // 5000 / 4 = 1250
    });
  });

  describe('isAvailable', () => {
    beforeEach(() => {
      provider = new OpenAIProvider(mockApiKey, mockModel);
    });

    it('should return true when API is available', async () => {
      const modelsResponse = {
        ok: true,
        status: 200
      };

      mockFetch.mockResolvedValue(modelsResponse as any);

      const isAvailable = await provider.isAvailable();

      expect(isAvailable).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/models',
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${mockApiKey}`
          }
        }
      );
    });

    it('should return false when API is not available', async () => {
      const errorResponse = {
        ok: false,
        status: 401
      };

      mockFetch.mockResolvedValue(errorResponse as any);

      const isAvailable = await provider.isAvailable();

      expect(isAvailable).toBe(false);
    });

    it('should return false on network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const isAvailable = await provider.isAvailable();

      expect(isAvailable).toBe(false);
    });

    it('should handle timeout errors', async () => {
      mockFetch.mockRejectedValue(new Error('Request timeout'));

      const isAvailable = await provider.isAvailable();

      expect(isAvailable).toBe(false);
    });
  });

  describe('API key validation edge cases', () => {
    it('should handle API key with special characters', () => {
      const keyWithSpecialChars = 'sk-1234567890abcdefghijklmnopqrstuvwxyz-ABCD';
      expect(() => {
        new OpenAIProvider(keyWithSpecialChars);
      }).not.toThrow();
    });

    it('should reject keys that look like examples', () => {
      expect(() => {
        new OpenAIProvider('sk-your-api-key-here');
      }).toThrow();

      expect(() => {
        new OpenAIProvider('sk-1234567890123456'); // Too short
      }).toThrow();
    });

    it('should handle whitespace in API keys', () => {
      expect(() => {
        new OpenAIProvider(`  ${mockApiKey}  `); // Would need trimming
      }).not.toThrow();
    });
  });

  describe('Error message localization', () => {
    beforeEach(() => {
      provider = new OpenAIProvider(mockApiKey, mockModel);
    });

    it('should provide Portuguese error messages for structured output', async () => {
      const invalidResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'not json' } }]
        })
      };

      mockFetch.mockResolvedValue(invalidResponse as any);

      await expect(provider.generateStructuredOutput('test', {}))
        .rejects.toThrow('Nenhum JSON válido encontrado na resposta');
    });

    it('should log Portuguese error messages', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const invalidResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'invalid json {' } }]
        })
      };

      mockFetch.mockResolvedValue(invalidResponse as any);

      try {
        await provider.generateStructuredOutput('test', {});
      } catch (error) {
        // Expected to throw
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        'Falha ao analisar saída estruturada:',
        expect.any(Error)
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Conteúdo recebido:',
        'invalid json {'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Performance and reliability', () => {
    beforeEach(() => {
      provider = new OpenAIProvider(mockApiKey, mockModel);
    });

    it('should handle concurrent requests', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => 
        provider.generateCompletion(`Test prompt ${i}`)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.content).toBeDefined();
      });
    });

    it('should handle very large prompts', async () => {
      const largePrompt = 'This is a very long prompt. '.repeat(1000);

      await provider.generateCompletion(largePrompt);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining(largePrompt)
        })
      );
    });

    it('should handle Unicode characters correctly', async () => {
      const unicodePrompt = 'Test with emojis 😀🎉 and accents: café, naïve, 北京';

      await provider.generateCompletion(unicodePrompt);

      const callArgs = mockFetch.mock.calls[0][1] as any;
      const requestBody = JSON.parse(callArgs.body);
      
      expect(requestBody.messages[0].content).toBe(unicodePrompt);
    });
  });
});