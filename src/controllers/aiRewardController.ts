// AI Reward Assessment Controller
import { Request, Response } from 'express';
import aiRewardService, { PostInteraction, AIRewardAssessment } from '../services/aiRewardService';
import { createResponse } from '../utils/helpers';

export const assessPostInteraction = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      postId,
      creatorAddress,
      interactorAddress,
      content,
      interactionType,
      interactionContent
    } = req.body;

    // Validate required fields
    if (!postId || !creatorAddress || !interactorAddress || !content || !interactionType) {
      res.status(400).json(
        createResponse(false, 'Missing required fields: postId, creatorAddress, interactorAddress, content, interactionType')
      );
      return;
    }

    const interaction: PostInteraction = {
      postId,
      creatorAddress,
      interactorAddress,
      content,
      interactionType,
      interactionContent,
      timestamp: Date.now()
    };

    // Get AI assessment
    const assessment = await aiRewardService.assessInteractionReward(interaction);

    res.json(createResponse(true, 'AI assessment completed', {
      assessment,
      execution: assessment.validationStatus === 'approved' ? 'reward_executed' : 'no_reward'
    }));

  } catch (error: any) {
    console.error('❌ AI assessment failed:', error);
    res.status(500).json(
      createResponse(false, 'AI assessment failed', null, error.message)
    );
  }
};

export const assessInteractionBatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { interactions } = req.body;

    if (!Array.isArray(interactions) || interactions.length === 0) {
      res.status(400).json(
        createResponse(false, 'interactions array is required and must not be empty')
      );
      return;
    }

    // Validate each interaction
    for (const interaction of interactions) {
      if (!interaction.postId || !interaction.creatorAddress || !interaction.interactorAddress || 
          !interaction.content || !interaction.interactionType) {
        res.status(400).json(
          createResponse(false, 'Each interaction must have: postId, creatorAddress, interactorAddress, content, interactionType')
        );
        return;
      }
    }

    // Add timestamps to interactions
    const timestampedInteractions = interactions.map(interaction => ({
      ...interaction,
      timestamp: Date.now()
    }));

    // Process batch with AI
    const assessments = await aiRewardService.processInteractionBatch(timestampedInteractions);

    const approvedCount = assessments.filter(a => a.validationStatus === 'approved').length;
    const totalQTO = assessments.reduce((sum, a) => sum + a.qtoAmount, 0);

    res.json(createResponse(true, 'Batch assessment completed', {
      assessments,
      summary: {
        total_interactions: assessments.length,
        approved_interactions: approvedCount,
        rejected_interactions: assessments.length - approvedCount,
        total_qto_allocated: totalQTO,
        approval_rate: (approvedCount / assessments.length * 100).toFixed(1) + '%'
      }
    }));

  } catch (error: any) {
    console.error('❌ Batch AI assessment failed:', error);
    res.status(500).json(
      createResponse(false, 'Batch AI assessment failed', null, error.message)
    );
  }
};

export const getPostAssessmentHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;

    if (!postId) {
      res.status(400).json(
        createResponse(false, 'postId parameter is required')
      );
      return;
    }

    const history = await aiRewardService.getPostAssessmentHistory(postId);

    res.json(createResponse(true, 'Assessment history retrieved', {
      postId,
      assessments: history,
      count: history.length
    }));

  } catch (error: any) {
    console.error('❌ Failed to get assessment history:', error);
    res.status(500).json(
      createResponse(false, 'Failed to get assessment history', null, error.message)
    );
  }
};

export const getUserRewardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userAddress } = req.params;

    if (!userAddress) {
      res.status(400).json(
        createResponse(false, 'userAddress parameter is required')
      );
      return;
    }

    const stats = await aiRewardService.getUserRewardStats(userAddress);

    res.json(createResponse(true, 'User reward statistics retrieved', {
      userAddress,
      stats
    }));

  } catch (error: any) {
    console.error('❌ Failed to get user reward stats:', error);
    res.status(500).json(
      createResponse(false, 'Failed to get user reward stats', null, error.message)
    );
  }
};

export const simulateAssessment = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      content,
      interactionType,
      interactionContent
    } = req.body;

    if (!content || !interactionType) {
      res.status(400).json(
        createResponse(false, 'content and interactionType are required for simulation')
      );
      return;
    }

    // Create mock interaction for simulation
    const mockInteraction: PostInteraction = {
      postId: 'simulation_' + Date.now(),
      creatorAddress: '0x1111111111111111111111111111111111111111',
      interactorAddress: '0x2222222222222222222222222222222222222222',
      content,
      interactionType,
      interactionContent,
      timestamp: Date.now()
    };

    // Get AI assessment (but don't execute on-chain)
    const assessment = await aiRewardService.assessInteractionReward(mockInteraction);

    res.json(createResponse(true, 'Assessment simulation completed', {
      assessment,
      note: 'This is a simulation - no rewards were executed on-chain'
    }));

  } catch (error: any) {
    console.error('❌ Assessment simulation failed:', error);
    res.status(500).json(
      createResponse(false, 'Assessment simulation failed', null, error.message)
    );
  }
};
