import { createStoreClient, validateStoreConnection } from '../services/store-service.js';
import { createSyncService } from '../services/sync-service.js';
import logger from '../utils/logger.js';

export class SyncController {
  async syncProducts(req, res) {
    try {
      logger.info('Starting product synchronization process');

      // Initialize source and destination clients
      const sourceStore = createStoreClient('source');
      const destinationStore = createStoreClient('destination');

      // Validate both connections
      await Promise.all([
        validateStoreConnection(sourceStore, 'source'),
        validateStoreConnection(destinationStore, 'destination')
      ]);

      // Create sync service with validated clients
      const syncService = createSyncService(sourceStore, destinationStore);
      const result = await syncService.syncProducts();
      
      return res.json({ success: true, ...result });
    } catch (error) {
      logger.error('Sync error:', { error: error.message });
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

export default new SyncController();
