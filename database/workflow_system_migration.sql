-- ============================================================================
-- JaqEdu Workflow System Database Migration
-- Extends existing schema with comprehensive workflow management capabilities
-- ============================================================================

-- Enable necessary extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUMS for Workflow System
-- ============================================================================

-- Workflow categories
CREATE TYPE workflow_category AS ENUM (
    'learning_path',
    'assessment',
    'approval',
    'notification',
    'analytics',
    'content_generation',
    'user_onboarding',
    'certification',
    'progress_tracking',
    'adaptive_learning'
);

-- Execution statuses
CREATE TYPE execution_status AS ENUM (
    'pending',
    'running',
    'waiting',
    'paused',
    'completed',
    'failed',
    'cancelled'
);

-- Workflow trigger types
CREATE TYPE trigger_type AS ENUM (
    'event',
    'schedule',
    'manual',
    'webhook',
    'database_change',
    'user_action'
);

-- State types
CREATE TYPE state_type AS ENUM (
    'task',
    'decision',
    'parallel',
    'wait',
    'subprocess',
    'end'
);

-- Action types
CREATE TYPE action_type AS ENUM (
    'execute_plugin',
    'send_notification',
    'update_database',
    'call_api',
    'wait',
    'condition_check',
    'parallel_execution',
    'subprocess',
    'user_task',
    'timer',
    'script'
);

-- Approval statuses
CREATE TYPE approval_status AS ENUM (
    'pending',
    'in_review',
    'approved',
    'rejected',
    'revision_required'
);

-- Approval priorities
CREATE TYPE approval_priority AS ENUM (
    'low',
    'normal', 
    'high',
    'urgent'
);

-- ============================================================================
-- CORE WORKFLOW TABLES
-- ============================================================================

-- Workflow definitions table
CREATE TABLE workflow_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    version TEXT NOT NULL DEFAULT '1.0.0',
    category workflow_category NOT NULL,
    trigger_config JSONB NOT NULL,
    states_config JSONB NOT NULL,
    transitions_config JSONB NOT NULL,
    variables_config JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT workflow_name_version_unique UNIQUE(name, version),
    CONSTRAINT valid_trigger_config CHECK (jsonb_typeof(trigger_config) = 'object'),
    CONSTRAINT valid_states_config CHECK (jsonb_typeof(states_config) = 'array'),
    CONSTRAINT valid_transitions_config CHECK (jsonb_typeof(transitions_config) = 'array')
);

-- Workflow executions table
CREATE TABLE workflow_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status execution_status DEFAULT 'pending' NOT NULL,
    current_state TEXT,
    variables JSONB DEFAULT '{}',
    input_data JSONB,
    output_data JSONB,
    execution_history JSONB DEFAULT '[]',
    error_message TEXT,
    retry_count INTEGER DEFAULT 0 NOT NULL,
    parent_execution_id UUID REFERENCES workflow_executions(id) ON DELETE CASCADE,
    correlation_id TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT valid_retry_count CHECK (retry_count >= 0),
    CONSTRAINT completion_logic CHECK (
        (status = 'completed' AND completed_at IS NOT NULL) 
        OR 
        (status != 'completed')
    )
);

-- Workflow events table (audit trail and debugging)
CREATE TABLE workflow_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    state_id TEXT,
    action_id TEXT,
    event_data JSONB NOT NULL,
    correlation_id TEXT,
    causation_id TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT valid_duration CHECK (duration_ms IS NULL OR duration_ms >= 0)
);

-- Workflow schedules table
CREATE TABLE workflow_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    cron_expression TEXT NOT NULL,
    timezone TEXT DEFAULT 'UTC',
    input_data JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    next_run_at TIMESTAMPTZ,
    last_run_at TIMESTAMPTZ,
    last_execution_id UUID REFERENCES workflow_executions(id),
    failure_count INTEGER DEFAULT 0 NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT valid_failure_count CHECK (failure_count >= 0),
    CONSTRAINT valid_next_run CHECK (next_run_at IS NULL OR next_run_at > NOW())
);

-- ============================================================================
-- EDUCATIONAL WORKFLOW SPECIFIC TABLES
-- ============================================================================

-- Learning path executions
CREATE TABLE learning_path_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    path_id TEXT NOT NULL,
    current_module_id UUID REFERENCES modules(id),
    completed_modules UUID[],
    progress_percentage INTEGER DEFAULT 0,
    adaptation_data JSONB DEFAULT '{}',
    personalization_data JSONB DEFAULT '{}',
    performance_metrics JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    UNIQUE(user_id, path_id),
    CONSTRAINT valid_progress CHECK (progress_percentage >= 0 AND progress_percentage <= 100)
);

-- Assessment executions
CREATE TABLE assessment_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assessment_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    current_question INTEGER DEFAULT 0,
    answers JSONB DEFAULT '[]',
    score INTEGER,
    time_spent_seconds INTEGER DEFAULT 0,
    settings JSONB DEFAULT '{}',
    is_completed BOOLEAN DEFAULT false,
    started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT valid_current_question CHECK (current_question >= 0),
    CONSTRAINT valid_score CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
    CONSTRAINT valid_time_spent CHECK (time_spent_seconds >= 0)
);

-- Approval workflows
CREATE TABLE approval_workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
    content_id UUID NOT NULL,
    content_type TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewers UUID[] DEFAULT '{}',
    status approval_status DEFAULT 'pending' NOT NULL,
    priority approval_priority DEFAULT 'normal' NOT NULL,
    due_date TIMESTAMPTZ,
    approval_notes TEXT,
    feedback JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    approved_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT valid_due_date CHECK (due_date IS NULL OR due_date > created_at),
    CONSTRAINT approval_completion_logic CHECK (
        (status = 'approved' AND approved_at IS NOT NULL) 
        OR (status = 'rejected' AND rejected_at IS NOT NULL)
        OR (status NOT IN ('approved', 'rejected'))
    )
);

-- Adaptive content selections
CREATE TABLE adaptive_content_selections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id TEXT NOT NULL,
    learner_profile JSONB NOT NULL,
    available_variants JSONB NOT NULL,
    selected_variant_id TEXT,
    adaptation_rules JSONB DEFAULT '[]',
    performance_data JSONB DEFAULT '{}',
    selection_rationale TEXT,
    effectiveness_score DECIMAL(3,2),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT valid_effectiveness_score CHECK (
        effectiveness_score IS NULL OR (effectiveness_score >= 0 AND effectiveness_score <= 1)
    )
);

-- Student achievements from workflows
CREATE TABLE workflow_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_type TEXT NOT NULL,
    achievement_data JSONB NOT NULL,
    points_awarded INTEGER DEFAULT 0,
    milestone_reached TEXT,
    triggered_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT valid_points CHECK (points_awarded >= 0)
);

-- ============================================================================
-- PLUGIN AND CONFIGURATION TABLES
-- ============================================================================

-- Workflow plugins registry
CREATE TABLE workflow_plugins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    version TEXT NOT NULL,
    description TEXT,
    config_schema JSONB,
    is_active BOOLEAN DEFAULT true,
    author TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Plugin executions for monitoring
CREATE TABLE plugin_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
    plugin_name TEXT NOT NULL,
    action_id TEXT NOT NULL,
    input_data JSONB,
    output_data JSONB,
    duration_ms INTEGER,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT valid_duration CHECK (duration_ms IS NULL OR duration_ms >= 0)
);

-- Workflow templates for quick creation
CREATE TABLE workflow_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    category workflow_category NOT NULL,
    template_data JSONB NOT NULL,
    is_public BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    rating DECIMAL(2,1),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT valid_rating CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5)),
    CONSTRAINT valid_usage_count CHECK (usage_count >= 0)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Workflow definitions indexes
CREATE INDEX idx_workflow_definitions_category ON workflow_definitions(category);
CREATE INDEX idx_workflow_definitions_active ON workflow_definitions(is_active);
CREATE INDEX idx_workflow_definitions_created_by ON workflow_definitions(created_by);
CREATE INDEX idx_workflow_definitions_name ON workflow_definitions(name);

-- Workflow executions indexes
CREATE INDEX idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_user_id ON workflow_executions(user_id);
CREATE INDEX idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX idx_workflow_executions_started_at ON workflow_executions(started_at);
CREATE INDEX idx_workflow_executions_correlation ON workflow_executions(correlation_id);
CREATE INDEX idx_workflow_executions_parent ON workflow_executions(parent_execution_id);

-- Workflow events indexes
CREATE INDEX idx_workflow_events_execution_id ON workflow_events(execution_id);
CREATE INDEX idx_workflow_events_type ON workflow_events(event_type);
CREATE INDEX idx_workflow_events_created_at ON workflow_events(created_at);
CREATE INDEX idx_workflow_events_correlation ON workflow_events(correlation_id);

-- Workflow schedules indexes
CREATE INDEX idx_workflow_schedules_active ON workflow_schedules(is_active);
CREATE INDEX idx_workflow_schedules_next_run ON workflow_schedules(next_run_at) WHERE is_active = true;
CREATE INDEX idx_workflow_schedules_workflow_id ON workflow_schedules(workflow_id);

-- Educational workflow indexes
CREATE INDEX idx_learning_path_executions_user ON learning_path_executions(user_id);
CREATE INDEX idx_learning_path_executions_path ON learning_path_executions(path_id);
CREATE INDEX idx_learning_path_executions_execution ON learning_path_executions(execution_id);

CREATE INDEX idx_assessment_executions_user ON assessment_executions(user_id);
CREATE INDEX idx_assessment_executions_assessment ON assessment_executions(assessment_id);
CREATE INDEX idx_assessment_executions_session ON assessment_executions(session_id);
CREATE INDEX idx_assessment_executions_completed ON assessment_executions(is_completed);

CREATE INDEX idx_approval_workflows_status ON approval_workflows(status);
CREATE INDEX idx_approval_workflows_reviewer ON approval_workflows(assigned_reviewer_id);
CREATE INDEX idx_approval_workflows_author ON approval_workflows(author_id);
CREATE INDEX idx_approval_workflows_priority ON approval_workflows(priority);
CREATE INDEX idx_approval_workflows_due_date ON approval_workflows(due_date) WHERE due_date IS NOT NULL;

CREATE INDEX idx_adaptive_content_selections_user ON adaptive_content_selections(user_id);
CREATE INDEX idx_adaptive_content_selections_topic ON adaptive_content_selections(topic_id);

CREATE INDEX idx_workflow_achievements_user ON workflow_achievements(user_id);
CREATE INDEX idx_workflow_achievements_type ON workflow_achievements(achievement_type);

CREATE INDEX idx_plugin_executions_execution ON plugin_executions(execution_id);
CREATE INDEX idx_plugin_executions_plugin ON plugin_executions(plugin_name);
CREATE INDEX idx_plugin_executions_success ON plugin_executions(success);

CREATE INDEX idx_workflow_templates_category ON workflow_templates(category);
CREATE INDEX idx_workflow_templates_public ON workflow_templates(is_public);
CREATE INDEX idx_workflow_templates_created_by ON workflow_templates(created_by);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================================================

-- Update triggers for all workflow tables
CREATE TRIGGER update_workflow_definitions_updated_at 
    BEFORE UPDATE ON workflow_definitions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_executions_updated_at 
    BEFORE UPDATE ON workflow_executions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_schedules_updated_at 
    BEFORE UPDATE ON workflow_schedules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_path_executions_updated_at 
    BEFORE UPDATE ON learning_path_executions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessment_executions_updated_at 
    BEFORE UPDATE ON assessment_executions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_approval_workflows_updated_at 
    BEFORE UPDATE ON approval_workflows 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_adaptive_content_selections_updated_at 
    BEFORE UPDATE ON adaptive_content_selections 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_plugins_updated_at 
    BEFORE UPDATE ON workflow_plugins 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_templates_updated_at 
    BEFORE UPDATE ON workflow_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- UTILITY FUNCTIONS FOR WORKFLOW SYSTEM
-- ============================================================================

-- Function to get workflow execution summary
CREATE OR REPLACE FUNCTION get_workflow_execution_summary(workflow_id UUID, days INTEGER DEFAULT 30)
RETURNS TABLE(
    total_executions BIGINT,
    successful_executions BIGINT,
    failed_executions BIGINT,
    average_duration_minutes NUMERIC,
    success_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_executions,
        COUNT(*) FILTER (WHERE status = 'completed') as successful_executions,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_executions,
        ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - started_at))/60), 2) as average_duration_minutes,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
            ELSE 0
        END as success_rate
    FROM workflow_executions we
    WHERE we.workflow_id = get_workflow_execution_summary.workflow_id
    AND we.started_at >= NOW() - (days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user learning progress from workflows
CREATE OR REPLACE FUNCTION get_user_learning_progress_summary(user_id UUID)
RETURNS TABLE(
    total_learning_paths INTEGER,
    completed_paths INTEGER,
    current_modules UUID[],
    total_assessments INTEGER,
    average_assessment_score NUMERIC,
    achievements_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT lpe.path_id)::INTEGER as total_learning_paths,
        COUNT(DISTINCT lpe.path_id) FILTER (WHERE lpe.progress_percentage = 100)::INTEGER as completed_paths,
        ARRAY_AGG(DISTINCT lpe.current_module_id) FILTER (WHERE lpe.current_module_id IS NOT NULL) as current_modules,
        COUNT(DISTINCT ae.assessment_id)::INTEGER as total_assessments,
        ROUND(AVG(ae.score), 2) as average_assessment_score,
        COUNT(DISTINCT wa.id)::INTEGER as achievements_count
    FROM learning_path_executions lpe
    FULL OUTER JOIN assessment_executions ae ON ae.user_id = lpe.user_id
    FULL OUTER JOIN workflow_achievements wa ON wa.user_id = COALESCE(lpe.user_id, ae.user_id)
    WHERE COALESCE(lpe.user_id, ae.user_id, wa.user_id) = get_user_learning_progress_summary.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check workflow dependencies
CREATE OR REPLACE FUNCTION check_workflow_dependencies(definition_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    dependencies TEXT[];
    dep TEXT;
    exists_count INTEGER;
BEGIN
    -- Extract dependencies from metadata
    SELECT COALESCE(metadata->>'dependencies', '[]')::TEXT[] INTO dependencies
    FROM workflow_definitions 
    WHERE id = definition_id;
    
    -- Check if all dependencies exist and are active
    FOREACH dep IN ARRAY dependencies
    LOOP
        SELECT COUNT(*) INTO exists_count
        FROM workflow_definitions 
        WHERE name = dep AND is_active = true;
        
        IF exists_count = 0 THEN
            RETURN FALSE;
        END IF;
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old workflow executions
CREATE OR REPLACE FUNCTION cleanup_old_workflow_executions(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete old completed executions and their related data
    WITH deleted_executions AS (
        DELETE FROM workflow_executions 
        WHERE status IN ('completed', 'failed', 'cancelled')
        AND completed_at < NOW() - (days_to_keep || ' days')::INTERVAL
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted_executions;
    
    -- Log the cleanup operation
    INSERT INTO workflow_events (
        execution_id,
        event_type,
        event_data,
        created_at
    ) VALUES (
        uuid_generate_v4(),
        'system.cleanup',
        jsonb_build_object('deleted_executions', deleted_count, 'days_to_keep', days_to_keep),
        NOW()
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all workflow tables
ALTER TABLE workflow_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE adaptive_content_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_plugins ENABLE ROW LEVEL SECURITY;
ALTER TABLE plugin_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;

-- Workflow definitions policies
CREATE POLICY "Users can view active workflow definitions" 
    ON workflow_definitions FOR SELECT 
    USING (is_active = true);

CREATE POLICY "Admins can manage workflow definitions" 
    ON workflow_definitions FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "Instructors can create workflow definitions" 
    ON workflow_definitions FOR INSERT 
    WITH CHECK (
        created_by = auth.uid() 
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('super_admin', 'admin', 'instructor')
        )
    );

-- Workflow executions policies
CREATE POLICY "Users can view their own executions" 
    ON workflow_executions FOR SELECT 
    USING (user_id = auth.uid());

CREATE POLICY "Admins can view all executions" 
    ON workflow_executions FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "System can create executions" 
    ON workflow_executions FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "System can update executions" 
    ON workflow_executions FOR UPDATE 
    USING (true);

-- Learning path executions policies
CREATE POLICY "Users can view their own learning paths" 
    ON learning_path_executions FOR SELECT 
    USING (user_id = auth.uid());

CREATE POLICY "System can manage learning path executions" 
    ON learning_path_executions FOR ALL 
    USING (true);

-- Assessment executions policies
CREATE POLICY "Users can view their own assessments" 
    ON assessment_executions FOR SELECT 
    USING (user_id = auth.uid());

CREATE POLICY "System can manage assessment executions" 
    ON assessment_executions FOR ALL 
    USING (true);

-- Approval workflows policies
CREATE POLICY "Authors can view their approval workflows" 
    ON approval_workflows FOR SELECT 
    USING (author_id = auth.uid());

CREATE POLICY "Reviewers can view assigned approvals" 
    ON approval_workflows FOR SELECT 
    USING (
        assigned_reviewer_id = auth.uid() 
        OR auth.uid() = ANY(reviewers)
    );

CREATE POLICY "Admins can view all approval workflows" 
    ON approval_workflows FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('super_admin', 'admin')
        )
    );

-- Workflow achievements policies
CREATE POLICY "Users can view their own achievements" 
    ON workflow_achievements FOR SELECT 
    USING (user_id = auth.uid());

CREATE POLICY "System can create achievements" 
    ON workflow_achievements FOR INSERT 
    WITH CHECK (true);

-- Workflow templates policies
CREATE POLICY "Users can view public templates" 
    ON workflow_templates FOR SELECT 
    USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create their own templates" 
    ON workflow_templates FOR INSERT 
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own templates" 
    ON workflow_templates FOR UPDATE 
    USING (created_by = auth.uid());

-- ============================================================================
-- INITIAL DATA AND CONFIGURATION
-- ============================================================================

-- Insert core workflow plugins
INSERT INTO workflow_plugins (name, version, description, is_active) VALUES
('student-progress', '1.0.0', 'Tracks student progress and achievements', true),
('assessment-manager', '1.0.0', 'Manages quiz execution and grading', true),
('notification-sender', '1.0.0', 'Sends notifications via various channels', true),
('adaptive-content', '1.0.0', 'Provides adaptive content recommendations', true),
('analytics-tracker', '1.0.0', 'Tracks and analyzes user behavior', true),
('approval-manager', '1.0.0', 'Manages content approval workflows', true),
('learning-path', '1.0.0', 'Orchestrates personalized learning paths', true);

-- Create sample workflow templates
INSERT INTO workflow_templates (name, description, category, template_data, is_public, created_by) 
SELECT 
    'Student Onboarding',
    'Basic workflow for onboarding new students',
    'user_onboarding',
    '{"states": [{"id": "welcome", "type": "task", "actions": [{"type": "send_notification", "config": {"template": "welcome_email"}}]}], "transitions": []}',
    true,
    id
FROM users WHERE role = 'super_admin' LIMIT 1;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE workflow_definitions IS 'Stores workflow templates and definitions';
COMMENT ON TABLE workflow_executions IS 'Tracks individual workflow execution instances';
COMMENT ON TABLE workflow_events IS 'Audit trail and event log for workflow executions';
COMMENT ON TABLE workflow_schedules IS 'Manages scheduled workflow executions';
COMMENT ON TABLE learning_path_executions IS 'Tracks student learning path progress';
COMMENT ON TABLE assessment_executions IS 'Manages quiz and assessment sessions';
COMMENT ON TABLE approval_workflows IS 'Handles content approval processes';
COMMENT ON TABLE adaptive_content_selections IS 'Stores adaptive content delivery decisions';
COMMENT ON TABLE workflow_achievements IS 'Records achievements earned through workflows';
COMMENT ON TABLE workflow_plugins IS 'Registry of available workflow plugins';
COMMENT ON TABLE plugin_executions IS 'Logs plugin execution for monitoring';
COMMENT ON TABLE workflow_templates IS 'Reusable workflow templates';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log successful migration
INSERT INTO workflow_events (
    execution_id,
    event_type,
    event_data,
    created_at
) VALUES (
    uuid_generate_v4(),
    'system.migration',
    '{"operation": "workflow_system_migration", "status": "completed", "tables_created": 12}',
    NOW()
);

-- Update schema version (if you have a schema_versions table)
-- INSERT INTO schema_versions (version, description, applied_at) 
-- VALUES ('2024.01.01', 'Workflow System Migration', NOW());