#!/bin/bash

# Direct Deployment Script for Supabase without CLI
# This script provides instructions for manual deployment via Supabase Dashboard

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

print_step() {
    echo -e "${YELLOW}[STEP $1]${NC} $2"
}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  JaqEdu Supabase Manual Deployment    ${NC}"
echo -e "${BLUE}========================================${NC}"
echo

print_info "Since Supabase CLI is not installed, follow these manual steps:"
echo

print_step "1" "Log in to Supabase Dashboard"
echo "   Go to: https://app.supabase.com"
echo "   Project: ckuhwzxtakxnqcexljoo"
echo

print_step "2" "Deploy Database Schema"
echo "   1. Go to SQL Editor in your Supabase Dashboard"
echo "   2. Click 'New Query'"
echo "   3. Copy and paste the contents of: database/schema.sql"
echo "   4. Click 'Run' to execute"
echo "   ${YELLOW}File location:${NC} $(pwd)/database/schema.sql"
echo

print_step "3" "Deploy RLS Policies"
echo "   1. Create another new query in SQL Editor"
echo "   2. Copy and paste the contents of: database/rls_policies.sql"
echo "   3. Click 'Run' to execute"
echo "   ${YELLOW}File location:${NC} $(pwd)/database/rls_policies.sql"
echo

print_step "4" "Deploy Security Enhancements (Optional but Recommended)"
echo "   1. Create another new query in SQL Editor"
echo "   2. Copy and paste the contents of: database/security_enhancements.sql"
echo "   3. Click 'Run' to execute"
echo "   ${YELLOW}File location:${NC} $(pwd)/database/security_enhancements.sql"
echo

print_step "5" "Create Storage Buckets"
echo "   1. Go to Storage in your Supabase Dashboard"
echo "   2. Click 'New bucket' and create these buckets:"
echo "      - Name: 'avatars' (Public: Yes)"
echo "      - Name: 'documents' (Public: No)"
echo "      - Name: 'uploads' (Public: No)"
echo "      - Name: 'temp' (Public: No)"
echo

print_step "6" "Configure Authentication"
echo "   1. Go to Authentication → Settings"
echo "   2. Set Site URL: http://localhost:3000"
echo "   3. Add Redirect URLs:"
echo "      - http://localhost:3000/auth/callback"
echo "      - http://localhost:3000/auth/reset-password"
echo "      - http://localhost:3000/auth/confirm"
echo

print_step "7" "Test the Connection"
echo "   1. Start your development server: npm start"
echo "   2. Check browser console for connection errors"
echo "   3. Try creating a test user account"
echo

print_warning "Alternative: Install Supabase CLI"
echo "If you want to use the automated script, install Supabase CLI first:"
echo "   npm install -g supabase"
echo "Then run: ./scripts/deploy-supabase.sh"
echo

# Create a combined SQL file for easier deployment
print_info "Creating combined SQL file for easier deployment..."
cat > database/combined_deployment.sql << 'EOF'
-- ================================================
-- Combined Deployment Script for JaqEdu
-- ================================================
-- Run this entire script in Supabase SQL Editor
-- ================================================

EOF

# Append schema
if [ -f "database/schema.sql" ]; then
    echo "-- Database Schema" >> database/combined_deployment.sql
    echo "-- ================================================" >> database/combined_deployment.sql
    cat database/schema.sql >> database/combined_deployment.sql
    echo -e "\n\n" >> database/combined_deployment.sql
fi

# Append RLS policies
if [ -f "database/rls_policies.sql" ]; then
    echo "-- Row Level Security Policies" >> database/combined_deployment.sql
    echo "-- ================================================" >> database/combined_deployment.sql
    cat database/rls_policies.sql >> database/combined_deployment.sql
    echo -e "\n\n" >> database/combined_deployment.sql
fi

# Append security enhancements if they exist
if [ -f "database/security_enhancements.sql" ]; then
    echo "-- Security Enhancements" >> database/combined_deployment.sql
    echo "-- ================================================" >> database/combined_deployment.sql
    cat database/security_enhancements.sql >> database/combined_deployment.sql
fi

print_success "Created combined deployment file: database/combined_deployment.sql"
echo
print_info "You can use this single file to deploy everything at once!"
echo

# Check if psql is available for direct connection
if command -v psql &> /dev/null; then
    print_info "psql is available. You can also deploy using:"
    echo "   psql 'postgresql://postgres:&&&&i746DDDD@db.ckuhwzxtakxnqcexljoo.supabase.co:5432/postgres' < database/combined_deployment.sql"
    echo
fi

print_success "Deployment instructions ready!"
echo "Follow the steps above to complete your Supabase deployment."