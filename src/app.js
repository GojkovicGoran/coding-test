import express from 'express';
import dotenv from 'dotenv';
import syncRoutes from './routes/sync-routes.js';
import logger from './utils/logger.js';
import config from './config/index.js';

dotenv.config();

const app = express();

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API routes
app.use('/api', syncRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port}`);
});

export default app;
