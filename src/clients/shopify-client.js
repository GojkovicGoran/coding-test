import axios from 'axios';

class ShopifyClient {
  constructor(storeName, accessToken) {
    this.baseUrl = `https://${storeName}.myshopify.com/admin/api/2023-01`;
    this.accessToken = accessToken;
  }

  async _paginatedGet(endpoint) {
    let results = [];
    let nextPage = null;

    do {
      const response = await axios.get(`${this.baseUrl}/${endpoint}`, {
        headers: { 'X-Shopify-Access-Token': this.accessToken },
        params: {
          limit: 250,
          ...(nextPage && { page_info: nextPage })
        }
      });

      results = results.concat(response.data.products);
      nextPage = response.headers.link?.match(/<([^>]+)>; rel="next"/)?.[1];
    } while (nextPage);

    return results;
  }

  async getProducts() {
    return this._paginatedGet('products.json');
  }

  async createProduct(productData) {
    const response = await axios.post(
      `${this.baseUrl}/products.json`,
      { product: productData },
      { headers: { 'X-Shopify-Access-Token': this.accessToken } }
    );
    return response.data.product;
  }

  async updateProduct(productId, productData) {
    await axios.put(
      `${this.baseUrl}/products/${productId}.json`,
      { product: productData },
      { headers: { 'X-Shopify-Access-Token': this.accessToken } }
    );
  }
}

export default ShopifyClient; // Use export default instead of module.exports