import axios from 'axios';
import ShopifyClient from '../../src/clients/shopify-client';

jest.mock('axios');

describe('ShopifyClient', () => {
  let client;
  const storeName = 'test-store';
  const accessToken = 'test-token';

  beforeEach(() => {
    client = new ShopifyClient(storeName, accessToken);
  });

  describe('_makeRequest', () => {
    it('should make a GET request and return data', async () => {
      const responseData = { products: [] };
      axios.mockResolvedValue({ data: responseData });

      const data = await client._makeRequest('GET', 'products.json');

      expect(axios).toHaveBeenCalledWith({
        method: 'GET',
        url: `https://${storeName}.myshopify.com/admin/api/2023-01/products.json`,
        headers: { 'X-Shopify-Access-Token': accessToken },
        data: undefined
      });
      expect(data).toEqual(responseData);
    });

    it('should make a POST request with data and return response data', async () => {
      const product = { title: 'Test Product' };
      const responseData = { product };
      axios.mockResolvedValue({ data: responseData });

      const data = await client._makeRequest('POST', 'products.json', { product });

      expect(axios).toHaveBeenCalledWith({
        method: 'POST',
        url: `https://${storeName}.myshopify.com/admin/api/2023-01/products.json`,
        headers: { 'X-Shopify-Access-Token': accessToken },
        data: { product }
      });
      expect(data).toEqual(responseData);
    });

    it('should make a PUT request with data and return response data', async () => {
      const product = { title: 'Updated Product' };
      const responseData = { product };
      axios.mockResolvedValue({ data: responseData });

      const data = await client._makeRequest('PUT', 'products/123.json', { product });

      expect(axios).toHaveBeenCalledWith({
        method: 'PUT',
        url: `https://${storeName}.myshopify.com/admin/api/2023-01/products/123.json`,
        headers: { 'X-Shopify-Access-Token': accessToken },
        data: { product }
      });
      expect(data).toEqual(responseData);
    });
  });
});