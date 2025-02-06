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

      const [sourceProducts, receiverProducts] = await Promise.all([
        this.sourceStore.getProducts(),
        this.receiverStore.getProducts()
      ]);

      if (!Array.isArray(sourceProducts) || !Array.isArray(receiverProducts)) {
        throw new Error('Invalid response format from API');
      }

      logger.info(`Retrieved ${sourceProducts.length} source products and ${receiverProducts.length} receiver products`);

      // Create lookup map for existing receiver products
      const receiverProductMap = new Map();
      receiverProducts.forEach(product => {
        const variant = product.variants?.[0];
        if (variant?.sku) {
          receiverProductMap.set(variant.sku, product);
        }
      });

      const stats = {
        processed: 0,
        created: 0,
        updated: 0,
        failed: 0,
        skipped: 0
      };

      // Process each source product
      for (const sourceProduct of sourceProducts) {
        try {
          await this.processProduct(sourceProduct, receiverProductMap, stats);

          if (stats.processed % this.batchSize === 0) {
            logger.info(`Processed ${stats.processed} products, pausing...`);
            await this.sleep(this.rateLimitDelay);
          }

        } catch (error) {
          stats.failed++;
          logger.error('Failed to process product', {
            title: sourceProduct.title,
            sku: sourceProduct.variants?.[0]?.sku,
            error: error.message
          });

          if (stats.failed >= this.maxFailures) {
            throw new Error(`Too many failures (${stats.failed}), aborting sync`);
          }

          await this.sleep(this.rateLimitDelay * 2);
        }
      }

      logger.info('Sync completed', { stats });
      return {
        success: true,
        ...stats,
        total: sourceProducts.length
      };

    } catch (error) {
      logger.error('Sync failed', { error: error.message });
      throw new Error(`Sync failed: ${error.message}`);
    }
  }

  async processProduct(sourceProduct, receiverProductMap, stats) {
    const sku = sourceProduct.variants?.[0]?.sku;
    if (!sku) {
      logger.warn('Skipping product without SKU', { 
        title: sourceProduct.title,
        details: 'Product is missing SKU in first variant'
      });
      stats.skipped++;
      return;
    }

    const existingProduct = receiverProductMap.get(sku);
    
    try {
      // Validate IDs before processing
      if (existingProduct) {
        if (!this.validateProductIds(existingProduct)) {
          logger.warn('Skipping product with invalid IDs', {
            sku,
            title: sourceProduct.title,
            productId: existingProduct.id
          });
          stats.skipped++;
          return;
        }
      }

      if (existingProduct) {
        await this.updateProduct(sourceProduct, existingProduct, sku);
        stats.updated++;
      } else {
        await this.createProduct(sourceProduct, sku);
        stats.created++;
      }
      stats.processed++;
    } catch (error) {
      const errorContext = {
        sku,
        title: sourceProduct.title,
        operation: existingProduct ? 'update' : 'create',
        errorDetails: error.details || error.message
      };
      
      if (error.message?.includes('expected String to be a id')) {
        logger.error('Invalid ID format in product data', errorContext);
        stats.skipped++;
        return;
      }

      logger.error('Failed to process product', errorContext);
      throw error;
    }
  }

  validateProductIds(product) {
    // Ensure product ID is a valid string number
    if (!product.id || !/^\d+$/.test(String(product.id))) {
      return false;
    }

    // Validate variant IDs if present
    if (product.variants) {
      return product.variants.every(variant => 
        variant.id && /^\d+$/.test(String(variant.id))
      );
    }

    return true;
  }

  async updateProduct(sourceProduct, receiverProduct, sku) {
    logger.info(`Updating product with SKU: ${sku}`);

    try {
      // Ensure IDs are strings
      sourceProduct.id = String(receiverProduct.id);

      const minLength = Math.min(
        sourceProduct.variants?.length || 0,
        receiverProduct.variants?.length || 0
      );

      // Ensure variant IDs are strings
      sourceProduct.variants = (sourceProduct.variants || []).map((variant, i) => ({
        ...variant,
        id: i < minLength ? String(receiverProduct.variants[i].id) : undefined
      }));

      await this.receiverStore.updateProduct(sourceProduct, sourceProduct.id);
    } catch (error) {
      throw new Error(`Failed to update product ${sku}: ${error.message}`);
    }
  }

  async createProduct(sourceProduct, sku) {
    logger.info(`Creating new product with SKU: ${sku}`);

    // Remove existing IDs
    const newProduct = {
      ...sourceProduct,
      id: undefined,
      variants: sourceProduct.variants.map(variant => ({
        ...variant,
        id: undefined
      }))
    };

    await this.receiverStore.createProduct(newProduct);
  }
}

export const createSyncService = (sourceStore, receiverStore) => {
  return new SyncService(sourceStore, receiverStore);
};

export default {
  SyncService,
  createSyncService
};
