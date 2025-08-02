# ⚙️ jaqEdu Configuration Guide

This guide covers all configuration options for jaqEdu, including environment variables, feature flags, and system settings.

## 🔧 Environment Configuration

### Required Environment Variables

These variables MUST be set for the application to function:

```env
# OpenAI API Configuration
REACT_APP_OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
# Required for AI features like content generation, quiz creation

# Admin Authentication
REACT_APP_ADMIN_USERNAME=admin
REACT_APP_ADMIN_PASSWORD_HASH=generated_hash_here
REACT_APP_ADMIN_SALT=generated_salt_here
# Use npm run generate-admin-credentials to create these
```

### Optional Environment Variables

#### Database Configuration

```env
# Supabase Configuration (for persistent storage)
REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
REACT_APP_SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database Connection (for direct access)
DATABASE_URL=postgresql://postgres:password@localhost:5432/jaquedu
```

#### API Keys and External Services

```env
# YouTube API (for video integration)
REACT_APP_YOUTUBE_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxx

# Additional LLM Providers
REACT_APP_ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
REACT_APP_GOOGLE_AI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxx
```

#### Feature Configuration

```env
# LLM Model Selection
REACT_APP_OPENAI_MODEL=gpt-4o-mini  # Options: gpt-4, gpt-4o-mini, gpt-3.5-turbo
REACT_APP_DEFAULT_LLM_PROVIDER=openai  # Options: openai, anthropic, google

# Feature Flags
REACT_APP_ENABLE_AI_FEATURES=true
REACT_APP_ENABLE_OFFLINE_MODE=true
REACT_APP_ENABLE_ANALYTICS=false
REACT_APP_ENABLE_DEMO_MODE=false
```

#### Application Settings

```env
# Server Configuration
PORT=3000
REACT_APP_API_URL=http://localhost:3000
REACT_APP_WEBSOCKET_URL=ws://localhost:3000

# Security
REACT_APP_JWT_SECRET=your-secret-key-here
REACT_APP_JWT_EXPIRY=15m
REACT_APP_REFRESH_TOKEN_EXPIRY=7d
REACT_APP_SESSION_TIMEOUT=30m

# Localization
REACT_APP_DEFAULT_LANGUAGE=pt-BR
REACT_APP_SUPPORTED_LANGUAGES=pt-BR,en,es
```

## 📁 Configuration Files

### 1. TypeScript Configuration (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "exclude": ["node_modules", "build", "dist"]
}
```

### 2. Tailwind Configuration (`tailwind.config.js`)

```javascript
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#3b82f6',
          700: '#1d4ed8',
          900: '#1e3a8a'
        },
        jung: {
          purple: '#6B46C1',
          gold: '#F59E0B',
          teal: '#14B8A6'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'serif']
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography')
  ]
}
```

### 3. Jest Configuration (`jest.config.js`)

```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
```

## 🎨 Theme Configuration

### Light/Dark Mode Settings

Configure theme preferences in `src/config/theme.ts`:

```typescript
export const themes = {
  light: {
    primary: '#6B46C1',
    secondary: '#F59E0B',
    background: '#FFFFFF',
    surface: '#F3F4F6',
    text: '#111827',
    textSecondary: '#6B7280'
  },
  dark: {
    primary: '#8B5CF6',
    secondary: '#FCD34D',
    background: '#111827',
    surface: '#1F2937',
    text: '#F9FAFB',
    textSecondary: '#D1D5DB'
  }
};
```

## 🔐 Security Configuration

### Password Policy

Configure in `src/config/security.ts`:

```typescript
export const passwordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
  preventUserInfoInPassword: true
};
```

### Session Configuration

```typescript
export const sessionConfig = {
  timeout: 30 * 60 * 1000, // 30 minutes
  warningTime: 5 * 60 * 1000, // 5 minute warning
  maxSessions: 3, // Max concurrent sessions
  rememberMeDuration: 7 * 24 * 60 * 60 * 1000 // 7 days
};
```

### CORS Settings

For API endpoints:

```typescript
export const corsConfig = {
  origin: process.env.REACT_APP_ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
```

## 🤖 AI/LLM Configuration

### OpenAI Settings

```typescript
export const openAIConfig = {
  model: process.env.REACT_APP_OPENAI_MODEL || 'gpt-4o-mini',
  temperature: 0.7,
  maxTokens: 2000,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
  timeout: 30000 // 30 seconds
};
```

### Content Generation Settings

```typescript
export const contentGenerationConfig = {
  module: {
    minSections: 3,
    maxSections: 8,
    includeGlossary: true,
    includeExamples: true,
    targetWordCount: 2000
  },
  quiz: {
    defaultQuestionCount: 10,
    minQuestions: 5,
    maxQuestions: 20,
    includeExplanations: true,
    difficultyDistribution: {
      easy: 0.3,
      medium: 0.5,
      hard: 0.2
    }
  }
};
```

## 📊 Analytics Configuration

### Google Analytics (Optional)

```env
REACT_APP_GA_TRACKING_ID=UA-XXXXXXXXX-X
REACT_APP_GA_DEBUG=false
```

### Custom Analytics

```typescript
export const analyticsConfig = {
  trackPageViews: true,
  trackEvents: true,
  trackErrors: true,
  excludePaths: ['/admin', '/debug'],
  anonymizeIP: true,
  respectDoNotTrack: true
};
```

## 🌐 Localization Configuration

### Language Settings

```typescript
export const i18nConfig = {
  defaultLanguage: 'pt-BR',
  fallbackLanguage: 'en',
  supportedLanguages: ['pt-BR', 'en', 'es'],
  loadPath: '/locales/{{lng}}/{{ns}}.json',
  detection: {
    order: ['localStorage', 'navigator', 'htmlTag'],
    caches: ['localStorage']
  }
};
```

## 🚀 Performance Configuration

### React Performance

```typescript
export const performanceConfig = {
  enableProfiling: process.env.NODE_ENV === 'development',
  warnOnSlowComponents: true,
  slowComponentThreshold: 16, // ms
  enableWhyDidYouRender: false
};
```

### API Performance

```typescript
export const apiConfig = {
  timeout: 30000, // 30 seconds
  retries: 3,
  retryDelay: 1000,
  cache: {
    enabled: true,
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 50 // MB
  }
};
```

## 📱 Mobile Configuration

### Responsive Breakpoints

```typescript
export const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
};
```

### Touch Settings

```typescript
export const touchConfig = {
  swipeThreshold: 50,
  tapDelay: 300,
  doubleTapDelay: 500,
  longPressDelay: 500
};
```

## 🧪 Development Configuration

### Development Tools

```env
# Enable React Developer Tools
REACT_APP_ENABLE_DEVTOOLS=true

# Enable Redux DevTools (if using Redux)
REACT_APP_ENABLE_REDUX_DEVTOOLS=true

# Mock API Responses
REACT_APP_USE_MOCK_API=false

# Log Level
REACT_APP_LOG_LEVEL=debug # Options: error, warn, info, debug
```

### Hot Module Replacement

```javascript
// In src/index.tsx
if (module.hot && process.env.NODE_ENV === 'development') {
  module.hot.accept();
}
```

## 🔄 Build Configuration

### Production Optimizations

```env
# Build Configuration
GENERATE_SOURCEMAP=false
INLINE_RUNTIME_CHUNK=false
IMAGE_INLINE_SIZE_LIMIT=10000

# Code Splitting
REACT_APP_LAZY_LOAD_ROUTES=true
REACT_APP_CHUNK_RETRY_ATTEMPTS=3
```

### Build Scripts

```json
{
  "scripts": {
    "build:prod": "NODE_ENV=production npm run build",
    "build:staging": "NODE_ENV=staging npm run build",
    "build:analyze": "source-map-explorer 'build/static/js/*.js'"
  }
}
```

## 🐳 Docker Configuration

### Dockerfile Environment

```dockerfile
# Build args
ARG NODE_ENV=production
ARG REACT_APP_API_URL

# Runtime environment
ENV NODE_ENV=${NODE_ENV}
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
```

### Docker Compose Variables

```yaml
services:
  app:
    environment:
      - NODE_ENV=production
      - REACT_APP_API_URL=${API_URL}
      - REACT_APP_SUPABASE_URL=${SUPABASE_URL}
```

## 📝 Configuration Best Practices

1. **Never commit sensitive data**
   - Use `.env.local` for local development
   - Add `.env*` to `.gitignore`
   - Use environment variables in CI/CD

2. **Use meaningful defaults**
   - Provide sensible defaults for optional configs
   - Document all configuration options
   - Validate configuration on startup

3. **Environment-specific configs**
   - Separate configs for dev/staging/prod
   - Use environment detection
   - Override via environment variables

4. **Configuration validation**
   ```typescript
   function validateConfig() {
     if (!process.env.REACT_APP_OPENAI_API_KEY) {
       throw new Error('OpenAI API key is required');
     }
     // Add more validations
   }
   ```

5. **Centralized configuration**
   - Keep all config in one place
   - Export typed configuration objects
   - Use configuration providers

---

*For deployment-specific configuration, see the [Deployment Guide](./DEPLOYMENT_GUIDE.md).*