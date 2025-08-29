# 🗄️ jaqEdu Database Schema Documentation

## Overview

jaqEdu uses PostgreSQL via Supabase with a comprehensive schema supporting educational content, user management, progress tracking, and AI-generated content.

## 📊 Entity Relationship Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   auth.users    │    │     users       │────│  user_profiles  │
│  (Supabase)     │────│                 │    │                 │
│                 │    │ • id (UUID)     │    │ • user_id (FK)  │
│ • id (UUID)     │    │ • email         │    │ • first_name    │
│ • email         │    │ • username      │    │ • last_name     │
│ • created_at    │    │ • role          │    │ • bio           │
└─────────────────┘    │ • is_active     │    │ • timezone      │
                       │ • is_verified   │    │ • language      │
                       └─────────────────┘    └─────────────────┘
                                │
                ┌───────────────┴───────────────┐
                │                               │
        ┌───────▼────────┐            ┌────────▼────────┐
        │ user_sessions  │            │ password_reset  │
        │                │            │    _tokens      │
        │ • user_id (FK) │            │                 │
        │ • device_id    │            │ • user_id (FK)  │
        │ • ip_address   │            │ • token         │
        │ • expires_at   │            │ • expires_at    │
        └────────────────┘            └─────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    modules      │────│    quizzes      │    │ user_progress   │
│                 │    │                 │    │                 │
│ • id (UUID)     │    │ • module_id(FK) │    │ • user_id (FK)  │
│ • title         │────│ • questions     │────│ • module_id(FK) │
│ • content       │    │ • passing_score │    │ • status        │
│ • difficulty    │    │ • time_limit    │    │ • progress_%    │
│ • created_by    │    └─────────────────┘    │ • quiz_attempts │
└─────────────────┘                            └─────────────────┘
         │
    ┌────┴────┬─────────┬──────────┐
    │         │         │          │
┌───▼──┐  ┌──▼───┐  ┌─▼────┐  ┌──▼────┐
│notes │  │videos│  │biblio│
│      │  │      │  │graphy│
└──────┘  └──────┘  └──────┘
```

## 📋 Table Definitions

### Core Tables

#### `users`
Primary user table extending Supabase auth.
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    role user_role DEFAULT 'student',
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    email_verified_at TIMESTAMPTZ,
    avatar_url TEXT
);
```

**Constraints**:
- Valid email format
- Username: 3-30 characters, alphanumeric + underscore/dash
- Foreign key to Supabase auth.users

#### `user_profiles`
Extended user information.
```sql
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id),
    first_name TEXT,
    last_name TEXT,
    bio TEXT,
    phone TEXT,
    timezone TEXT DEFAULT 'UTC',
    language TEXT DEFAULT 'pt-BR',
    theme theme_preference DEFAULT 'light',
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `user_sessions`
Active user sessions tracking.
```sql
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    device_id TEXT NOT NULL,
    device_name TEXT,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    UNIQUE(user_id, device_id)
);
```

### Content Tables

#### `modules`
Educational content modules.
```sql
CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    content JSONB NOT NULL,
    difficulty module_difficulty DEFAULT 'beginner',
    duration_minutes INTEGER,
    tags TEXT[],
    language TEXT DEFAULT 'pt-BR',
    is_published BOOLEAN DEFAULT false,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    prerequisites TEXT[],
    learning_objectives TEXT[]
);
```

**Content JSONB Structure**:
```json
{
  "sections": [
    {
      "id": "string",
      "title": "string",
      "content": "string",
      "type": "text|video|quiz"
    }
  ],
  "glossary": {
    "term": "definition"
  },
  "metadata": {
    "keywords": ["string"],
    "summary": "string"
  }
}
```

#### `quizzes`
Module assessment quizzes.
```sql
CREATE TABLE quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES modules(id),
    title TEXT NOT NULL,
    description TEXT,
    questions JSONB NOT NULL,
    passing_score INTEGER DEFAULT 70,
    time_limit_minutes INTEGER,
    max_attempts INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Questions JSONB Structure**:
```json
{
  "questions": [
    {
      "id": "string",
      "text": "string",
      "type": "multiple_choice|true_false|essay",
      "options": ["string"],
      "correct_answer": "string|number",
      "explanation": "string",
      "points": "number"
    }
  ]
}
```

### Progress Tracking

#### `user_progress`
Tracks user progress through modules.
```sql
CREATE TABLE user_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    module_id UUID NOT NULL REFERENCES modules(id),
    status progress_status DEFAULT 'not_started',
    progress_percentage INTEGER DEFAULT 0,
    time_spent_minutes INTEGER DEFAULT 0,
    last_accessed TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    quiz_attempts JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, module_id)
);
```

**Quiz Attempts JSONB Structure**:
```json
{
  "attempts": [
    {
      "attempt_number": "number",
      "score": "number",
      "passed": "boolean",
      "attempted_at": "timestamp",
      "time_spent_seconds": "number",
      "answers": {
        "question_id": "selected_answer"
      }
    }
  ],
  "best_score": "number",
  "total_attempts": "number"
}
```

### User Content

#### `notes`
User-created notes.
```sql
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    module_id UUID REFERENCES modules(id),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[],
    is_private BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```


### Resources

#### `bibliography`
Academic references and resources.
```sql
CREATE TABLE bibliography (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES modules(id),
    title TEXT NOT NULL,
    authors TEXT[] NOT NULL,
    publication_year INTEGER,
    source_type source_type NOT NULL,
    source_url TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `videos`
Educational video resources.
```sql
CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES modules(id),
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration_seconds INTEGER,
    video_type video_type NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🔢 Enumerations

### User and System Enums

```sql
CREATE TYPE user_role AS ENUM (
    'super_admin',    -- Full system access
    'admin',          -- Platform administration
    'instructor',     -- Content creation and management
    'student',        -- Learning access
    'guest'          -- Limited read-only access
);

CREATE TYPE module_difficulty AS ENUM (
    'beginner',      -- No prerequisites
    'intermediate',  -- Some knowledge required
    'advanced'       -- Expert level
);

CREATE TYPE progress_status AS ENUM (
    'not_started',   -- Module not accessed
    'in_progress',   -- Currently learning
    'completed',     -- Successfully finished
    'failed'         -- Did not pass requirements
);
```

### UI and Content Enums

```sql
CREATE TYPE theme_preference AS ENUM (
    'light',         -- Light theme
    'dark'           -- Dark theme
);

CREATE TYPE source_type AS ENUM (
    'book',          -- Published books
    'article',       -- Academic articles
    'website',       -- Web resources
    'video',         -- Video content
    'other'          -- Other sources
);

CREATE TYPE video_type AS ENUM (
    'youtube',       -- YouTube videos
    'vimeo',         -- Vimeo videos
    'uploaded',      -- Self-hosted
    'external'       -- Other platforms
);

```

## 📑 Indexes

### Performance Indexes

```sql
-- User-related indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);

-- Module indexes
CREATE INDEX idx_modules_published ON modules(is_published);
CREATE INDEX idx_modules_difficulty ON modules(difficulty);
CREATE INDEX idx_modules_language ON modules(language);
CREATE INDEX idx_modules_tags ON modules USING GIN(tags);

-- Progress tracking
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_module_id ON user_progress(module_id);
CREATE INDEX idx_user_progress_status ON user_progress(status);

-- Content indexes
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_tags ON notes USING GIN(tags);
CREATE INDEX idx_bibliography_module_id ON bibliography(module_id);
CREATE INDEX idx_videos_module_id ON videos(module_id);
```

## 🔧 Functions and Triggers

### Automatic Timestamp Updates

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
-- (Similar triggers for all tables)
```

### Utility Functions

```sql
-- Get user progress summary
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

-- Get module analytics
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
```

## 🔐 Row Level Security (RLS)

### RLS Policies Examples

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
-- (Enable for all tables)

-- Users can only see their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Anyone can view published modules
CREATE POLICY "Anyone can view published modules" ON modules
    FOR SELECT USING (is_published = true);

-- Only instructors and admins can create modules
CREATE POLICY "Instructors can create modules" ON modules
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('instructor', 'admin', 'super_admin')
        )
    );

-- Users can only manage their own notes
CREATE POLICY "Users manage own notes" ON notes
    FOR ALL USING (auth.uid() = user_id);
```

## 📊 Database Relationships

### Primary Relationships

1. **One-to-One**
   - `users` ↔ `user_profiles`
   - `auth.users` ↔ `users`

2. **One-to-Many**
   - `users` → `user_sessions`
   - `users` → `notes`
   - `modules` → `quizzes`
   - `modules` → `bibliography`
   - `modules` → `videos`

3. **Many-to-Many**
   - `users` ↔ `modules` (via `user_progress`)

### Cascading Rules

- **CASCADE DELETE**: When a user is deleted, all related data is removed
- **SET NULL**: When a module is deleted, notes remain but module_id becomes NULL
- **RESTRICT**: Cannot delete modules with active user progress

## 🚀 Performance Considerations

### Optimization Strategies

1. **Indexing**
   - All foreign keys are indexed
   - GIN indexes for array fields (tags, prerequisites)
   - Composite indexes for frequently joined columns

2. **Partitioning**
   - Consider partitioning `user_progress` by created_at for large datasets
   - Partition `user_sessions` by expires_at for easier cleanup

3. **Materialized Views**
   - User dashboard statistics
   - Module completion rates
   - Popular content rankings

4. **Query Optimization**
   - Use prepared statements
   - Batch operations where possible
   - Leverage database functions for complex queries

---

*This schema is designed for scalability, security, and educational platform requirements. Regular maintenance and monitoring of indexes and query performance is recommended.*