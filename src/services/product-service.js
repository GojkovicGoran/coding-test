class ProductService {
  constructor(shopifyClient) {
    this.shopifyClient = shopifyClient;
  }

  async getAllProducts() {
    try {
      return await this.shopifyClient.getProducts();
    } catch (error) {
      console.error('Error getting products:', error);
      throw error;
    }
  }

  async createProduct(productData) {
    try {
      return await this.shopifyClient.createProduct(productData);
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  async updateProduct(productId, productData) {
    try {
      return await this.shopifyClient.updateProduct(productId, productData);
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }
}

export default ProductService;