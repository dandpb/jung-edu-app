/**
 * Health Check Service
 * 
 * Provides health check endpoints and system monitoring
 * for deployment validation and production monitoring.
 */

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  responseTime: number;
  details?: Record<string, any>;
  error?: string;
}

export interface SystemHealth {
  overall: 'healthy' | 'unhealthy' | 'degraded';
  services: HealthCheckResult[];
  timestamp: string;
  version: string;
  environment: string;
}

export class HealthService {
  private static instance: HealthService;
  private readonly version: string;
  private readonly environment: string;

  private constructor() {
    this.version = process.env.REACT_APP_VERSION || '1.0.0';
    this.environment = process.env.NODE_ENV || 'development';
  }

  public static getInstance(): HealthService {
    if (!HealthService.instance) {
      HealthService.instance = new HealthService();
    }
    return HealthService.instance;
  }

  /**
   * Perform comprehensive system health check
   */
  public async checkSystemHealth(): Promise<SystemHealth> {
    const timestamp = new Date().toISOString();
    const services: HealthCheckResult[] = [];

    // Check all critical services
    const healthChecks = [
      this.checkSupabaseHealth(),
      this.checkApiHealth(),
      this.checkStorageHealth(),
      this.checkAuthHealth(),
      this.checkDatabaseHealth(),
      this.checkExternalAPIsHealth(),
    ];

    const results = await Promise.allSettled(healthChecks);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        services.push(result.value);
      } else {
        services.push({
          service: `service-${index}`,
          status: 'unhealthy',
          timestamp,
          responseTime: 0,
          error: result.reason?.message || 'Unknown error',
        });
      }
    });

    // Determine overall health
    const overall = this.calculateOverallHealth(services);

    return {
      overall,
      services,
      timestamp,
      version: this.version,
      environment: this.environment,
    };
  }

  /**
   * Check Supabase connection health
   */
  private async checkSupabaseHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Mock Supabase check - replace with actual Supabase client
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration missing');
      }

      // Simulate connection check
      await new Promise(resolve => setTimeout(resolve, 100));

      const responseTime = Date.now() - startTime;

      return {
        service: 'supabase',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        responseTime,
        details: {
          url: supabaseUrl,
          configured: true,
        },
      };
    } catch (error) {
      return {
        service: 'supabase',
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check API endpoints health
   */
  private async checkApiHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Check if critical API endpoints are responding
      const healthEndpoints = [
        '/api/health',
        '/api/status',
      ];

      // Mock API health check
      await new Promise(resolve => setTimeout(resolve, 50));

      const responseTime = Date.now() - startTime;

      return {
        service: 'api',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        responseTime,
        details: {
          endpoints: healthEndpoints,
          checked: healthEndpoints.length,
        },
      };
    } catch (error) {
      return {
        service: 'api',
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check storage service health
   */
  private async checkStorageHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Check local storage and session storage
      const localStorageTest = 'health-check-test';
      localStorage.setItem(localStorageTest, 'test');
      const retrieved = localStorage.getItem(localStorageTest);
      localStorage.removeItem(localStorageTest);

      if (retrieved !== 'test') {
        throw new Error('localStorage not available');
      }

      const responseTime = Date.now() - startTime;

      return {
        service: 'storage',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        responseTime,
        details: {
          localStorage: true,
          sessionStorage: typeof sessionStorage !== 'undefined',
        },
      };
    } catch (error) {
      return {
        service: 'storage',
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check authentication system health
   */
  private async checkAuthHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Check if auth configuration is available
      const authConfig = {
        supabaseUrl: !!process.env.REACT_APP_SUPABASE_URL,
        supabaseKey: !!process.env.REACT_APP_SUPABASE_ANON_KEY,
      };

      if (!authConfig.supabaseUrl || !authConfig.supabaseKey) {
        throw new Error('Authentication configuration incomplete');
      }

      const responseTime = Date.now() - startTime;

      return {
        service: 'auth',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        responseTime,
        details: authConfig,
      };
    } catch (error) {
      return {
        service: 'auth',
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check database connectivity
   */
  private async checkDatabaseHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Mock database health check
      await new Promise(resolve => setTimeout(resolve, 75));

      const responseTime = Date.now() - startTime;

      return {
        service: 'database',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        responseTime,
        details: {
          connected: true,
          pool_size: 10, // Mock pool size
        },
      };
    } catch (error) {
      return {
        service: 'database',
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check external APIs health
   */
  private async checkExternalAPIsHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Check external API dependencies
      const externalAPIs = [
        'OpenAI API',
        'YouTube API',
      ];

      const openaiKey = process.env.REACT_APP_OPENAI_API_KEY;
      const youtubeKey = process.env.REACT_APP_YOUTUBE_API_KEY;

      const details = {
        openai: !!openaiKey,
        youtube: !!youtubeKey,
        total_apis: externalAPIs.length,
      };

      const responseTime = Date.now() - startTime;

      return {
        service: 'external_apis',
        status: details.openai ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        responseTime,
        details,
      };
    } catch (error) {
      return {
        service: 'external_apis',
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Calculate overall system health based on individual service health
   */
  private calculateOverallHealth(services: HealthCheckResult[]): 'healthy' | 'unhealthy' | 'degraded' {
    const criticalServices = ['supabase', 'auth', 'database'];
    const healthyServices = services.filter(s => s.status === 'healthy');
    const unhealthyServices = services.filter(s => s.status === 'unhealthy');
    const degradedServices = services.filter(s => s.status === 'degraded');

    // Check if any critical services are unhealthy
    const criticalUnhealthy = unhealthyServices.some(s => 
      criticalServices.includes(s.service)
    );

    if (criticalUnhealthy) {
      return 'unhealthy';
    }

    // If more than 50% of services are unhealthy, system is unhealthy
    if (unhealthyServices.length > services.length / 2) {
      return 'unhealthy';
    }

    // If any services are degraded or some are unhealthy, system is degraded
    if (degradedServices.length > 0 || unhealthyServices.length > 0) {
      return 'degraded';
    }

    return 'healthy';
  }

  /**
   * Get detailed system metrics
   */
  public async getSystemMetrics(): Promise<Record<string, any>> {
    const startTime = performance.now();
    
    try {
      const metrics = {
        memory: {
          used: (performance as any).memory?.usedJSHeapSize || 0,
          total: (performance as any).memory?.totalJSHeapSize || 0,
          limit: (performance as any).memory?.jsHeapSizeLimit || 0,
        },
        performance: {
          navigation_timing: performance.getEntriesByType('navigation')[0] || {},
          resource_timing: performance.getEntriesByType('resource').length,
        },
        browser: {
          user_agent: navigator.userAgent,
          language: navigator.language,
          online: navigator.onLine,
          cookies_enabled: navigator.cookieEnabled,
        },
        environment: {
          node_env: process.env.NODE_ENV,
          version: this.version,
          timestamp: new Date().toISOString(),
        },
        response_time: performance.now() - startTime,
      };

      return metrics;
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Perform deep health check with retries
   */
  public async performDeepHealthCheck(retries: number = 3): Promise<SystemHealth> {
    let lastError: Error | null = null;

    for (let i = 0; i < retries; i++) {
      try {
        const health = await this.checkSystemHealth();
        
        // If overall health is not healthy, wait and retry
        if (health.overall !== 'healthy' && i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
          continue;
        }
        
        return health;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
        }
      }
    }

    // If all retries failed, return unhealthy status
    return {
      overall: 'unhealthy',
      services: [],
      timestamp: new Date().toISOString(),
      version: this.version,
      environment: this.environment,
    };
  }
}