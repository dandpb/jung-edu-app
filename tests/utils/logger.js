"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.LogLevel = void 0;
const fs = __importStar(require("fs"));
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    constructor(component, logLevel = LogLevel.INFO, logFile) {
        this.component = component;
        this.logLevel = logLevel;
        this.logFile = logFile;
    }
    error(message, metadata) {
        this.log(LogLevel.ERROR, message, metadata);
    }
    warn(message, metadata) {
        this.log(LogLevel.WARN, message, metadata);
    }
    info(message, metadata) {
        this.log(LogLevel.INFO, message, metadata);
    }
    debug(message, metadata) {
        this.log(LogLevel.DEBUG, message, metadata);
    }
    log(level, message, metadata) {
        if (level > this.logLevel)
            return;
        const entry = {
            timestamp: new Date(),
            level,
            component: this.component,
            message,
            metadata
        };
        this.writeLog(entry);
    }
    writeLog(entry) {
        const formattedMessage = this.formatLog(entry);
        // Console output
        console.log(formattedMessage);
        // File output if specified
        if (this.logFile) {
            fs.appendFileSync(this.logFile, formattedMessage + '\n');
        }
    }
    formatLog(entry) {
        const timestamp = entry.timestamp.toISOString();
        const level = LogLevel[entry.level];
        let formatted = `[${timestamp}] ${level} [${entry.component}] ${entry.message}`;
        if (entry.metadata) {
            formatted += ` ${JSON.stringify(entry.metadata)}`;
        }
        return formatted;
    }
}
exports.Logger = Logger;
//# sourceMappingURL=logger.js.map