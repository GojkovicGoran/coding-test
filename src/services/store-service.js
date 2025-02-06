import ShopifyClient from '../clients/shopify-client.js';
import config from '../config/store-config.js';
import logger from '../utils/logger.js';

export const createStoreClient = (type = 'source') => {
  try {
    const storeConfig = config[type];
    if (!storeConfig) {
      throw new Error(`Invalid store type: ${type}`);
    }

    const { storeName, accessToken, apiVersion } = storeConfig;
    
    if (!storeName || !accessToken) {
      throw new Error(`Missing ${type} store configuration`);
    }

    const cleanStoreName = storeName.replace('.myshopify.com', '');
    logger.debug(`Creating ${type} store client`, { store: cleanStoreName });
    
    return new ShopifyClient(
      cleanStoreName,
      accessToken,
      apiVersion
    );
  } catch (error) {
    logger.error(`Failed to create ${type} store client:`, error);
    throw error;
  }
};

export const validateStoreConnection = async (client, type = 'store') => {
  try {
    logger.debug(`Validating ${type} store connection`);
    const products = await client.getProducts();
    logger.info(`Successfully validated ${type} store connection`);
    return true;
  } catch (error) {
    logger.error(`${type} store connection validation failed:`, error);
    throw new Error(`${type} store connection failed: ${error.message}`);
  }
};
