import dotenv from 'dotenv';

dotenv.config();

export default {
  shopify: {
    source: {
      storeName: process.env.SHOPIFY_STORE_NAME,
      accessToken: process.env.PIM_ACCESS_TOKEN,
      apiVersion: process.env.SHOPIFY_API_VERSION || '2024-01',
    },
    receiver: {
      storeName: process.env.RECEIVER_STORE_NAME,
      accessToken: process.env.RECEIVER_ACCESS_TOKEN,
      apiVersion: process.env.SHOPIFY_API_VERSION || '2024-01',
    }
  },
  port: process.env.PORT || 3001,
};