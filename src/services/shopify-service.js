import ShopifyClient from '../clients/shopify-client.js';
import config from '../config/store-config.js';
import logger from '../utils/logger.js';

export const createShopifyClient = () => {
  try {
    const { storeName, accessToken, apiVersion } = config.shopify;
    
    if (!storeName || !accessToken) {
      throw new Error('Missing Shopify credentials');
    }

    // Remove .myshopify.com if it's included in the store name
    const cleanStoreName = storeName.replace('.myshopify.com', '');
    
    logger.debug('Creating Shopify client', { store: cleanStoreName });
    
    return new ShopifyClient(
      cleanStoreName,
      accessToken,
      apiVersion
    );
  } catch (error) {
    logger.error('Failed to create Shopify client:', error);
    throw error;
  }
};

export const validateShopifyConnection = async (client) => {
  try {
    logger.debug('Validating Shopify connection');
    const products = await client.getProducts();
    
    if (!Array.isArray(products)) {
      throw new Error('Invalid response from Shopify API');
    }
    
    logger.info('Successfully validated Shopify connection');
    return true;
  } catch (error) {
    logger.error('Shopify connection validation failed:', {
      error: error.message,
      details: error.response?.data || 'No additional details'
    });
    throw new Error(`Shopify connection failed: ${error.message}`);
  }
};

export default {
  createShopifyClient,
  validateShopifyConnection
};
