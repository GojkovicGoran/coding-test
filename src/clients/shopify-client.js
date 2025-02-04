import axios from 'axios';
import logger from '../utils/logger.js';


logger.debug('Shopify client initialized');
logger.info(`Making ${method} request to ${endpoint}`);
class ShopifyClient {
  constructor(storeName, accessToken) {
    this.apiVersion = '2024-01'; // Update to latest stable version
    this.baseUrl = `https://${storeName}.myshopify.com/admin/api/${this.apiVersion}`;
    this.accessToken = accessToken;
  }

  async _makeRequest(method, endpoint, data = null) {
    try {
      logger.info(`Making ${method} request to ${endpoint}`);

      const response = await axios({
        method,
        url: `${this.baseUrl}/${endpoint}`,
        headers: {
          'X-Shopify-Access-Token': this.accessToken,
          'Content-Type': 'application/json'
        },
        data
      });

      return response.data;
    } catch (error) {
      logger.error('Shopify API error', {
        method,
        endpoint,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });

      if (error.response?.status === 404) {
        throw new Error(`Shopify resource not found: ${endpoint}`);
      }

      throw new Error(
        error.response?.data?.errors ||
        error.message ||
        'Unknown Shopify API error'
      );
    }
  }

  async getProducts() {
    const response = await this._makeRequest('GET', 'products.json');
    return response.products || [];
  }

  async createProduct(product) {
    const response = await this._makeRequest('POST', 'products.json', { product });
    return response.product;
  }

  async updateProduct(id, product) {
    const response = await this._makeRequest('PUT', `products/${id}.json`, { product });
    return response.product;
  }

  // Validate connection
  async validateConnection() {
    try {
      await this._makeRequest('GET', 'shop.json');
      return true;
    } catch (error) {
      logger.error('Failed to validate Shopify connection', {
        error: error.message
      });
      return false;
    }
  }
}

export default ShopifyClient;

