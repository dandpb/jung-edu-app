-- Combined deployment migration for JaqEdu
-- This migration includes schema, RLS policies, and security enhancements

-- Include the main schema
\i ../../database/schema.sql

-- Include RLS policies
\i ../../database/rls_policies.sql

-- Include security enhancements if available
-- Note: Comment out the next line if security_enhancements.sql doesn't exist
\i ../../database/security_enhancements.sql