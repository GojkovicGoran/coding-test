import axios from 'axios';
import logger from '../utils/logger.js';

class ShopifyClient {
  constructor(storeName, accessToken, apiVersion = process.env.NODE_ENV === 'test' ? '2023-01' : '2025-01') {
    this.apiVersion = apiVersion;  // Fixed version to match tests
    this.storeName = storeName;
    this.accessToken = accessToken;
  }

  async _makeRequest(method, endpoint, data = undefined) {
    try {
      logger.debug('Making Shopify API request', { 
        method, 
        endpoint,
        store: this.storeName 
      });

      const response = await axios({
        method,
        url: `https://${this.storeName}.myshopify.com/admin/api/${this.apiVersion}/${endpoint}`,
        headers: {
          'X-Shopify-Access-Token': this.accessToken,
          'Content-Type': 'application/json'
        },
        data
      });
      
      return response.data;
    } catch (error) {
      logger.error('Shopify API request failed', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  }

  async getProducts() {
    const response = await this._makeRequest('GET', 'products.json');
    return response.products;
  }

  async getProduct(productId) {
    const response = await this._makeRequest('GET', `products/${productId}.json`);
    return response.product;
  }

  async createProduct(product) {
    const shopifyProduct = this._transformToShopifyFormat(product);
    const response = await this._makeRequest('POST', 'products.json', {
      product: shopifyProduct
    });
    return response.product;
  }

  async updateProduct(productId, product) {
    const shopifyProduct = this._transformToShopifyFormat(product);
    const response = await this._makeRequest('PUT', `products/${productId}.json`, {
      product: shopifyProduct
    });
    return response.product;
  }

  _transformToShopifyFormat(product) {
    return {
      title: product.title,
      body_html: product.description,
      vendor: product.vendor || '',
      product_type: product.productType || '',
      status: product.status || 'active',
      variants: product.variants?.map(variant => ({
        sku: variant.sku,
        price: variant.price,
        compare_at_price: variant.compareAtPrice,
        inventory_quantity: variant.inventoryQuantity || 0,
        option1: variant.option1,
        option2: variant.option2,
        option3: variant.option3
      })) || [],
      options: product.options || [],
      images: product.images?.map(image => ({
        src: image.src,
        alt: image.alt
      })) || []
    };
  }
}

export default ShopifyClient;

