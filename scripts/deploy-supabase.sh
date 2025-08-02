#!/bin/bash

# Deploy Supabase Schema and Configuration
# This script sets up the database schema, RLS policies, and storage buckets

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DB_DIR="$(dirname "$0")/../database"
SUPABASE_PROJECT_ID="${SUPABASE_PROJECT_ID}"
SUPABASE_DB_PASSWORD="${SUPABASE_DB_PASSWORD}"

# Functions
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

check_dependencies() {
    print_info "Checking dependencies..."
    
    if ! command -v supabase &> /dev/null; then
        print_error "Supabase CLI is not installed. Please install it first:"
        echo "npm install -g supabase"
        exit 1
    fi
    
    if ! command -v psql &> /dev/null; then
        print_warning "psql is not installed. Some operations may fail."
    fi
    
    print_success "Dependencies check completed"
}

check_environment() {
    print_info "Checking environment variables..."
    
    if [ -z "$SUPABASE_PROJECT_ID" ]; then
        print_error "SUPABASE_PROJECT_ID environment variable is not set"
        exit 1
    fi
    
    if [ -z "$SUPABASE_DB_PASSWORD" ]; then
        print_error "SUPABASE_DB_PASSWORD environment variable is not set"
        exit 1
    fi
    
    print_success "Environment variables are set"
}

login_supabase() {
    print_info "Logging into Supabase..."
    
    if ! supabase projects list &> /dev/null; then
        print_info "Please log in to Supabase:"
        supabase login
    fi
    
    print_success "Supabase login successful"
}

link_project() {
    print_info "Linking to Supabase project..."
    
    if [ ! -f ".supabase/config.toml" ]; then
        supabase link --project-ref "$SUPABASE_PROJECT_ID"
        print_success "Project linked successfully"
    else
        print_info "Project is already linked"
    fi
}

deploy_schema() {
    print_info "Deploying database schema..."
    
    if [ -f "$DB_DIR/schema.sql" ]; then
        supabase db push
        print_success "Database schema deployed"
    else
        print_error "Schema file not found at $DB_DIR/schema.sql"
        exit 1
    fi
}

deploy_rls_policies() {
    print_info "Deploying RLS policies..."
    
    if [ -f "$DB_DIR/rls_policies.sql" ]; then
        supabase db reset
        print_success "RLS policies deployed"
    else
        print_error "RLS policies file not found at $DB_DIR/rls_policies.sql"
        exit 1
    fi
}

create_storage_buckets() {
    print_info "Creating storage buckets..."
    
    # Create storage buckets using SQL
    cat << EOF | supabase db push --local
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/gif']),
    ('documents', 'documents', false, 10485760, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown']),
    ('uploads', 'uploads', false, 52428800, NULL),
    ('temp', 'temp', false, 10485760, NULL)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" ON storage.objects
    FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" ON storage.objects
    FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can access their own documents" ON storage.objects
    FOR SELECT USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own documents" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own documents" ON storage.objects
    FOR UPDATE USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents" ON storage.objects
    FOR DELETE USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can access their own uploads" ON storage.objects
    FOR SELECT USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload to uploads bucket" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can manage temp files" ON storage.objects
    FOR ALL USING (bucket_id = 'temp' AND auth.uid()::text = (storage.foldername(name))[1]);
EOF
    
    print_success "Storage buckets created"
}

seed_data() {
    print_info "Seeding initial data..."
    
    if [ -f "$DB_DIR/seed.sql" ]; then
        supabase db push --file "$DB_DIR/seed.sql"
        print_success "Initial data seeded"
    else
        print_warning "No seed file found, skipping data seeding"
    fi
}

run_tests() {
    print_info "Running database tests..."
    
    if [ -f "$DB_DIR/tests.sql" ]; then
        supabase test db
        print_success "Database tests passed"
    else
        print_warning "No test file found, skipping database tests"
    fi
}

generate_types() {
    print_info "Generating TypeScript types..."
    
    if command -v supabase &> /dev/null; then
        supabase gen types typescript --local > src/types/database.generated.ts
        print_success "TypeScript types generated"
    else
        print_warning "Supabase CLI not available for type generation"
    fi
}

main() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  JaqEdu Supabase Deployment Script    ${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo
    
    check_dependencies
    check_environment
    login_supabase
    link_project
    deploy_schema
    deploy_rls_policies
    create_storage_buckets
    seed_data
    run_tests
    generate_types
    
    echo
    print_success "Supabase deployment completed successfully!"
    echo -e "${GREEN}Your database is ready for use.${NC}"
    echo
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Update your .env file with the Supabase credentials"
    echo "2. Install the Supabase JavaScript client: npm install @supabase/supabase-js"
    echo "3. Test the connection using the health check endpoint"
    echo
}

# Handle script arguments
case "${1:-}" in
    --schema-only)
        deploy_schema
        ;;
    --policies-only)
        deploy_rls_policies
        ;;
    --storage-only)
        create_storage_buckets
        ;;
    --types-only)
        generate_types
        ;;
    --test)
        run_tests
        ;;
    --help|-h)
        echo "Usage: $0 [option]"
        echo "Options:"
        echo "  --schema-only    Deploy only the database schema"
        echo "  --policies-only  Deploy only the RLS policies"
        echo "  --storage-only   Create only the storage buckets"
        echo "  --types-only     Generate only the TypeScript types"
        echo "  --test          Run only the database tests"
        echo "  --help          Show this help message"
        echo
        echo "Environment variables required:"
        echo "  SUPABASE_PROJECT_ID    Your Supabase project ID"
        echo "  SUPABASE_DB_PASSWORD   Your database password"
        ;;
    *)
        main
        ;;
esac