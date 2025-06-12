import express from 'express';
import cors from 'cors';
import config from './utils/config';
import aiRewardRoutes from './routes/aiRewardRoutes';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes - Only AI Rewards for token transfer testing
app.use('/api/ai-rewards', aiRewardRoutes);

// Blockchain routes for QTO functions
app.get('/api/blockchain/qto-balance/:address', async (req, res) => {
  try {
    const { blockchainService } = await import('./services/blockchainService');
    const balance = await blockchainService.getQtoBalance(req.params.address);
    res.json({ success: true, data: { balance } });
  } catch (error: any) {
    console.error('QTO balance error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/blockchain/contract-qto-balance', async (req, res) => {
  try {
    const { blockchainService } = await import('./services/blockchainService');
    const balance = await blockchainService.getContractQtoBalance();
    res.json({ success: true, data: { balance } });
  } catch (error: any) {
    console.error('Contract QTO balance error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      ai: 'available',
      blockchain: 'connected',
      rewards: 'operational'
    }
  });
});

// Start server
const PORT = config.port || 3000;

app.listen(PORT, () => {
  console.log('🚀 RPC Interceptor Server Started');
  console.log(`📍 Listening on: http://localhost:${PORT}`);
  console.log(`🔗 Target RPC: ${config.targetRpcUrl}`);
  console.log(`🤖 AI Service: ${config.ollamaUrl} (${config.ollamaModel})`);
  console.log(`🛡️  AI Validation: ${config.aiValidationEnabled ? 'Enabled' : 'Disabled'}`);
  console.log(`⚡ Auto Approve: ${config.autoApprove.enabled ? 'Enabled' : 'Disabled'}`);
  console.log('');
  console.log('Ready to intercept RPC calls! 🛡️');
});

export default app;
