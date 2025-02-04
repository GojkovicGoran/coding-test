import winston from 'winston';
import config from '../config/index.js';

const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: `${config.logging.directory}/error.log`, 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: `${config.logging.directory}/sync.log` 
    }),
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format[config.logging.format]()
  }));
}

export default logger;
