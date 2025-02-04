class SyncService {
  constructor(pimClient, receiverClient) {
    this.pimClient = pimClient;
    this.receiverClient = receiverClient;
  }

  async _createProductMap(products) {
    const productMap = new Map();
    
    for (const product of products) {
      const sku = product?.variants?.[0]?.sku;
      if (sku) productMap.set(sku, product);
    }
    
    return productMap;
  }

  async sync() {
    const [pimProducts, receiverProducts] = await Promise.all([
      this.pimClient.getProducts(),
      this.receiverClient.getProducts()
    ]);

    const receiverMap = await this._createProductMap(receiverProducts);

    for (const pimProduct of pimProducts) {
      const sku = pimProduct?.variants?.[0]?.sku;
      if (!sku) continue;

      const receiverProduct = receiverMap.get(sku);
      
      if (receiverProduct) {
        await this.receiverClient.updateProduct(receiverProduct.id, pimProduct);
      } else {
        await this.receiverClient.createProduct(pimProduct);
      }
    }
  }
}

export default SyncService; // Use export default instead of module.exports