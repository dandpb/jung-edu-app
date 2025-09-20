/**
 * Test JSON parsing improvements for OpenAI provider
 */

import { OpenAIProvider } from '../providers/openai';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('OpenAIProvider JSON Parsing', () => {
  let provider: OpenAIProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new OpenAIProvider('test-key', 'gpt-4');
  });

  it('should parse JSON wrapped in markdown code blocks', async () => {
    const mockResponse = '```json\n{"test": "value"}\n```';
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: mockResponse } }]
      })
    } as any);

    const result = await provider.generateStructuredOutput<{ test: string }>('test prompt', {});
    expect(result).toEqual({ test: 'value' });
  });

  it('should parse JSON arrays wrapped in code blocks', async () => {
    const mockResponse = '```json\n[{"title": "Test", "concepts": ["concept1"]}]\n```';
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: mockResponse } }]
      })
    } as any);

    const result = await provider.generateStructuredOutput<Array<{ title: string; concepts: string[] }>>('test prompt', []);
    expect(result).toEqual([{ title: 'Test', concepts: ['concept1'] }]);
  });

  it('should parse plain JSON without code blocks', async () => {
    const mockResponse = '{"test": "value"}';
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: mockResponse } }]
      })
    } as any);

    const result = await provider.generateStructuredOutput<{ test: string }>('test prompt', {});
    expect(result).toEqual({ test: 'value' });
  });

  it('should extract JSON from response with extra text', async () => {
    const mockResponse = 'Here is the JSON you requested:\n\n{"test": "value"}\n\nI hope this helps!';
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: mockResponse } }]
      })
    } as any);

    const result = await provider.generateStructuredOutput<{ test: string }>('test prompt', {});
    expect(result).toEqual({ test: 'value' });
  });

  it('should handle invalid JSON gracefully', async () => {
    const mockResponse = 'invalid json content';
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: mockResponse } }]
      })
    } as any);

    await expect(provider.generateStructuredOutput<{ test: string }>('test prompt', {}))
      .rejects.toThrow('Nenhum JSON válido encontrado na resposta');
  });

  it('should handle multiple JSON blocks and extract the first valid one', async () => {
    const mockResponse = 'Some description\n\n```json\n{"test": "value"}\n```\n\nMore text';
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: mockResponse } }]
      })
    } as any);

    const result = await provider.generateStructuredOutput<{ test: string }>('test prompt', {});
    expect(result).toEqual({ test: 'value' });
  });
});