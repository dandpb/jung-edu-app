import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Test Database Manager
 * Manages database setup, cleanup, and operations for E2E testing
 */
export class TestDatabaseManager {
  private supabase: SupabaseClient | null = null;
  private isTestEnvironment: boolean = false;

  constructor() {
    this.initializeClient();
  }

  private initializeClient(): void {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    const testDbUrl = process.env.E2E_SUPABASE_URL;
    const testDbKey = process.env.E2E_SUPABASE_ANON_KEY;

    // Use test database if available, otherwise fall back to main config
    const finalUrl = testDbUrl || supabaseUrl;
    const finalKey = testDbKey || supabaseKey;

    if (!finalUrl || !finalKey) {
      console.warn('⚠️ Supabase configuration not found. Database operations will be mocked.');
      return;
    }

    this.supabase = createClient(finalUrl, finalKey);
    this.isTestEnvironment = !!testDbUrl; // True if using dedicated test DB

    console.log(`🔗 Connected to ${this.isTestEnvironment ? 'test' : 'development'} database`);
  }

  // Setup and initialization
  async setup(): Promise<void> {
    if (!this.supabase) {
      console.log('🔧 Database setup skipped - using mocked database');
      return;
    }

    console.log('🔧 Setting up test database...');

    try {
      // Verify connection
      await this.verifyConnection();
      
      // Setup test tables if needed
      await this.ensureTestTables();
      
      // Clear existing test data
      await this.clearTestData();
      
      console.log('✅ Test database setup completed');
    } catch (error) {
      console.error('❌ Test database setup failed:', error);
      throw error;
    }
  }

  private async verifyConnection(): Promise<void> {
    if (!this.supabase) return;

    try {
      const { data, error } = await this.supabase.auth.getSession();
      if (error && error.message !== 'No session found') {
        throw error;
      }
      console.log('✅ Database connection verified');
    } catch (error) {
      throw new Error(`Database connection failed: ${error}`);
    }
  }

  private async ensureTestTables(): Promise<void> {
    if (!this.supabase) return;

    // Check if required tables exist
    const tables = [
      'users', 
      'profiles', 
      'modules', 
      'quizzes', 
      'user_progress',
      'quiz_attempts'
    ];

    for (const table of tables) {
      try {
        const { data, error } = await this.supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error && error.code === 'PGRST116') {
          console.warn(`⚠️ Table '${table}' not found - may need to run migrations`);
        }
      } catch (error) {
        console.warn(`⚠️ Could not verify table '${table}':`, error);
      }
    }
  }

  // Data management
  async clearTestData(): Promise<void> {
    if (!this.supabase) {
      console.log('🧹 Test data cleanup skipped - using mocked database');
      return;
    }

    console.log('🧹 Clearing test data...');

    try {
      // Clear in reverse dependency order
      await this.clearTable('quiz_attempts');
      await this.clearTable('user_progress');
      await this.clearTable('quizzes');
      await this.clearTable('modules');
      await this.clearTestUsers();
      
      console.log('✅ Test data cleared');
    } catch (error) {
      console.error('❌ Failed to clear test data:', error);
      // Don't throw - clearing might fail if tables don't exist
    }
  }

  private async clearTable(tableName: string, condition?: string): Promise<void> {
    if (!this.supabase) return;

    try {
      let query = this.supabase.from(tableName).delete();
      
      if (condition) {
        query = query.match(JSON.parse(condition));
      } else {
        // For safety, only clear test data (data created during tests)
        query = query.or('email.like.*test.jaquedu.com*,title.like.*Test*,id.like.*test-*');
      }

      const { error } = await query;
      
      if (error && error.code !== 'PGRST116') { // Ignore "table not found" errors
        console.warn(`⚠️ Failed to clear table ${tableName}:`, error.message);
      } else {
        console.log(`✅ Cleared table: ${tableName}`);
      }
    } catch (error) {
      console.warn(`⚠️ Error clearing table ${tableName}:`, error);
    }
  }

  private async clearTestUsers(): Promise<void> {
    if (!this.supabase) return;

    try {
      // First clear profiles
      await this.supabase
        .from('profiles')
        .delete()
        .like('email', '*test.jaquedu.com*');

      // Then clear auth users (this requires admin privileges)
      const { data: users, error: fetchError } = await this.supabase.auth.admin.listUsers();
      
      if (!fetchError && users) {
        const testUsers = users.users.filter(user => 
          user.email?.includes('test.jaquedu.com')
        );

        for (const user of testUsers) {
          await this.supabase.auth.admin.deleteUser(user.id);
        }

        console.log(`✅ Cleared ${testUsers.length} test users`);
      }
    } catch (error) {
      console.warn('⚠️ Could not clear test users (may need admin privileges):', error);
    }
  }

  // User management
  async createTestUser(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
  }): Promise<any> {
    if (!this.supabase) {
      console.log('👤 Creating test user (mocked):', userData.email);
      return { user: { id: 'mock-user-id', email: userData.email } };
    }

    try {
      // Create auth user
      const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true
      });

      if (authError) {
        throw authError;
      }

      // Create profile
      if (authData.user) {
        const { error: profileError } = await this.supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: userData.email,
            first_name: userData.firstName,
            last_name: userData.lastName,
            role: userData.role || 'student',
            created_at: new Date().toISOString()
          });

        if (profileError) {
          console.warn('⚠️ Failed to create profile:', profileError.message);
        }
      }

      console.log('✅ Created test user:', userData.email);
      return authData;
    } catch (error) {
      console.error('❌ Failed to create test user:', userData.email, error);
      throw error;
    }
  }

  async deleteTestUser(userId: string): Promise<void> {
    if (!this.supabase) {
      console.log('🗑️ Deleting test user (mocked):', userId);
      return;
    }

    try {
      // Delete profile first
      await this.supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      // Delete auth user
      await this.supabase.auth.admin.deleteUser(userId);

      console.log('✅ Deleted test user:', userId);
    } catch (error) {
      console.error('❌ Failed to delete test user:', userId, error);
      throw error;
    }
  }

  // Module management
  async createTestModule(moduleData: {
    title: string;
    description: string;
    content: string;
    difficulty?: string;
    language?: string;
    authorId: string;
  }): Promise<any> {
    if (!this.supabase) {
      console.log('📚 Creating test module (mocked):', moduleData.title);
      return { id: 'mock-module-id', ...moduleData };
    }

    try {
      const { data, error } = await this.supabase
        .from('modules')
        .insert({
          title: moduleData.title,
          description: moduleData.description,
          content: moduleData.content,
          difficulty: moduleData.difficulty || 'intermediate',
          language: moduleData.language || 'en',
          author_id: moduleData.authorId,
          is_published: true,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Created test module:', moduleData.title);
      return data;
    } catch (error) {
      console.error('❌ Failed to create test module:', moduleData.title, error);
      throw error;
    }
  }

  async deleteTestModule(moduleId: string): Promise<void> {
    if (!this.supabase) {
      console.log('🗑️ Deleting test module (mocked):', moduleId);
      return;
    }

    try {
      // Delete related data first
      await this.supabase.from('quiz_attempts').delete().eq('module_id', moduleId);
      await this.supabase.from('user_progress').delete().eq('module_id', moduleId);
      await this.supabase.from('quizzes').delete().eq('module_id', moduleId);
      
      // Delete the module
      await this.supabase.from('modules').delete().eq('id', moduleId);

      console.log('✅ Deleted test module:', moduleId);
    } catch (error) {
      console.error('❌ Failed to delete test module:', moduleId, error);
      throw error;
    }
  }

  // Quiz management
  async createTestQuiz(quizData: {
    moduleId: string;
    questions: any[];
    passingScore?: number;
    timeLimit?: number;
  }): Promise<any> {
    if (!this.supabase) {
      console.log('❓ Creating test quiz (mocked) for module:', quizData.moduleId);
      return { id: 'mock-quiz-id', ...quizData };
    }

    try {
      const { data, error } = await this.supabase
        .from('quizzes')
        .insert({
          module_id: quizData.moduleId,
          questions: quizData.questions,
          passing_score: quizData.passingScore || 70,
          time_limit: quizData.timeLimit,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Created test quiz for module:', quizData.moduleId);
      return data;
    } catch (error) {
      console.error('❌ Failed to create test quiz:', error);
      throw error;
    }
  }

  // Progress management
  async createTestProgress(progressData: {
    userId: string;
    moduleId: string;
    progress: number;
    completed: boolean;
    timeSpent: number;
  }): Promise<any> {
    if (!this.supabase) {
      console.log('📊 Creating test progress (mocked)');
      return { id: 'mock-progress-id', ...progressData };
    }

    try {
      const { data, error } = await this.supabase
        .from('user_progress')
        .upsert({
          user_id: progressData.userId,
          module_id: progressData.moduleId,
          progress: progressData.progress,
          completed: progressData.completed,
          time_spent: progressData.timeSpent,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('❌ Failed to create test progress:', error);
      throw error;
    }
  }

  // Backup and restore
  async createBackup(): Promise<string> {
    if (!this.supabase) {
      console.log('💾 Creating database backup (mocked)');
      return 'mock-backup-data';
    }

    console.log('💾 Creating database backup...');

    try {
      const backup: any = {
        timestamp: new Date().toISOString(),
        tables: {}
      };

      // Backup test data only
      const tables = ['profiles', 'modules', 'quizzes', 'user_progress'];
      
      for (const table of tables) {
        try {
          const { data, error } = await this.supabase
            .from(table)
            .select('*')
            .like('email', '*test.jaquedu.com*'); // Only test data

          if (!error && data) {
            backup.tables[table] = data;
          }
        } catch (error) {
          console.warn(`⚠️ Could not backup table ${table}:`, error);
        }
      }

      console.log('✅ Database backup created');
      return JSON.stringify(backup);
    } catch (error) {
      console.error('❌ Failed to create database backup:', error);
      throw error;
    }
  }

  async restoreBackup(backupData: string): Promise<void> {
    if (!this.supabase) {
      console.log('🔄 Restoring database backup (mocked)');
      return;
    }

    console.log('🔄 Restoring database backup...');

    try {
      const backup = JSON.parse(backupData);
      
      for (const [tableName, tableData] of Object.entries(backup.tables)) {
        if (Array.isArray(tableData) && tableData.length > 0) {
          const { error } = await this.supabase
            .from(tableName)
            .upsert(tableData);

          if (error) {
            console.warn(`⚠️ Failed to restore table ${tableName}:`, error.message);
          } else {
            console.log(`✅ Restored table: ${tableName}`);
          }
        }
      }

      console.log('✅ Database backup restored');
    } catch (error) {
      console.error('❌ Failed to restore database backup:', error);
      throw error;
    }
  }

  // Health checks
  async isHealthy(): Promise<boolean> {
    if (!this.supabase) {
      return true; // Mocked database is always "healthy"
    }

    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('id')
        .limit(1);

      return !error;
    } catch {
      return false;
    }
  }

  async getStats(): Promise<any> {
    if (!this.supabase) {
      return {
        users: 0,
        modules: 0,
        quizzes: 0,
        progress: 0,
        isTestEnvironment: false
      };
    }

    try {
      const [usersCount, modulesCount, quizzesCount, progressCount] = await Promise.all([
        this.getTableCount('profiles'),
        this.getTableCount('modules'),
        this.getTableCount('quizzes'),
        this.getTableCount('user_progress')
      ]);

      return {
        users: usersCount,
        modules: modulesCount,
        quizzes: quizzesCount,
        progress: progressCount,
        isTestEnvironment: this.isTestEnvironment
      };
    } catch (error) {
      console.warn('⚠️ Could not get database stats:', error);
      return {
        users: 0,
        modules: 0,
        quizzes: 0,
        progress: 0,
        isTestEnvironment: this.isTestEnvironment,
        error: error.message
      };
    }
  }

  private async getTableCount(tableName: string): Promise<number> {
    if (!this.supabase) return 0;

    try {
      const { count, error } = await this.supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      return error ? 0 : (count || 0);
    } catch {
      return 0;
    }
  }

  // Cleanup
  async teardown(): Promise<void> {
    console.log('🏁 Tearing down test database...');

    try {
      await this.clearTestData();
      console.log('✅ Test database teardown completed');
    } catch (error) {
      console.error('❌ Test database teardown failed:', error);
      // Don't throw - teardown should not fail tests
    }
  }

  // Utility methods
  getClient(): SupabaseClient | null {
    return this.supabase;
  }

  isConnected(): boolean {
    return this.supabase !== null;
  }

  isUsingTestDatabase(): boolean {
    return this.isTestEnvironment;
  }
}