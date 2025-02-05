import winston from 'winston';
import path from 'path';

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const logger = winston.createLogger({
  levels: logLevels,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    // Console logging
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // Error logging
    new winston.transports.File({
      filename: path.join(__dirname, 'logs', 'error.log'),
      level: 'error'
    }),
    // Combined logging
    new winston.transports.File({
      filename: path.join(__dirname, 'logs', 'combined.log')
    })
  ]
});

export default logger;