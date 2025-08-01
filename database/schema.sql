-- JaqEdu Database Schema for Supabase
-- This file contains the complete database schema for the educational platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types (enums)
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'instructor', 'student', 'guest');
CREATE TYPE module_difficulty AS ENUM ('beginner', 'intermediate', 'advanced'); 
CREATE TYPE progress_status AS ENUM ('not_started', 'in_progress', 'completed', 'failed');
CREATE TYPE theme_preference AS ENUM ('light', 'dark');
CREATE TYPE source_type AS ENUM ('book', 'article', 'website', 'video', 'other');
CREATE TYPE video_type AS ENUM ('youtube', 'vimeo', 'uploaded', 'external');
CREATE TYPE mindmap_layout AS ENUM ('tree', 'radial', 'force', 'hierarchical');

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    role user_role DEFAULT 'student' NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    is_verified BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_login TIMESTAMPTZ,
    email_verified_at TIMESTAMPTZ,
    avatar_url TEXT,
    
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_username CHECK (username ~ '^[a-zA-Z0-9_-]{3,30}$')
);

-- User profiles table
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    bio TEXT,
    phone TEXT,
    timezone TEXT DEFAULT 'UTC',
    language TEXT DEFAULT 'pt-BR' NOT NULL,
    theme theme_preference DEFAULT 'light' NOT NULL,
    email_notifications BOOLEAN DEFAULT true NOT NULL,
    push_notifications BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT valid_phone CHECK (phone IS NULL OR phone ~ '^\+?[1-9]\d{1,14}$')
);

-- User sessions table
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    device_name TEXT,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_activity TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    
    UNIQUE(user_id, device_id)
);

-- Modules table
CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    content JSONB NOT NULL,
    difficulty module_difficulty DEFAULT 'beginner' NOT NULL,
    duration_minutes INTEGER,
    tags TEXT[],
    language TEXT DEFAULT 'pt-BR' NOT NULL,
    is_published BOOLEAN DEFAULT false NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    version INTEGER DEFAULT 1 NOT NULL,
    prerequisites TEXT[],
    learning_objectives TEXT[],
    
    CONSTRAINT valid_duration CHECK (duration_minutes IS NULL OR duration_minutes > 0),
    CONSTRAINT valid_version CHECK (version > 0)
);

-- Quizzes table
CREATE TABLE quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    questions JSONB NOT NULL,
    passing_score INTEGER DEFAULT 70 NOT NULL,
    time_limit_minutes INTEGER,
    max_attempts INTEGER,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT valid_passing_score CHECK (passing_score >= 0 AND passing_score <= 100),
    CONSTRAINT valid_time_limit CHECK (time_limit_minutes IS NULL OR time_limit_minutes > 0),
    CONSTRAINT valid_max_attempts CHECK (max_attempts IS NULL OR max_attempts > 0)
);

-- User progress table
CREATE TABLE user_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    status progress_status DEFAULT 'not_started' NOT NULL,
    progress_percentage INTEGER DEFAULT 0 NOT NULL,
    time_spent_minutes INTEGER DEFAULT 0 NOT NULL,
    last_accessed TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ,
    quiz_attempts JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    UNIQUE(user_id, module_id),
    CONSTRAINT valid_progress CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    CONSTRAINT valid_time_spent CHECK (time_spent_minutes >= 0),
    CONSTRAINT completion_logic CHECK (
        (status = 'completed' AND completed_at IS NOT NULL AND progress_percentage = 100) 
        OR 
        (status != 'completed')
    )
);

-- Notes table
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    module_id UUID REFERENCES modules(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[],
    is_private BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Mind maps table
CREATE TABLE mindmaps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    module_id UUID REFERENCES modules(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    data JSONB NOT NULL,
    layout mindmap_layout DEFAULT 'tree' NOT NULL,
    is_public BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Bibliography table
CREATE TABLE bibliography (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    authors TEXT[] NOT NULL,
    publication_year INTEGER,
    source_type source_type NOT NULL,
    source_url TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT valid_year CHECK (publication_year IS NULL OR (publication_year >= 1000 AND publication_year <= EXTRACT(YEAR FROM NOW()) + 1)),
    CONSTRAINT valid_url CHECK (source_url IS NULL OR source_url ~* '^https?://.+')
);

-- Videos table
CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration_seconds INTEGER,
    video_type video_type NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT valid_duration CHECK (duration_seconds IS NULL OR duration_seconds > 0),
    CONSTRAINT valid_video_url CHECK (video_url ~* '^https?://.+'),
    CONSTRAINT valid_thumbnail_url CHECK (thumbnail_url IS NULL OR thumbnail_url ~* '^https?://.+')
);

-- Password reset tokens table
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);

CREATE INDEX idx_modules_published ON modules(is_published);
CREATE INDEX idx_modules_difficulty ON modules(difficulty);
CREATE INDEX idx_modules_language ON modules(language);
CREATE INDEX idx_modules_created_by ON modules(created_by);
CREATE INDEX idx_modules_tags ON modules USING GIN(tags);

CREATE INDEX idx_quizzes_module_id ON quizzes(module_id);
CREATE INDEX idx_quizzes_active ON quizzes(is_active);
CREATE INDEX idx_quizzes_created_by ON quizzes(created_by);

CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_module_id ON user_progress(module_id);
CREATE INDEX idx_user_progress_status ON user_progress(status);
CREATE INDEX idx_user_progress_last_accessed ON user_progress(last_accessed);

CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_module_id ON notes(module_id);
CREATE INDEX idx_notes_private ON notes(is_private);
CREATE INDEX idx_notes_tags ON notes USING GIN(tags);

CREATE INDEX idx_mindmaps_user_id ON mindmaps(user_id);
CREATE INDEX idx_mindmaps_module_id ON mindmaps(module_id);
CREATE INDEX idx_mindmaps_public ON mindmaps(is_public);

CREATE INDEX idx_bibliography_module_id ON bibliography(module_id);
CREATE INDEX idx_bibliography_type ON bibliography(source_type);

CREATE INDEX idx_videos_module_id ON videos(module_id);
CREATE INDEX idx_videos_type ON videos(video_type);

CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);

-- Create functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_sessions_updated_at BEFORE UPDATE ON user_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON quizzes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mindmaps_updated_at BEFORE UPDATE ON mindmaps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bibliography_updated_at BEFORE UPDATE ON bibliography FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();  
CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Utility functions
CREATE OR REPLACE FUNCTION test_connection()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_user_profile(user_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_profiles (user_id)
    VALUES (user_id)
    ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_progress_summary(user_id UUID)
RETURNS TABLE(
    total_modules BIGINT,
    completed_modules BIGINT,
    in_progress_modules BIGINT,
    total_time_spent BIGINT,
    completion_percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_modules,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_modules,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_modules,
        COALESCE(SUM(time_spent_minutes), 0) as total_time_spent,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
            ELSE 0
        END as completion_percentage
    FROM user_progress up
    WHERE up.user_id = get_user_progress_summary.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_module_analytics(module_id UUID)
RETURNS TABLE(
    total_enrollments BIGINT,
    completion_rate NUMERIC,
    average_time_spent NUMERIC,
    average_quiz_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_enrollments,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
            ELSE 0
        END as completion_rate,
        ROUND(AVG(time_spent_minutes), 2) as average_time_spent,
        ROUND(AVG((quiz_attempts->>'best_score')::NUMERIC), 2) as average_quiz_score
    FROM user_progress up
    WHERE up.module_id = get_module_analytics.module_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;