# 🚀 JaqEdu Supabase Deployment Guide

This guide will walk you through deploying the JaqEdu educational platform to Supabase.

## 📋 Pre-Deployment Checklist

### ✅ Security Fixes Applied
- [x] Removed hardcoded admin credentials from source code
- [x] Created secure credential generation script
- [x] Added comprehensive security enhancements to database

### ✅ Configuration Files Created
- [x] Database schema (`/database/schema.sql`)
- [x] Row Level Security policies (`/database/rls_policies.sql`)
- [x] Security enhancements (`/database/security_enhancements.sql`)
- [x] Supabase client configuration (`/src/config/supabase.ts`)
- [x] Environment template (`.env.production.example`)
- [x] Deployment scripts (`/scripts/deploy-supabase.sh`)

### ✅ Testing Infrastructure
- [x] Integration tests for Supabase
- [x] Health monitoring service
- [x] Deployment validation scripts

## 🔧 Step 1: Generate Secure Admin Credentials

Before deploying, generate secure admin credentials:

```bash
cd jung-edu-app
node scripts/generate-secure-admin.js
```

**Important:** Save the generated password in a secure password manager. You won't be able to retrieve it later!

## 🌐 Step 2: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New project"
3. Configure your project:
   - **Organization:** Select or create one
   - **Project name:** `jaquedu` (or your preference)
   - **Database Password:** Generate a strong password
   - **Region:** Choose closest to your users
   - **Pricing plan:** Free tier is sufficient for starting

4. Wait for project provisioning (takes 2-3 minutes)

## 🔑 Step 3: Configure Environment Variables

1. Once your project is ready, go to Settings → API
2. Copy your project credentials:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **Anon public key** (safe for browser)
   - **Service role key** (keep secret, server-side only)

3. Create `.env.production` file in `jung-edu-app/`:
```bash
cp .env.production.example .env.production
```

4. Edit `.env.production` with your values:
```env
REACT_APP_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Add the admin credentials from Step 1
REACT_APP_ADMIN_PASSWORD_HASH=your-generated-hash
REACT_APP_ADMIN_SALT=your-generated-salt
REACT_APP_JWT_SECRET=your-generated-jwt-secret
```

## 📊 Step 4: Deploy Database Schema

### Option A: Using Supabase Dashboard (Recommended for first-time)

1. Go to your Supabase project → SQL Editor
2. Create a new query
3. Copy and paste the contents of:
   - First: `/database/schema.sql`
   - Then: `/database/rls_policies.sql`
   - Finally: `/database/security_enhancements.sql`
4. Run each script in order

### Option B: Using Deployment Script

```bash
cd jung-edu-app
./scripts/deploy-supabase.sh
```

Follow the prompts to enter your database connection details.

## 🔐 Step 5: Configure Authentication

1. In Supabase Dashboard → Authentication → Providers
2. Enable the following providers:
   - **Email** (enabled by default)
   - **Google** (optional, requires OAuth setup)
   - **GitHub** (optional, requires OAuth setup)

3. Configure email templates:
   - Go to Authentication → Email Templates
   - Customize confirmation and reset password emails

4. Set allowed redirect URLs:
   - Add your production URL (e.g., `https://jaquedu.com/*`)
   - Add localhost for development: `http://localhost:3000/*`

## 🏗️ Step 6: Build and Deploy Application

### Build the application:
```bash
cd jung-edu-app
npm run build
```

### Deploy to your hosting platform:

#### Option A: Vercel (Recommended)
```bash
npm install -g vercel
vercel --prod
```

#### Option B: Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=build
```

#### Option C: Traditional hosting
Upload the `build/` directory to your web server.

## ✅ Step 7: Verify Deployment

1. Run health check:
```bash
curl https://your-app-url.com/health
```

2. Test authentication:
   - Try registering a new user
   - Login with the admin credentials
   - Reset password flow

3. Run integration tests:
```bash
npm run test:deployment -- --url=https://your-app-url.com
```

## 🛡️ Step 8: Post-Deployment Security

1. **Enable 2FA for admin accounts**
   - Login as admin
   - Go to Account Settings → Security
   - Enable Two-Factor Authentication

2. **Set up monitoring**:
   ```bash
   ./scripts/health-monitor.sh --url=https://your-app-url.com --email=admin@example.com
   ```

3. **Configure backup schedule** in Supabase Dashboard → Database → Backups

## 🚨 Troubleshooting

### Common Issues:

1. **CORS errors**
   - Add your domain to Supabase allowed URLs
   - Check Authentication → URL Configuration

2. **Database connection failed**
   - Verify environment variables are loaded
   - Check Supabase project is active
   - Ensure RLS policies aren't blocking access

3. **Admin login fails**
   - Ensure you've set the environment variables correctly
   - Admin credentials must be generated, not hardcoded
   - Check browser console for specific errors

### Debug Mode:
```bash
# Enable debug logging
REACT_APP_DEBUG=true npm start
```

## 📈 Next Steps

1. **Set up analytics**: Enable Supabase Analytics in project settings
2. **Configure CDN**: Add CloudFlare or similar for static assets
3. **Enable rate limiting**: Configure in Supabase Dashboard
4. **Set up CI/CD**: Automate deployments with GitHub Actions
5. **Monitor performance**: Use Supabase Dashboard metrics

## 📞 Support

- **Supabase Documentation**: [docs.supabase.com](https://docs.supabase.com)
- **JaqEdu Issues**: Create an issue in the repository
- **Security Concerns**: Email security@your-domain.com

---

**Remember**: Never commit `.env.production` or any file containing real credentials to version control!