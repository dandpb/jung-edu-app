# 👨‍💻 jaqEdu Development Guide

This guide provides comprehensive information for developers who want to contribute to jaqEdu or extend its functionality.

## 🏗️ Development Environment Setup

### Prerequisites

- Node.js 14+ and npm 6+
- Git
- VS Code (recommended) with extensions:
  - ESLint
  - Prettier
  - TypeScript and JavaScript
  - Tailwind CSS IntelliSense
  - GitLens

### Initial Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/yourusername/jaqEdu.git
   cd jaqEdu/jung-edu-app
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Setup Pre-commit Hooks**
   ```bash
   npm run prepare
   ```

4. **Configure Environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your settings
   ```

5. **Start Development Server**
   ```bash
   npm start
   ```

## 📂 Project Structure

```
jung-edu-app/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── admin/        # Admin-specific components
│   │   ├── auth/         # Authentication components
│   │   ├── common/       # Shared components
│   │   ├── modules/      # Module-related components
│   │   ├── notes/        # Note-taking components
│   │   └── quiz/         # Quiz components
│   ├── contexts/         # React Context providers
│   ├── data/            # Static data and mocks
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # Page-level components
│   ├── schemas/         # TypeScript schemas/validation
│   ├── services/        # Business logic and API calls
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions
├── public/              # Static assets
├── database/            # Database schemas and migrations
├── scripts/             # Build and utility scripts
└── docs/               # Documentation
```

## 🧩 Component Development

### Component Structure

Create components following this pattern:

```typescript
// components/example/ExampleComponent.tsx
import React, { useState, useCallback } from 'react';

interface ExampleComponentProps {
  title: string;
  onAction?: (value: string) => void;
  className?: string;
}

export const ExampleComponent: React.FC<ExampleComponentProps> = ({
  title,
  onAction,
  className = ''
}) => {
  const [value, setValue] = useState('');

  const handleAction = useCallback(() => {
    onAction?.(value);
  }, [value, onAction]);

  return (
    <div className={`example-component ${className}`}>
      <h2>{title}</h2>
      {/* Component content */}
    </div>
  );
};

// Memoize if needed for performance
export default React.memo(ExampleComponent);
```

### Component Best Practices

1. **Use TypeScript** - Always define prop interfaces
2. **Functional Components** - Prefer hooks over class components
3. **Memoization** - Use React.memo for expensive components
4. **Accessibility** - Include ARIA labels and keyboard navigation
5. **Testing** - Write tests alongside components

### Creating a New Component

1. **Create Component File**
   ```bash
   mkdir src/components/feature
   touch src/components/feature/FeatureComponent.tsx
   touch src/components/feature/FeatureComponent.test.tsx
   touch src/components/feature/index.ts
   ```

2. **Export from Index**
   ```typescript
   // src/components/feature/index.ts
   export { FeatureComponent } from './FeatureComponent';
   export type { FeatureComponentProps } from './FeatureComponent';
   ```

3. **Write Tests**
   ```typescript
   // FeatureComponent.test.tsx
   import { render, screen } from '@testing-library/react';
   import { FeatureComponent } from './FeatureComponent';

   describe('FeatureComponent', () => {
     it('renders correctly', () => {
       render(<FeatureComponent title="Test" />);
       expect(screen.getByText('Test')).toBeInTheDocument();
     });
   });
   ```

## 🔧 Service Development

### Creating a Service

Services handle business logic and external API calls:

```typescript
// services/example/exampleService.ts
import { ApiClient } from '../api/client';
import { ExampleData, ExampleResponse } from '../../types';

export class ExampleService {
  private static instance: ExampleService;
  private apiClient: ApiClient;

  private constructor() {
    this.apiClient = ApiClient.getInstance();
  }

  static getInstance(): ExampleService {
    if (!ExampleService.instance) {
      ExampleService.instance = new ExampleService();
    }
    return ExampleService.instance;
  }

  async fetchData(id: string): Promise<ExampleData> {
    try {
      const response = await this.apiClient.get<ExampleResponse>(
        `/api/example/${id}`
      );
      return this.transformResponse(response);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  private transformResponse(response: ExampleResponse): ExampleData {
    // Transform API response to internal format
    return {
      id: response.id,
      // ... transformation logic
    };
  }

  private handleError(error: any): void {
    console.error('ExampleService error:', error);
    // Additional error handling
  }
}
```

### Service Patterns

1. **Singleton Pattern** - One instance per service
2. **Error Handling** - Consistent error management
3. **Data Transformation** - Clean API responses
4. **Type Safety** - Full TypeScript typing
5. **Testability** - Easy to mock and test

## 🪝 Custom Hooks

### Creating Custom Hooks

```typescript
// hooks/useExample.ts
import { useState, useEffect, useCallback } from 'react';
import { ExampleService } from '../services/example/exampleService';

export function useExample(id: string) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const service = ExampleService.getInstance();
      const result = await service.fetchData(id);
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}
```

## 🎨 Styling Guidelines

### Tailwind CSS Usage

1. **Utility-First** - Use Tailwind classes primarily
2. **Component Classes** - Extract repeated patterns
3. **Responsive Design** - Mobile-first approach
4. **Dark Mode** - Support both themes

```typescript
// Example component with Tailwind
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
    {title}
  </h2>
  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
    {description}
  </p>
</div>
```

### Custom Styles

For complex styling, create component-specific CSS:

```css
/* components/feature/FeatureComponent.module.css */
.feature-container {
  @apply bg-white rounded-lg shadow-md;
  /* Custom styles */
}

.feature-container:hover {
  @apply shadow-lg transform -translate-y-1;
  transition: all 0.3s ease;
}
```

## 🧪 Testing Strategy

### Test Structure

```
__tests__/
├── unit/           # Unit tests for utilities
├── integration/    # API integration tests
├── components/     # Component tests
└── e2e/           # End-to-end tests
```

### Writing Tests

#### Component Testing

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExampleComponent } from './ExampleComponent';

describe('ExampleComponent', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('handles user input correctly', async () => {
    const user = userEvent.setup();
    render(<ExampleComponent onSubmit={mockOnSubmit} />);

    const input = screen.getByLabelText('Name');
    await user.type(input, 'John Doe');

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({ name: 'John Doe' });
    });
  });

  it('shows validation errors', async () => {
    render(<ExampleComponent onSubmit={mockOnSubmit} />);

    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});
```

#### Service Testing

```typescript
import { ExampleService } from './exampleService';
import { ApiClient } from '../api/client';

jest.mock('../api/client');

describe('ExampleService', () => {
  let service: ExampleService;
  let mockApiClient: jest.Mocked<ApiClient>;

  beforeEach(() => {
    mockApiClient = {
      get: jest.fn(),
      post: jest.fn(),
      // ... other methods
    };
    (ApiClient.getInstance as jest.Mock).mockReturnValue(mockApiClient);
    service = ExampleService.getInstance();
  });

  it('fetches data successfully', async () => {
    const mockData = { id: '1', name: 'Test' };
    mockApiClient.get.mockResolvedValue({ data: mockData });

    const result = await service.fetchData('1');

    expect(mockApiClient.get).toHaveBeenCalledWith('/api/example/1');
    expect(result).toEqual(mockData);
  });

  it('handles errors appropriately', async () => {
    const error = new Error('Network error');
    mockApiClient.get.mockRejectedValue(error);

    await expect(service.fetchData('1')).rejects.toThrow('Network error');
  });
});
```

### Test Coverage

Maintain minimum coverage thresholds:
- Statements: 70%
- Branches: 70%
- Functions: 70%
- Lines: 70%

Run coverage reports:
```bash
npm run test:coverage
```

## 🔄 State Management

### Context API Usage

```typescript
// contexts/ExampleContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ExampleContextType {
  value: string;
  setValue: (value: string) => void;
}

const ExampleContext = createContext<ExampleContextType | null>(null);

export const ExampleProvider: React.FC<{ children: ReactNode }> = ({
  children
}) => {
  const [value, setValue] = useState('');

  return (
    <ExampleContext.Provider value={{ value, setValue }}>
      {children}
    </ExampleContext.Provider>
  );
};

export const useExample = () => {
  const context = useContext(ExampleContext);
  if (!context) {
    throw new Error('useExample must be used within ExampleProvider');
  }
  return context;
};
```

## 🌐 API Integration

### Making API Calls

```typescript
// Using Axios with interceptors
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 30000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle token refresh
    }
    return Promise.reject(error);
  }
);
```

## 🚀 Performance Optimization

### Code Splitting

```typescript
// Lazy load routes
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ModulePage = lazy(() => import('./pages/ModulePage'));

// In router
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/module/:id" element={<ModulePage />} />
  </Routes>
</Suspense>
```

### Memoization

```typescript
// Memoize expensive computations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// Memoize callbacks
const handleClick = useCallback((id: string) => {
  // Handle click
}, [dependency]);
```

## 🐛 Debugging

### Debug Tools

1. **React Developer Tools** - Component inspection
2. **Redux DevTools** - State debugging (if using Redux)
3. **Network Tab** - API call inspection
4. **Console Logging** - Strategic log placement

### Debug Configuration

```typescript
// utils/debug.ts
export const debug = {
  log: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG]', ...args);
    }
  },
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
  },
  table: (data: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.table(data);
    }
  }
};
```

## 📦 Building and Deployment

### Build Process

```bash
# Development build
npm run build:dev

# Production build
npm run build

# Analyze bundle size
npm run build:analyze
```

### Pre-deployment Checklist

- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Environment variables configured
- [ ] Build successful
- [ ] Bundle size acceptable
- [ ] Performance metrics met

## 🤝 Contributing

### Contribution Workflow

1. **Create Issue** - Discuss the change
2. **Fork Repository** - Create your copy
3. **Create Branch** - `feature/your-feature-name`
4. **Make Changes** - Follow coding standards
5. **Write Tests** - Ensure coverage
6. **Submit PR** - With detailed description

### Code Review Checklist

- [ ] Code follows project style guide
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No commented-out code
- [ ] No console.logs in production code
- [ ] Performance considered
- [ ] Accessibility maintained

### Commit Guidelines

Follow conventional commits:
```
feat: add new quiz generation feature
fix: resolve login redirect issue
docs: update API documentation
style: format code with prettier
refactor: extract quiz logic to service
test: add tests for quiz component
chore: update dependencies
```

---

*For more specific guides, see the [Testing Guide](./TESTING_GUIDE.md) and [API Reference](./API_REFERENCE.md).*