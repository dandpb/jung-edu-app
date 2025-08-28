import * as fs from 'fs';
import * as path from 'path';

export enum LogLevel {
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

export class Logger {
  private component: string;
  private logLevel: LogLevel;
  private logFile?: string;

  constructor(component: string, logLevel: LogLevel = LogLevel.INFO, logFile?: string) {
    this.component = component;
    this.logLevel = logLevel;
    this.logFile = logFile;
  }

  error(message: string, metadata?: any): void {
    this.log(LogLevel.ERROR, message, metadata);
  }

  warn(message: string, metadata?: any): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  info(message: string, metadata?: any): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  debug(message: string, metadata?: any): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  private log(level: LogLevel, message: string, metadata?: any): void {
    if (level > this.logLevel) return;

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      component: this.component,
      message,
      metadata
    };

    this.writeLog(entry);
  }

  private writeLog(entry: LogEntry): void {
    const formattedMessage = this.formatLog(entry);
    
    // Console output
    console.log(formattedMessage);
    
    // File output if specified
    if (this.logFile) {
      fs.appendFileSync(this.logFile, formattedMessage + '\n');
    }
  }

  private formatLog(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = LogLevel[entry.level];
    let formatted = `[${timestamp}] ${level} [${entry.component}] ${entry.message}`;
    
    if (entry.metadata) {
      formatted += ` ${JSON.stringify(entry.metadata)}`;
    }
    
    return formatted;
  }
}