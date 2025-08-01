import reportWebVitals from '../reportWebVitals';
import { ReportHandler } from 'web-vitals';

describe('reportWebVitals - Extended Tests', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should handle valid handler without throwing errors', () => {
    const mockHandler: ReportHandler = jest.fn();
    
    expect(() => reportWebVitals(mockHandler)).not.toThrow();
    expect(mockHandler).toBeDefined();
    expect(typeof mockHandler).toBe('function');
  });

  it('should not throw when no handler is provided', () => {
    expect(() => reportWebVitals()).not.toThrow();
  });

  it('should not throw when handler is not a function', () => {
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
      expect(() => reportWebVitals(invalidHandler as any)).not.toThrow();
    }
  });

  it('should handle undefined global import gracefully', () => {
    const originalImport = (global as any).import;
    (global as any).import = undefined;
    
    const mockHandler: ReportHandler = jest.fn();
    
    // Should not throw even if import is not available
    expect(() => reportWebVitals(mockHandler)).not.toThrow();
    
    // Restore
    (global as any).import = originalImport;
  });

  it('should handle various handler types without errors', () => {
    const regularHandler: ReportHandler = jest.fn();
    const asyncHandler: ReportHandler = jest.fn().mockResolvedValue(undefined);
    const errorHandler: ReportHandler = jest.fn().mockRejectedValue(new Error('Handler error'));
    
    // All should be handled gracefully
    expect(() => reportWebVitals(regularHandler)).not.toThrow();
    expect(() => reportWebVitals(asyncHandler)).not.toThrow();
    expect(() => reportWebVitals(errorHandler)).not.toThrow();
  });

  it('should accept async handlers', () => {
    const asyncHandler: ReportHandler = jest.fn().mockResolvedValue(undefined);
    
    expect(() => reportWebVitals(asyncHandler)).not.toThrow();
    expect(asyncHandler).toBeDefined();
    expect(typeof asyncHandler).toBe('function');
  });

  it('should handle multiple handler calls', () => {
    const handler1: ReportHandler = jest.fn();
    const handler2: ReportHandler = jest.fn();
    const handler3: ReportHandler = jest.fn();
    
    // Multiple calls should not interfere with each other
    expect(() => {
      reportWebVitals(handler1);
      reportWebVitals(handler2);
      reportWebVitals(handler3);
    }).not.toThrow();
  });

  describe('Edge cases', () => {
    it('should handle Function constructor edge case', () => {
      const funcConstructorHandler = new Function('metric', 'console.log(metric)') as ReportHandler;
      
      expect(() => reportWebVitals(funcConstructorHandler)).not.toThrow();
      expect(funcConstructorHandler instanceof Function).toBe(true);
    });

    it('should handle bound functions', () => {
      const obj = {
        name: 'test',
        handler(metric: any) {
          console.log(this.name, metric);
        }
      };
      
      const boundHandler = obj.handler.bind(obj) as ReportHandler;
      
      expect(() => reportWebVitals(boundHandler)).not.toThrow();
      expect(typeof boundHandler).toBe('function');
    });

    it('should handle arrow functions', () => {
      const arrowHandler: ReportHandler = (metric) => console.log(metric);
      
      expect(() => reportWebVitals(arrowHandler)).not.toThrow();
      expect(typeof arrowHandler).toBe('function');
    });

    it('should handle environment without dynamic import', () => {
      const originalImport = (global as any).import;
      delete (global as any).import;
      
      const mockHandler: ReportHandler = jest.fn();
      
      // Should not throw even without import capability
      expect(() => reportWebVitals(mockHandler)).not.toThrow();
      
      // Restore
      (global as any).import = originalImport;
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

    it('should handle multiple rapid calls efficiently', () => {
      const handlers = Array(100).fill(null).map(() => jest.fn() as ReportHandler);
      const startTime = performance.now();
      
      // Should handle many calls efficiently
      handlers.forEach(handler => reportWebVitals(handler));
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should complete quickly even with many calls
      expect(totalTime).toBeLessThan(50); // 50ms for 100 calls
    });
  });
});