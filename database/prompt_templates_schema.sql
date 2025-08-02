-- Prompt Templates Schema for LLM Customization
-- This schema allows administrators to customize all LLM prompts used in the application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Prompt templates table
CREATE TABLE IF NOT EXISTS prompt_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT NOT NULL UNIQUE, -- Unique identifier for the prompt (e.g., 'content.introduction', 'quiz.generation')
    category TEXT NOT NULL, -- Category: 'content', 'quiz', 'mindmap', 'video', 'bibliography'
    name TEXT NOT NULL, -- Human-readable name
    description TEXT, -- Description of what this prompt does
    template TEXT NOT NULL, -- The actual prompt template with placeholders
    variables JSONB NOT NULL DEFAULT '[]', -- Array of variable definitions [{name, type, description, required}]
    language TEXT NOT NULL DEFAULT 'pt-BR', -- Language of the prompt
    is_active BOOLEAN DEFAULT true,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Prompt template versions for history and rollback
CREATE TABLE IF NOT EXISTS prompt_template_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES prompt_templates(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    template TEXT NOT NULL,
    variables JSONB NOT NULL,
    change_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(template_id, version)
);

-- Prompt execution logs for tracking usage and performance
CREATE TABLE IF NOT EXISTS prompt_execution_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES prompt_templates(id),
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    input_variables JSONB, -- The actual values used for variables
    response_time_ms INTEGER,
    token_count INTEGER,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    user_id UUID REFERENCES auth.users(id)
);

-- Prompt categories metadata
CREATE TABLE IF NOT EXISTS prompt_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default prompt templates (can be customized by admins)
CREATE TABLE IF NOT EXISTS default_prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    template TEXT NOT NULL,
    variables JSONB NOT NULL DEFAULT '[]',
    language TEXT NOT NULL DEFAULT 'pt-BR',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_prompt_templates_category ON prompt_templates(category);
CREATE INDEX idx_prompt_templates_key ON prompt_templates(key);
CREATE INDEX idx_prompt_templates_active ON prompt_templates(is_active);
CREATE INDEX idx_prompt_template_versions_template_id ON prompt_template_versions(template_id);
CREATE INDEX idx_prompt_execution_logs_template_id ON prompt_execution_logs(template_id);
CREATE INDEX idx_prompt_execution_logs_executed_at ON prompt_execution_logs(executed_at);

-- RLS Policies
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE default_prompts ENABLE ROW LEVEL SECURITY;

-- Only admins can manage prompt templates
CREATE POLICY "Admins can manage prompt templates" ON prompt_templates
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE raw_user_meta_data->>'role' = 'admin'
        )
    );

-- All authenticated users can read active prompt templates
CREATE POLICY "Users can read active prompt templates" ON prompt_templates
    FOR SELECT USING (is_active = true);

-- Only admins can view prompt versions
CREATE POLICY "Admins can view prompt versions" ON prompt_template_versions
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Only admins can view execution logs
CREATE POLICY "Admins can view execution logs" ON prompt_execution_logs
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Everyone can read categories
CREATE POLICY "Public can read categories" ON prompt_categories
    FOR SELECT USING (true);

-- Everyone can read default prompts
CREATE POLICY "Public can read default prompts" ON default_prompts
    FOR SELECT USING (true);

-- Function to automatically create a version when updating a prompt template
CREATE OR REPLACE FUNCTION create_prompt_version() RETURNS TRIGGER AS $$
BEGIN
    IF OLD.template IS DISTINCT FROM NEW.template OR OLD.variables IS DISTINCT FROM NEW.variables THEN
        INSERT INTO prompt_template_versions (
            template_id,
            version,
            template,
            variables,
            created_by
        ) VALUES (
            NEW.id,
            NEW.version,
            OLD.template,
            OLD.variables,
            NEW.updated_by
        );
        NEW.version = NEW.version + 1;
    END IF;
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prompt_template_version_trigger
    BEFORE UPDATE ON prompt_templates
    FOR EACH ROW
    EXECUTE FUNCTION create_prompt_version();

-- Insert default categories
INSERT INTO prompt_categories (key, name, description, icon, color, display_order) VALUES
    ('content', 'Content Generation', 'Prompts for generating module content', '📚', '#8B5CF6', 1),
    ('quiz', 'Quiz Generation', 'Prompts for creating quizzes and assessments', '❓', '#3B82F6', 2),
    ('mindmap', 'Mind Map Generation', 'Prompts for creating visual mind maps', '🗺️', '#10B981', 3),
    ('video', 'Video Curation', 'Prompts for finding and curating educational videos', '🎥', '#F59E0B', 4),
    ('bibliography', 'Bibliography Generation', 'Prompts for creating reading lists and references', '📖', '#EC4899', 5)
ON CONFLICT (key) DO NOTHING;