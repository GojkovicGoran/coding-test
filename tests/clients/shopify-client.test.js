import axios from 'axios';
import ShopifyClient from '../../src/clients/shopify-client';

jest.mock('axios');

describe('ShopifyClient', () => {
  let client;
  const storeName = 'test-store';
  const accessToken = 'test-token';
  const baseUrl = `https://${storeName}.myshopify.com/admin/api/2023-01`;

  beforeEach(() => {
    client = new ShopifyClient(storeName, accessToken);
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct properties', () => {
      expect(client.storeName).toBe(storeName);
      expect(client.accessToken).toBe(accessToken);
      expect(client.apiVersion).toBe('2023-01');
    });
  });

  describe('getProducts', () => {
    it('should fetch all products', async () => {
      const mockProducts = [{ id: 1 }, { id: 2 }];
      axios.mockResolvedValueOnce({ data: { products: mockProducts } });

      const result = await client.getProducts();

      expect(axios).toHaveBeenCalledWith({
        method: 'GET',
        url: `${baseUrl}/products.json`,
        headers: { 'X-Shopify-Access-Token': accessToken },
        data: undefined
      });
      expect(result).toEqual(mockProducts);
    });
  });

  describe('getProduct', () => {
    it('should fetch a single product', async () => {
      const productId = '123';
      const mockProduct = { id: productId, title: 'Test Product' };
      axios.mockResolvedValueOnce({ data: { product: mockProduct } });

      const result = await client.getProduct(productId);

      expect(axios).toHaveBeenCalledWith({
        method: 'GET',
        url: `${baseUrl}/products/${productId}.json`,
        headers: { 'X-Shopify-Access-Token': accessToken },
        data: undefined
      });
      expect(result).toEqual(mockProduct);
    });
  });
});

