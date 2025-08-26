# Unit Tests Documentation

This directory contains comprehensive unit tests for the jaqEdu educational platform's helper files and utility scripts.

## Test Structure

```
tests/
├── unit/
│   ├── helpers/           # Tests for .claude/helpers files
│   │   └── github-safe.test.js
│   ├── scripts/           # Tests for root-level scripts
│   │   └── test-prompts-availability.test.js
│   ├── jest.config.js     # Jest configuration for unit tests
│   ├── jest.setup.js      # Test setup and global mocks
│   └── coverage/          # Coverage reports (generated)
└── README.md              # This file
```

## Test Coverage

### 1. GitHub Safe CLI Helper (`github-safe.test.js`)
- **File Under Test**: `.claude/helpers/github-safe.js`
- **Coverage Areas**:
  - Command line argument parsing
  - Body content handling with special characters
  - Temporary file management and cleanup
  - Error handling and recovery
  - Command execution scenarios
  - Edge cases and timeout handling

**Key Test Categories**:
- ✅ Argument validation and usage display
- ✅ Issue and PR comment commands
- ✅ Create commands with --body flags
- ✅ Special character escaping (backticks, command substitution)
- ✅ Temporary file creation and cleanup
- ✅ Error handling (execSync failures, file write errors)
- ✅ Timeout configuration and handling
- ✅ Command logging and output

### 2. Prompt Availability Test Script (`test-prompts-availability.test.js`)
- **File Under Test**: `test-prompts-availability.js`
- **Coverage Areas**:
  - Prompt template availability checking
  - Category and template enumeration
  - Output formatting and console display
  - Error handling for service failures
  - Missing prompt detection

**Key Test Categories**:
- ✅ Successful prompt discovery and validation
- ✅ Missing prompt detection and error reporting
- ✅ Category grouping and display formatting
- ✅ Service error handling
- ✅ Edge cases (empty templates, malformed data)
- ✅ Console output verification

### 3. Prompt Test Service (`promptTestService.test.ts`)
- **File Under Test**: `src/services/prompts/promptTestService.ts`
- **Coverage Areas**:
  - Provider selection (OpenAI vs Mock)
  - Mock response generation
  - Real LLM provider integration
  - JSON response cleaning and validation
  - Error handling and recovery

**Key Test Categories**:
- ✅ Provider selection based on API key availability
- ✅ Mock response generation for different prompt types
- ✅ Real provider execution and error handling
- ✅ JSON response cleaning and validation
- ✅ Token counting and execution timing
- ✅ State management across multiple calls

## Running Tests

### Run All Unit Tests
```bash
# From project root
npm run test:unit

# Or run directly with Jest
npx jest --config tests/unit/jest.config.js
```

### Run Specific Test Files
```bash
# Test GitHub Safe helper
npx jest tests/unit/helpers/github-safe.test.js

# Test prompt availability script
npx jest tests/unit/scripts/test-prompts-availability.test.js

# Test prompt service
npx jest src/services/prompts/__tests__/promptTestService.test.ts
```

### Generate Coverage Reports
```bash
# Run tests with coverage
npx jest --config tests/unit/jest.config.js --coverage

# Coverage reports will be available in:
# - tests/unit/coverage/lcov-report/index.html (HTML report)
# - tests/unit/coverage/lcov.info (LCOV format)
```

### Watch Mode for Development
```bash
npx jest --config tests/unit/jest.config.js --watch
```

## Test Features

### Comprehensive Mocking
- **External Dependencies**: All Node.js modules (fs, child_process, crypto, etc.)
- **Environment Variables**: Process.env and localStorage simulation
- **Console Output**: Complete console.log/error capture and verification
- **LLM Providers**: Mock and real provider implementations

### Error Scenario Testing
- Network timeouts and API failures
- File system errors (write/read/cleanup failures)
- Malformed data handling
- Edge cases and boundary conditions

### Edge Case Coverage
- Empty inputs and missing parameters
- Very long content and special characters
- Unicode and internationalization
- Concurrent operations and state management

## Mock Data and Utilities

### Global Test Utilities (jest.setup.js)
```javascript
// Available in all tests:
global.createMockFunction(returnValue)
global.createAsyncMockFunction(returnValue)  
global.createRejectedMockFunction(error)
global.mockConsole // Console output capture
global.mockFileSystem // File operation mocks
```

### Console Output Testing
```javascript
// Capture console output
expect(console.log).toHaveBeenCalledWith('Expected message');

// Check output contains specific text
const outputs = consoleOutputs.filter(o => o.args[0].includes('text'));
expect(outputs).toHaveLength(1);
```

### Async Operation Testing
```javascript
// Test async operations with proper waiting
require('../../../test-prompts-availability.js');
await new Promise(resolve => setTimeout(resolve, 100));
expect(mockExit).not.toHaveBeenCalled();
```

## Configuration

### Jest Configuration Highlights
- **Test Environment**: Node.js for script testing
- **Module Mapping**: Supports TypeScript and path aliases
- **Coverage**: Includes all target files with exclusion patterns
- **Timeouts**: 10-second timeout for async operations
- **Mocking**: Automatic mock clearing between tests

### TypeScript Support
- Full TypeScript test support via ts-jest
- Type checking for service tests
- Module resolution for complex imports

## Best Practices

### Test Organization
1. **Descriptive Test Names**: Clear what is being tested and expected outcome
2. **Grouped Test Suites**: Logical grouping with describe blocks
3. **Setup/Teardown**: Consistent mock setup and cleanup
4. **Isolation**: Each test is independent and can run alone

### Error Testing
1. **Multiple Error Types**: Test different failure scenarios
2. **Error Recovery**: Verify graceful degradation
3. **Cleanup Verification**: Ensure resources are properly released
4. **State Consistency**: Verify error states don't corrupt application state

### Mock Strategy
1. **Comprehensive Mocking**: Mock all external dependencies
2. **Realistic Responses**: Mock data resembles real API responses
3. **Error Simulation**: Include error scenarios in mocks
4. **State Tracking**: Verify mock interactions and call patterns

## Maintenance

### Adding New Tests
1. Create test file in appropriate directory
2. Follow existing naming convention (*.test.js/ts)
3. Include comprehensive describe/test blocks
4. Add mock setup in beforeEach
5. Update coverage configuration if needed

### Updating Tests
1. Maintain test isolation
2. Update mocks when dependencies change
3. Verify coverage remains comprehensive
4. Test both success and failure paths

### Debugging Tests
1. Use `--verbose` flag for detailed output
2. Add temporary `console.log` statements
3. Run individual test files for focused debugging
4. Check mock call history with `toHaveBeenCalledWith`

---

## Coverage Targets

- **Statements**: >90%
- **Branches**: >85%
- **Functions**: >90%
- **Lines**: >90%

Current coverage meets these targets across all tested files.

## Integration

These unit tests are designed to run independently but complement the existing integration test suite. They focus on isolated functionality while integration tests verify end-to-end workflows.