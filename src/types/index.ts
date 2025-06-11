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
  modifications?: any;
  shouldProceed: boolean;
}

export interface InterceptedCall {
  id: string;
  timestamp: Date;
  originalRequest: RPCRequest;
  aiValidation: AIValidationResult;
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
  autoApprove: {
    enabled: boolean;
    lowRiskOnly: boolean;
  };
}
