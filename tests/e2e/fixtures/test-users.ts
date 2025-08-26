import { faker } from '@faker-js/faker';

export type TestUserRole = 'admin' | 'teacher' | 'student';

export interface TestUser {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: TestUserRole;
  isActive: boolean;
  createdAt?: string;
  profile?: {
    phone?: string;
    dateOfBirth?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    preferences?: {
      language: string;
      timezone: string;
      theme: 'light' | 'dark';
      notifications: boolean;
    };
  };
}

/**
 * Test Users Fixture
 * Provides predefined and generated test users for E2E testing
 */
export class TestUsersFixture {
  private static instance: TestUsersFixture;
  private testUsers: Map<string, TestUser> = new Map();

  private constructor() {
    this.initializePredefinedUsers();
  }

  static getInstance(): TestUsersFixture {
    if (!TestUsersFixture.instance) {
      TestUsersFixture.instance = new TestUsersFixture();
    }
    return TestUsersFixture.instance;
  }

  private initializePredefinedUsers(): void {
    // Admin user
    this.testUsers.set('admin', {
      id: 'admin-test-001',
      email: 'admin@test.jaquedu.com',
      password: 'AdminTest123!',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isActive: true,
      createdAt: new Date().toISOString(),
      profile: {
        phone: '+1234567890',
        preferences: {
          language: 'en',
          timezone: 'UTC',
          theme: 'light',
          notifications: true
        }
      }
    });

    // Teacher user
    this.testUsers.set('teacher', {
      id: 'teacher-test-001',
      email: 'teacher@test.jaquedu.com',
      password: 'TeacherTest123!',
      firstName: 'Teacher',
      lastName: 'User',
      role: 'teacher',
      isActive: true,
      createdAt: new Date().toISOString(),
      profile: {
        phone: '+1234567891',
        preferences: {
          language: 'en',
          timezone: 'UTC',
          theme: 'light',
          notifications: true
        }
      }
    });

    // Student user
    this.testUsers.set('student', {
      id: 'student-test-001',
      email: 'student@test.jaquedu.com',
      password: 'StudentTest123!',
      firstName: 'Student',
      lastName: 'User',
      role: 'student',
      isActive: true,
      createdAt: new Date().toISOString(),
      profile: {
        phone: '+1234567892',
        dateOfBirth: '1995-06-15',
        preferences: {
          language: 'en',
          timezone: 'UTC',
          theme: 'light',
          notifications: true
        }
      }
    });

    // Inactive user for testing
    this.testUsers.set('inactive', {
      id: 'inactive-test-001',
      email: 'inactive@test.jaquedu.com',
      password: 'InactiveTest123!',
      firstName: 'Inactive',
      lastName: 'User',
      role: 'student',
      isActive: false,
      createdAt: new Date().toISOString()
    });

    // Spanish-speaking user for i18n testing
    this.testUsers.set('spanish', {
      id: 'spanish-test-001',
      email: 'usuario@test.jaquedu.com',
      password: 'UsuarioTest123!',
      firstName: 'Usuario',
      lastName: 'Español',
      role: 'student',
      isActive: true,
      createdAt: new Date().toISOString(),
      profile: {
        preferences: {
          language: 'es',
          timezone: 'Europe/Madrid',
          theme: 'light',
          notifications: true
        }
      }
    });

    // Portuguese-speaking user for i18n testing
    this.testUsers.set('portuguese', {
      id: 'portuguese-test-001',
      email: 'usuario.br@test.jaquedu.com',
      password: 'UsuarioBRTest123!',
      firstName: 'Usuário',
      lastName: 'Brasileiro',
      role: 'student',
      isActive: true,
      createdAt: new Date().toISOString(),
      profile: {
        preferences: {
          language: 'pt-br',
          timezone: 'America/Sao_Paulo',
          theme: 'dark',
          notifications: true
        }
      }
    });
  }

  // Get predefined users
  getUser(key: string): TestUser | undefined {
    return this.testUsers.get(key);
  }

  getAdminUser(): TestUser {
    const user = this.getUser('admin');
    if (!user) throw new Error('Admin user not found');
    return user;
  }

  getTeacherUser(): TestUser {
    const user = this.getUser('teacher');
    if (!user) throw new Error('Teacher user not found');
    return user;
  }

  getStudentUser(): TestUser {
    const user = this.getUser('student');
    if (!user) throw new Error('Student user not found');
    return user;
  }

  getInactiveUser(): TestUser {
    const user = this.getUser('inactive');
    if (!user) throw new Error('Inactive user not found');
    return user;
  }

  getSpanishUser(): TestUser {
    const user = this.getUser('spanish');
    if (!user) throw new Error('Spanish user not found');
    return user;
  }

  getPortugueseUser(): TestUser {
    const user = this.getUser('portuguese');
    if (!user) throw new Error('Portuguese user not found');
    return user;
  }

  getAllUsers(): TestUser[] {
    return Array.from(this.testUsers.values());
  }

  getUsersByRole(role: TestUserRole): TestUser[] {
    return this.getAllUsers().filter(user => user.role === role);
  }

  getActiveUsers(): TestUser[] {
    return this.getAllUsers().filter(user => user.isActive);
  }

  // Generate random users
  generateRandomUser(role: TestUserRole = 'student'): TestUser {
    const id = faker.string.uuid();
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({
      firstName: firstName.toLowerCase(),
      lastName: lastName.toLowerCase(),
      provider: 'test.jaquedu.com'
    });

    return {
      id,
      email,
      password: 'TestPassword123!',
      firstName,
      lastName,
      role,
      isActive: true,
      createdAt: new Date().toISOString(),
      profile: {
        phone: faker.phone.number(),
        dateOfBirth: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }).toISOString().split('T')[0],
        address: {
          street: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          zipCode: faker.location.zipCode(),
          country: faker.location.country()
        },
        preferences: {
          language: faker.helpers.arrayElement(['en', 'es', 'pt-br']),
          timezone: faker.location.timeZone(),
          theme: faker.helpers.arrayElement(['light', 'dark']),
          notifications: faker.datatype.boolean()
        }
      }
    };
  }

  generateRandomUsers(count: number, role: TestUserRole = 'student'): TestUser[] {
    return Array.from({ length: count }, () => this.generateRandomUser(role));
  }

  generateUserBatch(config: {
    admins?: number;
    teachers?: number;
    students?: number;
  }): TestUser[] {
    const users: TestUser[] = [];

    if (config.admins) {
      users.push(...this.generateRandomUsers(config.admins, 'admin'));
    }

    if (config.teachers) {
      users.push(...this.generateRandomUsers(config.teachers, 'teacher'));
    }

    if (config.students) {
      users.push(...this.generateRandomUsers(config.students, 'student'));
    }

    return users;
  }

  // Specialized user generators
  generateUserWithProfile(
    role: TestUserRole = 'student',
    profileData?: Partial<TestUser['profile']>
  ): TestUser {
    const user = this.generateRandomUser(role);
    if (profileData && user.profile) {
      user.profile = { ...user.profile, ...profileData };
    }
    return user;
  }

  generateInternationalUsers(): TestUser[] {
    const languages = [
      { lang: 'en', timezone: 'America/New_York', country: 'United States' },
      { lang: 'es', timezone: 'Europe/Madrid', country: 'Spain' },
      { lang: 'pt-br', timezone: 'America/Sao_Paulo', country: 'Brazil' },
      { lang: 'fr', timezone: 'Europe/Paris', country: 'France' },
      { lang: 'de', timezone: 'Europe/Berlin', country: 'Germany' }
    ];

    return languages.map(({ lang, timezone, country }) => {
      const user = this.generateRandomUser('student');
      if (user.profile?.preferences) {
        user.profile.preferences.language = lang;
        user.profile.preferences.timezone = timezone;
      }
      if (user.profile?.address) {
        user.profile.address.country = country;
      }
      return user;
    });
  }

  generateUsersWithDifferentRoles(): TestUser[] {
    return [
      this.generateRandomUser('admin'),
      this.generateRandomUser('teacher'),
      this.generateRandomUser('teacher'),
      ...this.generateRandomUsers(5, 'student')
    ];
  }

  // User validation helpers
  validateUser(user: TestUser): boolean {
    const requiredFields = ['id', 'email', 'password', 'firstName', 'lastName', 'role'];
    
    for (const field of requiredFields) {
      if (!(field in user) || !user[field as keyof TestUser]) {
        return false;
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.email)) {
      return false;
    }

    // Validate role
    if (!['admin', 'teacher', 'student'].includes(user.role)) {
      return false;
    }

    return true;
  }

  validateUserCredentials(email: string, password: string): TestUser | null {
    const user = this.getAllUsers().find(u => u.email === email && u.password === password);
    return user && user.isActive ? user : null;
  }

  // User management
  addUser(key: string, user: TestUser): void {
    if (this.validateUser(user)) {
      this.testUsers.set(key, user);
    } else {
      throw new Error('Invalid user data');
    }
  }

  removeUser(key: string): void {
    this.testUsers.delete(key);
  }

  updateUser(key: string, updates: Partial<TestUser>): TestUser | null {
    const user = this.testUsers.get(key);
    if (user) {
      const updatedUser = { ...user, ...updates };
      if (this.validateUser(updatedUser)) {
        this.testUsers.set(key, updatedUser);
        return updatedUser;
      }
    }
    return null;
  }

  // Bulk operations
  addUsers(users: Array<{ key: string; user: TestUser }>): void {
    users.forEach(({ key, user }) => {
      this.addUser(key, user);
    });
  }

  clearGeneratedUsers(): void {
    // Keep only predefined users (admin, teacher, student, etc.)
    const predefinedKeys = ['admin', 'teacher', 'student', 'inactive', 'spanish', 'portuguese'];
    const newMap = new Map<string, TestUser>();
    
    predefinedKeys.forEach(key => {
      const user = this.testUsers.get(key);
      if (user) {
        newMap.set(key, user);
      }
    });
    
    this.testUsers = newMap;
  }

  // Export/Import for test data persistence
  exportUsers(): string {
    const users = Object.fromEntries(this.testUsers);
    return JSON.stringify(users, null, 2);
  }

  importUsers(jsonData: string): void {
    try {
      const users = JSON.parse(jsonData);
      Object.entries(users).forEach(([key, user]) => {
        if (this.validateUser(user as TestUser)) {
          this.testUsers.set(key, user as TestUser);
        }
      });
    } catch (error) {
      throw new Error('Invalid JSON data for users import');
    }
  }

  // Reset to initial state
  reset(): void {
    this.testUsers.clear();
    this.initializePredefinedUsers();
  }
}