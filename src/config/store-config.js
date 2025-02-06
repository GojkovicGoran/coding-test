import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env file
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env') });

const requiredEnvVars = [
  'SOURCE_STORE_NAME',
  'SOURCE_ACCESS_TOKEN',
  'RECEIVER_STORE_NAME',
  'RECEIVER_ACCESS_TOKEN',
  'SHOPIFY_API_VERSION'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

export default {
  source: {
    storeName: process.env.SOURCE_STORE_NAME,
    accessToken: process.env.SOURCE_ACCESS_TOKEN,
    apiVersion: process.env.SHOPIFY_API_VERSION
  },
  destination: {
    storeName: process.env.RECEIVER_STORE_NAME,
    accessToken: process.env.RECEIVER_ACCESS_TOKEN,
    apiVersion: process.env.SHOPIFY_API_VERSION
  },
  app: {
    batchSize: parseInt(process.env.BATCH_SIZE || '50'),
    rateLimitDelay: parseInt(process.env.RATE_LIMIT_DELAY || '500'),
    maxFailures: parseInt(process.env.MAX_FAILURES || '10'),
    nodeEnv: process.env.NODE_ENV || 'development'
  }
};
