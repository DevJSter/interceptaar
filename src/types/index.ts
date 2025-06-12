export interface RPCRequest {
  jsonrpc: string;
  method: string;
  params: any[];
  id: number | string;
}

export interface RPCResponse {
  jsonrpc: string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  id: number | string;
}

export interface AIValidationResult {
  isValid: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  reasoning: string;
  communityTrustScore?: number;
  modifications?: any;
  shouldProceed: boolean;
}

export interface CommunityProfile {
  username: string;
  trustScore: number;
  totalLikes: number;
  totalComments: number;
  totalPosts: number;
  totalHelpfulResponses: number;
  reportCount: number;
  isActive: boolean;
  rewardBalance?: number;
  totalEarned?: number;
  validationCount?: number;
  successfulValidations?: number;
  qtoBalance?: string;           // QTO token balance
  totalQtoEarned?: string;       // Total QTO tokens earned
  qoneqtInteractions?: number;   // Total interactions on qoneqt.com
  avgSignificanceScore?: number; // Average AI-determined significance
}

export interface UserInteraction {
  type: 'like' | 'comment' | 'post' | 'helpful_response' | 'validation';
  value?: number;
  timestamp?: Date;
  successful?: boolean; // For validation interactions
}

export interface RewardTier {
  minTrustScore: number;
  baseReward: number;
  validationReward: number;
  tierName: string;
}

export interface RewardInfo {
  rewardBalance: number;
  totalEarned: number;
  pendingReward: number;
  validationCount: number;
  successfulValidations: number;
  tierName: string;
}

export interface InterceptedCall {
  id: string;
  timestamp: Date;
  originalRequest: RPCRequest;
  userAddress?: string;
  aiValidation: AIValidationResult;
  communityValidation?: {
    userTrustScore: number;
    recommendation: 'approve' | 'reject' | 'manual_review';
    reasoning: string;
  };
  finalRequest?: RPCRequest;
  response?: RPCResponse;
  status: 'pending' | 'validated' | 'rejected' | 'completed' | 'failed';
  processingTimeMs: number;
}

export interface Config {
  port: number;
  targetRpcUrl: string;
  ollamaUrl: string;
  ollamaModel: string;
  aiValidationEnabled: boolean;
  communityValidationEnabled: boolean;
  contractAddress: string;
  privateKey: string;
  autoApprove: {
    enabled: boolean;
    lowRiskOnly: boolean;
    highTrustUsersOnly: boolean;
  };
  pagination: {
    defaultLimit: number;
    maxLimit: number;
  };
}

export interface QoneqtInteractionData {
  userId: string;
  userAddress: string;
  interactionType: QoneqtInteractionType;
  content: string;
  timestamp: number;
  platform: 'qoneqt.com';
  metadata?: {
    postId?: string;
    targetUserId?: string;
    groupId?: string;
    eventId?: string;
    productId?: string;
    contentHash?: string;
  };
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

export interface QtoRewardCalculation {
  baseReward: string;           // Base reward in QTO wei
  significanceMultiplier: number; // 0-1000 (AI determined)
  tierMultiplier: number;       // User tier multiplier
  finalReward: string;          // Final calculated reward
  reasoning: string;            // AI reasoning for significance
}

export interface QtoTokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
}

export interface GlobalQtoStats {
  totalQtoInCirculation: string;
  totalQoneqtInteractions: number;
  averageSignificanceScore: number;
  totalUsersWithQto: number;
}

export interface SignificanceHistory {
  baseAmount: string;
  multiplier: number;
  finalAmount: string;
  interactionType: string;
  significance: string;
  timestamp: number;
}

export interface QtoUserStats {
  qtoBalance: string;
  totalQtoEarned: string;
  qoneqtInteractions: number;
  avgSignificanceScore: number;
  currentTier: string;
  significanceHistory: SignificanceHistory[];
}

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
  qualityBreakdown?: {
    contentQuality: number;
    communityValue: number;
    interactionQuality: number;
    technicalMerit: number;
  };
}

export interface AIRewardBatchResult {
  assessments: AIRewardAssessment[];
  summary: {
    totalInteractions: number;
    approvedInteractions: number;
    rejectedInteractions: number;
    totalQtoAllocated: number;
    approvalRate: string;
  };
}

export interface UserRewardStats {
  totalQTOEarned: number;
  totalAssessments: number;
  approvalRate: number;
  averageSignificance: number;
  recentAssessments?: AIRewardAssessment[];
}

export interface OllamaRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    [key: string]: any;
  };
}

export interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

// User management types
export interface User {
  id: string;
  username: string;
  email: string;
  address: string;
  trustScore: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  qtoBalance?: string;
  totalQtoEarned?: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  address: string;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  trustScore?: number;
  isActive?: boolean;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface AITransactionRequest {
  method: string;
  params: any[];
  userAddress: string;
  metadata?: string;
}
