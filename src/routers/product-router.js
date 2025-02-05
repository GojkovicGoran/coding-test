import express from 'express';
import ProductService from '../services/product-service.js';
import ShopifyClient from '../clients/shopify-client.js';

const router = express.Router();
const shopifyClient = new ShopifyClient(
  process.env.SHOPIFY_STORE_NAME,
  process.env.SHOPIFY_ACCESS_TOKEN
);
const productService = new ProductService(shopifyClient);

router.get('/products', async (req, res) => {
  try {
    const products = await productService.getAllProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.post('/products', async (req, res) => {
  try {
    const newProduct = await productService.createProduct(req.body);
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

export default router;