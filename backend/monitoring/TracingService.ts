import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { TraceSpan, TraceLog, MonitoringConfig } from './types';

export class TracingService extends EventEmitter {
  private config: MonitoringConfig['tracing'];
  private activeSpans: Map<string, TraceSpan> = new Map();
  private completedSpans: TraceSpan[] = [];
  private maxCompletedSpans: number = 10000;
  private serviceName: string;

  constructor(config: MonitoringConfig['tracing']) {
    super();
    this.config = config;
    this.serviceName = config.serviceName;
  }

  // Start a new trace span
  startSpan(
    operationName: string,
    parentSpanId?: string,
    tags: Record<string, any> = {}
  ): TraceSpan {
    const span: TraceSpan = {
      traceId: parentSpanId ? this.getTraceId(parentSpanId) : uuidv4(),
      spanId: uuidv4(),
      parentSpanId,
      operationName,
      startTime: Date.now(),
      tags: {
        service: this.serviceName,
        ...tags,
      },
      logs: [],
      status: 'ok',
    };

    this.activeSpans.set(span.spanId, span);
    this.emit('span_started', span);

    return span;
  }

  // Finish a trace span
  finishSpan(spanId: string, status: 'ok' | 'error' | 'timeout' = 'ok'): TraceSpan | null {
    const span = this.activeSpans.get(spanId);
    if (!span) {
      return null;
    }

    const endTime = Date.now();
    span.endTime = endTime;
    span.duration = endTime - span.startTime;
    span.status = status;

    // Move to completed spans
    this.activeSpans.delete(spanId);
    this.completedSpans.push(span);

    // Maintain max completed spans
    if (this.completedSpans.length > this.maxCompletedSpans) {
      this.completedSpans.shift();
    }

    this.emit('span_finished', span);
    
    // Send to external tracing system if configured
    if (this.config.enabled && this.config.endpoint) {
      this.exportSpan(span);
    }

    return span;
  }

  // Add log to span
  log(spanId: string, level: 'debug' | 'info' | 'warn' | 'error', message: string, fields?: Record<string, any>): void {
    const span = this.activeSpans.get(spanId);
    if (!span) {
      return;
    }

    const log: TraceLog = {
      timestamp: Date.now(),
      level,
      message,
      fields,
    };

    span.logs.push(log);
    this.emit('span_logged', { spanId, log });
  }

  // Set span tag
  setTag(spanId: string, key: string, value: any): void {
    const span = this.activeSpans.get(spanId);
    if (span) {
      span.tags[key] = value;
      this.emit('span_tag_set', { spanId, key, value });
    }
  }

  // Set multiple tags
  setTags(spanId: string, tags: Record<string, any>): void {
    const span = this.activeSpans.get(spanId);
    if (span) {
      Object.assign(span.tags, tags);
      this.emit('span_tags_set', { spanId, tags });
    }
  }

  // Get trace ID from span ID
  private getTraceId(spanId: string): string {
    const span = this.activeSpans.get(spanId) || 
                  this.completedSpans.find(s => s.spanId === spanId);
    return span ? span.traceId : uuidv4();
  }

  // Get active span
  getActiveSpan(spanId: string): TraceSpan | undefined {
    return this.activeSpans.get(spanId);
  }

  // Get completed spans for a trace
  getTraceSpans(traceId: string): TraceSpan[] {
    return this.completedSpans.filter(span => span.traceId === traceId);
  }

  // Get all spans for operation
  getOperationSpans(operationName: string): TraceSpan[] {
    return this.completedSpans.filter(span => span.operationName === operationName);
  }

  // Workflow-specific tracing
  traceWorkflowExecution<T>(
    workflowName: string,
    workflowId: string,
    execution: () => Promise<T>
  ): Promise<T> {
    const span = this.startSpan(`workflow.${workflowName}`, undefined, {
      'workflow.id': workflowId,
      'workflow.name': workflowName,
      'component': 'workflow-engine',
    });

    return execution()
      .then(result => {
        this.setTag(span.spanId, 'workflow.status', 'success');
        this.setTag(span.spanId, 'workflow.result_size', JSON.stringify(result).length);
        this.log(span.spanId, 'info', `Workflow ${workflowName} completed successfully`);
        this.finishSpan(span.spanId, 'ok');
        return result;
      })
      .catch(error => {
        this.setTag(span.spanId, 'workflow.status', 'error');
        this.setTag(span.spanId, 'error.message', error.message);
        this.setTag(span.spanId, 'error.stack', error.stack);
        this.log(span.spanId, 'error', `Workflow ${workflowName} failed: ${error.message}`, {
          error: error.toString(),
          stack: error.stack,
        });
        this.finishSpan(span.spanId, 'error');
        throw error;
      });
  }

  // Database operation tracing
  traceDatabaseOperation<T>(
    operation: string,
    table: string,
    query: string,
    execution: () => Promise<T>
  ): Promise<T> {
    const span = this.startSpan(`db.${operation}`, undefined, {
      'db.operation': operation,
      'db.table': table,
      'db.query': query,
      'component': 'database',
    });

    return execution()
      .then(result => {
        this.setTag(span.spanId, 'db.rows_affected', Array.isArray(result) ? result.length : 1);
        this.log(span.spanId, 'info', `Database ${operation} completed`);
        this.finishSpan(span.spanId, 'ok');
        return result;
      })
      .catch(error => {
        this.setTag(span.spanId, 'error.message', error.message);
        this.log(span.spanId, 'error', `Database ${operation} failed: ${error.message}`);
        this.finishSpan(span.spanId, 'error');
        throw error;
      });
  }

  // HTTP request tracing
  traceHttpRequest<T>(
    method: string,
    url: string,
    execution: () => Promise<T>
  ): Promise<T> {
    const span = this.startSpan(`http.${method.toLowerCase()}`, undefined, {
      'http.method': method,
      'http.url': url,
      'component': 'http-client',
    });

    return execution()
      .then(result => {
        this.setTag(span.spanId, 'http.status', 'success');
        this.log(span.spanId, 'info', `HTTP ${method} request completed`);
        this.finishSpan(span.spanId, 'ok');
        return result;
      })
      .catch(error => {
        this.setTag(span.spanId, 'http.status', 'error');
        this.setTag(span.spanId, 'error.message', error.message);
        this.log(span.spanId, 'error', `HTTP ${method} request failed: ${error.message}`);
        this.finishSpan(span.spanId, 'error');
        throw error;
      });
  }

  // Cache operation tracing
  traceCacheOperation<T>(
    operation: string,
    key: string,
    execution: () => Promise<T>
  ): Promise<T> {
    const span = this.startSpan(`cache.${operation}`, undefined, {
      'cache.operation': operation,
      'cache.key': key,
      'component': 'cache',
    });

    return execution()
      .then(result => {
        this.setTag(span.spanId, 'cache.hit', result !== null && result !== undefined);
        this.log(span.spanId, 'info', `Cache ${operation} completed`);
        this.finishSpan(span.spanId, 'ok');
        return result;
      })
      .catch(error => {
        this.setTag(span.spanId, 'error.message', error.message);
        this.log(span.spanId, 'error', `Cache ${operation} failed: ${error.message}`);
        this.finishSpan(span.spanId, 'error');
        throw error;
      });
  }

  // Export span to external tracing system
  private async exportSpan(span: TraceSpan): Promise<void> {
    if (!this.config.endpoint) {
      return;
    }

    try {
      // Convert to OpenTelemetry or Jaeger format
      const traceData = this.formatForExport(span);
      
      // Send to tracing backend
      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(traceData),
      });

      this.emit('span_exported', span);
    } catch (error) {
      this.emit('span_export_error', { span, error });
    }
  }

  // Format span for export (OpenTelemetry format)
  private formatForExport(span: TraceSpan): any {
    return {
      traceId: span.traceId,
      spanId: span.spanId,
      parentSpanId: span.parentSpanId,
      operationName: span.operationName,
      startTime: span.startTime * 1000, // Convert to microseconds
      duration: (span.duration || 0) * 1000,
      tags: span.tags,
      logs: span.logs.map(log => ({
        timestamp: log.timestamp * 1000,
        fields: {
          level: log.level,
          message: log.message,
          ...log.fields,
        },
      })),
      process: {
        serviceName: this.serviceName,
        tags: {
          'jaeger.version': '1.0.0',
        },
      },
    };
  }

  // Get trace statistics
  getTraceStats(): {
    activeSpans: number;
    completedSpans: number;
    avgDuration: number;
    errorRate: number;
  } {
    const errorSpans = this.completedSpans.filter(span => span.status === 'error');
    const durations = this.completedSpans.filter(span => span.duration !== undefined)
                                        .map(span => span.duration!);
    
    return {
      activeSpans: this.activeSpans.size,
      completedSpans: this.completedSpans.length,
      avgDuration: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
      errorRate: this.completedSpans.length > 0 ? errorSpans.length / this.completedSpans.length : 0,
    };
  }

  // Middleware for automatic HTTP request tracing
  getTracingMiddleware() {
    return (req: any, res: any, next: any) => {
      const span = this.startSpan(`http.${req.method.toLowerCase()}`, undefined, {
        'http.method': req.method,
        'http.url': req.originalUrl || req.url,
        'http.user_agent': req.get('User-Agent') || '',
        'http.remote_addr': req.ip || req.connection.remoteAddress,
        'component': 'http-server',
      });

      // Attach span to request for downstream use
      req.span = span;

      res.on('finish', () => {
        this.setTag(span.spanId, 'http.status_code', res.statusCode);
        this.setTag(span.spanId, 'http.response_size', res.get('Content-Length') || 0);
        
        const status = res.statusCode >= 400 ? 'error' : 'ok';
        this.finishSpan(span.spanId, status);
      });

      next();
    };
  }

  // Clean up old spans
  cleanup(maxAge: number = 3600000): void { // Default 1 hour
    const cutoff = Date.now() - maxAge;
    this.completedSpans = this.completedSpans.filter(span => 
      (span.endTime || span.startTime) > cutoff
    );

    this.emit('cleanup_completed', {
      remainingSpans: this.completedSpans.length,
      cutoff: new Date(cutoff),
    });
  }

  // Health check for tracing service
  getHealthStatus(): { status: 'healthy' | 'unhealthy'; message: string } {
    try {
      const stats = this.getTraceStats();
      return {
        status: 'healthy',
        message: `Tracing service operational. Active: ${stats.activeSpans}, Completed: ${stats.completedSpans}`,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Tracing service error: ${error}`,
      };
    }
  }
}