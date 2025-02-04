import express from 'express';
import { createShopifyClient, validateShopifyConnection } from '../services/shopify-service.js';
import logger from '../utils/logger.js';
import syncService from '../services/sync-service.js';

const router = express.Router();

router.post('/sync-products', async (req, res) => {
  try {
    console.log('Checking logger configuration'); // Temporary debug log
    logger.info('Starting product synchronization process');
    
    // Add debug level logging to ensure logger is working
    logger.debug('Logger is functioning');

    logger.info('Creating Shopify clients');
    const sourceClient = createShopifyClient('source');
    const receiverClient = createShopifyClient('receiver');
    logger.info('Shopify clients created successfully');

    logger.info('Validating Shopify connections');
    await validateShopifyConnection(sourceClient);
    await validateShopifyConnection(receiverClient);
    logger.info('Shopify connections validated successfully');

    logger.info('Beginning product sync');
    const result = await syncService.syncProducts();
    logger.info('Product sync completed successfully', { syncedProducts: result });

    res.json({ success: true, ...result });
  } catch (error) {
    logger.error('Sync error:', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: 'Failed to connect to one or both Shopify stores'
    });
  }
});

export default router;