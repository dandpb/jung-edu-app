/**
 * Test Configuration
 * 
 * This module provides configuration for running tests with either real APIs or mocks.
 * By default, all tests use mocks unless explicitly configured otherwise.
 */

export interface TestConfig {
  useRealAPI: boolean;
  apiKeys?: {
    openai?: string;
    youtube?: string;
  };
}

/**
 * Get the current test configuration based on environment variables
 */
export function getTestConfig(): TestConfig {
  const useRealAPI = process.env.USE_REAL_API === 'true';
  
  return {
    useRealAPI,
    apiKeys: useRealAPI ? {
      openai: process.env.REACT_APP_OPENAI_API_KEY,
      youtube: process.env.REACT_APP_YOUTUBE_API_KEY,
    } : undefined,
  };
}

/**
 * Check if we should use real API for a specific service
 */
export function shouldUseRealAPI(service: 'openai' | 'youtube'): boolean {
  const config = getTestConfig();
  
  if (!config.useRealAPI) {
    return false;
  }
  
  // Check if the specific API key is available
  switch (service) {
    case 'openai':
      return !!config.apiKeys?.openai;
    case 'youtube':
      return !!config.apiKeys?.youtube;
    default:
      return false;
  }
}

/**
 * Setup test environment based on configuration
 */
export function setupTestEnvironment(): void {
  const config = getTestConfig();
  
  if (!config.useRealAPI) {
    // Clear all API keys to ensure mocks are used
    delete process.env.REACT_APP_OPENAI_API_KEY;
    delete process.env.REACT_APP_YOUTUBE_API_KEY;
    
    // Set mock mode flags
    process.env.USE_MOCK_SERVICES = 'true';
  } else {
    // When using real APIs, ensure mock mode is disabled
    delete process.env.USE_MOCK_SERVICES;
    
    // Warn if API keys are missing
    if (!config.apiKeys?.openai) {
      console.warn('⚠️  OpenAI API key not found. OpenAI tests will use mocks.');
    }
    if (!config.apiKeys?.youtube) {
      console.warn('⚠️  YouTube API key not found. YouTube tests will use mocks.');
    }
  }
}

/**
 * Reset test environment to default state (mocks)
 */
export function resetTestEnvironment(): void {
  delete process.env.REACT_APP_OPENAI_API_KEY;
  delete process.env.REACT_APP_YOUTUBE_API_KEY;
  delete process.env.USE_REAL_API;
  process.env.USE_MOCK_SERVICES = 'true';
}