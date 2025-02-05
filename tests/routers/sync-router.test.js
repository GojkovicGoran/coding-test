import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import syncRouter from '../routers/sync-router.js';
import { SYNC_ERRORS } from '../constants/errorMessages.js';

// Mock dependencies
jest.mock('../controllers/sync-controller.js', () => ({
  __esModule: true,
  default: {
    syncProducts: jest.fn()
  }
}));

jest.mock('../utils/logger.js', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

import syncController from '../controllers/sync-controller.js';

describe('Sync Router', () => {
  let app;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup express app for testing
    app = express();
    app.use(express.json());
    app.use('/api', syncRouter);
  });

  describe('POST /api/sync-products', () => {
    it('should return 200 and success response when sync is successful', async () => {
      // Mock successful sync
      const mockResult = {
        processed: 10,
        failures: 0,
        total: 10
      };
      
      syncController.syncProducts.mockImplementation((req, res) => {
        res.json({ success: true, ...mockResult });
      });

      const response = await request(app)
        .post('/api/sync-products')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        ...mockResult
      });
      expect(syncController.syncProducts).toHaveBeenCalled();
    });

    it('should return 500 when sync fails', async () => {
      // Mock sync failure
      syncController.syncProducts.mockImplementation((req, res) => {
        res.status(500).json({
          success: false,
          error: SYNC_ERRORS.CONNECTION_FAILED
        });
      });

      const response = await request(app)
        .post('/api/sync-products')
        .send({});

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: SYNC_ERRORS.CONNECTION_FAILED
      });
      expect(syncController.syncProducts).toHaveBeenCalled();
    });
  });
});
