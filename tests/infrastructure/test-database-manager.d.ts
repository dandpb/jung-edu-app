import { Client } from 'pg';
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
export interface TestTransaction {
    id: string;
    client: Client;
    rollback(): Promise<void>;
    commit(): Promise<void>;
    cleanup(): Promise<void>;
}
export interface TestFixture {
    name: string;
    table: string;
    data: any[];
    dependencies?: string[];
}
export declare class TestDatabaseManager {
    private pool;
    private redis;
    private logger;
    private snapshots;
    private activeTransactions;
    private initialized;
    constructor();
    /**
     * Initialize the test database manager
     */
    initialize(): Promise<void>;
    /**
     * Run database migrations for test environment
     */
    private runMigrations;
    /**
     * Execute a single migration
     */
    private executeMigration;
    /**
     * Create base tables required for testing
     */
    private createBaseTables;
    /**
     * Seed database with test fixtures
     */
    seedDatabase(fixtures: TestFixture[]): Promise<void>;
    /**
     * Load a single fixture into the database
     */
    private loadFixture;
    /**
     * Sort fixtures by their dependencies
     */
    private sortFixturesByDependencies;
    /**
     * Create a database snapshot
     */
    createSnapshot(name: string): Promise<DatabaseSnapshot>;
    /**
     * Restore database from snapshot
     */
    restoreSnapshot(snapshotId: string): Promise<void>;
    /**
     * Load snapshot from database
     */
    private loadSnapshotFromDatabase;
    /**
     * Create isolated transaction for test
     */
    createTransaction(): Promise<TestTransaction>;
    /**
     * Clear all test tables
     */
    private clearTestTables;
    /**
     * Clean up database and connections
     */
    cleanup(): Promise<void>;
    /**
     * Get database statistics
     */
    getStats(): Promise<any>;
}
export declare const testDatabaseManager: TestDatabaseManager;
//# sourceMappingURL=test-database-manager.d.ts.map