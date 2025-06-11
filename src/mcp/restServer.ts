import express from 'express';
import cors from 'cors';
import { blockchainService } from '../services/blockchainService';

const mcpApp = express();
mcpApp.use(cors());
mcpApp.use(express.json());

/**
 * Simplified MCP-like server for community interactions
 * This provides REST endpoints that could be wrapped in MCP protocol
 */

// Get user profile
mcpApp.get('/user/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const profile = await blockchainService.getUserProfile(address);
    
    if (!profile) {
      return res.status(404).json({
        error: 'User not found',
        address
      });
    }

    const trustLevel = blockchainService.calculateTrustLevel(profile.trustScore);
    
    res.json({
      address,
      profile,
      trustLevel,
      isRegistered: true
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch user profile',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Register user
mcpApp.post('/user/:address/register', async (req, res) => {
  try {
    const { address } = req.params;
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({
        error: 'Username is required'
      });
    }

    const success = await blockchainService.registerUser(address, username);
    
    if (success) {
      res.json({
        success: true,
        message: `User ${username} registered successfully`,
        address
      });
    } else {
      res.status(500).json({
        error: 'Failed to register user'
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Registration failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update interaction
mcpApp.post('/user/:address/interaction', async (req, res) => {
  try {
    const { address } = req.params;
    const { type, value = 1 } = req.body;
    
    const validTypes = ['like', 'comment', 'post', 'helpful_response'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Invalid interaction type',
        validTypes
      });
    }

    const success = await blockchainService.updateInteraction(address, {
      type,
      value,
      timestamp: new Date()
    });
    
    if (success) {
      const updatedProfile = await blockchainService.getUserProfile(address);
      res.json({
        success: true,
        message: `${type} interaction recorded`,
        updatedProfile
      });
    } else {
      res.status(500).json({
        error: 'Failed to update interaction'
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Interaction update failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Report user
mcpApp.post('/user/:address/report', async (req, res) => {
  try {
    const { address } = req.params;
    const { reporterAddress, reason } = req.body;
    
    if (!reporterAddress || !reason) {
      return res.status(400).json({
        error: 'Reporter address and reason are required'
      });
    }

    const success = await blockchainService.reportUser(reporterAddress, address, reason);
    
    if (success) {
      res.json({
        success: true,
        message: `User ${address} reported successfully`
      });
    } else {
      res.status(500).json({
        error: 'Failed to report user'
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Report failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get top users
mcpApp.get('/users/top/:limit?', async (req, res) => {
  try {
    const limit = parseInt(req.params.limit || '10');
    const topUsers = await blockchainService.getTopUsers(limit);
    
    // Get profiles for top users
    const profiles = await Promise.all(
      topUsers.map(async (address) => {
        const profile = await blockchainService.getUserProfile(address);
        return {
          address,
          profile,
          trustLevel: profile ? blockchainService.calculateTrustLevel(profile.trustScore) : 'low'
        };
      })
    );
    
    res.json({
      topUsers: profiles.filter(p => p.profile),
      count: profiles.filter(p => p.profile).length
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch top users',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Validate transaction
mcpApp.post('/validate', async (req, res) => {
  try {
    const { userAddress, transactionData } = req.body;
    
    if (!userAddress || !transactionData) {
      return res.status(400).json({
        error: 'User address and transaction data are required'
      });
    }

    const validation = await blockchainService.validateTransactionWithCommunity(
      userAddress,
      transactionData
    );
    
    res.json({
      validation,
      recommendation: validation.isValid ? 'APPROVE' : 'REJECT',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Validation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Health check
mcpApp.get('/health', async (req, res) => {
  try {
    const networkInfo = await blockchainService.getNetworkInfo();
    res.json({
      status: 'healthy',
      network: networkInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Info endpoint
mcpApp.get('/', (req, res) => {
  res.json({
    name: 'Community Interaction Rating MCP Server',
    description: 'REST API for community-based blockchain transaction validation',
    version: '1.0.0',
    endpoints: {
      'GET /user/:address': 'Get user profile',
      'POST /user/:address/register': 'Register user',
      'POST /user/:address/interaction': 'Update user interaction',
      'POST /user/:address/report': 'Report user',
      'GET /users/top/:limit': 'Get top users',
      'POST /validate': 'Validate transaction',
      'GET /health': 'Health check'
    }
  });
});

const MCP_PORT = parseInt(process.env.MCP_PORT || '3001', 10);

mcpApp.listen(MCP_PORT, () => {
  console.log(`🔗 Community MCP Server running on http://localhost:${MCP_PORT}`);
});

export default mcpApp;
