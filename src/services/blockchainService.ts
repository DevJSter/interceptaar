import { ethers } from 'ethers';
import config from '../utils/config';
import { CommunityProfile, UserInteraction } from '../types';

// ABI for the CommunityInteractionRating contract
const COMMUNITY_CONTRACT_ABI = [
  "function registerUser(string memory username) external",
  "function updateInteraction(address user, uint8 interactionType, uint256 value) external",
  "function getUserProfile(address user) external view returns (tuple(string username, uint256 likes, uint256 comments, uint256 posts, uint256 helpfulResponses, uint256 reportsReceived, uint256 reportsMade, uint256 trustScore, uint256 lastUpdateTime, bool isActive, uint256 rewardBalance, uint256 totalEarned, uint256 validationCount, uint256 successfulValidations))",
  "function recordValidation(address validator, address user, bool successful) external",
  "function awardCommunityReward(address user, uint256 amount, string memory reason) external",
  "function claimRewards() external",
  "function withdrawRewards(uint256 amount) external",
  "function getUserTier(address user) external view returns (tuple(uint256 minTrustScore, uint256 baseReward, uint256 validationReward, string tierName))",
  "function getRewardInfo(address user) external view returns (uint256 rewardBalance, uint256 totalEarned, uint256 pendingReward, uint256 validationCount, uint256 successfulValidations, string memory tierName)",
  "function getTotalRewardsDistributed() external view returns (uint256)",
  "function reportUser(address user, string memory reason) external",
  "function getTopUsers(uint256 limit) external view returns (address[] memory)",
  "function getTrustScoreForValidation(address user) external view returns (uint256)",
  "event UserRegistered(address indexed user, string username)",
  "event InteractionUpdated(address indexed user, uint8 interactionType, uint256 value, uint256 newTrustScore)",
  "event UserReported(address indexed reportedBy, address indexed reportedUser, string reason)",
  "event RewardEarned(address indexed user, uint256 amount, string reason)",
  "event RewardClaimed(address indexed user, uint256 amount)",
  "event ValidationPerformed(address indexed validator, address indexed user, bool successful, uint256 reward)"
];

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.targetRpcUrl);
    this.wallet = new ethers.Wallet(config.privateKey, this.provider);
    this.contract = new ethers.Contract(
      config.contractAddress,
      COMMUNITY_CONTRACT_ABI,
      this.wallet
    );
  }

  /**
   * Register a new user in the community system
   */
  async registerUser(userAddress: string, username: string): Promise<boolean> {
    try {
      const isRegistered = await this.isUserRegistered(userAddress);
      if (isRegistered) {
        console.log(`User ${userAddress} is already registered`);
        return true;
      }

      const tx = await this.contract.registerUser(username);
      await tx.wait();
      
      console.log(`User ${userAddress} registered with username: ${username}`);
      return true;
    } catch (error) {
      console.error('Error registering user:', error);
      return false;
    }
  }

  /**
   * Check if a user is registered
   */
  async isUserRegistered(userAddress: string): Promise<boolean> {
    try {
      const trustScore = await this.contract.getTrustScoreForValidation(userAddress);
      return Number(trustScore) > 0;
    } catch (error) {
      console.error('Error checking user registration:', error);
      return false;
    }
  }

  /**
   * Get user's community profile
   */
  async getUserProfile(userAddress: string): Promise<CommunityProfile | null> {
    try {
      const profile = await this.contract.getUserProfile(userAddress);
      
      return {
        username: profile.username,
        trustScore: Number(profile.trustScore),
        totalLikes: Number(profile.likes),
        totalComments: Number(profile.comments),
        totalPosts: Number(profile.posts),
        totalHelpfulResponses: Number(profile.helpfulResponses),
        reportCount: Number(profile.reportsReceived),
        isActive: profile.isActive,
        rewardBalance: Number(profile.rewardBalance),
        totalEarned: Number(profile.totalEarned),
        validationCount: Number(profile.validationCount),
        successfulValidations: Number(profile.successfulValidations)
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  /**
   * Record a validation transaction
   */
  async recordValidation(validatorAddress: string, userAddress: string, successful: boolean): Promise<boolean> {
    try {
      const tx = await this.contract.recordValidation(validatorAddress, userAddress, successful);
      await tx.wait();
      
      console.log(`Validation recorded: ${validatorAddress} validated ${userAddress} - ${successful ? 'successful' : 'failed'}`);
      return true;
    } catch (error) {
      console.error('Error recording validation:', error);
      return false;
    }
  }

  /**
   * Award community reward to a user
   */
  async awardCommunityReward(userAddress: string, amount: number, reason: string): Promise<boolean> {
    try {
      const tx = await this.contract.awardCommunityReward(userAddress, amount, reason);
      await tx.wait();
      
      console.log(`Community reward awarded to ${userAddress}: ${amount} for ${reason}`);
      return true;
    } catch (error) {
      console.error('Error awarding community reward:', error);
      return false;
    }
  }

  /**
   * Claim pending rewards
   */
  async claimRewards(userAddress: string): Promise<boolean> {
    try {
      const tx = await this.contract.claimRewards();
      await tx.wait();
      
      console.log(`Rewards claimed by ${userAddress}`);
      return true;
    } catch (error) {
      console.error('Error claiming rewards:', error);
      return false;
    }
  }

  /**
   * Withdraw rewards
   */
  async withdrawRewards(userAddress: string, amount: number): Promise<boolean> {
    try {
      const tx = await this.contract.withdrawRewards(amount);
      await tx.wait();
      
      console.log(`${amount} rewards withdrawn by ${userAddress}`);
      return true;
    } catch (error) {
      console.error('Error withdrawing rewards:', error);
      return false;
    }
  }

  /**
   * Get user's reward tier information
   */
  async getUserTier(userAddress: string): Promise<{
    minTrustScore: number;
    baseReward: number;
    validationReward: number;
    tierName: string;
  } | null> {
    try {
      const tier = await this.contract.getUserTier(userAddress);
      
      return {
        minTrustScore: Number(tier.minTrustScore),
        baseReward: Number(tier.baseReward),
        validationReward: Number(tier.validationReward),
        tierName: tier.tierName
      };
    } catch (error) {
      console.error('Error fetching user tier:', error);
      return null;
    }
  }

  /**
   * Get comprehensive reward information for a user
   */
  async getRewardInfo(userAddress: string): Promise<{
    rewardBalance: number;
    totalEarned: number;
    pendingReward: number;
    validationCount: number;
    successfulValidations: number;
    tierName: string;
  } | null> {
    try {
      const rewardInfo = await this.contract.getRewardInfo(userAddress);
      
      return {
        rewardBalance: Number(rewardInfo.rewardBalance),
        totalEarned: Number(rewardInfo.totalEarned),
        pendingReward: Number(rewardInfo.pendingReward),
        validationCount: Number(rewardInfo.validationCount),
        successfulValidations: Number(rewardInfo.successfulValidations),
        tierName: rewardInfo.tierName
      };
    } catch (error) {
      console.error('Error fetching reward info:', error);
      return null;
    }
  }

  /**
   * Get total rewards distributed across the system
   */
  async getTotalRewardsDistributed(): Promise<number> {
    try {
      const total = await this.contract.getTotalRewardsDistributed();
      return Number(total);
    } catch (error) {
      console.error('Error fetching total rewards distributed:', error);
      return 0;
    }
  }

  /**
   * Update user interaction (like, comment, post, helpful response)
   */
  async updateInteraction(userAddress: string, interaction: UserInteraction): Promise<boolean> {
    try {
      // Ensure user is registered first
      const isRegistered = await this.isUserRegistered(userAddress);
      if (!isRegistered) {
        console.log(`User ${userAddress} not registered, registering with default username`);
        await this.registerUser(userAddress, `User_${userAddress.slice(-6)}`);
      }

      // Map interaction type to contract enum
      let interactionType: number;
      switch (interaction.type) {
        case 'like':
          interactionType = 0;
          break;
        case 'comment':
          interactionType = 1;
          break;
        case 'post':
          interactionType = 2;
          break;
        case 'helpful_response':
          interactionType = 3;
          break;
        default:
          throw new Error(`Unknown interaction type: ${interaction.type}`);
      }

      const tx = await this.contract.updateInteraction(
        userAddress,
        interactionType,
        interaction.value || 1
      );
      await tx.wait();

      console.log(`Updated interaction for ${userAddress}: ${interaction.type} with value ${interaction.value}`);
      return true;
    } catch (error) {
      console.error('Error updating interaction:', error);
      return false;
    }
  }

  /**
   * Report a user for malicious behavior
   */
  async reportUser(reporterAddress: string, reportedAddress: string, reason: string): Promise<boolean> {
    try {
      const tx = await this.contract.reportUser(reportedAddress, reason);
      await tx.wait();
      
      console.log(`User ${reportedAddress} reported by ${reporterAddress} for: ${reason}`);
      return true;
    } catch (error) {
      console.error('Error reporting user:', error);
      return false;
    }
  }

  /**
   * Get top users by trust score
   */
  async getTopUsers(limit: number = 10): Promise<string[]> {
    try {
      const topUsers = await this.contract.getTopUsers(limit);
      return topUsers;
    } catch (error) {
      console.error('Error fetching top users:', error);
      return [];
    }
  }

  /**
   * Calculate community trust level based on trust score
   */
  calculateTrustLevel(trustScore: number): 'low' | 'medium' | 'high' | 'very_high' {
    if (trustScore >= 1000) return 'very_high';
    if (trustScore >= 500) return 'high';
    if (trustScore >= 100) return 'medium';
    return 'low';
  }

  /**
   * Get blockchain network info
   */
  async getNetworkInfo(): Promise<{ chainId: number; blockNumber: number }> {
    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      
      return {
        chainId: Number(network.chainId),
        blockNumber
      };
    } catch (error) {
      console.error('Error fetching network info:', error);
      return { chainId: 0, blockNumber: 0 };
    }
  }

  /**
   * Validate transaction with community data
   */
  async validateTransactionWithCommunity(
    userAddress: string,
    transactionData: any
  ): Promise<{
    isValid: boolean;
    trustLevel: 'low' | 'medium' | 'high' | 'very_high';
    profile: CommunityProfile | null;
    warnings: string[];
  }> {
    try {
      const profile = await this.getUserProfile(userAddress);
      const warnings: string[] = [];
      let isValid = true;

      if (!profile) {
        warnings.push('User not found in community system');
        return {
          isValid: false,
          trustLevel: 'low',
          profile: null,
          warnings
        };
      }

      const trustLevel = this.calculateTrustLevel(profile.trustScore);

      // Check for high-risk indicators
      if (profile.reportCount > 5) {
        warnings.push('User has multiple reports');
        isValid = false;
      }

      if (!profile.isActive) {
        warnings.push('User account is inactive');
        isValid = false;
      }

      // Additional validation based on transaction value and trust level
      if (transactionData.value && ethers.parseEther('10') < ethers.getBigInt(transactionData.value)) {
        if (trustLevel === 'low') {
          warnings.push('Large transaction from low-trust user');
          isValid = false;
        } else if (trustLevel === 'medium') {
          warnings.push('Large transaction - medium trust user needs additional verification');
        }
      }

      return {
        isValid,
        trustLevel,
        profile,
        warnings
      };
    } catch (error) {
      console.error('Error validating transaction with community:', error);
      return {
        isValid: false,
        trustLevel: 'low',
        profile: null,
        warnings: ['Error accessing community data']
      };
    }
  }
}

export const blockchainService = new BlockchainService();
