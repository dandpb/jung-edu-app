import { Pool, Client, PoolConfig } from 'pg';
import { Redis } from 'ioredis';
import { testConfig } from '../config/unified-test.config';
import { TestDataFactory } from '../factories/test-data-factory';
import { Logger } from '../utils/logger';

// Database snapshot interface
export interface DatabaseSnapshot {
  id: string;
  timestamp: Date;
  tables: Record<string, any[]>;
  metadata: {
    version: string;
    environment: string;
    fixtures: string[];
  };
}

// Transaction context
export interface TestTransaction {
  id: string;
  client: Client;
  rollback(): Promise<void>;
  commit(): Promise<void>;
  cleanup(): Promise<void>;
}

// Test fixture interface
export interface TestFixture {
  name: string;
  table: string;
  data: any[];
  dependencies?: string[];
}

// Database test manager
export class TestDatabaseManager {
  private pool: Pool;
  private redis: Redis;
  private logger: Logger;
  private snapshots: Map<string, DatabaseSnapshot> = new Map();
  private activeTransactions: Set<TestTransaction> = new Set();
  private initialized = false;

  constructor() {
    this.logger = new Logger('TestDatabaseManager');
    
    // Initialize PostgreSQL connection pool
    const poolConfig: PoolConfig = {
      host: testConfig.database.host,
      port: testConfig.database.port,
      database: testConfig.database.database,
      user: testConfig.database.username,
      password: testConfig.database.password,
      ssl: testConfig.database.ssl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    };
    
    this.pool = new Pool(poolConfig);
    
    // Initialize Redis connection
    this.redis = new Redis({
      host: testConfig.redis.host,
      port: testConfig.redis.port,
      db: testConfig.redis.db,
      password: testConfig.redis.password,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3
    });
  }

  /**
   * Initialize the test database manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Test database connection
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      
      // Test Redis connection
      await this.redis.ping();
      
      // Run database migrations
      await this.runMigrations();
      
      // Create base tables if they don't exist
      await this.createBaseTables();
      
      this.initialized = true;
      this.logger.info('Test database manager initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize test database manager', error);
      throw error;
    }
  }

  /**
   * Run database migrations for test environment
   */
  private async runMigrations(): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      // Create migrations table if it doesn't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS test_migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          executed_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      // List of migration files to run
      const migrations = [
        'create_users_table',
        'create_modules_table',
        'create_quizzes_table',
        'create_workflows_table',
        'create_test_fixtures_table'
      ];
      
      for (const migration of migrations) {
        await this.executeMigration(client, migration);
      }
      
      this.logger.info('Database migrations completed');
    } finally {
      client.release();
    }
  }

  /**
   * Execute a single migration
   */
  private async executeMigration(client: Client, migrationName: string): Promise<void> {
    // Check if migration already executed
    const result = await client.query(
      'SELECT name FROM test_migrations WHERE name = $1',
      [migrationName]
    );
    
    if (result.rows.length > 0) {
      return; // Migration already executed
    }
    
    // Execute migration based on name
    switch (migrationName) {
      case 'create_users_table':
        await client.query(`
          CREATE TABLE IF NOT EXISTS test_users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(50) DEFAULT 'student',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `);
        break;
        
      case 'create_modules_table':
        await client.query(`
          CREATE TABLE IF NOT EXISTS test_modules (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title VARCHAR(255) NOT NULL,
            description TEXT,
            content JSONB,
            author_id UUID REFERENCES test_users(id),
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `);
        break;
        
      case 'create_quizzes_table':
        await client.query(`
          CREATE TABLE IF NOT EXISTS test_quizzes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            module_id UUID REFERENCES test_modules(id),
            title VARCHAR(255) NOT NULL,
            questions JSONB,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `);
        break;
        
      case 'create_workflows_table':
        await client.query(`
          CREATE TABLE IF NOT EXISTS test_workflows (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            definition JSONB,
            status VARCHAR(50) DEFAULT 'draft',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `);
        break;
        
      case 'create_test_fixtures_table':
        await client.query(`
          CREATE TABLE IF NOT EXISTS test_fixtures (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            table_name VARCHAR(255) NOT NULL,
            data JSONB,
            created_at TIMESTAMP DEFAULT NOW()
          )
        `);
        break;
    }
    
    // Record migration as executed
    await client.query(
      'INSERT INTO test_migrations (name) VALUES ($1)',
      [migrationName]
    );
  }

  /**
   * Create base tables required for testing
   */
  private async createBaseTables(): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      // Create test snapshots table
      await client.query(`
        CREATE TABLE IF NOT EXISTS test_snapshots (
          id VARCHAR(255) PRIMARY KEY,
          timestamp TIMESTAMP NOT NULL,
          tables JSONB NOT NULL,
          metadata JSONB NOT NULL
        )
      `);
      
      // Create test transactions table
      await client.query(`
        CREATE TABLE IF NOT EXISTS test_transactions (
          id VARCHAR(255) PRIMARY KEY,
          status VARCHAR(50) NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
    } finally {
      client.release();
    }
  }

  /**
   * Seed database with test fixtures
   */
  async seedDatabase(fixtures: TestFixture[]): Promise<void> {
    if (!this.initialized) await this.initialize();
    
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Sort fixtures by dependencies
      const sortedFixtures = this.sortFixturesByDependencies(fixtures);
      
      for (const fixture of sortedFixtures) {
        await this.loadFixture(client, fixture);
      }
      
      await client.query('COMMIT');
      this.logger.info(`Seeded database with ${fixtures.length} fixtures`);
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Failed to seed database', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Load a single fixture into the database
   */
  private async loadFixture(client: Client, fixture: TestFixture): Promise<void> {
    if (fixture.data.length === 0) return;
    
    // Get column names from first data item
    const columns = Object.keys(fixture.data[0]);
    const columnList = columns.join(', ');
    const placeholderList = columns.map((_, i) => `$${i + 1}`).join(', ');
    
    // Insert each row
    for (const row of fixture.data) {
      const values = columns.map(col => row[col]);
      await client.query(
        `INSERT INTO ${fixture.table} (${columnList}) VALUES (${placeholderList}) ON CONFLICT DO NOTHING`,
        values
      );
    }
    
    this.logger.debug(`Loaded fixture: ${fixture.name} (${fixture.data.length} rows)`);
  }

  /**
   * Sort fixtures by their dependencies
   */
  private sortFixturesByDependencies(fixtures: TestFixture[]): TestFixture[] {
    const sorted: TestFixture[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();
    
    const visit = (fixture: TestFixture) => {
      if (visiting.has(fixture.name)) {
        throw new Error(`Circular dependency detected in fixture: ${fixture.name}`);
      }
      
      if (visited.has(fixture.name)) return;
      
      visiting.add(fixture.name);
      
      // Visit dependencies first
      if (fixture.dependencies) {
        for (const depName of fixture.dependencies) {
          const dep = fixtures.find(f => f.name === depName);
          if (dep) visit(dep);
        }
      }
      
      visiting.delete(fixture.name);
      visited.add(fixture.name);
      sorted.push(fixture);
    };
    
    for (const fixture of fixtures) {
      visit(fixture);
    }
    
    return sorted;
  }

  /**
   * Create a database snapshot
   */
  async createSnapshot(name: string): Promise<DatabaseSnapshot> {
    if (!this.initialized) await this.initialize();
    
    const client = await this.pool.connect();
    const snapshot: DatabaseSnapshot = {
      id: name,
      timestamp: new Date(),
      tables: {},
      metadata: {
        version: '1.0.0',
        environment: process.env.TEST_ENV || 'local',
        fixtures: []
      }
    };
    
    try {
      // Get list of all tables
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name LIKE 'test_%'
      `);
      
      // Snapshot each table's data
      for (const row of tablesResult.rows) {
        const tableName = row.table_name;
        const dataResult = await client.query(`SELECT * FROM ${tableName}`);
        snapshot.tables[tableName] = dataResult.rows;
      }
      
      // Store snapshot
      this.snapshots.set(name, snapshot);
      
      // Persist snapshot to database
      await client.query(
        'INSERT INTO test_snapshots (id, timestamp, tables, metadata) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET timestamp = $2, tables = $3, metadata = $4',
        [snapshot.id, snapshot.timestamp, JSON.stringify(snapshot.tables), JSON.stringify(snapshot.metadata)]
      );
      
      this.logger.info(`Created database snapshot: ${name}`);
      return snapshot;
    } finally {
      client.release();
    }
  }

  /**
   * Restore database from snapshot
   */
  async restoreSnapshot(snapshotId: string): Promise<void> {
    if (!this.initialized) await this.initialize();
    
    let snapshot = this.snapshots.get(snapshotId);
    
    // Load snapshot from database if not in memory
    if (!snapshot) {
      snapshot = await this.loadSnapshotFromDatabase(snapshotId);
    }
    
    if (!snapshot) {
      throw new Error(`Snapshot not found: ${snapshotId}`);
    }
    
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Clear all test tables
      await this.clearTestTables(client);
      
      // Restore data from snapshot
      for (const [tableName, data] of Object.entries(snapshot.tables)) {
        if (data.length > 0) {
          const columns = Object.keys(data[0]);
          const columnList = columns.join(', ');
          
          for (const row of data) {
            const values = columns.map(col => row[col]);
            const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
            
            await client.query(
              `INSERT INTO ${tableName} (${columnList}) VALUES (${placeholders})`,
              values
            );
          }
        }
      }
      
      await client.query('COMMIT');
      this.logger.info(`Restored database from snapshot: ${snapshotId}`);
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error(`Failed to restore snapshot: ${snapshotId}`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Load snapshot from database
   */
  private async loadSnapshotFromDatabase(snapshotId: string): Promise<DatabaseSnapshot | null> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(
        'SELECT * FROM test_snapshots WHERE id = $1',
        [snapshotId]
      );
      
      if (result.rows.length === 0) return null;
      
      const row = result.rows[0];
      const snapshot: DatabaseSnapshot = {
        id: row.id,
        timestamp: row.timestamp,
        tables: JSON.parse(row.tables),
        metadata: JSON.parse(row.metadata)
      };
      
      this.snapshots.set(snapshotId, snapshot);
      return snapshot;
    } finally {
      client.release();
    }
  }

  /**
   * Create isolated transaction for test
   */
  async createTransaction(): Promise<TestTransaction> {
    if (!this.initialized) await this.initialize();
    
    const client = await this.pool.connect();
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await client.query('BEGIN');
    
    const transaction: TestTransaction = {
      id: transactionId,
      client,
      async rollback() {
        await client.query('ROLLBACK');
      },
      async commit() {
        await client.query('COMMIT');
      },
      async cleanup() {
        await client.query('ROLLBACK'); // Ensure rollback if not committed
        client.release();
      }
    };
    
    this.activeTransactions.add(transaction);
    
    // Record transaction
    await client.query(
      'INSERT INTO test_transactions (id, status) VALUES ($1, $2)',
      [transactionId, 'active']
    );
    
    return transaction;
  }

  /**
   * Clear all test tables
   */
  private async clearTestTables(client: Client): Promise<void> {
    // Get list of test tables in dependency order (reverse)
    const tables = [
      'test_quizzes',
      'test_modules', 
      'test_users',
      'test_workflows',
      'test_fixtures'
    ];
    
    // Disable foreign key checks temporarily
    await client.query('SET session_replication_role = replica');
    
    try {
      for (const table of tables) {
        await client.query(`TRUNCATE TABLE ${table} CASCADE`);
      }
    } finally {
      // Re-enable foreign key checks
      await client.query('SET session_replication_role = DEFAULT');
    }
  }

  /**
   * Clean up database and connections
   */
  async cleanup(): Promise<void> {
    try {
      // Rollback all active transactions
      for (const transaction of this.activeTransactions) {
        await transaction.cleanup();
      }
      this.activeTransactions.clear();
      
      // Clear all test tables
      if (this.initialized) {
        const client = await this.pool.connect();
        try {
          await this.clearTestTables(client);
        } finally {
          client.release();
        }
      }
      
      // Close connections
      await this.pool.end();
      await this.redis.quit();
      
      this.logger.info('Test database cleanup completed');
    } catch (error) {
      this.logger.error('Error during database cleanup', error);
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<any> {
    if (!this.initialized) await this.initialize();
    
    const client = await this.pool.connect();
    
    try {
      const stats = {
        connections: {
          total: this.pool.totalCount,
          idle: this.pool.idleCount,
          waiting: this.pool.waitingCount
        },
        transactions: {
          active: this.activeTransactions.size
        },
        snapshots: {
          count: this.snapshots.size
        },
        tables: {}
      };
      
      // Get row counts for each test table
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name LIKE 'test_%'
      `);
      
      for (const row of tablesResult.rows) {
        const tableName = row.table_name;
        const countResult = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        stats.tables[tableName] = parseInt(countResult.rows[0].count);
      }
      
      return stats;
    } finally {
      client.release();
    }
  }
}

// Singleton instance
export const testDatabaseManager = new TestDatabaseManager();