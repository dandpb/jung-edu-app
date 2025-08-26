/**
 * Database Types and Schema Definitions
 * Generated type definitions for Supabase database schema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          username: string
          role: 'super_admin' | 'admin' | 'instructor' | 'student' | 'guest'
          is_active: boolean
          is_verified: boolean
          created_at: string
          updated_at: string
          last_login: string | null
          email_verified_at: string | null
          avatar_url: string | null
        }
        Insert: {
          id?: string
          email: string
          username: string
          role?: 'super_admin' | 'admin' | 'instructor' | 'student' | 'guest'
          is_active?: boolean
          is_verified?: boolean
          created_at?: string
          updated_at?: string
          last_login?: string | null
          email_verified_at?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          email?: string
          username?: string
          role?: 'super_admin' | 'admin' | 'instructor' | 'student' | 'guest'
          is_active?: boolean
          is_verified?: boolean
          created_at?: string
          updated_at?: string
          last_login?: string | null
          email_verified_at?: string | null
          avatar_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          first_name: string | null
          last_name: string | null
          bio: string | null
          phone: string | null
          timezone: string | null
          language: string
          theme: 'light' | 'dark'
          email_notifications: boolean
          push_notifications: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          first_name?: string | null
          last_name?: string | null
          bio?: string | null
          phone?: string | null
          timezone?: string | null
          language?: string
          theme?: 'light' | 'dark'
          email_notifications?: boolean
          push_notifications?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          first_name?: string | null
          last_name?: string | null
          bio?: string | null
          phone?: string | null
          timezone?: string | null
          language?: string
          theme?: 'light' | 'dark'
          email_notifications?: boolean
          push_notifications?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string
          device_id: string
          device_name: string | null
          ip_address: string | null
          user_agent: string | null
          is_active: boolean
          created_at: string
          last_activity: string
          expires_at: string
        }
        Insert: {
          id?: string
          user_id: string
          device_id: string
          device_name?: string | null
          ip_address?: string | null
          user_agent?: string | null
          is_active?: boolean
          created_at?: string
          last_activity?: string
          expires_at: string
        }
        Update: {
          id?: string
          user_id?: string
          device_id?: string
          device_name?: string | null
          ip_address?: string | null
          user_agent?: string | null
          is_active?: boolean
          created_at?: string
          last_activity?: string
          expires_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      modules: {
        Row: {
          id: string
          title: string
          description: string | null
          content: Json
          difficulty: 'beginner' | 'intermediate' | 'advanced'
          duration_minutes: number | null
          tags: string[] | null
          language: string
          is_published: boolean
          created_by: string
          created_at: string
          updated_at: string
          version: number
          prerequisites: string[] | null
          learning_objectives: string[] | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          content: Json
          difficulty?: 'beginner' | 'intermediate' | 'advanced'
          duration_minutes?: number | null
          tags?: string[] | null
          language?: string
          is_published?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
          version?: number
          prerequisites?: string[] | null
          learning_objectives?: string[] | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          content?: Json
          difficulty?: 'beginner' | 'intermediate' | 'advanced'
          duration_minutes?: number | null
          tags?: string[] | null
          language?: string
          is_published?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
          version?: number
          prerequisites?: string[] | null
          learning_objectives?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "modules_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      quizzes: {
        Row: {
          id: string
          module_id: string
          title: string
          description: string | null
          questions: Json
          passing_score: number
          time_limit_minutes: number | null
          max_attempts: number | null
          is_active: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          module_id: string
          title: string
          description?: string | null
          questions: Json
          passing_score?: number
          time_limit_minutes?: number | null
          max_attempts?: number | null
          is_active?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          module_id?: string
          title?: string
          description?: string | null
          questions?: Json
          passing_score?: number
          time_limit_minutes?: number | null
          max_attempts?: number | null
          is_active?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_module_id_fkey"
            columns: ["module_id"]
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          module_id: string
          status: 'not_started' | 'in_progress' | 'completed' | 'failed'
          progress_percentage: number
          time_spent_minutes: number
          last_accessed: string
          completed_at: string | null
          quiz_attempts: Json | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          module_id: string
          status?: 'not_started' | 'in_progress' | 'completed' | 'failed'
          progress_percentage?: number
          time_spent_minutes?: number
          last_accessed?: string
          completed_at?: string | null
          quiz_attempts?: Json | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          module_id?: string
          status?: 'not_started' | 'in_progress' | 'completed' | 'failed'
          progress_percentage?: number
          time_spent_minutes?: number
          last_accessed?: string
          completed_at?: string | null
          quiz_attempts?: Json | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_module_id_fkey"
            columns: ["module_id"]
            referencedRelation: "modules"
            referencedColumns: ["id"]
          }
        ]
      }
      notes: {
        Row: {
          id: string
          user_id: string
          module_id: string | null
          title: string
          content: string
          tags: string[] | null
          is_private: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          module_id?: string | null
          title: string
          content: string
          tags?: string[] | null
          is_private?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          module_id?: string | null
          title?: string
          content?: string
          tags?: string[] | null
          is_private?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_module_id_fkey"
            columns: ["module_id"]
            referencedRelation: "modules"
            referencedColumns: ["id"]
          }
        ]
      }
      bibliography: {
        Row: {
          id: string
          module_id: string
          title: string
          authors: string[]
          publication_year: number | null
          source_type: 'book' | 'article' | 'website' | 'video' | 'other'
          source_url: string | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          module_id: string
          title: string
          authors: string[]
          publication_year?: number | null
          source_type: 'book' | 'article' | 'website' | 'video' | 'other'
          source_url?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          module_id?: string
          title?: string
          authors?: string[]
          publication_year?: number | null
          source_type?: 'book' | 'article' | 'website' | 'video' | 'other'
          source_url?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bibliography_module_id_fkey"
            columns: ["module_id"]
            referencedRelation: "modules"
            referencedColumns: ["id"]
          }
        ]
      }
      videos: {
        Row: {
          id: string
          module_id: string
          title: string
          description: string | null
          video_url: string
          thumbnail_url: string | null
          duration_seconds: number | null
          video_type: 'youtube' | 'vimeo' | 'uploaded' | 'external'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          module_id: string
          title: string
          description?: string | null
          video_url: string
          thumbnail_url?: string | null
          duration_seconds?: number | null
          video_type: 'youtube' | 'vimeo' | 'uploaded' | 'external'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          module_id?: string
          title?: string
          description?: string | null
          video_url?: string
          thumbnail_url?: string | null
          duration_seconds?: number | null
          video_type?: 'youtube' | 'vimeo' | 'uploaded' | 'external'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_module_id_fkey"
            columns: ["module_id"]
            referencedRelation: "modules"
            referencedColumns: ["id"]
          }
        ]
      }
      password_reset_tokens: {
        Row: {
          id: string
          user_id: string
          token: string
          expires_at: string
          used_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          token: string
          expires_at: string
          used_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          token?: string
          expires_at?: string
          used_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "password_reset_tokens_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      workflow_executions: {
        Row: {
          id: string
          workflow_id: string
          user_id: string
          status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
          current_state: string | null
          variables: Json | null
          input_data: Json | null
          output_data: Json | null
          error_message: string | null
          retry_count: number
          parent_execution_id: string | null
          correlation_id: string | null
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workflow_id: string
          user_id: string
          status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
          current_state?: string | null
          variables?: Json | null
          input_data?: Json | null
          output_data?: Json | null
          error_message?: string | null
          retry_count?: number
          parent_execution_id?: string | null
          correlation_id?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workflow_id?: string
          user_id?: string
          status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
          current_state?: string | null
          variables?: Json | null
          input_data?: Json | null
          output_data?: Json | null
          error_message?: string | null
          retry_count?: number
          parent_execution_id?: string | null
          correlation_id?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_executions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      execution_events: {
        Row: {
          id: string
          execution_id: string
          event_type: string
          state_id: string | null
          action_id: string | null
          event_data: Json | null
          correlation_id: string | null
          causation_id: string | null
          duration_ms: number | null
          timestamp: string
        }
        Insert: {
          id?: string
          execution_id: string
          event_type: string
          state_id?: string | null
          action_id?: string | null
          event_data?: Json | null
          correlation_id?: string | null
          causation_id?: string | null
          duration_ms?: number | null
          timestamp?: string
        }
        Update: {
          id?: string
          execution_id?: string
          event_type?: string
          state_id?: string | null
          action_id?: string | null
          event_data?: Json | null
          correlation_id?: string | null
          causation_id?: string | null
          duration_ms?: number | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "execution_events_execution_id_fkey"
            columns: ["execution_id"]
            referencedRelation: "workflow_executions"
            referencedColumns: ["id"]
          }
        ]
      }
      student_progress: {
        Row: {
          id: string
          user_id: string
          module_id: string
          workflow_execution_id: string | null
          progress_percentage: number
          time_spent_minutes: number
          completed_sections: string[] | null
          current_section: string | null
          achievements: Json | null
          performance_metrics: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          module_id: string
          workflow_execution_id?: string | null
          progress_percentage?: number
          time_spent_minutes?: number
          completed_sections?: string[] | null
          current_section?: string | null
          achievements?: Json | null
          performance_metrics?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          module_id?: string
          workflow_execution_id?: string | null
          progress_percentage?: number
          time_spent_minutes?: number
          completed_sections?: string[] | null
          current_section?: string | null
          achievements?: Json | null
          performance_metrics?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_progress_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_module_id_fkey"
            columns: ["module_id"]
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_workflow_execution_id_fkey"
            columns: ["workflow_execution_id"]
            referencedRelation: "workflow_executions"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      test_connection: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      create_user_profile: {
        Args: {
          user_id: string
        }
        Returns: void
      }
      get_user_progress_summary: {
        Args: {
          user_id: string
        }
        Returns: {
          total_modules: number
          completed_modules: number
          in_progress_modules: number
          total_time_spent: number
          completion_percentage: number
        }
      }
      get_module_analytics: {
        Args: {
          module_id: string
        }
        Returns: {
          total_enrollments: number
          completion_rate: number
          average_time_spent: number
          average_quiz_score: number
        }
      }
    }
    Enums: {
      user_role: 'super_admin' | 'admin' | 'instructor' | 'student' | 'guest'
      module_difficulty: 'beginner' | 'intermediate' | 'advanced'
      progress_status: 'not_started' | 'in_progress' | 'completed' | 'failed'
      theme_preference: 'light' | 'dark'
      source_type: 'book' | 'article' | 'website' | 'video' | 'other'
      video_type: 'youtube' | 'vimeo' | 'uploaded' | 'external'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for common operations
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Specific table types for easier importing
export type User = Tables<'users'>
export type UserProfile = Tables<'user_profiles'>
export type UserSession = Tables<'user_sessions'>
export type Module = Tables<'modules'>
export type Quiz = Tables<'quizzes'>
export type UserProgress = Tables<'user_progress'>
export type Note = Tables<'notes'>
export type Bibliography = Tables<'bibliography'>
export type Video = Tables<'videos'>
export type PasswordResetToken = Tables<'password_reset_tokens'>
export type WorkflowExecution = Tables<'workflow_executions'>
export type ExecutionEvent = Tables<'execution_events'>
export type StudentProgress = Tables<'student_progress'>

// Insert types
export type UserInsert = Inserts<'users'>
export type UserProfileInsert = Inserts<'user_profiles'>
export type UserSessionInsert = Inserts<'user_sessions'>
export type ModuleInsert = Inserts<'modules'>
export type QuizInsert = Inserts<'quizzes'>
export type UserProgressInsert = Inserts<'user_progress'>
export type NoteInsert = Inserts<'notes'>
export type BibliographyInsert = Inserts<'bibliography'>
export type VideoInsert = Inserts<'videos'>
export type PasswordResetTokenInsert = Inserts<'password_reset_tokens'>
export type WorkflowExecutionInsert = Inserts<'workflow_executions'>
export type ExecutionEventInsert = Inserts<'execution_events'>
export type StudentProgressInsert = Inserts<'student_progress'>

// Update types
export type UserUpdate = Updates<'users'>
export type UserProfileUpdate = Updates<'user_profiles'>
export type UserSessionUpdate = Updates<'user_sessions'>
export type ModuleUpdate = Updates<'modules'>
export type QuizUpdate = Updates<'quizzes'>
export type UserProgressUpdate = Updates<'user_progress'>
export type NoteUpdate = Updates<'notes'>
export type BibliographyUpdate = Updates<'bibliography'>
export type VideoUpdate = Updates<'videos'>
export type PasswordResetTokenUpdate = Updates<'password_reset_tokens'>
export type WorkflowExecutionUpdate = Updates<'workflow_executions'>
export type ExecutionEventUpdate = Updates<'execution_events'>
export type StudentProgressUpdate = Updates<'student_progress'>

// Enum types
export type UserRole = Enums<'user_role'>
export type ModuleDifficulty = Enums<'module_difficulty'>
export type ProgressStatus = Enums<'progress_status'>
export type ThemePreference = Enums<'theme_preference'>
export type SourceType = Enums<'source_type'>
export type VideoType = Enums<'video_type'>
