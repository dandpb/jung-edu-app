/**
 * Setup file for integration tests
 * Ensures proper mocking and environment setup
 */

// Mock the services that the IntegrationValidator uses
jest.mock('../../modules/moduleService');
jest.mock('../../video/youtubeService');
jest.mock('../../quiz/quizValidator');
jest.mock('../../llm/orchestrator');

// Mock any axios calls
jest.mock('axios', () => ({
  default: {
    create: jest.fn(() => ({
      post: jest.fn(),
      get: jest.fn()
    }))
  }
}));

// Mock OpenAI
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn()
      }
    },
    models: {
      list: jest.fn()
    }
  }))
}));

// Export setup function
export function setupIntegrationTestEnvironment() {
  // Clear all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  // Ensure proper environment
  beforeAll(() => {
    // Set mock mode
    process.env.USE_MOCK_SERVICES = 'true';
    delete process.env.SKIP_INTEGRATION;
  });
}