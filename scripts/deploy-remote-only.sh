#!/bin/bash

# Deploy to Remote Supabase Only (without local instance)
# This script deploys directly to your remote Supabase project

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Remote Supabase Deployment Script    ${NC}"
echo -e "${BLUE}========================================${NC}"
echo

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the jung-edu-app directory"
    exit 1
fi

# Deploy RLS policies directly
print_info "Deploying RLS policies to remote database..."
if [ -f "database/rls_policies.sql" ]; then
    supabase db push --file database/rls_policies.sql
    print_success "RLS policies deployed"
else
    print_error "RLS policies file not found"
fi

# Deploy security enhancements if they exist
if [ -f "database/security_enhancements.sql" ]; then
    print_info "Deploying security enhancements..."
    supabase db push --file database/security_enhancements.sql
    print_success "Security enhancements deployed"
fi

# Create storage buckets via SQL
print_info "Creating storage buckets..."
cat << 'EOF' > /tmp/storage_buckets.sql
-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/gif']),
    ('documents', 'documents', false, 10485760, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown']),
    ('uploads', 'uploads', false, 52428800, NULL),
    ('temp', 'temp', false, 10485760, NULL)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
DO $$ 
BEGIN
    -- Avatars bucket policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Avatar images are publicly accessible') THEN
        CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
            FOR SELECT USING (bucket_id = 'avatars');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can upload their own avatar') THEN
        CREATE POLICY "Users can upload their own avatar" ON storage.objects
            FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own avatar') THEN
        CREATE POLICY "Users can update their own avatar" ON storage.objects
            FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own avatar') THEN
        CREATE POLICY "Users can delete their own avatar" ON storage.objects
            FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;

    -- Documents bucket policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can access their own documents') THEN
        CREATE POLICY "Users can access their own documents" ON storage.objects
            FOR SELECT USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can upload their own documents') THEN
        CREATE POLICY "Users can upload their own documents" ON storage.objects
            FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own documents') THEN
        CREATE POLICY "Users can update their own documents" ON storage.objects
            FOR UPDATE USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own documents') THEN
        CREATE POLICY "Users can delete their own documents" ON storage.objects
            FOR DELETE USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;

    -- Uploads bucket policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can access their own uploads') THEN
        CREATE POLICY "Users can access their own uploads" ON storage.objects
            FOR SELECT USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can upload to uploads bucket') THEN
        CREATE POLICY "Users can upload to uploads bucket" ON storage.objects
            FOR INSERT WITH CHECK (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;

    -- Temp bucket policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage temp files') THEN
        CREATE POLICY "Users can manage temp files" ON storage.objects
            FOR ALL USING (bucket_id = 'temp' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;
END $$;
EOF

supabase db push --file /tmp/storage_buckets.sql
rm /tmp/storage_buckets.sql
print_success "Storage buckets created"

# Generate TypeScript types
print_info "Generating TypeScript types..."
supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" > src/types/database.generated.ts
print_success "TypeScript types generated"

# Test the connection
print_info "Testing database connection..."
cat << 'EOF' > /tmp/test_connection.sql
-- Test connection
SELECT 
    current_database() as database,
    current_user as user,
    version() as postgres_version,
    NOW() as current_time;
EOF

if supabase db push --file /tmp/test_connection.sql; then
    print_success "Database connection test successful"
else
    print_error "Database connection test failed"
fi
rm /tmp/test_connection.sql

echo
print_success "Remote deployment completed successfully!"
echo

print_info "Next steps:"
echo "1. Go to your Supabase Dashboard to verify:"
echo "   - Tables are created correctly"
echo "   - RLS policies are applied"
echo "   - Storage buckets are created"
echo "2. Configure Authentication settings in the dashboard"
echo "3. Test your application with: npm start"
echo
print_info "Dashboard URL: https://app.supabase.com/project/$SUPABASE_PROJECT_ID"