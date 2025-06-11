import { Request, Response, NextFunction } from 'express';
import aiValidationService from '../services/aiValidationService';
import rpcProxyService from '../services/rpcProxyService';
import { blockchainService } from '../services/blockchainService';
import config from '../utils/config';
import { RPCRequest, RPCResponse, InterceptedCall } from '../types';
import { generateId, extractUserAddress } from '../utils/helpers';

// In-memory store for intercepted calls (use Redis in production)
const interceptedCalls = new Map<string, InterceptedCall>();

export const interceptRPCCall = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const startTime = Date.now();
  
  try {
    // Handle both single and batch requests
    const isArray = Array.isArray(req.body);
    const requests: RPCRequest[] = isArray ? req.body : [req.body];
    
    // Validate JSON-RPC format
    for (const request of requests) {
      if (!request.jsonrpc || !request.method || !request.hasOwnProperty('id')) {
        res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32600,
            message: 'Invalid Request'
          },
          id: request.id || null
        });
        return;
      }
    }

    const results: RPCResponse[] = [];
    
    for (const request of requests) {
      const callId = generateId();
      const interceptedCall: InterceptedCall = {
        id: callId,
        timestamp: new Date(),
        originalRequest: request,
        aiValidation: {
          isValid: false,
          riskLevel: 'MEDIUM',
          reasoning: 'Pending validation',
          shouldProceed: false
        },
        status: 'pending',
        processingTimeMs: 0
      };

      interceptedCalls.set(callId, interceptedCall);

      try {
        // Extract user address for community validation
        const userAddress = extractUserAddress(request);
        if (userAddress) {
          interceptedCall.userAddress = userAddress;
        }

        // AI Validation (if enabled)
        if (config.aiValidationEnabled) {
          console.log(`🤖 Validating RPC call: ${request.method} ${userAddress ? `from ${userAddress}` : ''}`);
          
          const validation = await aiValidationService.validateRPCCall(request, userAddress);
          interceptedCall.aiValidation = validation;

          // Community Validation (if enabled and user address available)
          if (config.communityValidationEnabled && userAddress) {
            console.log(`👥 Performing community validation for ${userAddress}`);
            
            try {
              const communityValidation = await blockchainService.validateTransactionWithCommunity(
                userAddress,
                request.params?.[0] || {}
              );

              interceptedCall.communityValidation = {
                userTrustScore: communityValidation.profile?.trustScore || 0,
                recommendation: communityValidation.isValid ? 'approve' : 'reject',
                reasoning: communityValidation.warnings.join('; ') || 'Community validation completed'
              };

              // Combine AI and community validation results
              const finalShouldProceed = validation.shouldProceed && communityValidation.isValid;
              
              if (!finalShouldProceed) {
                const combinedReasoning = [
                  validation.reasoning,
                  ...communityValidation.warnings
                ].filter(Boolean).join('; ');

                interceptedCall.aiValidation.shouldProceed = false;
                interceptedCall.aiValidation.reasoning = combinedReasoning;
              }

              console.log(`👥 Community validation: ${communityValidation.trustLevel} trust, ${communityValidation.isValid ? 'approved' : 'rejected'}`);
            } catch (communityError) {
              console.warn('Community validation failed:', communityError);
              // Continue with AI validation only
            }
          }

          interceptedCall.status = interceptedCall.aiValidation.shouldProceed ? 'validated' : 'rejected';

          // Check auto-approval settings
          const shouldAutoApprove = config.autoApprove.enabled && 
            (interceptedCall.aiValidation.riskLevel === 'LOW' || !config.autoApprove.lowRiskOnly) &&
            (!config.autoApprove.highTrustUsersOnly || 
             (interceptedCall.communityValidation?.userTrustScore || 0) >= 500);

          if (!interceptedCall.aiValidation.shouldProceed) {
            console.log(`❌ Request rejected: ${interceptedCall.aiValidation.reasoning}`);
            
            const errorResponse: RPCResponse = {
              jsonrpc: request.jsonrpc,
              error: {
                code: -32001,
                message: 'Request rejected by validation',
                data: {
                  riskLevel: interceptedCall.aiValidation.riskLevel,
                  reasoning: interceptedCall.aiValidation.reasoning,
                  communityTrustScore: interceptedCall.communityValidation?.userTrustScore,
                  callId
                }
              },
              id: request.id
            };

            interceptedCall.response = errorResponse;
            interceptedCall.status = 'rejected';
            results.push(errorResponse);
            continue;
          }

          if (!shouldAutoApprove && interceptedCall.aiValidation.riskLevel !== 'LOW') {
            console.log(`⚠️  Manual approval required for ${request.method}`);
            
            const pendingResponse: RPCResponse = {
              jsonrpc: request.jsonrpc,
              error: {
                code: -32002,
                message: 'Manual approval required',
                data: {
                  riskLevel: validation.riskLevel,
                  reasoning: validation.reasoning,
                  callId,
                  approvalEndpoint: `/api/approve/${callId}`
                }
              },
              id: request.id
            };

            interceptedCall.response = pendingResponse;
            results.push(pendingResponse);
            continue;
          }
        }

        // Forward to target RPC
        console.log(`🔄 Forwarding ${request.method} to ${config.targetRpcUrl}`);
        
        const response = await rpcProxyService.forwardRequest(request);
        
        interceptedCall.response = response;
        interceptedCall.status = 'completed';
        interceptedCall.processingTimeMs = Date.now() - startTime;
        
        console.log(`✅ Completed ${request.method} in ${interceptedCall.processingTimeMs}ms`);
        
        results.push(response);

      } catch (error: any) {
        console.error(`💥 Error processing ${request.method}:`, error.message);
        
        const errorResponse: RPCResponse = {
          jsonrpc: request.jsonrpc,
          error: {
            code: -32603,
            message: 'Internal error',
            data: error.message
          },
          id: request.id
        };

        interceptedCall.response = errorResponse;
        interceptedCall.status = 'failed';
        interceptedCall.processingTimeMs = Date.now() - startTime;
        
        results.push(errorResponse);
      }
    }

    // Return response in same format as request (array or single)
    res.json(isArray ? results : results[0]);

  } catch (error: any) {
    console.error('💥 Interceptor error:', error.message);
    
    res.status(500).json({
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: 'Internal error in interceptor',
        data: error.message
      },
      id: null
    });
  }
};

export const getInterceptedCall = (callId: string): InterceptedCall | undefined => {
  return interceptedCalls.get(callId);
};

export const approveCall = async (callId: string): Promise<RPCResponse | null> => {
  const call = interceptedCalls.get(callId);
  
  if (!call || call.status !== 'pending') {
    return null;
  }

  try {
    console.log(`✅ Manually approving call: ${call.originalRequest.method}`);
    
    const response = await rpcProxyService.forwardRequest(call.originalRequest);
    
    call.response = response;
    call.status = 'completed';
    call.processingTimeMs = Date.now() - call.timestamp.getTime();
    
    return response;
  } catch (error: any) {
    const errorResponse: RPCResponse = {
      jsonrpc: call.originalRequest.jsonrpc,
      error: {
        code: -32603,
        message: 'Error during manual approval',
        data: error.message
      },
      id: call.originalRequest.id
    };

    call.response = errorResponse;
    call.status = 'failed';
    
    return errorResponse;
  }
};

export const getCallHistory = (): InterceptedCall[] => {
  return Array.from(interceptedCalls.values())
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 100); // Last 100 calls
};
