/**
 * Supabase Migration Utilities
 * Helps migrate from localStorage-based auth to Supabase
 */

import { supabase, createDatabaseQuery } from '../config/supabase';
import { 
  User, 
  UserProfile, 
  Module, 
  UserProgress,
  Note,
  UserInsert,
  UserProfileInsert,
  ModuleInsert,
  UserProgressInsert,
  NoteInsert
} from '../types/database';

export interface MigrationOptions {
  preserveIds?: boolean;
  skipExisting?: boolean;
  batchSize?: number;
  dryRun?: boolean;
}

export interface MigrationResult {
  success: boolean;
  migratedCount: number;
  skippedCount: number;
  errors: Array<{ item: any; error: string }>;
}

export class SupabaseMigrationService {
  private defaultOptions: MigrationOptions = {
    preserveIds: false,
    skipExisting: true,
    batchSize: 50,
    dryRun: false
  };

  /**
   * Migrate users from localStorage to Supabase
   */
  async migrateUsers(options: MigrationOptions = {}): Promise<MigrationResult> {
    const opts = { ...this.defaultOptions, ...options };
    const result: MigrationResult = {
      success: false,
      migratedCount: 0,
      skippedCount: 0,
      errors: []
    };

    try {
      // Get users from localStorage
      const localUsers = this.getLocalStorageUsers();
      
      if (localUsers.length === 0) {
        result.success = true;
        return result;
      }

      console.log(`Found ${localUsers.length} users to migrate`);

      for (const localUser of localUsers) {
        try {
          // Check if user already exists
          if (opts.skipExisting) {
            const { data: existingUser } = await createDatabaseQuery
              .users()
              .select('id')
              .eq('email', localUser.email)
              .single();

            if (existingUser) {
              result.skippedCount++;
              continue;
            }
          }

          if (!opts.dryRun) {
            // Create auth user first
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
              email: localUser.email,
              password: 'temp_password_123!', // User will need to reset
              email_confirm: true,
              user_metadata: {
                username: localUser.username,
                migrated_from_local: true
              }
            });

            if (authError) throw authError;

            // Create user record
            const userInsert: UserInsert = {
              id: authData.user.id,
              email: localUser.email,
              username: localUser.username,
              role: localUser.role as any,
              is_active: localUser.isActive,
              is_verified: localUser.isVerified,
              created_at: localUser.createdAt,
              last_login: localUser.lastLogin
            };

            const { error: userError } = await createDatabaseQuery
              .users()
              .insert(userInsert);

            if (userError) throw userError;

            // Create user profile if exists
            if (localUser.profile) {
              const profileInsert: UserProfileInsert = {
                user_id: authData.user.id,
                first_name: localUser.profile.firstName,
                last_name: localUser.profile.lastName,
                language: localUser.profile.preferences?.language || 'pt-BR',
                theme: localUser.profile.preferences?.theme as any || 'light',
                email_notifications: localUser.profile.preferences?.emailNotifications ?? true,
                push_notifications: localUser.profile.preferences?.pushNotifications ?? false
              };

              const { error: profileError } = await createDatabaseQuery
                .userProfiles()
                .insert(profileInsert);

              if (profileError) {
                console.warn('Failed to create profile for user:', localUser.email, profileError);
              }
            }
          }

          result.migratedCount++;
        } catch (error) {
          result.errors.push({
            item: localUser,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      result.success = result.errors.length === 0;
    } catch (error) {
      result.errors.push({
        item: 'migration_process',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return result;
  }

  /**
   * Migrate modules from localStorage to Supabase
   */
  async migrateModules(createdBy: string, options: MigrationOptions = {}): Promise<MigrationResult> {
    const opts = { ...this.defaultOptions, ...options };
    const result: MigrationResult = {
      success: false,
      migratedCount: 0,
      skippedCount: 0,
      errors: []
    };

    try {
      // Get modules from localStorage or app data
      const localModules = this.getLocalStorageModules();
      
      if (localModules.length === 0) {
        result.success = true;
        return result;
      }

      console.log(`Found ${localModules.length} modules to migrate`);

      for (const localModule of localModules) {
        try {
          // Check if module already exists
          if (opts.skipExisting) {
            const { data: existingModule } = await createDatabaseQuery
              .modules()
              .select('id')
              .eq('title', localModule.title)
              .single();

            if (existingModule) {
              result.skippedCount++;
              continue;
            }
          }

          if (!opts.dryRun) {
            const moduleInsert: ModuleInsert = {
              title: localModule.title,
              description: localModule.description,
              content: localModule.content,
              difficulty: localModule.difficulty as any,
              duration_minutes: localModule.duration,
              tags: localModule.tags,
              language: localModule.language || 'pt-BR',
              is_published: localModule.isPublished || false,
              created_by: createdBy,
              prerequisites: localModule.prerequisites,
              learning_objectives: localModule.learningObjectives
            };

            const { error } = await createDatabaseQuery
              .modules()
              .insert(moduleInsert);

            if (error) throw error;
          }

          result.migratedCount++;
        } catch (error) {
          result.errors.push({
            item: localModule,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      result.success = result.errors.length === 0;
    } catch (error) {
      result.errors.push({
        item: 'migration_process',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return result;
  }

  /**
   * Migrate user progress from localStorage to Supabase
   */
  async migrateUserProgress(options: MigrationOptions = {}): Promise<MigrationResult> {
    const opts = { ...this.defaultOptions, ...options };
    const result: MigrationResult = {
      success: false,
      migratedCount: 0,
      skippedCount: 0,
      errors: []
    };

    try {
      // Get progress from localStorage
      const localProgress = this.getLocalStorageProgress();
      
      if (localProgress.length === 0) {
        result.success = true;
        return result;
      }

      console.log(`Found ${localProgress.length} progress records to migrate`);

      for (const progress of localProgress) {
        try {
          // Check if progress already exists
          if (opts.skipExisting) {
            const { data: existingProgress } = await createDatabaseQuery
              .userProgress()
              .select('id')
              .eq('user_id', progress.userId)
              .eq('module_id', progress.moduleId)
              .single();

            if (existingProgress) {
              result.skippedCount++;
              continue;
            }
          }

          if (!opts.dryRun) {
            const progressInsert: UserProgressInsert = {
              user_id: progress.userId,
              module_id: progress.moduleId,
              status: progress.status as any,
              progress_percentage: progress.progressPercentage,
              time_spent_minutes: progress.timeSpentMinutes,
              last_accessed: progress.lastAccessed,
              completed_at: progress.completedAt,
              quiz_attempts: progress.quizAttempts,
              notes: progress.notes
            };

            const { error } = await createDatabaseQuery
              .userProgress()
              .insert(progressInsert);

            if (error) throw error;
          }

          result.migratedCount++;
        } catch (error) {
          result.errors.push({
            item: progress,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      result.success = result.errors.length === 0;
    } catch (error) {
      result.errors.push({
        item: 'migration_process',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return result;
  }

  /**
   * Migrate notes from localStorage to Supabase
   */
  async migrateNotes(options: MigrationOptions = {}): Promise<MigrationResult> {
    const opts = { ...this.defaultOptions, ...options };
    const result: MigrationResult = {
      success: false,
      migratedCount: 0,
      skippedCount: 0,
      errors: []
    };

    try {
      // Get notes from localStorage
      const localNotes = this.getLocalStorageNotes();
      
      if (localNotes.length === 0) {
        result.success = true;
        return result;
      }

      console.log(`Found ${localNotes.length} notes to migrate`);

      for (const note of localNotes) {
        try {
          if (!opts.dryRun) {
            const noteInsert: NoteInsert = {
              user_id: note.userId,
              module_id: note.moduleId,
              title: note.title,
              content: note.content,
              tags: note.tags,
              is_private: note.isPrivate
            };

            const { error } = await createDatabaseQuery
              .notes()
              .insert(noteInsert);

            if (error) throw error;
          }

          result.migratedCount++;
        } catch (error) {
          result.errors.push({
            item: note,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      result.success = result.errors.length === 0;
    } catch (error) {
      result.errors.push({
        item: 'migration_process',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return result;
  }

  /**
   * Complete migration process
   */
  async migrateAll(adminUserId: string, options: MigrationOptions = {}): Promise<{
    users: MigrationResult;
    modules: MigrationResult;
    progress: MigrationResult;
    notes: MigrationResult;
  }> {
    console.log('Starting complete migration to Supabase...');

    const results = {
      users: await this.migrateUsers(options),
      modules: await this.migrateModules(adminUserId, options),
      progress: await this.migrateUserProgress(options),
      notes: await this.migrateNotes(options)
    };

    const totalMigrated = Object.values(results).reduce((sum, result) => sum + result.migratedCount, 0);
    const totalErrors = Object.values(results).reduce((sum, result) => sum + result.errors.length, 0);

    console.log(`Migration complete: ${totalMigrated} items migrated, ${totalErrors} errors`);

    return results;
  }

  /**
   * Clear localStorage data after successful migration
   */
  clearLocalStorageData(): void {
    const keys = [
      'jungApp_users',
      'jungApp_sessions',
      'jungApp_modules',
      'jungApp_progress',
      'jungApp_notes'
    ];

    keys.forEach(key => {
      localStorage.removeItem(key);
    });

    console.log('Local storage data cleared');
  }

  // Helper methods to extract data from localStorage
  private getLocalStorageUsers(): any[] {
    try {
      const stored = localStorage.getItem('jungApp_users');
      if (!stored) return [];
      const users = JSON.parse(stored);
      return Object.values(users);
    } catch (error) {
      console.error('Failed to get users from localStorage:', error);
      return [];
    }
  }

  private getLocalStorageModules(): any[] {
    try {
      const stored = localStorage.getItem('jungApp_modules');
      if (!stored) return [];
      const modules = JSON.parse(stored);
      return Object.values(modules);
    } catch (error) {
      console.error('Failed to get modules from localStorage:', error);
      return [];
    }
  }

  private getLocalStorageProgress(): any[] {
    try {
      const stored = localStorage.getItem('jungApp_progress');
      if (!stored) return [];
      const progress = JSON.parse(stored);
      return Object.values(progress);
    } catch (error) {
      console.error('Failed to get progress from localStorage:', error);
      return [];
    }
  }

  private getLocalStorageNotes(): any[] {
    try {
      const stored = localStorage.getItem('jungApp_notes');
      if (!stored) return [];
      const notes = JSON.parse(stored);
      return Object.values(notes);
    } catch (error) {
      console.error('Failed to get notes from localStorage:', error);
      return [];
    }
  }
}

// Export singleton instance
export const migrationService = new SupabaseMigrationService();