export interface LLMConfig {
  provider: 'openai' | 'mock';
  apiKey?: string;
  model?: string;
  rateLimit?: RateLimitConfig;
  retry?: RetryConfig;
  defaults?: DefaultConfig;
}

export interface RateLimitConfig {
  maxRequestsPerMinute: number;
  maxTokensPerMinute: number;
  maxConcurrentRequests: number;
}

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export interface DefaultConfig {
  temperature: number;
  maxTokens: number;
  systemPrompts: {
    content: string;
    quiz: string;
    bibliography: string;
  };
}

export const defaultConfig: LLMConfig = {
  provider: 'openai',
  model: process.env.REACT_APP_OPENAI_MODEL || 'gpt-4o-mini',
  rateLimit: {
    maxRequestsPerMinute: 60,
    maxTokensPerMinute: 90000,
    maxConcurrentRequests: 5,
  },
  retry: {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
  },
  defaults: {
    temperature: 0.7,
    maxTokens: 2000,
    systemPrompts: {
      content: 'You are an expert educator in Jungian psychology. Generate clear, engaging, and academically accurate content suitable for university-level students.',
      quiz: 'You are a quiz generator specializing in Jungian psychology. Create thought-provoking questions that test understanding of concepts, not just memorization.',
      bibliography: 'You are a academic reference specialist in Jungian psychology. Provide accurate, relevant citations in APA format.',
    },
  },
};

/**
 * Rate limiter implementation
 */
export class RateLimiter {
  private requestTimes: number[] = [];
  private tokenCounts: number[] = [];
  private activeRequests = 0;
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async checkLimit(estimatedTokens: number): Promise<void> {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Clean old entries
    this.requestTimes = this.requestTimes.filter(time => time > oneMinuteAgo);
    this.tokenCounts = this.tokenCounts.filter((_, index) => this.requestTimes[index] > oneMinuteAgo);

    // Check concurrent requests
    if (this.activeRequests >= this.config.maxConcurrentRequests) {
      throw new Error('Maximum concurrent requests exceeded');
    }

    // Check requests per minute
    if (this.requestTimes.length >= this.config.maxRequestsPerMinute) {
      const waitTime = this.requestTimes[0] + 60000 - now;
      if (waitTime > 0) {
        await this.delay(waitTime);
      }
    }

    // Check tokens per minute
    const currentTokens = this.tokenCounts.reduce((sum, count) => sum + count, 0);
    if (currentTokens + estimatedTokens > this.config.maxTokensPerMinute) {
      throw new Error('Token limit per minute would be exceeded');
    }
  }

  recordRequest(tokens: number): void {
    this.requestTimes.push(Date.now());
    this.tokenCounts.push(tokens);
  }

  incrementActive(): void {
    this.activeRequests++;
  }

  decrementActive(): void {
    this.activeRequests--;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Configuration manager
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private config: LLMConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      try {
        ConfigManager.instance = new ConfigManager();
      } catch (error) {
        console.error('Failed to create ConfigManager instance:', error);
        // Create a minimal fallback instance
        const fallbackManager = Object.create(ConfigManager.prototype);
        fallbackManager.config = {
          provider: 'mock' as const,
          model: 'gpt-4o-mini',
          rateLimit: {
            maxRequestsPerMinute: 60,
            maxTokensPerMinute: 90000,
            maxConcurrentRequests: 5,
          },
          retry: {
            maxRetries: 3,
            initialDelay: 1000,
            maxDelay: 10000,
            backoffMultiplier: 2,
          },
          defaults: {
            temperature: 0.7,
            maxTokens: 2000,
            systemPrompts: {
              content: 'You are an expert educator in Jungian psychology.',
              quiz: 'You are a quiz generator specializing in Jungian psychology.',
              bibliography: 'You are a academic reference specialist in Jungian psychology.',
            },
          },
        };
        ConfigManager.instance = fallbackManager;
      }
    }
    return ConfigManager.instance;
  }

  getConfig(): LLMConfig {
    if (!this.config) {
      console.warn('Config is null/undefined, returning fallback configuration');
      return {
        provider: 'mock' as const,
        model: 'gpt-4o-mini',
        rateLimit: {
          maxRequestsPerMinute: 60,
          maxTokensPerMinute: 90000,
          maxConcurrentRequests: 5,
        },
        retry: {
          maxRetries: 3,
          initialDelay: 1000,
          maxDelay: 10000,
          backoffMultiplier: 2,
        },
        defaults: {
          temperature: 0.7,
          maxTokens: 2000,
          systemPrompts: {
            content: 'You are an expert educator in Jungian psychology.',
            quiz: 'You are a quiz generator specializing in Jungian psychology.',
            bibliography: 'You are a academic reference specialist in Jungian psychology.',
          },
        },
      };
    }
    return this.config;
  }

  updateConfig(updates: Partial<LLMConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }

  private loadConfig(): LLMConfig {
    // Load from React environment variables
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    const model = process.env.REACT_APP_OPENAI_MODEL || 'gpt-4o-mini';
    
    // Use OpenAI provider if API key is available, otherwise use mock
    const provider: 'openai' | 'mock' = apiKey ? 'openai' : 'mock';
    
    console.log('LLM Config loaded:', { 
      provider, 
      model, 
      hasApiKey: !!apiKey,
      apiKeyPrefix: apiKey ? `${apiKey.substring(0, 7)}...` : 'none'
    });
    
    return {
      ...defaultConfig,
      provider,
      apiKey,
      model,
    };
  }

  private saveConfig(): void {
    // In production, persist configuration changes
    console.log('Configuration updated:', this.config);
  }
}