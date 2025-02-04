import { SyncService } from '../../src/services/sync-service';

describe('SyncService', () => {
  let pimClient;
  let shopifyClient;
  let syncService;

  beforeEach(() => {
    pimClient = {
      getProducts: jest.fn()
    };
    shopifyClient = {
      getProducts: jest.fn(),
      updateProduct: jest.fn(),
      createProduct: jest.fn()
    };
    syncService = new SyncService(pimClient, shopifyClient);
  });

  it('should update existing products and create new products', async () => {
    const pimProducts = [
      { id: 1, variants: [{ sku: 'sku1' }] },
      { id: 2, variants: [{ sku: 'sku2' }] }
    ];
    const shopifyProducts = [
      { id: 1, variants: [{ sku: 'sku1' }] }
    ];

    pimClient.getProducts.mockResolvedValue(pimProducts);
    shopifyClient.getProducts.mockResolvedValue(shopifyProducts);

    await syncService.syncProducts();

    expect(shopifyClient.updateProduct).toHaveBeenCalledWith(1, pimProducts[0]);
    expect(shopifyClient.createProduct).toHaveBeenCalledWith(pimProducts[1]);
  });

  it('should not update or create products if no variants are present', async () => {
    const pimProducts = [
      { id: 1, variants: [] },
      { id: 2, variants: [] }
    ];
    const shopifyProducts = [
      { id: 1, variants: [{ sku: 'sku1' }] }
    ];

    pimClient.getProducts.mockResolvedValue(pimProducts);
    shopifyClient.getProducts.mockResolvedValue(shopifyProducts);

    await syncService.syncProducts();

    expect(shopifyClient.updateProduct).not.toHaveBeenCalled();
    expect(shopifyClient.createProduct).not.toHaveBeenCalled();
  });

  it('should handle empty product lists', async () => {
    pimClient.getProducts.mockResolvedValue([]);
    shopifyClient.getProducts.mockResolvedValue([]);

    await syncService.syncProducts();

    expect(shopifyClient.updateProduct).not.toHaveBeenCalled();
    expect(shopifyClient.createProduct).not.toHaveBeenCalled();
  });
});