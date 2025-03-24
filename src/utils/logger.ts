import { createLogger, format, transports } from 'winston';

// Simple format for logs
const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  format.printf(info => {
    const { timestamp, level, message, ...rest } = info;
    let logMessage = `${timestamp} ${level}: ${message}`;

    // If there are additional details, add them
    if (Object.keys(rest).length > 0) {
      const errorDetails =
        rest.error instanceof Error
          ? {
              name: rest.error.name,
              message: rest.error.message,
              stack: rest.error.stack,
            }
          : rest.error;

      const context = { ...rest, error: errorDetails };
      logMessage += ` | ${JSON.stringify(context)}`;
    }

    return logMessage;
  })
);

// Create the logger
const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(format.colorize(), logFormat),
  transports: [
    new transports.Console(),
    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Helper functions to better support error objects
const enhancedLogger = {
  error: (message: string, error?: any) => logger.error(message, { error }),
  warn: (message: string, meta?: any) => logger.warn(message, { meta }),
  info: (message: string, meta?: any) => logger.info(message, { meta }),
  debug: (message: string, meta?: any) => logger.debug(message, { meta }),
  http: (message: string, meta?: any) => logger.http(message, { meta }),
};

export default enhancedLogger;
