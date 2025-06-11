import axios from 'axios';
import config from '../utils/config';
import { blockchainService } from './blockchainService';

export interface QoneqtInteraction {
  userId: string;
  interactionType: QoneqtInteractionType;
  content: string;
  timestamp: number;
  metadata?: any;
}

export enum QoneqtInteractionType {
  LIKE = 0,
  COMMENT = 1,
  SHARE = 2,
  POST = 3,
  FOLLOW = 4,
  STORY_VIEW = 5,
  MESSAGE = 6,
  GROUP_JOIN = 7,
  EVENT_ATTEND = 8,
  MARKETPLACE_PURCHASE = 9
}

export interface AISignificanceResult {
  significance: number; // 0-1000 (0.000 to 1.000 scale)
  reasoning: string;
  factors: {
    contentQuality: number;
    userEngagement: number;
    communityImpact: number;
    authenticity: number;
    timeliness: number;
  };
  isGenuine: boolean;
}

export interface QtoRewardResult {
  success: boolean;
  qtoAwarded: string; // Amount in QTO (with decimals)
  significance: number;
  reasoning: string;
  transactionHash?: string;
  error?: string;
}

class QoneqtRewardService {
  private baseUrl: string;
  private model: string;

  constructor() {
    this.baseUrl = config.ollamaUrl;
    this.model = config.ollamaModel;
  }

  /**
   * Analyze interaction significance using AI
   */
  async analyzeInteractionSignificance(interaction: QoneqtInteraction): Promise<AISignificanceResult> {
    try {
      const prompt = this.buildSignificanceAnalysisPrompt(interaction);
      
      const response = await axios.post(`${this.baseUrl}/api/generate`, {
        model: this.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1, // Low temperature for consistent scoring
          top_p: 0.9,
          max_tokens: 500
        }
      });

      const analysis = response.data.response;
      return this.parseSignificanceResponse(analysis);
    } catch (error: any) {
      console.error('AI significance analysis failed:', error.message);
      
      // Fallback to basic scoring
      return this.fallbackSignificanceScoring(interaction);
    }
  }

  /**
   * Process QoneQt interaction and award QTO tokens
   */
  async processInteractionReward(
    userAddress: string,
    interaction: QoneqtInteraction
  ): Promise<QtoRewardResult> {
    try {
      // Analyze significance with AI
      const significanceResult = await this.analyzeInteractionSignificance(interaction);
      
      if (!significanceResult.isGenuine) {
        return {
          success: false,
          qtoAwarded: '0',
          significance: 0,
          reasoning: 'Interaction flagged as potentially inauthentic by AI',
          error: 'INAUTHENTIC_INTERACTION'
        };
      }

      // Process reward on blockchain
      const txHash = await blockchainService.processQoneqtInteraction(
        userAddress,
        interaction.interactionType,
        significanceResult.significance,
        JSON.stringify({
          content: interaction.content.substring(0, 100), // Limit metadata size
          factors: significanceResult.factors,
          timestamp: interaction.timestamp
        })
      );

      // Calculate expected QTO reward for display
      const estimatedReward = await blockchainService.estimateQtoReward(
        userAddress,
        interaction.interactionType,
        significanceResult.significance
      );

      return {
        success: true,
        qtoAwarded: this.formatQtoAmount(estimatedReward),
        significance: significanceResult.significance,
        reasoning: significanceResult.reasoning,
        transactionHash: txHash
      };
    } catch (error: any) {
      console.error('Failed to process interaction reward:', error.message);
      
      return {
        success: false,
        qtoAwarded: '0',
        significance: 0,
        reasoning: 'Failed to process reward',
        error: error.message
      };
    }
  }

  /**
   * Batch process multiple interactions
   */
  async batchProcessInteractions(
    interactions: Array<{ userAddress: string; interaction: QoneqtInteraction }>
  ): Promise<QtoRewardResult[]> {
    const results: QtoRewardResult[] = [];
    
    // Process in chunks to avoid overwhelming the AI service
    const chunkSize = 5;
    for (let i = 0; i < interactions.length; i += chunkSize) {
      const chunk = interactions.slice(i, i + chunkSize);
      const chunkPromises = chunk.map(({ userAddress, interaction }) =>
        this.processInteractionReward(userAddress, interaction)
      );
      
      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
      
      // Small delay between chunks
      if (i + chunkSize < interactions.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  /**
   * Get user's QTO statistics
   */
  async getUserQtoStats(userAddress: string) {
    try {
      return await blockchainService.getQtoRewardStats(userAddress);
    } catch (error: any) {
      console.error('Failed to get user QTO stats:', error.message);
      throw error;
    }
  }

  /**
   * Get global QTO statistics
   */
  async getGlobalQtoStats() {
    try {
      return await blockchainService.getGlobalQtoStats();
    } catch (error: any) {
      console.error('Failed to get global QTO stats:', error.message);
      throw error;
    }
  }

  /**
   * Build AI prompt for significance analysis
   */
  private buildSignificanceAnalysisPrompt(interaction: QoneqtInteraction): string {
    const interactionTypeName = QoneqtInteractionType[interaction.interactionType].toLowerCase();
    
    return `
Analyze the authenticity and significance of this qoneqt.com social media interaction:

INTERACTION DETAILS:
- Type: ${interactionTypeName}
- Content: "${interaction.content}"
- User ID: ${interaction.userId}
- Timestamp: ${new Date(interaction.timestamp).toISOString()}

ANALYSIS CRITERIA:
Rate each factor from 0-200 (where 200 = maximum score):

1. CONTENT QUALITY (0-200):
   - Originality and creativity
   - Grammar and readability
   - Value to community
   - Effort invested

2. USER ENGAGEMENT (0-200):
   - Likelihood to generate meaningful responses
   - Relevance to audience
   - Timing appropriateness

3. COMMUNITY IMPACT (0-200):
   - Positive contribution to platform
   - Educational or entertainment value
   - Building connections

4. AUTHENTICITY (0-200):
   - Natural human behavior patterns
   - Not spam/bot-like
   - Genuine sentiment
   - Account history consistency

5. TIMELINESS (0-200):
   - Relevance to current trends/events
   - Appropriate posting frequency
   - Response to community needs

REQUIRED OUTPUT FORMAT:
{
  "contentQuality": [0-200],
  "userEngagement": [0-200], 
  "communityImpact": [0-200],
  "authenticity": [0-200],
  "timeliness": [0-200],
  "overallSignificance": [0-1000],
  "isGenuine": [true/false],
  "reasoning": "Brief explanation of the scoring"
}

Calculate overallSignificance as the sum of all factors (max 1000).
Set isGenuine to false if authenticity < 100 or overall patterns suggest automation.
Focus especially on detecting bot behavior, spam, or artificially inflated engagement.
`;
  }

  /**
   * Parse AI response for significance scoring
   */
  private parseSignificanceResponse(response: string): AISignificanceResult {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        significance: Math.min(1000, Math.max(0, parsed.overallSignificance || 0)),
        reasoning: parsed.reasoning || 'AI analysis completed',
        factors: {
          contentQuality: Math.min(200, Math.max(0, parsed.contentQuality || 0)),
          userEngagement: Math.min(200, Math.max(0, parsed.userEngagement || 0)),
          communityImpact: Math.min(200, Math.max(0, parsed.communityImpact || 0)),
          authenticity: Math.min(200, Math.max(0, parsed.authenticity || 0)),
          timeliness: Math.min(200, Math.max(0, parsed.timeliness || 0))
        },
        isGenuine: parsed.isGenuine !== false && parsed.authenticity >= 100
      };
    } catch (error) {
      console.error('Failed to parse AI significance response:', error);
      return this.fallbackSignificanceScoring({ interactionType: 0 } as QoneqtInteraction);
    }
  }

  /**
   * Fallback scoring when AI is unavailable
   */
  private fallbackSignificanceScoring(interaction: QoneqtInteraction): AISignificanceResult {
    // Basic scoring based on interaction type
    const baseScores: Record<QoneqtInteractionType, number> = {
      [QoneqtInteractionType.STORY_VIEW]: 100,
      [QoneqtInteractionType.LIKE]: 150,
      [QoneqtInteractionType.FOLLOW]: 200,
      [QoneqtInteractionType.MESSAGE]: 250,
      [QoneqtInteractionType.SHARE]: 300,
      [QoneqtInteractionType.COMMENT]: 400,
      [QoneqtInteractionType.GROUP_JOIN]: 500,
      [QoneqtInteractionType.POST]: 600,
      [QoneqtInteractionType.EVENT_ATTEND]: 700,
      [QoneqtInteractionType.MARKETPLACE_PURCHASE]: 800
    };

    const baseScore = baseScores[interaction.interactionType] || 100;
    const contentLength = interaction.content?.length || 0;
    const lengthBonus = Math.min(200, contentLength); // Up to 200 bonus for content length
    
    const significance = Math.min(1000, baseScore + lengthBonus);
    
    return {
      significance,
      reasoning: 'Fallback scoring - AI analysis unavailable',
      factors: {
        contentQuality: Math.min(200, baseScore * 0.3),
        userEngagement: Math.min(200, baseScore * 0.2),
        communityImpact: Math.min(200, baseScore * 0.2),
        authenticity: 150, // Default to assuming authentic when AI unavailable
        timeliness: Math.min(200, baseScore * 0.2)
      },
      isGenuine: true // Default to genuine when AI unavailable
    };
  }

  /**
   * Format QTO amount with proper decimals
   */
  private formatQtoAmount(weiAmount: string): string {
    const amount = BigInt(weiAmount);
    const decimals = BigInt(18);
    const divisor = BigInt(10) ** decimals;
    
    const wholePart = amount / divisor;
    const fractionalPart = amount % divisor;
    
    if (fractionalPart === BigInt(0)) {
      return wholePart.toString();
    }
    
    const fractionalStr = fractionalPart.toString().padStart(18, '0');
    const trimmedFractional = fractionalStr.replace(/0+$/, '');
    
    return `${wholePart}.${trimmedFractional}`;
  }

  /**
   * Health check for the service
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`);
      return response.status === 200;
    } catch {
      return false;
    }
  }
}

export const qoneqtRewardService = new QoneqtRewardService();
