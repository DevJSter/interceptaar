import { Request, Response } from 'express';
import { createResponse } from '../utils/helpers';

export const getHealth = (req: Request, res: Response): void => {
  const healthData = {
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage(),
    version: process.version
  };

  res.json(createResponse(true, 'Server is healthy', healthData));
};

export const getHome = (req: Request, res: Response): void => {
  const welcomeData = {
    message: 'AI-Powered Blockchain Transaction Server',
    description: 'Express.js server with Ollama AI integration and automatic transaction signing',
    version: '2.0.0',
    services: {
      ollama: 'http://localhost:11434',
      anvil: 'http://localhost:8545'
    },
    endpoints: {
      health: [
        'GET /health - Server health check',
        'GET /api/ai/health - Ollama AI health check',
        'GET /api/blockchain/health - Blockchain connection health'
      ],
      ai: [
        'POST /api/ai/generate - Generate AI response',
        'GET /api/ai/models - List available AI models'
      ],
      blockchain: [
        'GET /api/blockchain/wallet - Get wallet information',
        'POST /api/blockchain/send - Send transaction',
        'POST /api/blockchain/estimate - Estimate gas for transaction',
        'GET /api/blockchain/history - Get transaction history',
        'POST /api/blockchain/ai-analyze - AI analyze and auto-sign transaction'
      ]
    },
    timestamp: new Date().toISOString()
  };

  res.json(createResponse(true, 'API Information', welcomeData));
};
