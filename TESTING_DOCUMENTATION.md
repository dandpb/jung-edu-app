# Testing Documentation - jaqEdu Platform

## Overview

This document provides comprehensive guidance for testing the jaqEdu educational platform, covering unit tests, integration tests, and coverage validation.

## Testing Standards

### Coverage Requirements

Our testing strategy enforces high coverage standards to ensure code quality and reliability:

- **Global Coverage**: 90% minimum (branches, functions, lines, statements)
- **Services Layer**: 95% minimum (critical business logic)
- **Components Layer**: 85% minimum (UI components)
- **Utilities Layer**: 90% minimum (helper functions)

### Critical Files

The following files require 95% coverage due to their critical nature:

- `src/services/llm/provider.ts` - LLM integration core
- `src/services/modules/moduleService.ts` - Module management
- `src/services/quiz/enhancedQuizGenerator.ts` - Quiz generation
- `src/utils/auth.ts` - Authentication utilities
- `src/components/admin/AIModuleGenerator.tsx` - AI module creation

## Test Structure

### Directory Organization

```
src/
├── __tests__/
│   ├── integration/          # Integration tests
│   │   ├── userWorkflows.test.tsx
│   │   ├── crossComponentIntegration.test.tsx
│   │   ├── dataPersistence.test.tsx
│   │   ├── apiIntegration.test.ts
│   │   └── errorHandling.test.tsx
│   ├── mocks/               # Test mocks and fixtures
│   └── services/            # Service-specific tests
├── components/
│   └── __tests__/           # Component tests
├── services/
│   └── __tests__/           # Service tests
└── utils/
    └── __tests__/           # Utility tests
```

## Test Types

### 1. Unit Tests

Test individual components and functions in isolation.

**Location**: Co-located with source files (`__tests__` folders)

**Naming Convention**: `*.test.ts` or `*.test.tsx`

**Example Structure**:
```typescript
describe('ComponentName', () => {
  describe('method/feature', () => {
    it('should handle expected behavior', () => {
      // Test implementation
    });
    
    it('should handle edge cases', () => {
      // Edge case testing
    });
    
    it('should handle error conditions', () => {
      // Error handling testing
    });
  });
});
```

### 2. Integration Tests

Test complete user workflows and component interactions.

**Location**: `src/__tests__/integration/`

**Key Areas Covered**:

#### User Workflows (`userWorkflows.test.tsx`)
- Complete learning session workflow
- Note-taking workflow
- Admin content management workflow
- Search and discovery workflow
- Bibliography and research workflow

#### Cross-Component Integration (`crossComponentIntegration.test.tsx`)
- Module generation to editor integration
- Module to quiz integration
- Module to mind map integration
- Note taking integration
- Data flow between components

#### Data Persistence (`dataPersistence.test.tsx`)
- User progress persistence
- Note persistence
- Module data persistence
- Session state persistence
- Data migration and versioning

#### API Integration (`apiIntegration.test.ts`)
- LLM provider integration
- YouTube API integration
- External service error handling
- Rate limiting and retry logic

#### Error Handling (`errorHandling.test.tsx`)
- Component error boundaries
- Network error recovery
- Invalid data handling
- User input validation

### 3. End-to-End Tests

Test complete application workflows from the user's perspective.

**Tools**: Currently using React Testing Library for integration testing
**Future**: Consider Cypress or Playwright for true E2E testing

## Test Utilities and Mocks

### Mock Strategy

We use comprehensive mocks for external dependencies:

```typescript
// Service mocks
jest.mock('../../services/llm/provider');
jest.mock('../../services/video/youtubeService');

// Component mocks
jest.mock('../../components/external/LibraryComponent');

// API mocks
const mockAxios = axios as jest.Mocked<typeof axios>;
```

### Test Utilities

#### Custom Render Function
```typescript
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AdminProvider } from '../contexts/AdminContext';

export const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <AdminProvider>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </AdminProvider>
  );
};
```

#### Mock Data Factory
```typescript
// Located in src/testUtils/mockData.ts
export const createMockModule = (overrides = {}) => ({
  id: 'test-module',
  title: 'Test Module',
  description: 'A test module',
  concepts: ['concept1', 'concept2'],
  content: 'Test content',
  videos: [],
  quiz: { questions: [] },
  bibliography: [],
  ...overrides
});
```

## Running Tests

### Available Scripts

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run all tests (non-interactive)
npm run test:all

# Watch mode for development
npm run test:watch

# Validate coverage and generate reports
npm run test:validate-coverage
```

### Coverage Validation

Our custom coverage validation script provides:

- ✅ Threshold validation (90% global, 95% services)
- 🔍 Critical file coverage verification
- 📊 Integration test completeness check
- 📈 Detailed reporting with recommendations
- 🎯 Untested file identification

```bash
# Run comprehensive coverage validation
npm run test:validate-coverage

# Results saved to:
# - coverage-reports/validation-report.json
# - coverage-reports/coverage-report.md
# - coverage-reports/badge.md
```

## Best Practices

### Writing Effective Tests

#### 1. Test Structure (AAA Pattern)
```typescript
it('should calculate total score correctly', () => {
  // Arrange
  const questions = createMockQuestions();
  const answers = [0, 1, 2, 0]; // user answers
  
  // Act
  const result = calculateQuizScore(questions, answers);
  
  // Assert
  expect(result.score).toBe(75);
  expect(result.correctAnswers).toBe(3);
});
```

#### 2. Descriptive Test Names
- ✅ `should save user progress when module is completed`
- ❌ `test save progress`

#### 3. Test One Thing at a Time
Each test should verify a single behavior or outcome.

#### 4. Use Proper Assertions
```typescript
// Specific assertions
expect(result).toEqual({
  score: 85,
  passed: true,
  timeSpent: expect.any(Number)
});

// Avoid generic assertions
expect(result).toBeTruthy();
```

#### 5. Handle Async Operations
```typescript
it('should load module data asynchronously', async () => {
  const user = userEvent.setup();
  
  renderComponent();
  
  await user.click(screen.getByRole('button', { name: /load/i }));
  
  await waitFor(() => {
    expect(screen.getByText('Module loaded')).toBeInTheDocument();
  });
});
```

### Integration Test Guidelines

#### 1. Test Real User Workflows
Focus on complete user journeys rather than isolated component behavior.

#### 2. Use Realistic Data
Use realistic test data that mirrors actual application usage.

#### 3. Test Error Scenarios
Include tests for network failures, invalid inputs, and edge cases.

#### 4. Verify State Persistence
Test that user actions persist across component updates and navigation.

#### 5. Test Accessibility
Include accessibility testing in integration tests:

```typescript
it('should be keyboard navigable', async () => {
  const user = userEvent.setup();
  
  renderComponent();
  
  // Test tab navigation
  await user.tab();
  expect(screen.getByRole('button')).toHaveFocus();
  
  // Test keyboard activation
  await user.keyboard('{Enter}');
  expect(mockOnClick).toHaveBeenCalled();
});
```

## Coverage Analysis

### Understanding Coverage Metrics

- **Lines**: Percentage of executable lines tested
- **Branches**: Percentage of conditional branches tested
- **Functions**: Percentage of functions called in tests
- **Statements**: Percentage of statements executed

### Interpreting Results

#### High-Quality Coverage (90%+)
- Comprehensive test scenarios
- Edge cases covered
- Error conditions tested
- User workflows validated

#### Acceptable Coverage (70-89%)
- Core functionality tested
- Some edge cases missing
- May need additional integration tests

#### Insufficient Coverage (<70%)
- Critical gaps in testing
- High risk for production issues
- Requires immediate attention

### Coverage Exclusions

Files excluded from coverage requirements:
- Example files (`*.example.ts`)
- Demo files (`*.demo.ts`)
- Usage examples (`example-usage.ts`)
- Test utilities and mocks
- Type definitions

## Continuous Integration

### Pre-commit Hooks

Coverage validation runs automatically:
1. Before commits (if configured)
2. In CI/CD pipeline
3. Before deployments

### CI/CD Integration

```yaml
# GitHub Actions example
- name: Run tests with coverage
  run: npm run test:coverage

- name: Validate coverage
  run: npm run test:validate-coverage

- name: Upload coverage reports
  uses: actions/upload-artifact@v2
  with:
    name: coverage-reports
    path: coverage-reports/
```

## Troubleshooting

### Common Issues

#### 1. Coverage Threshold Failures
```bash
# Check specific file coverage
npm run test:coverage -- --collectCoverageFrom="src/specific-file.ts"

# Run specific test
npm test -- specific-test.test.ts
```

#### 2. Integration Test Timeouts
```typescript
// Increase timeout for slow operations
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
}, { timeout: 10000 });
```

#### 3. Mock Issues
```typescript
// Clear mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});

// Reset modules for fresh imports
beforeEach(() => {
  jest.resetModules();
});
```

#### 4. Async Test Failures
```typescript
// Always use await with user events
await user.click(button);
await user.type(input, 'text');

// Wait for state updates
await waitFor(() => {
  expect(mockFunction).toHaveBeenCalled();
});
```

## Maintenance

### Regular Tasks

1. **Weekly**: Review coverage reports for trends
2. **Monthly**: Update test scenarios for new features
3. **Quarterly**: Review and update testing standards
4. **Release**: Full coverage validation and reporting

### Updating Tests

When adding new features:
1. Write tests first (TDD approach)
2. Ensure integration test coverage
3. Update test documentation
4. Validate coverage thresholds

### Performance Considerations

- Keep test suites fast (<30 seconds for full suite)
- Use selective test running during development
- Mock expensive operations
- Parallelize test execution where possible

## Reporting and Metrics

### Generated Reports

1. **HTML Coverage Report**: `coverage/lcov-report/index.html`
2. **JSON Summary**: `coverage/coverage-summary.json`
3. **Validation Report**: `coverage-reports/validation-report.json`
4. **Markdown Summary**: `coverage-reports/coverage-report.md`

### Key Metrics to Track

- Overall coverage percentage
- Test execution time
- Number of failing tests
- Coverage trend over time
- Critical file coverage status

### Badge Integration

Coverage badges are automatically generated and can be included in README:

```markdown
![Coverage Badge](./coverage-reports/badge.md)
```

## Getting Help

### Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

### Internal Contacts

- **Testing Lead**: Review testing standards and practices
- **DevOps Team**: CI/CD pipeline and coverage reporting
- **Development Team**: Feature-specific testing guidance

---

*Last updated: ${new Date().toISOString().split('T')[0]}*