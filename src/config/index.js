import dotenv from 'dotenv';

dotenv.config();

export default {
  shopify: {
    source: {
      storeName: process.env.SHOPIFY_STORE_NAME,
      accessToken: process.env.PIM_ACCESS_TOKEN,
      apiVersion: process.env.SHOPIFY_API_VERSION,
    },
    receiver: {
      storeName: process.env.RECEIVER_STORE_NAME,
      accessToken: process.env.RECEIVER_ACCESS_TOKEN,
      apiVersion: process.env.SHOPIFY_API_VERSION,
    }
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    directory: process.env.LOG_DIR || 'logs',
    maxSize: '10m',
    maxFiles: '7d',
    format: process.env.NODE_ENV === 'production' ? 'json' : 'simple'
  },
  port: process.env.PORT || 3001,
};