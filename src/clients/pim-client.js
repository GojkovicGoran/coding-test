import axios from 'axios';
import logger from '../utils/logger.js';

class PimClient {
  constructor(baseUrl, apiKey) {
    if (!baseUrl) throw new Error('PIM baseUrl is required');
    if (!apiKey) throw new Error('PIM apiKey is required');
    
    this.baseUrl = baseUrl.replace(/\/+$/, ''); // Remove trailing slashes
    this.apiKey = apiKey;
  }

  async _makeRequest(method, endpoint, data = null) {
    try {
      logger.debug('Making PIM API request', { 
        method, 
        endpoint,
        url: `${this.baseUrl}/${endpoint}`
      });

      const response = await axios({
        method,
        url: `${this.baseUrl}/${endpoint}`.replace(/\/+/g, '/'),
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        data,
        validateStatus: status => status < 500
      });

      if (response.status >= 400) {
        throw new Error(`PIM API error: ${response.status} - ${response.statusText}`);
      }

      if (!response.data) {
        throw new Error('PIM API returned empty response');
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message;
        logger.error('PIM API request failed', {
          endpoint,
          status: error.response?.status,
          error: errorMessage,
          url: error.config?.url
        });
        throw new Error(`PIM API request failed: ${errorMessage}`);
      }
      throw error;
    }
  }

  async getProducts() {
    try {
      const response = await this._makeRequest('GET', 'products');
      if (!response || !Array.isArray(response.data)) {
        throw new Error('Invalid response format from PIM API');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch products from PIM', { error: error.message });
      throw error;
    }
  }

  async getProduct(productId) {
    const response = await this._makeRequest('GET', `products/${productId}`);
    return response.data;
  }
}

export default PimClient;
