import logger from '../utils/logger.js';

export class SyncService {
  constructor(pimClient, shopifyClient) {
    this.pimClient = pimClient;
    this.shopifyClient = shopifyClient;
    this.batchSize = 50; // Shopify recommended batch size
    this.rateLimitDelay = 500; // 500ms delay between operations
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async syncProducts() {
    logger.info('Starting product synchronization');
    try {
      const [pimProducts, shopifyProducts] = await Promise.all([
        this.pimClient.getProducts(),
        this.shopifyClient.getProducts()
      ]).catch(error => {
        logger.error('Failed to fetch products', { error: error.message });
        throw new Error('Failed to fetch products: ' + error.message);
      });

      if (!Array.isArray(pimProducts) || !Array.isArray(shopifyProducts)) {
        throw new Error('Invalid response format from API');
      }

      logger.info(`Retrieved ${pimProducts.length} PIM products and ${shopifyProducts.length} Shopify products`);

      const productMap = new Map(
        shopifyProducts.flatMap(p => 
          p.variants?.map(v => [v.sku, { id: p.id, ...p }]) || []
        )
      );

      let processed = 0;
      let failures = 0;

      for (const pimProduct of pimProducts) {
        const sku = pimProduct.variants?.[0]?.sku;
        if (!sku) {
          logger.warn('Skipping product without SKU', { product: pimProduct.title });
          continue;
        }

        try {
          if (productMap.has(sku)) {
            logger.info('Updating existing product', { sku, title: pimProduct.title });
            await this.shopifyClient.updateProduct(productMap.get(sku).id, pimProduct);
          } else {
            logger.info('Creating new product', { sku, title: pimProduct.title });
            await this.shopifyClient.createProduct(pimProduct);
          }
          processed++;

          // Rate limiting
          if (processed % this.batchSize === 0) {
            logger.info(`Processed ${processed} products, pausing for rate limit...`);
            await this.sleep(this.rateLimitDelay);
          }
        } catch (error) {
          failures++;
          logger.error('Error processing product', { 
            sku, 
            title: pimProduct.title, 
            error: error.message 
          });
          
          if (failures > 10) {
            throw new Error('Too many failures, aborting sync');
          }
          
          await this.sleep(this.rateLimitDelay * 2); // Extra delay on error
          continue; // Skip to next product instead of stopping
        }
      }

      logger.info('Product synchronization completed', {
        processed,
        failures,
        total: pimProducts.length
      });
      
      return {
        processed,
        failures,
        total: pimProducts.length
      };
    } catch (error) {
      logger.error('Product synchronization failed', { error: error.message });
      throw error;
    }
  }
}

const syncProducts = async () => {
  try {
    // Implement the logic to sync products between source and receiver stores
    // ...

    return { message: 'Products synced successfully' };
  } catch (error) {
    logger.error('Error syncing products:', error);
    throw error;
  }
};

export default {
  syncProducts,
};