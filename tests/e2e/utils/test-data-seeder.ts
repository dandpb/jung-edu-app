/**
 * Test Data Seeder for E2E Tests
 * 
 * Handles seeding of test data including:
 * - User accounts with different roles
 * - Educational modules and content
 * - Quizzes and assessments
 * - Progress tracking data
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

interface TestConfig {
  baseURL: string;
  database: {
    url: string;
    testSchema: string;
    cleanupTimeout: number;
  };
  testData: {
    seedDataPath: string;
    userFixtures: string;
    moduleFixtures: string;
  };
  auth: {
    testUserEmail: string;
    testUserPassword: string;
    adminEmail: string;
    adminPassword: string;
  };
}

interface TestUser {
  id?: string;
  email: string;
  password: string;
  role: 'user' | 'admin' | 'instructor';
  profile: {
    full_name: string;
    avatar_url?: string;
    preferences: Record<string, any>;
  };
}

interface TestModule {
  id?: string;
  title: string;
  description: string;
  content: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  tags: string[];
  is_published: boolean;
  author_id?: string;
}

export class TestDataSeeder {
  private client: SupabaseClient | null = null;
  private config: TestConfig;
  private seededData: {
    users: TestUser[];
    modules: TestModule[];
    quizzes: any[];
  } = {
    users: [],
    modules: [],
    quizzes: [],
  };

  constructor(config: TestConfig) {
    this.config = config;
  }

  /**
   * Initialize the seeder
   */
  async initialize(): Promise<void> {
    if (this.config.database.url.includes('test.supabase.co')) {
      console.log('📝 Using mock mode for test data seeding');
      return;
    }

    try {
      const anonKey = process.env.TEST_SUPABASE_ANON_KEY || 
                      process.env.REACT_APP_SUPABASE_ANON_KEY ||
                      'test-anon-key';

      this.client = createClient(this.config.database.url, anonKey);
      console.log('📡 Test data seeder initialized');
    } catch (error) {
      console.error('❌ Failed to initialize test data seeder:', error);
      throw error;
    }
  }

  /**
   * Seed all test data
   */
  async seedTestData(): Promise<void> {
    console.log('🌱 Seeding test data...');

    if (!this.client) {
      await this.initialize();
    }

    try {
      // Step 1: Load fixture data
      await this.loadFixtureData();

      // Step 2: Seed users
      await this.seedUsers();

      // Step 3: Seed educational modules
      await this.seedModules();

      // Step 4: Seed quizzes
      await this.seedQuizzes();

      // Step 5: Seed progress data
      await this.seedProgressData();

      console.log('✅ Test data seeding complete');
      
      // Save seeded data metadata
      await this.saveSeededDataMetadata();

    } catch (error) {
      console.error('❌ Test data seeding failed:', error);
      throw error;
    }
  }

  /**
   * Load fixture data from JSON files
   */
  private async loadFixtureData(): Promise<void> {
    try {
      // Load user fixtures
      if (fs.existsSync(this.config.testData.userFixtures)) {
        const userData = JSON.parse(fs.readFileSync(this.config.testData.userFixtures, 'utf8'));
        this.seededData.users = userData;
      } else {
        // Create default user fixtures
        this.seededData.users = this.createDefaultUsers();
      }

      // Load module fixtures
      if (fs.existsSync(this.config.testData.moduleFixtures)) {
        const moduleData = JSON.parse(fs.readFileSync(this.config.testData.moduleFixtures, 'utf8'));
        this.seededData.modules = moduleData;
      } else {
        // Create default module fixtures
        this.seededData.modules = this.createDefaultModules();
      }

      console.log(`📋 Loaded ${this.seededData.users.length} users and ${this.seededData.modules.length} modules from fixtures`);
    } catch (error) {
      console.warn('⚠️  Failed to load fixtures, using defaults:', error.message);
      this.seededData.users = this.createDefaultUsers();
      this.seededData.modules = this.createDefaultModules();
    }
  }

  /**
   * Create default test users
   */
  private createDefaultUsers(): TestUser[] {
    return [
      {
        email: this.config.auth.testUserEmail,
        password: this.config.auth.testUserPassword,
        role: 'user',
        profile: {
          full_name: 'E2E Test User',
          preferences: {
            language: 'en',
            theme: 'light',
            notifications: true,
          },
        },
      },
      {
        email: this.config.auth.adminEmail,
        password: this.config.auth.adminPassword,
        role: 'admin',
        profile: {
          full_name: 'E2E Test Admin',
          preferences: {
            language: 'en',
            theme: 'dark',
            notifications: true,
          },
        },
      },
      {
        email: 'instructor.e2e@jaqedu.com',
        password: 'instructor-e2e-test-789',
        role: 'instructor',
        profile: {
          full_name: 'E2E Test Instructor',
          preferences: {
            language: 'en',
            theme: 'light',
            notifications: false,
          },
        },
      },
    ];
  }

  /**
   * Create default test modules
   */
  private createDefaultModules(): TestModule[] {
    return [
      {
        title: 'E2E Test Module: Introduction to Psychology',
        description: 'A comprehensive introduction to psychological principles and theories.',
        content: `# Introduction to Psychology

## Learning Objectives
- Understand the basic principles of psychology
- Learn about different psychological theories
- Apply psychological concepts to real-world scenarios

## Content
Psychology is the scientific study of mind and behavior...

### Key Concepts
1. Cognitive processes
2. Behavioral patterns
3. Emotional responses

## Activities
- Interactive exercises
- Case study analysis
- Self-reflection questions`,
        difficulty: 'beginner',
        category: 'Psychology',
        tags: ['psychology', 'introduction', 'theory', 'e2e-test'],
        is_published: true,
      },
      {
        title: 'E2E Test Module: Advanced Learning Theories',
        description: 'Deep dive into advanced learning theories and their applications.',
        content: `# Advanced Learning Theories

## Overview
This module explores advanced concepts in learning theory...

## Theories Covered
- Constructivism
- Social Learning Theory
- Cognitive Load Theory

## Practical Applications
- Educational design
- Training programs
- Assessment methods`,
        difficulty: 'advanced',
        category: 'Education',
        tags: ['learning', 'theory', 'advanced', 'e2e-test'],
        is_published: true,
      },
      {
        title: 'E2E Test Module: Draft Module',
        description: 'This is a draft module for testing unpublished content.',
        content: 'Draft content for testing purposes.',
        difficulty: 'intermediate',
        category: 'Testing',
        tags: ['draft', 'testing', 'e2e-test'],
        is_published: false,
      },
    ];
  }

  /**
   * Seed test users
   */
  private async seedUsers(): Promise<void> {
    console.log('👥 Seeding test users...');

    if (this.config.database.url.includes('test.supabase.co')) {
      // Mock mode
      console.log(`📝 Mock seeded ${this.seededData.users.length} users`);
      return;
    }

    if (!this.client) return;

    try {
      for (const user of this.seededData.users) {
        // In a real scenario, you'd use Supabase Auth API
        // For E2E tests, we'll create user records directly
        // Note: This is simplified - real implementation would use proper auth flows

        const { data, error } = await this.client.auth.signUp({
          email: user.email,
          password: user.password,
        });

        if (error && error.message !== 'User already registered') {
          console.warn(`⚠️  Failed to create user ${user.email}:`, error.message);
          continue;
        }

        // Create user profile
        if (data.user) {
          const { error: profileError } = await this.client
            .from('user_profiles')
            .upsert({
              user_id: data.user.id,
              email: user.email,
              full_name: user.profile.full_name,
              role: user.role,
              preferences: user.profile.preferences,
            });

          if (profileError) {
            console.warn(`⚠️  Failed to create profile for ${user.email}:`, profileError.message);
          }
        }
      }

      console.log(`✅ Seeded ${this.seededData.users.length} test users`);
    } catch (error) {
      console.error('❌ User seeding failed:', error);
      throw error;
    }
  }

  /**
   * Seed test modules
   */
  private async seedModules(): Promise<void> {
    console.log('📚 Seeding test modules...');

    if (this.config.database.url.includes('test.supabase.co')) {
      // Mock mode
      console.log(`📝 Mock seeded ${this.seededData.modules.length} modules`);
      return;
    }

    if (!this.client) return;

    try {
      // Get a test user ID for module authorship
      const authorUser = this.seededData.users.find(u => u.role === 'instructor');
      let authorId = null;

      if (authorUser) {
        const { data: userData } = await this.client
          .from('user_profiles')
          .select('user_id')
          .eq('email', authorUser.email)
          .single();
        
        authorId = userData?.user_id;
      }

      for (const module of this.seededData.modules) {
        const { error } = await this.client
          .from('modules')
          .insert({
            title: module.title,
            description: module.description,
            content: module.content,
            difficulty: module.difficulty,
            category: module.category,
            tags: module.tags,
            is_published: module.is_published,
            author_id: authorId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (error) {
          console.warn(`⚠️  Failed to create module "${module.title}":`, error.message);
        }
      }

      console.log(`✅ Seeded ${this.seededData.modules.length} test modules`);
    } catch (error) {
      console.error('❌ Module seeding failed:', error);
      throw error;
    }
  }

  /**
   * Seed test quizzes
   */
  private async seedQuizzes(): Promise<void> {
    console.log('❓ Seeding test quizzes...');

    if (this.config.database.url.includes('test.supabase.co')) {
      console.log('📝 Mock seeded test quizzes');
      return;
    }

    if (!this.client) return;

    try {
      // Get module IDs for quiz association
      const { data: modules } = await this.client
        .from('modules')
        .select('id, title')
        .like('title', 'E2E Test%');

      if (!modules || modules.length === 0) {
        console.warn('⚠️  No test modules found for quiz association');
        return;
      }

      const sampleQuizzes = [
        {
          module_id: modules[0].id,
          title: 'E2E Test Quiz: Psychology Basics',
          questions: [
            {
              type: 'multiple_choice',
              question: 'What is the primary focus of psychology?',
              options: ['Mind and behavior', 'Physical health', 'Mathematics', 'Literature'],
              correct_answer: 0,
              explanation: 'Psychology is the scientific study of mind and behavior.',
            },
            {
              type: 'true_false',
              question: 'Psychology is a purely theoretical field with no practical applications.',
              correct_answer: false,
              explanation: 'Psychology has many practical applications in therapy, education, and business.',
            },
          ],
          time_limit: 600, // 10 minutes
          passing_score: 70,
          is_active: true,
        },
      ];

      for (const quiz of sampleQuizzes) {
        const { error } = await this.client
          .from('quizzes')
          .insert(quiz);

        if (error) {
          console.warn(`⚠️  Failed to create quiz "${quiz.title}":`, error.message);
        }
      }

      console.log(`✅ Seeded ${sampleQuizzes.length} test quizzes`);
    } catch (error) {
      console.error('❌ Quiz seeding failed:', error);
      throw error;
    }
  }

  /**
   * Seed test progress data
   */
  private async seedProgressData(): Promise<void> {
    console.log('📊 Seeding test progress data...');

    if (this.config.database.url.includes('test.supabase.co')) {
      console.log('📝 Mock seeded progress data');
      return;
    }

    if (!this.client) return;

    try {
      // Get test user and module data
      const { data: users } = await this.client
        .from('user_profiles')
        .select('user_id, email')
        .like('email', '%e2e%');

      const { data: modules } = await this.client
        .from('modules')
        .select('id, title')
        .like('title', 'E2E Test%');

      if (!users || !modules || users.length === 0 || modules.length === 0) {
        console.warn('⚠️  Insufficient data for progress seeding');
        return;
      }

      // Create sample progress data
      const progressRecords = [];
      for (const user of users) {
        for (let i = 0; i < Math.min(modules.length, 2); i++) {
          progressRecords.push({
            user_id: user.user_id,
            module_id: modules[i].id,
            status: i === 0 ? 'completed' : 'in_progress',
            progress_percentage: i === 0 ? 100 : 45,
            time_spent: i === 0 ? 3600 : 1800, // seconds
            last_accessed: new Date().toISOString(),
            completed_at: i === 0 ? new Date().toISOString() : null,
          });
        }
      }

      if (progressRecords.length > 0) {
        const { error } = await this.client
          .from('user_progress')
          .insert(progressRecords);

        if (error) {
          console.warn('⚠️  Failed to create progress records:', error.message);
        } else {
          console.log(`✅ Seeded ${progressRecords.length} progress records`);
        }
      }
    } catch (error) {
      console.error('❌ Progress data seeding failed:', error);
      throw error;
    }
  }

  /**
   * Save metadata about seeded data
   */
  private async saveSeededDataMetadata(): Promise<void> {
    const metadata = {
      timestamp: new Date().toISOString(),
      userCount: this.seededData.users.length,
      moduleCount: this.seededData.modules.length,
      quizCount: this.seededData.quizzes.length,
      testUsers: this.seededData.users.map(u => ({ email: u.email, role: u.role })),
      testModules: this.seededData.modules.map(m => ({ title: m.title, category: m.category })),
    };

    try {
      await fs.promises.writeFile(
        './tests/e2e/seed-metadata.json',
        JSON.stringify(metadata, null, 2)
      );
    } catch (error) {
      console.warn('⚠️  Failed to save seed metadata:', error.message);
    }
  }

  /**
   * Clean up seeded test data
   */
  async cleanupSeededData(): Promise<void> {
    console.log('🧹 Cleaning up seeded test data...');

    if (this.config.database.url.includes('test.supabase.co')) {
      console.log('📝 Mock cleanup of seeded data');
      return;
    }

    if (!this.client) {
      await this.initialize();
    }

    // Cleanup is handled by DatabaseManager.cleanupTestDatabase()
    // This method is here for completeness and future extensions
    
    console.log('✅ Seeded data cleanup complete');
  }
}