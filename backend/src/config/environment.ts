/**
 * Environment Configuration Validation
 * Comprehensive environment variable validation and type definitions
 * @fileoverview Validates and types all environment configurations for jaqEdu
 */

import { z } from 'zod';

/**
 * Database configuration schema
 */
const DatabaseConfigSchema = z.object({
  host: z.string().min(1, 'Database host is required'),
  port: z.coerce.number().int().min(1).max(65535),
  database: z.string().min(1, 'Database name is required'),
  username: z.string().min(1, 'Database username is required'),
  password: z.string().min(1, 'Database password is required'),
  ssl: z.boolean().default(false),
  pool: z.object({
    min: z.coerce.number().int().min(0).default(2),
    max: z.coerce.number().int().min(1).default(10),
    acquire: z.coerce.number().int().min(1000).default(30000),
    idle: z.coerce.number().int().min(1000).default(10000),
  }).default({}),
});

/**
 * Redis configuration schema
 */
const RedisConfigSchema = z.object({
  host: z.string().min(1, 'Redis host is required'),
  port: z.coerce.number().int().min(1).max(65535),
  password: z.string().optional(),
  db: z.coerce.number().int().min(0).max(15).default(0),
  keyPrefix: z.string().default('jaqedu:'),
  retryDelayOnFailover: z.coerce.number().int().default(100),
  maxRetriesPerRequest: z.coerce.number().int().default(3),
});

/**
 * JWT configuration schema
 */
const JWTConfigSchema = z.object({
  secret: z.string().min(32, 'JWT secret must be at least 32 characters'),
  expiresIn: z.string().default('7d'),
  refreshExpiresIn: z.string().default('30d'),
  issuer: z.string().default('jaqedu'),
  audience: z.string().default('jaqedu-users'),
});

/**
 * Email configuration schema
 */
const EmailConfigSchema = z.object({
  provider: z.enum(['smtp', 'sendgrid', 'mailgun', 'ses']).default('smtp'),
  smtp: z.object({
    host: z.string(),
    port: z.coerce.number().int(),
    secure: z.boolean().default(false),
    auth: z.object({
      user: z.string(),
      pass: z.string(),
    }),
  }).optional(),
  sendgrid: z.object({
    apiKey: z.string(),
  }).optional(),
  mailgun: z.object({
    domain: z.string(),
    apiKey: z.string(),
  }).optional(),
  ses: z.object({
    region: z.string(),
    accessKeyId: z.string(),
    secretAccessKey: z.string(),
  }).optional(),
  from: z.object({
    name: z.string().default('jaqEdu'),
    email: z.string().email(),
  }),
});

/**
 * Storage configuration schema
 */
const StorageConfigSchema = z.object({
  provider: z.enum(['local', 's3', 'gcs', 'azure']).default('local'),
  local: z.object({
    uploadPath: z.string().default('./uploads'),
    maxFileSize: z.coerce.number().int().default(10485760), // 10MB
  }).optional(),
  s3: z.object({
    region: z.string(),
    bucket: z.string(),
    accessKeyId: z.string(),
    secretAccessKey: z.string(),
    endpoint: z.string().optional(),
  }).optional(),
  gcs: z.object({
    projectId: z.string(),
    keyFilename: z.string(),
    bucket: z.string(),
  }).optional(),
  azure: z.object({
    accountName: z.string(),
    accountKey: z.string(),
    containerName: z.string(),
  }).optional(),
});

/**
 * AI/LLM configuration schema
 */
const AIConfigSchema = z.object({
  openai: z.object({
    apiKey: z.string().min(1, 'OpenAI API key is required'),
    model: z.string().default('gpt-3.5-turbo'),
    maxTokens: z.coerce.number().int().min(1).default(2000),
    temperature: z.coerce.number().min(0).max(2).default(0.7),
  }),
  claude: z.object({
    apiKey: z.string().optional(),
    model: z.string().default('claude-3-sonnet-20240229'),
  }).optional(),
  gemini: z.object({
    apiKey: z.string().optional(),
    model: z.string().default('gemini-pro'),
  }).optional(),
});

/**
 * Monitoring configuration schema
 */
const MonitoringConfigSchema = z.object({
  logging: z.object({
    level: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    format: z.enum(['json', 'text']).default('json'),
    file: z.object({
      enabled: z.boolean().default(true),
      path: z.string().default('./logs'),
      maxSize: z.string().default('10m'),
      maxFiles: z.coerce.number().int().default(5),
    }),
    console: z.object({
      enabled: z.boolean().default(true),
      colorize: z.boolean().default(true),
    }),
  }),
  metrics: z.object({
    enabled: z.boolean().default(true),
    endpoint: z.string().default('/metrics'),
    collectInterval: z.coerce.number().int().default(15000),
  }),
  healthCheck: z.object({
    enabled: z.boolean().default(true),
    endpoint: z.string().default('/health'),
    timeout: z.coerce.number().int().default(5000),
  }),
  sentry: z.object({
    dsn: z.string().optional(),
    environment: z.string().optional(),
    tracesSampleRate: z.coerce.number().min(0).max(1).default(0.1),
  }).optional(),
});

/**
 * Security configuration schema
 */
const SecurityConfigSchema = z.object({
  cors: z.object({
    origin: z.union([
      z.string(),
      z.array(z.string()),
      z.boolean(),
    ]).default('*'),
    credentials: z.boolean().default(true),
    methods: z.array(z.string()).default(['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']),
  }),
  rateLimit: z.object({
    windowMs: z.coerce.number().int().default(900000), // 15 minutes
    max: z.coerce.number().int().default(100),
    message: z.string().default('Too many requests, please try again later'),
    standardHeaders: z.boolean().default(true),
    legacyHeaders: z.boolean().default(false),
  }),
  helmet: z.object({
    contentSecurityPolicy: z.boolean().default(true),
    crossOriginEmbedderPolicy: z.boolean().default(true),
    crossOriginOpenerPolicy: z.boolean().default(true),
    crossOriginResourcePolicy: z.boolean().default(true),
    dnsPrefetchControl: z.boolean().default(true),
    frameguard: z.boolean().default(true),
    hidePoweredBy: z.boolean().default(true),
    hsts: z.boolean().default(true),
    ieNoOpen: z.boolean().default(true),
    noSniff: z.boolean().default(true),
    originAgentCluster: z.boolean().default(true),
    permittedCrossDomainPolicies: z.boolean().default(true),
    referrerPolicy: z.boolean().default(true),
    xssFilter: z.boolean().default(true),
  }),
  encryption: z.object({
    algorithm: z.string().default('aes-256-gcm'),
    keyLength: z.coerce.number().int().default(32),
    ivLength: z.coerce.number().int().default(16),
  }),
});

/**
 * Cache configuration schema
 */
const CacheConfigSchema = z.object({
  ttl: z.coerce.number().int().default(3600), // 1 hour
  maxKeys: z.coerce.number().int().default(1000),
  updateAgeOnGet: z.boolean().default(true),
  useClones: z.boolean().default(false),
  checkperiod: z.coerce.number().int().default(600), // 10 minutes
});

/**
 * Main environment configuration schema
 */
const EnvironmentConfigSchema = z.object({
  // Basic environment settings
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  HOST: z.string().default('localhost'),
  
  // Application settings
  APP_NAME: z.string().default('jaqEdu'),
  APP_VERSION: z.string().default('1.0.0'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  API_PREFIX: z.string().default('/api/v1'),
  
  // Feature flags
  ENABLE_SWAGGER: z.boolean().default(true),
  ENABLE_REGISTRATION: z.boolean().default(true),
  ENABLE_EMAIL_VERIFICATION: z.boolean().default(false),
  ENABLE_TWO_FACTOR: z.boolean().default(false),
  ENABLE_SOCIAL_LOGIN: z.boolean().default(false),
  ENABLE_ANALYTICS: z.boolean().default(true),
  ENABLE_MONITORING: z.boolean().default(true),
  
  // Database configuration
  database: DatabaseConfigSchema,
  
  // Redis configuration (optional)
  redis: RedisConfigSchema.optional(),
  
  // JWT configuration
  jwt: JWTConfigSchema,
  
  // Email configuration
  email: EmailConfigSchema,
  
  // Storage configuration
  storage: StorageConfigSchema,
  
  // AI configuration
  ai: AIConfigSchema,
  
  // Monitoring configuration
  monitoring: MonitoringConfigSchema,
  
  // Security configuration
  security: SecurityConfigSchema,
  
  // Cache configuration
  cache: CacheConfigSchema,
  
  // Third-party integrations
  integrations: z.object({
    youtube: z.object({
      apiKey: z.string().optional(),
      maxResults: z.coerce.number().int().default(10),
    }).optional(),
    stripe: z.object({
      publicKey: z.string().optional(),
      secretKey: z.string().optional(),
      webhookSecret: z.string().optional(),
    }).optional(),
    zoom: z.object({
      apiKey: z.string().optional(),
      apiSecret: z.string().optional(),
    }).optional(),
  }).default({}),
});

/**
 * Environment configuration type
 */
export type EnvironmentConfig = z.infer<typeof EnvironmentConfigSchema>;

/**
 * Environment validation error class
 */
export class EnvironmentValidationError extends Error {
  constructor(
    message: string,
    public errors: z.ZodError
  ) {
    super(message);
    this.name = 'EnvironmentValidationError';
  }
}

/**
 * Load and validate environment configuration
 * @returns Validated environment configuration
 * @throws {EnvironmentValidationError} When validation fails
 */
export function loadEnvironmentConfig(): EnvironmentConfig {
  try {
    const config = {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      HOST: process.env.HOST,
      APP_NAME: process.env.APP_NAME,
      APP_VERSION: process.env.APP_VERSION,
      APP_URL: process.env.APP_URL,
      API_PREFIX: process.env.API_PREFIX,
      
      ENABLE_SWAGGER: process.env.ENABLE_SWAGGER === 'true',
      ENABLE_REGISTRATION: process.env.ENABLE_REGISTRATION !== 'false',
      ENABLE_EMAIL_VERIFICATION: process.env.ENABLE_EMAIL_VERIFICATION === 'true',
      ENABLE_TWO_FACTOR: process.env.ENABLE_TWO_FACTOR === 'true',
      ENABLE_SOCIAL_LOGIN: process.env.ENABLE_SOCIAL_LOGIN === 'true',
      ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS !== 'false',
      ENABLE_MONITORING: process.env.ENABLE_MONITORING !== 'false',
      
      database: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || '5432',
        database: process.env.DB_NAME || 'jaqedu',
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        ssl: process.env.DB_SSL === 'true',
        pool: {
          min: process.env.DB_POOL_MIN,
          max: process.env.DB_POOL_MAX,
          acquire: process.env.DB_POOL_ACQUIRE,
          idle: process.env.DB_POOL_IDLE,
        },
      },
      
      redis: process.env.REDIS_HOST ? {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT || '6379',
        password: process.env.REDIS_PASSWORD,
        db: process.env.REDIS_DB,
        keyPrefix: process.env.REDIS_KEY_PREFIX,
        retryDelayOnFailover: process.env.REDIS_RETRY_DELAY,
        maxRetriesPerRequest: process.env.REDIS_MAX_RETRIES,
      } : undefined,
      
      jwt: {
        secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-here',
        expiresIn: process.env.JWT_EXPIRES_IN,
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
        issuer: process.env.JWT_ISSUER,
        audience: process.env.JWT_AUDIENCE,
      },
      
      email: {
        provider: process.env.EMAIL_PROVIDER || 'smtp',
        smtp: process.env.SMTP_HOST ? {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || '',
          },
        } : undefined,
        sendgrid: process.env.SENDGRID_API_KEY ? {
          apiKey: process.env.SENDGRID_API_KEY,
        } : undefined,
        mailgun: process.env.MAILGUN_DOMAIN ? {
          domain: process.env.MAILGUN_DOMAIN,
          apiKey: process.env.MAILGUN_API_KEY || '',
        } : undefined,
        ses: process.env.AWS_SES_REGION ? {
          region: process.env.AWS_SES_REGION,
          accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY || '',
        } : undefined,
        from: {
          name: process.env.EMAIL_FROM_NAME,
          email: process.env.EMAIL_FROM_ADDRESS || 'noreply@jaqedu.com',
        },
      },
      
      storage: {
        provider: process.env.STORAGE_PROVIDER || 'local',
        local: {
          uploadPath: process.env.UPLOAD_PATH,
          maxFileSize: process.env.MAX_FILE_SIZE,
        },
        s3: process.env.AWS_S3_BUCKET ? {
          region: process.env.AWS_S3_REGION || '',
          bucket: process.env.AWS_S3_BUCKET,
          accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY || '',
          endpoint: process.env.AWS_S3_ENDPOINT,
        } : undefined,
      },
      
      ai: {
        openai: {
          apiKey: process.env.OPENAI_API_KEY || '',
          model: process.env.OPENAI_MODEL,
          maxTokens: process.env.OPENAI_MAX_TOKENS,
          temperature: process.env.OPENAI_TEMPERATURE,
        },
        claude: process.env.CLAUDE_API_KEY ? {
          apiKey: process.env.CLAUDE_API_KEY,
          model: process.env.CLAUDE_MODEL,
        } : undefined,
      },
      
      monitoring: {
        logging: {
          level: process.env.LOG_LEVEL,
          format: process.env.LOG_FORMAT,
          file: {
            enabled: process.env.LOG_FILE_ENABLED !== 'false',
            path: process.env.LOG_FILE_PATH,
            maxSize: process.env.LOG_FILE_MAX_SIZE,
            maxFiles: process.env.LOG_FILE_MAX_FILES,
          },
          console: {
            enabled: process.env.LOG_CONSOLE_ENABLED !== 'false',
            colorize: process.env.LOG_CONSOLE_COLORIZE !== 'false',
          },
        },
        metrics: {
          enabled: process.env.METRICS_ENABLED !== 'false',
          endpoint: process.env.METRICS_ENDPOINT,
          collectInterval: process.env.METRICS_COLLECT_INTERVAL,
        },
        healthCheck: {
          enabled: process.env.HEALTH_CHECK_ENABLED !== 'false',
          endpoint: process.env.HEALTH_CHECK_ENDPOINT,
          timeout: process.env.HEALTH_CHECK_TIMEOUT,
        },
        sentry: process.env.SENTRY_DSN ? {
          dsn: process.env.SENTRY_DSN,
          environment: process.env.SENTRY_ENVIRONMENT,
          tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE,
        } : undefined,
      },
      
      security: {
        cors: {
          origin: process.env.CORS_ORIGIN || '*',
          credentials: process.env.CORS_CREDENTIALS !== 'false',
          methods: process.env.CORS_METHODS?.split(',') || undefined,
        },
        rateLimit: {
          windowMs: process.env.RATE_LIMIT_WINDOW_MS,
          max: process.env.RATE_LIMIT_MAX,
          message: process.env.RATE_LIMIT_MESSAGE,
          standardHeaders: process.env.RATE_LIMIT_STANDARD_HEADERS !== 'false',
          legacyHeaders: process.env.RATE_LIMIT_LEGACY_HEADERS === 'true',
        },
        helmet: {
          contentSecurityPolicy: process.env.HELMET_CSP !== 'false',
          crossOriginEmbedderPolicy: process.env.HELMET_COEP !== 'false',
          crossOriginOpenerPolicy: process.env.HELMET_COOP !== 'false',
          crossOriginResourcePolicy: process.env.HELMET_CORP !== 'false',
          dnsPrefetchControl: process.env.HELMET_DNS_PREFETCH_CONTROL !== 'false',
          frameguard: process.env.HELMET_FRAMEGUARD !== 'false',
          hidePoweredBy: process.env.HELMET_HIDE_POWERED_BY !== 'false',
          hsts: process.env.HELMET_HSTS !== 'false',
          ieNoOpen: process.env.HELMET_IE_NO_OPEN !== 'false',
          noSniff: process.env.HELMET_NO_SNIFF !== 'false',
          originAgentCluster: process.env.HELMET_ORIGIN_AGENT_CLUSTER !== 'false',
          permittedCrossDomainPolicies: process.env.HELMET_PERMITTED_CROSS_DOMAIN_POLICIES !== 'false',
          referrerPolicy: process.env.HELMET_REFERRER_POLICY !== 'false',
          xssFilter: process.env.HELMET_XSS_FILTER !== 'false',
        },
        encryption: {
          algorithm: process.env.ENCRYPTION_ALGORITHM,
          keyLength: process.env.ENCRYPTION_KEY_LENGTH,
          ivLength: process.env.ENCRYPTION_IV_LENGTH,
        },
      },
      
      cache: {
        ttl: process.env.CACHE_TTL,
        maxKeys: process.env.CACHE_MAX_KEYS,
        updateAgeOnGet: process.env.CACHE_UPDATE_AGE_ON_GET !== 'false',
        useClones: process.env.CACHE_USE_CLONES === 'true',
        checkperiod: process.env.CACHE_CHECK_PERIOD,
      },
      
      integrations: {
        youtube: process.env.YOUTUBE_API_KEY ? {
          apiKey: process.env.YOUTUBE_API_KEY,
          maxResults: process.env.YOUTUBE_MAX_RESULTS,
        } : undefined,
        stripe: process.env.STRIPE_PUBLIC_KEY ? {
          publicKey: process.env.STRIPE_PUBLIC_KEY,
          secretKey: process.env.STRIPE_SECRET_KEY,
          webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
        } : undefined,
      },
    };

    return EnvironmentConfigSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new EnvironmentValidationError(
        'Environment configuration validation failed',
        error
      );
    }
    throw error;
  }
}

/**
 * Get environment configuration (singleton pattern)
 */
let environmentConfig: EnvironmentConfig | null = null;

export function getEnvironmentConfig(): EnvironmentConfig {
  if (!environmentConfig) {
    environmentConfig = loadEnvironmentConfig();
  }
  return environmentConfig;
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return getEnvironmentConfig().NODE_ENV === 'development';
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return getEnvironmentConfig().NODE_ENV === 'production';
}

/**
 * Check if running in test mode
 */
export function isTest(): boolean {
  return getEnvironmentConfig().NODE_ENV === 'test';
}

/**
 * Example .env file contents for development
 */
export const exampleEnvFile = `
# Basic Configuration
NODE_ENV=development
PORT=3000
HOST=localhost
APP_NAME=jaqEdu
APP_VERSION=1.0.0
APP_URL=http://localhost:3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=jaqedu_dev
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_SSL=false
DB_POOL_MIN=2
DB_POOL_MAX=10

# Redis Configuration (Optional)
# REDIS_HOST=localhost
# REDIS_PORT=6379
# REDIS_PASSWORD=your_redis_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-that-is-at-least-32-characters-long
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Email Configuration
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your.email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM_NAME=jaqEdu
EMAIL_FROM_ADDRESS=noreply@jaqedu.com

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=2000
OPENAI_temperature=0.7

# Storage Configuration
STORAGE_PROVIDER=local
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# Feature Flags
ENABLE_SWAGGER=true
ENABLE_REGISTRATION=true
ENABLE_EMAIL_VERIFICATION=false
ENABLE_ANALYTICS=true

# Security Configuration
CORS_ORIGIN=*
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Monitoring
LOG_LEVEL=info
METRICS_ENABLED=true
HEALTH_CHECK_ENABLED=true

# External Integrations (Optional)
# YOUTUBE_API_KEY=your_youtube_api_key
# STRIPE_PUBLIC_KEY=pk_test_...
# STRIPE_SECRET_KEY=sk_test_...
`;

export default getEnvironmentConfig;