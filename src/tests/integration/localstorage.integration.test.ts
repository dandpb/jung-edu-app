/**
 * LocalStorage Integration Tests
 * Tests localStorage functionality and browser environment setup
 */

// Setup localStorage mock before any imports
let mockStore: Record<string, string> = {};

const localStorageMock = {
  getItem: (key: string) => {
    return mockStore[key] || null;
  },
  setItem: (key: string, value: string) => {
    mockStore[key] = value;
  },
  removeItem: (key: string) => {
    delete mockStore[key];
  },
  clear: () => {
    mockStore = {};
  },
  get length() {
    return Object.keys(mockStore).length;
  },
  key: (index: number) => {
    const keys = Object.keys(mockStore);
    return keys[index] || null;
  }
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

import { setupCryptoMocks, cleanupCryptoMocks } from '../../test-utils/cryptoMocks';

export {}; // Make this file a module

describe('LocalStorage Integration Tests', () => {
  beforeAll(() => {
    setupCryptoMocks();
  });

  afterAll(() => {
    cleanupCryptoMocks();
  });

  beforeEach(() => {
    // Clear the mock store
    mockStore = {};
  });

  describe('Basic localStorage functionality', () => {
    it('should be able to store and retrieve from localStorage', () => {
      console.log('Testing localStorage...');
      
      // Test basic localStorage functionality
      localStorage.setItem('test_key', 'test_value');
      const retrieved = localStorage.getItem('test_key');
      
      console.log('Stored: test_value');
      console.log('Retrieved:', retrieved);
      
      expect(retrieved).toBe('test_value');
    });

    it('should persist complex JSON data', () => {
      const testData = {
        user1: { id: '1', name: 'User 1', email: 'user1@test.com' },
        user2: { id: '2', name: 'User 2', email: 'user2@test.com' }
      };
      
      localStorage.setItem('test_users', JSON.stringify(testData));
      const retrieved = localStorage.getItem('test_users');
      
      console.log('Stored JSON:', JSON.stringify(testData));
      console.log('Retrieved:', retrieved);
      
      expect(retrieved).toBeTruthy();
      
      const parsed = JSON.parse(retrieved!);
      expect(parsed.user1.name).toBe('User 1');
      expect(parsed.user2.email).toBe('user2@test.com');
    });

    it('should handle localStorage operations with arrays', () => {
      const testArray = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' }
      ];

      localStorage.setItem('test_array', JSON.stringify(testArray));
      const retrieved = localStorage.getItem('test_array');

      expect(retrieved).toBeTruthy();
      
      const parsed = JSON.parse(retrieved!);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(3);
      expect(parsed[0].name).toBe('Item 1');
    });

    it('should handle localStorage quota and limitations', () => {
      const largeData = 'A'.repeat(1000); // 1KB string
      
      expect(() => {
        localStorage.setItem('large_data', largeData);
      }).not.toThrow();

      const retrieved = localStorage.getItem('large_data');
      expect(retrieved).toBe(largeData);
    });

    it('should handle localStorage removal operations', () => {
      localStorage.setItem('temp_key', 'temp_value');
      expect(localStorage.getItem('temp_key')).toBe('temp_value');

      localStorage.removeItem('temp_key');
      expect(localStorage.getItem('temp_key')).toBeNull();
    });

    it('should handle localStorage clear operations', () => {
      localStorage.setItem('key1', 'value1');
      localStorage.setItem('key2', 'value2');
      localStorage.setItem('key3', 'value3');

      expect(localStorage.length).toBe(3);

      localStorage.clear();

      expect(localStorage.length).toBe(0);
      expect(localStorage.getItem('key1')).toBeNull();
      expect(localStorage.getItem('key2')).toBeNull();
      expect(localStorage.getItem('key3')).toBeNull();
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle null and undefined values', () => {
      localStorage.setItem('null_test', 'null');
      localStorage.setItem('undefined_test', 'undefined');

      expect(localStorage.getItem('null_test')).toBe('null');
      expect(localStorage.getItem('undefined_test')).toBe('undefined');
    });

    it('should handle empty strings', () => {
      localStorage.setItem('empty_test', '');
      expect(localStorage.getItem('empty_test')).toBe('');
    });

    it('should handle non-existent keys', () => {
      expect(localStorage.getItem('non_existent_key')).toBeNull();
    });

    it('should handle JSON parsing errors gracefully', () => {
      localStorage.setItem('invalid_json', '{"invalid": json}');
      
      expect(() => {
        const retrieved = localStorage.getItem('invalid_json');
        if (retrieved) {
          JSON.parse(retrieved);
        }
      }).toThrow();
    });
  });

  describe('Cross-session persistence simulation', () => {
    it('should simulate data persistence across sessions', () => {
      // Simulate first session
      const sessionData = {
        sessionId: 'session-123',
        userId: 'user-456',
        timestamp: Date.now()
      };

      localStorage.setItem('session_data', JSON.stringify(sessionData));

      // Simulate session restart by creating a new storage reference
      const newStorageData = localStorage.getItem('session_data');
      expect(newStorageData).toBeTruthy();

      const parsedData = JSON.parse(newStorageData!);
      expect(parsedData.sessionId).toBe('session-123');
      expect(parsedData.userId).toBe('user-456');
    });

    it('should handle data versioning and migration scenarios', () => {
      // Simulate old version data
      const oldVersionData = {
        version: '1.0.0',
        userData: {
          name: 'John Doe',
          email: 'john@example.com'
        }
      };

      localStorage.setItem('app_data', JSON.stringify(oldVersionData));

      // Simulate version check and migration
      const stored = localStorage.getItem('app_data');
      const data = JSON.parse(stored!);

      if (data.version === '1.0.0') {
        // Migrate to version 2.0.0
        const migratedData = {
          version: '2.0.0',
          user: {
            id: 'user-123',
            profile: {
              firstName: data.userData.name.split(' ')[0],
              lastName: data.userData.name.split(' ')[1],
              email: data.userData.email
            }
          }
        };

        localStorage.setItem('app_data', JSON.stringify(migratedData));
      }

      const finalData = JSON.parse(localStorage.getItem('app_data')!);
      expect(finalData.version).toBe('2.0.0');
      expect(finalData.user.profile.firstName).toBe('John');
      expect(finalData.user.profile.lastName).toBe('Doe');
    });
  });

  afterEach(() => {
    localStorage.clear();
  });
});