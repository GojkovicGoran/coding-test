import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Mock the controller before importing the router
const mockSyncProducts = jest.fn();
jest.unstable_mockModule('../../src/controllers/sync-controller.js', () => ({
  default: {
    syncProducts: mockSyncProducts
  }
}));

// Import router after mocking dependencies
const { default: syncRouter } = await import('../../src/routers/sync-router.js');

describe('Sync Router', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api', syncRouter);
    jest.clearAllMocks();
  });

  test('POST /api/sync-products should call sync controller', async () => {
    mockSyncProducts.mockImplementation((req, res) => {
      res.json({ success: true, message: 'Sync completed' });
    });

    const response = await request(app)
      .post('/api/sync-products')
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(mockSyncProducts).toHaveBeenCalled();
  });

  test('should handle sync errors', async () => {
    mockSyncProducts.mockImplementation((req, res) => {
      res.status(500).json({ success: false, error: 'Sync failed' });
    });

    const response = await request(app)
      .post('/api/sync-products')
      .send({});

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(mockSyncProducts).toHaveBeenCalled();
  });
});
