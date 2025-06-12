import axios from 'axios';
import config from '../utils/config';
import { OllamaRequest } from '../types';

export class OllamaService {
  private baseUrl: string;
  private timeout: number;
  private defaultModel: string;

  constructor() {
    this.baseUrl = config.ollamaUrl;
    this.timeout = 30000; // 30 seconds
    this.defaultModel = config.ollamaModel;
  }

  async generateResponse(prompt: string, model?: string, options?: any): Promise<string> {
    const requestData: OllamaRequest = {
      model: model || this.defaultModel,
      prompt,
      stream: false,
      options: {
        temperature: options?.temperature || 0.7,
        top_p: options?.top_p || 0.9,
        top_k: options?.top_k || 40,
        ...options
      }
    };

    try {
      const response = await axios.post(`${this.baseUrl}/api/generate`, requestData, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      return response.data.response || response.data;
    } catch (error: any) {
      throw new Error(`Ollama API error: ${error.message}`);
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`, {
        timeout: this.timeout
      });
      
      return response.data.models?.map((model: any) => model.name) || [];
    } catch (error: any) {
      throw new Error(`Failed to fetch models: ${error.message}`);
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      await axios.get(`${this.baseUrl}/api/tags`, {
        timeout: 5000
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async analyzeTransaction(transactionData: any): Promise<string> {
    const prompt = `
You are a blockchain transaction analyzer. Analyze the following transaction details and provide insights:

Transaction Details:
- To: ${transactionData.to}
- Value: ${transactionData.value || '0'} ETH
- Data: ${transactionData.data || 'None'}
- Gas Limit: ${transactionData.gasLimit || 'Auto'}

Please provide:
1. Transaction type identification
2. Risk assessment (Low/Medium/High)
3. Brief explanation of what this transaction does
4. Any security concerns

Keep the response concise and structured.
`;

    const response = await this.generateResponse(prompt);
    return response;
  }
}

export default new OllamaService();
