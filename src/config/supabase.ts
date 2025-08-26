/**
 * Supabase Configuration and Client Setup
 * Provides configured Supabase client for database operations and authentication
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

// Environment variables validation
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Check if we're in test environment
const isTestEnvironment = process.env.NODE_ENV === 'test';

// Use mock values for test environment if env vars are not set
const finalSupabaseUrl = supabaseUrl || (isTestEnvironment ? 'https://test.supabase.co' : '');
const finalSupabaseAnonKey = supabaseAnonKey || (isTestEnvironment ? 'test-anon-key' : '');

if (!finalSupabaseUrl || !finalSupabaseAnonKey) {
  if (!isTestEnvironment) {
    throw new Error(
      'Missing Supabase environment variables. Please check your .env file and ensure REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY are set.'
    );
  }
}

// Create Supabase client with type safety
export const supabase: SupabaseClient<Database> = createClient(
  finalSupabaseUrl,
  finalSupabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce', // Use PKCE flow for better security
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
    global: {
      headers: {
        'X-Client-Info': 'jaqedu-web-app',
      },
    },
  }
);

// Database configuration constants
export const DB_CONFIG = {
  // Table names
  TABLES: {
    USERS: 'users',
    USER_PROFILES: 'user_profiles',
    USER_SESSIONS: 'user_sessions',
    MODULES: 'modules',
    QUIZZES: 'quizzes',
    USER_PROGRESS: 'user_progress',
    NOTES: 'notes',
    BIBLIOGRAPHY: 'bibliography',
    VIDEOS: 'videos',
    PASSWORD_RESET_TOKENS: 'password_reset_tokens',
  },
  
  // Storage buckets
  STORAGE: {
    AVATARS: 'avatars',
    DOCUMENTS: 'documents',
    UPLOADS: 'uploads',
    TEMP: 'temp',
  },
  
  // Real-time channels
  CHANNELS: {
    USER_PROGRESS: 'user_progress_changes',
    NOTES: 'notes_changes',
    MODULES: 'modules_changes',
  },
  
  // RLS policies
  POLICIES: {
    SELECT: 'select',
    INSERT: 'insert', 
    UPDATE: 'update',
    DELETE: 'delete',
  },
} as const;

// Authentication configuration
export const AUTH_CONFIG = {
  REDIRECT_URLS: {
    SIGN_IN: `${window.location.origin}/auth/callback`,
    SIGN_OUT: `${window.location.origin}/login`,
    PASSWORD_RESET: `${window.location.origin}/auth/reset-password`,
    EMAIL_CONFIRMATION: `${window.location.origin}/auth/confirm`,
  },
  
  PROVIDERS: {
    GOOGLE: 'google',
    GITHUB: 'github',
    DISCORD: 'discord',
  },
  
  SESSION: {
    DURATION: 24 * 60 * 60, // 24 hours in seconds
    REFRESH_MARGIN: 5 * 60, // 5 minutes in seconds
  },
} as const;

// Database query helpers
export const createDatabaseQuery = {
  // User queries
  users: () => supabase.from(DB_CONFIG.TABLES.USERS),
  userProfiles: () => supabase.from(DB_CONFIG.TABLES.USER_PROFILES),
  userSessions: () => supabase.from(DB_CONFIG.TABLES.USER_SESSIONS),
  
  // Content queries
  modules: () => supabase.from(DB_CONFIG.TABLES.MODULES),
  quizzes: () => supabase.from(DB_CONFIG.TABLES.QUIZZES),
  notes: () => supabase.from(DB_CONFIG.TABLES.NOTES),
  bibliography: () => supabase.from(DB_CONFIG.TABLES.BIBLIOGRAPHY),
  videos: () => supabase.from(DB_CONFIG.TABLES.VIDEOS),
  
  // Progress tracking
  userProgress: () => supabase.from(DB_CONFIG.TABLES.USER_PROGRESS),
  
  // Password reset
  passwordResetTokens: () => supabase.from(DB_CONFIG.TABLES.PASSWORD_RESET_TOKENS),
} as const;

// Storage helpers
export const storage = {
  avatars: () => supabase.storage.from(DB_CONFIG.STORAGE.AVATARS),
  documents: () => supabase.storage.from(DB_CONFIG.STORAGE.DOCUMENTS),
  uploads: () => supabase.storage.from(DB_CONFIG.STORAGE.UPLOADS),
  temp: () => supabase.storage.from(DB_CONFIG.STORAGE.TEMP),
} as const;

// Real-time subscription helpers
export const subscriptions = {
  userProgress: (userId: string, callback: (payload: any) => void) =>
    supabase
      .channel(DB_CONFIG.CHANNELS.USER_PROGRESS)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: DB_CONFIG.TABLES.USER_PROGRESS,
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe(),
      
  notes: (userId: string, callback: (payload: any) => void) =>
    supabase
      .channel(DB_CONFIG.CHANNELS.NOTES)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: DB_CONFIG.TABLES.NOTES,
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe(),
      
  modules: (callback: (payload: any) => void) =>
    supabase
      .channel(DB_CONFIG.CHANNELS.MODULES)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: DB_CONFIG.TABLES.MODULES,
        },
        callback
      )
      .subscribe(),
} as const;

// Utility functions
export const supabaseUtils = {
  // Check if client is properly configured
  isConfigured: () => !!finalSupabaseUrl && !!finalSupabaseAnonKey,
  
  // Get current session
  getCurrentSession: () => supabase.auth.getSession(),
  
  // Get current user
  getCurrentUser: () => supabase.auth.getUser(),
  
  // Sign out
  signOut: () => supabase.auth.signOut(),
  
  // Health check
  healthCheck: async () => {
    try {
      // Use a simple query on the users table to check if the database is accessible
      const { data, error } = await supabase.from(DB_CONFIG.TABLES.USERS).select('id').limit(1);
      return { healthy: !error, error };
    } catch (error) {
      return { healthy: false, error };
    }
  },
  
  // Database connection test
  testConnection: async () => {
    try {
      const { data, error } = await supabase.rpc('test_connection');
      return { connected: !error, data, error };
    } catch (error) {
      return { connected: false, data: null, error };
    }
  },
} as const;

export default supabase;