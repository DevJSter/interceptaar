export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const createResponse = (
  success: boolean,
  message: string,
  data?: any,
  error?: string
) => {
  return {
    success,
    message,
    data,
    error,
    timestamp: new Date().toISOString()
  };
};

export const isReadOnlyMethod = (method: string): boolean => {
  const readOnlyMethods = [
    'eth_blockNumber',
    'eth_getBalance',
    'eth_getCode',
    'eth_getStorageAt',
    'eth_call',
    'eth_estimateGas',
    'eth_gasPrice',
    'eth_getBlockByHash',
    'eth_getBlockByNumber',
    'eth_getTransactionByHash',
    'eth_getTransactionReceipt',
    'eth_getLogs',
    'net_version',
    'web3_clientVersion'
  ];
  
  return readOnlyMethods.includes(method);
};

export const isHighRiskMethod = (method: string): boolean => {
  const highRiskMethods = [
    'eth_sendTransaction',
    'eth_sendRawTransaction',
    'personal_sendTransaction',
    'personal_unlockAccount',
    'miner_start',
    'miner_stop',
    'admin_addPeer',
    'debug_traceTransaction'
  ];
  
  return highRiskMethods.includes(method);
};

export const formatEther = (wei: string): string => {
  try {
    const weiNumber = BigInt(wei);
    const etherNumber = Number(weiNumber) / 1e18;
    return etherNumber.toString();
  } catch {
    return wei;
  }
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const extractUserAddress = (request: any): string | undefined => {
  try {
    // Extract from transaction parameters
    if (request.method === 'eth_sendTransaction' && request.params?.[0]?.from) {
      return request.params[0].from;
    }
    
    // Extract from eth_accounts or personal methods
    if (request.method === 'eth_accounts' || request.method === 'personal_listAccounts') {
      return undefined; // These methods don't have a specific user
    }
    
    // Extract from personal_* methods
    if (request.method.startsWith('personal_') && request.params?.[0]) {
      return request.params[0];
    }
    
    // Extract from wallet methods
    if (request.method.startsWith('wallet_') && request.params?.[0]?.from) {
      return request.params[0].from;
    }
    
    return undefined;
  } catch (error) {
    console.warn('Error extracting user address:', error);
    return undefined;
  }
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
