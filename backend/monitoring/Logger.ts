import { EventEmitter } from 'events';
import { writeFile, appendFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { MonitoringConfig } from './types';

export interface LogEntry {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  service: string;
  module?: string;
  traceId?: string;
  spanId?: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  stack?: string;
}

interface LoggerConfig extends MonitoringConfig['logging'] {
  serviceName: string;
  maxFileSize?: number;
  maxFiles?: number;
  bufferSize?: number;
  flushInterval?: number;
}

export class Logger extends EventEmitter {
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private currentLogFile: string | null = null;
  private fileRotationIndex: number = 0;

  constructor(config: LoggerConfig) {
    super();
    this.config = {
      maxFileSize: 10 * 1024 * 1024, // 10MB default
      maxFiles: 5,
      bufferSize: 100,
      flushInterval: 1000, // 1 second
      ...config,
    };

    this.initializeFileLogging();
    this.startFlushTimer();
  }

  // Initialize file logging
  private async initializeFileLogging(): Promise<void> {
    if (this.config.output === 'file' || this.config.output === 'both') {
      if (this.config.filePath) {
        const logDir = dirname(this.config.filePath);
        
        try {
          if (!existsSync(logDir)) {
            await mkdir(logDir, { recursive: true });
          }
          
          this.currentLogFile = this.config.filePath;
          this.emit('file_logging_initialized', { filePath: this.currentLogFile });
        } catch (error) {
          this.emit('file_logging_error', { error, path: logDir });
        }
      }
    }
  }

  // Start flush timer
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  // Core logging method
  private log(level: LogEntry['level'], message: string, metadata?: Record<string, any>): void {
    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      service: this.config.serviceName,
      metadata,
    };

    // Add trace context if available
    this.addTraceContext(logEntry);

    // Add to buffer
    this.logBuffer.push(logEntry);

    // Emit log event
    this.emit('log', logEntry);

    // Output to console if configured
    if (this.config.output === 'console' || this.config.output === 'both') {
      this.outputToConsole(logEntry);
    }

    // Flush if buffer is full
    if (this.logBuffer.length >= (this.config.bufferSize || 100)) {
      this.flush();
    }
  }

  // Add trace context to log entry
  private addTraceContext(logEntry: LogEntry): void {
    // This would typically integrate with your tracing service
    // For now, we'll check if trace context is available globally
    if ((global as any).__TRACE_CONTEXT__) {
      const ctx = (global as any).__TRACE_CONTEXT__;
      logEntry.traceId = ctx.traceId;
      logEntry.spanId = ctx.spanId;
    }
  }

  // Output to console with formatting
  private outputToConsole(logEntry: LogEntry): void {
    const timestamp = logEntry.timestamp.toISOString();
    const level = logEntry.level.toUpperCase().padEnd(5);
    const service = logEntry.service;
    const message = logEntry.message;
    
    let output: string;

    if (this.config.format === 'json') {
      output = JSON.stringify(logEntry);
    } else {
      output = `${timestamp} [${level}] ${service}: ${message}`;
      
      if (logEntry.traceId) {
        output += ` [trace:${logEntry.traceId.substring(0, 8)}]`;
      }
      
      if (logEntry.metadata && Object.keys(logEntry.metadata).length > 0) {
        output += ` ${JSON.stringify(logEntry.metadata)}`;
      }
    }

    // Use appropriate console method based on level
    switch (logEntry.level) {
      case 'error':
        console.error(output);
        if (logEntry.stack) {
          console.error(logEntry.stack);
        }
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'info':
        console.info(output);
        break;
      case 'debug':
        console.debug(output);
        break;
      default:
        console.log(output);
    }
  }

  // Flush buffer to file
  private async flush(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const entriesToFlush = [...this.logBuffer];
    this.logBuffer.length = 0;

    // Write to file if configured
    if ((this.config.output === 'file' || this.config.output === 'both') && this.currentLogFile) {
      try {
        await this.writeToFile(entriesToFlush);
        this.emit('logs_flushed', { count: entriesToFlush.length });
      } catch (error) {
        this.emit('flush_error', { error, entries: entriesToFlush.length });
        
        // Add entries back to buffer for retry
        this.logBuffer.unshift(...entriesToFlush);
      }
    }
  }

  // Write entries to file
  private async writeToFile(entries: LogEntry[]): Promise<void> {
    if (!this.currentLogFile) return;

    const content = entries.map(entry => {
      if (this.config.format === 'json') {
        return JSON.stringify(entry);
      } else {
        const timestamp = entry.timestamp.toISOString();
        const level = entry.level.toUpperCase().padEnd(5);
        let line = `${timestamp} [${level}] ${entry.service}: ${entry.message}`;
        
        if (entry.traceId) {
          line += ` [trace:${entry.traceId}]`;
        }
        
        if (entry.metadata) {
          line += ` ${JSON.stringify(entry.metadata)}`;
        }
        
        return line;
      }
    }).join('\n') + '\n';

    // Check file size for rotation
    await this.checkFileRotation();

    // Append to file
    await appendFile(this.currentLogFile, content, 'utf8');
  }

  // Check if file rotation is needed
  private async checkFileRotation(): Promise<void> {
    if (!this.currentLogFile || !this.config.maxFileSize) return;

    try {
      const fs = require('fs');
      const stats = await fs.promises.stat(this.currentLogFile);
      
      if (stats.size >= this.config.maxFileSize) {
        await this.rotateLogFile();
      }
    } catch (error) {
      // File doesn't exist yet, which is fine
    }
  }

  // Rotate log file
  private async rotateLogFile(): Promise<void> {
    if (!this.currentLogFile || !this.config.filePath) return;

    const fs = require('fs');
    const path = require('path');
    const basePath = this.config.filePath;
    const ext = path.extname(basePath);
    const nameWithoutExt = basePath.substring(0, basePath.length - ext.length);

    // Rotate existing files
    for (let i = (this.config.maxFiles || 5) - 1; i > 0; i--) {
      const oldFile = `${nameWithoutExt}.${i}${ext}`;
      const newFile = `${nameWithoutExt}.${i + 1}${ext}`;
      
      try {
        if (existsSync(oldFile)) {
          await fs.promises.rename(oldFile, newFile);
        }
      } catch (error) {
        this.emit('rotation_error', { error, from: oldFile, to: newFile });
      }
    }

    // Move current log to .1
    try {
      const rotatedFile = `${nameWithoutExt}.1${ext}`;
      if (existsSync(basePath)) {
        await fs.promises.rename(basePath, rotatedFile);
      }
      
      this.emit('file_rotated', { 
        rotatedTo: rotatedFile, 
        newFile: basePath 
      });
    } catch (error) {
      this.emit('rotation_error', { error, file: basePath });
    }
  }

  // Public logging methods
  debug(message: string, metadata?: Record<string, any>): void {
    if (this.config.level === 'debug') {
      this.log('debug', message, metadata);
    }
  }

  info(message: string, metadata?: Record<string, any>): void {
    if (['debug', 'info'].includes(this.config.level)) {
      this.log('info', message, metadata);
    }
  }

  warn(message: string, metadata?: Record<string, any>): void {
    if (['debug', 'info', 'warn'].includes(this.config.level)) {
      this.log('warn', message, metadata);
    }
  }

  error(message: string, error?: Error | any, metadata?: Record<string, any>): void {
    const logMetadata = { ...metadata };
    let stack: string | undefined;

    if (error) {
      if (error instanceof Error) {
        logMetadata.error_name = error.name;
        logMetadata.error_message = error.message;
        stack = error.stack;
      } else {
        logMetadata.error = String(error);
      }
    }

    const logEntry: LogEntry = {
      timestamp: new Date(),
      level: 'error',
      message,
      service: this.config.serviceName,
      metadata: logMetadata,
      stack,
    };

    this.addTraceContext(logEntry);
    this.logBuffer.push(logEntry);
    this.emit('log', logEntry);

    // Always output errors to console regardless of config
    this.outputToConsole(logEntry);

    // Force flush for errors
    this.flush();
  }

  // Structured logging for HTTP requests
  logHttpRequest(req: any, res: any, duration: number, metadata?: Record<string, any>): void {
    const level = res.statusCode >= 400 ? 'warn' : 'info';
    const message = `${req.method} ${req.originalUrl || req.url} ${res.statusCode}`;
    
    this.log(level, message, {
      http: {
        method: req.method,
        url: req.originalUrl || req.url,
        status_code: res.statusCode,
        duration,
        user_agent: req.get('User-Agent') || '',
        remote_addr: req.ip || req.connection.remoteAddress,
        content_length: res.get('Content-Length') || 0,
      },
      ...metadata,
    });
  }

  // Structured logging for workflow events
  logWorkflowEvent(workflowId: string, event: string, status: string, metadata?: Record<string, any>): void {
    const level = status === 'error' ? 'error' : 'info';
    const message = `Workflow ${workflowId}: ${event}`;
    
    this.log(level, message, {
      workflow: {
        id: workflowId,
        event,
        status,
      },
      ...metadata,
    });
  }

  // Structured logging for database operations
  logDatabaseOperation(operation: string, table: string, duration: number, rowsAffected?: number, error?: Error): void {
    const level = error ? 'error' : 'debug';
    const message = error 
      ? `Database ${operation} on ${table} failed: ${error.message}`
      : `Database ${operation} on ${table} completed`;
    
    this.log(level, message, {
      database: {
        operation,
        table,
        duration,
        rows_affected: rowsAffected || 0,
        success: !error,
      },
      ...(error && { error: { name: error.name, message: error.message } }),
    });
  }

  // Structured logging for cache operations
  logCacheOperation(operation: string, key: string, hit: boolean, duration: number): void {
    const message = `Cache ${operation} for key ${key}: ${hit ? 'hit' : 'miss'}`;
    
    this.log('debug', message, {
      cache: {
        operation,
        key,
        hit,
        duration,
      },
    });
  }

  // Create child logger with additional context
  child(context: Record<string, any>): Logger {
    const childConfig = {
      ...this.config,
      serviceName: context.service || this.config.serviceName,
    };

    const childLogger = new Logger(childConfig);
    
    // Override log method to include parent context
    const originalLog = (childLogger as any).log.bind(childLogger);
    (childLogger as any).log = function(level: string, message: string, metadata: Record<string, any> = {}) {
      return originalLog(level, message, { ...context, ...metadata });
    };

    return childLogger;
  }

  // Get log statistics
  getLogStats(): {
    buffered: number;
    totalLogged: number;
    lastFlush: Date | null;
    fileSize?: number;
  } {
    return {
      buffered: this.logBuffer.length,
      totalLogged: 0, // This would be tracked in a real implementation
      lastFlush: null, // This would be tracked in a real implementation
    };
  }

  // Health check for logger
  getHealthStatus(): { status: 'healthy' | 'unhealthy'; message: string } {
    try {
      const stats = this.getLogStats();
      const status = stats.buffered < (this.config.bufferSize || 100) ? 'healthy' : 'unhealthy';
      
      return {
        status,
        message: `Logger operational. Buffered: ${stats.buffered}`,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Logger error: ${error}`,
      };
    }
  }

  // Middleware for Express.js
  getMiddleware() {
    return (req: any, res: any, next: any) => {
      const startTime = Date.now();
      
      // Capture response
      const originalSend = res.send;
      res.send = function(body: any) {
        const duration = Date.now() - startTime;
        
        // Log the request
        this.parent.logHttpRequest(req, res, duration, {
          request_id: req.id || req.headers['x-request-id'],
          user_id: req.user?.id,
          session_id: req.session?.id,
        });
        
        return originalSend.call(res, body);
      }.bind({ parent: this });

      next();
    };
  }

  // Force flush and cleanup
  async destroy(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Final flush
    await this.flush();
    
    this.removeAllListeners();
    this.emit('destroyed');
  }
}