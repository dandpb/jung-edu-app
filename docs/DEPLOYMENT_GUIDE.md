# 🚀 jaqEdu Deployment Guide

Comprehensive guide for deploying jaqEdu to various hosting platforms and environments.

## 📋 Pre-Deployment Checklist

Before deploying, ensure:

- [ ] All tests passing (`npm test`)
- [ ] Build successful (`npm run build`)
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] SSL certificates obtained
- [ ] Domain name configured
- [ ] Backup strategy defined
- [ ] Monitoring tools setup

## 🏗️ Build Process

### Production Build

```bash
# Install dependencies
npm ci --production

# Run tests
npm test

# Create optimized build
npm run build

# Verify build
npm run serve
```

### Build Optimization

```javascript
// Build configuration for optimization
const config = {
  // Minification
  minify: true,
  
  // Source maps (disable for smaller size)
  sourceMaps: false,
  
  // Tree shaking
  treeShaking: true,
  
  // Code splitting
  chunks: 'all',
  
  // Compression
  compress: {
    gzip: true,
    brotli: true
  }
};
```

## 🌐 Deployment Platforms

### Vercel Deployment

#### 1. Install Vercel CLI
```bash
npm i -g vercel
```

#### 2. Configure Project
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "jung-edu-app/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "env": {
    "REACT_APP_OPENAI_API_KEY": "@openai_api_key",
    "REACT_APP_SUPABASE_URL": "@supabase_url",
    "REACT_APP_SUPABASE_ANON_KEY": "@supabase_anon_key"
  }
}
```

#### 3. Deploy
```bash
cd jung-edu-app
vercel --prod
```

### Netlify Deployment

#### 1. Configure Build
```toml
# netlify.toml
[build]
  base = "jung-edu-app"
  command = "npm run build"
  publish = "build"

[build.environment]
  NODE_VERSION = "14"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
```

#### 2. Deploy via CLI
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=jung-edu-app/build
```

### AWS Deployment

#### S3 + CloudFront Setup

##### 1. Build Application
```bash
cd jung-edu-app
npm run build
```

##### 2. S3 Bucket Configuration
```bash
# Create bucket
aws s3 mb s3://jaquedu-app

# Enable static website hosting
aws s3 website s3://jaquedu-app \
  --index-document index.html \
  --error-document error.html

# Set bucket policy
aws s3api put-bucket-policy \
  --bucket jaquedu-app \
  --policy file://bucket-policy.json
```

##### 3. Bucket Policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::jaquedu-app/*"
    }
  ]
}
```

##### 4. Upload Files
```bash
# Sync build files
aws s3 sync build/ s3://jaquedu-app \
  --delete \
  --cache-control "public, max-age=31536000" \
  --exclude "index.html" \
  --exclude "service-worker.js"

# Upload index.html with no cache
aws s3 cp build/index.html s3://jaquedu-app \
  --cache-control "no-cache, no-store, must-revalidate"
```

##### 5. CloudFront Distribution
```javascript
// CloudFront configuration
const distribution = {
  Origins: [{
    DomainName: 'jaquedu-app.s3-website.region.amazonaws.com',
    Id: 'S3-jaquedu-app',
    CustomOriginConfig: {
      OriginProtocolPolicy: 'http-only'
    }
  }],
  DefaultRootObject: 'index.html',
  CustomErrorResponses: [{
    ErrorCode: 404,
    ResponseCode: 200,
    ResponsePagePath: '/index.html'
  }],
  DefaultCacheBehavior: {
    TargetOriginId: 'S3-jaquedu-app',
    ViewerProtocolPolicy: 'redirect-to-https',
    Compress: true,
    CachePolicyId: 'Managed-CachingOptimized'
  }
};
```

### Docker Deployment

#### 1. Create Dockerfile
```dockerfile
# Build stage
FROM node:14-alpine as build
WORKDIR /app
COPY jung-edu-app/package*.json ./
RUN npm ci --only=production
COPY jung-edu-app/ ./
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### 2. Nginx Configuration
```nginx
server {
    listen 80;
    server_name jaquedu.com;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy (if needed)
    location /api {
        proxy_pass http://api-server:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 3. Build and Run
```bash
# Build image
docker build -t jaquedu:latest .

# Run container
docker run -p 80:80 \
  -e REACT_APP_OPENAI_API_KEY=$OPENAI_KEY \
  -e REACT_APP_SUPABASE_URL=$SUPABASE_URL \
  jaquedu:latest
```

### Google Cloud Platform

#### App Engine Deployment

##### 1. Create app.yaml
```yaml
runtime: nodejs14
env: standard

handlers:
- url: /static
  static_dir: build/static
  expiration: "1y"

- url: /(.*\.(json|ico|js|png|jpg|jpeg|gif|svg|woff|ttf|map))$
  static_files: build/\1
  upload: build/.*\.(json|ico|js|png|jpg|jpeg|gif|svg|woff|ttf|map)$
  expiration: "1y"

- url: /.*
  static_files: build/index.html
  upload: build/index.html
  secure: always

env_variables:
  REACT_APP_OPENAI_API_KEY: "your-key"
  REACT_APP_SUPABASE_URL: "your-url"
```

##### 2. Deploy
```bash
# Initialize project
gcloud app create --region=us-central1

# Deploy
cd jung-edu-app
npm run build
gcloud app deploy
```

## 🗄️ Database Deployment

### Supabase Setup

#### 1. Create Project
```bash
# Install Supabase CLI
npm install -g supabase

# Initialize project
supabase init

# Link to project
supabase link --project-ref your-project-ref
```

#### 2. Run Migrations
```bash
# Apply schema
supabase db push database/schema.sql

# Apply RLS policies
supabase db push database/rls_policies.sql

# Apply security enhancements
supabase db push database/security_enhancements.sql
```

#### 3. Seed Data (Optional)
```sql
-- Seed initial data
INSERT INTO modules (title, description, content, difficulty, is_published)
VALUES 
  ('Introduction to Carl Jung', 'Learn about Jung''s life and work', '{}', 'beginner', true),
  ('The Collective Unconscious', 'Explore universal patterns', '{}', 'intermediate', true);
```

### PostgreSQL Direct Setup

```bash
# Connect to database
psql -h your-host -U postgres -d jaquedu

# Run migrations
\i database/schema.sql
\i database/rls_policies.sql

# Verify
\dt
\d+ modules
```

## 🔒 Security Configuration

### SSL/TLS Setup

#### Let's Encrypt with Certbot
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d jaquedu.com -d www.jaquedu.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Environment Security

#### Production Environment Variables
```bash
# Never commit these to git!
export REACT_APP_OPENAI_API_KEY="sk-prod-xxxxx"
export REACT_APP_SUPABASE_URL="https://xxxxx.supabase.co"
export REACT_APP_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
export REACT_APP_SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
export REACT_APP_JWT_SECRET="your-super-secret-jwt-key"
```

### Security Headers

```nginx
# Nginx security headers
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.openai.com https://*.supabase.co;" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
```

## 📊 Monitoring & Analytics

### Application Monitoring

#### Sentry Integration
```javascript
// src/index.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.BrowserTracing(),
  ],
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
});
```

#### Google Analytics
```html
<!-- public/index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Performance Monitoring

#### Lighthouse CI
```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [push]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v1
      - run: npm install && npm run build
      - uses: treosh/lighthouse-ci-action@v8
        with:
          urls: |
            https://jaquedu.com
            https://jaquedu.com/dashboard
          budgetPath: ./budget.json
          uploadArtifacts: true
```

## 🔄 Continuous Deployment

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '14'
      - run: cd jung-edu-app && npm ci
      - run: cd jung-edu-app && npm test
      - run: cd jung-edu-app && npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: cd jung-edu-app && npm ci
      - run: cd jung-edu-app && npm run build
      
      # Deploy to Vercel
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID}}
          vercel-project-id: ${{ secrets.PROJECT_ID}}
          working-directory: ./jung-edu-app
```

### GitLab CI/CD

```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy

test:
  stage: test
  script:
    - cd jung-edu-app
    - npm ci
    - npm test

build:
  stage: build
  script:
    - cd jung-edu-app
    - npm ci
    - npm run build
  artifacts:
    paths:
      - jung-edu-app/build

deploy:
  stage: deploy
  script:
    - cd jung-edu-app
    - npm install -g netlify-cli
    - netlify deploy --site $NETLIFY_SITE_ID --auth $NETLIFY_AUTH_TOKEN --prod --dir=build
  only:
    - main
```

## 🔙 Rollback Strategy

### Version Control

```bash
# Tag releases
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# Rollback to previous version
git checkout v0.9.0
npm run build
# Deploy previous version
```

### Database Rollback

```sql
-- Keep rollback scripts
-- database/rollback/v1.0.0-rollback.sql
BEGIN;
  -- Rollback changes
  ALTER TABLE modules DROP COLUMN new_feature;
  -- More rollback statements
COMMIT;
```

### Blue-Green Deployment

```nginx
# Switch between deployments
upstream app {
  server blue.jaquedu.com weight=100;
  server green.jaquedu.com weight=0;
}
```

## 📈 Post-Deployment

### Health Checks

```javascript
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: process.env.npm_package_version,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});
```

### Smoke Tests

```bash
# Basic smoke test
curl -f https://jaquedu.com/health || exit 1
curl -f https://jaquedu.com || exit 1
curl -f https://jaquedu.com/api/health || exit 1
```

### Performance Testing

```bash
# Load testing with k6
k6 run --vus 100 --duration 30s loadtest.js
```

## 🆘 Deployment Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node version
   - Verify dependencies
   - Review build logs

2. **Environment Variables**
   - Ensure all required vars set
   - Check for typos
   - Verify secret management

3. **Database Connection**
   - Check connection strings
   - Verify SSL requirements
   - Test from deployment environment

4. **CORS Issues**
   - Configure allowed origins
   - Check API endpoints
   - Verify headers

### Emergency Procedures

```bash
# Quick rollback
./scripts/emergency-rollback.sh v0.9.0

# Maintenance mode
./scripts/enable-maintenance.sh

# Clear CDN cache
./scripts/clear-cdn-cache.sh
```

---

*For ongoing maintenance and monitoring, see the [Admin Guide](./ADMIN_GUIDE.md).*