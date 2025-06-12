import { Request, Response } from 'express';
import { blockchainService } from '../services/blockchainService';
import ollamaService from '../services/ollamaService';
import { createResponse } from '../utils/helpers';
import { AITransactionRequest } from '../types';

export const getWalletInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const walletInfo = await blockchainService.getWalletInfo();
    res.json(createResponse(true, 'Wallet information retrieved successfully', walletInfo));
  } catch (error: any) {
    res.status(500).json(
      createResponse(false, 'Failed to get wallet information', null, error.message)
    );
  }
};

export const sendTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { to, value, data, gasLimit, gasPrice } = req.body;

    if (!to) {
      res.status(400).json(
        createResponse(false, 'Recipient address (to) is required')
      );
      return;
    }

    const txRequest = {
      to,
      value,
      data,
      gasLimit,
      gasPrice
    };

    const result = await blockchainService.sendTransaction(txRequest);
    
    res.json(createResponse(true, 'Transaction sent successfully', result));
  } catch (error: any) {
    res.status(500).json(
      createResponse(false, 'Transaction failed', null, error.message)
    );
  }
};

export const estimateGas = async (req: Request, res: Response): Promise<void> => {
  try {
    const { to, value, data } = req.body;

    if (!to) {
      res.status(400).json(
        createResponse(false, 'Recipient address (to) is required')
      );
      return;
    }

    const gasEstimate = await blockchainService.estimateGas({ to, value, data });
    
    res.json(createResponse(true, 'Gas estimated successfully', {
      gasEstimate,
      gasEstimateFormatted: `${gasEstimate} gas units`
    }));
  } catch (error: any) {
    res.status(500).json(
      createResponse(false, 'Gas estimation failed', null, error.message)
    );
  }
};

export const getTransactionHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 10 } = req.query;
    const limitNum = parseInt(limit as string, 10);

    const transactions = await blockchainService.getTransactionHistory(limitNum);
    
    res.json(createResponse(true, 'Transaction history retrieved successfully', {
      transactions,
      count: transactions.length,
      limit: limitNum
    }));
  } catch (error: any) {
    res.status(500).json(
      createResponse(false, 'Failed to get transaction history', null, error.message)
    );
  }
};

export const aiAnalyzeAndSend = async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, transactionDetails, autoSign = true }: AITransactionRequest = req.body;

    if (!prompt || !transactionDetails) {
      res.status(400).json(
        createResponse(false, 'Both prompt and transactionDetails are required')
      );
      return;
    }

    // First, analyze the transaction with AI
    const analysis = await ollamaService.analyzeTransaction(transactionDetails);

    let transactionResult = null;
    
    if (autoSign) {
      // Automatically send the transaction
      try {
        transactionResult = await blockchainService.sendTransaction(transactionDetails);
      } catch (txError: any) {
        res.status(500).json(
          createResponse(false, 'AI analysis completed but transaction failed', {
            analysis,
            transactionError: txError.message
          })
        );
        return;
      }
    }

    res.json(createResponse(true, 'AI analysis and transaction completed', {
      aiAnalysis: analysis,
      transaction: transactionResult,
      autoSigned: autoSign
    }));
  } catch (error: any) {
    res.status(500).json(
      createResponse(false, 'AI analysis failed', null, error.message)
    );
  }
};

export const checkBlockchainHealth = async (req: Request, res: Response): Promise<void> => {
  try {
    const isConnected = await blockchainService.checkConnection();
    
    if (isConnected) {
      const walletInfo = await blockchainService.getWalletInfo();
      res.json(createResponse(true, 'Blockchain connection is healthy', {
        status: 'connected',
        rpcUrl: 'http://localhost:8545',
        chainId: 31337,
        wallet: walletInfo
      }));
    } else {
      res.status(503).json(
        createResponse(false, 'Blockchain connection failed')
      );
    }
  } catch (error: any) {
    res.status(503).json(
      createResponse(false, 'Failed to check blockchain health', null, error.message)
    );
  }
};
