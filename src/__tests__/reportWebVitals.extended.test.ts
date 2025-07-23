import reportWebVitals from '../reportWebVitals';
import { ReportHandler } from 'web-vitals';

// Create mock functions
const mockGetCLS = jest.fn();
const mockGetFID = jest.fn();
const mockGetFCP = jest.fn();
const mockGetLCP = jest.fn();
const mockGetTTFB = jest.fn();

// Mock the web-vitals module with proper dynamic import support
jest.mock('web-vitals', () => ({
  getCLS: mockGetCLS,
  getFID: mockGetFID,
  getFCP: mockGetFCP,
  getLCP: mockGetLCP,
  getTTFB: mockGetTTFB
}));

describe('reportWebVitals - Extended Tests', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Reset all mock functions
    mockGetCLS.mockClear();
    mockGetFID.mockClear();
    mockGetFCP.mockClear();
    mockGetLCP.mockClear();
    mockGetTTFB.mockClear();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should call all web vitals functions when valid handler is provided', async () => {
    const mockHandler: ReportHandler = jest.fn();
    
    reportWebVitals(mockHandler);

    // Wait for dynamic import to resolve
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockGetCLS).toHaveBeenCalledWith(mockHandler);
    expect(mockGetFID).toHaveBeenCalledWith(mockHandler);
    expect(mockGetFCP).toHaveBeenCalledWith(mockHandler);
    expect(mockGetLCP).toHaveBeenCalledWith(mockHandler);
    expect(mockGetTTFB).toHaveBeenCalledWith(mockHandler);
  });

  it('should not call web vitals functions when no handler is provided', async () => {
    reportWebVitals();

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockGetCLS).not.toHaveBeenCalled();
    expect(mockGetFID).not.toHaveBeenCalled();
    expect(mockGetFCP).not.toHaveBeenCalled();
    expect(mockGetLCP).not.toHaveBeenCalled();
    expect(mockGetTTFB).not.toHaveBeenCalled();
  });

  it('should not call web vitals functions when handler is not a function', async () => {
    const invalidHandlers = [
      null,
      undefined,
      'string',
      123,
      true,
      {},
      []
    ];

    for (const invalidHandler of invalidHandlers) {
      jest.clearAllMocks();
      reportWebVitals(invalidHandler as any);
      
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockGetCLS).not.toHaveBeenCalled();
      expect(mockGetFID).not.toHaveBeenCalled();
      expect(mockGetFCP).not.toHaveBeenCalled();
      expect(mockGetLCP).not.toHaveBeenCalled();
      expect(mockGetTTFB).not.toHaveBeenCalled();
    }
  });

  it('should handle errors in the dynamic import gracefully', async () => {
    // Mock import to throw an error
    const originalImport = (global as any).import;
    (global as any).import = jest.fn().mockRejectedValue(new Error('Import failed'));
    
    const mockHandler: ReportHandler = jest.fn();
    
    // Should not throw
    expect(() => reportWebVitals(mockHandler)).not.toThrow();
    
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Restore original import
    (global as any).import = originalImport;
  });

  it('should handle errors in web vitals functions gracefully', async () => {
    const mockHandler: ReportHandler = jest.fn();
    
    // Make one of the web vitals functions throw
    mockGetCLS.mockImplementation(() => {
      throw new Error('CLS measurement failed');
    });
    
    reportWebVitals(mockHandler);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Other functions should still be called
    expect(mockGetFID).toHaveBeenCalledWith(mockHandler);
    expect(mockGetFCP).toHaveBeenCalledWith(mockHandler);
    expect(mockGetLCP).toHaveBeenCalledWith(mockHandler);
    expect(mockGetTTFB).toHaveBeenCalledWith(mockHandler);
  });

  it('should work with async handlers', async () => {
    const asyncHandler: ReportHandler = jest.fn().mockResolvedValue(undefined);
    
    reportWebVitals(asyncHandler);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(mockGetCLS).toHaveBeenCalledWith(asyncHandler);
    expect(mockGetFID).toHaveBeenCalledWith(asyncHandler);
    expect(mockGetFCP).toHaveBeenCalledWith(asyncHandler);
    expect(mockGetLCP).toHaveBeenCalledWith(asyncHandler);
    expect(mockGetTTFB).toHaveBeenCalledWith(asyncHandler);
  });

  it('should pass the correct handler reference to all metrics', async () => {
    const handler1: ReportHandler = jest.fn();
    const handler2: ReportHandler = jest.fn();
    
    reportWebVitals(handler1);
    reportWebVitals(handler2);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Each call should use its own handler
    expect(mockGetCLS).toHaveBeenCalledWith(handler1);
    expect(mockGetCLS).toHaveBeenCalledWith(handler2);
    expect(mockGetCLS).toHaveBeenCalledTimes(2);
  });

  describe('Edge cases', () => {
    it('should handle Function constructor edge case', async () => {
      const funcConstructorHandler = new Function('metric', 'console.log(metric)') as ReportHandler;
      
      reportWebVitals(funcConstructorHandler);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockGetCLS).toHaveBeenCalledWith(funcConstructorHandler);
    });

    it('should handle bound functions', async () => {
      const obj = {
        name: 'test',
        handler(metric: any) {
          console.log(this.name, metric);
        }
      };
      
      const boundHandler = obj.handler.bind(obj) as ReportHandler;
      
      reportWebVitals(boundHandler);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockGetCLS).toHaveBeenCalledWith(boundHandler);
    });

    it('should handle arrow functions', async () => {
      const arrowHandler: ReportHandler = (metric) => console.log(metric);
      
      reportWebVitals(arrowHandler);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockGetCLS).toHaveBeenCalledWith(arrowHandler);
    });

    it('should not break if web-vitals module structure changes', async () => {
      // Simulate missing functions by setting to undefined and immediately restore
      const originalGetCLS = mockGetCLS;
      (global as any).mockGetCLS = undefined;
      
      const mockHandler: ReportHandler = jest.fn();
      
      // Should not throw
      expect(() => reportWebVitals(mockHandler)).not.toThrow();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Restore
      (global as any).mockGetCLS = originalGetCLS;
      
      // Other functions should still be attempted
      expect(mockGetFID).toHaveBeenCalled();
    });
  });

  describe('Performance considerations', () => {
    it('should not block the main thread', () => {
      const startTime = performance.now();
      const mockHandler: ReportHandler = jest.fn();
      
      reportWebVitals(mockHandler);
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // Should return almost immediately (not waiting for import)
      expect(executionTime).toBeLessThan(10); // 10ms threshold
    });

    it('should handle multiple rapid calls efficiently', async () => {
      const handlers = Array(100).fill(null).map(() => jest.fn() as ReportHandler);
      
      handlers.forEach(handler => reportWebVitals(handler));
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // All handlers should be registered
      handlers.forEach(handler => {
        expect(mockGetCLS).toHaveBeenCalledWith(handler);
      });
    });
  });
});