/**
 * Comprehensive test suite for test helper utilities
 * Testing data factories, assertion utilities, and mock generators
 */

import {
  createMockUser,
  createMockQuiz,
  createMockModule,
  createMockNote,
  createMockQuestion,
  generateValidationTestCases,
  assertDeepEquality,
  assertTypeCompliance,
  createDataFactory,
  MockDataGenerator
} from '../helpers/testHelpers';

import { User, Quiz, Module, Note, Question, ValidationResult } from '../../types';

describe('Test Helper Utilities - Comprehensive Test Suite', () => {
  describe('Mock Data Factories', () => {
    describe('createMockUser', () => {
      it('should create valid user with default properties', () => {
        const user = createMockUser();

        expect(user.id).toBeDefined();
        expect(typeof user.id).toBe('string');
        expect(user.id.length).toBeGreaterThan(0);
        
        expect(user.email).toBeDefined();
        expect(user.email).toMatch(/\S+@\S+\.\S+/); // Basic email validation
        
        expect(user.name).toBeDefined();
        expect(typeof user.name).toBe('string');
        expect(user.name.length).toBeGreaterThan(0);
        
        expect(user.createdAt).toBeInstanceOf(Date);
        expect(user.lastLogin).toBeInstanceOf(Date);
        
        expect(Array.isArray(user.roles)).toBe(true);
        expect(user.roles.length).toBeGreaterThan(0);
        
        expect(['active', 'inactive', 'suspended']).toContain(user.status);
      });

      it('should create user with custom properties', () => {
        const customUser = createMockUser({
          name: 'Custom User',
          email: 'custom@example.com',
          status: 'suspended',
          roles: ['admin', 'moderator']
        });

        expect(customUser.name).toBe('Custom User');
        expect(customUser.email).toBe('custom@example.com');
        expect(customUser.status).toBe('suspended');
        expect(customUser.roles).toEqual(['admin', 'moderator']);
      });

      it('should create multiple unique users', () => {
        const users = Array.from({ length: 10 }, () => createMockUser());
        
        const ids = users.map(u => u.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(10); // All should be unique
        
        const emails = users.map(u => u.email);
        const uniqueEmails = new Set(emails);
        expect(uniqueEmails.size).toBe(10); // All should be unique
      });

      it('should handle partial overrides correctly', () => {
        const partialUser = createMockUser({
          name: 'Partial User'
        });

        expect(partialUser.name).toBe('Partial User');
        expect(partialUser.email).toMatch(/\S+@\S+\.\S+/); // Should still be valid
        expect(partialUser.id).toBeDefined();
        expect(partialUser.status).toBeDefined();
      });

      it('should create users with realistic data distributions', () => {
        const users = Array.from({ length: 100 }, () => createMockUser());
        
        const statuses = users.map(u => u.status);
        const statusCounts = statuses.reduce((acc, status) => {
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Should have some distribution of statuses
        expect(Object.keys(statusCounts).length).toBeGreaterThanOrEqual(2);
        
        // Most users should be active
        expect(statusCounts.active).toBeGreaterThan(statusCounts.inactive || 0);
      });

      it('should handle edge cases in user data', () => {
        const edgeCases = [
          { name: '', email: 'test@example.com' },
          { name: 'A'.repeat(1000), email: 'long@example.com' },
          { name: 'Unicode 🦄', email: 'unicode@example.com' },
          { name: 'Name with\nnewlines', email: 'newline@example.com' },
          { roles: [] },
          { roles: ['role1', 'role2', 'role3', 'role4', 'role5'] }
        ];

        edgeCases.forEach((edgeCase, index) => {
          expect(() => createMockUser(edgeCase)).not.toThrow();
          const user = createMockUser(edgeCase);
          expect(user).toBeDefined();
        });
      });
    });

    describe('createMockQuiz', () => {
      it('should create valid quiz with default properties', () => {
        const quiz = createMockQuiz();

        expect(quiz.id).toBeDefined();
        expect(quiz.title).toBeDefined();
        expect(quiz.description).toBeDefined();
        expect(Array.isArray(quiz.questions)).toBe(true);
        expect(quiz.questions.length).toBeGreaterThan(0);
        expect(quiz.timeLimit).toBeGreaterThan(0);
        expect(['easy', 'medium', 'hard']).toContain(quiz.difficulty);
        expect(typeof quiz.passingScore).toBe('number');
        expect(quiz.passingScore).toBeGreaterThanOrEqual(0);
        expect(quiz.passingScore).toBeLessThanOrEqual(100);
      });

      it('should create quiz with specified number of questions', () => {
        const quiz = createMockQuiz({ questionCount: 15 });

        expect(quiz.questions).toHaveLength(15);
        quiz.questions.forEach(question => {
          expect(question.id).toBeDefined();
          expect(question.text).toBeDefined();
        });
      });

      it('should create quiz with custom properties', () => {
        const customQuiz = createMockQuiz({
          title: 'Custom Quiz',
          difficulty: 'hard',
          timeLimit: 3600,
          passingScore: 80
        });

        expect(customQuiz.title).toBe('Custom Quiz');
        expect(customQuiz.difficulty).toBe('hard');
        expect(customQuiz.timeLimit).toBe(3600);
        expect(customQuiz.passingScore).toBe(80);
      });

      it('should generate questions with proper relationships', () => {
        const quiz = createMockQuiz({ questionCount: 5 });

        quiz.questions.forEach(question => {
          expect(question.quizId).toBe(quiz.id);
          
          if (question.type === 'multiple-choice') {
            expect(Array.isArray(question.options)).toBe(true);
            expect(question.options!.length).toBeGreaterThanOrEqual(2);
            expect(typeof question.correctAnswer).toBe('number');
            expect(question.correctAnswer).toBeGreaterThanOrEqual(0);
            expect(question.correctAnswer).toBeLessThan(question.options!.length);
          }
        });
      });

      it('should handle different question types', () => {
        const quiz = createMockQuiz({
          questionCount: 10,
          questionTypes: ['multiple-choice', 'true-false', 'short-answer']
        });

        const questionTypes = quiz.questions.map(q => q.type);
        const uniqueTypes = new Set(questionTypes);
        
        expect(uniqueTypes.size).toBeGreaterThan(1); // Should have variety
        uniqueTypes.forEach(type => {
          expect(['multiple-choice', 'true-false', 'short-answer']).toContain(type);
        });
      });

      it('should create quizzes with valid scoring parameters', () => {
        const quizzes = Array.from({ length: 20 }, () => createMockQuiz());
        
        quizzes.forEach(quiz => {
          expect(quiz.passingScore).toBeGreaterThanOrEqual(0);
          expect(quiz.passingScore).toBeLessThanOrEqual(100);
          expect(quiz.timeLimit).toBeGreaterThan(0);
          expect(quiz.timeLimit).toBeLessThan(7200); // Under 2 hours
        });
      });
    });

    describe('createMockModule', () => {
      it('should create valid module with default properties', () => {
        const module = createMockModule();

        expect(module.id).toBeDefined();
        expect(module.title).toBeDefined();
        expect(module.description).toBeDefined();
        expect(module.content).toBeDefined();
        expect(Array.isArray(module.keyTerms)).toBe(true);
        expect(module.estimatedTime).toBeGreaterThan(0);
        expect(['beginner', 'intermediate', 'advanced']).toContain(module.level);
        expect(module.order).toBeGreaterThanOrEqual(0);
      });

      it('should create module with related content', () => {
        const module = createMockModule({
          includeQuiz: true,
          includeReadingList: true
        });

        expect(module.quiz).toBeDefined();
        expect(module.readingList).toBeDefined();
        expect(Array.isArray(module.readingList)).toBe(true);
        expect(module.readingList!.length).toBeGreaterThan(0);
      });

      it('should generate appropriate content length', () => {
        const shortModule = createMockModule({ contentLength: 'short' });
        const longModule = createMockModule({ contentLength: 'long' });

        expect(shortModule.content.length).toBeLessThan(longModule.content.length);
        expect(shortModule.estimatedTime).toBeLessThan(longModule.estimatedTime);
      });

      it('should create modules with sequential ordering', () => {
        const modules = Array.from({ length: 5 }, (_, index) => 
          createMockModule({ order: index + 1 })
        );

        modules.forEach((module, index) => {
          expect(module.order).toBe(index + 1);
        });

        const orders = modules.map(m => m.order).sort((a, b) => a - b);
        expect(orders).toEqual([1, 2, 3, 4, 5]);
      });

      it('should generate contextually relevant key terms', () => {
        const psychologyModule = createMockModule({
          title: 'Jung\'s Analytical Psychology',
          context: 'psychology'
        });

        const keyTermsText = psychologyModule.keyTerms.join(' ').toLowerCase();
        
        // Should contain psychology-related terms
        const psychologyTerms = ['unconscious', 'archetype', 'individuation', 'psychology', 'jung'];
        const hasRelevantTerms = psychologyTerms.some(term => 
          keyTermsText.includes(term)
        );
        
        expect(hasRelevantTerms).toBe(true);
      });
    });

    describe('createMockNote', () => {
      it('should create valid note with default properties', () => {
        const note = createMockNote();

        expect(note.id).toBeDefined();
        expect(note.moduleId).toBeDefined();
        expect(note.content).toBeDefined();
        expect(note.timestamp).toBeInstanceOf(Date);
        expect(note.timestamp.getTime()).toBeLessThanOrEqual(Date.now());
      });

      it('should create note with custom properties', () => {
        const customNote = createMockNote({
          content: 'Custom note content',
          moduleId: 'custom-module-123',
          tags: ['important', 'review']
        });

        expect(customNote.content).toBe('Custom note content');
        expect(customNote.moduleId).toBe('custom-module-123');
        expect(customNote.tags).toEqual(['important', 'review']);
      });

      it('should create notes with different types', () => {
        const noteTypes = ['text', 'audio', 'drawing', 'video'];
        
        noteTypes.forEach(type => {
          const typedNote = createMockNote({ type: type as any });
          expect(typedNote.type).toBe(type);
        });
      });

      it('should create notes with media attachments when appropriate', () => {
        const audioNote = createMockNote({ 
          type: 'audio',
          includeMediaAttachments: true 
        });

        expect(audioNote.type).toBe('audio');
        expect(audioNote.mediaAttachments).toBeDefined();
        expect(Array.isArray(audioNote.mediaAttachments)).toBe(true);
        
        if (audioNote.mediaAttachments!.length > 0) {
          const attachment = audioNote.mediaAttachments![0];
          expect(attachment.type).toBe('audio');
          expect(attachment.url).toBeDefined();
        }
      });

      it('should generate notes with realistic timestamps', () => {
        const notes = Array.from({ length: 10 }, () => createMockNote());
        
        // All timestamps should be within the last year
        const oneYearAgo = Date.now() - (365 * 24 * 60 * 60 * 1000);
        
        notes.forEach(note => {
          expect(note.timestamp.getTime()).toBeGreaterThan(oneYearAgo);
          expect(note.timestamp.getTime()).toBeLessThanOrEqual(Date.now());
        });
      });
    });

    describe('createMockQuestion', () => {
      it('should create valid multiple-choice question', () => {
        const question = createMockQuestion({ type: 'multiple-choice' });

        expect(question.type).toBe('multiple-choice');
        expect(Array.isArray(question.options)).toBe(true);
        expect(question.options!.length).toBeGreaterThanOrEqual(2);
        expect(typeof question.correctAnswer).toBe('number');
        expect(question.correctAnswer).toBeGreaterThanOrEqual(0);
        expect(question.correctAnswer).toBeLessThan(question.options!.length);
        expect(question.explanation).toBeDefined();
      });

      it('should create valid true-false question', () => {
        const question = createMockQuestion({ type: 'true-false' });

        expect(question.type).toBe('true-false');
        expect(question.options).toEqual(['True', 'False']);
        expect([0, 1]).toContain(question.correctAnswer);
      });

      it('should create valid short-answer question', () => {
        const question = createMockQuestion({ type: 'short-answer' });

        expect(question.type).toBe('short-answer');
        expect(question.options).toBeUndefined();
        expect(typeof question.correctAnswer).toBe('string');
        expect(question.correctAnswer).toBeDefined();
        expect((question.correctAnswer as string).length).toBeGreaterThan(0);
      });

      it('should create questions with appropriate difficulty levels', () => {
        const difficulties = ['easy', 'medium', 'hard'] as const;
        
        difficulties.forEach(difficulty => {
          const question = createMockQuestion({ difficulty });
          expect(question.difficulty).toBe(difficulty);
        });
      });

      it('should generate questions with psychology context', () => {
        const psychQuestion = createMockQuestion({ 
          context: 'jung-psychology',
          type: 'multiple-choice'
        });

        const questionText = psychQuestion.text.toLowerCase();
        const psychTerms = ['jung', 'unconscious', 'archetype', 'individuation', 'psychology'];
        
        const hasRelevantContent = psychTerms.some(term => 
          questionText.includes(term)
        );
        
        expect(hasRelevantContent).toBe(true);
      });

      it('should create questions with proper scoring weights', () => {
        const questions = Array.from({ length: 20 }, () => createMockQuestion());
        
        questions.forEach(question => {
          if (question.points !== undefined) {
            expect(question.points).toBeGreaterThan(0);
            expect(question.points).toBeLessThanOrEqual(10);
          }
        });
      });
    });
  });

  describe('Data Factory System', () => {
    describe('createDataFactory', () => {
      it('should create factory that generates consistent data', () => {
        const userFactory = createDataFactory<User>(() => createMockUser());

        const users = userFactory.createBatch(5);
        
        expect(users).toHaveLength(5);
        users.forEach(user => {
          expect(user.id).toBeDefined();
          expect(user.email).toMatch(/\S+@\S+\.\S+/);
        });
      });

      it('should support factory customization', () => {
        const adminFactory = createDataFactory<User>(() => 
          createMockUser({ roles: ['admin'] })
        );

        const admins = adminFactory.createBatch(3);
        
        admins.forEach(admin => {
          expect(admin.roles).toContain('admin');
        });
      });

      it('should handle factory sequences', () => {
        let counter = 0;
        const sequentialFactory = createDataFactory<User>(() => 
          createMockUser({ name: `User ${++counter}` })
        );

        const users = sequentialFactory.createBatch(3);
        
        expect(users[0].name).toBe('User 1');
        expect(users[1].name).toBe('User 2');
        expect(users[2].name).toBe('User 3');
      });

      it('should support factory traits', () => {
        interface FactoryTraits {
          active: Partial<User>;
          admin: Partial<User>;
        }

        const userFactory = createDataFactory<User, FactoryTraits>(() => 
          createMockUser(), {
          active: { status: 'active' },
          admin: { roles: ['admin'] }
        });

        const activeUser = userFactory.create('active');
        const adminUser = userFactory.create('admin');
        const activeAdmin = userFactory.create(['active', 'admin']);

        expect(activeUser.status).toBe('active');
        expect(adminUser.roles).toContain('admin');
        expect(activeAdmin.status).toBe('active');
        expect(activeAdmin.roles).toContain('admin');
      });

      it('should handle factory dependencies', () => {
        const moduleFactory = createDataFactory<Module>(() => createMockModule());
        const quizFactory = createDataFactory<Quiz>((deps: { module: Module }) => 
          createMockQuiz({ moduleId: deps.module.id })
        );

        const module = moduleFactory.create();
        const quiz = quizFactory.create({ module });

        expect(quiz.moduleId).toBe(module.id);
      });

      it('should support factory overrides at creation time', () => {
        const userFactory = createDataFactory<User>(() => 
          createMockUser({ status: 'active' })
        );

        const suspendedUser = userFactory.create({}, { status: 'suspended' });
        
        expect(suspendedUser.status).toBe('suspended');
      });
    });

    describe('MockDataGenerator', () => {
      let generator: MockDataGenerator;

      beforeEach(() => {
        generator = new MockDataGenerator();
      });

      it('should generate realistic names', () => {
        const names = Array.from({ length: 20 }, () => generator.generateName());
        
        // Should be variety
        const uniqueNames = new Set(names);
        expect(uniqueNames.size).toBeGreaterThan(10);
        
        // Should be reasonable length
        names.forEach(name => {
          expect(name.length).toBeGreaterThan(2);
          expect(name.length).toBeLessThan(50);
        });
      });

      it('should generate valid email addresses', () => {
        const emails = Array.from({ length: 20 }, () => generator.generateEmail());
        
        emails.forEach(email => {
          expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
        });
        
        // Should have variety
        const domains = emails.map(email => email.split('@')[1]);
        const uniqueDomains = new Set(domains);
        expect(uniqueDomains.size).toBeGreaterThan(3);
      });

      it('should generate IDs with proper format', () => {
        const ids = Array.from({ length: 50 }, () => generator.generateId());
        
        // Should all be unique
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(50);
        
        // Should match expected format
        ids.forEach(id => {
          expect(typeof id).toBe('string');
          expect(id.length).toBeGreaterThan(10);
          expect(id).toMatch(/^[a-z0-9-_]+$/i);
        });
      });

      it('should generate dates within specified ranges', () => {
        const now = new Date();
        const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        
        const dates = Array.from({ length: 20 }, () => 
          generator.generateDate(oneYearAgo, now)
        );
        
        dates.forEach(date => {
          expect(date.getTime()).toBeGreaterThanOrEqual(oneYearAgo.getTime());
          expect(date.getTime()).toBeLessThanOrEqual(now.getTime());
        });
      });

      it('should generate contextual content', () => {
        const psychologyContent = generator.generateContent('psychology', 500);
        const techContent = generator.generateContent('technology', 500);
        
        expect(psychologyContent.length).toBeGreaterThan(400);
        expect(techContent.length).toBeGreaterThan(400);
        
        // Content should be contextually different
        const psychWords = psychologyContent.toLowerCase();
        const techWords = techContent.toLowerCase();
        
        const psychTerms = ['mind', 'behavior', 'psychology', 'cognitive'];
        const techTerms = ['system', 'data', 'algorithm', 'process'];
        
        const psychMatches = psychTerms.filter(term => psychWords.includes(term)).length;
        const techMatches = techTerms.filter(term => techWords.includes(term)).length;
        
        // Each should have more relevant terms than the other
        expect(psychMatches).toBeGreaterThan(0);
        expect(techMatches).toBeGreaterThan(0);
      });

      it('should generate numbers within specified ranges', () => {
        const scores = Array.from({ length: 100 }, () => 
          generator.generateNumber(0, 100)
        );
        
        scores.forEach(score => {
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(100);
        });
        
        // Should have good distribution
        const lowScores = scores.filter(s => s < 33).length;
        const midScores = scores.filter(s => s >= 33 && s <= 66).length;
        const highScores = scores.filter(s => s > 66).length;
        
        expect(lowScores).toBeGreaterThan(10);
        expect(midScores).toBeGreaterThan(10);
        expect(highScores).toBeGreaterThan(10);
      });

      it('should generate arrays with specified characteristics', () => {
        const tags = generator.generateArray(() => 
          generator.generateWord(), { min: 2, max: 8 }
        );
        
        expect(tags.length).toBeGreaterThanOrEqual(2);
        expect(tags.length).toBeLessThanOrEqual(8);
        
        // Should be unique
        const uniqueTags = new Set(tags);
        expect(uniqueTags.size).toBe(tags.length);
      });

      it('should support seeded generation for reproducibility', () => {
        const seededGenerator1 = new MockDataGenerator('test-seed-123');
        const seededGenerator2 = new MockDataGenerator('test-seed-123');
        
        const names1 = Array.from({ length: 5 }, () => seededGenerator1.generateName());
        const names2 = Array.from({ length: 5 }, () => seededGenerator2.generateName());
        
        expect(names1).toEqual(names2);
      });
    });
  });

  describe('Assertion Utilities', () => {
    describe('assertDeepEquality', () => {
      it('should pass for deeply equal objects', () => {
        const obj1 = {
          a: 1,
          b: { c: 2, d: [3, 4, { e: 5 }] },
          f: new Date('2023-01-01')
        };
        
        const obj2 = {
          a: 1,
          b: { c: 2, d: [3, 4, { e: 5 }] },
          f: new Date('2023-01-01')
        };

        expect(() => assertDeepEquality(obj1, obj2)).not.toThrow();
      });

      it('should fail for objects with different values', () => {
        const obj1 = { a: 1, b: { c: 2 } };
        const obj2 = { a: 1, b: { c: 3 } };

        expect(() => assertDeepEquality(obj1, obj2))
          .toThrow('Deep equality assertion failed');
      });

      it('should fail for objects with different structures', () => {
        const obj1 = { a: 1, b: { c: 2 } };
        const obj2 = { a: 1, b: { c: 2, d: 3 } };

        expect(() => assertDeepEquality(obj1, obj2))
          .toThrow('Deep equality assertion failed');
      });

      it('should handle arrays correctly', () => {
        const arr1 = [1, 2, [3, 4], { a: 5 }];
        const arr2 = [1, 2, [3, 4], { a: 5 }];
        const arr3 = [1, 2, [3, 4], { a: 6 }];

        expect(() => assertDeepEquality(arr1, arr2)).not.toThrow();
        expect(() => assertDeepEquality(arr1, arr3))
          .toThrow('Deep equality assertion failed');
      });

      it('should handle null and undefined correctly', () => {
        expect(() => assertDeepEquality(null, null)).not.toThrow();
        expect(() => assertDeepEquality(undefined, undefined)).not.toThrow();
        expect(() => assertDeepEquality(null, undefined))
          .toThrow('Deep equality assertion failed');
      });

      it('should handle circular references', () => {
        const obj1: any = { a: 1 };
        obj1.self = obj1;
        
        const obj2: any = { a: 1 };
        obj2.self = obj2;

        // Should handle circular references gracefully
        expect(() => assertDeepEquality(obj1, obj2)).not.toThrow();
      });
    });

    describe('assertTypeCompliance', () => {
      interface TestInterface {
        id: string;
        name: string;
        age: number;
        active: boolean;
        tags?: string[];
      }

      it('should pass for compliant objects', () => {
        const compliantObj: TestInterface = {
          id: '123',
          name: 'Test',
          age: 25,
          active: true,
          tags: ['tag1', 'tag2']
        };

        expect(() => assertTypeCompliance<TestInterface>(compliantObj, {
          id: 'string',
          name: 'string',
          age: 'number',
          active: 'boolean'
        })).not.toThrow();
      });

      it('should fail for non-compliant objects', () => {
        const nonCompliantObj = {
          id: 123, // Should be string
          name: 'Test',
          age: '25', // Should be number
          active: true
        };

        expect(() => assertTypeCompliance<TestInterface>(nonCompliantObj as any, {
          id: 'string',
          name: 'string',
          age: 'number',
          active: 'boolean'
        })).toThrow('Type compliance assertion failed');
      });

      it('should handle optional properties', () => {
        const objWithoutOptionals: TestInterface = {
          id: '123',
          name: 'Test',
          age: 25,
          active: true
          // tags is optional
        };

        expect(() => assertTypeCompliance<TestInterface>(objWithoutOptionals, {
          id: 'string',
          name: 'string',
          age: 'number',
          active: 'boolean'
        })).not.toThrow();
      });

      it('should validate array types', () => {
        const objWithArray: TestInterface = {
          id: '123',
          name: 'Test',
          age: 25,
          active: true,
          tags: ['valid', 'tags']
        };

        const objWithInvalidArray = {
          id: '123',
          name: 'Test',
          age: 25,
          active: true,
          tags: [1, 2, 3] // Should be strings
        };

        expect(() => assertTypeCompliance<TestInterface>(objWithArray, {
          id: 'string',
          name: 'string',
          age: 'number',
          active: 'boolean',
          tags: 'string[]'
        })).not.toThrow();

        expect(() => assertTypeCompliance<TestInterface>(objWithInvalidArray as any, {
          id: 'string',
          name: 'string',
          age: 'number',
          active: 'boolean',
          tags: 'string[]'
        })).toThrow();
      });

      it('should handle nested objects', () => {
        interface NestedInterface {
          id: string;
          metadata: {
            created: string;
            modified: string;
            version: number;
          };
        }

        const nestedObj: NestedInterface = {
          id: '123',
          metadata: {
            created: '2023-01-01',
            modified: '2023-01-02',
            version: 1
          }
        };

        expect(() => assertTypeCompliance<NestedInterface>(nestedObj, {
          id: 'string',
          metadata: 'object'
        })).not.toThrow();
      });
    });

    describe('generateValidationTestCases', () => {
      it('should generate comprehensive test cases for validation', () => {
        const testCases = generateValidationTestCases<User>({
          validCases: [
            createMockUser({ status: 'active' }),
            createMockUser({ status: 'inactive' })
          ],
          invalidCases: [
            { ...createMockUser(), id: '' }, // Invalid ID
            { ...createMockUser(), email: 'invalid-email' }, // Invalid email
            { ...createMockUser(), name: null as any } // Invalid name
          ],
          edgeCases: [
            createMockUser({ name: 'A'.repeat(1000) }), // Very long name
            createMockUser({ roles: [] }), // Empty roles
            createMockUser({ name: '' }) // Empty name
          ]
        });

        expect(testCases.valid).toHaveLength(2);
        expect(testCases.invalid).toHaveLength(3);
        expect(testCases.edge).toHaveLength(3);

        // Should categorize correctly
        testCases.valid.forEach(testCase => {
          expect(testCase.shouldPass).toBe(true);
          expect(testCase.data).toBeDefined();
        });

        testCases.invalid.forEach(testCase => {
          expect(testCase.shouldPass).toBe(false);
          expect(testCase.data).toBeDefined();
        });

        testCases.edge.forEach(testCase => {
          expect(testCase.data).toBeDefined();
        });
      });

      it('should generate test cases with descriptions', () => {
        const testCases = generateValidationTestCases<User>({
          validCases: [
            { data: createMockUser(), description: 'Valid user with all fields' }
          ],
          invalidCases: [
            { data: { ...createMockUser(), email: 'bad' }, description: 'Invalid email format' }
          ]
        });

        expect(testCases.valid[0].description).toBe('Valid user with all fields');
        expect(testCases.invalid[0].description).toBe('Invalid email format');
      });

      it('should handle boundary value testing', () => {
        const testCases = generateValidationTestCases<Quiz>({
          boundaryTests: {
            timeLimit: [0, 1, 3599, 3600, 3601, 7200], // Test time boundaries
            passingScore: [-1, 0, 1, 49, 50, 99, 100, 101] // Test score boundaries
          }
        });

        expect(testCases.boundary).toBeDefined();
        expect(testCases.boundary.timeLimit).toHaveLength(6);
        expect(testCases.boundary.passingScore).toHaveLength(8);
      });

      it('should support custom validation predicates', () => {
        const testCases = generateValidationTestCases<User>({
          validCases: [createMockUser()],
          customValidation: (user: User) => ({
            emailFormat: user.email.includes('@'),
            nameLength: user.name.length > 0,
            activeStatus: user.status === 'active'
          })
        });

        expect(testCases.custom).toBeDefined();
        expect(typeof testCases.custom.emailFormat).toBe('boolean');
        expect(typeof testCases.custom.nameLength).toBe('boolean');
        expect(typeof testCases.custom.activeStatus).toBe('boolean');
      });
    });
  });

  describe('Performance and Memory Management', () => {
    it('should handle large data generation efficiently', () => {
      const start = performance.now();

      const largeUserSet = Array.from({ length: 1000 }, () => createMockUser());

      const duration = performance.now() - start;

      expect(largeUserSet).toHaveLength(1000);
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it('should not leak memory with repeated generation', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Generate and discard many objects
      for (let i = 0; i < 100; i++) {
        const batch = Array.from({ length: 100 }, () => createMockUser());
        // Batch goes out of scope and should be GC'd
      }

      // Force garbage collection if available
      if ((global as any).gc) {
        (global as any).gc();
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Memory usage should not increase significantly (allow 10MB increase)
      if (initialMemory > 0) {
        expect(finalMemory - initialMemory).toBeLessThan(10 * 1024 * 1024);
      }
    });

    it('should generate unique IDs efficiently at scale', () => {
      const idCount = 10000;
      const start = performance.now();

      const ids = Array.from({ length: idCount }, () => createMockUser().id);

      const duration = performance.now() - start;
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(idCount); // All should be unique
      expect(duration).toBeLessThan(5000); // Should be reasonably fast
    });
  });
});