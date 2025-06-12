import { Router } from 'express';
import {
  getWalletInfo,
  sendTransaction,
  estimateGas,
  getTransactionHistory,
  aiAnalyzeAndSend,
  checkBlockchainHealth
} from '../controllers/blockchainController';
import { 
  validateTransactionRequest, 
  validateAITransactionRequest 
} from '../middlewares/aiValidation';

const router = Router();

// GET /api/blockchain/wallet - Get wallet information
router.get('/wallet', getWalletInfo);

// POST /api/blockchain/send - Send transaction
router.post('/send', validateTransactionRequest, sendTransaction);

// POST /api/blockchain/estimate - Estimate gas for transaction
router.post('/estimate', validateTransactionRequest, estimateGas);

// GET /api/blockchain/history - Get transaction history
router.get('/history', getTransactionHistory);

// POST /api/blockchain/ai-analyze - AI analyze and auto-sign transaction
router.post('/ai-analyze', validateAITransactionRequest, aiAnalyzeAndSend);

// GET /api/blockchain/health - Check blockchain connection health
router.get('/health', checkBlockchainHealth);

export default router;
