import { createShopifyClient, validateShopifyConnection } from '../services/shopify-service.js';
import { createPimClient, validatePimConnection } from '../services/pim-service.js';
import { createSyncService } from '../services/sync-service.js';
import logger from '../utils/logger.js';

export class SyncController {
  async syncProducts(req, res) {
    try {
      logger.info('Starting product synchronization process');

      // Initialize clients
      const [pimClient, shopifyClient] = await Promise.all([
        createPimClient(),
        createShopifyClient()
      ]);

      // Validate both connections
      await Promise.all([
        validatePimConnection(pimClient),
        validateShopifyConnection(shopifyClient)
      ]);

      // Create sync service with validated clients
      const syncService = createSyncService(pimClient, shopifyClient);

      // Perform sync
      const result = await syncService.syncProducts();
      
      return res.json({ success: true, ...result });
    } catch (error) {
      logger.error('Sync error:', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

export default new SyncController();
