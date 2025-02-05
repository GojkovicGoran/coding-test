import express from 'express';
import syncController from '../controllers/sync-controller.js';

const router = express.Router();

router.post('/sync-products', syncController.syncProducts);

export default router;