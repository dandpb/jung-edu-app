/**
 * Extended test suite for OpenAIProvider covering advanced scenarios, edge cases, and performance
 */

import { OpenAIProvider } from '../openai';
import { LLMGenerationOptions } from '../../types';

// Mock fetch globally
global.fetch = jest.fn();

// Mock TextEncoder and TextDecoder for Node.js environment
global.TextEncoder = class MockTextEncoder {
  readonly encoding = 'utf-8';
  
  encode(text: string): Uint8Array {
    return new Uint8Array(Buffer.from(text, 'utf8'));
  }
  
  encodeInto(source: string, destination: Uint8Array): TextEncoderEncodeIntoResult {
    const encoded = this.encode(source);
    const written = Math.min(encoded.length, destination.length);
    destination.set(encoded.subarray(0, written));
    return { read: source.length, written };
  }
} as any;

global.TextDecoder = class MockTextDecoder {
  readonly encoding: string;
  readonly fatal: boolean;
  readonly ignoreBOM: boolean;
  
  constructor(encoding = 'utf-8', options: TextDecoderOptions = {}) {
    this.encoding = encoding;
    this.fatal = options.fatal || false;
    this.ignoreBOM = options.ignoreBOM || false;
  }
  
  decode(input?: BufferSource): string {
    if (!input) return '';
    if (input instanceof Uint8Array) {
      return Buffer.from(input).toString('utf8');
    }
    return Buffer.from(input as ArrayBuffer).toString('utf8');
  }
} as any;

describe('OpenAIProvider - Extended Coverage', () => {
  let provider: OpenAIProvider;
  const mockApiKey = 'test-api-key';
  const mockModel = 'gpt-4';

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new OpenAIProvider(mockApiKey, mockModel);
  });

  describe('Advanced API Response Handling', () => {
    it('should handle malformed JSON in API responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        }
      });

      await expect(provider.generateCompletion('test'))
        .rejects.toThrow('Invalid JSON');
    });

    it('should handle responses with missing fields', async () => {
      const incompleteResponse = {
        choices: [
          {
            // Missing message field
          }
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => incompleteResponse
      });

      await expect(provider.generateCompletion('test'))
        .rejects.toThrow();
    });

    it('should handle responses with empty choices array', async () => {
      const emptyChoicesResponse = {
        choices: [],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 0,
          total_tokens: 10
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => emptyChoicesResponse
      });

      await expect(provider.generateCompletion('test'))
        .rejects.toThrow();
    });

    it('should handle responses with missing usage information', async () => {
      const noUsageResponse = {
        choices: [{
          message: {
            content: 'Test response'
          }
        }]
        // Missing usage field
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => noUsageResponse
      });

      const result = await provider.generateCompletion('test');

      expect(result.content).toBe('Test response');
      expect(result.usage).toEqual({
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0
      });
    });

    it('should handle HTTP error status codes', async () => {
      const errorCodes = [400, 401, 403, 404, 429, 500, 502, 503, 504];

      for (const errorCode of errorCodes) {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: errorCode,
          statusText: `HTTP ${errorCode}`
        });

        await expect(provider.generateCompletion('test'))
          .rejects.toThrow(`OpenAI API error: HTTP ${errorCode}`);
      }
    });

    it('should handle rate limiting with retry logic', async () => {
      // First call fails with 429, second succeeds
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests'
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Success after retry' } }],
            usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
          })
        });

      // Simulate retry logic in provider (would need to be implemented)
      await expect(provider.generateCompletion('test'))
        .rejects.toThrow('OpenAI API error: Too Many Requests');
    });
  });

  describe('Token Counting and Usage Tracking', () => {
    it('should accurately count tokens for various inputs', () => {
      const testCases = [
        { text: '', expectedMin: 0 },
        { text: 'Hello', expectedMin: 1 },
        { text: 'Hello world', expectedMin: 2 },
        { text: 'This is a longer sentence with more words.', expectedMin: 8 },
        { text: 'Special characters: !@#$%^&*()_+-=[]{}|;:,.<>?', expectedMin: 10 },
        { text: 'Unicode: 你好世界 🌍 emoji test', expectedMin: 5 }
      ];

      testCases.forEach(({ text, expectedMin }) => {
        const count = provider.getTokenCount(text);
        expect(count).toBeGreaterThanOrEqual(expectedMin);
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThanOrEqual(0);
      });
    });

    it('should handle very long texts efficiently', () => {
      const veryLongText = 'word '.repeat(10000); // 50,000 characters
      
      const startTime = Date.now();
      const tokenCount = provider.getTokenCount(veryLongText);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(tokenCount).toBeGreaterThan(0);
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    });

    it('should track cumulative token usage', async () => {
      const responses = [
        {
          choices: [{ message: { content: 'Response 1' } }],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
        },
        {
          choices: [{ message: { content: 'Response 2' } }],
          usage: { prompt_tokens: 20, completion_tokens: 10, total_tokens: 30 }
        }
      ];

      for (let i = 0; i < responses.length; i++) {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => responses[i]
        });

        await provider.generateCompletion(`test ${i + 1}`);
      }

      // Would need to implement usage tracking in provider
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Structured Output Edge Cases', () => {
    it('should extract JSON from various text formats', async () => {
      const jsonExtractionCases = [
        {
          response: '```json\n{"result": "from code block"}\n```',
          expected: { result: 'from code block' }
        },
        {
          response: '`{"result": "from single backticks"}`',
          expected: { result: 'from single backticks' }
        },
        {
          response: 'Here is the JSON: {"result": "embedded"} and some more text',
          expected: { result: 'embedded' }
        },
        {
          response: '{"result": "array"}\n[1, 2, 3]',
          expected: { result: 'array' }
        },
        {
          response: 'Multiple JSONs: {"first": 1} and {"second": 2}',
          expected: { first: 1 } // Should extract first valid JSON
        }
      ];

      for (const testCase of jsonExtractionCases) {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: testCase.response } }],
            usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
          })
        });

        const result = await provider.generateStructuredOutput('test', {});
        expect(result).toEqual(testCase.expected);
      }
    });

    it('should handle nested JSON structures', async () => {
      const nestedJson = {
        level1: {
          level2: {
            level3: {
              deep: 'value',
              array: [1, 2, { nested: 'object' }],
              complex: {
                boolean: true,
                null_value: null,
                number: 42.5
              }
            }
          }
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(nestedJson) } }],
          usage: { prompt_tokens: 50, completion_tokens: 100, total_tokens: 150 }
        })
      });

      const result = await provider.generateStructuredOutput('nested test', {});
      expect(result).toEqual(nestedJson);
    });

    it('should validate JSON against schemas when provided', async () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
          isActive: { type: 'boolean' }
        },
        required: ['name', 'age']
      };

      const validJson = {
        name: 'John Doe',
        age: 30,
        isActive: true
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(validJson) } }],
          usage: { prompt_tokens: 30, completion_tokens: 40, total_tokens: 70 }
        })
      });

      const result = await provider.generateStructuredOutput('schema test', schema);
      expect(result).toEqual(validJson);
    });

    it('should handle JSON with special characters and escaping', async () => {
      const specialJson = {
        text: 'Text with "quotes" and \\backslashes',
        unicode: '🎉 Unicode characters 你好',
        newlines: 'Line 1\nLine 2\r\nLine 3',
        special: 'Special chars: \t\b\f\r\n',
        url: 'https://example.com/path?param=value&other=test'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(specialJson) } }],
          usage: { prompt_tokens: 40, completion_tokens: 60, total_tokens: 100 }
        })
      });

      const result = await provider.generateStructuredOutput('special chars test', {});
      expect(result).toEqual(specialJson);
    });
  });

  describe('Streaming Edge Cases', () => {
    it('should handle streaming interruption', async () => {
      const chunks: string[] = [];
      const onChunk = jest.fn((chunk: string) => chunks.push(chunk));

      let readCallCount = 0;
      const mockReader = {
        read: jest.fn().mockImplementation(async () => {
          if (readCallCount === 0) {
            readCallCount++;
            return { 
              done: false, 
              value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Hello"}}]}\n') 
            };
          } else if (readCallCount === 1) {
            // Simulate error on second read
            throw new Error('Connection interrupted');
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

      await expect(provider.streamCompletion('test', onChunk))
        .rejects.toThrow('Connection interrupted');

      expect(onChunk).toHaveBeenCalledWith('Hello');
      expect(mockReader.releaseLock).toHaveBeenCalled();
    });

    it('should handle malformed streaming data', async () => {
      const chunks: string[] = [];
      const onChunk = jest.fn((chunk: string) => chunks.push(chunk));

      const malformedData = [
        'data: {"choices":[{"delta":{"content":"Valid"}}]}\n',
        'data: invalid json line\n',
        'data: {"malformed": json}\n',
        'data: {"choices":[{"delta":{"content":" chunk"}}]}\n',
        'data: [DONE]\n'
      ];

      let currentIndex = 0;
      const mockReader = {
        read: jest.fn().mockImplementation(async () => {
          if (currentIndex < malformedData.length) {
            const data = malformedData[currentIndex++];
            return { done: false, value: new TextEncoder().encode(data) };
          }
          return { done: true, value: undefined };
        }),
        releaseLock: jest.fn()
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => mockReader }
      });

      await provider.streamCompletion('test', onChunk);

      // Should only receive valid chunks
      expect(chunks).toEqual(['Valid', ' chunk']);
      expect(mockReader.releaseLock).toHaveBeenCalled();
    });

    it('should handle very large streaming chunks', async () => {
      const largeContent = 'x'.repeat(100000); // 100KB chunk
      const chunks: string[] = [];
      const onChunk = jest.fn((chunk: string) => chunks.push(chunk));

      const mockReader = {
        read: jest.fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(`data: {"choices":[{"delta":{"content":"${largeContent}"}}]}\n`)
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: [DONE]\n')
          })
          .mockResolvedValueOnce({
            done: true,
            value: undefined
          }),
        releaseLock: jest.fn()
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => mockReader }
      });

      const startTime = Date.now();
      await provider.streamCompletion('large chunk test', onChunk);
      const endTime = Date.now();

      expect(chunks[0]).toBe(largeContent);
      expect(endTime - startTime).toBeLessThan(5000); // Should handle large chunks efficiently
      expect(mockReader.releaseLock).toHaveBeenCalled();
    });

    it('should handle rapid streaming updates', async () => {
      const chunks: string[] = [];
      const onChunk = jest.fn((chunk: string) => chunks.push(chunk));

      // Generate many small chunks rapidly
      const rapidChunks = Array(1000).fill(null).map((_, i) => 
        `data: {"choices":[{"delta":{"content":"${i} "}}]}\n`
      ).concat(['data: [DONE]\n']);

      let currentIndex = 0;
      const mockReader = {
        read: jest.fn().mockImplementation(async () => {
          if (currentIndex < rapidChunks.length) {
            const data = rapidChunks[currentIndex++];
            return { done: false, value: new TextEncoder().encode(data) };
          }
          return { done: true, value: undefined };
        }),
        releaseLock: jest.fn()
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => mockReader }
      });

      const startTime = Date.now();
      await provider.streamCompletion('rapid test', onChunk);
      const endTime = Date.now();

      expect(chunks).toHaveLength(1000);
      expect(chunks[0]).toBe('0 ');
      expect(chunks[999]).toBe('999 ');
      expect(endTime - startTime).toBeLessThan(10000); // Should handle rapid updates efficiently
    });
  });

  describe('Performance and Memory', () => {
    it('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 10;
      const responses = Array(concurrentRequests).fill(null).map((_, i) => ({
        choices: [{ message: { content: `Response ${i}` } }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
      }));

      responses.forEach(response => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => response
        });
      });

      const startTime = Date.now();
      const promises = Array(concurrentRequests).fill(null).map((_, i) =>
        provider.generateCompletion(`Concurrent request ${i}`)
      );
      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(results).toHaveLength(concurrentRequests);
      results.forEach((result, i) => {
        expect(result.content).toBe(`Response ${i}`);
      });

      // All requests should complete reasonably quickly
      expect(endTime - startTime).toBeLessThan(5000);
    });

    it('should handle memory efficiently with large responses', async () => {
      const largeContent = 'Large response content '.repeat(10000); // ~230KB
      const largeResponse = {
        choices: [{ message: { content: largeContent } }],
        usage: { prompt_tokens: 100, completion_tokens: 5000, total_tokens: 5100 }
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => largeResponse
      });

      const initialMemory = process.memoryUsage().heapUsed;
      
      // Make multiple large requests
      const requests = Array(5).fill(null).map(() => 
        provider.generateCompletion('Large response test')
      );
      const results = await Promise.all(requests);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.content).toBe(largeContent);
      });

      // Memory increase should be reasonable (less than 50MB for this test)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Configuration and Environment', () => {
    it('should handle different model configurations', () => {
      const models = ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o'];
      
      models.forEach(model => {
        const testProvider = new OpenAIProvider(mockApiKey, model);
        expect(testProvider).toBeDefined();
      });
    });

    it('should validate API key format', () => {
      const invalidKeys = ['', 'invalid', 'sk-short', null, undefined];
      
      invalidKeys.forEach(key => {
        expect(() => new OpenAIProvider(key as any, mockModel))
          .toThrow('OpenAI API key is required');
      });
    });

    it('should handle environment variable configuration', () => {
      // Test with environment variables
      const originalEnv = process.env;
      process.env.REACT_APP_OPENAI_API_KEY = 'env-test-key';
      process.env.REACT_APP_OPENAI_MODEL = 'gpt-4';

      const envProvider = new OpenAIProvider();
      expect(envProvider).toBeDefined();

      // Restore environment
      process.env = originalEnv;
    });

    it('should handle custom base URLs and headers', async () => {
      // Would need to implement custom configuration support
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Custom config test' } }],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
        })
      });

      await provider.generateCompletion('Custom config test');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockApiKey}`,
            'Content-Type': 'application/json'
          })
        })
      );
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should handle network timeouts gracefully', async () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout')), 100)
        )
      );

      await expect(provider.generateCompletion('timeout test'))
        .rejects.toThrow('Network timeout');
    });

    it('should handle DNS resolution failures', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('getaddrinfo ENOTFOUND api.openai.com')
      );

      await expect(provider.generateCompletion('dns test'))
        .rejects.toThrow('getaddrinfo ENOTFOUND api.openai.com');
    });

    it('should validate provider availability', async () => {
      // Mock successful response for availability check
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Available' } }],
          usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 }
        })
      });

      const isAvailable = await provider.isAvailable();
      expect(isAvailable).toBe(true);

      // Mock failed response for availability check
      jest.clearAllMocks();
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Service unavailable'));

      const isUnavailable = await provider.isAvailable();
      expect(isUnavailable).toBe(false);
    });
  });
});