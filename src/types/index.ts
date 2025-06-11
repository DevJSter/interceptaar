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
}

export interface UserInteraction {
  type: 'like' | 'comment' | 'post' | 'helpful_response';
  value?: number;
  timestamp?: Date;
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
}
