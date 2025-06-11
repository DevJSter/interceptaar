import axios from 'axios';
import config from '../utils/config';
import { RPCRequest, AIValidationResult, CommunityProfile } from '../types';
import { isReadOnlyMethod, isHighRiskMethod, formatEther } from '../utils/helpers';
import { blockchainService } from './blockchainService';

export class AIValidationService {
  private baseUrl: string;
  private model: string;

  constructor() {
    this.baseUrl = config.ollamaUrl;
    this.model = config.ollamaModel;
  }

  async validateRPCCall(request: RPCRequest, userAddress?: string): Promise<AIValidationResult> {
    try {
      // Quick validation for read-only methods
      if (isReadOnlyMethod(request.method)) {
        return {
          isValid: true,
          riskLevel: 'LOW',
          reasoning: 'Read-only method, no state changes possible',
          shouldProceed: true
        };
      }

      // Get community data if user address is provided
      let communityProfile: CommunityProfile | null = null;
      if (userAddress && config.communityValidationEnabled) {
        try {
          communityProfile = await blockchainService.getUserProfile(userAddress);
        } catch (error) {
          console.warn('Failed to fetch community profile:', error);
        }
      }

      // Analyze with AI for complex methods
      const analysis = await this.analyzeWithAI(request, communityProfile);
      return analysis;
    } catch (error: any) {
      console.error('AI validation failed:', error.message);
      
      // Fallback validation without AI
      return this.fallbackValidation(request);
    }
  }

  private async analyzeWithAI(request: RPCRequest, communityProfile?: CommunityProfile | null): Promise<AIValidationResult> {
    const prompt = this.buildAnalysisPrompt(request, communityProfile);
    
    const response = await axios.post(`${this.baseUrl}/api/generate`, {
      model: this.model,
      prompt,
      stream: false,
      options: {
        temperature: 0.1, // Low temperature for consistent analysis
        top_p: 0.9
      }
    }, {
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' }
    });

    return this.parseAIResponse(response.data.response, request);
  }

  private buildAnalysisPrompt(request: RPCRequest, communityProfile?: CommunityProfile | null): string {
    const { method, params } = request;
    
    let contextInfo = '';
    if (method === 'eth_sendTransaction' && params[0]) {
      const tx = params[0];
      contextInfo = `
Transaction Details:
- To: ${tx.to || 'Contract Creation'}
- Value: ${tx.value ? formatEther(tx.value) + ' ETH' : '0 ETH'}
- Data: ${tx.data ? `${tx.data.slice(0, 20)}...` : 'None'}
- Gas: ${tx.gas || 'Auto'}
`;
    }

    let communityInfo = '';
    if (communityProfile) {
      communityInfo = `
Community Profile:
- Username: ${communityProfile.username}
- Trust Score: ${communityProfile.trustScore}
- Total Posts: ${communityProfile.totalPosts}
- Total Likes: ${communityProfile.totalLikes}
- Helpful Responses: ${communityProfile.totalHelpfulResponses}
- Reports Against User: ${communityProfile.reportCount}
- Account Status: ${communityProfile.isActive ? 'Active' : 'Inactive'}
`;
    }

    return `
You are a blockchain security analyst. Analyze this RPC call for security risks and validity.

RPC Method: ${method}
Parameters: ${JSON.stringify(params, null, 2)}
${contextInfo}
${communityInfo}

Please analyze:
1. Security risk level (LOW/MEDIUM/HIGH)
2. Whether this call should proceed (true/false)
3. Brief reasoning (max 100 words)
4. Community trust score impact (if applicable)

Respond in this exact format:
RISK_LEVEL: [LOW/MEDIUM/HIGH]
SHOULD_PROCEED: [true/false]
REASONING: [Your analysis here]
COMMUNITY_TRUST_SCORE: [0-1000 if community data available, otherwise omit]

Consider these factors:
- Transaction value and recipient
- Contract interactions
- Gas usage patterns
- Known attack vectors
- Method safety profile
- User's community trust score and history
- Previous reports and community standing
`;
  }

  private parseAIResponse(aiResponse: string, request: RPCRequest): AIValidationResult {
    try {
      const lines = aiResponse.split('\n').filter(line => line.trim());
      
      let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
      let shouldProceed = false;
      let reasoning = 'AI analysis completed';
      let communityTrustScore: number | undefined;

      for (const line of lines) {
        if (line.startsWith('RISK_LEVEL:')) {
          const level = line.split(':')[1].trim().toUpperCase();
          if (['LOW', 'MEDIUM', 'HIGH'].includes(level)) {
            riskLevel = level as 'LOW' | 'MEDIUM' | 'HIGH';
          }
        } else if (line.startsWith('SHOULD_PROCEED:')) {
          shouldProceed = line.split(':')[1].trim().toLowerCase() === 'true';
        } else if (line.startsWith('REASONING:')) {
          reasoning = line.split(':').slice(1).join(':').trim();
        } else if (line.startsWith('COMMUNITY_TRUST_SCORE:')) {
          const scoreStr = line.split(':')[1].trim();
          const score = parseInt(scoreStr);
          if (!isNaN(score)) {
            communityTrustScore = score;
          }
        }
      }

      return {
        isValid: shouldProceed,
        riskLevel,
        reasoning,
        communityTrustScore,
        shouldProceed
      };
    } catch (error) {
      return this.fallbackValidation(request);
    }
  }

  private fallbackValidation(request: RPCRequest): AIValidationResult {
    const isReadOnly = isReadOnlyMethod(request.method);
    const isHighRisk = isHighRiskMethod(request.method);

    if (isReadOnly) {
      return {
        isValid: true,
        riskLevel: 'LOW',
        reasoning: 'Read-only method - fallback validation',
        shouldProceed: true
      };
    }

    if (isHighRisk) {
      return {
        isValid: false,
        riskLevel: 'HIGH',
        reasoning: 'High-risk method blocked by fallback validation',
        shouldProceed: false
      };
    }

    return {
      isValid: true,
      riskLevel: 'MEDIUM',
      reasoning: 'Standard method - fallback validation',
      shouldProceed: true
    };
  }

  async checkHealth(): Promise<boolean> {
    try {
      await axios.get(`${this.baseUrl}/api/tags`, { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}

export default new AIValidationService();
