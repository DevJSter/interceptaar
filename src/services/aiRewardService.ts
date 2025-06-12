// AI-driven reward assessment service
import ollamaService from './ollamaService';
import { blockchainService } from './blockchainService';

export interface PostInteraction {
  postId: string;
  creatorAddress: string;
  interactorAddress: string;
  content: string;
  interactionType: 'like' | 'comment' | 'share' | 'reaction';
  interactionContent?: string;
  timestamp: number;
}

export interface AIRewardAssessment {
  postId: string;
  creatorAddress: string;
  interactorAddress: string;
  significanceScore: number; // 0.000 to 1.000
  qtoAmount: number; // 0 to 30 QTO
  reasoning: string;
  validationStatus: 'approved' | 'rejected';
  assessmentTimestamp: number;
}

class AIRewardService {
  private readonly MAX_QTO = 30;
  private readonly MIN_QTO = 0;

  /**
   * AI analyzes post interaction and determines significance and QTO reward
   */
  async assessInteractionReward(interaction: PostInteraction): Promise<AIRewardAssessment> {
    try {
      const prompt = this.buildAssessmentPrompt(interaction);
      
      // Get AI analysis
      const aiResponse = await ollamaService.generateResponse(prompt);
      
      // Parse AI response to extract significance score and reasoning
      const assessment = this.parseAIAssessment(aiResponse, interaction);
      
      console.log(`🤖 AI Assessment for Post ${interaction.postId}:`, {
        significance: assessment.significanceScore,
        qto: assessment.qtoAmount,
        status: assessment.validationStatus
      });

      return assessment;
    } catch (error) {
      console.error('❌ AI reward assessment failed:', error);
      
      // Fallback assessment
      return {
        postId: interaction.postId,
        creatorAddress: interaction.creatorAddress,
        interactorAddress: interaction.interactorAddress,
        significanceScore: 0.0,
        qtoAmount: 0,
        reasoning: 'AI assessment failed - no reward allocated',
        validationStatus: 'rejected',
        assessmentTimestamp: Date.now()
      };
    }
  }

  /**
   * Process multiple interactions and execute approved rewards on-chain
   */
  async processInteractionBatch(interactions: PostInteraction[]): Promise<AIRewardAssessment[]> {
    const assessments: AIRewardAssessment[] = [];
    
    for (const interaction of interactions) {
      const assessment = await this.assessInteractionReward(interaction);
      assessments.push(assessment);
      
      // If AI approves, execute on-chain
      if (assessment.validationStatus === 'approved' && assessment.qtoAmount > 0) {
        await this.executeRewardOnChain(assessment);
      }
    }
    
    return assessments;
  }

  /**
   * Execute AI-approved reward on blockchain with real QTO token transfer
   */
  private async executeRewardOnChain(assessment: AIRewardAssessment): Promise<void> {
    try {
      console.log(`⛓️ Executing on-chain reward for Post ${assessment.postId}`);
      
      // Convert QTO amount to wei (18 decimals)
      const qtoWei = BigInt(Math.floor(assessment.qtoAmount * 1e18));
      
      // Check contract QTO balance first
      const contractBalance = await blockchainService.getContractQtoBalance();
      const contractBalanceBigInt = BigInt(contractBalance);
      
      if (contractBalanceBigInt < qtoWei) {
        console.log(`⚠️ Contract has insufficient QTO balance: ${contractBalance} wei, need ${qtoWei} wei`);
        
        // Mint additional QTO to contract for testing purposes
        const mintAmount = (qtoWei * 10n).toString(); // Mint 10x the needed amount
        await blockchainService.mintQtoToContract(mintAmount);
        console.log(`🪙 Minted ${mintAmount} QTO wei to contract`);
      }
      
      // Record validation (this creates the validation record)
      await blockchainService.recordValidation(
        assessment.interactorAddress,
        assessment.creatorAddress,
        true // AI approved
      );
      
      // Award real QTO tokens - this will transfer actual tokens from contract to user
      await blockchainService.awardCommunityReward(
        assessment.creatorAddress,
        assessment.qtoAmount, // The service expects base units, not wei
        `AI-assessed reward for post ${assessment.postId}`
      );
      
      // Verify the transfer occurred by checking user's QTO balance
      const userBalance = await blockchainService.getQtoBalance(assessment.creatorAddress);
      console.log(`✅ On-chain reward executed: ${assessment.qtoAmount} QTO to ${assessment.creatorAddress}`);
      console.log(`💰 User's new QTO balance: ${userBalance} wei (${(parseFloat(userBalance) / 1e18).toFixed(6)} QTO)`);
      
    } catch (error) {
      console.error(`❌ Failed to execute on-chain reward for Post ${assessment.postId}:`, error);
    }
  }

  /**
   * Build comprehensive prompt for AI assessment
   */
  private buildAssessmentPrompt(interaction: PostInteraction): string {
    return `You are an AI reward assessor for a blockchain-based social platform. Analyze the following post interaction and provide a significance assessment.

INTERACTION DETAILS:
- Post ID: ${interaction.postId}
- Creator Address: ${interaction.creatorAddress}
- Interactor Address: ${interaction.interactorAddress}
- Content: "${interaction.content}"
- Interaction Type: ${interaction.interactionType}
- Interaction Content: "${interaction.interactionContent || 'N/A'}"
- Timestamp: ${new Date(interaction.timestamp).toISOString()}

ASSESSMENT CRITERIA:
1. Content Quality (0-0.3): Educational value, originality, depth
2. Community Value (0-0.3): Usefulness to others, engagement potential
3. Interaction Quality (0-0.2): Thoughtfulness of interaction, adds value
4. Technical Merit (0-0.2): If applicable, technical accuracy, innovation

REWARD MAPPING:
- Significance Score: 0.000 to 1.000 (3 decimal precision)
- QTO Allocation: 0 to 30 QTO (linear mapping)
- Formula: QTO = Significance × 30

RESPONSE FORMAT (JSON):
{
  "significance_score": 0.000,
  "qto_amount": 0,
  "validation_status": "approved|rejected",
  "reasoning": "Detailed explanation of assessment",
  "quality_breakdown": {
    "content_quality": 0.000,
    "community_value": 0.000,
    "interaction_quality": 0.000,
    "technical_merit": 0.000
  }
}

Provide only valid JSON response. Be objective and fair in assessment.`;
  }

  /**
   * Parse AI response and extract assessment data
   */
  private parseAIAssessment(aiResponse: string, interaction: PostInteraction): AIRewardAssessment {
    try {
      // Extract JSON from AI response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate and normalize scores
      let significanceScore = Math.max(0, Math.min(1, parseFloat(parsed.significance_score) || 0));
      significanceScore = Math.round(significanceScore * 1000) / 1000; // 3 decimal precision
      
      const qtoAmount = Math.round(significanceScore * this.MAX_QTO);
      
      const validationStatus = parsed.validation_status === 'approved' ? 'approved' : 'rejected';
      
      return {
        postId: interaction.postId,
        creatorAddress: interaction.creatorAddress,
        interactorAddress: interaction.interactorAddress,
        significanceScore,
        qtoAmount,
        reasoning: parsed.reasoning || 'AI assessment completed',
        validationStatus,
        assessmentTimestamp: Date.now()
      };
      
    } catch (error) {
      console.error('Failed to parse AI assessment:', error);
      
      // Fallback assessment
      return {
        postId: interaction.postId,
        creatorAddress: interaction.creatorAddress,
        interactorAddress: interaction.interactorAddress,
        significanceScore: 0.0,
        qtoAmount: 0,
        reasoning: 'Failed to parse AI assessment',
        validationStatus: 'rejected',
        assessmentTimestamp: Date.now()
      };
    }
  }

  /**
   * Get assessment history for a specific post
   */
  async getPostAssessmentHistory(postId: string): Promise<AIRewardAssessment[]> {
    // This would typically query a database
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Get user's reward statistics
   */
  async getUserRewardStats(userAddress: string): Promise<{
    totalQTOEarned: number;
    totalAssessments: number;
    approvalRate: number;
    averageSignificance: number;
  }> {
    // This would typically query a database
    // For now, return default stats
    return {
      totalQTOEarned: 0,
      totalAssessments: 0,
      approvalRate: 0,
      averageSignificance: 0
    };
  }
}

export default new AIRewardService();
