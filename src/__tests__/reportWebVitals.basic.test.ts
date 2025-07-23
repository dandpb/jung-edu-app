import reportWebVitals from '../reportWebVitals';
import { ReportHandler } from 'web-vitals';

describe('reportWebVitals - Basic Tests', () => {
  it('should handle valid handler function', () => {
    const mockHandler: ReportHandler = jest.fn();
    
    // Should not throw
    expect(() => reportWebVitals(mockHandler)).not.toThrow();
  });

  it('should handle no handler gracefully', () => {
    // Should not throw
    expect(() => reportWebVitals()).not.toThrow();
  });

  it('should handle null handler gracefully', () => {
    // Should not throw
    expect(() => reportWebVitals(null as any)).not.toThrow();
  });

  it('should handle non-function handler gracefully', () => {
    // Should not throw
    expect(() => reportWebVitals('not a function' as any)).not.toThrow();
    expect(() => reportWebVitals(123 as any)).not.toThrow();
    expect(() => reportWebVitals({} as any)).not.toThrow();
  });
});