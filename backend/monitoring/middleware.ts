import { Request, Response, NextFunction } from 'express';
import { MonitoringService } from './MonitoringService';
import { WorkflowMonitor } from './WorkflowMonitor';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      startTime?: number;
      traceId?: string;
      spanId?: string;
      requestId?: string;
      monitoringContext?: {
        userId?: string;
        sessionId?: string;
        userType?: 'student' | 'teacher' | 'admin' | 'guest';
        workflowId?: string;
      };
    }
  }
}

export interface MonitoringMiddlewareConfig {
  enableMetrics?: boolean;
  enableTracing?: boolean;
  enableLogging?: boolean;
  enableHealthChecks?: boolean;
  skipPaths?: string[];
  sensitiveHeaders?: string[];
  maxBodySize?: number;
}

export class MonitoringMiddleware {
  private monitoringService: MonitoringService;
  private workflowMonitor?: WorkflowMonitor;
  private config: Required<MonitoringMiddlewareConfig>;

  constructor(
    monitoringService: MonitoringService,
    workflowMonitor?: WorkflowMonitor,
    config: MonitoringMiddlewareConfig = {}
  ) {
    this.monitoringService = monitoringService;
    this.workflowMonitor = workflowMonitor;
    this.config = {
      enableMetrics: true,
      enableTracing: true,
      enableLogging: true,
      enableHealthChecks: true,
      skipPaths: ['/health', '/metrics', '/favicon.ico'],
      sensitiveHeaders: ['authorization', 'cookie', 'x-api-key', 'x-auth-token'],
      maxBodySize: 1024 * 1024, // 1MB
      ...config,
    };
  }

  // Main middleware function
  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Skip monitoring for certain paths
      if (this.shouldSkipPath(req.path)) {
        return next();
      }

      // Initialize request context
      this.initializeRequestContext(req, res);

      // Apply monitoring
      if (this.config.enableMetrics) {
        this.applyMetricsMonitoring(req, res);
      }

      if (this.config.enableTracing) {
        this.applyTracingMonitoring(req, res);
      }

      if (this.config.enableLogging) {
        this.applyLoggingMonitoring(req, res);
      }

      next();
    };
  }

  // Request timing middleware
  requestTiming() {
    return (req: Request, res: Response, next: NextFunction) => {
      req.startTime = Date.now();
      next();
    };
  }

  // Request ID middleware
  requestId() {
    return (req: Request, res: Response, next: NextFunction) => {
      req.requestId = req.headers['x-request-id'] as string || 
                     req.headers['x-correlation-id'] as string ||
                     this.generateRequestId();
      
      res.setHeader('x-request-id', req.requestId);
      next();
    };
  }

  // User context middleware
  userContext() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.monitoringContext) {
        req.monitoringContext = {};
      }

      // Extract user context from request
      const user = (req as any).user;
      if (user) {
        req.monitoringContext.userId = user.id;
        req.monitoringContext.userType = user.type || 'student';
      } else {
        req.monitoringContext.userType = 'guest';
      }

      // Extract session context
      const session = (req as any).session;
      if (session) {
        req.monitoringContext.sessionId = session.id;
      }

      next();
    };
  }

  // Error handling middleware
  errorHandler() {
    return (error: Error, req: Request, res: Response, next: NextFunction) => {
      const duration = req.startTime ? Date.now() - req.startTime : 0;
      
      // Record error metrics
      this.monitoringService.recordError('http_request_error', 'high');
      
      // Log error
      if (this.config.enableLogging) {
        const context = {
          request_id: req.requestId,
          method: req.method,
          url: req.originalUrl || req.url,
          user_id: req.monitoringContext?.userId,
          session_id: req.monitoringContext?.sessionId,
          duration,
          stack: error.stack,
        };

        this.monitoringService.logWorkflow(
          req.requestId || 'unknown',
          'request_error',
          'error',
          context
        );
      }

      // Record HTTP metrics with error status
      if (this.config.enableMetrics) {
        const statusCode = res.statusCode || 500;
        this.monitoringService.recordWorkflowMetric('http_request', 'failure', duration);
      }

      next(error);
    };
  }

  // Workflow monitoring middleware
  workflowMonitoring() {
    if (!this.workflowMonitor) {
      return (req: Request, res: Response, next: NextFunction) => next();
    }

    return (req: Request, res: Response, next: NextFunction) => {
      // Check if this is a workflow-related request
      const workflowId = req.headers['x-workflow-id'] as string ||
                        req.query.workflowId as string ||
                        req.body?.workflowId;

      if (workflowId) {
        if (!req.monitoringContext) {
          req.monitoringContext = {};
        }
        req.monitoringContext.workflowId = workflowId;

        // Track workflow HTTP request
        this.trackWorkflowRequest(req, res, workflowId);
      }

      next();
    };
  }

  // Rate limiting monitoring
  rateLimitMonitoring() {
    const rateLimitCounts = new Map<string, { count: number; resetTime: number }>();

    return (req: Request, res: Response, next: NextFunction) => {
      const key = this.getRateLimitKey(req);
      const now = Date.now();
      const windowMs = 60000; // 1 minute window
      const maxRequests = 100; // Max requests per window

      const current = rateLimitCounts.get(key);
      
      if (!current || now > current.resetTime) {
        rateLimitCounts.set(key, { count: 1, resetTime: now + windowMs });
      } else {
        current.count++;
        
        if (current.count > maxRequests) {
          // Rate limit exceeded
          this.monitoringService.recordError('rate_limit_exceeded', 'medium');
          
          res.status(429).json({
            error: 'Rate limit exceeded',
            retryAfter: Math.ceil((current.resetTime - now) / 1000),
          });
          return;
        }
      }

      // Add rate limit headers
      const remaining = Math.max(0, maxRequests - (current?.count || 1));
      const resetTime = current?.resetTime || now + windowMs;
      
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000));

      next();
    };
  }

  // Security monitoring middleware
  securityMonitoring() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Check for suspicious patterns
      const suspiciousPatterns = [
        /[<>].*script.*[<>]/i, // XSS attempts
        /union.*select/i, // SQL injection
        /\.\.\//g, // Path traversal
        /%00/g, // Null byte injection
      ];

      const checkUrl = req.originalUrl || req.url;
      const checkBody = JSON.stringify(req.body || {});

      let suspicious = false;
      let detectedPattern = '';

      for (const pattern of suspiciousPatterns) {
        if (pattern.test(checkUrl) || pattern.test(checkBody)) {
          suspicious = true;
          detectedPattern = pattern.toString();
          break;
        }
      }

      if (suspicious) {
        this.monitoringService.recordError('security_threat_detected', 'critical');
        
        // Log security incident
        if (this.config.enableLogging) {
          this.monitoringService.logWorkflow(
            req.requestId || 'security',
            'security_threat',
            'alert',
            {
              ip: req.ip,
              user_agent: req.get('User-Agent'),
              url: req.originalUrl || req.url,
              pattern: detectedPattern,
              body_sample: checkBody.substring(0, 200),
            }
          );
        }

        // Block request
        res.status(403).json({ error: 'Request blocked for security reasons' });
        return;
      }

      next();
    };
  }

  // Performance monitoring middleware
  performanceMonitoring() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startCpuUsage = process.cpuUsage();
      const startMemory = process.memoryUsage();

      const originalEnd = res.end;
      res.end = function(chunk?: any, encoding?: any) {
        const endCpuUsage = process.cpuUsage(startCpuUsage);
        const endMemory = process.memoryUsage();

        // Calculate resource usage
        const cpuUsed = (endCpuUsage.user + endCpuUsage.system) / 1000; // microseconds to milliseconds
        const memoryUsed = endMemory.heapUsed - startMemory.heapUsed;

        // Record performance metrics
        if (cpuUsed > 100) { // More than 100ms CPU time
          this.monitoringService.recordError('high_cpu_usage', 'medium');
        }

        if (memoryUsed > 10 * 1024 * 1024) { // More than 10MB memory increase
          this.monitoringService.recordError('high_memory_usage', 'medium');
        }

        // Log performance data
        if (this.config.enableLogging && (cpuUsed > 50 || memoryUsed > 5 * 1024 * 1024)) {
          this.monitoringService.logWorkflow(
            req.requestId || 'performance',
            'performance_alert',
            'warn',
            {
              cpu_used_ms: cpuUsed,
              memory_used_bytes: memoryUsed,
              url: req.originalUrl || req.url,
              method: req.method,
            }
          );
        }

        originalEnd.call(this, chunk, encoding);
      }.bind(res);

      next();
    };
  }

  // Private helper methods
  private shouldSkipPath(path: string): boolean {
    return this.config.skipPaths.some(skipPath => 
      path.startsWith(skipPath) || path.includes(skipPath)
    );
  }

  private initializeRequestContext(req: Request, res: Response): void {
    if (!req.startTime) {
      req.startTime = Date.now();
    }

    if (!req.requestId) {
      req.requestId = this.generateRequestId();
      res.setHeader('x-request-id', req.requestId);
    }

    if (!req.monitoringContext) {
      req.monitoringContext = {};
    }
  }

  private applyMetricsMonitoring(req: Request, res: Response): void {
    const originalEnd = res.end;
    
    res.end = function(chunk?: any, encoding?: any) {
      const duration = req.startTime ? Date.now() - req.startTime : 0;
      
      // Record HTTP request metrics
      // This would typically be handled by the MonitoringService's middleware
      // but we can add additional custom metrics here
      
      // Record user action metrics
      if (req.monitoringContext?.userType) {
        this.monitoringService.recordUserAction(
          `${req.method}_${req.route?.path || req.path}`,
          req.monitoringContext.userType
        );
      }

      originalEnd.call(this, chunk, encoding);
    }.bind(res);
  }

  private applyTracingMonitoring(req: Request, res: Response): void {
    // Tracing is typically handled by the MonitoringService's tracing middleware
    // Additional custom tracing logic can be added here
  }

  private applyLoggingMonitoring(req: Request, res: Response): void {
    // Logging is typically handled by the MonitoringService's logging middleware
    // Additional custom logging logic can be added here
  }

  private trackWorkflowRequest(req: Request, res: Response, workflowId: string): void {
    if (!this.workflowMonitor) return;

    const stepId = `http_${req.method.toLowerCase()}_${Date.now()}`;
    const stepName = `HTTP ${req.method} ${req.path}`;

    // Add step to workflow
    this.workflowMonitor.addStep(workflowId, stepId, stepName);
    this.workflowMonitor.startStep(workflowId, stepId, {
      method: req.method,
      path: req.path,
      headers: this.sanitizeHeaders(req.headers),
      query: req.query,
      body: this.sanitizeBody(req.body),
    });

    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any) {
      if (res.statusCode >= 400) {
        this.workflowMonitor!.failStep(
          workflowId,
          stepId,
          new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`)
        );
      } else {
        this.workflowMonitor!.completeStep(workflowId, stepId, {
          status_code: res.statusCode,
          headers: this.sanitizeHeaders(res.getHeaders()),
        });
      }

      originalEnd.call(this, chunk, encoding);
    }.bind(res);
  }

  private getRateLimitKey(req: Request): string {
    // Use IP address and user ID (if available) for rate limiting
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userId = req.monitoringContext?.userId || 'anonymous';
    return `${ip}:${userId}`;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sanitizeHeaders(headers: any): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(headers)) {
      if (!this.config.sensitiveHeaders.includes(key.toLowerCase())) {
        sanitized[key] = value;
      } else {
        sanitized[key] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const bodyStr = JSON.stringify(body);
    if (bodyStr.length > this.config.maxBodySize) {
      return '[BODY TOO LARGE]';
    }

    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
    const sanitized = { ...body };

    const sanitizeObject = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) {
        return obj;
      }

      const result: any = Array.isArray(obj) ? [] : {};

      for (const [key, value] of Object.entries(obj)) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          result[key] = '[REDACTED]';
        } else if (typeof value === 'object') {
          result[key] = sanitizeObject(value);
        } else {
          result[key] = value;
        }
      }

      return result;
    };

    return sanitizeObject(sanitized);
  }
}