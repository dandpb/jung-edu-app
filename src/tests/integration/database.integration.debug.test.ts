/**
 * Database Integration Debug Tests
 * Simplified test to debug localStorage persistence issues
 */

import { AuthService } from '../../services/auth/authService';
import { UserRole, RegistrationData } from '../../types/auth';
import { setupCryptoMocks, cleanupCryptoMocks } from '../../test-utils/cryptoMocks';

describe('Database Integration Debug Tests', () => {
  let authService: AuthService;

  beforeAll(() => {
    setupCryptoMocks();
  });

  afterAll(() => {
    cleanupCryptoMocks();
  });

  beforeEach(() => {
    localStorage.clear();
    authService = new AuthService();
  });

  it('should debug localStorage persistence', async () => {
    console.log('Initial localStorage:', localStorage.getItem('jungApp_users'));
    
    const userData: RegistrationData = {
      email: 'debug@example.com',
      username: 'debuguser',
      password: 'DebugPass123!',
      firstName: 'Debug',
      lastName: 'User',
      role: UserRole.STUDENT
    };

    console.log('About to register user...');
    let user;
    try {
      user = await authService.register(userData);
      console.log('User registered:', user.id);
    } catch (error) {
      console.log('Registration failed:', error);
      throw error;
    }

    // Check immediately after registration
    const storageAfterReg = localStorage.getItem('jungApp_users');
    console.log('localStorage after registration:', storageAfterReg);

    // Try to manually inspect the storage
    if (storageAfterReg) {
      const parsed = JSON.parse(storageAfterReg);
      console.log('Parsed users:', Object.keys(parsed));
    }

    expect(user).toBeDefined();
    expect(user.id).toBeDefined();

    // Now check if it persists across service instance by trying to login
    const newAuthService = new AuthService();
    try {
      const loginResponse = await newAuthService.login({
        username: userData.username,
        password: userData.password,
        rememberMe: false
      });
      console.log('Login successful, user ID:', loginResponse.user.id);
      expect(loginResponse.user.id).toBe(user.id);
    } catch (error) {
      console.log('Login failed:', error);
      throw error;
    }
  });

  afterEach(() => {
    localStorage.clear();
  });
});