import logger from '../utils/logger.js';
import config from '../config/store-config.js';

export class SyncService {
  constructor(sourceStore, receiverStore) {
    if (!sourceStore?.getProducts) throw new Error('Source store client is required');
    if (!receiverStore?.getProducts) throw new Error('Receiver store client is required');

    this.sourceStore = sourceStore;
    this.receiverStore = receiverStore;
    
    // Add defaults in case config.app is undefined
    const defaultConfig = {
      batchSize: 50,
      rateLimitDelay: 500,
      maxFailures: 10
    };

    this.batchSize = config.app?.batchSize || defaultConfig.batchSize;
    this.rateLimitDelay = config.app?.rateLimitDelay || defaultConfig.rateLimitDelay;
    this.maxFailures = config.app?.maxFailures || defaultConfig.maxFailures;

    logger.debug('SyncService initialized with config:', {
      batchSize: this.batchSize,
      rateLimitDelay: this.rateLimitDelay,
      maxFailures: this.maxFailures
    });
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async syncProducts() {
    try {
      logger.info('Starting products synchronization');

      let sourceProducts, receiverProducts;
      try {
        [sourceProducts, receiverProducts] = await Promise.all([
          this.sourceStore.getProducts(),
          this.receiverStore.getProducts()
        ]);
      } catch (error) {
        throw new Error(`Failed to create store client: ${error.message}`);
      }

      if (!Array.isArray(sourceProducts) || !Array.isArray(receiverProducts)) {
        throw new Error('Invalid response format from API');
      }

      logger.info(`Retrieved ${sourceProducts.length} source products and ${receiverProducts.length} receiver products`);

      // Create lookup maps for both source and receiver products
      const receiverProductMap = new Map();
      const sourceProductMap = new Map();

      sourceProducts.forEach(product => {
        const sku = product.variants?.[0]?.sku;
        if (sku) {
          // Add timestamp if not present
          product.lastUpdated = product.lastUpdated || new Date().toISOString();
          sourceProductMap.set(sku, product);
        }
      });

      receiverProducts.forEach(product => {
        const sku = product.variants?.[0]?.sku;
        if (sku) {
          receiverProductMap.set(sku, product);
        }
      });

      const stats = {
        processed: 0,
        created: 0,
        updated: 0,
        failed: 0,
        skipped: 0,
        unchanged: 0
      };

      // Process products
      for (const [sku, sourceProduct] of sourceProductMap) {
        const receiverProduct = receiverProductMap.get(sku);

        try {
          if (receiverProduct) {
            // Check if source product is newer
            const hasChanges = this.hasProductChanges(sourceProduct, receiverProduct);
            if (hasChanges) {
              await this.updateProduct(sourceProduct, receiverProduct, sku);
              stats.updated++;
            } else {
              stats.unchanged++;
            }
          } else {
            await this.createProduct(sourceProduct, sku);
            stats.created++;
          }

          stats.processed++;

          if (stats.processed % this.batchSize === 0) {
            logger.info(`Processed ${stats.processed} products, pausing...`);
            await this.sleep(this.rateLimitDelay);
          }

        } catch (error) {
          stats.failed++;
          logger.error('Failed to process product', {
            sku,
            error: error.message
          });

          if (stats.failed >= this.maxFailures) {
            throw new Error(`Too many failures (${stats.failed}), aborting sync`);
          }
        }
      }

      logger.info('Sync completed', { stats });
      return {
        success: true,
        ...stats
      };

    } catch (error) {
      logger.error('Sync failed', { error: error.message });
      throw error;
    }
  }

  hasProductChanges(sourceProduct, receiverProduct) {
    // Compare lastUpdated timestamps if available
    if (sourceProduct.lastUpdated && receiverProduct.lastUpdated) {
      return new Date(sourceProduct.lastUpdated) > new Date(receiverProduct.lastUpdated);
    }

    // Fall back to comparing actual content
    return this.compareProductContent(sourceProduct, receiverProduct);
  }

  compareProductContent(source, receiver) {
    const fieldsToCompare = ['title', 'description', 'price', 'vendor', 'product_type'];
    return fieldsToCompare.some(field => JSON.stringify(source[field]) !== JSON.stringify(receiver[field])) ||
           this.compareVariants(source.variants, receiver.variants);
  }

  compareVariants(sourceVariants = [], receiverVariants = []) {
    if (sourceVariants.length !== receiverVariants.length) return true;
    return sourceVariants.some((sourceVariant, index) => {
      const receiverVariant = receiverVariants[index];
      const variantFields = ['sku', 'price', 'compare_at_price', 'inventory_quantity'];
      return variantFields.some(field =>
        JSON.stringify(sourceVariant[field]) !== JSON.stringify(receiverVariant[field])
      );
    });
  }
}

export const createSyncService = (sourceStore, receiverStore) => {
  return new SyncService(sourceStore, receiverStore);
};

export default {
  SyncService,
  createSyncService
};