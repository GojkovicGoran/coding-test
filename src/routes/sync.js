import express from 'express';
import ShopifyClient from '../clients/shopify-client.js'; // Use .js extension
import SyncService from '../services/sync-service.js'; // Use .js extension

const router = express.Router();

const pimClient = new ShopifyClient(
  'backend-test-pim',
  process.env.PIM_ACCESS_TOKEN
);

const receiverClient = new ShopifyClient(
  'bl-backend-test',
  process.env.RECEIVER_ACCESS_TOKEN
);

const syncService = new SyncService(pimClient, receiverClient);

router.post('/sync-products', async (req, res) => {
  try {
    await syncService.sync();
    res.json({ success: true, message: 'Products synchronized successfully' });
  } catch (error) {
    console.error('Sync failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router; // Use export default instead of module.exports