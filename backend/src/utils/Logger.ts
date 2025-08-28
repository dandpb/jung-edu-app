export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
}

export class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private logLevel: LogLevel = LogLevel.INFO;

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public static debug(message: string, context?: string, data?: any): void {
    Logger.getInstance().log(LogLevel.DEBUG, message, context, data);
  }

  public static info(message: string, context?: string, data?: any): void {
    Logger.getInstance().log(LogLevel.INFO, message, context, data);
  }

  public static warn(message: string, context?: string, data?: any): void {
    Logger.getInstance().log(LogLevel.WARN, message, context, data);
  }

  public static error(message: string, context?: string, data?: any): void {
    Logger.getInstance().log(LogLevel.ERROR, message, context, data);
  }

  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  public log(level: LogLevel, message: string, context?: string, data?: any): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      data
    };

    this.logs.push(entry);

    // Only output if level meets threshold
    if (this.shouldLog(level)) {
      const formattedMessage = this.formatMessage(entry);
      
      switch (level) {
        case LogLevel.ERROR:
          console.error(formattedMessage);
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage);
          break;
        case LogLevel.DEBUG:
          console.debug(formattedMessage);
          break;
        default:
          console.log(formattedMessage);
      }
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentIndex = levels.indexOf(this.logLevel);
    const messageIndex = levels.indexOf(level);
    return messageIndex >= currentIndex;
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const context = entry.context ? `[${entry.context}]` : '';
    const data = entry.data ? ` ${JSON.stringify(entry.data)}` : '';
    return `[${timestamp}] ${entry.level.toUpperCase()} ${context} ${entry.message}${data}`;
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
  }
}

// Export singleton instance for convenience
export const logger = Logger.getInstance();