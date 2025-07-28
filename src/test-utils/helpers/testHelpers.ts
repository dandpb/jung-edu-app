import { render, RenderOptions, RenderResult } from '@testing-library/react';
import React, { ReactElement } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Quiz } from '../../types/schema';
import { Question } from '../../types';
import { EducationalModule } from '../../schemas/module.schema';

/**
 * Custom render function that includes commonly needed providers
 */
export function renderWithRouter(
  ui: ReactElement,
  options?: RenderOptions
): RenderResult {
  return render(
    React.createElement(BrowserRouter, null, ui),
    options
  );
}

/**
 * Wait for async operations with timeout
 */
export const waitForAsync = (ms: number = 100): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Mock fetch responses for testing
 */
export const mockFetch = (response: any, options?: {
  status?: number;
  headers?: Record<string, string>;
  delay?: number;
}) => {
  const { status = 200, headers = {}, delay = 0 } = options || {};
  
  global.fetch = jest.fn(() => 
    new Promise(resolve => {
      setTimeout(() => {
        resolve({
          ok: status >= 200 && status < 300,
          status,
          headers: new Headers(headers),
          json: async () => response,
          text: async () => JSON.stringify(response),
          blob: async () => new Blob([JSON.stringify(response)]),
        } as Response);
      }, delay);
    })
  );
};

/**
 * Restore fetch to original implementation
 */
export const restoreFetch = () => {
  if ('fetch' in global && jest.isMockFunction(global.fetch)) {
    (global.fetch as jest.Mock).mockRestore();
  }
};

/**
 * Local storage test utilities
 */
export const localStorageUtils = {
  setup: () => {
    const store: Record<string, string> = {};
    
    const mockLocalStorage = {
      getItem: jest.fn((key: string) => store[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        Object.keys(store).forEach(key => delete store[key]);
      }),
      get length() {
        return Object.keys(store).length;
      },
      key: jest.fn((index: number) => {
        const keys = Object.keys(store);
        return keys[index] || null;
      })
    };

    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });

    return mockLocalStorage;
  },
  
  reset: () => {
    localStorage.clear();
    jest.clearAllMocks();
  }
};

/**
 * Session storage test utilities (similar to localStorage)
 */
export const sessionStorageUtils = {
  setup: () => {
    const store: Record<string, string> = {};
    
    const mockSessionStorage = {
      getItem: jest.fn((key: string) => store[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        Object.keys(store).forEach(key => delete store[key]);
      })
    };

    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true
    });

    return mockSessionStorage;
  },
  
  reset: () => {
    sessionStorage.clear();
    jest.clearAllMocks();
  }
};

/**
 * Assert that a module is valid according to schema
 */
export function assertValidModule(module: any): asserts module is EducationalModule {
  expect(module).toHaveProperty('id');
  expect(module).toHaveProperty('title');
  expect(module).toHaveProperty('content');
  expect(module.content).toHaveProperty('introduction');
  expect(module.content).toHaveProperty('sections');
  expect(Array.isArray(module.content.sections)).toBe(true);
}

/**
 * Assert that a quiz is valid
 */
export function assertValidQuiz(quiz: any): asserts quiz is Quiz {
  expect(quiz).toHaveProperty('id');
  expect(quiz).toHaveProperty('title');
  expect(quiz).toHaveProperty('questions');
  expect(Array.isArray(quiz.questions)).toBe(true);
  expect(quiz.questions.length).toBeGreaterThan(0);
}

/**
 * Assert that a question is valid
 */
export function assertValidQuestion(question: any): asserts question is Question {
  expect(question).toHaveProperty('id');
  expect(question).toHaveProperty('type');
  expect(question).toHaveProperty('question');
  
  if (question.type === 'multiple-choice') {
    expect(question).toHaveProperty('options');
    expect(Array.isArray(question.options)).toBe(true);
    expect(question.options.length).toBeGreaterThan(1);
  }
  
  if (question.type !== 'essay') {
    expect(question).toHaveProperty('correctAnswer');
  }
}

/**
 * Create a mock console to suppress or capture logs in tests
 */
export const mockConsole = () => {
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
    debug: console.debug
  };

  const logs: { type: string; args: any[] }[] = [];

  console.log = jest.fn((...args) => logs.push({ type: 'log', args }));
  console.error = jest.fn((...args) => logs.push({ type: 'error', args }));
  console.warn = jest.fn((...args) => logs.push({ type: 'warn', args }));
  console.info = jest.fn((...args) => logs.push({ type: 'info', args }));
  console.debug = jest.fn((...args) => logs.push({ type: 'debug', args }));

  return {
    logs,
    restore: () => {
      console.log = originalConsole.log;
      console.error = originalConsole.error;
      console.warn = originalConsole.warn;
      console.info = originalConsole.info;
      console.debug = originalConsole.debug;
    },
    expectNoErrors: () => {
      expect(logs.filter(l => l.type === 'error')).toHaveLength(0);
    },
    expectNoWarnings: () => {
      expect(logs.filter(l => l.type === 'warn')).toHaveLength(0);
    }
  };
};

/**
 * Test data constants
 */
export const testConstants = {
  sampleYouTubeId: 'dQw4w9WgXcQ',
  sampleYouTubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  sampleImageUrl: 'https://example.com/test-image.jpg',
  samplePdfUrl: 'https://example.com/test-document.pdf',
  
  jungianConcepts: [
    'Collective Unconscious',
    'Archetypes',
    'Shadow',
    'Anima/Animus',
    'Self',
    'Individuation',
    'Persona',
    'Complexes',
    'Synchronicity',
    'Active Imagination'
  ],
  
  difficultyLevels: ['beginner', 'intermediate', 'advanced', 'expert'] as const,
  
  questionTypes: ['multiple-choice', 'true-false', 'essay'] as const,
  
  moduleStatuses: ['draft', 'published', 'archived'] as const
};

/**
 * Generate test IDs consistently
 */
export const generateTestId = (prefix: string): string => {
  return `${prefix}-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Clean up after tests (useful for integration tests)
 */
export const cleanupTestData = () => {
  // Clear localStorage
  localStorage.clear();
  
  // Clear sessionStorage
  sessionStorage.clear();
  
  // Clear all mocks
  jest.clearAllMocks();
  
  // Restore all mocks
  jest.restoreAllMocks();
};

/**
 * Performance testing helper
 */
export const measurePerformance = async (
  fn: () => Promise<any>,
  label: string = 'Operation'
): Promise<{ result: any; duration: number }> => {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  
  console.log(`${label} took ${duration.toFixed(2)}ms`);
  
  return { result, duration };
};

/**
 * Retry helper for flaky operations
 */
export const retry = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 100
): Promise<T> => {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        await waitForAsync(delay * attempt);
      }
    }
  }
  
  throw lastError;
};