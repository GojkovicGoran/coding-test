import request from 'supertest';
import express from 'express';
import syncRouter from '../../src/routers/sync-router.js';
import * as shopifyService from '../../src/services/shopify-service.js';
import syncService from '../../src/services/sync-service.js';

describe('Sync Router Tests', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api', syncRouter);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should successfully sync products when everything works', async () => {
    // Mock shopify service functions
    jest.spyOn(shopifyService, 'createShopifyClient').mockImplementation(() => ({
      shop: { id: 'test-shop' }
    }));
    
    jest.spyOn(shopifyService, 'validateShopifyConnection').mockResolvedValue(true);
    
    // Mock sync service
    jest.spyOn(syncService, 'syncProducts').mockResolvedValue({
      totalSynced: 5,
      success: true
    });

    const response = await request(app)
      .post('/api/sync-products');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      totalSynced: 5
    });
  });

  it('should handle errors during sync process', async () => {
    // Mock failure in shopify connection validation
    jest.spyOn(shopifyService, 'createShopifyClient').mockImplementation(() => ({
      shop: { id: 'test-shop' }
    }));
    
    jest.spyOn(shopifyService, 'validateShopifyConnection')
      .mockRejectedValue(new Error('Connection failed'));

    const response = await request(app)
      .post('/api/sync-products');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      success: false,
      error: 'Failed to connect to one or both Shopify stores'
    });
  });
});