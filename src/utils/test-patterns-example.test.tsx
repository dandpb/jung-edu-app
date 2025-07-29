/**
 * Example test file demonstrating best practices and patterns
 * Use this as a reference for writing consistent tests
 */

import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { render, userEvent, mockLocalStorage } from './test-utils';
import { setupLocalStorage, setupConsoleHandlers, expectLocalStorageUpdate } from './test-setup';
import { 
  createMockModule, 
  createMockUserProgress, 
  createMockQuiz,
  testDataPresets 
} from './test-mocks';

// Example component for demonstration
const ExampleComponent: React.FC<{ onSave?: (data: any) => void }> = ({ onSave }) => {
  const [value, setValue] = React.useState('');
  const [saved, setSaved] = React.useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value) {
      onSave?.({ value, timestamp: Date.now() });
      setSaved(true);
      localStorage.setItem('exampleData', JSON.stringify({ value }));
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="example-input">Example Input</label>
      <input
        id="example-input"
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        required
      />
      <button type="submit">Save</button>
      {saved && <div role="alert">Saved successfully!</div>}
    </form>
  );
};

// Setup console handlers for the entire test suite
setupConsoleHandlers();

describe('Example Test Patterns', () => {
  // Pattern 1: Basic Component Rendering
  describe('Basic Rendering', () => {
    test('renders component with all elements', () => {
      render(<ExampleComponent />);
      
      expect(screen.getByLabelText('Example Input')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    });
    
    test('renders with custom props', () => {
      const onSave = jest.fn();
      render(<ExampleComponent onSave={onSave} />);
      
      expect(screen.getByLabelText('Example Input')).toBeInTheDocument();
    });
  });
  
  // Pattern 2: User Interactions with userEvent
  describe('User Interactions', () => {
    test('handles user input correctly', async () => {
      const { user } = render(<ExampleComponent />);
      
      const input = screen.getByLabelText('Example Input');
      await user.type(input, 'Test value');
      
      expect(input).toHaveValue('Test value');
    });
    
    test('submits form with valid data', async () => {
      const onSave = jest.fn();
      const { user } = render(<ExampleComponent onSave={onSave} />);
      
      const input = screen.getByLabelText('Example Input');
      const submitButton = screen.getByRole('button', { name: 'Save' });
      
      await user.type(input, 'Test value');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith({
          value: 'Test value',
          timestamp: expect.any(Number)
        });
      });
      
      expect(screen.getByRole('alert')).toHaveTextContent('Saved successfully!');
    });
  });
  
  // Pattern 3: LocalStorage Integration
  describe('LocalStorage Integration', () => {
    // Setup localStorage before each test
    setupLocalStorage();
    
    test('saves data to localStorage', async () => {
      const { user } = render(<ExampleComponent />);
      
      const input = screen.getByLabelText('Example Input');
      const submitButton = screen.getByRole('button', { name: 'Save' });
      
      await user.type(input, 'Stored value');
      await user.click(submitButton);
      
      expectLocalStorageUpdate('exampleData', { value: 'Stored value' });
    });
    
    test('loads existing data from localStorage', () => {
      // Pre-populate localStorage
      mockLocalStorage.__setStore({
        exampleData: JSON.stringify({ value: 'Existing value' })
      });
      
      // Component would typically load this data on mount
      // This is just an example pattern
      expect(mockLocalStorage.getItem('exampleData')).toBe(
        JSON.stringify({ value: 'Existing value' })
      );
    });
  });
  
  // Pattern 4: Using Mock Factories
  describe('Using Mock Data', () => {
    test('renders with mock module data', () => {
      const mockModule = createMockModule({
        title: 'Custom Module Title',
        description: 'Custom description'
      });
      
      // Use mockModule in your component
      expect(mockModule.title).toBe('Custom Module Title');
      expect(mockModule.sections).toHaveLength(1);
    });
    
    test('uses test data presets', () => {
      const { modules, progress } = testDataPresets.partialProgress;
      
      expect(modules).toHaveLength(5);
      expect(progress.completedModules).toHaveLength(2);
    });
  });
  
  // Pattern 5: Async Operations
  describe('Async Operations', () => {
    test('handles async data loading', async () => {
      const AsyncComponent = () => {
        const [data, setData] = React.useState<string | null>(null);
        const [loading, setLoading] = React.useState(true);
        
        React.useEffect(() => {
          setTimeout(() => {
            setData('Loaded data');
            setLoading(false);
          }, 100);
        }, []);
        
        if (loading) return <div>Loading...</div>;
        return <div>{data}</div>;
      };
      
      render(<AsyncComponent />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('Loaded data')).toBeInTheDocument();
      });
    });
  });
  
  // Pattern 6: Error Handling
  describe('Error Handling', () => {
    test('displays error messages', async () => {
      const ErrorComponent = () => {
        const [error, setError] = React.useState<string | null>(null);
        
        const handleClick = () => {
          setError('Something went wrong!');
        };
        
        return (
          <div>
            <button onClick={handleClick}>Trigger Error</button>
            {error && <div role="alert" aria-live="assertive">{error}</div>}
          </div>
        );
      };
      
      const { user } = render(<ErrorComponent />);
      
      const button = screen.getByRole('button', { name: 'Trigger Error' });
      await user.click(button);
      
      expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong!');
    });
  });
  
  // Pattern 7: Testing with Router
  describe('Router Integration', () => {
    test('navigates between pages', async () => {
      const { user } = render(
        <div>
          <a href="/dashboard">Go to Dashboard</a>
        </div>,
        { initialEntries: ['/'] }
      );
      
      const link = screen.getByRole('link', { name: 'Go to Dashboard' });
      expect(link).toHaveAttribute('href', '/dashboard');
    });
  });
  
  // Pattern 8: Accessibility Testing
  describe('Accessibility', () => {
    test('has proper ARIA attributes', () => {
      render(<ExampleComponent />);
      
      const input = screen.getByLabelText('Example Input');
      expect(input).toHaveAttribute('required');
      
      // Form should be accessible
      const form = input.closest('form');
      expect(form).toBeInTheDocument();
    });
    
    test('announces dynamic content', async () => {
      const { user } = render(<ExampleComponent />);
      
      const input = screen.getByLabelText('Example Input');
      const submitButton = screen.getByRole('button', { name: 'Save' });
      
      await user.type(input, 'Test');
      await user.click(submitButton);
      
      const alert = await screen.findByRole('alert');
      expect(alert).toBeInTheDocument();
    });
  });
});

// Example of testing a component that uses context
describe('Context Integration Example', () => {
  // Component that uses AdminContext
  const AdminFeature = () => {
    const { isAdmin } = require('../contexts/AdminContext').useAdmin();
    return <div>{isAdmin ? 'Admin View' : 'User View'}</div>;
  };
  
  test('renders based on admin context', () => {
    // The test-utils already wraps with AdminProvider
    render(<AdminFeature />);
    
    // Default is non-admin
    expect(screen.getByText('User View')).toBeInTheDocument();
  });
});

// Example of integration test
describe('Integration Test Example', () => {
  test('complete user flow', async () => {
    const onComplete = jest.fn();
    
    const UserFlow = () => {
      const [step, setStep] = React.useState(1);
      
      const handleNext = () => {
        if (step < 3) {
          setStep(step + 1);
        } else {
          onComplete();
        }
      };
      
      return (
        <div>
          <h2>Step {step}</h2>
          <button onClick={handleNext}>
            {step < 3 ? 'Next' : 'Complete'}
          </button>
        </div>
      );
    };
    
    const { user } = render(<UserFlow />);
    
    // Step 1
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    
    // Go to step 2
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Step 2')).toBeInTheDocument();
    
    // Go to step 3
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Step 3')).toBeInTheDocument();
    
    // Complete
    await user.click(screen.getByRole('button', { name: 'Complete' }));
    expect(onComplete).toHaveBeenCalled();
  });
});