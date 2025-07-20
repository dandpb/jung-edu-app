# Jung Edu App Test Suite

This directory contains comprehensive tests for the Jung Edu App module generation system.

## Test Structure

```
__tests__/
├── services/           # Unit tests for individual services
│   ├── llm/           # LLM provider tests
│   ├── video/         # YouTube service tests
│   ├── quiz/          # Quiz generator tests
│   ├── bibliography/  # Bibliography enricher tests
│   ├── mindmap/       # Mind map generator tests
│   └── modules/       # Module service tests
├── integration/       # Integration tests
│   ├── moduleGeneration.test.tsx  # Full workflow tests
│   └── errorHandling.test.tsx     # Error scenarios
└── mocks/            # Mock data and utilities
    └── mockData.ts   # Shared mock objects
```

## Running Tests

### All Tests
```bash
npm test                    # Run in watch mode
npm run test:all           # Run all tests once
npm run test:coverage      # Run with coverage report
```

### Specific Test Suites
```bash
npm run test:unit          # Run unit tests only
npm run test:integration   # Run integration tests only
```

### Individual Test Files
```bash
npm test -- provider.test.ts              # Run specific test file
npm test -- --testNamePattern="generate"  # Run tests matching pattern
```

## Test Coverage

The test suite aims for high coverage with thresholds:
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

## Mock Data

All tests use centralized mock data from `mocks/mockData.ts`:
- `mockModule` - Complete module structure
- `mockVideo` - YouTube video data
- `mockQuiz` - Quiz with questions
- `mockMindMapData` - Mind map nodes/edges
- `mockBibliographyItem` - Bibliography reference
- `mockApiResponses` - Mock API functions

## Writing Tests

### Unit Tests
Focus on individual service methods:
```typescript
describe('ServiceName', () => {
  let service: ServiceName;
  
  beforeEach(() => {
    service = new ServiceName();
  });
  
  it('should perform expected behavior', async () => {
    const result = await service.method();
    expect(result).toEqual(expected);
  });
});
```

### Integration Tests
Test complete workflows:
```typescript
it('should complete full module generation', async () => {
  const user = userEvent.setup();
  renderWithContext(<Component />);
  
  // User interactions
  await user.type(screen.getByLabelText(/title/i), 'Test');
  await user.click(screen.getByRole('button'));
  
  // Verify results
  await waitFor(() => {
    expect(screen.getByText(/complete/i)).toBeInTheDocument();
  });
});
```

## Key Test Scenarios

### Service Tests
- ✅ API call mocking
- ✅ Error handling and retries
- ✅ Input validation
- ✅ Response parsing
- ✅ Caching behavior

### Integration Tests
- ✅ Full generation workflow
- ✅ Progress tracking
- ✅ Error recovery
- ✅ Component interaction
- ✅ State management

### Error Handling
- ✅ Network failures
- ✅ API rate limits
- ✅ Invalid responses
- ✅ Timeout scenarios
- ✅ Partial failures

## Debugging Tests

### View Test Output
```bash
npm test -- --verbose     # Show detailed output
npm test -- --no-coverage # Skip coverage for faster runs
```

### Debug Specific Tests
```typescript
it.only('should debug this test', () => {
  // This test runs in isolation
});
```

### Check Coverage Gaps
```bash
npm run test:coverage
# Then open coverage/lcov-report/index.html
```

## Best Practices

1. **Use Mock Data**: Import from `mockData.ts` for consistency
2. **Mock External APIs**: Never make real API calls in tests
3. **Test User Flows**: Focus on real user scenarios
4. **Handle Async**: Use `waitFor` for async operations
5. **Clean Setup/Teardown**: Reset mocks in `beforeEach`/`afterEach`

## Continuous Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Pre-deployment checks

Failed tests block merges and deployments.