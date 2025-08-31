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

// Additional utility functions for testing and configuration

/**
 * Supabase configuration interface
 */
export interface SupabaseConfig {
  url: string;
  anonKey: string;
  options?: {
    auth?: {
      autoRefreshToken?: boolean;
      persistSession?: boolean;
      detectSessionInUrl?: boolean;
      flowType?: 'implicit' | 'pkce';
    };
    realtime?: {
      params?: {
        eventsPerSecond?: number;
      };
    };
    global?: {
      headers?: Record<string, string>;
    };
  };
}

/**
 * Creates a Supabase client with custom configuration
 * Useful for testing and custom client setups
 */
export const createSupabaseClient = (config: SupabaseConfig): SupabaseClient<Database> => {
  return createClient(config.url, config.anonKey, config.options);
};

/**
 * Validates Supabase configuration
 * Throws error if configuration is invalid
 */
export const validateSupabaseConfig = (config: SupabaseConfig): void => {
  if (!config) {
    throw new Error('Supabase configuration is required');
  }

  if (!config.url) {
    throw new Error('Supabase URL is required');
  }

  if (!config.anonKey) {
    throw new Error('Supabase anonymous key is required');
  }

  // Validate URL format
  try {
    const url = new URL(config.url);
    
    // Check for valid Supabase URL patterns
    if (!url.hostname.includes('supabase') && 
        !url.hostname.includes('localhost') && 
        !url.hostname.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
      throw new Error('Invalid Supabase URL format');
    }

    // In production, ensure HTTPS is used (except for localhost/IP)
    if (process.env.NODE_ENV === 'production' && 
        url.protocol === 'http:' && 
        !url.hostname.includes('localhost') && 
        !url.hostname.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
      throw new Error('Supabase URL must use HTTPS in production');
    }
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Invalid Supabase URL format');
    }
    throw error;
  }

  // Validate anonymous key format (basic check)
  if (config.anonKey.length < 20) {
    throw new Error('Invalid Supabase anonymous key format');
  }
};

/**
 * Gets the Supabase URL from environment or throws error
 */
export const getSupabaseUrl = (): string => {
  const url = process.env.REACT_APP_SUPABASE_URL;
  if (!url) {
    if (process.env.NODE_ENV === 'test') {
      return 'https://test.supabase.co';
    }
    throw new Error('REACT_APP_SUPABASE_URL environment variable is not set');
  }
  return url;
};

/**
 * Gets the Supabase anonymous key from environment or throws error
 */
export const getSupabaseAnonKey = (): string => {
  const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
  if (!anonKey) {
    if (process.env.NODE_ENV === 'test') {
      return 'test-anon-key-12345678901234567890';
    }
    throw new Error('REACT_APP_SUPABASE_ANON_KEY environment variable is not set');
  }
  return anonKey;
};

/**
 * Creates a test Supabase client with mock configuration
 * Useful for unit tests
 */
export const createTestSupabaseClient = (): SupabaseClient<Database> => {
  const testConfig: SupabaseConfig = {
    url: 'https://test.supabase.co',
    anonKey: 'test-anon-key-12345678901234567890',
    options: {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    }
  };
  
  return createSupabaseClient(testConfig);
};

/**
 * Environment-aware Supabase configuration
 */
export const getSupabaseConfig = (): SupabaseConfig => {
  return {
    url: getSupabaseUrl(),
    anonKey: getSupabaseAnonKey(),
    options: {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      },
      global: {
        headers: {
          'X-Client-Info': 'jaqedu-web-app'
        }
      }
    }
  };
};

/**
 * Checks if the current environment is configured for Supabase
 */
export const isSupabaseConfigured = (): boolean => {
  try {
    getSupabaseUrl();
    getSupabaseAnonKey();
    return true;
  } catch {
    return false;
  }
};

export default supabase;