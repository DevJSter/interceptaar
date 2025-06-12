import { Request, Response } from 'express';
import ollamaService from '../services/ollamaService';
import { createResponse } from '../utils/helpers';

export const generateAIResponse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, model, options } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json(
        createResponse(false, 'Prompt is required and must be a string')
      );
      return;
    }

    const response = await ollamaService.generateResponse(prompt, model, options);
    
    res.json(createResponse(true, 'AI response generated successfully', {
      prompt,
      response: response,
      model: model || 'llama3.2',
      stats: {
        message: 'Response generated successfully'
      }
    }));
  } catch (error: any) {
    res.status(500).json(
      createResponse(false, 'Failed to generate AI response', null, error.message)
    );
  }
};

export const listModels = async (req: Request, res: Response): Promise<void> => {
  try {
    const models = await ollamaService.listModels();
    
    res.json(createResponse(true, 'Models retrieved successfully', {
      models,
      defaultModel: 'llama3.2',
      count: models.length
    }));
  } catch (error: any) {
    res.status(500).json(
      createResponse(false, 'Failed to retrieve models', null, error.message)
    );
  }
};

export const healthCheck = async (req: Request, res: Response): Promise<void> => {
  try {
    const isHealthy = await ollamaService.checkHealth();
    
    if (isHealthy) {
      res.json(createResponse(true, 'Ollama service is healthy', {
        status: 'online',
        baseUrl: 'http://localhost:11434'
      }));
    } else {
      res.status(503).json(
        createResponse(false, 'Ollama service is not available')
      );
    }
  } catch (error: any) {
    res.status(503).json(
      createResponse(false, 'Failed to check Ollama health', null, error.message)
    );
  }
};
