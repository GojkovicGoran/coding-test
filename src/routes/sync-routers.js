import express from 'express';
import { createShopifyClient, validateShopifyConnection } from '../services/shopify-service.js';
import logger from '../utils/logger.js';
import syncService from '../services/sync-service.js'; // Import syncService

const router = express.Router();

router.post('/sync-products', async (req, res) => {
  try {
    const sourceClient = createShopifyClient('source');
    const receiverClient = createShopifyClient('receiver');

    await validateShopifyConnection(sourceClient);
    await validateShopifyConnection(receiverClient);

    const result = await syncService.syncProducts(); // Use syncService
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