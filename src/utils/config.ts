import { Config } from '../types';

const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  targetRpcUrl: process.env.TARGET_RPC_URL || 'http://localhost:8545',
  ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
  ollamaModel: process.env.OLLAMA_MODEL || 'llama3.2',
  aiValidationEnabled: process.env.AI_VALIDATION === 'false' ? false : true,
  communityValidationEnabled: process.env.COMMUNITY_VALIDATION === 'false' ? false : true,
  contractAddress: process.env.CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  privateKey: process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  autoApprove: {
    enabled: process.env.AUTO_APPROVE === 'true',
    lowRiskOnly: process.env.AUTO_APPROVE_LOW_RISK_ONLY !== 'false',
    highTrustUsersOnly: process.env.AUTO_APPROVE_HIGH_TRUST_ONLY !== 'false'
  }
};

export default config;
