import axios from 'axios';

class ShopifyClient {
  constructor(storeName, accessToken) {
    this.apiVersion = '2023-01';  // Fixed version to match tests
    this.storeName = storeName;
    this.accessToken = accessToken;
  }

  async _makeRequest(method, endpoint, data = undefined) {  // Changed default to undefined
    const response = await axios({
      method,
      url: `https://${this.storeName}.myshopify.com/admin/api/${this.apiVersion}/${endpoint}`,
      headers: {
        'X-Shopify-Access-Token': this.accessToken,
      },
      data
    });

    return response.data;
  }

  async getProducts() {
    const response = await this._makeRequest('GET', 'products.json');
    return response.products;
  }

  async getProduct(productId) {
    const response = await this._makeRequest('GET', `products/${productId}.json`);
    return response.product;
  }
}

export default ShopifyClient;

