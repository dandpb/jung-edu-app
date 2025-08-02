# 🚀 Getting Started with jaqEdu

This guide will help you set up and run jaqEdu on your local machine for development or testing purposes.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14.0.0 or higher)
- **npm** (v6.0.0 or higher) or **yarn**
- **Git** for version control
- A modern web browser (Chrome, Firefox, Safari, or Edge)
- A code editor (VS Code recommended)

## 🔧 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/jaqEdu.git
cd jaqEdu
```

### 2. Navigate to the Application Directory

```bash
cd jung-edu-app
```

### 3. Install Dependencies

Using npm:
```bash
npm install
```

Or using yarn:
```bash
yarn install
```

This will install all required dependencies including:
- React and React DOM
- TypeScript
- Tailwind CSS
- Supabase client
- Testing libraries
- And more...

### 4. Environment Setup

Create a `.env.local` file in the `jung-edu-app` directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Required Environment Variables
REACT_APP_OPENAI_API_KEY=your_openai_api_key_here
REACT_APP_YOUTUBE_API_KEY=your_youtube_api_key_here

# Admin Credentials (generate these securely)
REACT_APP_ADMIN_USERNAME=admin
REACT_APP_ADMIN_PASSWORD_HASH=generated_hash_here
REACT_APP_ADMIN_SALT=generated_salt_here

# Optional: Supabase Configuration
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: LLM Configuration
REACT_APP_OPENAI_MODEL=gpt-4o-mini
```

### 5. Generate Admin Credentials

Run the admin credential generator:

```bash
npm run generate-admin-credentials
```

This will output:
- Password hash
- Salt

Copy these values to your `.env.local` file.

## 🏃‍♂️ Running the Application

### Development Mode

Start the development server:

```bash
npm start
```

The application will open automatically at `http://localhost:3000`.

Features in development mode:
- Hot module replacement
- Error overlay
- Source maps for debugging
- Auto-refresh on file changes

### Production Build

Create an optimized production build:

```bash
npm run build
```

The build files will be in the `build/` directory.

To serve the production build locally:

```bash
npm install -g serve
serve -s build
```

## 🗄️ Database Setup (Optional)

jaqEdu can run with localStorage only, but for full features, set up Supabase:

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

### 2. Run Database Migrations

```bash
# Navigate to database directory
cd ../database

# Run the schema
psql -h your-project.supabase.co -U postgres -d postgres -f schema.sql

# Run RLS policies
psql -h your-project.supabase.co -U postgres -d postgres -f rls_policies.sql
```

### 3. Update Environment Variables

Add your Supabase credentials to `.env.local`:

```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

## 🧪 Running Tests

### Run All Tests

```bash
npm test
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Run Specific Test Suites

```bash
# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# Component tests
npm run test:components
```

## 📱 Accessing the Application

### Default Credentials

For demo purposes, you can use:
- **Username**: `admin`
- **Password**: `jungadmin123`

### First Time Setup

1. **Register a New Account**
   - Click "Register" on the login page
   - Fill in your details
   - Choose your role (Student or Instructor)

2. **Explore the Dashboard**
   - View available modules
   - Check your progress
   - Access the mind map

3. **Start Learning**
   - Click on any module to begin
   - Complete content, videos, and quizzes
   - Take notes as you learn

## 🔍 Verifying Installation

To verify everything is working:

1. **Check the Homepage Loads**
   - Should see the login page
   - No console errors

2. **Test Authentication**
   - Try logging in with demo credentials
   - Create a new account

3. **Test Module Access**
   - Click on a module
   - Verify content loads
   - Play a video
   - Take a quiz

4. **Test Mind Map**
   - Navigate to Mind Map page
   - Verify interactive visualization loads
   - Click on nodes

## 🛠️ Common Setup Issues

### Port Already in Use

If port 3000 is busy:

```bash
PORT=3001 npm start
```

### Dependencies Not Installing

Clear npm cache and reinstall:

```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Environment Variables Not Loading

- Ensure file is named `.env.local` (not `.env`)
- Restart the development server after changes
- Check for typos in variable names

### Build Errors

For TypeScript errors:
```bash
npm run typecheck
```

For linting errors:
```bash
npm run lint
```

## 📚 Next Steps

Once you have jaqEdu running:

1. **Read the User Guide**: Learn how to use all features
2. **Explore the Admin Panel**: If you have admin access
3. **Check the API Reference**: For integration options
4. **Join the Community**: Get help and share feedback

## 🆘 Getting Help

If you encounter issues:

1. Check the [Troubleshooting Guide](./TROUBLESHOOTING.md)
2. Search existing [GitHub Issues](https://github.com/yourusername/jaqEdu/issues)
3. Create a new issue with:
   - Your environment details
   - Steps to reproduce
   - Error messages
   - Screenshots if applicable

## 🎉 Ready to Learn!

Congratulations! You now have jaqEdu running locally. Start exploring Carl Jung's analytical psychology through our interactive platform.

---

*For advanced configuration and deployment options, see the [Configuration Guide](./CONFIGURATION_GUIDE.md) and [Deployment Guide](./DEPLOYMENT_GUIDE.md).*