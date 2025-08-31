/**
 * Generic Utility Functions and Type Transformation Tests
 * 
 * Tests generic functions, type utilities, advanced TypeScript features,
 * and complex type transformations with various type parameters.
 */

import {
  Module,
  User,
  Quiz,
  Question,
  UserProgress,
  Permission,
  UserRole,
  ResourceType,
  Action,
  AdaptiveLearningData,
  ConceptMastery,
  Achievement
} from '../index';

describe('Generic Utility Functions and Type Transformations', () => {
  describe('Generic Collection Utilities', () => {
    // Generic utility functions for testing
    function createCollection<T>(items: T[]): T[] {
      return [...items];
    }

    function findByProperty<T, K extends keyof T>(
      items: T[],
      property: K,
      value: T[K]
    ): T | undefined {
      return items.find(item => item[property] === value);
    }

    function filterByProperty<T, K extends keyof T>(
      items: T[],
      property: K,
      value: T[K]
    ): T[] {
      return items.filter(item => item[property] === value);
    }

    function mapProperty<T, K extends keyof T>(
      items: T[],
      property: K
    ): T[K][] {
      return items.map(item => item[property]);
    }

    function groupBy<T, K extends keyof T>(
      items: T[],
      property: K
    ): Map<T[K], T[]> {
      return items.reduce((map, item) => {
        const key = item[property];
        const group = map.get(key) || [];
        group.push(item);
        map.set(key, group);
        return map;
      }, new Map<T[K], T[]>());
    }

    it('should work with Module collections', () => {
      const modules: Module[] = [
        {
          id: 'module-1',
          title: 'Introduction to Psychology',
          description: 'Basic psychology concepts',
          estimatedTime: 60,
          difficulty: 'beginner'
        },
        {
          id: 'module-2',
          title: 'Advanced Psychology',
          description: 'Advanced topics',
          estimatedTime: 120,
          difficulty: 'advanced'
        },
        {
          id: 'module-3',
          title: 'Intermediate Psychology',
          description: 'Intermediate concepts',
          estimatedTime: 90,
          difficulty: 'intermediate'
        }
      ];

      const moduleCollection = createCollection(modules);
      expect(moduleCollection).toHaveLength(3);
      expect(moduleCollection).not.toBe(modules); // Should be a new array

      const foundModule = findByProperty(modules, 'difficulty', 'advanced');
      expect(foundModule).toBeDefined();
      expect(foundModule?.title).toBe('Advanced Psychology');

      const beginnerModules = filterByProperty(modules, 'difficulty', 'beginner');
      expect(beginnerModules).toHaveLength(1);
      expect(beginnerModules[0].title).toBe('Introduction to Psychology');

      const titles = mapProperty(modules, 'title');
      expect(titles).toEqual([
        'Introduction to Psychology',
        'Advanced Psychology',
        'Intermediate Psychology'
      ]);

      const groupedByDifficulty = groupBy(modules, 'difficulty');
      expect(groupedByDifficulty.has('beginner')).toBe(true);
      expect(groupedByDifficulty.get('advanced')).toHaveLength(1);
    });

    it('should work with User collections', () => {
      const users: Partial<User>[] = [
        {
          id: 'user-1',
          email: 'admin@example.com',
          username: 'admin',
          role: UserRole.ADMIN,
          isActive: true
        },
        {
          id: 'user-2',
          email: 'instructor@example.com',
          username: 'instructor',
          role: UserRole.INSTRUCTOR,
          isActive: true
        },
        {
          id: 'user-3',
          email: 'student@example.com',
          username: 'student',
          role: UserRole.STUDENT,
          isActive: false
        }
      ];

      const activeUsers = filterByProperty(users, 'isActive', true);
      expect(activeUsers).toHaveLength(2);

      const usernames = mapProperty(users, 'username');
      expect(usernames).toEqual(['admin', 'instructor', 'student']);

      const groupedByRole = groupBy(users, 'role');
      expect(groupedByRole.has(UserRole.ADMIN)).toBe(true);
      expect(groupedByRole.get(UserRole.STUDENT)).toHaveLength(1);
    });

    it('should handle complex property access', () => {
      interface ComplexObject {
        id: string;
        metadata: {
          created: Date;
          tags: string[];
          scores: Record<string, number>;
        };
        settings: {
          enabled: boolean;
          priority: number;
        };
      }

      const complexObjects: ComplexObject[] = [
        {
          id: 'obj-1',
          metadata: {
            created: new Date('2024-01-01'),
            tags: ['tag1', 'tag2'],
            scores: { math: 85, science: 92 }
          },
          settings: { enabled: true, priority: 1 }
        },
        {
          id: 'obj-2',
          metadata: {
            created: new Date('2024-02-01'),
            tags: ['tag3'],
            scores: { math: 78, science: 88 }
          },
          settings: { enabled: false, priority: 2 }
        }
      ];

      const enabledObjects = filterByProperty(complexObjects, 'settings', {
        enabled: true,
        priority: 1
      });
      // Note: This will likely fail due to object reference comparison
      // but demonstrates the generic constraint system
      expect(enabledObjects).toHaveLength(0); // Objects don't match by reference

      const ids = mapProperty(complexObjects, 'id');
      expect(ids).toEqual(['obj-1', 'obj-2']);
    });
  });

  describe('Generic Transformation Utilities', () => {
    function transform<T, U>(item: T, transformer: (item: T) => U): U {
      return transformer(item);
    }

    function batchTransform<T, U>(
      items: T[],
      transformer: (item: T, index: number) => U
    ): U[] {
      return items.map(transformer);
    }

    function conditionalTransform<T, U>(
      item: T,
      condition: (item: T) => boolean,
      transformer: (item: T) => U,
      fallback: U
    ): U {
      return condition(item) ? transformer(item) : fallback;
    }

    it('should transform Module to summary format', () => {
      const module: Module = {
        id: 'module-1',
        title: 'Psychology Basics',
        description: 'An introduction to psychology',
        estimatedTime: 120,
        difficulty: 'beginner',
        category: 'psychology',
        tags: ['psychology', 'basics', 'introduction']
      };

      interface ModuleSummary {
        id: string;
        title: string;
        duration: string;
        level: string;
        topics: string[];
      }

      const summary = transform(module, (m): ModuleSummary => ({
        id: m.id,
        title: m.title,
        duration: `${m.estimatedTime} minutes`,
        level: m.difficulty,
        topics: m.tags || []
      }));

      expect(summary.id).toBe('module-1');
      expect(summary.duration).toBe('120 minutes');
      expect(summary.level).toBe('beginner');
      expect(summary.topics).toEqual(['psychology', 'basics', 'introduction']);
    });

    it('should batch transform quiz questions', () => {
      const questions: Question[] = [
        {
          id: 'q1',
          question: 'What is psychology?',
          type: 'multiple-choice',
          options: [
            { id: 'a', text: 'Study of mind', isCorrect: true },
            { id: 'b', text: 'Study of body', isCorrect: false }
          ],
          correctAnswer: 0,
          explanation: 'Psychology is the study of mind and behavior'
        },
        {
          id: 'q2',
          question: 'True or False: Jung founded analytical psychology',
          type: 'true-false',
          options: [
            { id: 'true', text: 'True', isCorrect: true },
            { id: 'false', text: 'False', isCorrect: false }
          ],
          correctAnswer: 0,
          explanation: 'Jung indeed founded analytical psychology'
        }
      ];

      interface QuestionPreview {
        id: string;
        text: string;
        type: string;
        optionCount: number;
        hasExplanation: boolean;
        index: number;
      }

      const previews = batchTransform(questions, (q, index): QuestionPreview => ({
        id: q.id,
        text: q.question,
        type: q.type,
        optionCount: q.options.length,
        hasExplanation: Boolean(q.explanation),
        index: index + 1
      }));

      expect(previews).toHaveLength(2);
      expect(previews[0].index).toBe(1);
      expect(previews[0].optionCount).toBe(2);
      expect(previews[1].type).toBe('true-false');
    });

    it('should conditionally transform user data', () => {
      const users: Partial<User>[] = [
        {
          id: 'user-1',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
          isActive: true
        },
        {
          id: 'user-2',
          email: 'inactive@example.com',
          role: UserRole.STUDENT,
          isActive: false
        }
      ];

      interface UserDisplay {
        id: string;
        email: string;
        status: 'Active' | 'Inactive';
        canEdit: boolean;
      }

      const defaultDisplay: UserDisplay = {
        id: '',
        email: '',
        status: 'Inactive',
        canEdit: false
      };

      const displays = users.map(user => 
        conditionalTransform(
          user,
          (u) => u.isActive === true,
          (u): UserDisplay => ({
            id: u.id || '',
            email: u.email || '',
            status: 'Active',
            canEdit: u.role === UserRole.ADMIN
          }),
          defaultDisplay
        )
      );

      expect(displays[0].status).toBe('Active');
      expect(displays[0].canEdit).toBe(true);
      expect(displays[1].status).toBe('Inactive');
      expect(displays[1].canEdit).toBe(false);
    });
  });

  describe('Advanced Generic Constraints', () => {
    // Constraint: T must have an id property
    function findById<T extends { id: string }>(items: T[], id: string): T | undefined {
      return items.find(item => item.id === id);
    }

    // Constraint: T must have specific properties
    function sortByCreationDate<T extends { createdAt: Date }>(items: T[]): T[] {
      return [...items].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    // Constraint: T must be a Record with string keys
    function getKeys<T extends Record<string, any>>(obj: T): (keyof T)[] {
      return Object.keys(obj);
    }

    // Constraint: T must extend base interface
    interface Timestamped {
      createdAt: Date;
      updatedAt: Date;
    }

    function updateTimestamp<T extends Timestamped>(item: T): T {
      return {
        ...item,
        updatedAt: new Date()
      };
    }

    it('should work with id constraint', () => {
      const modules: Module[] = [
        {
          id: 'module-1',
          title: 'Module 1',
          description: 'First module',
          estimatedTime: 60,
          difficulty: 'beginner'
        },
        {
          id: 'module-2',
          title: 'Module 2',
          description: 'Second module',
          estimatedTime: 90,
          difficulty: 'intermediate'
        }
      ];

      const permissions: Permission[] = [
        {
          id: 'perm-1',
          resource: ResourceType.MODULE,
          actions: [Action.READ]
        },
        {
          id: 'perm-2',
          resource: ResourceType.QUIZ,
          actions: [Action.CREATE]
        }
      ];

      const foundModule = findById(modules, 'module-1');
      expect(foundModule).toBeDefined();
      expect(foundModule?.title).toBe('Module 1');

      const foundPermission = findById(permissions, 'perm-2');
      expect(foundPermission).toBeDefined();
      expect(foundPermission?.resource).toBe(ResourceType.QUIZ);
    });

    it('should work with creation date constraint', () => {
      interface TimestampedModule extends Module {
        createdAt: Date;
        updatedAt: Date;
      }

      const timestampedModules: TimestampedModule[] = [
        {
          id: 'module-1',
          title: 'Module 1',
          description: 'First module',
          estimatedTime: 60,
          difficulty: 'beginner',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        },
        {
          id: 'module-2',
          title: 'Module 2',
          description: 'Second module',
          estimatedTime: 90,
          difficulty: 'intermediate',
          createdAt: new Date('2024-02-01'),
          updatedAt: new Date('2024-02-01')
        }
      ];

      const sorted = sortByCreationDate(timestampedModules);
      expect(sorted[0].id).toBe('module-2'); // Most recent first
      expect(sorted[1].id).toBe('module-1');
    });

    it('should work with Record constraint', () => {
      const userProgress: UserProgress = {
        userId: 'user-1',
        completedModules: ['module-1'],
        quizScores: {
          'quiz-1': 85,
          'quiz-2': 92,
          'quiz-3': 78
        },
        totalTime: 3600,
        lastAccessed: Date.now(),
        notes: []
      };

      const scoreKeys = getKeys(userProgress.quizScores);
      expect(scoreKeys).toEqual(['quiz-1', 'quiz-2', 'quiz-3']);

      const adaptiveData: Record<string, ConceptMastery> = {
        'jung-basics': {
          concept: 'jung-basics',
          level: 0.8,
          lastReviewed: new Date(),
          reviewCount: 5,
          forgettingCurve: 0.3
        },
        'archetypes': {
          concept: 'archetypes',
          level: 0.6,
          lastReviewed: new Date(),
          reviewCount: 3,
          forgettingCurve: 0.5
        }
      };

      const conceptKeys = getKeys(adaptiveData);
      expect(conceptKeys).toContain('jung-basics');
      expect(conceptKeys).toContain('archetypes');
    });

    it('should work with timestamp update constraint', async () => {
      const timestampedAchievement: Achievement & Timestamped = {
        id: 'achieve-1',
        title: 'First Achievement',
        description: 'Your first achievement',
        icon: '🏆',
        category: 'progress',
        points: 100,
        unlockedAt: new Date(),
        rarity: 'common',
        requirements: [],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      };

      const originalUpdatedAt = timestampedAchievement.updatedAt.getTime();
      
      // Wait a tiny bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 1));
      
      const updated = updateTimestamp(timestampedAchievement);
      expect(updated.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt);
      expect(updated.id).toBe('achieve-1');
    });
  });

  describe('Conditional Types and Mapped Types', () => {
    // Conditional type: Extract keys of specific type
    type KeysOfType<T, U> = {
      [K in keyof T]: T[K] extends U ? K : never;
    }[keyof T];

    // Mapped type: Make specific properties optional
    type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

    // Mapped type: Extract non-null properties
    type NonNullable<T> = {
      [K in keyof T]: T[K] extends null | undefined ? never : T[K];
    };

    it('should extract string keys from Module', () => {
      type ModuleStringKeys = KeysOfType<Module, string>;
      
      // These should be valid string keys
      const validKeys: ModuleStringKeys[] = ['id', 'title', 'description'];
      expect(validKeys).toContain('id');
      expect(validKeys).toContain('title');
      expect(validKeys).toContain('description');
    });

    it('should create partially optional types', () => {
      type PartialModule = PartialBy<Module, 'category' | 'tags' | 'version'>;
      
      const partialModule: PartialModule = {
        id: 'test',
        title: 'Test Module',
        description: 'Test description',
        estimatedTime: 60,
        difficulty: 'beginner'
        // category, tags, and version are now optional
      };

      expect(partialModule.id).toBe('test');
      expect(partialModule.category).toBeUndefined();
    });

    it('should handle union type discrimination', () => {
      type ProcessingState = 
        | { status: 'idle' }
        | { status: 'loading'; progress: number }
        | { status: 'success'; data: any }
        | { status: 'error'; error: string };

      function handleState(state: ProcessingState): string {
        switch (state.status) {
          case 'idle':
            return 'Ready to start';
          case 'loading':
            return `Loading: ${state.progress}%`;
          case 'success':
            return `Success: ${JSON.stringify(state.data)}`;
          case 'error':
            return `Error: ${state.error}`;
          default:
            const _exhaustive: never = state;
            return 'Unknown state';
        }
      }

      expect(handleState({ status: 'idle' })).toBe('Ready to start');
      expect(handleState({ status: 'loading', progress: 50 })).toBe('Loading: 50%');
      expect(handleState({ status: 'success', data: { result: 'ok' } }))
        .toContain('ok');
      expect(handleState({ status: 'error', error: 'Network failed' }))
        .toContain('Network failed');
    });

    it('should work with recursive types', () => {
      interface TreeNode<T> {
        value: T;
        children: TreeNode<T>[];
      }

      function traverseTree<T>(node: TreeNode<T>, visitor: (value: T) => void): void {
        visitor(node.value);
        node.children.forEach(child => traverseTree(child, visitor));
      }

      function countNodes<T>(node: TreeNode<T>): number {
        return 1 + node.children.reduce((count, child) => count + countNodes(child), 0);
      }

      const moduleTree: TreeNode<string> = {
        value: 'Psychology',
        children: [
          {
            value: 'Analytical Psychology',
            children: [
              { value: 'Jung\'s Theory', children: [] },
              { value: 'Archetypes', children: [] }
            ]
          },
          {
            value: 'Cognitive Psychology',
            children: []
          }
        ]
      };

      const values: string[] = [];
      traverseTree(moduleTree, value => values.push(value));
      
      expect(values).toContain('Psychology');
      expect(values).toContain('Jung\'s Theory');
      expect(values).toHaveLength(5);
      
      const nodeCount = countNodes(moduleTree);
      expect(nodeCount).toBe(5);
    });
  });
});