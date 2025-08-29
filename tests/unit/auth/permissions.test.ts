/**
 * Comprehensive Unit Tests for Permission and Role Management
 * Tests role hierarchy, permission checking, and authorization logic
 */

import {
  UserRole,
  ResourceType,
  Action,
  Permission,
  ROLE_HIERARCHY,
  DEFAULT_PERMISSIONS,
  User,
  AuthError,
  AuthErrorType
} from '../../../src/types/auth';

describe('Permission and Role Management', () => {
  
  const createMockUser = (role: UserRole, additionalPermissions: Permission[] = []): User => ({
    id: 'test-user',
    email: 'test@example.com',
    username: 'testuser',
    passwordHash: 'hash',
    salt: 'salt',
    role,
    permissions: [...DEFAULT_PERMISSIONS[role], ...additionalPermissions],
    profile: {
      firstName: 'Test',
      lastName: 'User',
      preferences: {
        theme: 'light',
        language: 'en',
        emailNotifications: true,
        pushNotifications: false
      }
    },
    security: {
      twoFactorEnabled: false,
      passwordHistory: [],
      lastPasswordChange: new Date(),
      loginNotifications: true,
      trustedDevices: [],
      sessions: []
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    isVerified: true
  });

  describe('Role Hierarchy', () => {
    it('should have correct role hierarchy structure', () => {
      expect(ROLE_HIERARCHY).toEqual({
        [UserRole.SUPER_ADMIN]: [UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT, UserRole.GUEST],
        [UserRole.ADMIN]: [UserRole.INSTRUCTOR, UserRole.STUDENT, UserRole.GUEST],
        [UserRole.INSTRUCTOR]: [UserRole.STUDENT, UserRole.GUEST],
        [UserRole.STUDENT]: [UserRole.GUEST],
        [UserRole.GUEST]: []
      });
    });

    it('should define all user roles', () => {
      const expectedRoles = ['super_admin', 'admin', 'instructor', 'student', 'guest'];
      const actualRoles = Object.values(UserRole);
      
      expect(actualRoles).toEqual(expect.arrayContaining(expectedRoles));
      expect(actualRoles).toHaveLength(expectedRoles.length);
    });

    it('should maintain consistent hierarchy ordering', () => {
      // Super admin should have access to all lower roles
      expect(ROLE_HIERARCHY[UserRole.SUPER_ADMIN]).toContain(UserRole.ADMIN);
      expect(ROLE_HIERARCHY[UserRole.SUPER_ADMIN]).toContain(UserRole.INSTRUCTOR);
      expect(ROLE_HIERARCHY[UserRole.SUPER_ADMIN]).toContain(UserRole.STUDENT);
      expect(ROLE_HIERARCHY[UserRole.SUPER_ADMIN]).toContain(UserRole.GUEST);

      // Admin should have access to instructor, student, and guest
      expect(ROLE_HIERARCHY[UserRole.ADMIN]).toContain(UserRole.INSTRUCTOR);
      expect(ROLE_HIERARCHY[UserRole.ADMIN]).toContain(UserRole.STUDENT);
      expect(ROLE_HIERARCHY[UserRole.ADMIN]).toContain(UserRole.GUEST);
      expect(ROLE_HIERARCHY[UserRole.ADMIN]).not.toContain(UserRole.SUPER_ADMIN);

      // Instructor should have access to student and guest only
      expect(ROLE_HIERARCHY[UserRole.INSTRUCTOR]).toContain(UserRole.STUDENT);
      expect(ROLE_HIERARCHY[UserRole.INSTRUCTOR]).toContain(UserRole.GUEST);
      expect(ROLE_HIERARCHY[UserRole.INSTRUCTOR]).not.toContain(UserRole.ADMIN);
      expect(ROLE_HIERARCHY[UserRole.INSTRUCTOR]).not.toContain(UserRole.SUPER_ADMIN);

      // Student should have access to guest only
      expect(ROLE_HIERARCHY[UserRole.STUDENT]).toContain(UserRole.GUEST);
      expect(ROLE_HIERARCHY[UserRole.STUDENT]).not.toContain(UserRole.INSTRUCTOR);
      expect(ROLE_HIERARCHY[UserRole.STUDENT]).not.toContain(UserRole.ADMIN);

      // Guest should have no subordinate roles
      expect(ROLE_HIERARCHY[UserRole.GUEST]).toHaveLength(0);
    });
  });

  describe('Default Permissions', () => {
    it('should define permissions for all roles', () => {
      const roles = Object.values(UserRole);
      
      roles.forEach(role => {
        expect(DEFAULT_PERMISSIONS[role]).toBeDefined();
        expect(Array.isArray(DEFAULT_PERMISSIONS[role])).toBe(true);
      });
    });

    it('should grant super admin all system permissions', () => {
      const superAdminPerms = DEFAULT_PERMISSIONS[UserRole.SUPER_ADMIN];
      
      expect(superAdminPerms).toHaveLength(1);
      expect(superAdminPerms[0]).toMatchObject({
        id: 'super-admin-all',
        resource: ResourceType.SYSTEM,
        actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.PUBLISH, Action.SHARE]
      });
    });

    it('should grant admin comprehensive permissions', () => {
      const adminPerms = DEFAULT_PERMISSIONS[UserRole.ADMIN];
      
      expect(adminPerms.length).toBeGreaterThan(1);
      
      const modulePermission = adminPerms.find(p => p.resource === ResourceType.MODULE);
      expect(modulePermission).toBeDefined();
      expect(modulePermission?.actions).toContain(Action.CREATE);
      expect(modulePermission?.actions).toContain(Action.READ);
      expect(modulePermission?.actions).toContain(Action.UPDATE);
      expect(modulePermission?.actions).toContain(Action.DELETE);
      expect(modulePermission?.actions).toContain(Action.PUBLISH);

      const userPermission = adminPerms.find(p => p.resource === ResourceType.USER);
      expect(userPermission).toBeDefined();
      expect(userPermission?.actions).toContain(Action.CREATE);
      expect(userPermission?.actions).toContain(Action.READ);
      expect(userPermission?.actions).toContain(Action.UPDATE);
      expect(userPermission?.actions).toContain(Action.DELETE);
    });

    it('should grant instructor ownership-based permissions', () => {
      const instructorPerms = DEFAULT_PERMISSIONS[UserRole.INSTRUCTOR];
      
      const modulePermission = instructorPerms.find(p => p.resource === ResourceType.MODULE);
      expect(modulePermission).toBeDefined();
      expect(modulePermission?.conditions).toContainEqual({ type: 'ownership', value: true });
      
      const quizPermission = instructorPerms.find(p => p.resource === ResourceType.QUIZ);
      expect(quizPermission).toBeDefined();
      expect(quizPermission?.conditions).toContainEqual({ type: 'ownership', value: true });
    });

    it('should grant student read-only and personal content permissions', () => {
      const studentPerms = DEFAULT_PERMISSIONS[UserRole.STUDENT];
      
      const modulePermission = studentPerms.find(p => p.resource === ResourceType.MODULE);
      expect(modulePermission).toBeDefined();
      expect(modulePermission?.actions).toEqual([Action.READ]);
      expect(modulePermission?.conditions).toBeUndefined();

      const quizPermission = studentPerms.find(p => p.resource === ResourceType.QUIZ);
      expect(quizPermission).toBeDefined();
      expect(quizPermission?.actions).toEqual([Action.READ]);

      const notesPermission = studentPerms.find(p => p.resource === ResourceType.NOTES);
      expect(notesPermission).toBeDefined();
      expect(notesPermission?.actions).toContain(Action.CREATE);
      expect(notesPermission?.actions).toContain(Action.READ);
      expect(notesPermission?.actions).toContain(Action.UPDATE);
      expect(notesPermission?.actions).toContain(Action.DELETE);
      expect(notesPermission?.conditions).toContainEqual({ type: 'ownership', value: true });
    });

    it('should grant guest minimal public access', () => {
      const guestPerms = DEFAULT_PERMISSIONS[UserRole.GUEST];
      
      expect(guestPerms).toHaveLength(1);
      
      const modulePermission = guestPerms[0];
      expect(modulePermission.resource).toBe(ResourceType.MODULE);
      expect(modulePermission.actions).toEqual([Action.READ]);
      expect(modulePermission.conditions).toContainEqual({ type: 'custom', value: 'public_only' });
    });
  });

  describe('Resource Types', () => {
    it('should define all necessary resource types', () => {
      const expectedResources = ['module', 'quiz', 'notes', 'analytics', 'user', 'system'];
      const actualResources = Object.values(ResourceType);
      
      expect(actualResources).toEqual(expect.arrayContaining(expectedResources));
      expect(actualResources).toHaveLength(expectedResources.length);
    });

    it('should use consistent resource naming', () => {
      Object.values(ResourceType).forEach(resource => {
        expect(resource).toMatch(/^[a-z]+$/); // lowercase only
        expect(resource).not.toContain(' '); // no spaces
        expect(resource).not.toContain('_'); // no underscores
      });
    });
  });

  describe('Actions', () => {
    it('should define all necessary actions', () => {
      const expectedActions = ['create', 'read', 'update', 'delete', 'publish', 'share'];
      const actualActions = Object.values(Action);
      
      expect(actualActions).toEqual(expect.arrayContaining(expectedActions));
      expect(actualActions).toHaveLength(expectedActions.length);
    });

    it('should use consistent action naming', () => {
      Object.values(Action).forEach(action => {
        expect(action).toMatch(/^[a-z]+$/); // lowercase only
        expect(action).not.toContain(' '); // no spaces
        expect(action).not.toContain('_'); // no underscores
      });
    });

    it('should follow CRUD + additional actions pattern', () => {
      expect(Object.values(Action)).toContain('create');
      expect(Object.values(Action)).toContain('read');
      expect(Object.values(Action)).toContain('update');
      expect(Object.values(Action)).toContain('delete');
      // Additional actions
      expect(Object.values(Action)).toContain('publish');
      expect(Object.values(Action)).toContain('share');
    });
  });

  describe('Permission Checking Logic', () => {
    const createPermissionChecker = (user: User | null) => ({
      hasPermission: (resource: ResourceType, action: Action): boolean => {
        if (!user) return false;
        
        // Super admin has all permissions
        if (user.role === UserRole.SUPER_ADMIN) return true;
        
        // Check user permissions
        return user.permissions.some(permission =>
          permission.resource === resource &&
          permission.actions.includes(action)
        );
      },

      hasRole: (role: UserRole): boolean => {
        if (!user) return false;
        
        // Check role hierarchy
        const roleHierarchy: Record<UserRole, number> = {
          [UserRole.SUPER_ADMIN]: 4,
          [UserRole.ADMIN]: 3,
          [UserRole.INSTRUCTOR]: 2,
          [UserRole.STUDENT]: 1,
          [UserRole.GUEST]: 0
        };
        
        return roleHierarchy[user.role] >= roleHierarchy[role];
      }
    });

    describe('Super Admin Permissions', () => {
      const superAdmin = createMockUser(UserRole.SUPER_ADMIN);
      const checker = createPermissionChecker(superAdmin);

      it('should have all permissions regardless of explicit grants', () => {
        Object.values(ResourceType).forEach(resource => {
          Object.values(Action).forEach(action => {
            expect(checker.hasPermission(resource, action)).toBe(true);
          });
        });
      });

      it('should have all roles', () => {
        Object.values(UserRole).forEach(role => {
          expect(checker.hasRole(role)).toBe(true);
        });
      });
    });

    describe('Admin Permissions', () => {
      const admin = createMockUser(UserRole.ADMIN);
      const checker = createPermissionChecker(admin);

      it('should have module management permissions', () => {
        expect(checker.hasPermission(ResourceType.MODULE, Action.CREATE)).toBe(true);
        expect(checker.hasPermission(ResourceType.MODULE, Action.READ)).toBe(true);
        expect(checker.hasPermission(ResourceType.MODULE, Action.UPDATE)).toBe(true);
        expect(checker.hasPermission(ResourceType.MODULE, Action.DELETE)).toBe(true);
        expect(checker.hasPermission(ResourceType.MODULE, Action.PUBLISH)).toBe(true);
      });

      it('should have user management permissions', () => {
        expect(checker.hasPermission(ResourceType.USER, Action.CREATE)).toBe(true);
        expect(checker.hasPermission(ResourceType.USER, Action.READ)).toBe(true);
        expect(checker.hasPermission(ResourceType.USER, Action.UPDATE)).toBe(true);
        expect(checker.hasPermission(ResourceType.USER, Action.DELETE)).toBe(true);
      });

      it('should have analytics read permissions', () => {
        expect(checker.hasPermission(ResourceType.ANALYTICS, Action.READ)).toBe(true);
        expect(checker.hasPermission(ResourceType.ANALYTICS, Action.CREATE)).toBe(false);
      });

      it('should not have system-level permissions', () => {
        expect(checker.hasPermission(ResourceType.SYSTEM, Action.CREATE)).toBe(false);
        expect(checker.hasPermission(ResourceType.SYSTEM, Action.DELETE)).toBe(false);
      });

      it('should have admin and lower roles', () => {
        expect(checker.hasRole(UserRole.ADMIN)).toBe(true);
        expect(checker.hasRole(UserRole.INSTRUCTOR)).toBe(true);
        expect(checker.hasRole(UserRole.STUDENT)).toBe(true);
        expect(checker.hasRole(UserRole.GUEST)).toBe(true);
        expect(checker.hasRole(UserRole.SUPER_ADMIN)).toBe(false);
      });
    });

    describe('Instructor Permissions', () => {
      const instructor = createMockUser(UserRole.INSTRUCTOR);
      const checker = createPermissionChecker(instructor);

      it('should have conditional module permissions', () => {
        expect(checker.hasPermission(ResourceType.MODULE, Action.CREATE)).toBe(true);
        expect(checker.hasPermission(ResourceType.MODULE, Action.READ)).toBe(true);
        expect(checker.hasPermission(ResourceType.MODULE, Action.UPDATE)).toBe(true);
        expect(checker.hasPermission(ResourceType.MODULE, Action.DELETE)).toBe(false); // Not in default perms
        expect(checker.hasPermission(ResourceType.MODULE, Action.PUBLISH)).toBe(false);
      });

      it('should have quiz management permissions', () => {
        expect(checker.hasPermission(ResourceType.QUIZ, Action.CREATE)).toBe(true);
        expect(checker.hasPermission(ResourceType.QUIZ, Action.READ)).toBe(true);
        expect(checker.hasPermission(ResourceType.QUIZ, Action.UPDATE)).toBe(true);
        expect(checker.hasPermission(ResourceType.QUIZ, Action.DELETE)).toBe(true);
      });

      it('should have analytics read permissions', () => {
        expect(checker.hasPermission(ResourceType.ANALYTICS, Action.READ)).toBe(true);
        expect(checker.hasPermission(ResourceType.ANALYTICS, Action.CREATE)).toBe(false);
      });

      it('should not have user management permissions', () => {
        expect(checker.hasPermission(ResourceType.USER, Action.CREATE)).toBe(false);
        expect(checker.hasPermission(ResourceType.USER, Action.DELETE)).toBe(false);
      });

      it('should have instructor and lower roles', () => {
        expect(checker.hasRole(UserRole.INSTRUCTOR)).toBe(true);
        expect(checker.hasRole(UserRole.STUDENT)).toBe(true);
        expect(checker.hasRole(UserRole.GUEST)).toBe(true);
        expect(checker.hasRole(UserRole.ADMIN)).toBe(false);
        expect(checker.hasRole(UserRole.SUPER_ADMIN)).toBe(false);
      });
    });

    describe('Student Permissions', () => {
      const student = createMockUser(UserRole.STUDENT);
      const checker = createPermissionChecker(student);

      it('should have read-only module access', () => {
        expect(checker.hasPermission(ResourceType.MODULE, Action.READ)).toBe(true);
        expect(checker.hasPermission(ResourceType.MODULE, Action.CREATE)).toBe(false);
        expect(checker.hasPermission(ResourceType.MODULE, Action.UPDATE)).toBe(false);
        expect(checker.hasPermission(ResourceType.MODULE, Action.DELETE)).toBe(false);
      });

      it('should have read-only quiz access', () => {
        expect(checker.hasPermission(ResourceType.QUIZ, Action.READ)).toBe(true);
        expect(checker.hasPermission(ResourceType.QUIZ, Action.CREATE)).toBe(false);
        expect(checker.hasPermission(ResourceType.QUIZ, Action.UPDATE)).toBe(false);
        expect(checker.hasPermission(ResourceType.QUIZ, Action.DELETE)).toBe(false);
      });

      it('should have full notes management', () => {
        expect(checker.hasPermission(ResourceType.NOTES, Action.CREATE)).toBe(true);
        expect(checker.hasPermission(ResourceType.NOTES, Action.READ)).toBe(true);
        expect(checker.hasPermission(ResourceType.NOTES, Action.UPDATE)).toBe(true);
        expect(checker.hasPermission(ResourceType.NOTES, Action.DELETE)).toBe(true);
      });

      it('should not have administrative permissions', () => {
        expect(checker.hasPermission(ResourceType.USER, Action.CREATE)).toBe(false);
        expect(checker.hasPermission(ResourceType.ANALYTICS, Action.READ)).toBe(false);
        expect(checker.hasPermission(ResourceType.SYSTEM, Action.READ)).toBe(false);
      });

      it('should have student and guest roles only', () => {
        expect(checker.hasRole(UserRole.STUDENT)).toBe(true);
        expect(checker.hasRole(UserRole.GUEST)).toBe(true);
        expect(checker.hasRole(UserRole.INSTRUCTOR)).toBe(false);
        expect(checker.hasRole(UserRole.ADMIN)).toBe(false);
        expect(checker.hasRole(UserRole.SUPER_ADMIN)).toBe(false);
      });
    });

    describe('Guest Permissions', () => {
      const guest = createMockUser(UserRole.GUEST);
      const checker = createPermissionChecker(guest);

      it('should have limited read-only access', () => {
        expect(checker.hasPermission(ResourceType.MODULE, Action.READ)).toBe(true);
        expect(checker.hasPermission(ResourceType.MODULE, Action.CREATE)).toBe(false);
        expect(checker.hasPermission(ResourceType.MODULE, Action.UPDATE)).toBe(false);
        expect(checker.hasPermission(ResourceType.MODULE, Action.DELETE)).toBe(false);
      });

      it('should not have access to other resources', () => {
        expect(checker.hasPermission(ResourceType.QUIZ, Action.READ)).toBe(false);
        expect(checker.hasPermission(ResourceType.NOTES, Action.READ)).toBe(false);
        expect(checker.hasPermission(ResourceType.USER, Action.READ)).toBe(false);
        expect(checker.hasPermission(ResourceType.ANALYTICS, Action.READ)).toBe(false);
      });

      it('should only have guest role', () => {
        expect(checker.hasRole(UserRole.GUEST)).toBe(true);
        expect(checker.hasRole(UserRole.STUDENT)).toBe(false);
        expect(checker.hasRole(UserRole.INSTRUCTOR)).toBe(false);
        expect(checker.hasRole(UserRole.ADMIN)).toBe(false);
        expect(checker.hasRole(UserRole.SUPER_ADMIN)).toBe(false);
      });
    });

    describe('Null/Undefined User', () => {
      const checker = createPermissionChecker(null);

      it('should deny all permissions for null user', () => {
        Object.values(ResourceType).forEach(resource => {
          Object.values(Action).forEach(action => {
            expect(checker.hasPermission(resource, action)).toBe(false);
          });
        });
      });

      it('should deny all roles for null user', () => {
        Object.values(UserRole).forEach(role => {
          expect(checker.hasRole(role)).toBe(false);
        });
      });
    });
  });

  describe('Permission Conditions', () => {
    it('should support ownership conditions', () => {
      const instructorPerms = DEFAULT_PERMISSIONS[UserRole.INSTRUCTOR];
      const modulePermission = instructorPerms.find(p => p.resource === ResourceType.MODULE);
      
      expect(modulePermission?.conditions).toBeDefined();
      expect(modulePermission?.conditions).toContainEqual({ type: 'ownership', value: true });
    });

    it('should support custom conditions', () => {
      const guestPerms = DEFAULT_PERMISSIONS[UserRole.GUEST];
      const modulePermission = guestPerms[0];
      
      expect(modulePermission.conditions).toBeDefined();
      expect(modulePermission.conditions).toContainEqual({ type: 'custom', value: 'public_only' });
    });

    it('should support multiple condition types', () => {
      const customPermission: Permission = {
        id: 'test-permission',
        resource: ResourceType.MODULE,
        actions: [Action.READ],
        conditions: [
          { type: 'ownership', value: true },
          { type: 'group', value: 'class-a' },
          { type: 'time', value: '9am-5pm' }
        ]
      };

      expect(customPermission.conditions).toHaveLength(3);
      expect(customPermission.conditions?.find(c => c.type === 'ownership')).toBeDefined();
      expect(customPermission.conditions?.find(c => c.type === 'group')).toBeDefined();
      expect(customPermission.conditions?.find(c => c.type === 'time')).toBeDefined();
    });
  });

  describe('Custom Permission Scenarios', () => {
    it('should handle users with additional custom permissions', () => {
      const customPermission: Permission = {
        id: 'custom-perm',
        resource: ResourceType.ANALYTICS,
        actions: [Action.CREATE, Action.UPDATE]
      };

      const studentWithExtras = createMockUser(UserRole.STUDENT, [customPermission]);
      const checker = createPermissionChecker(studentWithExtras);

      // Should have default student permissions
      expect(checker.hasPermission(ResourceType.MODULE, Action.READ)).toBe(true);
      expect(checker.hasPermission(ResourceType.NOTES, Action.CREATE)).toBe(true);

      // Should also have the custom permission
      expect(checker.hasPermission(ResourceType.ANALYTICS, Action.CREATE)).toBe(true);
      expect(checker.hasPermission(ResourceType.ANALYTICS, Action.UPDATE)).toBe(true);
      expect(checker.hasPermission(ResourceType.ANALYTICS, Action.DELETE)).toBe(false);
    });

    it('should handle overlapping permissions correctly', () => {
      const overlappingPermission: Permission = {
        id: 'overlap-perm',
        resource: ResourceType.MODULE,
        actions: [Action.CREATE, Action.DELETE] // Student normally only has READ
      };

      const studentWithOverlap = createMockUser(UserRole.STUDENT, [overlappingPermission]);
      const checker = createPermissionChecker(studentWithOverlap);

      // Should have original READ permission
      expect(checker.hasPermission(ResourceType.MODULE, Action.READ)).toBe(true);
      
      // Should have additional CREATE and DELETE permissions
      expect(checker.hasPermission(ResourceType.MODULE, Action.CREATE)).toBe(true);
      expect(checker.hasPermission(ResourceType.MODULE, Action.DELETE)).toBe(true);
      
      // Should not have UPDATE (not in either permission set)
      expect(checker.hasPermission(ResourceType.MODULE, Action.UPDATE)).toBe(false);
    });
  });

  describe('Permission Edge Cases', () => {
    it('should handle empty permissions array', () => {
      const userWithNoPerms = {
        ...createMockUser(UserRole.STUDENT),
        permissions: []
      };
      const checker = createPermissionChecker(userWithNoPerms);

      // Should deny all permissions except for super admin check
      expect(checker.hasPermission(ResourceType.MODULE, Action.READ)).toBe(false);
      expect(checker.hasPermission(ResourceType.NOTES, Action.CREATE)).toBe(false);
    });

    it('should handle permissions with empty actions array', () => {
      const emptyActionPermission: Permission = {
        id: 'empty-actions',
        resource: ResourceType.MODULE,
        actions: []
      };

      const userWithEmptyActions = createMockUser(UserRole.STUDENT, [emptyActionPermission]);
      const checker = createPermissionChecker(userWithEmptyActions);

      expect(checker.hasPermission(ResourceType.MODULE, Action.READ)).toBe(true); // From default perms
      expect(checker.hasPermission(ResourceType.MODULE, Action.CREATE)).toBe(false); // Not in empty actions
    });

    it('should handle malformed permission objects', () => {
      const malformedPermission = {
        id: 'malformed',
        resource: ResourceType.MODULE,
        // Missing actions array
      } as Permission;

      const userWithMalformed = {
        ...createMockUser(UserRole.STUDENT),
        permissions: [malformedPermission]
      };

      const checker = createPermissionChecker(userWithMalformed);

      // Should not crash and should return false for permission checks on malformed permission
      expect(() => checker.hasPermission(ResourceType.MODULE, Action.CREATE)).not.toThrow();
      expect(checker.hasPermission(ResourceType.MODULE, Action.CREATE)).toBe(false);
    });
  });

  describe('Performance Considerations', () => {
    it('should handle large numbers of permissions efficiently', () => {
      const manyPermissions: Permission[] = [];
      
      // Create 1000 permissions
      for (let i = 0; i < 1000; i++) {
        manyPermissions.push({
          id: `perm-${i}`,
          resource: ResourceType.MODULE,
          actions: [Action.READ]
        });
      }

      const userWithManyPerms = createMockUser(UserRole.STUDENT, manyPermissions);
      const checker = createPermissionChecker(userWithManyPerms);

      const start = performance.now();
      const hasPermission = checker.hasPermission(ResourceType.MODULE, Action.READ);
      const end = performance.now();

      expect(hasPermission).toBe(true);
      expect(end - start).toBeLessThan(10); // Should be very fast
    });

    it('should short-circuit for super admin', () => {
      const superAdmin = createMockUser(UserRole.SUPER_ADMIN, []);
      const checker = createPermissionChecker(superAdmin);

      const start = performance.now();
      const hasPermission = checker.hasPermission(ResourceType.SYSTEM, Action.DELETE);
      const end = performance.now();

      expect(hasPermission).toBe(true);
      expect(end - start).toBeLessThan(5); // Should be very fast due to short-circuit
    });
  });
});