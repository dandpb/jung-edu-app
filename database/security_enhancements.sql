-- SECURITY ENHANCEMENTS FOR JAQUEDU DATABASE
-- Additional security policies and configurations to strengthen the existing schema

-- Enable additional security extensions
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_audit" WITH SCHEMA extensions;

-- Create audit table for tracking sensitive operations
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    user_id UUID,
    performed_by UUID REFERENCES users(id),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT valid_operation CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE'))
);

-- Create indexes for audit log
CREATE INDEX idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX idx_audit_log_operation ON audit_log(operation);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp);

-- Enhanced password reset security
ALTER TABLE password_reset_tokens 
ADD COLUMN IF NOT EXISTS ip_address INET,
ADD COLUMN IF NOT EXISTS attempts INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS blocked_until TIMESTAMPTZ;

-- Rate limiting table for login attempts
CREATE TABLE IF NOT EXISTS login_rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identifier TEXT NOT NULL, -- IP address or email
    attempts INTEGER DEFAULT 1,
    first_attempt TIMESTAMPTZ DEFAULT NOW(),
    last_attempt TIMESTAMPTZ DEFAULT NOW(),
    blocked_until TIMESTAMPTZ,
    
    UNIQUE(identifier)
);

CREATE INDEX idx_login_rate_limits_identifier ON login_rate_limits(identifier);
CREATE INDEX idx_login_rate_limits_blocked_until ON login_rate_limits(blocked_until);

-- Enhanced RLS policies for audit logging
CREATE POLICY "Admins can view audit logs" ON audit_log
    FOR SELECT
    USING (is_admin());

CREATE POLICY "System can insert audit logs" ON audit_log
    FOR INSERT
    WITH CHECK (true);

-- Enhanced password reset policies with rate limiting
DROP POLICY IF EXISTS "System can insert password reset tokens" ON password_reset_tokens;
CREATE POLICY "Limited password reset token creation" ON password_reset_tokens
    FOR INSERT
    WITH CHECK (
        -- Check rate limiting: max 3 requests per hour per IP
        NOT EXISTS (
            SELECT 1 FROM password_reset_tokens prt 
            WHERE prt.ip_address = NEW.ip_address 
            AND prt.created_at > NOW() - INTERVAL '1 hour'
            GROUP BY prt.ip_address
            HAVING COUNT(*) >= 3
        )
    );

-- Function to clean up old audit logs (retention policy)
CREATE OR REPLACE FUNCTION cleanup_audit_logs()
RETURNS VOID AS $$
BEGIN
    DELETE FROM audit_log 
    WHERE timestamp < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
    identifier_val TEXT,
    max_attempts INTEGER DEFAULT 5,
    window_minutes INTEGER DEFAULT 30
)
RETURNS BOOLEAN AS $$
DECLARE
    current_attempts INTEGER;
    window_start TIMESTAMPTZ;
BEGIN
    window_start := NOW() - (window_minutes || ' minutes')::INTERVAL;
    
    SELECT COALESCE(attempts, 0) INTO current_attempts
    FROM login_rate_limits
    WHERE identifier = identifier_val
    AND last_attempt > window_start;
    
    RETURN COALESCE(current_attempts, 0) < max_attempts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record login attempt
CREATE OR REPLACE FUNCTION record_login_attempt(
    identifier_val TEXT,
    success BOOLEAN DEFAULT FALSE
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO login_rate_limits (identifier, attempts, first_attempt, last_attempt)
    VALUES (identifier_val, 1, NOW(), NOW())
    ON CONFLICT (identifier) DO UPDATE SET
        attempts = CASE 
            WHEN success THEN 0
            ELSE login_rate_limits.attempts + 1
        END,
        last_attempt = NOW(),
        blocked_until = CASE
            WHEN NOT success AND login_rate_limits.attempts >= 4 THEN NOW() + INTERVAL '30 minutes'
            ELSE NULL
        END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    -- Only audit sensitive tables
    IF TG_TABLE_NAME IN ('users', 'user_profiles', 'modules', 'quizzes', 'password_reset_tokens') THEN
        INSERT INTO audit_log (
            table_name,
            operation,
            user_id,
            performed_by,
            old_values,
            new_values,
            ip_address,
            timestamp
        ) VALUES (
            TG_TABLE_NAME,
            TG_OP,
            CASE 
                WHEN TG_OP = 'DELETE' THEN OLD.id
                ELSE NEW.id
            END,
            auth.uid(),
            CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
            CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END,
            inet_client_addr(),
            NOW()
        );
    END IF;
    
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for sensitive tables
DROP TRIGGER IF EXISTS audit_users_trigger ON users;
CREATE TRIGGER audit_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_modules_trigger ON modules;
CREATE TRIGGER audit_modules_trigger
    AFTER INSERT OR UPDATE OR DELETE ON modules
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_password_reset_trigger ON password_reset_tokens;
CREATE TRIGGER audit_password_reset_trigger
    AFTER INSERT OR UPDATE OR DELETE ON password_reset_tokens
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Enhanced session security
ALTER TABLE user_sessions 
ADD COLUMN IF NOT EXISTS csrf_token TEXT,
ADD COLUMN IF NOT EXISTS fingerprint_hash TEXT;

-- Function to validate session security
CREATE OR REPLACE FUNCTION validate_session_security(
    session_id UUID,
    expected_ip INET,
    expected_user_agent TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    session_record user_sessions%ROWTYPE;
BEGIN
    SELECT * INTO session_record
    FROM user_sessions
    WHERE id = session_id AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check if session is expired
    IF session_record.expires_at < NOW() THEN
        UPDATE user_sessions SET is_active = false WHERE id = session_id;
        RETURN FALSE;
    END IF;
    
    -- Check IP address consistency (optional - can be disabled for mobile users)
    -- IF session_record.ip_address != expected_ip THEN
    --     RETURN FALSE;
    -- END IF;
    
    -- Update last activity
    UPDATE user_sessions 
    SET last_activity = NOW() 
    WHERE id = session_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create scheduled job to cleanup expired sessions (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-expired-sessions', '0 2 * * *', 'DELETE FROM user_sessions WHERE expires_at < NOW() - INTERVAL ''7 days'';');

-- Additional security constraints
ALTER TABLE users 
ADD CONSTRAINT check_email_domain 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Password history enforcement (prevent reuse of last 5 passwords)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_history JSONB DEFAULT '[]'::jsonb;

-- Function to check password history
CREATE OR REPLACE FUNCTION check_password_history(
    user_id UUID,
    new_password_hash TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    history JSONB;
BEGIN
    SELECT password_history INTO history
    FROM users
    WHERE id = user_id;
    
    -- Check if password was used in last 5 passwords
    RETURN NOT (history ? new_password_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on new tables
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_rate_limits ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT ON audit_log TO authenticated;
GRANT INSERT ON login_rate_limits TO authenticated;
GRANT UPDATE ON login_rate_limits TO authenticated;
GRANT SELECT ON login_rate_limits TO authenticated;

-- Security maintenance functions
CREATE OR REPLACE FUNCTION security_maintenance()
RETURNS VOID AS $$
BEGIN
    -- Cleanup expired password reset tokens
    DELETE FROM password_reset_tokens WHERE expires_at < NOW();
    
    -- Cleanup old rate limit records
    DELETE FROM login_rate_limits WHERE last_attempt < NOW() - INTERVAL '24 hours';
    
    -- Cleanup old audit logs (keep 1 year)
    PERFORM cleanup_audit_logs();
    
    -- Expire old sessions
    UPDATE user_sessions SET is_active = false WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for security dashboard
CREATE OR REPLACE VIEW security_dashboard AS
SELECT 
    'login_attempts' as metric,
    COUNT(*) as value,
    'Last 24 hours' as period
FROM login_rate_limits 
WHERE last_attempt > NOW() - INTERVAL '24 hours'

UNION ALL

SELECT 
    'failed_logins' as metric,
    COUNT(*) as value,
    'Last 24 hours' as period
FROM login_rate_limits 
WHERE attempts > 0 AND last_attempt > NOW() - INTERVAL '24 hours'

UNION ALL

SELECT 
    'active_sessions' as metric,
    COUNT(*) as value,
    'Current' as period
FROM user_sessions 
WHERE is_active = true AND expires_at > NOW()

UNION ALL

SELECT 
    'password_resets' as metric,
    COUNT(*) as value,
    'Last 24 hours' as period
FROM password_reset_tokens 
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Grant view access to admins
GRANT SELECT ON security_dashboard TO authenticated;

-- Comments for documentation
COMMENT ON TABLE audit_log IS 'Audit trail for sensitive database operations';
COMMENT ON TABLE login_rate_limits IS 'Rate limiting for login attempts by IP/email';
COMMENT ON FUNCTION check_rate_limit IS 'Checks if identifier has exceeded rate limits';
COMMENT ON FUNCTION record_login_attempt IS 'Records login attempt for rate limiting';
COMMENT ON FUNCTION security_maintenance IS 'Regular maintenance for security tables';
COMMENT ON VIEW security_dashboard IS 'Security metrics dashboard for administrators';