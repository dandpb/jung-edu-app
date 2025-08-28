import { MonitoringConfig } from './types';

// Default monitoring configuration
export const defaultMonitoringConfig: MonitoringConfig = {
  prometheus: {
    enabled: true,
    port: 3001,
    path: '/metrics',
    collectDefaultMetrics: true,
    prefix: 'jaquedu_',
  },
  tracing: {
    enabled: true,
    serviceName: 'jaquedu-app',
    endpoint: process.env.JAEGER_ENDPOINT || '',
    samplingRate: parseFloat(process.env.TRACE_SAMPLING_RATE || '0.1'),
  },
  logging: {
    level: (process.env.LOG_LEVEL as any) || 'info',
    format: (process.env.LOG_FORMAT as any) || 'json',
    output: (process.env.LOG_OUTPUT as any) || 'console',
    filePath: process.env.LOG_FILE_PATH,
  },
  health: {
    enabled: true,
    endpoint: '/health',
    interval: 30000, // 30 seconds
    timeout: 5000, // 5 seconds
  },
  alerts: {
    enabled: true,
    webhook: process.env.ALERT_WEBHOOK_URL,
    email: process.env.ALERT_EMAIL_CONFIG ? JSON.parse(process.env.ALERT_EMAIL_CONFIG) : undefined,
    slack: process.env.ALERT_SLACK_CONFIG ? JSON.parse(process.env.ALERT_SLACK_CONFIG) : undefined,
  },
};

// Environment-specific configurations
export const developmentConfig: Partial<MonitoringConfig> = {
  logging: {
    level: 'debug',
    format: 'text',
    output: 'console',
  },
  tracing: {
    enabled: true,
    serviceName: 'jaquedu-dev',
    endpoint: 'http://localhost:14268/api/traces',
    samplingRate: 1.0, // Sample everything in development
  },
  prometheus: {
    enabled: true,
    port: 3001,
    path: '/metrics',
    collectDefaultMetrics: true,
    prefix: 'jaquedu_dev_',
  },
  alerts: {
    enabled: false, // Disable alerts in development
  },
};

export const testConfig: Partial<MonitoringConfig> = {
  logging: {
    level: 'error',
    format: 'json',
    output: 'console',
  },
  tracing: {
    enabled: false, // Disable tracing in tests
    serviceName: 'jaquedu-test',
    endpoint: '',
    samplingRate: 0,
  },
  prometheus: {
    enabled: false, // Disable metrics in tests
    port: 0,
    path: '/metrics',
    collectDefaultMetrics: false,
    prefix: 'test_',
  },
  health: {
    enabled: false, // Disable health checks in tests
    endpoint: '/health',
    interval: 60000,
    timeout: 1000,
  },
  alerts: {
    enabled: false, // Disable alerts in tests
  },
};

export const productionConfig: Partial<MonitoringConfig> = {
  logging: {
    level: 'info',
    format: 'json',
    output: 'both',
    filePath: '/var/log/jaquedu/app.log',
  },
  tracing: {
    enabled: true,
    serviceName: 'jaquedu-prod',
    endpoint: process.env.JAEGER_ENDPOINT || 'http://jaeger-collector:14268/api/traces',
    samplingRate: 0.01, // 1% sampling in production
  },
  prometheus: {
    enabled: true,
    port: 3001,
    path: '/metrics',
    collectDefaultMetrics: true,
    prefix: 'jaquedu_',
  },
  health: {
    enabled: true,
    endpoint: '/health',
    interval: 30000,
    timeout: 5000,
  },
  alerts: {
    enabled: true,
    webhook: process.env.ALERT_WEBHOOK_URL,
    email: {
      smtp: process.env.SMTP_SERVER || 'smtp.gmail.com',
      from: process.env.ALERT_EMAIL_FROM || 'alerts@jaquedu.com',
      to: (process.env.ALERT_EMAIL_TO || 'admin@jaquedu.com').split(','),
    },
    slack: {
      webhook: process.env.SLACK_WEBHOOK_URL || '',
      channel: process.env.SLACK_ALERT_CHANNEL || '#alerts',
    },
  },
};

// Configuration factory
export function createMonitoringConfig(environment?: string): MonitoringConfig {
  const env = environment || process.env.NODE_ENV || 'development';
  
  let envConfig: Partial<MonitoringConfig> = {};
  
  switch (env) {
    case 'development':
      envConfig = developmentConfig;
      break;
    case 'test':
      envConfig = testConfig;
      break;
    case 'production':
      envConfig = productionConfig;
      break;
    default:
      envConfig = developmentConfig;
  }
  
  return mergeConfig(defaultMonitoringConfig, envConfig);
}

// Configuration validation
export function validateMonitoringConfig(config: MonitoringConfig): { 
  valid: boolean; 
  errors: string[] 
} {
  const errors: string[] = [];
  
  // Validate Prometheus config
  if (config.prometheus.enabled) {
    if (!config.prometheus.port || config.prometheus.port < 1 || config.prometheus.port > 65535) {
      errors.push('Prometheus port must be between 1 and 65535');
    }
    if (!config.prometheus.path || !config.prometheus.path.startsWith('/')) {
      errors.push('Prometheus path must start with "/"');
    }
    if (!config.prometheus.prefix) {
      errors.push('Prometheus prefix is required');
    }
  }
  
  // Validate tracing config
  if (config.tracing.enabled) {
    if (!config.tracing.serviceName) {
      errors.push('Tracing service name is required');
    }
    if (config.tracing.samplingRate < 0 || config.tracing.samplingRate > 1) {
      errors.push('Tracing sampling rate must be between 0 and 1');
    }
  }
  
  // Validate logging config
  if (!['debug', 'info', 'warn', 'error'].includes(config.logging.level)) {
    errors.push('Logging level must be debug, info, warn, or error');
  }
  if (!['json', 'text'].includes(config.logging.format)) {
    errors.push('Logging format must be json or text');
  }
  if (!['console', 'file', 'both'].includes(config.logging.output)) {
    errors.push('Logging output must be console, file, or both');
  }
  if ((config.logging.output === 'file' || config.logging.output === 'both') && !config.logging.filePath) {
    errors.push('Logging file path is required when output is file or both');
  }
  
  // Validate health check config
  if (config.health.enabled) {
    if (!config.health.endpoint || !config.health.endpoint.startsWith('/')) {
      errors.push('Health check endpoint must start with "/"');
    }
    if (config.health.interval < 1000) {
      errors.push('Health check interval must be at least 1000ms');
    }
    if (config.health.timeout < 100) {
      errors.push('Health check timeout must be at least 100ms');
    }
  }
  
  // Validate alerts config
  if (config.alerts.enabled) {
    if (!config.alerts.webhook && !config.alerts.email && !config.alerts.slack) {
      errors.push('At least one alert channel (webhook, email, or slack) must be configured when alerts are enabled');
    }
    
    if (config.alerts.email) {
      if (!config.alerts.email.smtp) {
        errors.push('Email SMTP server is required');
      }
      if (!config.alerts.email.from) {
        errors.push('Email from address is required');
      }
      if (!config.alerts.email.to || config.alerts.email.to.length === 0) {
        errors.push('At least one email recipient is required');
      }
    }
    
    if (config.alerts.slack) {
      if (!config.alerts.slack.webhook) {
        errors.push('Slack webhook URL is required');
      }
      if (!config.alerts.slack.channel) {
        errors.push('Slack channel is required');
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// Configuration merging helper
function mergeConfig(base: MonitoringConfig, override: Partial<MonitoringConfig>): MonitoringConfig {
  const result: MonitoringConfig = JSON.parse(JSON.stringify(base));
  
  if (override.prometheus) {
    result.prometheus = { ...result.prometheus, ...override.prometheus };
  }
  
  if (override.tracing) {
    result.tracing = { ...result.tracing, ...override.tracing };
  }
  
  if (override.logging) {
    result.logging = { ...result.logging, ...override.logging };
  }
  
  if (override.health) {
    result.health = { ...result.health, ...override.health };
  }
  
  if (override.alerts) {
    result.alerts = { ...result.alerts, ...override.alerts };
  }
  
  return result;
}

// Environment variable helpers
export function loadConfigFromEnv(): Partial<MonitoringConfig> {
  const config: Partial<MonitoringConfig> = {};
  
  // Prometheus configuration
  if (process.env.PROMETHEUS_ENABLED !== undefined) {
    config.prometheus = {
      enabled: process.env.PROMETHEUS_ENABLED === 'true',
      port: parseInt(process.env.PROMETHEUS_PORT || '3001', 10),
      path: process.env.PROMETHEUS_PATH || '/metrics',
      collectDefaultMetrics: process.env.PROMETHEUS_DEFAULT_METRICS !== 'false',
      prefix: process.env.PROMETHEUS_PREFIX || 'jaquedu_',
    };
  }
  
  // Tracing configuration
  if (process.env.TRACING_ENABLED !== undefined) {
    config.tracing = {
      enabled: process.env.TRACING_ENABLED === 'true',
      serviceName: process.env.SERVICE_NAME || 'jaquedu-app',
      endpoint: process.env.JAEGER_ENDPOINT || '',
      samplingRate: parseFloat(process.env.TRACE_SAMPLING_RATE || '0.1'),
    };
  }
  
  // Logging configuration
  if (process.env.LOG_LEVEL) {
    config.logging = {
      level: process.env.LOG_LEVEL as any,
      format: (process.env.LOG_FORMAT as any) || 'json',
      output: (process.env.LOG_OUTPUT as any) || 'console',
      filePath: process.env.LOG_FILE_PATH,
    };
  }
  
  // Health check configuration
  if (process.env.HEALTH_CHECKS_ENABLED !== undefined) {
    config.health = {
      enabled: process.env.HEALTH_CHECKS_ENABLED === 'true',
      endpoint: process.env.HEALTH_ENDPOINT || '/health',
      interval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000', 10),
      timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT || '5000', 10),
    };
  }
  
  // Alerts configuration
  if (process.env.ALERTS_ENABLED !== undefined) {
    config.alerts = {
      enabled: process.env.ALERTS_ENABLED === 'true',
      webhook: process.env.ALERT_WEBHOOK_URL,
      email: process.env.ALERT_EMAIL_CONFIG ? JSON.parse(process.env.ALERT_EMAIL_CONFIG) : undefined,
      slack: process.env.ALERT_SLACK_CONFIG ? JSON.parse(process.env.ALERT_SLACK_CONFIG) : undefined,
    };
  }
  
  return config;
}

// Configuration display helper
export function displayConfig(config: MonitoringConfig, maskSecrets: boolean = true): string {
  const displayConfig = JSON.parse(JSON.stringify(config));
  
  if (maskSecrets) {
    // Mask sensitive configuration values
    if (displayConfig.alerts?.webhook) {
      displayConfig.alerts.webhook = maskUrl(displayConfig.alerts.webhook);
    }
    
    if (displayConfig.alerts?.email?.smtp) {
      displayConfig.alerts.email.smtp = maskValue(displayConfig.alerts.email.smtp);
    }
    
    if (displayConfig.alerts?.slack?.webhook) {
      displayConfig.alerts.slack.webhook = maskUrl(displayConfig.alerts.slack.webhook);
    }
    
    if (displayConfig.tracing?.endpoint) {
      displayConfig.tracing.endpoint = maskUrl(displayConfig.tracing.endpoint);
    }
  }
  
  return JSON.stringify(displayConfig, null, 2);
}

// Utility functions
function maskUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${maskValue(parsed.host)}${parsed.pathname}`;
  } catch {
    return maskValue(url);
  }
}

function maskValue(value: string): string {
  if (value.length <= 8) {
    return '*'.repeat(value.length);
  }
  return value.substring(0, 4) + '*'.repeat(value.length - 8) + value.substring(value.length - 4);
}