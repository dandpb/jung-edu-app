# Test Utilities Documentation

This directory contains comprehensive test utilities to ensure consistent and efficient testing across the jaqEdu application.

## Files Overview

### `test-utils.tsx`
Main test utilities file providing custom render functions and test helpers.

#### Key Features:
- **`render`**: Custom render function that wraps components with all necessary providers (Auth, Admin, Router)
- **`renderWithoutProviders`**: For testing components that already include providers (like App.tsx)
- **`mockLocalStorage`**: Fully functional localStorage mock with helper methods
- **`userEvent`**: Re-exported from @testing-library/user-event for better user interaction testing

#### Usage:
```typescript
import { render, screen, userEvent } from '../utils/test-utils';

test('user interaction example', async () => {
  const { user } = render(<MyComponent />);
  
  await user.type(screen.getByRole('textbox'), 'Hello');
  await user.click(screen.getByRole('button'));
});
```

### `test-mocks.ts`
Factory functions for creating consistent mock data.

#### Available Factories:
- `createMockModule()` - Educational module with sections, quiz, videos
- `createMockQuiz()` - Quiz with questions
- `createMockUserProgress()` - User progress data
- `createMockMindMapNode()` - Mind map nodes
- `createMockUser()` - Regular user
- `createMockAdminUser()` - Admin user
- `testDataPresets` - Pre-configured test scenarios

#### Usage:
```typescript
import { createMockModule, testDataPresets } from '../utils/test-mocks';

const customModule = createMockModule({
  title: 'Custom Module',
  difficulty: 'advanced'
});

// Use preset data
const { modules, progress } = testDataPresets.partialProgress;
```

### `test-setup.ts`
Common test setup utilities and helpers.

#### Key Functions:
- `setupConsoleHandlers()` - Reduces console noise in tests
- `setupLocalStorage()` - Initializes localStorage for tests
- `setupComponentMocks()` - Mocks common browser APIs
- `expectLocalStorageUpdate()` - Helper to assert localStorage changes

#### Usage:
```typescript
import { setupLocalStorage, setupConsoleHandlers } from '../utils/test-setup';

// At the top of your test file
setupConsoleHandlers();

describe('My Component', () => {
  // Setup localStorage for this test suite
  setupLocalStorage();
  
  test('saves to localStorage', () => {
    // Your test
    expectLocalStorageUpdate('key', expectedValue);
  });
});
```

### `test-patterns-example.test.tsx`
Example test file demonstrating best practices and common patterns.

## Common Patterns

### 1. Basic Component Testing
```typescript
test('renders component correctly', () => {
  render(<MyComponent prop="value" />);
  
  expect(screen.getByText('Expected Text')).toBeInTheDocument();
  expect(screen.getByRole('button')).toBeEnabled();
});
```

### 2. Testing User Interactions
```typescript
test('handles user input', async () => {
  const onSubmit = jest.fn();
  const { user } = render(<Form onSubmit={onSubmit} />);
  
  await user.type(screen.getByLabelText('Name'), 'John Doe');
  await user.click(screen.getByRole('button', { name: 'Submit' }));
  
  expect(onSubmit).toHaveBeenCalledWith({ name: 'John Doe' });
});
```

### 3. Testing with LocalStorage
```typescript
describe('LocalStorage integration', () => {
  setupLocalStorage({
    existingData: { value: 'test' }
  });
  
  test('loads from localStorage', () => {
    render(<MyComponent />);
    // Component should load the existing data
  });
});
```

### 4. Testing Async Operations
```typescript
test('loads data asynchronously', async () => {
  render(<AsyncComponent />);
  
  expect(screen.getByText('Loading...')).toBeInTheDocument();
  
  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });
});
```

### 5. Testing Components with Router
```typescript
test('navigates correctly', async () => {
  const { user } = render(<MyComponent />, {
    initialEntries: ['/start']
  });
  
  await user.click(screen.getByText('Go to Dashboard'));
  
  // Assert navigation happened
});
```

## Best Practices

### DO:
1. **Use `userEvent` over `fireEvent`** for more realistic user interactions
2. **Setup test data with factories** for consistency
3. **Use semantic queries** (getByRole, getByLabelText) over test IDs
4. **Test behavior, not implementation** details
5. **Keep tests focused** - one concept per test
6. **Use descriptive test names** that explain what is being tested

### DON'T:
1. **Don't test implementation details** like state variables
2. **Don't use `waitFor` unnecessarily** - only for async operations
3. **Don't mock everything** - test integration when possible
4. **Don't use arbitrary timeouts** - use waitFor instead
5. **Don't duplicate App's providers** - use renderWithoutProviders for App.tsx

## Troubleshooting

### Common Issues:

1. **"You called act(...) unnecessarily"**
   - Solution: Remove manual `act()` calls, our utilities handle this

2. **"Cannot read property 'history' of undefined"**
   - Solution: Component needs Router context, use our `render` function

3. **"useAdmin must be used within AdminProvider"**
   - Solution: Use `render` instead of `renderWithoutProviders`

4. **LocalStorage not persisting between tests**
   - Solution: Use `setupLocalStorage()` to properly initialize

## Migration Guide

### From Old Pattern:
```typescript
const renderWithProviders = () => {
  return render(
    <BrowserRouter>
      <AdminProvider>
        <MyComponent />
      </AdminProvider>
    </BrowserRouter>
  );
};
```

### To New Pattern:
```typescript
// Just use render directly!
render(<MyComponent />);
```

### For App.tsx tests:
```typescript
// Use renderWithoutProviders to avoid duplicate providers
renderWithoutProviders(<App />);
```

## Examples

See `test-patterns-example.test.tsx` for comprehensive examples of:
- Basic rendering
- User interactions
- LocalStorage integration
- Async operations
- Error handling
- Accessibility testing
- Context integration
- Full integration tests