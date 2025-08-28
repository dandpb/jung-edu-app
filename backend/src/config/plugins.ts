/**
 * Plugin System Configuration
 * Extensible plugin architecture for jaqEdu platform
 * @fileoverview Defines plugin interfaces, lifecycle management, and registration system
 */

import { z } from 'zod';
import { EventEmitter } from 'events';

/**
 * Plugin lifecycle phases
 */
export enum PluginPhase {
  INITIALIZE = 'initialize',
  CONFIGURE = 'configure', 
  START = 'start',
  READY = 'ready',
  STOP = 'stop',
  DESTROY = 'destroy'
}

/**
 * Plugin status states
 */
export enum PluginStatus {
  UNLOADED = 'unloaded',
  LOADING = 'loading',
  LOADED = 'loaded',
  STARTING = 'starting',
  ACTIVE = 'active',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  ERROR = 'error',
  DISABLED = 'disabled'
}

/**
 * Plugin configuration schema
 */
const PluginConfigSchema = z.object({
  name: z.string().min(1, 'Plugin name is required'),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in semver format'),
  description: z.string().optional(),
  author: z.string().optional(),
  homepage: z.string().url().optional(),
  repository: z.string().url().optional(),
  license: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  
  // Plugin metadata
  category: z.enum([
    'authentication',
    'authorization',
    'content',
    'assessment',
    'analytics',
    'integration',
    'ui',
    'workflow',
    'storage',
    'notification',
    'monitoring',
    'security',
    'utility'
  ]).optional(),
  
  // Plugin dependencies
  dependencies: z.record(z.string()).optional(),
  peerDependencies: z.record(z.string()).optional(),
  
  // Plugin capabilities
  capabilities: z.array(z.enum([
    'read',
    'write',
    'admin',
    'network',
    'database',
    'filesystem',
    'ai-services',
    'user-management',
    'content-management',
    'workflow-execution'
  ])).optional(),
  
  // Plugin settings
  enabled: z.boolean().default(true),
  autoStart: z.boolean().default(true),
  priority: z.number().int().min(0).max(100).default(50),
  
  // Plugin configuration
  config: z.record(z.any()).optional(),
  schema: z.record(z.any()).optional(),
  
  // Plugin entry points
  main: z.string().optional(),
  exports: z.record(z.string()).optional(),
  
  // Plugin lifecycle hooks
  hooks: z.object({
    preInstall: z.string().optional(),
    postInstall: z.string().optional(),
    preStart: z.string().optional(),
    postStart: z.string().optional(),
    preStop: z.string().optional(),
    postStop: z.string().optional(),
    preUninstall: z.string().optional(),
    postUninstall: z.string().optional(),
  }).optional(),
  
  // Plugin API definitions
  api: z.object({
    routes: z.array(z.object({
      method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
      path: z.string(),
      handler: z.string(),
      middleware: z.array(z.string()).optional(),
      permissions: z.array(z.string()).optional(),
    })).optional(),
    
    events: z.array(z.object({
      name: z.string(),
      description: z.string().optional(),
      payload: z.record(z.any()).optional(),
    })).optional(),
    
    services: z.array(z.object({
      name: z.string(),
      interface: z.string(),
      implementation: z.string(),
    })).optional(),
  }).optional(),
});

/**
 * Plugin manifest type
 */
export type PluginManifest = z.infer<typeof PluginConfigSchema>;

/**
 * Plugin context interface
 */
export interface PluginContext {
  app: any; // Express app or main application instance
  config: any; // Application configuration
  logger: any; // Logger instance
  database: any; // Database connection
  cache: any; // Cache instance
  events: EventEmitter; // Event emitter
  services: Map<string, any>; // Registered services
  plugins: Map<string, Plugin>; // Other plugins
}

/**
 * Plugin interface definition
 */
export interface Plugin {
  manifest: PluginManifest;
  status: PluginStatus;
  context?: PluginContext;
  
  // Lifecycle methods
  initialize?(context: PluginContext): Promise<void>;
  configure?(config: any): Promise<void>;
  start?(): Promise<void>;
  stop?(): Promise<void>;
  destroy?(): Promise<void>;
  
  // Health check
  healthCheck?(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }>;
  
  // Plugin-specific methods
  getInfo(): PluginManifest;
  getStatus(): PluginStatus;
  getDependencies(): string[];
  getCapabilities(): string[];
}

/**
 * Abstract plugin base class
 */
export abstract class BasePlugin implements Plugin {
  public manifest: PluginManifest;
  public status: PluginStatus = PluginStatus.UNLOADED;
  public context?: PluginContext;
  private _eventEmitter: EventEmitter;

  constructor(manifest: PluginManifest) {
    this.manifest = PluginConfigSchema.parse(manifest);
    this._eventEmitter = new EventEmitter();
  }

  /**
   * Initialize plugin with context
   */
  async initialize(context: PluginContext): Promise<void> {
    this.context = context;
    this.status = PluginStatus.LOADED;
    this.emit('initialized');
  }

  /**
   * Configure plugin with settings
   */
  async configure(config: any): Promise<void> {
    // Validate config against schema if provided
    if (this.manifest.schema) {
      const configSchema = z.object(this.manifest.schema);
      configSchema.parse(config);
    }
    
    this.manifest.config = { ...this.manifest.config, ...config };
    this.emit('configured', config);
  }

  /**
   * Start plugin
   */
  async start(): Promise<void> {
    this.status = PluginStatus.STARTING;
    this.emit('starting');
    
    // Override in subclass
    await this.onStart();
    
    this.status = PluginStatus.ACTIVE;
    this.emit('started');
  }

  /**
   * Stop plugin
   */
  async stop(): Promise<void> {
    this.status = PluginStatus.STOPPING;
    this.emit('stopping');
    
    // Override in subclass
    await this.onStop();
    
    this.status = PluginStatus.STOPPED;
    this.emit('stopped');
  }

  /**
   * Destroy plugin and cleanup resources
   */
  async destroy(): Promise<void> {
    await this.stop();
    
    // Override in subclass
    await this.onDestroy();
    
    this.removeAllListeners();
    this.status = PluginStatus.UNLOADED;
    this.emit('destroyed');
  }

  /**
   * Health check implementation
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }> {
    return { status: this.status === PluginStatus.ACTIVE ? 'healthy' : 'unhealthy' };
  }

  /**
   * Get plugin information
   */
  getInfo(): PluginManifest {
    return this.manifest;
  }

  /**
   * Get plugin status
   */
  getStatus(): PluginStatus {
    return this.status;
  }

  /**
   * Get plugin dependencies
   */
  getDependencies(): string[] {
    return Object.keys(this.manifest.dependencies || {});
  }

  /**
   * Get plugin capabilities
   */
  getCapabilities(): string[] {
    return this.manifest.capabilities || [];
  }

  /**
   * Event emitter methods
   */
  on(event: string, listener: (...args: any[]) => void): this {
    this._eventEmitter.on(event, listener);
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    return this._eventEmitter.emit(event, ...args);
  }

  removeAllListeners(event?: string): this {
    this._eventEmitter.removeAllListeners(event);
    return this;
  }

  // Abstract methods to be implemented by subclasses
  protected abstract onStart(): Promise<void>;
  protected abstract onStop(): Promise<void>;
  protected abstract onDestroy(): Promise<void>;
}

/**
 * Plugin manager for registration, lifecycle management, and dependency resolution
 */
export class PluginManager extends EventEmitter {
  private plugins: Map<string, Plugin> = new Map();
  private pluginDependencies: Map<string, string[]> = new Map();
  private context: PluginContext;

  constructor(context: PluginContext) {
    super();
    this.context = context;
  }

  /**
   * Register a plugin
   */
  async register(plugin: Plugin): Promise<void> {
    const name = plugin.manifest.name;
    
    if (this.plugins.has(name)) {
      throw new Error(`Plugin '${name}' is already registered`);
    }

    // Validate dependencies
    const dependencies = plugin.getDependencies();
    for (const dep of dependencies) {
      if (!this.plugins.has(dep)) {
        throw new Error(`Plugin '${name}' depends on '${dep}' which is not registered`);
      }
    }

    this.plugins.set(name, plugin);
    this.pluginDependencies.set(name, dependencies);
    
    await plugin.initialize(this.context);
    
    this.emit('plugin-registered', { name, plugin });
  }

  /**
   * Unregister a plugin
   */
  async unregister(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw new Error(`Plugin '${name}' is not registered`);
    }

    // Check if other plugins depend on this one
    for (const [pluginName, deps] of this.pluginDependencies) {
      if (deps.includes(name)) {
        throw new Error(`Cannot unregister plugin '${name}' because '${pluginName}' depends on it`);
      }
    }

    await plugin.destroy();
    this.plugins.delete(name);
    this.pluginDependencies.delete(name);
    
    this.emit('plugin-unregistered', { name, plugin });
  }

  /**
   * Start all plugins in dependency order
   */
  async startAll(): Promise<void> {
    const startOrder = this.getStartOrder();
    
    for (const name of startOrder) {
      const plugin = this.plugins.get(name);
      if (plugin && plugin.manifest.enabled && plugin.manifest.autoStart) {
        try {
          await plugin.start();
          this.emit('plugin-started', { name, plugin });
        } catch (error) {
          plugin.status = PluginStatus.ERROR;
          this.emit('plugin-error', { name, plugin, error });
          throw new Error(`Failed to start plugin '${name}': ${error}`);
        }
      }
    }
  }

  /**
   * Stop all plugins in reverse dependency order
   */
  async stopAll(): Promise<void> {
    const stopOrder = this.getStartOrder().reverse();
    
    for (const name of stopOrder) {
      const plugin = this.plugins.get(name);
      if (plugin && plugin.status === PluginStatus.ACTIVE) {
        try {
          await plugin.stop();
          this.emit('plugin-stopped', { name, plugin });
        } catch (error) {
          this.emit('plugin-error', { name, plugin, error });
        }
      }
    }
  }

  /**
   * Get plugin by name
   */
  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Get all plugins
   */
  getPlugins(): Map<string, Plugin> {
    return this.plugins;
  }

  /**
   * Get plugins by category
   */
  getPluginsByCategory(category: string): Plugin[] {
    return Array.from(this.plugins.values()).filter(
      plugin => plugin.manifest.category === category
    );
  }

  /**
   * Get plugin status summary
   */
  getStatusSummary(): Record<string, PluginStatus> {
    const summary: Record<string, PluginStatus> = {};
    for (const [name, plugin] of this.plugins) {
      summary[name] = plugin.status;
    }
    return summary;
  }

  /**
   * Health check for all plugins
   */
  async healthCheckAll(): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    
    for (const [name, plugin] of this.plugins) {
      try {
        results[name] = await plugin.healthCheck?.() || { status: 'unknown' };
      } catch (error) {
        results[name] = { status: 'unhealthy', error: error.message };
      }
    }
    
    return results;
  }

  /**
   * Calculate plugin start order based on dependencies
   */
  private getStartOrder(): string[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const order: string[] = [];

    const visit = (name: string) => {
      if (visiting.has(name)) {
        throw new Error(`Circular dependency detected involving plugin '${name}'`);
      }
      
      if (visited.has(name)) {
        return;
      }

      visiting.add(name);
      
      const dependencies = this.pluginDependencies.get(name) || [];
      for (const dep of dependencies) {
        visit(dep);
      }
      
      visiting.delete(name);
      visited.add(name);
      order.push(name);
    };

    for (const name of this.plugins.keys()) {
      visit(name);
    }

    return order;
  }
}

/**
 * Default plugin configurations
 */
export const defaultPluginConfigs = {
  // Authentication plugins
  authenticationPlugin: {
    name: 'authentication',
    version: '1.0.0',
    description: 'Core authentication plugin',
    category: 'authentication' as const,
    capabilities: ['user-management'],
    enabled: true,
    autoStart: true,
    priority: 90,
    config: {
      providers: ['local', 'google', 'github'],
      sessionTimeout: 3600,
      maxLoginAttempts: 5,
    },
  },

  // Content management plugin
  contentPlugin: {
    name: 'content-management',
    version: '1.0.0',
    description: 'Educational content management plugin',
    category: 'content' as const,
    capabilities: ['read', 'write', 'content-management'],
    enabled: true,
    autoStart: true,
    priority: 80,
    config: {
      maxFileSize: 10485760,
      allowedTypes: ['video', 'document', 'image'],
      versioning: true,
    },
  },

  // AI services plugin
  aiServicesPlugin: {
    name: 'ai-services',
    version: '1.0.0',
    description: 'AI-powered educational services',
    category: 'integration' as const,
    capabilities: ['ai-services', 'network'],
    enabled: true,
    autoStart: true,
    priority: 70,
    config: {
      providers: ['openai', 'claude'],
      maxTokens: 2000,
      temperature: 0.7,
    },
  },

  // Analytics plugin
  analyticsPlugin: {
    name: 'analytics',
    version: '1.0.0',
    description: 'Learning analytics and reporting',
    category: 'analytics' as const,
    capabilities: ['read', 'database'],
    enabled: true,
    autoStart: true,
    priority: 60,
    config: {
      trackingEnabled: true,
      dataRetentionDays: 365,
      anonymizeData: false,
    },
  },

  // Workflow engine plugin
  workflowPlugin: {
    name: 'workflow-engine',
    version: '1.0.0',
    description: 'Educational workflow automation',
    category: 'workflow' as const,
    capabilities: ['workflow-execution', 'admin'],
    enabled: true,
    autoStart: true,
    priority: 50,
    config: {
      maxConcurrentWorkflows: 10,
      workflowTimeout: 300000,
      retryAttempts: 3,
    },
  },
};

/**
 * Plugin configuration validator
 */
export function validatePluginConfig(config: any): PluginManifest {
  return PluginConfigSchema.parse(config);
}

/**
 * Example plugin implementation
 */
export class ExamplePlugin extends BasePlugin {
  constructor() {
    super({
      name: 'example-plugin',
      version: '1.0.0',
      description: 'Example plugin implementation',
      category: 'utility',
      capabilities: ['read'],
      enabled: true,
      autoStart: true,
      priority: 10,
    });
  }

  protected async onStart(): Promise<void> {
    console.log(`Starting ${this.manifest.name} plugin`);
    // Plugin-specific start logic
  }

  protected async onStop(): Promise<void> {
    console.log(`Stopping ${this.manifest.name} plugin`);
    // Plugin-specific stop logic
  }

  protected async onDestroy(): Promise<void> {
    console.log(`Destroying ${this.manifest.name} plugin`);
    // Plugin-specific cleanup logic
  }
}

export default PluginManager;