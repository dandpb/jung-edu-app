# API Integration Testing Guide

This document explains how to run tests with either mock APIs or real API integrations.

## Overview

The test suite now supports two modes:
- **Mock Mode** (default): Uses mock implementations for all external APIs
- **Real API Mode**: Uses actual API services (requires valid API keys)

Integration and end-to-end tests are excluded from regular test runs and must be run explicitly using the `test:integration` command.

## Running Tests

### Standard Unit Tests (Mock Mode)

```bash
# Run all tests except integration tests (uses mocks)
npm test

# Run tests with coverage (excludes integration tests)
npm run test:coverage

# Run specific test suites
npm run test:unit        # Unit tests only
npm run test:components  # Component tests only
npm run test:utils       # Utility tests only
```

### Integration Tests

```bash
# Run integration tests with mocks (default)
npm run test:integration

# Run integration tests with real APIs
npm run test:integration:real

# Run all tests including integration tests
npm run test:all:with-integration
```

## Configuration

### Environment Variables

To use real APIs in integration tests, you need to set the following environment variables:

```bash
# Enable real API mode
export USE_REAL_API=true

# Set API keys (required for real API mode)
export REACT_APP_OPENAI_API_KEY="your-openai-api-key"
export REACT_APP_YOUTUBE_API_KEY="your-youtube-api-key"
```

### Test Configuration API

The test suite provides utilities for managing API modes:

```typescript
import { 
  setupIntegrationTest, 
  getTestLLMProvider, 
  testWithAPI,
  shouldUseRealAPI 
} from './test-utils/integrationTestHelpers';

// Setup integration test environment
setupIntegrationTest('My Integration Test Suite');

// Get appropriate provider based on configuration
const provider = await getTestLLMProvider();

// Conditionally run tests based on API availability
testWithAPI('openai', 'test real OpenAI API', async () => {
  // This test only runs when USE_REAL_API=true and OpenAI key is set
});

// Check if a specific service should use real API
if (shouldUseRealAPI('youtube')) {
  // Use real YouTube API
} else {
  // Use mock
}
```

## Key Features

### 1. Automatic Mode Detection

- Tests automatically detect whether to use real APIs or mocks
- No code changes needed when switching between modes
- Clear console output showing which mode is active

### 2. Conditional Test Execution

- Tests requiring real APIs are automatically skipped in mock mode
- Prevents test failures due to missing API keys
- Clear skip messages explain why tests were skipped

### 3. Performance Monitoring

- Integration tests measure API call duration
- Helps identify performance bottlenecks
- Useful for comparing mock vs real API performance

### 4. Safety Features

- API keys are never committed to the repository
- Mock mode is the default to prevent accidental API usage
- Clear warnings when using real APIs

## Best Practices

### 1. Default to Mock Mode

Always use mock mode for:
- Local development
- CI/CD pipelines
- Quick test runs
- When API keys are not available

### 2. Use Real APIs Sparingly

Only use real API mode when:
- Testing actual API integration behavior
- Verifying API response formats
- Performance testing
- Manual integration verification

### 3. Cost Considerations

- Real API calls may incur costs (especially OpenAI)
- Use minimal test data to reduce costs
- Consider using lower-cost models for testing

### 4. Security

- Never commit API keys to version control
- Use environment variables or secure key management
- Rotate API keys regularly
- Use separate keys for testing vs production

## Examples

### Running Mock Tests

```bash
# Default behavior - uses mocks
npm test

# Explicitly use mocks for integration tests
USE_REAL_API=false npm run test:integration
```

### Running Real API Tests

```bash
# Set up environment
export USE_REAL_API=true
export REACT_APP_OPENAI_API_KEY="sk-..."
export REACT_APP_YOUTUBE_API_KEY="AIza..."

# Run integration tests with real APIs
npm run test:integration:real
```

### CI/CD Configuration

```yaml
# Example GitHub Actions configuration
- name: Run Unit Tests
  run: npm test
  
- name: Run Integration Tests (Mock)
  run: npm run test:integration
  
- name: Run Integration Tests (Real APIs)
  if: github.event_name == 'release'
  env:
    USE_REAL_API: true
    REACT_APP_OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
    REACT_APP_YOUTUBE_API_KEY: ${{ secrets.YOUTUBE_API_KEY }}
  run: npm run test:integration:real
```

## Troubleshooting

### Tests Using Real APIs When They Shouldn't

1. Check that `USE_REAL_API` is not set in your environment
2. Verify `setupTests.ts` is being loaded
3. Ensure you're using the correct npm script

### Real API Tests Failing

1. Verify API keys are correctly set
2. Check API key permissions and quotas
3. Ensure network connectivity
4. Look for rate limiting errors

### Mock Tests Not Working

1. Verify mock implementations are up to date
2. Check that environment variables are cleared
3. Ensure mock providers are properly imported

## Summary

This testing approach provides flexibility to:
- Run fast, reliable tests with mocks by default
- Optionally test real API integrations when needed
- Maintain clear separation between unit and integration tests
- Prevent accidental API usage and associated costs