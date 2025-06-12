import { Router } from 'express';
import aiRoutes from './aiRoutes';
import blockchainRoutes from './blockchainRoutes';

const router = Router();

// API routes
router.use('/ai', aiRoutes);
router.use('/blockchain', blockchainRoutes);

export default router;
