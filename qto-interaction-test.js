#!/usr/bin/env node

const { ethers } = require('ethers');

const QoneqtInteractionType = {
  LIKE: 0,
  COMMENT: 1,
  SHARE: 2,
  POST: 3,
  FOLLOW: 4,
  STORY_VIEW: 5,
  MESSAGE: 6,
  GROUP_JOIN: 7,
  EVENT_ATTEND: 8,
  MARKETPLACE_PURCHASE: 9
};

async function testQtoInteraction() {
  console.log('💰 QTO Interaction Test');
  console.log('======================');
  
  try {
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    const wallet = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', provider);
    const contractAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
    
    const contract = new ethers.Contract(contractAddress, [
      "function processQoneqtInteraction(address user, uint8 interactionType, uint256 aiSignificance, string memory metadata) external",
      "function qtoBalanceOf(address account) external view returns (uint256)",
      "function estimateQtoReward(address user, uint8 interactionType, uint256 aiSignificance) external view returns (uint256)"
    ], wallet);
    
    // Check initial balance
    console.log('📊 Initial QTO balance...');
    const initialBalance = await contract.qtoBalanceOf(wallet.address);
    console.log(`   Initial balance: ${ethers.formatEther(initialBalance)} QTO`);
    
    // Estimate reward for a high-significance post
    const significance = 850; // High significance (85%)
    const interactionType = QoneqtInteractionType.POST;
    
    console.log(`🔮 Estimating reward for POST with ${significance}/1000 significance...`);
    const estimatedReward = await contract.estimateQtoReward(wallet.address, interactionType, significance);
    console.log(`   Estimated reward: ${ethers.formatEther(estimatedReward)} QTO`);
    
    // Process the interaction
    console.log('⚡ Processing QoneQt interaction...');
    const metadata = JSON.stringify({
      content: "This is a high-quality post about QoneQt's revolutionary reward system!",
      platform: "qoneqt.com",
      timestamp: Math.floor(Date.now() / 1000)
    });
    
    const tx = await contract.processQoneqtInteraction(
      wallet.address,
      interactionType,
      significance,
      metadata
    );
    
    console.log(`⏳ Transaction sent: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed (Block: ${receipt.blockNumber})`);
    
    // Check new balance
    console.log('📊 Checking new QTO balance...');
    const newBalance = await contract.qtoBalanceOf(wallet.address);
    const earned = newBalance - initialBalance;
    
    console.log(`   New balance: ${ethers.formatEther(newBalance)} QTO`);
    console.log(`   🎉 Earned: ${ethers.formatEther(earned)} QTO`);
    
    // Calculate percentage of estimate vs actual
    const accuracy = (Number(earned) / Number(estimatedReward)) * 100;
    console.log(`   📊 Estimate accuracy: ${accuracy.toFixed(1)}%`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testQtoInteraction();
