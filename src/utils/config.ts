import { Config } from '../types';

const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  targetRpcUrl: process.env.TARGET_RPC_URL || 'http://localhost:8545',
  ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
  ollamaModel: process.env.OLLAMA_MODEL || 'llama3.2',
  aiValidationEnabled: process.env.AI_VALIDATION === 'false' ? false : true,
  autoApprove: {
    enabled: process.env.AUTO_APPROVE === 'true',
    lowRiskOnly: process.env.AUTO_APPROVE_LOW_RISK_ONLY !== 'false'
  }
};

export default config;
