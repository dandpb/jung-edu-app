# API Automation Tests

Comprehensive API testing suite for the jaqEdu educational platform, covering authentication, REST endpoints, WebSocket connections, and security validation.

## 📋 Test Coverage

### 🔐 Authentication & Authorization (`auth.test.ts`)
- User registration with validation
- Login/logout functionality 
- JWT token management (access & refresh tokens)
- Role-based access control
- Session management
- Password reset workflows
- Rate limiting on auth endpoints
- Security headers validation

### 🌐 REST API Endpoints (`workflows-api.test.ts`)
- **Workflows CRUD Operations**
  - CREATE: Workflow creation with validation
  - READ: List workflows with pagination, filtering, sorting
  - UPDATE: Partial and full workflow updates
  - DELETE: Workflow deletion with dependency checks
- **Input Validation**: Schema validation for all request types
- **Error Handling**: Comprehensive error response testing
- **Performance**: Concurrent request handling

### ⚡ Workflow Executions (`executions-api.test.ts`)
- Execution lifecycle management (start, pause, resume, cancel)
- Real-time execution monitoring
- Step-by-step progress tracking
- Log aggregation and retrieval
- Metrics collection and reporting
- Error handling and timeout scenarios
- Concurrent execution management

### 🚦 Rate Limiting (`rate-limiting.test.ts`)
- Authentication endpoint rate limits
- API operation rate limits (read vs write)
- Rate limit headers validation
- Reset window behavior
- Per-user vs global limits
- Bypass attempt prevention
- Edge case handling

### 🛡️ Input Validation & Security (`validation.test.ts`)
- **Input Sanitization**
  - XSS prevention
  - SQL injection prevention
  - NoSQL injection prevention
  - Path traversal protection
- **Data Validation**
  - Required field validation
  - Format validation (email, UUID, etc.)
  - Size limits and boundary testing
  - Type validation
- **Security Testing**
  - Malicious payload handling
  - Content-Type validation
  - Character encoding safety

### 🔌 WebSocket Connections (`websocket.test.ts`)
- **Connection Management**
  - Connection establishment
  - Authentication requirements
  - Graceful disconnection
  - Connection resumption
- **Real-time Updates**
  - Execution status changes
  - Step completion notifications
  - Log streaming
  - Progress updates
  - Error notifications
- **Multi-client Scenarios**
  - Broadcast messaging
  - Client isolation
  - Connection scaling

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- API server running on `localhost:8080` (configurable)
- WebSocket server available (if testing WebSocket features)

### Installation
```bash
cd tests/automation/api
npm install
```

### Configuration
Set environment variables or create a `.env` file:
```bash
API_BASE_URL=http://localhost:8080/api
WS_BASE_URL=ws://localhost:8080
TEST_TIMEOUT=30000
```

### Running Tests

**All Tests:**
```bash
npm test
```

**Specific Test Suite:**
```bash
npm test auth.test.ts
npm test workflows-api.test.ts
npm test executions-api.test.ts
npm test rate-limiting.test.ts
npm test validation.test.ts
npm test websocket.test.ts
```

**With Coverage:**
```bash
npm run test:coverage
```

**Watch Mode:**
```bash
npm run test:watch
```

## 📊 Test Reports

After running tests, detailed reports are generated in the `reports/` directory:

- `api-test-summary.json`: Structured test results data
- `api-test-report.txt`: Human-readable summary
- `api-test-results.csv`: Data for analysis
- `api-test-results.xml`: JUnit format for CI/CD

## 🔧 Configuration

### Jest Configuration (`jest.config.js`)
- Optimized for API testing
- Extended timeouts for network operations
- Custom test sequencing
- Parallel execution limits

### Test Setup (`test-setup.js`)
- Global utilities and helpers
- Custom Jest matchers
- Environment configuration
- API health checks

### Test Sequencing (`test-sequencer.js`)
Orders tests to minimize conflicts:
1. Authentication tests first
2. Input validation 
3. Core API functionality
4. Real-time features
5. Rate limiting (potentially disruptive) last

## 🛠️ Custom Utilities

### Global Functions
```javascript
// Available in all test files
await delay(1000); // Wait 1 second
await retry(() => apiCall()); // Retry with backoff
```

### Custom Matchers
```javascript
expect(response.status).toBeHttpStatus([200, 201]);
expect(userId).toHaveValidUUID();
expect(responseData).toBeValidApiResponse();
```

## 📝 Writing New Tests

### Test File Structure
```typescript
describe('Feature Tests', () => {
  beforeAll(async () => {
    // Setup (authentication, test data)
  });

  afterAll(async () => {
    // Cleanup (remove test data)
  });

  describe('Specific Functionality', () => {
    test('should do something', async () => {
      // Test implementation
    });
  });
});
```

### Best Practices

1. **Authentication**: Always authenticate before API calls
2. **Cleanup**: Track and clean up test data
3. **Timeouts**: Use appropriate timeouts for operations
4. **Error Handling**: Test both success and failure cases
5. **Concurrency**: Consider parallel execution impacts
6. **Data Independence**: Tests should not depend on each other

### Example Test Case
```typescript
test('should create workflow with valid data', async () => {
  const workflowData = {
    name: 'Test Workflow',
    description: 'Test description',
    version: '1.0.0',
    status: 'draft',
    steps: [/* workflow steps */]
  };

  const response = await makeRequest({
    method: 'POST',
    url: `${BASE_URL}/workflows`,
    data: workflowData
  });

  expect(response.status).toBe(201);
  expect(response.data).toBeValidApiResponse();
  expect(response.data.data.name).toBe(workflowData.name);
  
  // Track for cleanup
  testWorkflowIds.push(response.data.data.id);
});
```

## 🐛 Debugging Tests

### Verbose Output
```bash
npm test -- --verbose
```

### Debug Specific Test
```bash
npm test -- --testNamePattern="should create workflow"
```

### Environment Variables
```bash
DEBUG=true npm test
NODE_ENV=test npm test
```

### Common Issues

1. **API Not Running**: Ensure API server is started
2. **Authentication Failures**: Check test user credentials
3. **Timeout Errors**: Increase timeout or check API performance
4. **Port Conflicts**: Verify API and WebSocket URLs
5. **Rate Limiting**: Wait between test runs or use different test data

## 🚀 CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run API Tests
  run: |
    cd tests/automation/api
    npm install
    npm test
  env:
    API_BASE_URL: http://localhost:8080/api
    CI: true
```

### Test Results
- JUnit XML output for CI systems
- JSON results for further processing
- Human-readable reports for developers

## 📚 Dependencies

### Core Dependencies
- `jest`: Test framework
- `axios`: HTTP client
- `ws`: WebSocket client  
- `uuid`: UUID generation

### Development Dependencies
- `typescript`: TypeScript support
- `ts-jest`: TypeScript Jest transformer
- `jest-junit`: JUnit XML reporter

## 🤝 Contributing

When adding new tests:
1. Follow the existing file structure
2. Use descriptive test names
3. Add proper cleanup
4. Update this README if needed
5. Test both success and failure scenarios
6. Consider rate limiting and timeouts

## 📞 Support

For issues with the test suite:
1. Check API server logs
2. Verify environment configuration
3. Review test reports in `reports/` directory
4. Check for conflicting tests or data

---

**Happy Testing! 🧪**