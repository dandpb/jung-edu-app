#!/bin/bash

# Simple deployment helper for Supabase Dashboard

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Supabase Dashboard Deployment Helper ${NC}"
echo -e "${BLUE}========================================${NC}"
echo

# Generate types from remote database
echo -e "${BLUE}[INFO]${NC} Generating TypeScript types from remote database..."
if supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" > src/types/database.generated.ts; then
    echo -e "${GREEN}[SUCCESS]${NC} TypeScript types generated in src/types/database.generated.ts"
else
    echo -e "${YELLOW}[WARNING]${NC} Could not generate types. Make sure you're logged in to Supabase."
fi

echo
echo -e "${BLUE}Manual Deployment Steps:${NC}"
echo
echo -e "${YELLOW}Step 1:${NC} Open Supabase Dashboard"
echo "   https://app.supabase.com/project/$SUPABASE_PROJECT_ID/sql/new"
echo
echo -e "${YELLOW}Step 2:${NC} Copy and paste the combined SQL file"
echo "   File: database/combined_deployment.sql"
echo "   Location: $(pwd)/database/combined_deployment.sql"
echo
echo -e "${YELLOW}Step 3:${NC} Run the SQL in the editor"
echo
echo -e "${YELLOW}Step 4:${NC} Create Storage Buckets"
echo "   Go to: https://app.supabase.com/project/$SUPABASE_PROJECT_ID/storage/buckets"
echo "   Create these buckets:"
echo "   - avatars (Public: Yes)"
echo "   - documents (Public: No)"
echo "   - uploads (Public: No)"
echo "   - temp (Public: No)"
echo
echo -e "${YELLOW}Step 5:${NC} Configure Authentication"
echo "   Go to: https://app.supabase.com/project/$SUPABASE_PROJECT_ID/auth/providers"
echo "   Set Site URL: http://localhost:3000"
echo "   Add redirect URLs as needed"
echo
echo -e "${GREEN}[INFO]${NC} Opening the SQL Editor in your browser..."
open "https://app.supabase.com/project/$SUPABASE_PROJECT_ID/sql/new"

echo
echo -e "${GREEN}Deployment helper complete!${NC}"
echo "Follow the steps above to complete the deployment."