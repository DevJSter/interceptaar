#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
  CallToolRequest,
} from '@modelcontextprotocol/sdk/types.js';
import { blockchainService } from '../services/blockchainService.js';

/**
 * MCP Server for Community Interaction Rating
 * Provides tools for community-based transaction validation
 */

const server = new Server(
  {
    name: 'community-interaction-rating',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
const tools: Tool[] = [
  {
    name: 'get_user_profile',
    description: 'Get a user\'s community profile including trust score and interaction history',
    inputSchema: {
      type: 'object',
      properties: {
        userAddress: {
          type: 'string',
          description: 'Ethereum address of the user',
        },
      },
      required: ['userAddress'],
    },
  },
  {
    name: 'register_user',
    description: 'Register a new user in the community system',
    inputSchema: {
      type: 'object',
      properties: {
        userAddress: {
          type: 'string',
          description: 'Ethereum address of the user',
        },
        username: {
          type: 'string',
          description: 'Desired username for the user',
        },
      },
      required: ['userAddress', 'username'],
    },
  },
  {
    name: 'update_interaction',
    description: 'Update user interaction (like, comment, post, helpful response)',
    inputSchema: {
      type: 'object',
      properties: {
        userAddress: {
          type: 'string',
          description: 'Ethereum address of the user',
        },
        interactionType: {
          type: 'string',
          enum: ['like', 'comment', 'post', 'helpful_response'],
          description: 'Type of interaction to record',
        },
        value: {
          type: 'number',
          description: 'Value/weight of the interaction (default: 1)',
          default: 1,
        },
      },
      required: ['userAddress', 'interactionType'],
    },
  },
  {
    name: 'report_user',
    description: 'Report a user for malicious behavior',
    inputSchema: {
      type: 'object',
      properties: {
        reporterAddress: {
          type: 'string',
          description: 'Ethereum address of the user making the report',
        },
        reportedAddress: {
          type: 'string',
          description: 'Ethereum address of the user being reported',
        },
        reason: {
          type: 'string',
          description: 'Reason for the report',
        },
      },
      required: ['reporterAddress', 'reportedAddress', 'reason'],
    },
  },
  {
    name: 'get_top_users',
    description: 'Get top users by trust score',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Number of top users to return (default: 10)',
          default: 10,
        },
      },
    },
  },
  {
    name: 'validate_transaction',
    description: 'Validate a transaction using community trust data',
    inputSchema: {
      type: 'object',
      properties: {
        userAddress: {
          type: 'string',
          description: 'Ethereum address of the user',
        },
        transactionData: {
          type: 'object',
          description: 'Transaction data to validate',
          properties: {
            to: { type: 'string' },
            value: { type: 'string' },
            data: { type: 'string' },
            gas: { type: 'string' },
          },
        },
      },
      required: ['userAddress', 'transactionData'],
    },
  },
];

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_user_profile': {
        const { userAddress } = args as { userAddress: string };
        const profile = await blockchainService.getUserProfile(userAddress);
        
        if (!profile) {
          return {
            content: [
              {
                type: 'text',
                text: `User profile not found for address: ${userAddress}`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                address: userAddress,
                profile,
                trustLevel: blockchainService.calculateTrustLevel(profile.trustScore),
              }, null, 2),
            },
          ],
        };
      }

      case 'register_user': {
        const { userAddress, username } = args as { userAddress: string; username: string };
        const success = await blockchainService.registerUser(userAddress, username);
        
        return {
          content: [
            {
              type: 'text',
              text: success 
                ? `User ${username} successfully registered with address ${userAddress}`
                : `Failed to register user ${username}`,
            },
          ],
        };
      }

      case 'update_interaction': {
        const { userAddress, interactionType, value } = args as {
          userAddress: string;
          interactionType: 'like' | 'comment' | 'post' | 'helpful_response';
          value?: number;
        };
        
        const success = await blockchainService.updateInteraction(userAddress, {
          type: interactionType,
          value: value || 1,
          timestamp: new Date(),
        });
        
        return {
          content: [
            {
              type: 'text',
              text: success 
                ? `Successfully updated ${interactionType} interaction for ${userAddress}`
                : `Failed to update interaction for ${userAddress}`,
            },
          ],
        };
      }

      case 'report_user': {
        const { reporterAddress, reportedAddress, reason } = args as {
          reporterAddress: string;
          reportedAddress: string;
          reason: string;
        };
        
        const success = await blockchainService.reportUser(reporterAddress, reportedAddress, reason);
        
        return {
          content: [
            {
              type: 'text',
              text: success 
                ? `Successfully reported user ${reportedAddress} for: ${reason}`
                : `Failed to report user ${reportedAddress}`,
            },
          ],
        };
      }

      case 'get_top_users': {
        const { limit } = args as { limit?: number };
        const topUsers = await blockchainService.getTopUsers(limit || 10);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                topUsers,
                count: topUsers.length,
              }, null, 2),
            },
          ],
        };
      }

      case 'validate_transaction': {
        const { userAddress, transactionData } = args as {
          userAddress: string;
          transactionData: any;
        };
        
        const validation = await blockchainService.validateTransactionWithCommunity(
          userAddress,
          transactionData
        );
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                validation,
                recommendation: validation.isValid ? 'APPROVE' : 'REJECT',
              }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      content: [
        {
          type: 'text',
          text: `Error executing ${name}: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
const transport = new StdioServerTransport();
server.connect(transport);

console.error('Community Interaction Rating MCP Server started');
