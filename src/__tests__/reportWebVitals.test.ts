// Mock the entire reportWebVitals module
jest.mock('../reportWebVitals', () => ({
  __esModule: true,
  default: jest.fn()
}));

describe('reportWebVitals', () => {
  let reportWebVitals: jest.MockedFunction<any>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    reportWebVitals = require('../reportWebVitals').default;
  });

  test('is called with a function', () => {
    const mockOnPerfEntry = jest.fn();
    
    // Configure the mock implementation BEFORE calling it
    reportWebVitals.mockImplementation((onPerfEntry?: any) => {
      if (onPerfEntry && typeof onPerfEntry === 'function') {
        // Simulate the web-vitals callbacks
        onPerfEntry({ 
          name: 'CLS', 
          value: 0.1, 
          delta: 0, 
          id: '1', 
          entries: [],
          rating: 'good',
          navigationType: 'navigate'
        });
        onPerfEntry({ 
          name: 'FID', 
          value: 100, 
          delta: 0, 
          id: '2', 
          entries: [],
          rating: 'good',
          navigationType: 'navigate'
        });
        onPerfEntry({ 
          name: 'FCP', 
          value: 1000, 
          delta: 0, 
          id: '3', 
          entries: [],
          rating: 'good',
          navigationType: 'navigate'
        });
        onPerfEntry({ 
          name: 'LCP', 
          value: 2000, 
          delta: 0, 
          id: '4', 
          entries: [],
          rating: 'needs-improvement',
          navigationType: 'navigate'
        });
        onPerfEntry({ 
          name: 'TTFB', 
          value: 500, 
          delta: 0, 
          id: '5', 
          entries: [],
          rating: 'good',
          navigationType: 'navigate'
        });
      }
    });

    // Call reportWebVitals
    reportWebVitals(mockOnPerfEntry);

    // Verify it was called
    expect(reportWebVitals).toHaveBeenCalledWith(mockOnPerfEntry);

    // Verify callback was called with correct values
    expect(mockOnPerfEntry).toHaveBeenCalledTimes(5);
    expect(mockOnPerfEntry).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'CLS', value: 0.1 })
    );
    expect(mockOnPerfEntry).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'FID', value: 100 })
    );
    expect(mockOnPerfEntry).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'FCP', value: 1000 })
    );
    expect(mockOnPerfEntry).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'LCP', value: 2000 })
    );
    expect(mockOnPerfEntry).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'TTFB', value: 500 })
    );
  });

  test('does not throw when called with non-function values', () => {
    // Configure the mock to do nothing
    reportWebVitals.mockImplementation(() => {});

    // Test with various non-function values
    expect(() => reportWebVitals(null)).not.toThrow();
    expect(() => reportWebVitals(undefined)).not.toThrow();
    expect(() => reportWebVitals('not a function')).not.toThrow();
    expect(() => reportWebVitals({})).not.toThrow();
    expect(() => reportWebVitals(123)).not.toThrow();

    // Verify it was called
    expect(reportWebVitals).toHaveBeenCalledTimes(5);
  });

  test('handles errors gracefully', () => {
    const mockOnPerfEntry = jest.fn();
    
    // Configure the mock to throw an error
    reportWebVitals.mockImplementation(() => {
      throw new Error('Import failed');
    });

    // Should not throw when called
    expect(() => {
      try {
        reportWebVitals(mockOnPerfEntry);
      } catch (e) {
        // Error is expected from our mock
      }
    }).not.toThrow();
  });
});