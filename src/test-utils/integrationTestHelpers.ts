/**
 * Integration Test Helpers
 * 
 * Utilities for running integration tests with either real APIs or mocks.
 */

import { getTestConfig, shouldUseRealAPI } from './testConfig';
import { createMockLLMProvider } from './mocks/llmProvider';
import { ILLMProvider } from '../services/llm/types';

// Import Jest globals explicitly
declare const test: jest.It;
declare const beforeAll: jest.Lifecycle;
declare const afterAll: jest.Lifecycle;

/**
 * Setup an integration test with the appropriate API configuration
 */
export function setupIntegrationTest(testName: string) {
  const config = getTestConfig();
  
  beforeAll(() => {
    console.log(`🧪 Running ${testName}`);
    console.log(`📡 API Mode: ${config.useRealAPI ? 'REAL' : 'MOCK'}`);
    
    if (config.useRealAPI) {
      console.log('⚠️  Warning: Using real APIs. This may incur costs and require valid API keys.');
    }
  });
  
  afterAll(() => {
    // Reset to mock mode after integration tests
    process.env.USE_MOCK_SERVICES = 'true';
  });
}

/**
 * Get an LLM provider based on the current test configuration
 */
export async function getTestLLMProvider(): Promise<ILLMProvider> {
  if (shouldUseRealAPI('openai')) {
    // Dynamically import to avoid loading OpenAI when not needed
    const { OpenAIProvider } = await import('../services/llm/provider');
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenAI API key is required for real API tests');
    }
    
    return new OpenAIProvider(apiKey);
  } else {
    // Use mock provider
    return createMockLLMProvider();
  }
}

/**
 * Check if real API is available (without skipping)
 */
export function isRealAPIAvailable(service: 'openai' | 'youtube'): boolean {
  return shouldUseRealAPI(service);
}

/**
 * Skip test if real API is not available (deprecated - use conditional testing instead)
 * @deprecated Use isRealAPIAvailable() with conditional test logic instead
 */
export function skipIfNoRealAPI(service: 'openai' | 'youtube') {
  const shouldSkip = !shouldUseRealAPI(service);
  
  if (shouldSkip) {
    // Return true to indicate test should be skipped, but don't call test.skip globally
    console.log(`Real ${service} API test would be skipped - USE_REAL_API is not true or API key is missing`);
    return true;
  }
  
  return false;
}

/**
 * Conditional test runner based on API availability
 */
export function testWithAPI(
  service: 'openai' | 'youtube',
  testName: string,
  testFn: () => void | Promise<void>
) {
  const isUsingRealAPI = shouldUseRealAPI(service);
  if (isUsingRealAPI) {
    test(`${testName} (REAL API)`, testFn as any);
  } else {
    test(`${testName} (SKIPPED - Mock Mode)`, () => {
      console.log(`Skipping test in mock mode: ${testName}`);
    });
  }
}

/**
 * Get API configuration for display in test output
 */
export function getAPIStatus(): string {
  const config = getTestConfig();
  const openAIStatus = shouldUseRealAPI('openai') ? '✅ Real' : '🔀 Mock';
  const youTubeStatus = shouldUseRealAPI('youtube') ? '✅ Real' : '🔀 Mock';
  
  return `
╔═══════════════════════════════════════╗
║         API Configuration             ║
╟───────────────────────────────────────╢
║ Mode: ${config.useRealAPI ? 'REAL API' : 'MOCK MODE'}                      ║
║ OpenAI: ${openAIStatus}                       ║
║ YouTube: ${youTubeStatus}                      ║
╚═══════════════════════════════════════╝
`;
}

/**
 * Helper to measure API call duration
 */
export async function measureAPICall<T>(
  operation: string,
  apiCall: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await apiCall();
  const duration = performance.now() - start;
  
  console.log(`⏱️  ${operation} took ${duration.toFixed(2)}ms`);
  
  return { result, duration };
}