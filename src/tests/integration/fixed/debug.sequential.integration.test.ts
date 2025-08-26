/**
 * Debug Sequential User Creation Test
 */

import { AuthService } from '../../../services/auth/authService';
import { UserRole } from '../../../types/auth';
import { setupCryptoMocks, cleanupCryptoMocks } from '../../../test-utils/cryptoMocks';

// Create persistent localStorage mock for this test
const createPersistentLocalStorage = () => {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => {
      console.log(`localStorage.getItem('${key}'):`, store[key] ? 'FOUND' : 'NULL');
      return store[key] || null;
    },
    setItem: (key: string, value: string) => {
      console.log(`localStorage.setItem('${key}', ${value.length} chars)`);
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      console.log('localStorage.clear() called');
      Object.keys(store).forEach(key => delete store[key]);
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
    get length() {
      return Object.keys(store).length;
    }
  };
};

describe('Debug Sequential User Creation', () => {
  let authService: AuthService;
  let mockLocalStorage: any;

  beforeAll(() => {
    setupCryptoMocks();
    mockLocalStorage = createPersistentLocalStorage();
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true
    });
  });

  afterAll(() => {
    cleanupCryptoMocks();
  });

  beforeEach(() => {
    console.log('=== BeforeEach: Clearing localStorage ===');
    mockLocalStorage.clear();
    authService = new AuthService();
  });

  it('should debug sequential user creation issue', async () => {
    console.log('=== Starting sequential user creation test ===');
    
    const users = [];
    for (let i = 0; i < 3; i++) {
      console.log(`\n--- Creating user ${i} ---`);
      
      const userData = {
        email: `debug${i}@example.com`,
        username: `debuguser${i}`,
        password: 'DebugPass123!',
        firstName: `Debug${i}`,
        lastName: 'User',
        role: UserRole.STUDENT
      };
      
      console.log(`Registering user ${i}:`, userData.email);
      const user = await authService.register(userData);
      console.log(`User ${i} registered with ID:`, user.id);
      
      users.push(user);
      
      // Check localStorage after each registration
      const storedUsers = mockLocalStorage.getItem('jungApp_users');
      if (storedUsers) {
        const parsedUsers = JSON.parse(storedUsers);
        console.log(`After user ${i}, localStorage contains ${Object.keys(parsedUsers).length} users:`, Object.keys(parsedUsers));
      } else {
        console.log(`After user ${i}, localStorage is EMPTY`);
      }
    }

    console.log('\n=== Final verification ===');
    console.log('Total users created:', users.length);
    
    const finalStoredUsers = mockLocalStorage.getItem('jungApp_users');
    if (finalStoredUsers) {
      const parsedUsers = JSON.parse(finalStoredUsers);
      console.log('Final localStorage users:', Object.keys(parsedUsers).length);
      console.log('User IDs in localStorage:', Object.keys(parsedUsers));
      console.log('User IDs from creation:', users.map(u => u.id));
    } else {
      console.log('Final localStorage is EMPTY');
    }

    expect(users).toHaveLength(3);
    expect(finalStoredUsers).toBeTruthy();
  });

  afterEach(() => {
    console.log('=== AfterEach: Clearing localStorage ===');
    mockLocalStorage.clear();
  });
});