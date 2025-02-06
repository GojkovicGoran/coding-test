import ShopifyClient from '../clients/shopify-client.js';
import config from '../config/store-config.js';
import logger from '../utils/logger.js';

export const validatePimConnection = async (client) => {
  try {
    logger.debug('Validating source store connection');
    const products = await client.getProducts();
    if (!Array.isArray(products)) {
      throw new Error('Invalid response from source store API');
    }
    logger.info('Successfully validated source store connection');
    return true;
  } catch (error) {
    logger.error('Source store connection validation failed:', error);
    throw new Error(`Source store connection failed: ${error.message}`);
  }
};

export const createPimClient = async () => {
  try {
    const { storeName, accessToken, apiVersion } = config.source;
    
    if (!storeName || !accessToken) {
      throw new Error('Missing source store configuration');
    }

    const cleanStoreName = storeName.replace('.myshopify.com', '');
    logger.debug('Creating source store client', { store: cleanStoreName });
    
    const client = new ShopifyClient(
      cleanStoreName,
      accessToken,
      apiVersion
    );

    return client;
  } catch (error) {
    logger.error('Failed to create source store client:', error);
    throw error;
  }
};

export default {
  createPimClient,
  validatePimConnection
};