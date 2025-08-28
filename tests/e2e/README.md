# jaqEdu End-to-End Test Suite

Comprehensive end-to-end testing suite for the jaqEdu educational platform using Playwright.

## 🎯 Overview

This test suite covers all critical user journeys and system functionality:

- **Student Journey Tests** - Complete learning experience from registration to course completion
- **Instructor Workflow Tests** - Content creation, management, and student monitoring
- **Admin Dashboard Tests** - System administration and user management
- **Real-time Collaboration Tests** - WebSocket communication and collaborative features
- **Mobile Responsiveness Tests** - Cross-device compatibility validation
- **Accessibility Tests** - WCAG 2.1 AA compliance verification
- **Visual Regression Tests** - Screenshot-based UI consistency checks
- **Cross-browser Compatibility Tests** - Multi-browser functionality validation

## 🚀 Quick Start

### Prerequisites

- Node.js 16+
- npm or yarn
- Running jaqEdu application (typically on localhost:3000)

### Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npm run setup
```

### Running Tests

```bash
# Run all tests
npm test

# Run with UI mode (recommended for development)
npm run test:ui

# Run specific test suites
npm run test:student      # Student journey tests
npm run test:instructor   # Instructor workflow tests
npm run test:admin        # Admin dashboard tests
npm run test:collaboration # Real-time collaboration tests
npm run test:mobile       # Mobile responsiveness tests
npm run test:accessibility # Accessibility compliance tests
npm run test:visual       # Visual regression tests
npm run test:cross-browser # Cross-browser compatibility tests

# Run on specific browsers
npm run test:chrome       # Chromium only
npm run test:firefox      # Firefox only
npm run test:safari       # WebKit/Safari only
npm run test:mobile-chrome # Mobile Chrome
npm run test:mobile-safari # Mobile Safari

# Debug mode
npm run test:debug

# Generate and view reports
npm run test:report
```

## 📁 Test Structure

```
tests/e2e/
├── playwright.config.ts           # Main Playwright configuration
├── global-setup.ts               # Global test setup
├── global-teardown.ts            # Global test cleanup
├── auth.setup.ts                 # Authentication setup
├── student-journey.e2e.ts        # Student user experience tests
├── instructor-flow.e2e.ts        # Instructor workflow tests
├── admin-dashboard.e2e.ts        # Admin functionality tests
├── collaboration.e2e.ts          # Real-time collaboration tests
├── mobile.e2e.ts                 # Mobile responsiveness tests
├── accessibility.e2e.ts          # WCAG compliance tests
├── visual-regression.e2e.ts      # Visual consistency tests
├── cross-browser.e2e.ts          # Cross-browser compatibility tests
├── auth/                         # Authentication state files
├── screenshots/                  # Visual regression baselines
├── reports/                      # Test reports and artifacts
└── test-results/                 # Test execution artifacts
```

## 🧪 Test Categories

### Student Journey Tests (`student-journey.e2e.ts`)

Tests the complete student experience:

- **Registration & Onboarding**
  - User registration form validation
  - Email verification workflow
  - Profile setup and customization

- **Authentication**
  - Login/logout functionality
  - Password reset workflow
  - Session management

- **Course Navigation**
  - Module browsing and selection
  - Progress tracking and saving
  - Quiz completion and scoring

- **User Profile Management**
  - Profile information updates
  - Password changes
  - Notification preferences

### Instructor Workflow Tests (`instructor-flow.e2e.ts`)

Tests instructor-specific functionality:

- **Content Creation**
  - Module creation and editing
  - Multimedia content integration
  - Quiz and assessment creation

- **Student Management**
  - Progress monitoring and analytics
  - Grading and feedback systems
  - Communication tools

- **Content Library**
  - Resource organization
  - File upload and management
  - Content categorization

### Admin Dashboard Tests (`admin-dashboard.e2e.ts`)

Tests administrative functionality:

- **User Management**
  - User creation, editing, and deletion
  - Role-based access control
  - Bulk user operations

- **System Configuration**
  - Settings management
  - API key configuration
  - System maintenance mode

- **Analytics & Reporting**
  - Usage statistics generation
  - Performance monitoring
  - Data export functionality

### Real-time Collaboration Tests (`collaboration.e2e.ts`)

Tests WebSocket-based collaborative features:

- **Real-time Communication**
  - Forum discussions with live updates
  - Typing indicators and presence status
  - Message synchronization across users

- **Collaborative Learning**
  - Shared study sessions
  - Progress synchronization
  - Collaborative note-taking

### Mobile Responsiveness Tests (`mobile.e2e.ts`)

Tests cross-device compatibility:

- **Device-specific Testing**
  - iPhone, iPad, Android devices
  - Portrait and landscape orientations
  - Touch interaction validation

- **Responsive Design**
  - Layout adaptation across screen sizes
  - Mobile navigation patterns
  - Content accessibility on small screens

### Accessibility Tests (`accessibility.e2e.ts`)

Tests WCAG 2.1 AA compliance:

- **Keyboard Navigation**
  - Tab order and focus management
  - Keyboard shortcuts and activation
  - Screen reader compatibility

- **Visual Accessibility**
  - Color contrast compliance
  - Alternative text for images
  - Proper heading structure

- **Form Accessibility**
  - Label associations
  - Error message accessibility
  - Input validation feedback

### Visual Regression Tests (`visual-regression.e2e.ts`)

Tests UI consistency through screenshot comparison:

- **Page Layout Screenshots**
  - Full page captures
  - Component-level screenshots
  - Responsive layout validation

- **Theme and State Testing**
  - Dark mode compatibility
  - Error state appearances
  - Loading state visualization

### Cross-browser Compatibility Tests (`cross-browser.e2e.ts`)

Tests functionality across different browsers:

- **Browser-specific Features**
  - JavaScript API support
  - CSS feature compatibility
  - Form input behavior

- **Performance Consistency**
  - Load times across browsers
  - Resource loading validation
  - Error handling differences

## 🔧 Configuration

### Playwright Configuration (`playwright.config.ts`)

Key configuration options:

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
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } }
  ]
});
```

### Authentication Setup

Tests use pre-configured authentication states stored in `auth/`:

- `admin-user.json` - Administrator access
- `regular-user.json` - Standard user access

Authentication is set up once during global setup and reused across tests for efficiency.

## 📊 Reporting and Debugging

### HTML Reports

```bash
# Generate and view HTML report
npm run test:report
```

### Debug Mode

```bash
# Run in debug mode with browser open
npm run test:debug

# Run specific test in debug mode
npx playwright test student-journey.e2e.ts --debug
```

### Trace Viewer

```bash
# Run with trace collection
npm run test:trace

# View traces for failed tests
npx playwright show-trace test-results/[test-name]/trace.zip
```

### Screenshots and Videos

Failed tests automatically capture:
- Screenshots at point of failure
- Video recordings of the entire test
- Browser traces for debugging

## 🚨 Troubleshooting

### Common Issues

1. **Tests timing out**
   ```bash
   # Increase timeout in config or specific tests
   test.setTimeout(60000); // 60 seconds
   ```

2. **Authentication failures**
   ```bash
   # Clear auth state and regenerate
   rm -rf tests/e2e/auth/
   npm test -- --project=setup
   ```

3. **Visual regression failures**
   ```bash
   # Update screenshots after UI changes
   npm run test:update-snapshots
   ```

4. **Browser installation issues**
   ```bash
   # Reinstall browsers
   npx playwright install --force
   ```

### Environment Variables

```bash
# Set base URL for different environments
PLAYWRIGHT_BASE_URL=https://staging.jaquedu.com npm test

# Skip integration tests if backend unavailable
SKIP_INTEGRATION=true npm test

# Enable debug logging
DEBUG=pw:api npm test
```

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run setup
      - run: npm run ci
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: tests/e2e/reports/
```

### Docker Support

```dockerfile
FROM mcr.microsoft.com/playwright:focal
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
CMD ["npm", "test"]
```

## 📈 Performance Considerations

- Tests run in parallel by default for speed
- Authentication state is shared to reduce setup time
- Visual regression tests use image comparison thresholds
- Network requests can be mocked for consistent testing
- Test isolation ensures no cross-test contamination

## 🎯 Best Practices

1. **Test Organization**
   - Group related tests in describe blocks
   - Use descriptive test names
   - Keep tests focused and atomic

2. **Selector Strategy**
   - Prefer `data-testid` attributes
   - Use semantic selectors when possible
   - Avoid brittle CSS selectors

3. **Assertions**
   - Use meaningful assertion messages
   - Test user-visible behavior
   - Include positive and negative test cases

4. **Maintenance**
   - Regular baseline updates for visual tests
   - Monitor test execution times
   - Review and update accessibility standards

## 🤝 Contributing

When adding new tests:

1. Follow existing test patterns and structure
2. Include both positive and negative test cases
3. Add appropriate accessibility checks
4. Update this documentation for new test categories
5. Ensure tests pass in all supported browsers

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [axe-core Accessibility Testing](https://github.com/dequelabs/axe-core)
- [Visual Testing Best Practices](https://playwright.dev/docs/test-snapshots)