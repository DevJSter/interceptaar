#!/usr/bin/env node

const { ethers } = require('ethers');

async function simpleTest() {
  console.log('🔍 Simple Contract Test');
  console.log('======================');
  
  try {
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    const wallet = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', provider);
    
    console.log('📡 Connected to blockchain');
    console.log(`   Wallet address: ${wallet.address}`);
    
    // Check if contract exists
    const contractAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
    const code = await provider.getCode(contractAddress);
    console.log(`   Contract code length: ${code.length}`);
    
    if (code === '0x') {
      console.log('❌ Contract not deployed at this address');
      return;
    }
    
    console.log('✅ Contract exists');
    
    // Simple contract call
    const contract = new ethers.Contract(contractAddress, [
      "function qtoTotalSupply() external view returns (uint256)",
      "function TOKEN_NAME() external view returns (string)",
      "function qtoBalanceOf(address account) external view returns (uint256)"
    ], wallet);
    
    console.log('📊 Reading contract data...');
    const totalSupply = await contract.qtoTotalSupply();
    const tokenName = await contract.TOKEN_NAME();
    const contractBalance = await contract.qtoBalanceOf(contractAddress);
    
    console.log(`   Token Name: ${tokenName}`);
    console.log(`   Total Supply: ${totalSupply.toString()}`);
    console.log(`   Contract QTO Balance: ${contractBalance.toString()}`);
    
    console.log('✅ Simple test completed successfully');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

simpleTest();
