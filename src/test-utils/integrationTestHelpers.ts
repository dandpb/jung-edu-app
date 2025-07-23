/**
 * Integration Test Helpers
 * 
 * Utilities for running integration tests with either real APIs or mocks.
 */

import { getTestConfig, shouldUseRealAPI } from './testConfig';
import { createMockLLMProvider } from './mocks/llmProvider';
import { LLMProvider } from '../services/llm/types';

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
export async function getTestLLMProvider(): Promise<LLMProvider> {
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
 * Skip test if real API is not available
 */
export function skipIfNoRealAPI(service: 'openai' | 'youtube') {
  const shouldSkip = !shouldUseRealAPI(service);
  
  if (shouldSkip) {
    test.skip(`Skipping real ${service} API test - USE_REAL_API is not true or API key is missing`, () => {});
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
    test(`${testName} (REAL API)`, testFn);
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