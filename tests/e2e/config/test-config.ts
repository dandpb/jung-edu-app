/**
 * E2E Test Configuration
 * Central configuration for all E2E testing settings
 */

export interface E2ETestConfig {
  // Application settings
  app: {
    baseURL: string;
    timeout: number;
    retries: number;
    slowMo: number;
  };

  // Browser settings
  browser: {
    headless: boolean;
    devtools: boolean;
    viewport: {
      width: number;
      height: number;
    };
    userAgent?: string;
    locale: string;
    timezone: string;
  };

  // Database settings
  database: {
    useTestDatabase: boolean;
    connectionString?: string;
    timeout: number;
    retries: number;
  };

  // Authentication settings
  auth: {
    sessionTimeout: number;
    tokenExpiration: number;
    maxLoginAttempts: number;
  };

  // Test data settings
  testData: {
    cleanup: boolean;
    preserve: boolean;
    seedOnStart: boolean;
    userCount: number;
    moduleCount: number;
  };

  // Screenshot settings
  screenshots: {
    enabled: boolean;
    onFailure: boolean;
    fullPage: boolean;
    quality: number;
    format: 'png' | 'jpeg';
    path: string;
  };

  // Video recording settings
  video: {
    enabled: boolean;
    onFailure: boolean;
    quality: 'low' | 'medium' | 'high';
    path: string;
  };

  // Trace settings
  tracing: {
    enabled: boolean;
    screenshots: boolean;
    snapshots: boolean;
    sources: boolean;
    path: string;
  };

  // API settings
  api: {
    timeout: number;
    retries: number;
    rateLimiting: boolean;
    mockEnabled: boolean;
  };

  // Performance settings
  performance: {
    monitoring: boolean;
    thresholds: {
      loadTime: number;
      firstPaint: number;
      firstContentfulPaint: number;
    };
  };

  // Accessibility settings
  accessibility: {
    enabled: boolean;
    level: 'A' | 'AA' | 'AAA';
    includeWarnings: boolean;
  };

  // Internationalization settings
  i18n: {
    testMultipleLanguages: boolean;
    defaultLanguage: string;
    supportedLanguages: string[];
  };

  // Environment settings
  environment: {
    type: 'development' | 'staging' | 'production' | 'test';
    debug: boolean;
    verbose: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
  };
}

/**
 * Default E2E Test Configuration
 */
const defaultConfig: E2ETestConfig = {
  app: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    timeout: 60000,
    retries: 2,
    slowMo: parseInt(process.env.E2E_SLOW_MO || '0')
  },

  browser: {
    headless: process.env.E2E_HEADLESS !== 'false',
    devtools: process.env.E2E_DEVTOOLS === 'true',
    viewport: {
      width: parseInt(process.env.E2E_VIEWPORT_WIDTH || '1920'),
      height: parseInt(process.env.E2E_VIEWPORT_HEIGHT || '1080')
    },
    locale: process.env.E2E_LOCALE || 'en-US',
    timezone: process.env.E2E_TIMEZONE || 'UTC'
  },

  database: {
    useTestDatabase: process.env.E2E_USE_TEST_DB === 'true',
    connectionString: process.env.E2E_DATABASE_URL,
    timeout: 30000,
    retries: 3
  },

  auth: {
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    tokenExpiration: 60 * 60 * 1000, // 1 hour
    maxLoginAttempts: 3
  },

  testData: {
    cleanup: process.env.E2E_CLEANUP !== 'false',
    preserve: process.env.E2E_PRESERVE_DATA === 'true',
    seedOnStart: process.env.E2E_SEED_DATA !== 'false',
    userCount: parseInt(process.env.E2E_USER_COUNT || '20'),
    moduleCount: parseInt(process.env.E2E_MODULE_COUNT || '15')
  },

  screenshots: {
    enabled: process.env.E2E_SCREENSHOTS !== 'false',
    onFailure: process.env.E2E_SCREENSHOT_ON_FAILURE !== 'false',
    fullPage: true,
    quality: 90,
    format: 'png',
    path: 'tests/e2e/test-results/screenshots'
  },

  video: {
    enabled: process.env.E2E_VIDEO === 'true',
    onFailure: process.env.E2E_VIDEO_ON_FAILURE === 'true',
    quality: 'medium',
    path: 'tests/e2e/test-results/videos'
  },

  tracing: {
    enabled: process.env.E2E_TRACE === 'true',
    screenshots: true,
    snapshots: true,
    sources: true,
    path: 'tests/e2e/test-results/traces'
  },

  api: {
    timeout: 30000,
    retries: 3,
    rateLimiting: false,
    mockEnabled: process.env.E2E_MOCK_API === 'true'
  },

  performance: {
    monitoring: process.env.E2E_PERFORMANCE === 'true',
    thresholds: {
      loadTime: 5000,
      firstPaint: 2000,
      firstContentfulPaint: 3000
    }
  },

  accessibility: {
    enabled: process.env.E2E_ACCESSIBILITY === 'true',
    level: 'AA',
    includeWarnings: false
  },

  i18n: {
    testMultipleLanguages: process.env.E2E_I18N === 'true',
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'es', 'pt-br']
  },

  environment: {
    type: (process.env.NODE_ENV as any) || 'test',
    debug: process.env.E2E_DEBUG === 'true',
    verbose: process.env.E2E_VERBOSE === 'true',
    logLevel: (process.env.E2E_LOG_LEVEL as any) || 'info'
  }
};

/**
 * Test Configuration Manager
 */
export class TestConfigManager {
  private static instance: TestConfigManager;
  private config: E2ETestConfig;

  private constructor() {
    this.config = { ...defaultConfig };
    this.loadEnvironmentOverrides();
    this.validateConfig();
  }

  static getInstance(): TestConfigManager {
    if (!TestConfigManager.instance) {
      TestConfigManager.instance = new TestConfigManager();
    }
    return TestConfigManager.instance;
  }

  private loadEnvironmentOverrides(): void {
    // Load configuration from environment variables
    // This method can be extended to load from config files, CLI args, etc.
    
    // Example of deep environment variable override
    if (process.env.E2E_APP_TIMEOUT) {
      this.config.app.timeout = parseInt(process.env.E2E_APP_TIMEOUT);
    }

    if (process.env.E2E_BROWSER_HEADLESS) {
      this.config.browser.headless = process.env.E2E_BROWSER_HEADLESS === 'true';
    }

    // Add more environment variable overrides as needed
  }

  private validateConfig(): void {
    // Validate configuration values
    if (this.config.app.timeout < 1000) {
      console.warn('⚠️ App timeout is very low, increasing to 1000ms');
      this.config.app.timeout = 1000;
    }

    if (this.config.app.retries < 0) {
      console.warn('⚠️ Retries cannot be negative, setting to 0');
      this.config.app.retries = 0;
    }

    if (this.config.browser.viewport.width < 100 || this.config.browser.viewport.height < 100) {
      console.warn('⚠️ Viewport size is too small, using default');
      this.config.browser.viewport = { width: 1920, height: 1080 };
    }

    // Validate baseURL
    try {
      new URL(this.config.app.baseURL);
    } catch (error) {
      console.warn('⚠️ Invalid baseURL, falling back to default');
      this.config.app.baseURL = 'http://localhost:3000';
    }
  }

  // Getters for different config sections
  getAppConfig() {
    return this.config.app;
  }

  getBrowserConfig() {
    return this.config.browser;
  }

  getDatabaseConfig() {
    return this.config.database;
  }

  getAuthConfig() {
    return this.config.auth;
  }

  getTestDataConfig() {
    return this.config.testData;
  }

  getScreenshotConfig() {
    return this.config.screenshots;
  }

  getVideoConfig() {
    return this.config.video;
  }

  getTracingConfig() {
    return this.config.tracing;
  }

  getApiConfig() {
    return this.config.api;
  }

  getPerformanceConfig() {
    return this.config.performance;
  }

  getAccessibilityConfig() {
    return this.config.accessibility;
  }

  getI18nConfig() {
    return this.config.i18n;
  }

  getEnvironmentConfig() {
    return this.config.environment;
  }

  // Get full config
  getFullConfig(): E2ETestConfig {
    return { ...this.config };
  }

  // Update config at runtime
  updateConfig(updates: Partial<E2ETestConfig>): void {
    this.config = { ...this.config, ...updates };
    this.validateConfig();
  }

  // Environment-specific configs
  isProduction(): boolean {
    return this.config.environment.type === 'production';
  }

  isDevelopment(): boolean {
    return this.config.environment.type === 'development';
  }

  isTest(): boolean {
    return this.config.environment.type === 'test';
  }

  isDebugMode(): boolean {
    return this.config.environment.debug;
  }

  isVerboseMode(): boolean {
    return this.config.environment.verbose;
  }

  // Feature flags
  shouldTakeScreenshots(): boolean {
    return this.config.screenshots.enabled;
  }

  shouldRecordVideo(): boolean {
    return this.config.video.enabled;
  }

  shouldTrace(): boolean {
    return this.config.tracing.enabled;
  }

  shouldMonitorPerformance(): boolean {
    return this.config.performance.monitoring;
  }

  shouldTestAccessibility(): boolean {
    return this.config.accessibility.enabled;
  }

  shouldTestI18n(): boolean {
    return this.config.i18n.testMultipleLanguages;
  }

  shouldCleanupTestData(): boolean {
    return this.config.testData.cleanup;
  }

  shouldPreserveTestData(): boolean {
    return this.config.testData.preserve;
  }

  shouldSeedTestData(): boolean {
    return this.config.testData.seedOnStart;
  }

  // Utility methods
  getTimeout(type: 'app' | 'database' | 'api' = 'app'): number {
    switch (type) {
      case 'app':
        return this.config.app.timeout;
      case 'database':
        return this.config.database.timeout;
      case 'api':
        return this.config.api.timeout;
      default:
        return this.config.app.timeout;
    }
  }

  getRetries(type: 'app' | 'database' | 'api' = 'app'): number {
    switch (type) {
      case 'app':
        return this.config.app.retries;
      case 'database':
        return this.config.database.retries;
      case 'api':
        return this.config.api.retries;
      default:
        return this.config.app.retries;
    }
  }

  // Configuration export/import
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  importConfig(configJson: string): void {
    try {
      const importedConfig = JSON.parse(configJson);
      this.updateConfig(importedConfig);
    } catch (error) {
      throw new Error(`Invalid configuration JSON: ${error}`);
    }
  }

  // Reset to defaults
  resetToDefaults(): void {
    this.config = { ...defaultConfig };
    this.loadEnvironmentOverrides();
    this.validateConfig();
  }

  // Configuration presets
  static getPresetConfig(preset: 'ci' | 'local' | 'debug' | 'performance'): Partial<E2ETestConfig> {
    switch (preset) {
      case 'ci':
        return {
          browser: { headless: true, devtools: false },
          screenshots: { enabled: true, onFailure: true },
          video: { enabled: false, onFailure: true },
          tracing: { enabled: false },
          testData: { cleanup: true, preserve: false },
          environment: { debug: false, verbose: false }
        };

      case 'local':
        return {
          browser: { headless: false, devtools: true },
          screenshots: { enabled: true, onFailure: true },
          video: { enabled: false, onFailure: false },
          tracing: { enabled: true },
          testData: { cleanup: false, preserve: true },
          environment: { debug: true, verbose: true }
        };

      case 'debug':
        return {
          app: { slowMo: 100, timeout: 120000 },
          browser: { headless: false, devtools: true },
          screenshots: { enabled: true, onFailure: true },
          video: { enabled: true, onFailure: true },
          tracing: { enabled: true },
          environment: { debug: true, verbose: true }
        };

      case 'performance':
        return {
          browser: { headless: true },
          performance: { monitoring: true },
          screenshots: { enabled: false },
          video: { enabled: false },
          tracing: { enabled: false },
          testData: { cleanup: true }
        };

      default:
        return {};
    }
  }

  applyPreset(preset: 'ci' | 'local' | 'debug' | 'performance'): void {
    const presetConfig = TestConfigManager.getPresetConfig(preset);
    this.updateConfig(presetConfig);
  }
}