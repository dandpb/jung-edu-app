/**
 * Mock AuthService for integration tests
 */

import { UserRole, RegistrationData, LoginData, User, Permission, ResourceType, Action } from '../../../types/auth';

// Mock user store
let mockUserStore: any = {};
let currentUser: any = null;

const createMockUser = (userData: RegistrationData, id: string): User => ({
  id,
  email: userData.email,
  username: userData.username,
  passwordHash: 'mock-hash',
  salt: 'mock-salt',
  role: userData.role || UserRole.STUDENT,
  permissions: [{
    id: 'perm-1',
    resource: ResourceType.MODULE,
    actions: [Action.READ]
  }],
  profile: {
    firstName: userData.firstName,
    lastName: userData.lastName,
    preferences: {
      theme: 'light',
      language: 'pt-BR',
      emailNotifications: true,
      pushNotifications: false
    }
  },
  security: {
    twoFactorEnabled: false,
    passwordHistory: ['mock-hash'],
    lastPasswordChange: new Date(),
    loginNotifications: true,
    trustedDevices: [],
    sessions: []
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  isActive: true,
  isVerified: false,
  verificationToken: 'mock-verification-token'
});

export class AuthService {
  async register(userData: RegistrationData): Promise<User> {
    console.log('Mock AuthService.register called with:', userData);
    const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const user = createMockUser(userData, id);
    mockUserStore[id] = user;
    currentUser = user;
    
    // Store in localStorage to match expected behavior
    const usersArray = Object.values(mockUserStore);
    if (typeof localStorage !== 'undefined' && localStorage.setItem) {
      localStorage.setItem('jungApp_users', JSON.stringify(usersArray));
    } else {
      console.warn('localStorage not available in test environment');
    }
    
    console.log('Mock AuthService.register returning:', user);
    return user;
  }

  async login(loginData: LoginData): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    console.log('Mock AuthService.login called with:', loginData);
    
    // Find user by username or email
    const users = Object.values(mockUserStore);
    let user = users.find((u: any) => 
      u.username === loginData.username || u.email === loginData.username
    ) as User;
    
    if (!user) {
      // Create a user if not found for testing
      const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      user = createMockUser({ 
        email: loginData.username.includes('@') ? loginData.username : loginData.username + '@test.com', 
        username: loginData.username,
        password: loginData.password,
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.INSTRUCTOR 
      }, id);
      mockUserStore[id] = user;
    }
    
    currentUser = user;
    
    const response = {
      user,
      accessToken: 'mock-jwt-token-12345',
      refreshToken: 'mock-refresh-token-67890'
    };
    
    console.log('Mock AuthService.login returning:', response);
    return response;
  }

  async logout(): Promise<void> {
    console.log('Mock AuthService.logout called');
    currentUser = null;
  }

  async getCurrentUser(): Promise<User | null> {
    console.log('Mock AuthService.getCurrentUser returning:', currentUser);
    return currentUser;
  }

  async hasPermission(userId: string, resource: string, action: string): Promise<boolean> {
    console.log(`Mock AuthService.hasPermission called: ${userId}, ${resource}, ${action}`);
    const user = mockUserStore[userId] || currentUser;
    if (!user) return false;
    
    // Basic permission logic for testing
    if (user.role === UserRole.INSTRUCTOR) {
      return true; // Instructors have all permissions
    } else if (user.role === UserRole.STUDENT) {
      return action === 'read'; // Students can only read
    }
    return false;
  }

  async refreshAccessToken(): Promise<{ accessToken: string; refreshToken: string } | null> {
    console.log('Mock AuthService.refreshAccessToken called');
    if (!currentUser) {
      return null;
    }
    return {
      accessToken: 'new-mock-token',
      refreshToken: 'new-refresh-token'
    };
  }
}