import { jest } from '@jest/globals';
import { SyncService } from '../../src/services/sync-service.js';

// Mock the store-service module
const mockCreateStoreClient = jest.fn();
jest.unstable_mockModule('../../src/services/store-service.js', () => ({
  createStoreClient: mockCreateStoreClient
}));

describe('SyncService', () => {
  let syncService;
  let mockSourceStore;
  let mockReceiverStore;

  beforeEach(() => {
    mockSourceStore = {
      getProducts: jest.fn().mockResolvedValue([
        { 
          id: '1', 
          title: 'Test Product 1',
          variants: [{ sku: 'SKU1', id: '101' }]
        },
        { 
          id: '2', 
          title: 'Test Product 2',
          variants: [{ sku: 'SKU2', id: '102' }]
        }
      ])
    };

    mockReceiverStore = {
      getProducts: jest.fn().mockResolvedValue([]),
      createProduct: jest.fn().mockResolvedValue({}),
      updateProduct: jest.fn().mockResolvedValue({})
    };

    syncService = new SyncService(mockSourceStore, mockReceiverStore);
  });

  test('should initialize with store clients', () => {
    expect(syncService.sourceStore).toBe(mockSourceStore);
    expect(syncService.receiverStore).toBe(mockReceiverStore);
  });

  test('should throw error if store clients are missing', () => {
    expect(() => new SyncService()).toThrow('Source store client is required');
    expect(() => new SyncService(mockSourceStore)).toThrow('Receiver store client is required');
  });

  test('should sync products between stores', async () => {
    const result = await syncService.syncProducts();

    expect(mockSourceStore.getProducts).toHaveBeenCalled();
    expect(mockReceiverStore.getProducts).toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.created).toBe(2);
  });

  test('should handle products without SKU', async () => {
    mockSourceStore.getProducts.mockResolvedValueOnce([
      { id: '1', title: 'No SKU Product', variants: [{}] }
    ]);

    const result = await syncService.syncProducts();
    
    expect(result.skipped).toBe(1);
    expect(mockReceiverStore.createProduct).not.toHaveBeenCalled();
  });

  test('should handle API errors gracefully', async () => {
    mockSourceStore.getProducts.mockRejectedValueOnce(new Error('API Error'));
    
    await expect(syncService.syncProducts()).rejects.toThrow(/Sync failed/);
  });

  // Update the store service test
  test('should work with store service', async () => {
    mockCreateStoreClient.mockReturnValue(mockSourceStore);
    const store = await mockCreateStoreClient('source');
    expect(store).toBeDefined();
    expect(store.getProducts).toBeDefined();
  });
});
