import express from 'express';
import agentRoutes from './agentRoutes.js';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    success: true,
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
router.use('/agents', agentRoutes);

export default router;
