import logger from '../utils/logger.js';
import config from '../config/store-config.js';

export class SyncService {
  constructor(pimClient, shopifyClient) {
    if (!pimClient?.getProducts) throw new Error('PIM client is required');
    if (!shopifyClient?.getProducts) throw new Error('Shopify client is required');

    this.pimClient = pimClient;
    this.shopifyClient = shopifyClient;
    
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

      // Fix method calls to use correct methods from shopifyClient
      const pimProducts = await this.pimClient.getProducts();
      const shopifyProducts = await this.shopifyClient.getProducts();

      if (!Array.isArray(pimProducts) || !Array.isArray(shopifyProducts)) {
        throw new Error('Invalid response format from API');
      }

      logger.info(`Retrieved ${pimProducts.length} PIM products and ${shopifyProducts.length} Shopify products`);

      // Create lookup map for existing Shopify products
      const shopifyProductMap = new Map();
      shopifyProducts.forEach(product => {
        const variant = product.variants?.[0];
        if (variant?.sku) {
          shopifyProductMap.set(variant.sku, product);
        }
      });

      const stats = {
        processed: 0,
        created: 0,
        updated: 0,
        failed: 0,
        skipped: 0
      };

      // Process each PIM product
      for (const pimProduct of pimProducts) {
        try {
          const sku = pimProduct.variants?.[0]?.sku;
          if (!sku) {
            logger.warn('Skipping product without SKU', { title: pimProduct.title });
            stats.skipped++;
            continue;
          }

          const existingProduct = shopifyProductMap.get(sku);
          if (existingProduct) {
            await this.shopifyClient.updateProduct(existingProduct.id, pimProduct);
            stats.updated++;
          } else {
            await this.shopifyClient.createProduct(pimProduct);
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
            title: pimProduct.title,
            sku: pimProduct.variants?.[0]?.sku,
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
        total: pimProducts.length
      };

    } catch (error) {
      logger.error('Sync failed', { error: error.message });
      throw new Error(`Sync failed: ${error.message}`);
    }
  }

  async processProduct(pimProduct, shopifyProductMap, stats) {
    const sku = pimProduct.variants?.[0]?.sku;
    if (!sku) {
      logger.warn('Skipping product without SKU', { title: pimProduct.title });
      stats.skipped++;
      return;
    }

    const existingProduct = shopifyProductMap.get(sku);
    
    try {
      if (existingProduct) {
        await this.updateProduct(pimProduct, existingProduct);
        stats.updated++;
      } else {
        await this.createProduct(pimProduct);
        stats.created++;
      }
      stats.processed++;
    } catch (error) {
      throw new Error(`Failed to process product ${sku}: ${error.message}`);
    }
  }

  async updateProduct(pimProduct, receiverProduct, sku) {
    this.logger.info(`Updating product with SKU: ${sku}`);

    // Copy IDs from receiver product
    pimProduct.id = receiverProduct.id;

    const minLength = Math.min(
      pimProduct.variants.length,
      receiverProduct.variants.length
    );

    for (let i = 0; i < minLength; i++) {
      pimProduct.variants[i].id = receiverProduct.variants[i].id;
    }

    await this.shopifyClient.updateProduct(pimProduct, receiverProduct.id);
  }

  async createProduct(pimProduct, sku) {
    this.logger.info(`Creating new product with SKU: ${sku}`);

    // Remove existing IDs
    const newProduct = {
      ...pimProduct,
      id: undefined,
      variants: pimProduct.variants.map(variant => ({
        ...variant,
        id: undefined
      }))
    };

    await this.shopifyClient.createProduct(newProduct);
  }
}

export const createSyncService = (pimClient, shopifyClient) => {
  return new SyncService(pimClient, shopifyClient);
};

export default {
  SyncService,
  createSyncService
};
