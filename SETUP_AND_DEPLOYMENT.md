# jaqEdu - Setup and Deployment Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Detailed Installation](#detailed-installation)
4. [Environment Configuration](#environment-configuration)
5. [Development Workflow](#development-workflow)
6. [Testing](#testing)
7. [Build and Deployment](#build-and-deployment)
8. [Docker Setup](#docker-setup)
9. [Performance Optimization](#performance-optimization)
10. [Troubleshooting](#troubleshooting)
11. [Security Considerations](#security-considerations)

## Prerequisites

Before setting up jaqEdu, ensure you have the following installed:

### Required Software

- **Node.js**: v16.18.0 or higher (LTS recommended)
  - Check version: `node --version`
  - Download: [nodejs.org](https://nodejs.org/)

- **npm**: v8.0.0 or higher (comes with Node.js)
  - Check version: `npm --version`

- **Git**: v2.0 or higher
  - Check version: `git --version`
  - Download: [git-scm.com](https://git-scm.com/)

### Optional Software

- **Docker**: v20.0 or higher (for containerized deployment)
- **VS Code**: Recommended IDE with React/TypeScript extensions

### System Requirements

- **OS**: Windows 10+, macOS 10.15+, or Ubuntu 20.04+
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: 2GB free space

## Quick Start

Get jaqEdu running in under 5 minutes:

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/jung-edu-app.git
cd jung-edu-app

# 2. Install dependencies
npm install

# 3. Copy environment configuration
cp .env.example .env

# 4. Configure your environment (edit .env file)
# At minimum, set your OpenAI API key

# 5. Start the development server
npm start
```

The application will open at `http://localhost:3000`

## Detailed Installation

### 1. Clone the Repository

```bash
# Using HTTPS
git clone https://github.com/yourusername/jung-edu-app.git

# Using SSH (if you have SSH keys configured)
git clone git@github.com:yourusername/jung-edu-app.git

# Navigate to project directory
cd jung-edu-app
```

### 2. Install Dependencies

```bash
# Install all dependencies
npm install

# If you encounter issues, try:
npm install --legacy-peer-deps

# For a clean install:
rm -rf node_modules package-lock.json
npm install
```

### 3. Verify Installation

```bash
# Check that all required packages are installed
npm list --depth=0

# Run a quick test
npm test -- --watchAll=false
```

## Environment Configuration

### 1. Create Environment File

```bash
# Copy the example environment file
cp .env.example .env
```

### 2. Configure Required Variables

Edit `.env` and set the following:

#### OpenAI Configuration (Required)

```bash
# Get your API key from: https://platform.openai.com/api-keys
REACT_APP_OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxx

# Select AI model (optional, defaults to gpt-4o-mini)
REACT_APP_OPENAI_MODEL=gpt-4o-mini
```

#### Admin Configuration (Required for Admin Access)

```bash
# Admin username (default: admin)
REACT_APP_ADMIN_USERNAME=admin

# Generate password hash for security
# Run this command with your desired password:
node -e "const crypto = require('crypto'); const salt = crypto.randomBytes(32).toString('hex'); const password = 'your-secure-password'; const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex'); console.log('Salt:', salt); console.log('Hash:', hash);"

# Then set these values:
REACT_APP_ADMIN_PASSWORD_HASH=your_generated_hash
REACT_APP_ADMIN_SALT=your_generated_salt

# Session expiry (optional, defaults to 24 hours)
REACT_APP_SESSION_EXPIRY=86400000
```

#### YouTube Integration (Optional)

```bash
# For video features (optional)
# Get from: https://console.developers.google.com/
REACT_APP_YOUTUBE_API_KEY=your_youtube_api_key
```

### 3. Environment-Specific Configurations

Create separate environment files for different deployments:

```bash
# Development
.env.local          # Local development overrides

# Testing
.env.test           # Test environment settings

# Production
.env.production     # Production settings
```

## Development Workflow

### 1. Start Development Server

```bash
# Start with hot reload
npm start

# The app will open at http://localhost:3000
# Changes will auto-reload in the browser
```

### 2. Code Organization

```
jung-edu-app/
├── src/
│   ├── components/     # React components
│   ├── pages/         # Page components
│   ├── services/      # Business logic
│   ├── hooks/         # Custom React hooks
│   ├── styles/        # CSS and styling
│   ├── types/         # TypeScript definitions
│   └── utils/         # Utility functions
├── public/            # Static assets
├── __tests__/         # Test files
└── docs/              # Documentation
```

### 3. Development Best Practices

- **TypeScript**: All new code should be in TypeScript
- **Components**: Use functional components with hooks
- **State Management**: Use React Context for global state
- **Styling**: Tailwind CSS for styling
- **Testing**: Write tests for new features

### 4. Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/your-feature-name

# Create pull request on GitHub
```

## Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests in CI mode (no watch)
npm run test:all

# Run with coverage
npm run test:coverage

# Run specific test suites
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only

# Watch mode for development
npm run test:watch
```

### Test Structure

```
__tests__/
├── components/    # Component tests
├── services/      # Service tests
├── integration/   # Integration tests
└── utils/        # Utility tests
```

### Writing Tests

```typescript
// Example test file
import { render, screen } from '@testing-library/react';
import { YourComponent } from './YourComponent';

describe('YourComponent', () => {
  it('should render correctly', () => {
    render(<YourComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

## Build and Deployment

### 1. Production Build

```bash
# Create optimized production build
npm run build

# The build folder will contain:
# - Minified JavaScript bundles
# - Optimized CSS
# - Static assets
```

### 2. Build Configuration

For production builds, ensure these environment variables:

```bash
# .env.production
NODE_ENV=production
GENERATE_SOURCEMAP=false  # Disable source maps
REACT_APP_SESSION_EXPIRY=3600000  # Shorter session in production
```

### 3. Deployment Options

#### Option A: Static Hosting (Netlify, Vercel, GitHub Pages)

```bash
# Build the project
npm run build

# Deploy the 'build' folder to your hosting service
# For Netlify:
# - Drag and drop the build folder
# - Or use Netlify CLI: netlify deploy --prod --dir=build

# For Vercel:
# vercel --prod

# For GitHub Pages:
# npm install -g gh-pages
# npm run deploy
```

#### Option B: Traditional Web Server (Apache, Nginx)

**Nginx Configuration:**

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/jung-edu-app/build;
    index index.html;

    # Handle React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
}
```

#### Option C: Node.js Server

```bash
# Install serve globally
npm install -g serve

# Serve the build folder
serve -s build -l 3000
```

### 4. CI/CD Pipeline

**GitHub Actions Example (.github/workflows/deploy.yml):**

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm run test:all
      
    - name: Build
      run: npm run build
      env:
        REACT_APP_OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        
    - name: Deploy to Netlify
      uses: nwtgck/actions-netlify@v2.0
      with:
        publish-dir: './build'
        production-branch: main
      env:
        NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
        NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## Docker Setup

### 1. Create Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy build files
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 2. Create nginx.conf

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 3. Build and Run Docker Container

```bash
# Build Docker image
docker build -t jung-edu-app .

# Run container
docker run -d -p 80:80 \
  -e REACT_APP_OPENAI_API_KEY=your_key \
  --name jung-edu-app \
  jung-edu-app

# Check logs
docker logs jung-edu-app

# Stop container
docker stop jung-edu-app
```

### 4. Docker Compose Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "80:80"
    environment:
      - REACT_APP_OPENAI_API_KEY=${OPENAI_API_KEY}
      - REACT_APP_ADMIN_USERNAME=${ADMIN_USERNAME}
      - REACT_APP_ADMIN_PASSWORD_HASH=${ADMIN_PASSWORD_HASH}
      - REACT_APP_ADMIN_SALT=${ADMIN_SALT}
    restart: unless-stopped
```

Run with Docker Compose:

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Performance Optimization

### 1. Build Optimizations

```bash
# Analyze bundle size
npm install --save-dev webpack-bundle-analyzer

# Add to package.json scripts:
"analyze": "source-map-explorer 'build/static/js/*.js'"
```

### 2. Runtime Optimizations

- **Code Splitting**: Already configured with React.lazy()
- **Image Optimization**: Use WebP format and lazy loading
- **Caching**: Configure service worker for offline support

### 3. Environment Optimizations

```javascript
// Production optimizations in .env.production
GENERATE_SOURCEMAP=false
REACT_APP_OPENAI_MODEL=gpt-3.5-turbo  # Faster, cheaper model
```

### 4. CDN Configuration

For better performance, serve static assets from a CDN:

```bash
# Public URL for CDN
PUBLIC_URL=https://cdn.your-domain.com
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Dependencies Installation Fails

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

#### 2. OpenAI API Errors

- **Invalid API Key**: Check that your key starts with `sk-proj-`
- **Rate Limits**: Upgrade your OpenAI plan or implement rate limiting
- **Network Issues**: Check firewall and proxy settings

#### 3. Build Failures

```bash
# Check for TypeScript errors
npx tsc --noEmit

# Check for linting issues
npm run lint

# Clear build cache
rm -rf build
npm run build
```

#### 4. Runtime Errors

- **Blank Page**: Check browser console for errors
- **API Calls Failing**: Verify environment variables are set
- **Routing Issues**: Ensure server is configured for SPA routing

### Debug Mode

Enable debug logging:

```javascript
// In your .env file
REACT_APP_DEBUG=true

// In your code
if (process.env.REACT_APP_DEBUG === 'true') {
  console.log('Debug info:', data);
}
```

## Security Considerations

### 1. API Key Security

- **Never commit API keys** to version control
- Use environment variables for all secrets
- Rotate API keys regularly
- Use different keys for development and production

### 2. Admin Security

- Generate strong password hashes
- Use unique salts for each deployment
- Implement rate limiting for login attempts
- Consider adding 2FA for admin access

### 3. Production Security Checklist

- [ ] Remove all console.log statements
- [ ] Disable source maps in production
- [ ] Set secure HTTP headers
- [ ] Enable HTTPS
- [ ] Implement Content Security Policy
- [ ] Regular security updates

### 4. Data Protection

- All user data is stored locally (localStorage)
- No personal data is sent to external services
- OpenAI API calls only send course content
- Implement data retention policies

## Support and Resources

### Getting Help

1. **Documentation**: Check `/docs` folder for detailed guides
2. **Issues**: Report bugs on GitHub Issues
3. **Community**: Join our Discord server
4. **Email**: support@jaquedu.com

### Useful Links

- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [OpenAI API Reference](https://platform.openai.com/docs)

### Contributing

Please read our contributing guidelines in `CONTRIBUTING.md` before submitting pull requests.

---

**Last Updated**: January 2025
**Version**: 0.1.0