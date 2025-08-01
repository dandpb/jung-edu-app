-- Row Level Security (RLS) Policies for JaqEdu
-- These policies ensure users can only access data they're authorized to see

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mindmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE bibliography ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user has admin role
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('super_admin', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has instructor role or higher
CREATE OR REPLACE FUNCTION is_instructor_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('super_admin', 'admin', 'instructor')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID DEFAULT auth.uid())
RETURNS user_role AS $$
DECLARE
    user_role_result user_role;
BEGIN
    SELECT role INTO user_role_result
    FROM users 
    WHERE id = user_id;
    
    RETURN COALESCE(user_role_result, 'guest');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- USERS TABLE POLICIES
-- Users can read their own data and basic info of others
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT
    USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT
    USING (is_admin());

-- Users can update their own basic info (not role)
CREATE POLICY "Users can update own basic info" ON users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id 
        AND OLD.role = NEW.role -- Role cannot be changed by user
    );

-- Only admins can insert new users or change roles
CREATE POLICY "Admins can insert users" ON users
    FOR INSERT
    WITH CHECK (is_admin());

-- Only super admins can delete users
CREATE POLICY "Super admins can delete users" ON users
    FOR DELETE
    USING (get_user_role() = 'super_admin');

-- USER PROFILES TABLE POLICIES
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT
    USING (auth.uid() = user_id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT
    USING (is_admin());

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- USER SESSIONS TABLE POLICIES
-- Users can view their own sessions
CREATE POLICY "Users can view own sessions" ON user_sessions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can insert own sessions" ON user_sessions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions" ON user_sessions
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own sessions
CREATE POLICY "Users can delete own sessions" ON user_sessions
    FOR DELETE
    USING (auth.uid() = user_id);

-- Admins can view all sessions
CREATE POLICY "Admins can view all sessions" ON user_sessions
    FOR SELECT
    USING (is_admin());

-- MODULES TABLE POLICIES
-- Everyone can view published modules
CREATE POLICY "Anyone can view published modules" ON modules
    FOR SELECT
    USING (is_published = true);

-- Instructors and admins can view all modules
CREATE POLICY "Instructors can view all modules" ON modules
    FOR SELECT
    USING (is_instructor_or_admin());

-- Users can view modules they created
CREATE POLICY "Users can view own modules" ON modules
    FOR SELECT
    USING (auth.uid() = created_by);

-- Instructors and admins can create modules
CREATE POLICY "Instructors can create modules" ON modules
    FOR INSERT
    WITH CHECK (is_instructor_or_admin());

-- Users can update modules they created
CREATE POLICY "Users can update own modules" ON modules
    FOR UPDATE
    USING (auth.uid() = created_by);

-- Admins can update any module
CREATE POLICY "Admins can update any module" ON modules
    FOR UPDATE
    USING (is_admin());

-- Users can delete modules they created (if not published)
CREATE POLICY "Users can delete own unpublished modules" ON modules
    FOR DELETE
    USING (auth.uid() = created_by AND is_published = false);

-- Admins can delete any module
CREATE POLICY "Admins can delete any module" ON modules
    FOR DELETE
    USING (is_admin());

-- QUIZZES TABLE POLICIES
-- Users can view quizzes for published modules or modules they have access to
CREATE POLICY "Users can view accessible quizzes" ON quizzes
    FOR SELECT
    USING (
        is_active = true 
        AND (
            EXISTS (SELECT 1 FROM modules WHERE id = module_id AND is_published = true)
            OR is_instructor_or_admin()
            OR auth.uid() = created_by
        )
    );

-- Instructors and admins can create quizzes
CREATE POLICY "Instructors can create quizzes" ON quizzes
    FOR INSERT
    WITH CHECK (is_instructor_or_admin());

-- Users can update quizzes they created
CREATE POLICY "Users can update own quizzes" ON quizzes
    FOR UPDATE
    USING (auth.uid() = created_by);

-- Admins can update any quiz
CREATE POLICY "Admins can update any quiz" ON quizzes
    FOR UPDATE
    USING (is_admin());

-- Users can delete quizzes they created
CREATE POLICY "Users can delete own quizzes" ON quizzes
    FOR DELETE
    USING (auth.uid() = created_by);

-- Admins can delete any quiz
CREATE POLICY "Admins can delete any quiz" ON quizzes
    FOR DELETE
    USING (is_admin());

-- USER PROGRESS TABLE POLICIES
-- Users can view their own progress
CREATE POLICY "Users can view own progress" ON user_progress
    FOR SELECT
    USING (auth.uid() = user_id);

-- Instructors can view progress for their modules
CREATE POLICY "Instructors can view progress for their modules" ON user_progress
    FOR SELECT
    USING (
        is_instructor_or_admin() 
        AND EXISTS (SELECT 1 FROM modules WHERE id = module_id AND created_by = auth.uid())
    );

-- Admins can view all progress
CREATE POLICY "Admins can view all progress" ON user_progress
    FOR SELECT
    USING (is_admin());

-- Users can insert/update their own progress
CREATE POLICY "Users can manage own progress" ON user_progress
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- NOTES TABLE POLICIES
-- Users can view their own notes
CREATE POLICY "Users can view own notes" ON notes
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can view public notes
CREATE POLICY "Users can view public notes" ON notes
    FOR SELECT
    USING (is_private = false);

-- Admins can view all notes
CREATE POLICY "Admins can view all notes" ON notes
    FOR SELECT
    USING (is_admin());

-- Users can manage their own notes
CREATE POLICY "Users can manage own notes" ON notes
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- MINDMAPS TABLE POLICIES
-- Users can view their own mindmaps
CREATE POLICY "Users can view own mindmaps" ON mindmaps
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can view public mindmaps
CREATE POLICY "Users can view public mindmaps" ON mindmaps
    FOR SELECT
    USING (is_public = true);

-- Admins can view all mindmaps
CREATE POLICY "Admins can view all mindmaps" ON mindmaps
    FOR SELECT
    USING (is_admin());

-- Users can manage their own mindmaps
CREATE POLICY "Users can manage own mindmaps" ON mindmaps
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- BIBLIOGRAPHY TABLE POLICIES
-- Users can view bibliography for published modules
CREATE POLICY "Users can view bibliography for published modules" ON bibliography
    FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM modules WHERE id = module_id AND is_published = true)
        OR is_instructor_or_admin()
    );

-- Instructors can manage bibliography for their modules
CREATE POLICY "Instructors can manage bibliography for their modules" ON bibliography
    FOR ALL
    USING (
        is_instructor_or_admin() 
        AND EXISTS (SELECT 1 FROM modules WHERE id = module_id AND created_by = auth.uid())
    );

-- Admins can manage all bibliography
CREATE POLICY "Admins can manage all bibliography" ON bibliography
    FOR ALL
    USING (is_admin());

-- VIDEOS TABLE POLICIES
-- Users can view videos for published modules
CREATE POLICY "Users can view videos for published modules" ON videos
    FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM modules WHERE id = module_id AND is_published = true)
        OR is_instructor_or_admin()
    );

-- Instructors can manage videos for their modules
CREATE POLICY "Instructors can manage videos for their modules" ON videos
    FOR ALL
    USING (
        is_instructor_or_admin() 
        AND EXISTS (SELECT 1 FROM modules WHERE id = module_id AND created_by = auth.uid())
    );

-- Admins can manage all videos
CREATE POLICY "Admins can manage all videos" ON videos
    FOR ALL
    USING (is_admin());

-- PASSWORD RESET TOKENS TABLE POLICIES
-- Users can view their own password reset tokens
CREATE POLICY "Users can view own password reset tokens" ON password_reset_tokens
    FOR SELECT
    USING (auth.uid() = user_id);

-- System can insert password reset tokens
CREATE POLICY "System can insert password reset tokens" ON password_reset_tokens
    FOR INSERT
    WITH CHECK (true); -- This will be restricted by application logic

-- Users can update their own password reset tokens (mark as used)
CREATE POLICY "Users can update own password reset tokens" ON password_reset_tokens
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Cleanup expired tokens (system function)
CREATE POLICY "System can delete expired tokens" ON password_reset_tokens
    FOR DELETE
    USING (expires_at < NOW());

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant permissions to anonymous users (for public content)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON modules TO anon;
GRANT SELECT ON bibliography TO anon;
GRANT SELECT ON videos TO anon;