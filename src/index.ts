import express from 'express';
import cors from 'cors';
import config from './utils/config';
import { interceptRPCCall, getInterceptedCall, approveCall, getCallHistory } from './middlewares/rpcInterceptor';
import aiValidationService from './services/aiValidationService';
import rpcProxyService from './services/rpcProxyService';
import { blockchainService } from './services/blockchainService';
import { validationPipelineService } from './services/validationPipelineService';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  const aiHealthy = await aiValidationService.checkHealth();
  const rpcHealthy = await rpcProxyService.checkConnection();
  
  const status = aiHealthy && rpcHealthy ? 'healthy' : 'degraded';
  
  res.json({
    status,
    timestamp: new Date().toISOString(),
    services: {
      ai: {
        status: aiHealthy ? 'online' : 'offline',
        url: config.ollamaUrl,
        model: config.ollamaModel
      },
      rpc: {
        status: rpcHealthy ? 'online' : 'offline',
        url: config.targetRpcUrl
      }
    },
    config: {
      aiValidationEnabled: config.aiValidationEnabled,
      autoApprove: config.autoApprove
    }
  });
});

// Main RPC interceptor endpoint
app.post('/', interceptRPCCall);

// Manual approval endpoint
app.post('/api/approve/:callId', async (req: express.Request, res: express.Response): Promise<void> => {
  const { callId } = req.params;
  
  const call = getInterceptedCall(callId);
  if (!call) {
    res.status(404).json({
      error: 'Call not found',
      callId
    });
    return;
  }

  if (call.status !== 'pending') {
    res.status(400).json({
      error: 'Call is not pending approval',
      status: call.status,
      callId
    });
    return;
  }

  const response = await approveCall(callId);
  res.json({
    approved: true,
    callId,
    response
  });
});

// Get call details
app.get('/api/calls/:callId', (req: express.Request, res: express.Response): void => {
  const { callId } = req.params;
  const call = getInterceptedCall(callId);
  
  if (!call) {
    res.status(404).json({
      error: 'Call not found',
      callId
    });
    return;
  }

  res.json(call);
});

// Get call history
app.get('/api/calls', (req, res) => {
  const history = getCallHistory();
  res.json({
    calls: history,
    total: history.length
  });
});

// Server info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    name: 'RPC Interceptor',
    description: 'AI-powered RPC call validator and proxy',
    version: '1.0.0',
    config: {
      targetRpc: config.targetRpcUrl,
      aiModel: config.ollamaModel,
      aiValidationEnabled: config.aiValidationEnabled,
      autoApprove: config.autoApprove
    },
    endpoints: {
      main: 'POST / - Send RPC calls for validation and forwarding',
      health: 'GET /health - Check service health',
      approve: 'POST /api/approve/:callId - Manually approve pending call',
      callDetails: 'GET /api/calls/:callId - Get call details',
      callHistory: 'GET /api/calls - Get call history',
      info: 'GET /api/info - This endpoint'
    }
  });
});

// Community and Reward System Endpoints

// Get user profile
app.get('/api/community/profile/:address', async (req: express.Request, res: express.Response): Promise<void> => {
  const { address } = req.params;
  
  try {
    const profile = await blockchainService.getUserProfile(address);
    if (!profile) {
      res.status(404).json({
        error: 'User profile not found',
        address
      });
      return;
    }
    
    res.json({
      address,
      profile
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch user profile',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get user reward information
app.get('/api/rewards/info/:address', async (req: express.Request, res: express.Response): Promise<void> => {
  const { address } = req.params;
  
  try {
    const rewardInfo = await blockchainService.getRewardInfo(address);
    const userTier = await blockchainService.getUserTier(address);
    
    if (!rewardInfo) {
      res.status(404).json({
        error: 'User reward information not found',
        address
      });
      return;
    }
    
    res.json({
      address,
      rewards: rewardInfo,
      tier: userTier
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch reward information',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Claim rewards
app.post('/api/rewards/claim/:address', async (req: express.Request, res: express.Response): Promise<void> => {
  const { address } = req.params;
  
  try {
    const success = await blockchainService.claimRewards(address);
    
    if (!success) {
      res.status(400).json({
        error: 'Failed to claim rewards',
        address
      });
      return;
    }
    
    res.json({
      success: true,
      message: 'Rewards claimed successfully',
      address
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to claim rewards',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Award community reward
app.post('/api/rewards/award', async (req: express.Request, res: express.Response): Promise<void> => {
  const { address, amount, reason } = req.body;
  
  if (!address || !amount || !reason) {
    res.status(400).json({
      error: 'Missing required parameters',
      required: ['address', 'amount', 'reason']
    });
    return;
  }
  
  try {
    const success = await blockchainService.awardCommunityReward(address, amount, reason);
    
    if (!success) {
      res.status(400).json({
        error: 'Failed to award community reward',
        address,
        amount,
        reason
      });
      return;
    }
    
    res.json({
      success: true,
      message: 'Community reward awarded successfully',
      address,
      amount,
      reason
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to award community reward',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Register user
app.post('/api/community/register', async (req: express.Request, res: express.Response): Promise<void> => {
  const { address, username } = req.body;
  
  if (!address || !username) {
    res.status(400).json({
      error: 'Missing required parameters',
      required: ['address', 'username']
    });
    return;
  }
  
  try {
    const success = await blockchainService.registerUser(address, username);
    
    if (!success) {
      res.status(400).json({
        error: 'Failed to register user',
        address,
        username
      });
      return;
    }
    
    res.json({
      success: true,
      message: 'User registered successfully',
      address,
      username
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to register user',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get validation pipeline health
app.get('/api/validation/health', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const health = await validationPipelineService.checkHealth();
    res.json(health);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to check validation health',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get validation statistics
app.get('/api/validation/stats', async (req: express.Request, res: express.Response): Promise<void> => {
  const { range } = req.query;
  const timeRange = range as 'hour' | 'day' | 'week' || 'day';
  
  try {
    const stats = await validationPipelineService.getValidationStats(timeRange);
    res.json({
      timeRange,
      stats
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch validation statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get total rewards distributed
app.get('/api/rewards/total', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const total = await blockchainService.getTotalRewardsDistributed();
    res.json({
      totalRewardsDistributed: total
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch total rewards distributed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: 'Send RPC calls to POST / or check /api/info for available endpoints'
  });
});

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('💥 Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(config.port, () => {
  console.log('🚀 RPC Interceptor Server Started');
  console.log(`📍 Listening on: http://localhost:${config.port}`);
  console.log(`🔗 Target RPC: ${config.targetRpcUrl}`);
  console.log(`🤖 AI Service: ${config.ollamaUrl} (${config.ollamaModel})`);
  console.log(`🛡️  AI Validation: ${config.aiValidationEnabled ? 'Enabled' : 'Disabled'}`);
  console.log(`⚡ Auto Approve: ${config.autoApprove.enabled ? 'Enabled' : 'Disabled'}`);
  console.log('');
  console.log('Ready to intercept RPC calls! 🛡️');
});

export default app;
