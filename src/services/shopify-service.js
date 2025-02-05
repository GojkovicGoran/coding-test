import Shopify from 'shopify-api-node';
import config from '../config/index.js';
import logger from '../utils/logger.js';

export const createShopifyClient = (storeType = 'source') => {
  try {
    const storeConfig = config.shopify[storeType];

    if (!storeConfig.accessToken || !storeConfig.storeName) {
      throw new Error(`Missing Shopify credentials for ${storeType} store`);
    }

    return new Shopify({
      shopName: storeConfig.storeName,
      accessToken: storeConfig.accessToken,
      apiVersion: storeConfig.apiVersion
    });
  } catch (error) {
    logger.error(`Failed to create Shopify client for ${storeType}:`, error);
    throw error;
  }
};

export const validateShopifyConnection = async (client) => {
  try {
    await client.shop.get();
    logger.info('Successfully connected to Shopify store');
  } catch (error) {
    logger.error('Shopify API error', {
      endpoint: 'shop.json',
      method: 'GET',
      error: error.message,
      stack: error.stack,
    });
    throw new Error('Failed to validate Shopify connection');
  }
};
