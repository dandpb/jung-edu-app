# Test Utilities Documentation

This directory contains optimized test utilities, mocks, and helpers to improve test quality and reduce duplication across the test suite.

## Directory Structure

```
test-utils/
├── mocks/
│   ├── llmProvider.ts      # LLM provider mocks and factories
│   ├── handlers.ts         # MSW API mock handlers
│   └── server.ts           # MSW server setup
├── builders/
│   ├── moduleBuilder.ts    # Builder pattern for test modules
│   └── quizBuilder.ts      # Builder pattern for test quizzes
├── helpers/
│   └── testHelpers.ts      # Common test utilities and helpers
├── examples/
│   └── optimized-test-example.test.ts  # Example usage
└── index.ts               # Central export point
```

## Quick Start

### Import Everything You Need

```typescript
import {
  // Builders
  ModuleBuilder,
  QuizBuilder,
  
  // Mocks
  createMockLLMProvider,
  createMockQuestions,
  
  // Helpers
  setupTest,
  renderWithRouter,
  assertValidModule,
  
  // Testing library exports
  screen,
  fireEvent,
  waitFor
} from '../test-utils';
```

### Basic Test Setup

```typescript
import { setupTest } from '../test-utils';

// Apply common test setup
setupTest();

describe('Your Test Suite', () => {
  // Your tests here
});
```

## Builders

### ModuleBuilder

Create test modules with sensible defaults:

```typescript
// Minimal module
const module = ModuleBuilder.minimal();

// Complete module with all fields
const module = ModuleBuilder.complete();

// Module for specific concept
const module = ModuleBuilder.withConcept('shadow');

// Custom module
const module = new ModuleBuilder()
  .withTitle('Custom Module')
  .withDifficulty('advanced')
  .withTags('jung', 'psychology')
  .withTimeEstimate(2, 30)
  .build();
```

### QuizBuilder

Create test quizzes easily:

```typescript
// Basic quiz
const quiz = QuizBuilder.basic(10); // 10 questions

// Comprehensive quiz with essays
const quiz = QuizBuilder.comprehensive();

// Quiz for specific concept
const quiz = QuizBuilder.forConcept('individuation', 5);

// Custom quiz
const quiz = new QuizBuilder()
  .withTitle('Custom Quiz')
  .withTimeLimit(20)
  .withPassingScore(75)
  .addMultipleChoiceQuestion({
    question: 'What is the Shadow?',
    options: ['A', 'B', 'C', 'D'],
    correctIndex: 0,
    difficulty: 'medium'
  })
  .build();
```

## Mocks

### LLM Provider Mocks

```typescript
// Basic mock
const mockProvider = createMockLLMProvider();

// Mock with specific pattern
const mockProvider = createMockLLMProviderWithPatterns('success'); // or 'failure', 'partial', 'slow'

// Create mock questions
const questions = createMockQuestions(10, {
  type: 'mixed',
  difficulty: 'medium',
  concepts: ['shadow', 'anima']
});

// Use predefined responses
const { moduleOutline, quizQuestions } = mockLLMResponses;
```

### MSW API Mocks

MSW handlers are automatically active in tests. Override for specific scenarios:

```typescript
import { useErrorHandlers, useDelayedHandlers } from '../test-utils/mocks/server';

it('handles errors', () => {
  useErrorHandlers(); // All requests will fail
  // Your test
});

it('handles loading states', () => {
  useDelayedHandlers(); // All requests delayed by 2s
  // Your test
});
```

## Helpers

### Test Setup Utilities

```typescript
// Local storage mock
const mockStorage = localStorageUtils.setup();
localStorageUtils.reset();

// Session storage mock
const mockSession = sessionStorageUtils.setup();
sessionStorageUtils.reset();

// Mock console
const { logs, restore, expectNoErrors } = mockConsole();
// ... your test
expectNoErrors();
restore();
```

### Assertion Helpers

```typescript
// Validate data structures
assertValidModule(module);
assertValidQuiz(quiz);
assertValidQuestion(question);
```

### Render Helpers

```typescript
// Render with Router
renderWithRouter(<YourComponent />);

// Wait for async operations
await waitForAsync(100); // Wait 100ms
```

### Test Scenarios

```typescript
// Test retry logic
await testScenarios.withRetries(
  () => myService.fetchData(),
  3, // Expected retries
  mockFetch
);

// Test rate limiting
await testScenarios.withRateLimit(
  () => api.makeRequest(),
  10, // Rate limit
  1000 // Time window (ms)
);

// Test caching
await testScenarios.withCache(
  (key) => cache.get(key),
  mockImplementation
);
```

## Performance Testing

```typescript
import { measurePerformance } from '../test-utils';

const { result, duration } = await measurePerformance(
  () => complexOperation(),
  'Complex Operation'
);

expect(duration).toBeLessThan(1000); // Under 1 second
```

## Test Constants

```typescript
import { testConstants } from '../test-utils';

const {
  jungianConcepts,    // Array of Jungian concepts
  difficultyLevels,   // ['beginner', 'intermediate', 'advanced', 'expert']
  questionTypes,      // ['multiple-choice', 'true-false', 'essay']
  moduleStatuses,     // ['draft', 'published', 'archived']
  sampleYouTubeUrl,   // Sample YouTube URL
} = testConstants;
```

## Best Practices

1. **Use Builders for Test Data**: Instead of manually creating objects, use builders for consistency and maintainability.

2. **Centralize Mocks**: Use the provided mock factories instead of creating ad-hoc mocks in each test file.

3. **Apply Common Setup**: Use `setupTest()` to ensure consistent test environment.

4. **Leverage Test Scenarios**: Use predefined scenarios for common patterns like retries, rate limiting, and caching.

5. **Assert with Helpers**: Use assertion helpers to validate data structures consistently.

## Migration Guide

To migrate existing tests to use these utilities:

1. Replace manual module/quiz creation with builders
2. Replace custom LLM mocks with `createMockLLMProvider`
3. Replace localStorage mocks with `localStorageUtils`
4. Import from central `test-utils` instead of multiple imports
5. Use `setupTest()` instead of manual beforeEach/afterEach

Example migration:

```typescript
// Before
const mockModule = {
  id: 'test-123',
  title: 'Test Module',
  // ... many more fields
};

// After
const mockModule = ModuleBuilder.minimal();
// or
const mockModule = new ModuleBuilder()
  .withId('test-123')
  .withTitle('Test Module')
  .build();
```

## Troubleshooting

- **Import errors**: Make sure to import from `src/test-utils` not `test-utils`
- **MSW not intercepting**: Check that handlers match your API endpoints
- **Builders missing fields**: Use `.complete()` static methods for fully populated objects
- **Type errors**: All utilities are fully typed - check your TypeScript configuration