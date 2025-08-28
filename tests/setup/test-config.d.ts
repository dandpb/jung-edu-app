import { Config } from '@jest/types';
declare const config: Config.InitialOptions;
export default config;
export declare const testConfig: {
    database: {
        host: string;
        port: number;
        database: string;
        username: string;
        password: string;
    };
    redis: {
        host: string;
        port: number;
        db: number;
    };
    api: {
        baseUrl: string;
        timeout: number;
    };
    websocket: {
        url: string;
        timeout: number;
    };
    performance: {
        maxResponseTime: number;
        maxMemoryUsage: number;
        maxCpuUsage: number;
    };
};
//# sourceMappingURL=test-config.d.ts.map