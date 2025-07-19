/**
 * Test JSON parsing improvements for OpenAI provider
 */

import { OpenAIProvider } from '../provider';

// Mock OpenAI to test the parsing logic
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn()
        }
      },
      models: {
        list: jest.fn().mockResolvedValue({ data: [] })
      }
    }))
  };
});

describe('OpenAIProvider JSON Parsing', () => {
  let provider: OpenAIProvider;
  let mockCreate: jest.Mock;

  beforeEach(() => {
    provider = new OpenAIProvider('test-key');
    const OpenAI = require('openai').default;
    const mockClient = new OpenAI();
    mockCreate = mockClient.chat.completions.create;
  });

  it('should parse JSON wrapped in markdown code blocks', async () => {
    const mockResponse = '```json\n{"test": "value"}\n```';
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: mockResponse } }]
    });

    const result = await provider.generateStructuredResponse<{ test: string }>('test prompt', {});
    expect(result).toEqual({ test: 'value' });
  });

  it('should parse JSON arrays wrapped in code blocks', async () => {
    const mockResponse = '```json\n[{"title": "Test", "concepts": ["concept1"]}]\n```';
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: mockResponse } }]
    });

    const result = await provider.generateStructuredResponse<Array<{ title: string; concepts: string[] }>>('test prompt', []);
    expect(result).toEqual([{ title: 'Test', concepts: ['concept1'] }]);
  });

  it('should parse plain JSON without code blocks', async () => {
    const mockResponse = '{"test": "value"}';
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: mockResponse } }]
    });

    const result = await provider.generateStructuredResponse<{ test: string }>('test prompt', {});
    expect(result).toEqual({ test: 'value' });
  });

  it('should extract JSON from response with extra text', async () => {
    const mockResponse = 'Here is the JSON you requested:\n\n{"test": "value"}\n\nI hope this helps!';
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: mockResponse } }]
    });

    const result = await provider.generateStructuredResponse<{ test: string }>('test prompt', {});
    expect(result).toEqual({ test: 'value' });
  });

  it('should retry on parse failures', async () => {
    mockCreate
      .mockResolvedValueOnce({
        choices: [{ message: { content: 'invalid json' } }]
      })
      .mockResolvedValueOnce({
        choices: [{ message: { content: '{"test": "success"}' } }]
      });

    const result = await provider.generateStructuredResponse<{ test: string }>('test prompt', {}, { retries: 2 });
    expect(result).toEqual({ test: 'success' });
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });
});