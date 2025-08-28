export declare enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3
}
export interface LogEntry {
    timestamp: Date;
    level: LogLevel;
    component: string;
    message: string;
    metadata?: any;
}
export declare class Logger {
    private component;
    private logLevel;
    private logFile?;
    constructor(component: string, logLevel?: LogLevel, logFile?: string);
    error(message: string, metadata?: any): void;
    warn(message: string, metadata?: any): void;
    info(message: string, metadata?: any): void;
    debug(message: string, metadata?: any): void;
    private log;
    private writeLog;
    private formatLog;
}
//# sourceMappingURL=logger.d.ts.map