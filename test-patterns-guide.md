# Reusable Testing Patterns Guide

## 🎯 Pattern 1: LLM Service Testing

### Mock Setup Pattern
```typescript
// __tests__/services/llm/orchestrator.test.ts
import { LLMOrchestrator } from '@/services/llm/orchestrator';
import { mockOpenAIProvider, mockMistralProvider } from '@/services/llm/providers/__mocks__';

jest.mock('@/services/llm/providers/openai', () => mockOpenAIProvider);
jest.mock('@/services/llm/providers/mistral', () => mockMistralProvider);

describe('LLMOrchestrator', () => {
  let orchestrator: LLMOrchestrator;
  
  beforeEach(() => {
    orchestrator = new LLMOrchestrator({
      providers: ['openai', 'mistral'],
      fallbackEnabled: true
    });
  });

  describe('Provider Selection', () => {
    it('should select primary provider when available', async () => {
      // Test implementation
    });

    it('should fallback to secondary provider on error', async () => {
      mockOpenAIProvider.generate.mockRejectedValueOnce(new Error('Rate limit'));
      // Test fallback behavior
    });
  });

  describe('Error Handling', () => {
    it('should retry on transient errors', async () => {
      // Test retry logic
    });

    it('should throw after max retries', async () => {
      // Test max retry behavior
    });
  });
});
```

## 🎯 Pattern 2: Component Testing with User Interactions

### Interactive Component Pattern
```typescript
// __tests__/components/mindmap/InteractiveMindMap.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InteractiveMindMap } from '@/components/mindmap/InteractiveMindMap';

describe('InteractiveMindMap', () => {
  const mockData = {
    nodes: [
      { id: '1', data: { label: 'Root' }, position: { x: 0, y: 0 } },
      { id: '2', data: { label: 'Child' }, position: { x: 100, y: 100 } }
    ],
    edges: [{ id: 'e1-2', source: '1', target: '2' }]
  };

  it('should handle node selection', async () => {
    const onNodeSelect = jest.fn();
    render(<InteractiveMindMap data={mockData} onNodeSelect={onNodeSelect} />);
    
    const node = screen.getByText('Root');
    await userEvent.click(node);
    
    expect(onNodeSelect).toHaveBeenCalledWith(expect.objectContaining({
      id: '1',
      data: { label: 'Root' }
    }));
  });

  it('should handle zoom and pan', async () => {
    const { container } = render(<InteractiveMindMap data={mockData} />);
    const canvas = container.querySelector('.react-flow__viewport');
    
    // Test zoom
    fireEvent.wheel(canvas, { deltaY: -100 });
    await waitFor(() => {
      expect(canvas).toHaveStyle({ transform: expect.stringContaining('scale') });
    });
  });
});
```

## 🎯 Pattern 3: Service Integration Testing

### YouTube Service Pattern
```typescript
// __tests__/services/video/youtubeService.integration.test.ts
import { YouTubeService } from '@/services/video/youtubeService';
import nock from 'nock';

describe('YouTubeService Integration', () => {
  let service: YouTubeService;
  
  beforeAll(() => {
    service = new YouTubeService({ apiKey: 'test-key' });
  });

  beforeEach(() => {
    nock.cleanAll();
  });

  describe('Video Search', () => {
    it('should search and parse results correctly', async () => {
      const mockResponse = {
        items: [{
          id: { videoId: 'abc123' },
          snippet: {
            title: 'Educational Video',
            description: 'Learn about testing',
            channelTitle: 'EduChannel'
          }
        }]
      };

      nock('https://www.googleapis.com')
        .get('/youtube/v3/search')
        .query(true)
        .reply(200, mockResponse);

      const results = await service.searchVideos('testing tutorial');
      
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        videoId: 'abc123',
        title: 'Educational Video'
      });
    });

    it('should handle API errors gracefully', async () => {
      nock('https://www.googleapis.com')
        .get('/youtube/v3/search')
        .query(true)
        .reply(403, { error: { message: 'Quota exceeded' } });

      await expect(service.searchVideos('test')).rejects.toThrow('Quota exceeded');
    });
  });
});
```

## 🎯 Pattern 4: Admin Component Testing

### Form and State Management Pattern
```typescript
// __tests__/components/admin/ModuleEditor.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModuleEditor } from '@/components/admin/ModuleEditor';
import { AdminContext } from '@/contexts/AdminContext';

const mockAdminContext = {
  modules: [],
  updateModule: jest.fn(),
  deleteModule: jest.fn(),
  isAuthenticated: true
};

const wrapper = ({ children }) => (
  <AdminContext.Provider value={mockAdminContext}>
    {children}
  </AdminContext.Provider>
);

describe('ModuleEditor', () => {
  it('should validate required fields', async () => {
    render(<ModuleEditor />, { wrapper });
    
    const submitButton = screen.getByRole('button', { name: /save/i });
    await userEvent.click(submitButton);
    
    expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    expect(screen.getByText(/content is required/i)).toBeInTheDocument();
  });

  it('should auto-save draft after inactivity', async () => {
    render(<ModuleEditor />, { wrapper });
    
    const titleInput = screen.getByLabelText(/title/i);
    await userEvent.type(titleInput, 'Test Module');
    
    // Wait for auto-save debounce
    await waitFor(() => {
      expect(localStorage.getItem('module-draft')).toContain('Test Module');
    }, { timeout: 3000 });
  });
});
```

## 🎯 Pattern 5: Authentication Testing

### Auth Flow Pattern
```typescript
// __tests__/utils/auth.test.ts
import { isAuthenticated, login, logout, getAuthToken } from '@/utils/auth';
import { LOCAL_STORAGE_KEYS } from '@/config/constants';

describe('Authentication Utils', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  describe('Token Management', () => {
    it('should handle token expiry', () => {
      const expiredToken = {
        token: 'abc123',
        expiresAt: Date.now() - 1000 // Expired 1 second ago
      };
      
      localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN, JSON.stringify(expiredToken));
      
      expect(isAuthenticated()).toBe(false);
      expect(localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN)).toBeNull();
    });

    it('should refresh token before expiry', async () => {
      const token = {
        token: 'abc123',
        expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
      };
      
      localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN, JSON.stringify(token));
      
      // Fast-forward to 1 minute before expiry
      jest.advanceTimersByTime(4 * 60 * 1000);
      
      // Token should be refreshed
      await waitFor(() => {
        const newToken = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN));
        expect(newToken.token).not.toBe('abc123');
      });
    });
  });
});
```

## 🎯 Pattern 6: Local Storage Error Handling

### Storage Quota Pattern
```typescript
// __tests__/utils/localStorage.test.ts
import { safeSetItem, safeGetItem, clearOldData } from '@/utils/localStorage';

describe('Local Storage Utils', () => {
  describe('Quota Handling', () => {
    it('should handle quota exceeded errors', () => {
      // Mock quota exceeded
      const mockSetItem = jest.spyOn(Storage.prototype, 'setItem');
      mockSetItem.mockImplementation(() => {
        throw new DOMException('QuotaExceededError');
      });

      const result = safeSetItem('test-key', 'large-data');
      
      expect(result).toEqual({
        success: false,
        error: 'QUOTA_EXCEEDED',
        cleared: true // Should attempt to clear old data
      });
    });

    it('should clear old data when needed', () => {
      // Fill storage with old data
      for (let i = 0; i < 10; i++) {
        localStorage.setItem(`old-key-${i}`, JSON.stringify({
          data: 'x'.repeat(1000),
          timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000 // 7 days old
        }));
      }

      clearOldData(5); // Keep only 5 most recent
      
      expect(Object.keys(localStorage).length).toBe(5);
    });
  });
});
```

## 🚀 Quick Test Templates

### 1. Service Test Template
```typescript
describe('[ServiceName]', () => {
  let service: ServiceClass;
  
  beforeEach(() => {
    // Setup
  });

  describe('Core Functionality', () => {
    it('should [action] when [condition]', async () => {
      // Arrange
      // Act
      // Assert
    });
  });

  describe('Error Handling', () => {
    it('should handle [error type]', async () => {
      // Test error scenarios
    });
  });

  describe('Edge Cases', () => {
    it('should handle [edge case]', async () => {
      // Test boundaries
    });
  });
});
```

### 2. Component Test Template
```typescript
describe('[ComponentName]', () => {
  const defaultProps = {
    // Default props
  };

  it('should render correctly', () => {
    render(<Component {...defaultProps} />);
    expect(screen.getByRole('...')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const handler = jest.fn();
    render(<Component {...defaultProps} onChange={handler} />);
    
    await userEvent.click(screen.getByRole('button'));
    expect(handler).toHaveBeenCalled();
  });

  it('should display loading state', () => {
    render(<Component {...defaultProps} loading />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should display error state', () => {
    render(<Component {...defaultProps} error="Something went wrong" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
  });
});
```

## 📋 Testing Checklist

### For Each Component/Service:
- [ ] Happy path scenarios
- [ ] Error handling
- [ ] Loading states
- [ ] Empty states
- [ ] Edge cases (null, undefined, empty arrays)
- [ ] User interactions
- [ ] Accessibility (ARIA labels, keyboard navigation)
- [ ] Performance (debouncing, throttling)
- [ ] Memory leaks (cleanup in useEffect)
- [ ] API integration (mocked)

### For Critical Paths:
- [ ] End-to-end user flows
- [ ] Data persistence
- [ ] Authentication flows
- [ ] Error recovery
- [ ] Network failures
- [ ] Concurrent operations
- [ ] Race conditions