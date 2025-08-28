# Test Infrastructure Documentation

## Overview

This directory contains the comprehensive test infrastructure for the jaqEdu educational platform. The infrastructure is designed to support reliable, scalable, and maintainable testing across all layers of the application.

## Architecture

### Directory Structure

```
tests/
├── README.md                          # This file
├── config/
│   └── unified-test.config.ts         # Unified test configuration
├── infrastructure/
│   ├── test-database-manager.ts       # Database management and isolation
│   ├── test-data-factory.ts           # Test data generation
│   ├── test-execution-manager.ts      # Parallel test execution
│   └── test-reporting-system.ts       # Test reporting and artifacts
├── utils/
│   └── logger.ts                      # Test logging utilities
├── e2e/                               # End-to-end tests
├── integration/                       # Integration tests
├── performance/                       # Performance tests
├── factories/                         # Data factories
├── fixtures/                          # Test fixtures
├── mocks/                            # Mock implementations
└── automation/                       # Automated test scenarios
```

## Key Components

### 1. Unified Test Configuration (`config/unified-test.config.ts`)

Provides environment-specific configurations for all test types:

- **Local Development**: SQLite, Docker containers
- **CI/CD**: TestContainers, isolated databases
- **Staging**: Real staging services
- **Production-like**: Read-only production copies

### 2. Test Database Manager (`infrastructure/test-database-manager.ts`)

Features:
- **Transaction Isolation**: Each test runs in isolated transactions
- **Database Snapshots**: Save and restore database states
- **Migration Management**: Automatic test schema migrations
- **Connection Pooling**: Efficient database connection management

### 3. Test Data Factory (`infrastructure/test-data-factory.ts`)

Comprehensive data generation:
- **Realistic Data**: Using Faker.js for realistic test data
- **Relationships**: Handles complex entity relationships
- **Scenarios**: Pre-built scenarios for common test cases
- **Customization**: Override defaults for specific test needs

### 4. Test Execution Manager (`infrastructure/test-execution-manager.ts`)

Advanced parallel execution:
- **Worker Pool**: Manages multiple test execution workers
- **Resource Management**: Monitors and allocates system resources
- **Dependency Resolution**: Handles test suite dependencies
- **Real-time Monitoring**: Live test execution monitoring

### 5. Test Reporting System (`infrastructure/test-reporting-system.ts`)

Multi-format reporting:
- **HTML Reports**: Interactive test result dashboards
- **JUnit XML**: CI/CD integration compatibility
- **JSON Reports**: Programmatic result processing
- **Allure Integration**: Advanced test reporting with history
- **Artifact Management**: Screenshots, videos, logs storage

## Test Types

### Unit Tests (70% of test suite)
- **Location**: `jung-edu-app/src/**/__tests__/`
- **Framework**: Jest + React Testing Library
- **Coverage Target**: 80%
- **Execution Time**: < 30 seconds

### Integration Tests (20% of test suite)
- **Location**: `tests/integration/`
- **Framework**: Jest + TestContainers
- **Coverage Target**: 70%
- **Execution Time**: < 5 minutes

### End-to-End Tests (10% of test suite)
- **Location**: `tests/e2e/`
- **Framework**: Playwright
- **Coverage Target**: 90% of critical user journeys
- **Execution Time**: < 15 minutes

### Performance Tests
- **Location**: `tests/performance/`
- **Framework**: K6 + Custom performance suite
- **Metrics**: Response time, throughput, resource usage
- **Execution**: Nightly and on-demand

### Security Tests
- **Location**: `tests/security/`
- **Framework**: OWASP ZAP + Custom security tests
- **Scope**: Vulnerability scanning, penetration testing
- **Execution**: Weekly and before releases

## Usage

### Quick Start

```bash
# Install dependencies
npm install

# Run all unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run performance tests
npm run test:performance

# Generate coverage report
npm run test:coverage
```

### Advanced Usage

```bash
# Run tests with specific environment
TEST_ENV=staging npm run test:integration

# Run tests in parallel with custom worker count
npm run test:unit -- --maxWorkers=8

# Run tests with debugging
npm run test:unit -- --detectOpenHandles --forceExit

# Generate test report
npm run test:report

# Run specific test pattern
npm run test:unit -- --testNamePattern="UserService"
```

### CI/CD Integration

The test infrastructure integrates with GitHub Actions:

```yaml
# .github/workflows/test-pipeline.yml
- name: Run Test Suite
  run: |
    npm run test:unit
    npm run test:integration
    npm run test:e2e
  env:
    TEST_ENV: ci
    CI: true
```

## Configuration

### Environment Variables

```bash
# Test Environment
TEST_ENV=local|ci|staging|production-like

# Database Configuration
TEST_DB_HOST=localhost
TEST_DB_PORT=5433
TEST_DB_NAME=jaqedu_test
TEST_DB_USER=test_user
TEST_DB_PASS=test_pass

# Redis Configuration
TEST_REDIS_HOST=localhost
TEST_REDIS_PORT=6380
TEST_REDIS_DB=1

# External Services
TEST_OPENAI_API_KEY=test-key
TEST_SUPABASE_URL=http://localhost:54321
TEST_YOUTUBE_API_KEY=test-key
```

### Test Configuration Files

- **jest.config.js**: Unit test configuration
- **playwright.config.ts**: E2E test configuration
- **k6-config.js**: Performance test configuration

## Best Practices

### Writing Tests

1. **Use AAA Pattern**: Arrange, Act, Assert
2. **Descriptive Names**: Test names should describe the behavior
3. **Single Responsibility**: One test should verify one behavior
4. **Independent Tests**: Tests should not depend on each other
5. **Proper Cleanup**: Always clean up after tests

### Test Data

```typescript
// Good: Use factories for consistent test data
const user = testDataFactory.createUser({
  email: 'specific@test.com',
  role: 'admin'
});

// Good: Use builders for complex objects
const module = new ModuleBuilder()
  .withTitle('Test Module')
  .withDifficulty('beginner')
  .withAuthor(user)
  .build();
```

### Mocking

```typescript
// Good: Mock external dependencies
const mockEmailService = {
  sendEmail: jest.fn().mockResolvedValue({ success: true })
};

// Good: Use MSW for HTTP mocking
const server = setupServer(
  rest.get('/api/users', (req, res, ctx) => {
    return res(ctx.json([testDataFactory.createUser()]));
  })
);
```

### Assertions

```typescript
// Good: Specific assertions
expect(result.email).toBe('user@example.com');
expect(result.modules).toHaveLength(3);
expect(mockService.create).toHaveBeenCalledWith(expectedData);

// Good: Custom matchers
expect(response).toMatchApiSchema(userSchema);
expect(element).toBeVisibleOnScreen();
```

## Troubleshooting

### Common Issues

1. **Flaky Tests**
   - Use `waitFor` for async operations
   - Implement proper cleanup
   - Use deterministic test data

2. **Slow Tests**
   - Check for unnecessary waiting
   - Optimize database queries
   - Use test doubles appropriately

3. **Memory Leaks**
   - Ensure proper cleanup in `afterEach`
   - Close database connections
   - Clear timers and intervals

### Debug Configuration

```json
// VS Code launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "env": {
    "NODE_ENV": "test"
  }
}
```

## Performance Monitoring

### Test Execution Metrics

- **Unit Test Duration**: < 30 seconds total
- **Integration Test Duration**: < 5 minutes total
- **E2E Test Duration**: < 15 minutes total
- **Memory Usage**: < 512MB per worker
- **CPU Usage**: < 80% average

### Coverage Metrics

- **Overall Coverage**: 80% minimum
- **Service Layer**: 90% minimum
- **Component Layer**: 75% minimum
- **Utility Functions**: 95% minimum

## Continuous Improvement

### Regular Reviews

- **Weekly**: Review flaky tests and execution times
- **Monthly**: Analyze coverage trends and gaps
- **Quarterly**: Review and update test strategies

### Metrics Dashboard

Access real-time test metrics at:
- Coverage reports: `/coverage/lcov-report/`
- Test results: `/test-reports/html/`
- Performance metrics: `/test-reports/performance/`

## Support and Documentation

### Resources

- **Architecture Documentation**: `/docs/architecture/TEST_INFRASTRUCTURE_ARCHITECTURE.md`
- **Testing Guidelines**: `/docs/architecture/TESTING_GUIDELINES.md`
- **API Documentation**: Generated JSDoc comments in source code

### Getting Help

1. Check this documentation first
2. Review existing test examples in the codebase
3. Check GitHub Issues for known problems
4. Create a new issue with detailed reproduction steps

## Contributing

### Adding New Test Types

1. Create configuration in `unified-test.config.ts`
2. Add execution logic in `test-execution-manager.ts`
3. Update CI/CD pipeline in `.github/workflows/test-pipeline.yml`
4. Document in this README

### Modifying Infrastructure

1. Update relevant infrastructure components
2. Add/update tests for infrastructure changes
3. Update documentation
4. Test changes across all environments

---

This test infrastructure provides a solid foundation for reliable, scalable testing. Regular maintenance and updates ensure it continues to meet the evolving needs of the jaqEdu platform.