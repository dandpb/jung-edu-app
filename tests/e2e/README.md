# E2E Testing with Playwright

This directory contains comprehensive end-to-end tests for the jaqEdu educational platform using Playwright.

## 🏗️ Test Structure

```
tests/e2e/
├── auth.setup.ts              # Authentication setup for tests
├── global-setup.ts            # Global test environment setup
├── global-teardown.ts         # Global test environment cleanup
├── fixtures/
│   └── test-data.ts           # Test data fixtures and types
├── helpers/
│   └── test-helpers.ts        # Common helper functions
├── pages/                     # Page Object Models
│   ├── base-page.ts           # Base page class
│   ├── login-page.ts          # Login page POM
│   ├── dashboard-page.ts      # Dashboard page POM
│   ├── module-page.ts         # Module viewer POM
│   └── admin-dashboard-page.ts # Admin dashboard POM
├── specs/                     # Test specifications
│   ├── auth/
│   │   └── authentication.spec.ts
│   ├── student/
│   │   └── learning-journey.spec.ts
│   ├── admin/
│   │   ├── admin-dashboard.spec.ts
│   │   ├── module-management.spec.ts
│   │   └── quiz-management.spec.ts
│   ├── accessibility/
│   │   └── accessibility.spec.ts
│   └── cross-browser/
│       └── responsive-design.spec.ts
└── utils/
    └── test-data-seeder.ts    # Test data seeding utilities
```

## 🚀 Getting Started

### Installation

```bash
# Install Playwright
npm run test:e2e:install

# Install browsers
npx playwright install
```

### Environment Setup

Create a `.env.local` file for E2E test configuration:

```env
# E2E Test Configuration
E2E_TEST_USER_EMAIL=test@jaqedu.com
E2E_TEST_USER_PASSWORD=TestPassword123!
E2E_ADMIN_USER_EMAIL=admin@jaqedu.com
E2E_ADMIN_USER_PASSWORD=AdminPassword123!
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000
```

## 🧪 Running Tests

### All Tests
```bash
npm run test:e2e
```

### Test Suites
```bash
# Authentication tests
npm run test:e2e:auth

# Student learning journey
npm run test:e2e:student

# Admin functionality
npm run test:e2e:admin

# Accessibility tests
npm run test:e2e:accessibility

# Cross-browser and responsive
npm run test:e2e:cross-browser
```

### Browser-Specific Tests
```bash
# Single browser
npm run test:e2e:chromium
npm run test:e2e:firefox
npm run test:e2e:webkit

# Mobile devices
npm run test:e2e:mobile
```

### Development & Debugging
```bash
# Interactive UI mode
npm run test:e2e:ui

# Headed mode (see browser)
npm run test:e2e:headed

# Debug mode (step through)
npm run test:e2e:debug

# Show test report
npm run test:e2e:report
```

## 📊 Test Coverage Areas

### 🔐 Authentication Flow
- User login/logout
- Registration process
- Password reset
- Session management
- Role-based access control

### 📚 Student Learning Journey
- Dashboard navigation
- Module viewing and progression
- Quiz taking and completion
- Progress tracking
- Bookmarking and notes
- Search and filtering

### 👨‍💼 Admin Dashboard
- User management
- Module creation and editing
- Quiz creation and management
- Analytics and reporting
- System configuration

### ♿ Accessibility
- Keyboard navigation
- Screen reader compatibility
- ARIA labels and roles
- Color contrast
- Touch target sizes
- Focus management

### 📱 Cross-Browser & Responsive
- Desktop browsers (Chrome, Firefox, Safari)
- Mobile devices (iOS Safari, Android Chrome)
- Tablet viewports
- Responsive layouts
- Touch interactions

## 🏗️ Page Object Model

Tests use the Page Object Model pattern for maintainable and reusable code:

```typescript
// Example usage
const loginPage = new LoginPage(page);
const dashboardPage = new DashboardPage(page);

await loginPage.loginSuccessfully(email, password);
await dashboardPage.verifyDashboardLoaded();
```

### Base Page Class
All page objects extend `BasePage` which provides:
- Common navigation methods
- Error handling utilities
- Screenshot capture
- Accessibility checks
- Wait helpers

## 🧩 Test Data Management

### Fixtures
Test data is managed through fixtures in `fixtures/test-data.ts`:
- User accounts with different roles
- Sample educational modules
- Quiz templates and questions
- Navigation paths and selectors

### Data Seeding
The `TestDataSeeder` class handles:
- Creating test users
- Seeding educational content
- Setting up quiz data
- Cleaning up after tests

## 🔧 Configuration

### Playwright Config
Key configuration options in `playwright.config.ts`:

```typescript
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  
  projects: [
    { name: 'setup', testMatch: '**/auth.setup.ts' },
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } }
  ]
});
```

### Browser Matrix
Tests run across multiple browsers and devices:
- **Desktop**: Chrome, Firefox, Safari
- **Mobile**: iPhone, Android
- **Tablet**: iPad Pro

## 📈 Best Practices

### Test Organization
- Group related tests in describe blocks
- Use descriptive test names
- Keep tests focused and independent
- Use proper setup/teardown

### Page Objects
- Encapsulate page interactions
- Use meaningful method names
- Wait for elements properly
- Handle dynamic content

### Data Management
- Use fixtures for consistent data
- Clean up test data after runs
- Generate unique data when needed
- Avoid hard-coded values

### Assertions
- Use specific assertions
- Verify both positive and negative cases
- Check for proper error messages
- Validate accessibility features

## 🐛 Debugging

### Common Issues
1. **Timeouts**: Increase wait times for slow operations
2. **Flaky tests**: Add proper waits and retries
3. **Element not found**: Check selectors and timing
4. **Auth issues**: Verify test user credentials

### Debug Tools
- Playwright Inspector: Step through tests
- Trace Viewer: Analyze test execution
- Screenshots: Visual verification
- Console logs: Check for errors

### Troubleshooting Commands
```bash
# Run specific test with debug
npx playwright test authentication.spec.ts --debug

# Generate trace
npx playwright test --trace on

# Show trace viewer
npx playwright show-trace trace.zip
```

## 📋 Test Reports

Tests generate comprehensive reports:
- HTML report with screenshots
- JUnit XML for CI integration
- JSON results for programmatic access
- Trace files for detailed analysis

## 🚀 CI/CD Integration

### GitHub Actions
The tests are configured to run in CI with:
- Multiple browser testing
- Screenshot and video capture
- Test result artifacts
- Parallel execution

### Environment Variables
Required for CI:
- `E2E_TEST_USER_EMAIL`
- `E2E_TEST_USER_PASSWORD`
- `E2E_ADMIN_USER_EMAIL`
- `E2E_ADMIN_USER_PASSWORD`
- `PLAYWRIGHT_TEST_BASE_URL`

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/)
- [Page Object Model Best Practices](https://playwright.dev/docs/pom)
- [Test Fixtures Guide](https://playwright.dev/docs/test-fixtures)
- [Accessibility Testing](https://playwright.dev/docs/accessibility-testing)

---

## 🤝 Contributing

When adding new tests:
1. Follow existing patterns and structure
2. Update page objects as needed
3. Add appropriate test data fixtures
4. Include accessibility checks
5. Test across multiple browsers
6. Update documentation

## 🏷️ Test Tags

Use test tags for organization:
- `@smoke` - Critical path tests
- `@regression` - Full feature tests  
- `@accessibility` - A11y specific tests
- `@mobile` - Mobile-specific tests
- `@admin` - Admin functionality tests