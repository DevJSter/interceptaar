import { Router } from 'express';
import {
  generateAIResponse,
  listModels,
  healthCheck
} from '../controllers/aiController';
import { validateAIRequest } from '../middlewares/aiValidation';

const router = Router();

// POST /api/ai/generate - Generate AI response
router.post('/generate', validateAIRequest, generateAIResponse);

// GET /api/ai/models - List available models
router.get('/models', listModels);

// GET /api/ai/health - Health check for Ollama service
router.get('/health', healthCheck);

export default router;
