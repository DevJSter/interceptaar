import axios from 'axios';
import config from '../utils/config';
import { RPCRequest, RPCResponse } from '../types';

export class RPCProxyService {
  private targetUrl: string;

  constructor() {
    this.targetUrl = config.targetRpcUrl;
  }

  async forwardRequest(request: RPCRequest): Promise<RPCResponse> {
    try {
      const response = await axios.post(this.targetUrl, request, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });

      return response.data;
    } catch (error: any) {
      console.error('RPC forwarding failed:', error.message);
      
      return {
        jsonrpc: request.jsonrpc,
        error: {
          code: -32603,
          message: 'Internal error: Failed to forward request',
          data: error.message
        },
        id: request.id
      };
    }
  }

  async batchForward(requests: RPCRequest[]): Promise<RPCResponse[]> {
    try {
      const response = await axios.post(this.targetUrl, requests, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      });

      return response.data;
    } catch (error: any) {
      console.error('Batch RPC forwarding failed:', error.message);
      
      return requests.map(req => ({
        jsonrpc: req.jsonrpc,
        error: {
          code: -32603,
          message: 'Internal error: Failed to forward batch request',
          data: error.message
        },
        id: req.id
      }));
    }
  }

  async checkConnection(): Promise<boolean> {
    try {
      const testRequest: RPCRequest = {
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1
      };

      const response = await axios.post(this.targetUrl, testRequest, {
        timeout: 5000
      });

      return response.data && !response.data.error;
    } catch {
      return false;
    }
  }
}

export default new RPCProxyService();
