import Joi from 'joi';
import { WorkflowStatus, ExecutionStatus, StepType, Priority, BackoffStrategy, ConditionType, NotificationType, NotificationEvent } from './types';

// Workflow validation schemas
export const createWorkflowSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(255)
    .required()
    .description('Workflow name'),
  
  description: Joi.string()
    .max(1000)
    .optional()
    .description('Workflow description'),
  
  steps: Joi.array()
    .items(
      Joi.object({
        name: Joi.string()
          .min(1)
          .max(255)
          .required(),
        
        type: Joi.string()
          .valid(...Object.values(StepType))
          .required(),
        
        config: Joi.object()
          .required()
          .description('Step configuration object'),
        
        dependencies: Joi.array()
          .items(Joi.string())
          .optional(),
        
        timeout: Joi.number()
          .positive()
          .max(86400000) // 24 hours in ms
          .optional(),
        
        retryPolicy: Joi.object({
          maxAttempts: Joi.number()
            .integer()
            .min(0)
            .max(10)
            .required(),
          
          backoffStrategy: Joi.string()
            .valid(...Object.values(BackoffStrategy))
            .required(),
          
          backoffMultiplier: Joi.number()
            .positive()
            .max(10)
            .optional(),
          
          maxBackoffTime: Joi.number()
            .positive()
            .max(3600000) // 1 hour in ms
            .optional()
        }).optional(),
        
        conditions: Joi.array()
          .items(
            Joi.object({
              type: Joi.string()
                .valid(...Object.values(ConditionType))
                .required(),
              
              expression: Joi.string()
                .min(1)
                .required(),
              
              description: Joi.string()
                .max(500)
                .optional()
            })
          )
          .optional()
      })
    )
    .min(1)
    .required(),
  
  variables: Joi.object()
    .pattern(Joi.string(), Joi.any())
    .optional(),
  
  metadata: Joi.object({
    tags: Joi.array()
      .items(Joi.string().max(50))
      .max(20)
      .optional(),
    
    owner: Joi.string()
      .max(255)
      .optional(),
    
    priority: Joi.string()
      .valid(...Object.values(Priority))
      .optional(),
    
    timeout: Joi.number()
      .positive()
      .max(86400000)
      .optional(),
    
    schedule: Joi.object({
      cron: Joi.string()
        .pattern(/^[0-9*\/,-\s]+$/)
        .optional(),
      
      interval: Joi.number()
        .positive()
        .max(86400000)
        .optional(),
      
      startDate: Joi.date()
        .optional(),
      
      endDate: Joi.date()
        .greater(Joi.ref('startDate'))
        .optional(),
      
      timezone: Joi.string()
        .max(50)
        .optional()
    }).optional(),
    
    notifications: Joi.array()
      .items(
        Joi.object({
          type: Joi.string()
            .valid(...Object.values(NotificationType))
            .required(),
          
          recipients: Joi.array()
            .items(Joi.string().email())
            .min(1)
            .required(),
          
          events: Joi.array()
            .items(Joi.string().valid(...Object.values(NotificationEvent)))
            .min(1)
            .required(),
          
          template: Joi.string()
            .max(1000)
            .optional()
        })
      )
      .optional()
  }).optional()
});

export const updateWorkflowSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(255)
    .optional(),
  
  description: Joi.string()
    .max(1000)
    .allow('')
    .optional(),
  
  steps: Joi.array()
    .items(
      Joi.object({
        name: Joi.string()
          .min(1)
          .max(255)
          .required(),
        
        type: Joi.string()
          .valid(...Object.values(StepType))
          .required(),
        
        config: Joi.object()
          .required(),
        
        dependencies: Joi.array()
          .items(Joi.string())
          .optional(),
        
        timeout: Joi.number()
          .positive()
          .max(86400000)
          .optional(),
        
        retryPolicy: Joi.object({
          maxAttempts: Joi.number()
            .integer()
            .min(0)
            .max(10)
            .required(),
          
          backoffStrategy: Joi.string()
            .valid(...Object.values(BackoffStrategy))
            .required(),
          
          backoffMultiplier: Joi.number()
            .positive()
            .max(10)
            .optional(),
          
          maxBackoffTime: Joi.number()
            .positive()
            .max(3600000)
            .optional()
        }).optional(),
        
        conditions: Joi.array()
          .items(
            Joi.object({
              type: Joi.string()
                .valid(...Object.values(ConditionType))
                .required(),
              
              expression: Joi.string()
                .min(1)
                .required(),
              
              description: Joi.string()
                .max(500)
                .optional()
            })
          )
          .optional()
      })
    )
    .min(1)
    .optional(),
  
  variables: Joi.object()
    .pattern(Joi.string(), Joi.any())
    .optional(),
  
  metadata: Joi.object({
    tags: Joi.array()
      .items(Joi.string().max(50))
      .max(20)
      .optional(),
    
    owner: Joi.string()
      .max(255)
      .optional(),
    
    priority: Joi.string()
      .valid(...Object.values(Priority))
      .optional(),
    
    timeout: Joi.number()
      .positive()
      .max(86400000)
      .optional(),
    
    schedule: Joi.object({
      cron: Joi.string()
        .pattern(/^[0-9*\/,-\s]+$/)
        .optional(),
      
      interval: Joi.number()
        .positive()
        .max(86400000)
        .optional(),
      
      startDate: Joi.date()
        .optional(),
      
      endDate: Joi.date()
        .greater(Joi.ref('startDate'))
        .optional(),
      
      timezone: Joi.string()
        .max(50)
        .optional()
    }).optional(),
    
    notifications: Joi.array()
      .items(
        Joi.object({
          type: Joi.string()
            .valid(...Object.values(NotificationType))
            .required(),
          
          recipients: Joi.array()
            .items(Joi.string().email())
            .min(1)
            .required(),
          
          events: Joi.array()
            .items(Joi.string().valid(...Object.values(NotificationEvent)))
            .min(1)
            .required(),
          
          template: Joi.string()
            .max(1000)
            .optional()
        })
      )
      .optional()
  }).optional(),
  
  version: Joi.string()
    .pattern(/^\d+\.\d+\.\d+$/)
    .optional()
}).min(1);

export const executeWorkflowSchema = Joi.object({
  variables: Joi.object()
    .pattern(Joi.string(), Joi.any())
    .optional(),
  
  priority: Joi.string()
    .valid(...Object.values(Priority))
    .optional(),
  
  timeout: Joi.number()
    .positive()
    .max(86400000)
    .optional(),
  
  notifications: Joi.array()
    .items(
      Joi.object({
        type: Joi.string()
          .valid(...Object.values(NotificationType))
          .required(),
        
        recipients: Joi.array()
          .items(Joi.string().email())
          .min(1)
          .required(),
        
        events: Joi.array()
          .items(Joi.string().valid(...Object.values(NotificationEvent)))
          .min(1)
          .required(),
        
        template: Joi.string()
          .max(1000)
          .optional()
      })
    )
    .optional()
});

// Query parameter validation schemas
export const workflowQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .max(1000)
    .default(1),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20),
  
  status: Joi.array()
    .items(Joi.string().valid(...Object.values(WorkflowStatus)))
    .single()
    .optional(),
  
  owner: Joi.string()
    .max(255)
    .optional(),
  
  tags: Joi.array()
    .items(Joi.string().max(50))
    .single()
    .optional(),
  
  search: Joi.string()
    .max(255)
    .optional(),
  
  sortBy: Joi.string()
    .valid('name', 'createdAt', 'updatedAt', 'status')
    .default('createdAt'),
  
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc'),
  
  createdAfter: Joi.date()
    .optional(),
  
  createdBefore: Joi.date()
    .optional()
});

export const executionQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .max(1000)
    .default(1),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20),
  
  status: Joi.array()
    .items(Joi.string().valid(...Object.values(ExecutionStatus)))
    .single()
    .optional(),
  
  workflowId: Joi.string()
    .guid({ version: 'uuidv4' })
    .optional(),
  
  startedAfter: Joi.date()
    .optional(),
  
  startedBefore: Joi.date()
    .optional(),
  
  sortBy: Joi.string()
    .valid('startedAt', 'completedAt', 'status')
    .default('startedAt'),
  
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
});

// Path parameter validation schemas
export const workflowIdSchema = Joi.object({
  id: Joi.string()
    .guid({ version: 'uuidv4' })
    .required()
    .description('Workflow ID')
});

export const executionIdSchema = Joi.object({
  executionId: Joi.string()
    .guid({ version: 'uuidv4' })
    .required()
    .description('Execution ID')
});

export const workflowExecutionParamsSchema = Joi.object({
  id: Joi.string()
    .guid({ version: 'uuidv4' })
    .required()
    .description('Workflow ID'),
  
  executionId: Joi.string()
    .guid({ version: 'uuidv4' })
    .required()
    .description('Execution ID')
});

// Custom validation functions
export const validateArrayParam = (value: string | string[]): string[] => {
  if (typeof value === 'string') {
    return value.split(',').map(v => v.trim()).filter(v => v);
  }
  return Array.isArray(value) ? value : [];
};

export const validateDateParam = (value: string): Date | undefined => {
  if (!value) return undefined;
  const date = new Date(value);
  return isNaN(date.getTime()) ? undefined : date;
};

export const validateSortOrder = (value: string): 'asc' | 'desc' => {
  return value === 'asc' ? 'asc' : 'desc';
};

// Schema validation middleware helper
export const validateSchema = (schema: Joi.Schema, target: 'body' | 'query' | 'params' = 'body') => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req[target], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message,
            value: detail.context?.value
          }))
        },
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }

    req[target] = value;
    next();
  };
};