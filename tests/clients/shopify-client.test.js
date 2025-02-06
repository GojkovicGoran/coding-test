import { jest } from '@jest/globals';
import ShopifyClient from '../../src/clients/shopify-client.js';

describe('ShopifyClient', () => {
  let client;
  const mockConfig = {
    storeName: 'test-store',
    accessToken: 'test-token',
    apiVersion: '2024-01'
  };

  beforeEach(() => {
    client = new ShopifyClient(
      mockConfig.storeName,
      mockConfig.accessToken,
      mockConfig.apiVersion
    );
  });

  test('should be defined', () => {
    expect(client).toBeDefined();
  });

  test('should initialize with config', () => {
    expect(client.storeName).toBe(mockConfig.storeName);
    expect(client.accessToken).toBe(mockConfig.accessToken);
    expect(client.apiVersion).toBe(mockConfig.apiVersion);
  });

  test('should make API requests', async () => {
    // Mock axios
    const mockProducts = [{ id: 1, title: 'Test Product' }];
    client._makeRequest = jest.fn().mockResolvedValue({ products: mockProducts });

    const products = await client.getProducts();
    expect(Array.isArray(products)).toBe(true);
    expect(products).toEqual(mockProducts);
  });
});