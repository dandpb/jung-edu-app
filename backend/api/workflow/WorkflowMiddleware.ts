import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { AuthContext, ApiError, RateLimitInfo } from './types';

// Rate limiting configuration
export const createRateLimit = (windowMs: number, max: number, message?: string) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: message || 'Too many requests from this IP, please try again later',
        details: {
          limit: max,
          windowMs,
          retryAfter: Math.ceil(windowMs / 1000)
        }
      },
      timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      const resetTime = new Date(Date.now() + windowMs);
      res.set({
        'X-RateLimit-Limit': max.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': Math.ceil(resetTime.getTime() / 1000).toString(),
        'Retry-After': Math.ceil(windowMs / 1000).toString()
      });
      
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: message || 'Too many requests from this IP, please try again later',
          details: {
            limit: max,
            windowMs,
            retryAfter: Math.ceil(windowMs / 1000)
          }
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || uuidv4()
      });
    }
  });
};

// Rate limiting configurations for different endpoints
// Higher limits for testing
const isTest = process.env.NODE_ENV === 'test';

export const globalRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  isTest ? 10000 : 1000, // limit each IP to requests per windowMs
  'Too many requests from this IP, please try again later'
);

export const workflowRateLimit = createRateLimit(
  60 * 1000, // 1 minute
  isTest ? 1000 : 100, // limit each IP to workflow requests per minute
  'Too many workflow requests, please try again later'
);

export const executionRateLimit = createRateLimit(
  60 * 1000, // 1 minute
  isTest ? 500 : 50, // limit each IP to execution requests per minute
  'Too many execution requests, please try again later'
);

export const heavyOperationRateLimit = createRateLimit(
  60 * 1000, // 1 minute
  isTest ? 100 : 10, // limit each IP to heavy operations per minute
  'Too many heavy operations, please try again later'
);

// Request ID middleware
export const requestId = (req: Request, res: Response, next: NextFunction): void => {
  const reqId = req.headers['x-request-id'] as string || uuidv4();
  req.headers['x-request-id'] = reqId;
  res.setHeader('X-Request-ID', reqId);
  next();
};

// CORS middleware
export const cors = (req: Request, res: Response, next: NextFunction): void => {
  const origin = req.headers.origin;
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
  
  if (!origin || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID, X-API-Key');
  res.setHeader('Access-Control-Expose-Headers', 'X-Request-ID, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
};

// Authentication middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const apiKey = req.headers['x-api-key'] as string;
    
    let authContext: AuthContext | null = null;
    
    // JWT Token authentication
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'workflow-secret') as any;
        authContext = {
          userId: decoded.sub,
          username: decoded.username,
          roles: decoded.roles || [],
          permissions: decoded.permissions || [],
          organizationId: decoded.organizationId
        };
      } catch (jwtError) {
        return sendAuthError(res, req, 'INVALID_TOKEN', 'Invalid or expired authentication token');
      }
    }
    
    // API Key authentication
    else if (apiKey) {
      // In a real implementation, validate API key against database
      if (apiKey === (process.env.WORKFLOW_API_KEY || 'test-api-key')) {
        authContext = {
          userId: 'api-user',
          username: 'API User',
          roles: ['api', 'admin'],
          permissions: ['workflow:read', 'workflow:create', 'workflow:update', 'workflow:delete', 'workflow:execute', 'workflow:control'],
          organizationId: 'default'
        };
      } else {
        return sendAuthError(res, req, 'INVALID_API_KEY', 'Invalid API key provided');
      }
    }
    
    // No authentication provided
    else {
      return sendAuthError(res, req, 'MISSING_AUTH', 'Authentication required - provide Bearer token or API key');
    }
    
    if (!authContext) {
      return sendAuthError(res, req, 'AUTH_FAILED', 'Authentication failed');
    }
    
    // Add auth context to request
    (req as any).auth = authContext;
    next();
    
  } catch (error) {
    console.error('Authentication error:', error);
    sendAuthError(res, req, 'AUTH_ERROR', 'Internal authentication error');
  }
};

// Authorization middleware factory
export const authorize = (requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const auth = (req as any).auth as AuthContext;
    
    if (!auth) {
      return sendAuthError(res, req, 'NO_AUTH_CONTEXT', 'No authentication context found');
    }
    
    // Check if user has required permissions
    const hasPermissions = requiredPermissions.every(permission => 
      auth.permissions.includes(permission) || auth.roles.includes('admin')
    );
    
    if (!hasPermissions) {
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Insufficient permissions to access this resource',
          details: {
            required: requiredPermissions,
            current: auth.permissions
          }
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id']
      });
      return;
    }
    
    next();
  };
};

// Resource ownership middleware
export const checkOwnership = (resourceParam: string = 'id') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const auth = (req as any).auth as AuthContext;
    const resourceId = req.params[resourceParam];
    
    // Admin users can access all resources
    if (auth.roles.includes('admin')) {
      next();
      return;
    }
    
    try {
      // In a real implementation, check resource ownership in database
      // For now, we'll simulate this check
      const isOwner = await checkResourceOwnership(resourceId, auth.userId);
      
      if (!isOwner) {
        res.status(403).json({
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: 'You do not have access to this resource',
            details: {
              resourceId,
              userId: auth.userId
            }
          },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id']
        });
        return;
      }
      
      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'OWNERSHIP_CHECK_ERROR',
          message: 'Error checking resource ownership'
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id']
      });
    }
  };
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const requestId = req.headers['x-request-id'];
  
  // Log request
  console.log(`[${new Date().toISOString()}] ${requestId} ${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    auth: (req as any).auth?.userId || 'anonymous'
  });
  
  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${requestId} ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  
  next();
};

// Error handling middleware
export const errorHandler = (error: any, req: Request, res: Response, next: NextFunction): void => {
  const requestId = req.headers['x-request-id'];
  
  console.error(`[${new Date().toISOString()}] ${requestId} Error:`, error);
  
  // Default error response
  let statusCode = 500;
  let errorResponse: ApiError = {
    code: 'INTERNAL_ERROR',
    message: 'An internal server error occurred'
  };
  
  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    errorResponse = {
      code: 'VALIDATION_ERROR',
      message: error.message,
      details: error.details
    };
  } else if (error.name === 'CastError') {
    statusCode = 400;
    errorResponse = {
      code: 'INVALID_ID',
      message: 'Invalid resource ID format'
    };
  } else if (error.code === 'ECONNREFUSED') {
    statusCode = 503;
    errorResponse = {
      code: 'SERVICE_UNAVAILABLE',
      message: 'Service temporarily unavailable'
    };
  } else if (error.status) {
    statusCode = error.status;
    errorResponse = {
      code: error.code || 'HTTP_ERROR',
      message: error.message
    };
  }
  
  res.status(statusCode).json({
    success: false,
    error: errorResponse,
    timestamp: new Date().toISOString(),
    requestId
  });
};

// Health check middleware
export const healthCheck = (req: Request, res: Response): void => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0'
    },
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id']
  });
};

// Helper functions
const sendAuthError = (res: Response, req: Request, code: string, message: string): void => {
  res.status(401).json({
    success: false,
    error: {
      code,
      message
    },
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id']
  });
};

const checkResourceOwnership = async (resourceId: string, userId: string): Promise<boolean> => {
  // In a real implementation, this would check the database
  // For now, we'll return true for demonstration
  return true;
};

// Rate limit info helper
export const addRateLimitInfo = (req: Request, res: Response, next: NextFunction): void => {
  const limit = parseInt(res.getHeader('X-RateLimit-Limit') as string || '0');
  const remaining = parseInt(res.getHeader('X-RateLimit-Remaining') as string || '0');
  const reset = new Date(parseInt(res.getHeader('X-RateLimit-Reset') as string || '0') * 1000);
  const retryAfter = parseInt(res.getHeader('Retry-After') as string || '0');
  
  const rateLimitInfo: RateLimitInfo = {
    limit,
    remaining,
    reset,
    retryAfter: retryAfter > 0 ? retryAfter : undefined
  };
  
  (req as any).rateLimit = rateLimitInfo;
  next();
};