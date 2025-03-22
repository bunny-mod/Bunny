import { findByNameLazy } from "@metro/wrappers";

type LoggerFunction = (...messages: any[]) => void;
export interface Logger {
    log: LoggerFunction;
    info: LoggerFunction;
    warn: LoggerFunction;
    error: LoggerFunction;
    time: LoggerFunction;
    trace: LoggerFunction;
    verbose: LoggerFunction;
}

export const LoggerClass = findByNameLazy("Logger");
export const logger: Logger = new LoggerClass("Fastcord");
