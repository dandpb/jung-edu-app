/**
 * Test suite for useCoordination hook
 * Tests coordination functionality, localStorage integration, memory management, and error handling
 */

import { renderHook, act, cleanup } from '@testing-library/react';
import { useCoordination } from '../useCoordination';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock console methods to avoid noise in tests
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('useCoordination - Isolated Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it('should work correctly in isolation', () => {
    const { result } = renderHook(() => useCoordination());

    expect(result.current).toBeTruthy();
    expect(result.current.notify).toBeDefined();
    expect(result.current.updateMemory).toBeDefined();

    act(() => {
      result.current.notify('test message');
      result.current.updateMemory('test-key', 'test-value');
    });

    expect(console.log).toHaveBeenCalledWith('Coordination notification: test message');
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'coordination_test-key',
      JSON.stringify('test-value')
    );
  });

  it('should work after multiple hook renders', () => {
    // First render
    const { result: result1 } = renderHook(() => useCoordination());
    expect(result1.current).toBeTruthy();

    // Second render
    const { result: result2 } = renderHook(() => useCoordination());
    expect(result2.current).toBeTruthy();

    // Third render
    const { result: result3 } = renderHook(() => useCoordination());
    expect(result3.current).toBeTruthy();

    act(() => {
      result3.current.updateMemory('test-key-3', 'test-value-3');
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'coordination_test-key-3',
      JSON.stringify('test-value-3')
    );
  });
});