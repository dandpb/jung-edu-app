import { MockLLMProvider } from '../mock';
import { LLMGenerationOptions } from '../../types';

// Mock setTimeout for faster tests
jest.useFakeTimers();

describe('MockLLMProvider', () => {
  let provider: MockLLMProvider;

  beforeEach(() => {
    provider = new MockLLMProvider();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
  });

  describe('generateCompletion', () => {
    it('should generate a mock response after simulated delay', async () => {
      const prompt = 'Test prompt';
      const completionPromise = provider.generateCompletion(prompt);

      // Fast-forward time to trigger the timeout
      jest.advanceTimersByTime(1000);

      const response = await completionPromise;

      expect(response).toBeDefined();
      expect(response.content).toBe('Mock response for: Test prompt...');
      expect(response.usage).toEqual({
        promptTokens: prompt.length / 4,
        completionTokens: 100,
        totalTokens: prompt.length / 4 + 100
      });
    });

    it('should generate mind map response for mind map prompts', async () => {
      const prompt = 'Create a mind map for learning JavaScript';
      const completionPromise = provider.generateCompletion(prompt);

      jest.advanceTimersByTime(1000);

      const response = await completionPromise;

      expect(response.content).toBe('Generated mind map structure with key concepts and relationships.');
    });

    it('should handle long prompts correctly', async () => {
      const longPrompt = 'A'.repeat(1000);
      const completionPromise = provider.generateCompletion(longPrompt);

      jest.advanceTimersByTime(1000);

      const response = await completionPromise;

      expect(response.usage?.promptTokens).toBe(250); // 1000 / 4
      expect(response.content).toBe('Mock response for: ' + 'A'.repeat(50) + '...');
    });

    it('should handle options parameter', async () => {
      const options: LLMGenerationOptions = {
        temperature: 0.5,
        maxTokens: 500
      };
      
      const completionPromise = provider.generateCompletion('Test', options);
      jest.advanceTimersByTime(1000);
      
      const response = await completionPromise;
      expect(response).toBeDefined();
      // Options don't affect mock response, but should be accepted
    });
  });

  describe('generateStructuredOutput', () => {
    it('should generate mock concepts for concept extraction prompts', async () => {
      const prompt = 'extract key concepts from Module: Introduction to TypeScript\nContent: ...';
      const schema = { concepts: [] };
      
      const structuredPromise = provider.generateStructuredOutput(prompt, schema);
      jest.advanceTimersByTime(1500);

      const result = await structuredPromise;

      expect(result).toHaveProperty('concepts');
      expect(Array.isArray((result as any).concepts)).toBe(true);
      expect((result as any).concepts).toHaveLength(5);
      
      const concepts = (result as any).concepts;
      expect(concepts[0]).toMatchObject({
        id: 'core-1',
        label: 'Introduction to TypeScript',
        importance: 'core',
        category: 'theoretical'
      });
    });

    it('should generate mock hierarchy for hierarchy prompts', async () => {
      const prompt = 'Create a hierarchical learning structure for the following concepts:\nCurrent concepts:\nTypeScript basics';
      const schema = { concepts: [] };
      
      const structuredPromise = provider.generateStructuredOutput(prompt, schema);
      jest.advanceTimersByTime(1500);

      const result = await structuredPromise;

      expect(result).toHaveProperty('concepts');
      expect(Array.isArray((result as any).concepts)).toBe(true);
    });

    it('should return default response for unknown prompt types', async () => {
      const prompt = 'Some other type of prompt';
      const schema = {};
      
      const structuredPromise = provider.generateStructuredOutput(prompt, schema);
      jest.advanceTimersByTime(1500);

      const result = await structuredPromise;

      expect(result).toEqual({ concepts: [] });
    });

    it('should handle complex module names in concept extraction', async () => {
      const prompt = 'extract key concepts from Module: Advanced React Hooks & Context API\nContent: ...';
      const schema = { concepts: [] };
      
      const structuredPromise = provider.generateStructuredOutput(prompt, schema);
      jest.advanceTimersByTime(1500);

      const result = await structuredPromise;

      const concepts = (result as any).concepts;
      expect(concepts[0].label).toBe('Advanced React Hooks & Context API');
    });

    it('should maintain proper parent-child relationships in concepts', async () => {
      const prompt = 'extract key concepts from Module: Test Module\nContent: ...';
      const schema = { concepts: [] };
      
      const structuredPromise = provider.generateStructuredOutput(prompt, schema);
      jest.advanceTimersByTime(1500);

      const result = await structuredPromise;
      const concepts = (result as any).concepts;

      // Verify hierarchy
      expect(concepts[0].parent).toBeNull(); // core concept
      expect(concepts[1].parent).toBe('core-1'); // primary concepts
      expect(concepts[2].parent).toBe('core-1');
      expect(concepts[3].parent).toBe('primary-1'); // secondary concept
      expect(concepts[4].parent).toBe('secondary-1'); // detail concept
    });

    it('should include proper connections between concepts', async () => {
      const prompt = 'extract key concepts from Module: Test\nContent: ...';
      const schema = { concepts: [] };
      
      const structuredPromise = provider.generateStructuredOutput(prompt, schema);
      jest.advanceTimersByTime(1500);

      const result = await structuredPromise;
      const concepts = (result as any).concepts;

      expect(concepts[1].connections).toContain('primary-2');
      expect(concepts[2].connections).toContain('primary-1');
    });
  });

  describe('streamCompletion', () => {
    it('should stream response in chunks', async () => {
      const prompt = 'Test streaming prompt';
      const chunks: string[] = [];
      const onChunk = jest.fn((chunk: string) => chunks.push(chunk));

      const streamPromise = provider.streamCompletion(prompt, onChunk);

      // Fast-forward through all the chunk delays
      const expectedChunks = 'Mock response for: Test streaming prompt...'.split(' ');
      for (let i = 0; i < expectedChunks.length; i++) {
        await Promise.resolve(); // Allow microtasks to run
        jest.advanceTimersByTime(50);
      }

      await streamPromise;

      expect(onChunk).toHaveBeenCalledTimes(expectedChunks.length);
      expect(chunks.join('')).toBe('Mock response for: Test streaming prompt... ');
    });

    it('should stream mind map responses', async () => {
      const prompt = 'Create a mind map for testing';
      const chunks: string[] = [];
      const onChunk = jest.fn((chunk: string) => chunks.push(chunk));

      const streamPromise = provider.streamCompletion(prompt, onChunk);

      const expectedResponse = 'Generated mind map structure with key concepts and relationships.';
      const expectedChunks = expectedResponse.split(' ');
      
      for (let i = 0; i < expectedChunks.length; i++) {
        await Promise.resolve();
        jest.advanceTimersByTime(50);
      }

      await streamPromise;

      expect(chunks.join('').trim()).toBe(expectedResponse);
    });

    it('should handle empty prompts', async () => {
      const prompt = '';
      const onChunk = jest.fn();

      const streamPromise = provider.streamCompletion(prompt, onChunk);

      // The response will be "Mock response for: ..."
      const expectedChunks = 'Mock response for: ...'.split(' ');
      for (let i = 0; i < expectedChunks.length; i++) {
        await Promise.resolve();
        jest.advanceTimersByTime(50);
      }

      await streamPromise;

      expect(onChunk).toHaveBeenCalled();
    });

    it('should respect options parameter', async () => {
      const options: LLMGenerationOptions = {
        temperature: 0.8,
        maxTokens: 1000
      };
      
      const onChunk = jest.fn();
      const streamPromise = provider.streamCompletion('Test', onChunk, options);

      // Fast-forward through chunks
      const expectedChunks = 'Mock response for: Test...'.split(' ');
      for (let i = 0; i < expectedChunks.length; i++) {
        await Promise.resolve();
        jest.advanceTimersByTime(50);
      }

      await streamPromise;
      
      expect(onChunk).toHaveBeenCalled();
      // Options don't affect mock streaming, but should be accepted
    });
  });

  describe('edge cases', () => {
    it('should handle very long prompts in streaming', async () => {
      const longPrompt = 'A'.repeat(100);
      const onChunk = jest.fn();

      const streamPromise = provider.streamCompletion(longPrompt, onChunk);

      // Response will be truncated to first 50 chars
      const expectedResponse = 'Mock response for: ' + 'A'.repeat(50) + '...';
      const expectedChunks = expectedResponse.split(' ');
      
      for (let i = 0; i < expectedChunks.length; i++) {
        await Promise.resolve();
        jest.advanceTimersByTime(50);
      }

      await streamPromise;

      expect(onChunk).toHaveBeenCalledTimes(expectedChunks.length);
    });

    it('should handle prompts without module name in concept extraction', async () => {
      const prompt = 'extract key concepts from some content without module';
      const schema = { concepts: [] };
      
      const structuredPromise = provider.generateStructuredOutput(prompt, schema);
      jest.advanceTimersByTime(1500);

      const result = await structuredPromise;
      const concepts = (result as any).concepts;

      expect(concepts[0].label).toBe('Module'); // Default fallback
    });
  });
});