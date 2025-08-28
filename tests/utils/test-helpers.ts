import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { testConfig } from '../setup/test-config';

/**
 * Test Helper Utilities for jaqEdu Platform
 * Provides common testing functions and utilities
 */

// Time utilities
export const timeHelpers = {
  sleep: (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms)),
  
  waitFor: async (condition: () => boolean | Promise<boolean>, timeout = 5000): Promise<void> => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (await condition()) return;
      await timeHelpers.sleep(100);
    }
    throw new Error(`Condition not met within ${timeout}ms`);
  },
  
  measureExecutionTime: async <T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> => {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    return { result, duration };
  }
};

// Mock utilities
export const mockHelpers = {
  createMockRequest: (overrides: Partial<Request> = {}): Partial<Request> => ({
    body: {},
    params: {},
    query: {},
    headers: {},
    user: null,
    ...overrides
  }),
  
  createMockResponse: (): Partial<Response> => {
    const res: Partial<Response> = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
      redirect: jest.fn().mockReturnThis(),
      render: jest.fn().mockReturnThis()
    };
    return res;
  },
  
  createMockNext: (): NextFunction => jest.fn(),
  
  mockConsoleError: (): jest.SpyInstance => {
    return jest.spyOn(console, 'error').mockImplementation(() => {});
  },
  
  mockConsoleWarn: (): jest.SpyInstance => {
    return jest.spyOn(console, 'warn').mockImplementation(() => {});
  }
};

// Authentication utilities
export const authHelpers = {
  generateTestToken: (payload: object = { id: uuidv4(), email: 'test@example.com' }): string => {
    return jwt.sign(payload, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
  },
  
  generateExpiredToken: (payload: object = { id: uuidv4(), email: 'test@example.com' }): string => {
    return jwt.sign(payload, process.env.JWT_SECRET || 'test-secret', { expiresIn: '-1h' });
  },
  
  hashPassword: async (password: string): Promise<string> => {
    return bcrypt.hash(password, 10);
  },
  
  createAuthHeaders: (token?: string): { Authorization: string } => ({
    Authorization: `Bearer ${token || authHelpers.generateTestToken()}`
  })
};

// Database utilities
export const dbHelpers = {
  generateUUID: (): string => uuidv4(),
  
  cleanupTables: async (tableNames: string[]): Promise<void> => {
    // Implementation would depend on your database setup
    // This is a placeholder for the actual cleanup logic
    console.log(`Cleaning up tables: ${tableNames.join(', ')}`);
  },
  
  seedTestData: async (data: Record<string, any[]>): Promise<void> => {
    // Implementation would depend on your database setup
    console.log(`Seeding test data for tables: ${Object.keys(data).join(', ')}`);
  },
  
  truncateAllTables: async (): Promise<void> => {
    // Implementation would depend on your database setup
    console.log('Truncating all test tables');
  }
};

// Validation utilities
export const validationHelpers = {
  isValidUUID: (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  },
  
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  isValidPassword: (password: string): boolean => {
    // At least 8 characters, one uppercase, one lowercase, one number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  },
  
  isValidPhoneNumber: (phone: string): boolean => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/[\s-()]/g, ''));
  }
};

// API response utilities
export const responseHelpers = {
  expectSuccessResponse: (response: any, expectedData?: any): void => {
    expect(response).toHaveProperty('success', true);
    expect(response).toHaveProperty('data');
    if (expectedData) {
      expect(response.data).toMatchObject(expectedData);
    }
  },
  
  expectErrorResponse: (response: any, expectedMessage?: string, expectedCode?: number): void => {
    expect(response).toHaveProperty('success', false);
    expect(response).toHaveProperty('error');
    if (expectedMessage) {
      expect(response.error).toContain(expectedMessage);
    }
    if (expectedCode) {
      expect(response.status || response.statusCode).toBe(expectedCode);
    }
  },
  
  expectPaginatedResponse: (response: any): void => {
    expect(response).toHaveProperty('data');
    expect(response).toHaveProperty('pagination');
    expect(response.pagination).toHaveProperty('page');
    expect(response.pagination).toHaveProperty('limit');
    expect(response.pagination).toHaveProperty('total');
    expect(response.pagination).toHaveProperty('pages');
  }
};

// Performance testing utilities
export const performanceHelpers = {
  expectFastResponse: (duration: number, maxDuration: number = testConfig.performance.maxResponseTime): void => {
    expect(duration).toBeLessThan(maxDuration);
  },
  
  measureMemoryUsage: (): { heapUsed: number; heapTotal: number; external: number } => {
    const usage = process.memoryUsage();
    return {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external
    };
  },
  
  expectMemoryWithinLimits: (initialMemory: number, finalMemory: number, maxIncrease: number = testConfig.performance.maxMemoryUsage): void => {
    const memoryIncrease = finalMemory - initialMemory;
    expect(memoryIncrease).toBeLessThan(maxIncrease);
  }
};

// File utilities
export const fileHelpers = {
  createTempFile: async (content: string, extension: string = 'txt'): Promise<string> => {
    const fs = await import('fs/promises');
    const path = await import('path');
    const os = await import('os');
    
    const tempDir = os.tmpdir();
    const fileName = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${extension}`;
    const filePath = path.join(tempDir, fileName);
    
    await fs.writeFile(filePath, content);
    return filePath;
  },
  
  cleanupTempFile: async (filePath: string): Promise<void> => {
    const fs = await import('fs/promises');
    try {
      await fs.unlink(filePath);
    } catch (error) {
      // File might not exist, ignore error
    }
  }
};

// Random data generators
export const randomHelpers = {
  randomString: (length: number = 10): string => {
    return Math.random().toString(36).substring(2, 2 + length);
  },
  
  randomEmail: (): string => {
    return `${randomHelpers.randomString(8)}@${randomHelpers.randomString(5)}.com`;
  },
  
  randomNumber: (min: number = 0, max: number = 100): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  
  randomBoolean: (): boolean => {
    return Math.random() < 0.5;
  },
  
  randomDate: (startYear: number = 2020, endYear: number = 2024): Date => {
    const start = new Date(startYear, 0, 1);
    const end = new Date(endYear, 11, 31);
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  },
  
  randomArrayElement: <T>(array: T[]): T => {
    return array[Math.floor(Math.random() * array.length)];
  }
};

// Error simulation utilities
export const errorHelpers = {
  simulateNetworkError: (): Error => new Error('Network Error: Connection failed'),
  simulateTimeoutError: (): Error => new Error('Timeout Error: Request timed out'),
  simulateDatabaseError: (): Error => new Error('Database Error: Connection lost'),
  simulateValidationError: (field: string): Error => new Error(`Validation Error: Invalid ${field}`),
  simulateAuthenticationError: (): Error => new Error('Authentication Error: Invalid credentials'),
  simulateAuthorizationError: (): Error => new Error('Authorization Error: Access denied')
};

export default {
  timeHelpers,
  mockHelpers,
  authHelpers,
  dbHelpers,
  validationHelpers,
  responseHelpers,
  performanceHelpers,
  fileHelpers,
  randomHelpers,
  errorHelpers
};
