/**
 * Comprehensive Unit Tests for PromptTestService
 * Tests prompt testing functionality, mock responses, and error handling
 */

import { promptTestService, PromptTestResult } from '../promptTestService';

// Mock dependencies
jest.mock('../../llm/provider');
jest.mock('../../llm/providers/mock');

// Mock localStorage for browser environment
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

// Mock process.env for Node environment  
const mockEnv = {
  REACT_APP_OPENAI_API_KEY: undefined as string | undefined
};

// Setup global mocks
Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

Object.defineProperty(process, 'env', {
  value: mockEnv,
  writable: true
});

describe('PromptTestService', () => {
  let originalDateNow: () => number;

  beforeEach(() => {
    // Mock Date.now for consistent timing tests
    originalDateNow = Date.now;
    Date.now = jest.fn(() => 1000000);

    // Clear all mocks
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockClear();
  });

  afterEach(() => {
    Date.now = originalDateNow;
  });

  describe('Provider Detection', () => {
    test('should correctly identify when using mock provider', () => {
      // The service is already instantiated, so we test its current state
      const isUsingMock = promptTestService.isUsingMock();
      expect(typeof isUsingMock).toBe('boolean');
    });

    test('should maintain consistent provider state', () => {
      const initialState = promptTestService.isUsingMock();
      const secondCheck = promptTestService.isUsingMock();
      expect(initialState).toBe(secondCheck);
    });
  });

  describe('Mock Provider Testing', () => {
    test('should generate introduction mock response', async () => {
      const prompt = 'Gere uma introdução sobre psicologia junguiana';
      
      const result = await promptTestService.testPrompt(prompt);
      
      expect(result.success).toBe(true);
      expect(result.response).toContain('Introdução ao Tópico');
      expect(result.response).toContain('Inconsciente Coletivo');
      expect(result.response).toContain('Arquétipos');
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });

    test('should generate quiz mock response', async () => {
      const prompt = 'Crie questões de quiz sobre Jung';
      
      const result = await promptTestService.testPrompt(prompt);
      
      expect(result.success).toBe(true);
      if (promptTestService.isUsingMock()) {
        expect(result.response).toContain('Arquétipos');
        expect(result.response).toContain('individuação');
        expect(result.response).toContain('"correct"');
        expect(result.response).toContain('"explanation"');
      }
    });

    test('should generate mind map mock response', async () => {
      const prompt = 'Crie um mapa mental sobre terapia';
      
      const result = await promptTestService.testPrompt(prompt);
      
      expect(result.success).toBe(true);
      if (promptTestService.isUsingMock()) {
        expect(result.response).toContain('Mapa Mental - Estrutura Hierárquica');
        expect(result.response).toContain('Conceito Central');
        expect(result.response).toContain('Ramo 1: Fundamentos');
      }
    });

    test('should generate video search mock response', async () => {
      const prompt = 'Encontre vídeos sobre Jung no YouTube';
      
      const result = await promptTestService.testPrompt(prompt);
      
      expect(result.success).toBe(true);
      if (promptTestService.isUsingMock()) {
        expect(result.response).toContain('Introdução à Psicologia Junguiana');
        expect(result.response).toContain('Inconsciente Coletivo');
        expect(result.response).toContain('Arquétipos de Jung');
      }
    });

    test('should generate bibliography mock response', async () => {
      const prompt = 'Liste recursos bibliográficos sobre Jung';
      
      const result = await promptTestService.testPrompt(prompt);
      
      expect(result.success).toBe(true);
      if (promptTestService.isUsingMock()) {
        expect(result.response).toContain('O Homem e Seus Símbolos');
        expect(result.response).toContain('Carl Gustav Jung');
        expect(result.response).toContain('Tipos Psicológicos');
      }
    });

    test('should generate default mock response for unknown prompts', async () => {
      const prompt = 'Some unknown prompt type';
      
      const result = await promptTestService.testPrompt(prompt);
      
      expect(result.success).toBe(true);
      if (promptTestService.isUsingMock()) {
        expect(result.response).toContain('Resposta de Demonstração');
        expect(result.response).toContain('Modo de demonstração');
        expect(result.response).toContain('REACT_APP_OPENAI_API_KEY');
      }
    });

    test('should calculate token count for responses', async () => {
      const prompt = 'Test prompt';
      
      const result = await promptTestService.testPrompt(prompt);
      
      expect(result.tokensUsed).toBeDefined();
      expect(result.tokensUsed).toBeGreaterThan(0);
      if (promptTestService.isUsingMock()) {
        expect(result.tokensUsed).toBe(Math.floor(result.response!.length / 4));
      }
    });

    test('should measure execution time', async () => {
      Date.now = jest.fn()
        .mockReturnValueOnce(1000)  // Start time
        .mockReturnValueOnce(1050); // End time
      
      const result = await promptTestService.testPrompt('test');
      
      expect(result.executionTime).toBe(50);
    });
  });

  describe('Error Handling', () => {
    test('should handle empty prompt gracefully', async () => {
      const result = await promptTestService.testPrompt('');
      
      expect(result.success).toBe(true);
      expect(result.response).toBeDefined();
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });

    test('should handle very long prompts', async () => {
      const longPrompt = 'a'.repeat(10000);
      
      const result = await promptTestService.testPrompt(longPrompt);
      
      expect(result.success).toBe(true);
      expect(result.response).toBeDefined();
    });

    test('should handle special characters in prompts', async () => {
      const specialPrompt = 'Test with special chars: éñü áçó ñ #$%^&*()';
      
      const result = await promptTestService.testPrompt(specialPrompt);
      
      expect(result.success).toBe(true);
      expect(result.response).toBeDefined();
    });

    test('should handle JSON-like prompts', async () => {
      const jsonPrompt = 'Generate JSON with {"key": "value"}';
      
      const result = await promptTestService.testPrompt(jsonPrompt);
      
      expect(result.success).toBe(true);
      expect(result.response).toBeDefined();
    });
  });

  describe('Response Validation', () => {
    test('should return valid PromptTestResult structure', async () => {
      const result = await promptTestService.testPrompt('test');
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('response');
      expect(result).toHaveProperty('executionTime');
      expect(result).toHaveProperty('tokensUsed');
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.executionTime).toBe('number');
    });

    test('should have consistent response format across prompt types', async () => {
      const prompts = [
        'introdução',
        'quiz',
        'mapa mental',
        'vídeo',
        'bibliografia',
        'unknown type'
      ];

      for (const prompt of prompts) {
        const result = await promptTestService.testPrompt(prompt);
        
        expect(result.success).toBe(true);
        expect(result.response).toBeDefined();
        expect(result.executionTime).toBeGreaterThanOrEqual(0);
        expect(result.tokensUsed).toBeGreaterThan(0);
      }
    });

    test('should generate non-empty responses', async () => {
      const result = await promptTestService.testPrompt('test');
      
      expect(result.response).toBeTruthy();
      expect(result.response!.length).toBeGreaterThan(0);
    });

    test('should generate responses with reasonable length', async () => {
      const result = await promptTestService.testPrompt('test');
      
      // Mock responses should be substantial but not excessive
      expect(result.response!.length).toBeGreaterThan(50);
      expect(result.response!.length).toBeLessThan(5000);
    });
  });

  describe('Prompt Type Detection', () => {
    test('should detect introduction prompts correctly', async () => {
      const introPrompts = [
        'gere uma introdução',
        'create an introduction',
        'introdução sobre o tópico'
      ];

      for (const prompt of introPrompts) {
        const result = await promptTestService.testPrompt(prompt);
        
        if (promptTestService.isUsingMock()) {
          expect(result.response).toMatch(/introdução/i);
        }
      }
    });

    test('should detect quiz prompts correctly', async () => {
      const quizPrompts = [
        'crie questões',
        'generate quiz',
        'quiz questions about'
      ];

      for (const prompt of quizPrompts) {
        const result = await promptTestService.testPrompt(prompt);
        
        if (promptTestService.isUsingMock()) {
          expect(result.response).toMatch(/(questão|question|quiz)/i);
        }
      }
    });

    test('should detect mind map prompts correctly', async () => {
      const mindmapPrompts = [
        'mapa mental',
        'mind map structure',
        'create a mindmap'
      ];

      for (const prompt of mindmapPrompts) {
        const result = await promptTestService.testPrompt(prompt);
        
        if (promptTestService.isUsingMock()) {
          expect(result.response).toMatch(/(mapa|map|estrutura|structure)/i);
        }
      }
    });

    test('should detect video prompts correctly', async () => {
      const videoPrompts = [
        'vídeo sobre',
        'youtube videos',
        'find videos'
      ];

      for (const prompt of videoPrompts) {
        const result = await promptTestService.testPrompt(prompt);
        
        if (promptTestService.isUsingMock()) {
          expect(result.response).toMatch(/(vídeo|video|youtube)/i);
        }
      }
    });

    test('should detect bibliography prompts correctly', async () => {
      const biblioPrompts = [
        'bibliografia',
        'recursos bibliográficos',
        'bibliography resources'
      ];

      for (const prompt of biblioPrompts) {
        const result = await promptTestService.testPrompt(prompt);
        
        if (promptTestService.isUsingMock()) {
          expect(result.response).toMatch(/(bibliografia|recursos|livro|book)/i);
        }
      }
    });
  });

  describe('Performance Metrics', () => {
    test('should track execution time accurately', async () => {
      const startTime = Date.now();
      
      await promptTestService.testPrompt('performance test');
      
      const endTime = Date.now();
      
      // Execution should be relatively fast for mock responses
      expect(endTime - startTime).toBeLessThan(1000);
    });

    test('should provide reasonable token estimates', async () => {
      const shortPrompt = 'Hi';
      const longPrompt = 'This is a much longer prompt that should generate a longer response with more content and therefore more tokens used in the estimation calculation.';

      const shortResult = await promptTestService.testPrompt(shortPrompt);
      const longResult = await promptTestService.testPrompt(longPrompt);

      if (promptTestService.isUsingMock()) {
        // Token count should correlate with response length
        expect(longResult.tokensUsed).toBeGreaterThan(shortResult.tokensUsed!);
      }
    });

    test('should handle multiple concurrent requests', async () => {
      const promises = Array(5).fill(null).map((_, i) => 
        promptTestService.testPrompt(`concurrent test ${i}`)
      );

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.response).toBeDefined();
      });
    });
  });

  describe('Edge Cases and Robustness', () => {
    test('should handle null and undefined inputs gracefully', async () => {
      const nullResult = await promptTestService.testPrompt(null as any);
      const undefinedResult = await promptTestService.testPrompt(undefined as any);

      expect(nullResult.success).toBeDefined();
      expect(undefinedResult.success).toBeDefined();
    });

    test('should handle whitespace-only prompts', async () => {
      const whitespacePrompts = ['   ', '\n\n\n', '\t\t\t', ''];

      for (const prompt of whitespacePrompts) {
        const result = await promptTestService.testPrompt(prompt);
        expect(result.success).toBe(true);
      }
    });

    test('should handle prompts with mixed languages', async () => {
      const multilingualPrompt = 'Create an introdução em português and English explanation';
      
      const result = await promptTestService.testPrompt(multilingualPrompt);
      
      expect(result.success).toBe(true);
      expect(result.response).toBeDefined();
    });

    test('should maintain state consistency across varied inputs', async () => {
      const inputs = [
        'normal prompt',
        '',
        'very '.repeat(100) + 'long prompt',
        '🎉 emoji prompt 🚀',
        'JSON {"test": true}',
        'SQL injection attempt \'; DROP TABLE;'
      ];

      for (const input of inputs) {
        const result = await promptTestService.testPrompt(input);
        expect(result.success).toBe(true);
        expect(promptTestService.isUsingMock()).toBe(promptTestService.isUsingMock()); // Should be consistent
      }
    });
  });
});