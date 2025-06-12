// AI Reward Assessment Routes
import { Router } from 'express';
import {
  assessPostInteraction,
  assessInteractionBatch,
  getPostAssessmentHistory,
  getUserRewardStats,
  simulateAssessment
} from '../controllers/aiRewardController';

const router = Router();

// POST /api/ai-rewards/assess - Assess single post interaction
router.post('/assess', assessPostInteraction);

// POST /api/ai-rewards/batch - Assess multiple interactions
router.post('/batch', assessInteractionBatch);

// POST /api/ai-rewards/simulate - Simulate assessment without execution
router.post('/simulate', simulateAssessment);

// GET /api/ai-rewards/post/:postId/history - Get assessment history for a post
router.get('/post/:postId/history', getPostAssessmentHistory);

// GET /api/ai-rewards/user/:userAddress/stats - Get user reward statistics
router.get('/user/:userAddress/stats', getUserRewardStats);

export default router;
