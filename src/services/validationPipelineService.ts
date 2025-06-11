import { RPCRequest, AIValidationResult, CommunityProfile, UserInteraction } from '../types';
import aiValidationService from './aiValidationService';
import { blockchainService } from './blockchainService';
import config from '../utils/config';
import { extractUserAddress } from '../utils/helpers';

export interface ValidationPipelineResult {
  callId: string;
  userAddress?: string;
  aiValidation: AIValidationResult;
  communityValidation?: {
    profile: CommunityProfile | null;
    trustLevel: 'low' | 'medium' | 'high' | 'very_high';
    isValid: boolean;
    warnings: string[];
    recommendation: 'approve' | 'reject' | 'manual_review';
  };
  finalDecision: {
    approved: boolean;
    requiresManualReview: boolean;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    reasoning: string;
    autoApproved: boolean;
  };
  metadata: {
    timestamp: Date;
    processingTimeMs: number;
    validationSteps: string[];
  };
}

export class ValidationPipelineService {
  
  /**
   * Comprehensive validation pipeline combining AI and community validation
   */
  async validateTransaction(
    request: RPCRequest,
    callId: string,
    options: {
      skipAI?: boolean;
      skipCommunity?: boolean;
      forceManualReview?: boolean;
    } = {}
  ): Promise<ValidationPipelineResult> {
    const startTime = Date.now();
    const validationSteps: string[] = [];
    
    // Extract user address
    const userAddress = extractUserAddress(request);
    validationSteps.push('user_address_extraction');

    // Initialize result structure
    const result: ValidationPipelineResult = {
      callId,
      userAddress,
      aiValidation: {
        isValid: false,
        riskLevel: 'MEDIUM',
        reasoning: 'Validation pending',
        shouldProceed: false
      },
      finalDecision: {
        approved: false,
        requiresManualReview: false,
        riskLevel: 'MEDIUM',
        reasoning: '',
        autoApproved: false
      },
      metadata: {
        timestamp: new Date(),
        processingTimeMs: 0,
        validationSteps
      }
    };

    try {
      // Step 1: AI Validation
      if (config.aiValidationEnabled && !options.skipAI) {
        validationSteps.push('ai_validation_start');
        console.log(`🤖 Running AI validation for ${request.method}`);
        
        result.aiValidation = await aiValidationService.validateRPCCall(request, userAddress);
        validationSteps.push('ai_validation_complete');
        
        console.log(`🤖 AI Result: ${result.aiValidation.riskLevel} risk, ${result.aiValidation.shouldProceed ? 'proceed' : 'reject'}`);
      }

      // Step 2: Community Validation
      if (config.communityValidationEnabled && !options.skipCommunity && userAddress) {
        validationSteps.push('community_validation_start');
        console.log(`👥 Running community validation for ${userAddress}`);
        
        try {
          const communityValidationResult = await blockchainService.validateTransactionWithCommunity(
            userAddress,
            request.params?.[0] || {}
          );

          result.communityValidation = {
            profile: communityValidationResult.profile,
            trustLevel: communityValidationResult.trustLevel,
            isValid: communityValidationResult.isValid,
            warnings: communityValidationResult.warnings,
            recommendation: this.getCommunityRecommendation(communityValidationResult)
          };

          validationSteps.push('community_validation_complete');
          console.log(`👥 Community Result: ${result.communityValidation.trustLevel} trust, ${result.communityValidation.recommendation}`);
          
          // Update interaction record for transaction attempts
          if (request.method === 'eth_sendTransaction') {
            await this.recordTransactionAttempt(userAddress, request);
          }
        } catch (error) {
          console.warn('Community validation failed:', error);
          validationSteps.push('community_validation_failed');
        }
      }

      // Step 3: Combined Decision Making
      validationSteps.push('decision_making');
      result.finalDecision = this.makeDecision(
        result.aiValidation,
        result.communityValidation,
        options.forceManualReview
      );

      // Step 4: Auto-approval check
      if (result.finalDecision.approved && !result.finalDecision.requiresManualReview) {
        result.finalDecision.autoApproved = this.checkAutoApprovalEligibility(
          result.aiValidation,
          result.communityValidation
        );
      }

      validationSteps.push('validation_complete');
      
    } catch (error) {
      console.error('Validation pipeline error:', error);
      validationSteps.push('validation_error');
      
      // Default to manual review on error
      result.finalDecision = {
        approved: false,
        requiresManualReview: true,
        riskLevel: 'HIGH',
        reasoning: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        autoApproved: false
      };
    }

    result.metadata.processingTimeMs = Date.now() - startTime;
    result.metadata.validationSteps = validationSteps;

    return result;
  }

  /**
   * Get community recommendation based on validation result
   */
  private getCommunityRecommendation(
    validation: Awaited<ReturnType<typeof blockchainService.validateTransactionWithCommunity>>
  ): 'approve' | 'reject' | 'manual_review' {
    if (!validation.isValid) {
      return 'reject';
    }

    switch (validation.trustLevel) {
      case 'very_high':
      case 'high':
        return 'approve';
      case 'medium':
        return 'manual_review';
      case 'low':
      default:
        return 'reject';
    }
  }

  /**
   * Make final decision based on AI and community validation
   */
  private makeDecision(
    aiValidation: AIValidationResult,
    communityValidation?: ValidationPipelineResult['communityValidation'],
    forceManualReview?: boolean
  ): ValidationPipelineResult['finalDecision'] {
    const reasoningParts: string[] = [];

    // Force manual review if requested
    if (forceManualReview) {
      return {
        approved: false,
        requiresManualReview: true,
        riskLevel: aiValidation.riskLevel,
        reasoning: 'Manual review requested',
        autoApproved: false
      };
    }

    // AI validation failed
    if (!aiValidation.shouldProceed) {
      reasoningParts.push(`AI: ${aiValidation.reasoning}`);
      
      return {
        approved: false,
        requiresManualReview: aiValidation.riskLevel === 'MEDIUM',
        riskLevel: aiValidation.riskLevel,
        reasoning: reasoningParts.join('; '),
        autoApproved: false
      };
    }

    // Community validation failed
    if (communityValidation && !communityValidation.isValid) {
      reasoningParts.push(`Community: ${communityValidation.warnings.join(', ')}`);
      
      return {
        approved: false,
        requiresManualReview: communityValidation.recommendation === 'manual_review',
        riskLevel: 'HIGH',
        reasoning: reasoningParts.join('; '),
        autoApproved: false
      };
    }

    // Both validations passed
    reasoningParts.push('AI validation passed');
    if (communityValidation) {
      reasoningParts.push(`Community trust: ${communityValidation.trustLevel}`);
    }

    const requiresManualReview = 
      aiValidation.riskLevel === 'HIGH' ||
      (communityValidation?.recommendation === 'manual_review');

    return {
      approved: true,
      requiresManualReview,
      riskLevel: aiValidation.riskLevel,
      reasoning: reasoningParts.join('; '),
      autoApproved: false // Will be set in checkAutoApprovalEligibility
    };
  }

  /**
   * Check if transaction is eligible for auto-approval
   */
  private checkAutoApprovalEligibility(
    aiValidation: AIValidationResult,
    communityValidation?: ValidationPipelineResult['communityValidation']
  ): boolean {
    if (!config.autoApprove.enabled) {
      return false;
    }

    // Check risk level requirements
    if (config.autoApprove.lowRiskOnly && aiValidation.riskLevel !== 'LOW') {
      return false;
    }

    // Check trust score requirements
    if (config.autoApprove.highTrustUsersOnly) {
      const trustScore = communityValidation?.profile?.trustScore || 0;
      if (trustScore < 500) {
        return false;
      }
    }

    return true;
  }

  /**
   * Record transaction attempt for community tracking
   */
  private async recordTransactionAttempt(
    userAddress: string,
    request: RPCRequest
  ): Promise<void> {
    try {
      // Record as a post/activity
      await blockchainService.updateInteraction(userAddress, {
        type: 'post',
        value: 1,
        timestamp: new Date()
      });
    } catch (error) {
      console.warn('Failed to record transaction attempt:', error);
    }
  }

  /**
   * Get validation statistics
   */
  async getValidationStats(timeRange: 'hour' | 'day' | 'week' = 'day'): Promise<{
    total: number;
    approved: number;
    rejected: number;
    manualReview: number;
    autoApproved: number;
    avgProcessingTime: number;
  }> {
    // This would typically query a database
    // For now, returning mock stats
    return {
      total: 0,
      approved: 0,
      rejected: 0,
      manualReview: 0,
      autoApproved: 0,
      avgProcessingTime: 0
    };
  }

  /**
   * Health check for the validation pipeline
   */
  async checkHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    ai: boolean;
    community: boolean;
    blockchain: boolean;
  }> {
    const aiHealthy = await aiValidationService.checkHealth();
    
    let blockchainHealthy = false;
    let communityHealthy = false;
    
    try {
      const networkInfo = await blockchainService.getNetworkInfo();
      blockchainHealthy = networkInfo.chainId > 0;
      
      // Test community contract access
      const topUsers = await blockchainService.getTopUsers(1);
      communityHealthy = Array.isArray(topUsers);
    } catch (error) {
      console.warn('Blockchain/community health check failed:', error);
    }

    const healthyCount = [aiHealthy, blockchainHealthy, communityHealthy].filter(Boolean).length;
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyCount === 3) status = 'healthy';
    else if (healthyCount >= 1) status = 'degraded';
    else status = 'unhealthy';

    return {
      status,
      ai: aiHealthy,
      community: communityHealthy,
      blockchain: blockchainHealthy
    };
  }
}

export const validationPipelineService = new ValidationPipelineService();
