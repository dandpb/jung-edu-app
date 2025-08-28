/**
 * Security Policy Configuration
 * Comprehensive security policies, rules, and enforcement mechanisms
 * @fileoverview Defines security configurations, policies, and validation rules for jaqEdu
 */

import { z } from 'zod';
import crypto from 'crypto';

/**
 * Security threat levels
 */
export enum ThreatLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Authentication methods
 */
export enum AuthMethod {
  PASSWORD = 'password',
  TWO_FACTOR = '2fa',
  BIOMETRIC = 'biometric',
  SOCIAL_LOGIN = 'social',
  SSO = 'sso',
  API_KEY = 'api_key',
  JWT = 'jwt'
}

/**
 * Access control models
 */
export enum AccessControlModel {
  RBAC = 'rbac', // Role-Based Access Control
  ABAC = 'abac', // Attribute-Based Access Control
  DAC = 'dac',   // Discretionary Access Control
  MAC = 'mac'    // Mandatory Access Control
}

/**
 * Encryption algorithms
 */
export enum EncryptionAlgorithm {
  AES_256_GCM = 'aes-256-gcm',
  AES_256_CBC = 'aes-256-cbc',
  CHACHA20_POLY1305 = 'chacha20-poly1305',
  RSA_OAEP = 'rsa-oaep'
}

/**
 * Password policy configuration schema
 */
const PasswordPolicySchema = z.object({
  minLength: z.number().int().min(8).max(128).default(12),
  maxLength: z.number().int().min(8).max(256).default(64),
  requireUppercase: z.boolean().default(true),
  requireLowercase: z.boolean().default(true),
  requireNumbers: z.boolean().default(true),
  requireSpecialChars: z.boolean().default(true),
  specialCharsPattern: z.string().default('!@#$%^&*()_+-=[]{}|;:,.<>?'),
  preventReuse: z.number().int().min(0).max(24).default(5),
  maxAge: z.number().int().min(0).default(90), // days, 0 = no expiration
  lockoutThreshold: z.number().int().min(1).max(10).default(5),
  lockoutDuration: z.number().int().min(1).default(900), // seconds
  passwordHistorySize: z.number().int().min(0).default(5),
  complexityScore: z.number().int().min(1).max(5).default(3),
  dictionaryCheck: z.boolean().default(true),
  personalDataCheck: z.boolean().default(true),
});

/**
 * Session security configuration schema
 */
const SessionSecuritySchema = z.object({
  cookieSettings: z.object({
    secure: z.boolean().default(true),
    httpOnly: z.boolean().default(true),
    sameSite: z.enum(['strict', 'lax', 'none']).default('strict'),
    maxAge: z.number().int().min(300).default(3600), // seconds
    domain: z.string().optional(),
    path: z.string().default('/'),
  }),
  tokenSettings: z.object({
    algorithm: z.string().default('HS256'),
    expiresIn: z.string().default('1h'),
    issuer: z.string().default('jaqedu'),
    audience: z.string().default('jaqedu-users'),
    notBefore: z.string().optional(),
    jwtid: z.boolean().default(true),
    clockTolerance: z.number().int().default(30), // seconds
  }),
  sessionManagement: z.object({
    maxConcurrentSessions: z.number().int().min(1).default(5),
    idleTimeout: z.number().int().min(300).default(1800), // seconds
    absoluteTimeout: z.number().int().min(3600).default(28800), // seconds
    renewThreshold: z.number().min(0.1).max(0.9).default(0.75),
    ipValidation: z.boolean().default(false),
    userAgentValidation: z.boolean().default(false),
  }),
});

/**
 * Rate limiting configuration schema
 */
const RateLimitingSchema = z.object({
  global: z.object({
    windowMs: z.number().int().min(1000).default(900000), // 15 minutes
    max: z.number().int().min(1).default(1000),
    skipSuccessfulRequests: z.boolean().default(false),
    skipFailedRequests: z.boolean().default(false),
  }),
  byEndpoint: z.record(z.object({
    windowMs: z.number().int().min(1000),
    max: z.number().int().min(1),
    skipSuccessfulRequests: z.boolean().default(false),
    skipFailedRequests: z.boolean().default(false),
  })).default({}),
  byUser: z.object({
    windowMs: z.number().int().min(1000).default(3600000), // 1 hour
    max: z.number().int().min(1).default(100),
  }),
  byIP: z.object({
    windowMs: z.number().int().min(1000).default(900000), // 15 minutes
    max: z.number().int().min(1).default(500),
  }),
  bruteForceProtection: z.object({
    enabled: z.boolean().default(true),
    freeRetries: z.number().int().min(1).default(3),
    minWait: z.number().int().min(1000).default(5000), // milliseconds
    maxWait: z.number().int().min(5000).default(900000), // milliseconds
    lifetime: z.number().int().min(60000).default(86400000), // milliseconds
  }),
});

/**
 * Input validation configuration schema
 */
const InputValidationSchema = z.object({
  sanitization: z.object({
    enabled: z.boolean().default(true),
    htmlSanitization: z.boolean().default(true),
    sqlInjectionPrevention: z.boolean().default(true),
    xssProtection: z.boolean().default(true),
    commandInjectionPrevention: z.boolean().default(true),
    pathTraversalPrevention: z.boolean().default(true),
  }),
  validation: z.object({
    strictMode: z.boolean().default(true),
    maxStringLength: z.number().int().min(1).default(10000),
    maxArrayLength: z.number().int().min(1).default(100),
    maxObjectDepth: z.number().int().min(1).default(10),
    allowedFileTypes: z.array(z.string()).default([
      'jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'txt', 'mp4', 'mp3'
    ]),
    maxFileSize: z.number().int().min(1).default(10485760), // 10MB
  }),
  contentSecurityPolicy: z.object({
    enabled: z.boolean().default(true),
    directives: z.object({
      defaultSrc: z.array(z.string()).default(["'self'"]),
      scriptSrc: z.array(z.string()).default(["'self'", "'unsafe-inline'"]),
      styleSrc: z.array(z.string()).default(["'self'", "'unsafe-inline'"]),
      imgSrc: z.array(z.string()).default(["'self'", 'data:', 'https:']),
      connectSrc: z.array(z.string()).default(["'self'"]),
      fontSrc: z.array(z.string()).default(["'self'"]),
      objectSrc: z.array(z.string()).default(["'none'"]),
      mediaSrc: z.array(z.string()).default(["'self'"]),
      frameSrc: z.array(z.string()).default(["'none'"]),
    }),
    reportOnly: z.boolean().default(false),
    reportUri: z.string().optional(),
  }),
});

/**
 * Encryption configuration schema
 */
const EncryptionConfigSchema = z.object({
  atRest: z.object({
    enabled: z.boolean().default(true),
    algorithm: z.nativeEnum(EncryptionAlgorithm).default(EncryptionAlgorithm.AES_256_GCM),
    keyRotationInterval: z.number().int().min(1).default(90), // days
    keyDerivationIterations: z.number().int().min(1000).default(100000),
  }),
  inTransit: z.object({
    enforceHTTPS: z.boolean().default(true),
    tlsVersion: z.string().default('1.2'),
    cipherSuites: z.array(z.string()).default([
      'TLS_AES_256_GCM_SHA384',
      'TLS_CHACHA20_POLY1305_SHA256',
      'TLS_AES_128_GCM_SHA256',
    ]),
    hsts: z.object({
      enabled: z.boolean().default(true),
      maxAge: z.number().int().min(300).default(31536000), // 1 year
      includeSubDomains: z.boolean().default(true),
      preload: z.boolean().default(false),
    }),
  }),
  keyManagement: z.object({
    provider: z.enum(['local', 'aws-kms', 'azure-keyvault', 'hashicorp-vault']).default('local'),
    keySize: z.number().int().min(128).default(256),
    keyRotationEnabled: z.boolean().default(true),
    backupEnabled: z.boolean().default(true),
    config: z.record(z.any()).optional(),
  }),
});

/**
 * Access control configuration schema
 */
const AccessControlSchema = z.object({
  model: z.nativeEnum(AccessControlModel).default(AccessControlModel.RBAC),
  defaultRole: z.string().default('student'),
  adminRoles: z.array(z.string()).default(['admin', 'super_admin']),
  
  permissions: z.object({
    hierarchical: z.boolean().default(true),
    inheritance: z.boolean().default(true),
    delegation: z.boolean().default(false),
    temporaryGrants: z.boolean().default(true),
    auditTrail: z.boolean().default(true),
  }),
  
  resources: z.record(z.object({
    actions: z.array(z.string()),
    conditions: z.record(z.any()).optional(),
    attributes: z.record(z.any()).optional(),
  })).default({
    modules: {
      actions: ['read', 'write', 'delete', 'publish'],
      conditions: { 'user.role': ['educator', 'admin'] },
    },
    users: {
      actions: ['read', 'write', 'delete', 'impersonate'],
      conditions: { 'user.role': ['admin'] },
    },
    quizzes: {
      actions: ['read', 'write', 'delete', 'grade'],
      conditions: { 'user.role': ['educator', 'admin'] },
    },
  }),
  
  policies: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    effect: z.enum(['allow', 'deny']),
    subjects: z.array(z.string()),
    resources: z.array(z.string()),
    actions: z.array(z.string()),
    conditions: z.record(z.any()).optional(),
    priority: z.number().int().default(0),
    enabled: z.boolean().default(true),
  })).default([]),
});

/**
 * Security monitoring configuration schema
 */
const SecurityMonitoringSchema = z.object({
  auditLogging: z.object({
    enabled: z.boolean().default(true),
    level: z.enum(['minimal', 'standard', 'detailed']).default('standard'),
    retention: z.number().int().min(30).default(365), // days
    realTimeAlerts: z.boolean().default(true),
    logSources: z.array(z.string()).default([
      'authentication',
      'authorization',
      'data_access',
      'configuration_changes',
      'security_events'
    ]),
  }),
  
  threatDetection: z.object({
    enabled: z.boolean().default(true),
    realTime: z.boolean().default(true),
    machineLearning: z.boolean().default(false),
    rules: z.array(z.object({
      id: z.string(),
      name: z.string(),
      description: z.string().optional(),
      pattern: z.string(),
      severity: z.nativeEnum(ThreatLevel),
      action: z.enum(['log', 'alert', 'block', 'quarantine']),
      enabled: z.boolean().default(true),
    })).default([]),
  }),
  
  incidentResponse: z.object({
    enabled: z.boolean().default(true),
    automatedResponse: z.boolean().default(true),
    escalationRules: z.array(z.object({
      condition: z.string(),
      action: z.string(),
      delay: z.number().int().min(0), // seconds
    })).default([]),
    notificationChannels: z.array(z.string()).default(['email']),
  }),
  
  compliance: z.object({
    enabled: z.boolean().default(true),
    standards: z.array(z.string()).default(['GDPR', 'CCPA', 'FERPA']),
    reporting: z.boolean().default(true),
    automation: z.boolean().default(false),
  }),
});

/**
 * Main security configuration schema
 */
const SecurityConfigSchema = z.object({
  // General security settings
  enabled: z.boolean().default(true),
  strictMode: z.boolean().default(false),
  environment: z.enum(['development', 'staging', 'production']).default('production'),
  
  // Authentication & authorization
  authentication: z.object({
    methods: z.array(z.nativeEnum(AuthMethod)).default([AuthMethod.PASSWORD]),
    multiFactorRequired: z.boolean().default(false),
    socialLoginProviders: z.array(z.string()).default([]),
    ssoConfig: z.record(z.any()).optional(),
    passwordPolicy: PasswordPolicySchema,
    lockoutPolicy: z.object({
      enabled: z.boolean().default(true),
      maxAttempts: z.number().int().min(3).default(5),
      lockoutDuration: z.number().int().min(300).default(900), // seconds
      progressiveDelay: z.boolean().default(true),
    }),
  }),
  
  // Session management
  session: SessionSecuritySchema,
  
  // Rate limiting
  rateLimiting: RateLimitingSchema,
  
  // Input validation and sanitization
  inputValidation: InputValidationSchema,
  
  // Encryption
  encryption: EncryptionConfigSchema,
  
  // Access control
  accessControl: AccessControlSchema,
  
  // Security monitoring
  monitoring: SecurityMonitoringSchema,
  
  // Security headers
  headers: z.object({
    helmet: z.object({
      enabled: z.boolean().default(true),
      contentSecurityPolicy: z.boolean().default(true),
      crossOriginEmbedderPolicy: z.boolean().default(true),
      crossOriginOpenerPolicy: z.boolean().default(true),
      crossOriginResourcePolicy: z.boolean().default(true),
      dnsPrefetchControl: z.boolean().default(true),
      frameguard: z.object({
        enabled: z.boolean().default(true),
        action: z.enum(['deny', 'sameorigin']).default('deny'),
      }),
      hidePoweredBy: z.boolean().default(true),
      hsts: z.object({
        enabled: z.boolean().default(true),
        maxAge: z.number().int().default(31536000),
        includeSubDomains: z.boolean().default(true),
        preload: z.boolean().default(false),
      }),
      ieNoOpen: z.boolean().default(true),
      noSniff: z.boolean().default(true),
      originAgentCluster: z.boolean().default(true),
      permittedCrossDomainPolicies: z.boolean().default(false),
      referrerPolicy: z.object({
        enabled: z.boolean().default(true),
        policy: z.string().default('strict-origin-when-cross-origin'),
      }),
      xssFilter: z.boolean().default(true),
    }),
    
    customHeaders: z.record(z.string()).default({
      'X-API-Version': '1.0.0',
      'X-RateLimit-Policy': 'standard',
    }),
  }),
  
  // API security
  apiSecurity: z.object({
    versioning: z.object({
      enabled: z.boolean().default(true),
      strategy: z.enum(['header', 'url', 'query']).default('url'),
      deprecationPolicy: z.object({
        warningPeriod: z.number().int().default(90), // days
        sunsetPeriod: z.number().int().default(180), // days
      }),
    }),
    
    authentication: z.object({
      apiKeyEnabled: z.boolean().default(true),
      jwtEnabled: z.boolean().default(true),
      oauthEnabled: z.boolean().default(false),
      basicAuthEnabled: z.boolean().default(false),
    }),
    
    validation: z.object({
      requestValidation: z.boolean().default(true),
      responseValidation: z.boolean().default(false),
      schemaValidation: z.boolean().default(true),
    }),
  }),
  
  // Data protection
  dataProtection: z.object({
    dataMinimization: z.boolean().default(true),
    dataRetention: z.object({
      enabled: z.boolean().default(true),
      policies: z.record(z.number()).default({
        logs: 365,
        sessions: 30,
        analytics: 730,
        backups: 2555, // 7 years
      }),
    }),
    
    anonymization: z.object({
      enabled: z.boolean().default(true),
      fields: z.array(z.string()).default([
        'email', 'ip_address', 'user_agent'
      ]),
      algorithm: z.enum(['hash', 'encrypt', 'tokenize']).default('hash'),
    }),
    
    rightToErasure: z.object({
      enabled: z.boolean().default(true),
      retentionPeriod: z.number().int().default(30), // days after request
      cascadeDelete: z.boolean().default(true),
    }),
  }),
});

/**
 * Security configuration type
 */
export type SecurityConfig = z.infer<typeof SecurityConfigSchema>;

/**
 * Security utilities class
 */
export class SecurityUtils {
  /**
   * Generate secure random string
   */
  static generateSecureRandom(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash password with salt
   */
  static async hashPassword(password: string, saltRounds: number = 12): Promise<string> {
    const bcrypt = require('bcrypt');
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify password against hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    const bcrypt = require('bcrypt');
    return bcrypt.compare(password, hash);
  }

  /**
   * Validate password against policy
   */
  static validatePassword(password: string, policy: z.infer<typeof PasswordPolicySchema>): {
    isValid: boolean;
    errors: string[];
    score: number;
  } {
    const errors: string[] = [];
    let score = 0;

    // Length validation
    if (password.length < policy.minLength) {
      errors.push(`Password must be at least ${policy.minLength} characters long`);
    } else if (password.length >= policy.minLength) {
      score += 1;
    }

    if (password.length > policy.maxLength) {
      errors.push(`Password must be no more than ${policy.maxLength} characters long`);
    }

    // Character requirement validation
    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    } else if (policy.requireUppercase) {
      score += 1;
    }

    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    } else if (policy.requireLowercase) {
      score += 1;
    }

    if (policy.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    } else if (policy.requireNumbers) {
      score += 1;
    }

    if (policy.requireSpecialChars) {
      const specialCharsRegex = new RegExp(`[${policy.specialCharsPattern.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`);
      if (!specialCharsRegex.test(password)) {
        errors.push('Password must contain at least one special character');
      } else {
        score += 1;
      }
    }

    return {
      isValid: errors.length === 0 && score >= policy.complexityScore,
      errors,
      score,
    };
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  static encrypt(data: string, key: string): {
    encrypted: string;
    iv: string;
    tag: string;
  } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key.slice(0, 32), iv);
    cipher.setAAD(Buffer.from('additional data'));
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
    };
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  static decrypt(encryptedData: string, key: string, iv: string, tag: string): string {
    const decipher = crypto.createDecipheriv('aes-256-gcm', key.slice(0, 32), Buffer.from(iv, 'hex'));
    decipher.setAAD(Buffer.from('additional data'));
    decipher.setAuthTag(Buffer.from(tag, 'hex'));

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Generate API key
   */
  static generateApiKey(): string {
    const prefix = 'jaqedu_';
    const keyPart = crypto.randomBytes(24).toString('base64url');
    return `${prefix}${keyPart}`;
  }

  /**
   * Validate API key format
   */
  static validateApiKey(apiKey: string): boolean {
    const pattern = /^jaqedu_[A-Za-z0-9_-]{32}$/;
    return pattern.test(apiKey);
  }

  /**
   * Generate CSRF token
   */
  static generateCSRFToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Sanitize HTML input
   */
  static sanitizeHTML(input: string): string {
    // This would use a library like DOMPurify in a real implementation
    return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }

  /**
   * Check for SQL injection patterns
   */
  static detectSQLInjection(input: string): boolean {
    const sqlInjectionPatterns = [
      /(\bunion\b|\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b|\bcreate\b|\balter\b)/i,
      /(\bor\b|\band\b)\s+\w+\s*=\s*\w+/i,
      /'.*'|".*"/,
      /;\s*--/,
      /\/\*.*\*\//,
    ];

    return sqlInjectionPatterns.some(pattern => pattern.test(input));
  }
}

/**
 * Default security configuration
 */
export const defaultSecurityConfig: Partial<SecurityConfig> = {
  enabled: true,
  strictMode: process.env.NODE_ENV === 'production',
  environment: (process.env.NODE_ENV as any) || 'production',
  
  authentication: {
    methods: [AuthMethod.PASSWORD, AuthMethod.TWO_FACTOR],
    multiFactorRequired: false,
    socialLoginProviders: [],
    passwordPolicy: {
      minLength: 12,
      maxLength: 64,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      specialCharsPattern: "!@#$%^&*()_+-=[]{}|;:,.<>?",
      preventReuse: 5,
      maxAge: 90,
      lockoutThreshold: 5,
      lockoutDuration: 900,
      complexityScore: 3,
      dictionaryCheck: true,
      personalDataCheck: true,
      passwordHistorySize: 5,
    },
    lockoutPolicy: {
      enabled: true,
      maxAttempts: 5,
      lockoutDuration: 900,
      progressiveDelay: true,
    },
  },
};

/**
 * Validate security configuration
 */
export function validateSecurityConfig(config: any): SecurityConfig {
  return SecurityConfigSchema.parse(config);
}

/**
 * Create security configuration from environment
 */
export function createSecurityConfig(): SecurityConfig {
  const envConfig = {
    enabled: process.env.SECURITY_ENABLED !== 'false',
    strictMode: process.env.SECURITY_STRICT_MODE === 'true',
    environment: process.env.NODE_ENV || 'production',
  };

  return SecurityConfigSchema.parse({
    ...defaultSecurityConfig,
    ...envConfig,
  });
}

export default createSecurityConfig;