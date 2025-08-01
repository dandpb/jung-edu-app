# JaqEdu Supabase Integration Setup Guide

This guide will walk you through setting up Supabase as the backend for the JaqEdu educational platform.

## Prerequisites

- Node.js 16+ installed
- NPM or Yarn package manager
- Supabase account (create at [supabase.com](https://supabase.com))
- Supabase CLI (optional but recommended)

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/log in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: jaqedu-platform
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for the project to be ready (2-3 minutes)

## Step 2: Get Project Credentials

1. Go to Project Settings → API
2. Copy the following values:
   - **Project URL**: `https://[project-id].supabase.co`
   - **Anon public key**: `eyJ...` (public key)
   - **Service role key**: `eyJ...` (secret key - keep secure)

## Step 3: Install Dependencies

```bash
# Install Supabase JavaScript client
npm install @supabase/supabase-js

# Install Supabase CLI (optional but recommended)
npm install -g supabase
```

## Step 4: Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Update the `.env` file with your Supabase credentials:
```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
REACT_APP_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Database Configuration
DATABASE_URL=postgresql://postgres:[your-password]@db.[project-id].supabase.co:5432/postgres
```

## Step 5: Deploy Database Schema

### Option A: Using the Deployment Script (Recommended)

```bash
# Make the script executable
chmod +x scripts/deploy-supabase.sh

# Set environment variables
export SUPABASE_PROJECT_ID=your-project-id
export SUPABASE_DB_PASSWORD=your-database-password

# Run the deployment
./scripts/deploy-supabase.sh
```

### Option B: Manual Setup

1. **Deploy Schema**:
   - Go to Supabase Dashboard → SQL Editor
   - Copy and paste the contents of `database/schema.sql`
   - Click "Run"

2. **Deploy RLS Policies**:
   - Copy and paste the contents of `database/rls_policies.sql`
   - Click "Run"

3. **Create Storage Buckets**:
   - Go to Storage section
   - Create the following buckets:
     - `avatars` (public)
     - `documents` (private)
     - `uploads` (private)
     - `temp` (private)

## Step 6: Configure Authentication

1. Go to Authentication → Settings
2. Configure the following:

### Site URL
```
http://localhost:3000
```

### Redirect URLs
```
http://localhost:3000/auth/callback
http://localhost:3000/auth/reset-password
http://localhost:3000/auth/confirm
```

### Email Templates (Optional)
Customize the email templates for:
- Confirm signup
- Reset password
- Magic link

### Social Providers (Optional)
Enable and configure:
- Google OAuth
- GitHub OAuth
- Discord OAuth

## Step 7: Test the Connection

1. Start the development server:
```bash
npm start
```

2. Open the browser console and check for any connection errors

3. Try creating a test user account to verify authentication works

## Step 8: Migration from localStorage (If Applicable)

If you have existing data in localStorage, use the migration utility:

```typescript
import { migrationService } from './src/utils/supabase-migration';

// Run migration (this will preserve existing data)
const results = await migrationService.migrateAll('admin-user-id', {
  dryRun: false, // Set to true for testing
  skipExisting: true
});

console.log('Migration results:', results);

// Clear localStorage after successful migration
if (results.users.success) {
  migrationService.clearLocalStorageData();
}
```

## Security Configuration

### Row Level Security (RLS)
RLS is automatically enabled for all tables. The policies ensure:
- Users can only access their own data
- Admins can access all data
- Instructors can manage their own modules
- Public content is accessible to everyone

### Storage Security
Storage buckets have policies that:
- Allow users to manage their own files
- Restrict file sizes and types
- Enable public access only for avatars

## Database Schema Overview

### Core Tables
- **users**: User authentication and basic info
- **user_profiles**: Extended user information
- **user_sessions**: Session management
- **modules**: Educational content
- **quizzes**: Quiz questions and settings
- **user_progress**: Learning progress tracking
- **notes**: User notes and annotations
- **mindmaps**: Mind map data
- **bibliography**: Reference materials
- **videos**: Video content links

### Features Included
- User authentication with email verification
- Role-based access control
- Real-time subscriptions
- File storage and management
- Progress tracking
- Social features (notes sharing, public mindmaps)

## Performance Optimization

### Indexes
All necessary indexes are created automatically for:
- User lookups
- Module queries
- Progress tracking
- Search functionality

### Real-time Subscriptions
Enable real-time features for:
- Progress updates
- Note synchronization
- Module changes

## Monitoring and Analytics

### Built-in Analytics
Supabase provides built-in analytics for:
- API usage
- Database performance
- Authentication metrics
- Storage usage

### Custom Analytics
Use the provided functions for:
- User progress summaries
- Module completion rates
- Learning analytics

## Troubleshooting

### Common Issues

1. **Connection Errors**
   - Verify environment variables are correct
   - Check if project is fully initialized
   - Ensure API keys are valid

2. **Authentication Issues**
   - Check redirect URLs configuration
   - Verify email templates are working
   - Ensure RLS policies are properly set

3. **Database Errors**
   - Check if schema was deployed correctly
   - Verify RLS policies are not blocking access
   - Review database logs in Supabase dashboard

4. **Storage Issues**
   - Ensure buckets are created
   - Check storage policies
   - Verify file size and type restrictions

### Support Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Community Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)

## Production Deployment

### Environment Configuration
```env
NODE_ENV=production
REACT_APP_ENVIRONMENT=production
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-production-anon-key
```

### Security Checklist
- [ ] Enable 2FA on Supabase account
- [ ] Use strong database password
- [ ] Configure proper CORS origins
- [ ] Enable email verification
- [ ] Set up monitoring and alerts
- [ ] Configure backups
- [ ] Review and test RLS policies
- [ ] Enable rate limiting
- [ ] Set up SSL/TLS certificates

### Performance Checklist
- [ ] Enable caching
- [ ] Optimize queries with proper indexes
- [ ] Configure CDN for static assets
- [ ] Set up real-time subscriptions properly
- [ ] Monitor database performance
- [ ] Configure connection pooling

## Next Steps

After completing the setup:

1. **Test all features** thoroughly in development
2. **Set up staging environment** for testing
3. **Configure monitoring** and alerting
4. **Plan backup strategy**
5. **Deploy to production** with proper CI/CD

## Need Help?

If you encounter any issues during setup:

1. Check the troubleshooting section above
2. Review Supabase documentation
3. Search existing GitHub issues
4. Create a new issue with detailed error information

---

**Important**: Keep your service role key secure and never expose it in client-side code. Only use it for server-side operations or administrative tasks.