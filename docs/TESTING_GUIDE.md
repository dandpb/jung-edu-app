# 🧪 jaqEdu Testing Guide

Comprehensive guide for testing the jaqEdu educational platform, covering unit tests, integration tests, and end-to-end testing strategies.

## 📋 Testing Overview

jaqEdu uses a comprehensive testing strategy:
- **Unit Tests**: Individual functions and components
- **Integration Tests**: Service interactions and API calls
- **Component Tests**: React component behavior
- **End-to-End Tests**: Full user workflows

### Testing Stack
- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing
- **MSW (Mock Service Worker)**: API mocking
- **Testing Library User Event**: User interaction simulation

## 🏃 Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- ExampleComponent.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="should render correctly"
```

### Test Suites

```bash
# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# Component tests
npm run test:components

# Run all tests without watch
npm run test:all
```

## 🧩 Unit Testing

### Testing Pure Functions

```typescript
// utils/validation.test.ts
import { validateEmail, validatePassword } from './validation';

describe('validation utils', () => {
  describe('validateEmail', () => {
    it('validates correct email formats', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('test.user+tag@domain.co.uk')).toBe(true);
    });

    it('rejects invalid email formats', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('validates strong passwords', () => {
      const result = validatePassword('StrongP@ss123');
      expect(result.isValid).toBe(true);
      expect(result.strength).toBe('strong');
    });

    it('identifies weak passwords', () => {
      const result = validatePassword('weak');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters');
    });
  });
});
```

### Testing Classes and Services

```typescript
// services/auth/authService.test.ts
import { AuthService } from './authService';
import { mockUser, mockCredentials } from '../../test-utils/mocks';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = AuthService.getInstance();
    // Clear any stored data
    localStorage.clear();
  });

  describe('login', () => {
    it('successfully authenticates valid credentials', async () => {
      const result = await authService.login(mockCredentials);
      
      expect(result.success).toBe(true);
      expect(result.user).toEqual(expect.objectContaining({
        id: expect.any(String),
        username: mockCredentials.username
      }));
      expect(result.accessToken).toBeDefined();
    });

    it('rejects invalid credentials', async () => {
      const invalidCredentials = {
        username: 'invalid',
        password: 'wrong'
      };

      const result = await authService.login(invalidCredentials);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
      expect(result.user).toBeUndefined();
    });

    it('handles network errors gracefully', async () => {
      // Mock network failure
      jest.spyOn(global, 'fetch').mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(authService.login(mockCredentials))
        .rejects.toThrow('Network error');
    });
  });
});
```

## 🎨 Component Testing

### Basic Component Test

```typescript
// components/Button/Button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button Component', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i }))
      .toBeInTheDocument();
  });

  it('handles click events', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('can be disabled', () => {
    render(<Button disabled>Disabled</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('opacity-50 cursor-not-allowed');
  });

  it('shows loading state', () => {
    render(<Button loading>Loading</Button>);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### Testing Components with Context

```typescript
// components/UserProfile/UserProfile.test.tsx
import { render, screen } from '@testing-library/react';
import { UserProfile } from './UserProfile';
import { AuthProvider } from '../../contexts/AuthContext';
import { mockUser } from '../../test-utils/mocks';

const renderWithAuth = (component: React.ReactElement, user = mockUser) => {
  return render(
    <AuthProvider initialUser={user}>
      {component}
    </AuthProvider>
  );
};

describe('UserProfile Component', () => {
  it('displays user information when authenticated', () => {
    renderWithAuth(<UserProfile />);
    
    expect(screen.getByText(mockUser.firstName)).toBeInTheDocument();
    expect(screen.getByText(mockUser.email)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /avatar/i }))
      .toHaveAttribute('src', mockUser.avatarUrl);
  });

  it('shows login prompt when not authenticated', () => {
    renderWithAuth(<UserProfile />, null);
    
    expect(screen.getByText(/please log in/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /login/i }))
      .toHaveAttribute('href', '/login');
  });
});
```

### Testing Forms

```typescript
// components/LoginForm/LoginForm.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

describe('LoginForm Component', () => {
  const mockOnSubmit = jest.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('submits form with valid data', async () => {
    render(<LoginForm onSubmit={mockOnSubmit} />);
    
    // Fill form
    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/password/i), 'Test123!');
    
    // Submit
    await user.click(screen.getByRole('button', { name: /login/i }));
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'Test123!',
        rememberMe: false
      });
    });
  });

  it('shows validation errors for empty fields', async () => {
    render(<LoginForm onSubmit={mockOnSubmit} />);
    
    // Submit without filling
    await user.click(screen.getByRole('button', { name: /login/i }));
    
    expect(await screen.findByText(/username is required/i))
      .toBeInTheDocument();
    expect(screen.getByText(/password is required/i))
      .toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('toggles password visibility', async () => {
    render(<LoginForm onSubmit={mockOnSubmit} />);
    
    const passwordInput = screen.getByLabelText(/password/i);
    const toggleButton = screen.getByRole('button', { name: /show password/i });
    
    // Initially hidden
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click to show
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    
    // Click to hide again
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});
```

## 🔗 Integration Testing

### API Integration Tests

```typescript
// services/modules/moduleService.integration.test.ts
import { ModuleService } from './moduleService';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { mockModules } from '../../test-utils/mocks';

const server = setupServer(
  rest.get('/api/modules', (req, res, ctx) => {
    return res(ctx.json({ modules: mockModules }));
  }),
  
  rest.get('/api/modules/:id', (req, res, ctx) => {
    const { id } = req.params;
    const module = mockModules.find(m => m.id === id);
    
    if (module) {
      return res(ctx.json({ module }));
    }
    
    return res(ctx.status(404), ctx.json({ error: 'Module not found' }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('ModuleService Integration', () => {
  const moduleService = ModuleService.getInstance();

  it('fetches all modules', async () => {
    const modules = await moduleService.getModules();
    
    expect(modules).toHaveLength(mockModules.length);
    expect(modules[0]).toMatchObject({
      id: expect.any(String),
      title: expect.any(String),
      content: expect.any(Object)
    });
  });

  it('fetches a single module by ID', async () => {
    const moduleId = mockModules[0].id;
    const module = await moduleService.getModuleById(moduleId);
    
    expect(module).toMatchObject({
      id: moduleId,
      title: mockModules[0].title
    });
  });

  it('handles 404 errors for non-existent modules', async () => {
    await expect(moduleService.getModuleById('non-existent'))
      .rejects.toThrow('Module not found');
  });

  it('handles network errors', async () => {
    server.use(
      rest.get('/api/modules', (req, res, ctx) => {
        return res.networkError('Failed to connect');
      })
    );

    await expect(moduleService.getModules())
      .rejects.toThrow('Network error');
  });
});
```

### Database Integration Tests

```typescript
// services/supabase/supabaseService.integration.test.ts
import { createClient } from '@supabase/supabase-js';
import { SupabaseService } from './supabaseService';

// Use test database
const supabase = createClient(
  process.env.TEST_SUPABASE_URL!,
  process.env.TEST_SUPABASE_ANON_KEY!
);

describe('SupabaseService Integration', () => {
  let service: SupabaseService;

  beforeAll(async () => {
    service = new SupabaseService(supabase);
    // Setup test data
    await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  });

  afterEach(async () => {
    // Cleanup after each test
    await supabase.from('user_progress').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  });

  it('creates and retrieves user progress', async () => {
    const userId = 'test-user-123';
    const moduleId = 'test-module-456';
    
    // Create progress
    await service.updateUserProgress(userId, moduleId, {
      progressPercentage: 50,
      status: 'in_progress'
    });

    // Retrieve progress
    const progress = await service.getUserProgress(userId, moduleId);
    
    expect(progress).toMatchObject({
      userId,
      moduleId,
      progressPercentage: 50,
      status: 'in_progress'
    });
  });

  it('enforces RLS policies', async () => {
    // Attempt to access another user's data
    const otherUserId = 'other-user-456';
    
    await expect(service.getUserProgress(otherUserId, 'any-module'))
      .rejects.toThrow('Permission denied');
  });
});
```

## 🎭 Mocking Strategies

### Mock Service Worker Setup

```typescript
// test-utils/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

// test-utils/mocks/handlers.ts
import { rest } from 'msw';
import { mockModules, mockUser } from '../mockData';

export const handlers = [
  // Auth endpoints
  rest.post('/api/auth/login', async (req, res, ctx) => {
    const { username, password } = await req.json();
    
    if (username === 'testuser' && password === 'Test123!') {
      return res(ctx.json({
        user: mockUser,
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      }));
    }
    
    return res(
      ctx.status(401),
      ctx.json({ error: 'Invalid credentials' })
    );
  }),

  // Module endpoints
  rest.get('/api/modules', (req, res, ctx) => {
    const published = req.url.searchParams.get('published');
    
    if (published === 'true') {
      return res(ctx.json({
        modules: mockModules.filter(m => m.isPublished)
      }));
    }
    
    return res(ctx.json({ modules: mockModules }));
  }),

  // Progress endpoints
  rest.post('/api/progress/:moduleId', async (req, res, ctx) => {
    const { moduleId } = req.params;
    const progressData = await req.json();
    
    return res(ctx.json({
      id: 'progress-123',
      moduleId,
      ...progressData,
      updatedAt: new Date().toISOString()
    }));
  })
];
```

### Custom Test Utilities

```typescript
// test-utils/render.tsx
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialRoute?: string;
  user?: User | null;
  theme?: 'light' | 'dark';
}

export function customRender(
  ui: ReactElement,
  {
    initialRoute = '/',
    user = null,
    theme = 'light',
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider initialUser={user}>
        <ThemeProvider defaultTheme={theme}>
          {children}
        </ThemeProvider>
      </AuthProvider>
    </MemoryRouter>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };
```

## 📊 Test Coverage

### Coverage Configuration

```javascript
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/reportWebVitals.ts',
    '!src/**/*.stories.tsx',
    '!src/test-utils/**'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    },
    './src/services/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  coverageReporters: ['text', 'lcov', 'html']
};
```

### Viewing Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# Open HTML report
open coverage/lcov-report/index.html
```

### Improving Coverage

1. **Identify Gaps**
   ```bash
   npm run test:coverage -- --collectCoverageFrom="src/services/**"
   ```

2. **Focus on Critical Paths**
   - Authentication flows
   - Data persistence
   - User interactions
   - Error handling

3. **Test Edge Cases**
   - Network failures
   - Invalid inputs
   - Race conditions
   - Browser compatibility

## 🧪 E2E Testing (Future)

### Playwright Setup (Planned)

```typescript
// e2e/login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('successful login redirects to dashboard', async ({ page }) => {
    // Fill login form
    await page.fill('[name="username"]', 'testuser');
    await page.fill('[name="password"]', 'Test123!');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForURL('**/dashboard');
    
    // Verify dashboard elements
    await expect(page.locator('h1')).toContainText('Dashboard');
    await expect(page.locator('[data-testid="welcome-message"]'))
      .toContainText('Welcome, testuser');
  });

  test('invalid credentials show error', async ({ page }) => {
    await page.fill('[name="username"]', 'wronguser');
    await page.fill('[name="password"]', 'wrongpass');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('[role="alert"]'))
      .toContainText('Invalid credentials');
  });
});
```

## 📝 Testing Best Practices

### 1. Test Structure
- **Arrange**: Set up test data and conditions
- **Act**: Execute the function/interaction
- **Assert**: Verify the outcome

### 2. Test Descriptions
- Use descriptive test names
- Group related tests with `describe`
- Use `it` or `test` consistently

### 3. Isolation
- Each test should be independent
- Clean up after tests
- Mock external dependencies

### 4. Async Testing
```typescript
// Always use async/await for clarity
it('loads user data', async () => {
  const user = await fetchUser('123');
  expect(user.name).toBe('John');
});

// Use waitFor for DOM updates
it('shows success message', async () => {
  await user.click(submitButton);
  
  await waitFor(() => {
    expect(screen.getByText(/success/i)).toBeInTheDocument();
  });
});
```

### 5. Accessibility Testing
```typescript
it('is accessible', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### 6. Performance Testing
```typescript
it('renders quickly', () => {
  const start = performance.now();
  render(<ExpensiveComponent data={largeDataset} />);
  const end = performance.now();
  
  expect(end - start).toBeLessThan(100); // 100ms threshold
});
```

## 🐛 Debugging Tests

### Debug Utilities

```typescript
// Print DOM
screen.debug();

// Print specific element
screen.debug(screen.getByRole('button'));

// Use testing playground
screen.logTestingPlaygroundURL();
```

### VS Code Debugging

1. Add breakpoint in test
2. Run "Jest: Debug" from command palette
3. Step through test execution

### Common Issues

1. **Act Warnings**
   ```typescript
   // Wrap state updates
   await act(async () => {
     fireEvent.click(button);
   });
   ```

2. **Async Issues**
   ```typescript
   // Always await user events
   await user.click(button); // ✅
   user.click(button); // ❌
   ```

3. **Timer Issues**
   ```typescript
   // Use fake timers
   jest.useFakeTimers();
   act(() => {
     jest.advanceTimersByTime(1000);
   });
   ```

---

*For more testing examples, check the test files in the repository or see the [Development Guide](./DEVELOPMENT_GUIDE.md).*