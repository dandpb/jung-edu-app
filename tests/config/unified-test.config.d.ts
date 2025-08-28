import { Config } from '@jest/types';
import { PlaywrightTestConfig } from '@playwright/test';
export interface TestEnvironmentConfig {
    database: {
        host: string;
        port: number;
        database: string;
        username: string;
        password: string;
        ssl: boolean;
    };
    redis: {
        host: string;
        port: number;
        db: number;
        password?: string;
    };
    api: {
        baseUrl: string;
        timeout: number;
        retries: number;
    };
    websocket: {
        url: string;
        timeout: number;
    };
    monitoring: {
        enabled: boolean;
        metricsPort: number;
    };
    security: {
        testApiKey: string;
        adminToken: string;
    };
    performance: {
        maxResponseTime: number;
        maxMemoryUsage: number;
        maxCpuUsage: number;
        loadTestConcurrency: number;
    };
    external: {
        openai: {
            apiKey: string;
            baseUrl: string;
            model: string;
        };
        supabase: {
            url: string;
            anonKey: string;
            serviceKey: string;
        };
        youtube: {
            apiKey: string;
        };
    };
}
declare const environments: Record<string, TestEnvironmentConfig>;
export declare const testConfig: TestEnvironmentConfig;
export declare const jestConfig: Config.InitialOptions;
export declare const playwrightConfig: PlaywrightTestConfig;
export { environments };
export default testConfig;
//# sourceMappingURL=unified-test.config.d.ts.map