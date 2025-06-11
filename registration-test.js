#!/usr/bin/env node

const { ethers } = require('ethers');

async function testRegistration() {
  console.log('👤 User Registration Test');
  console.log('========================');
  
  try {
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    const wallet = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', provider);
    const contractAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
    
    const contract = new ethers.Contract(contractAddress, [
      "function registerUser(string memory username) external",
      "function getUserProfile(address user) external view returns (tuple(string username, uint256 likes, uint256 comments, uint256 posts, uint256 helpfulResponses, uint256 reportsReceived, uint256 reportsMade, uint256 trustScore, uint256 lastUpdateTime, bool isActive, uint256 rewardBalance, uint256 totalEarned, uint256 validationCount, uint256 successfulValidations, uint256 qtoBalance, uint256 totalQtoEarned, uint256 qoneqtInteractions, uint256 avgSignificanceScore))"
    ], wallet);
    
    console.log(`📝 Attempting to register user...`);
    
    try {
      const registerTx = await contract.registerUser('qoneqt_test_user');
      console.log(`⏳ Transaction sent: ${registerTx.hash}`);
      await registerTx.wait();
      console.log('✅ User registered successfully');
    } catch (regError) {
      if (regError.message.includes('already registered')) {
        console.log('💡 User already registered, continuing...');
      } else {
        throw regError;
      }
    }
    
    console.log('📊 Fetching user profile...');
    const profile = await contract.getUserProfile(wallet.address);
    
    console.log('✅ User Profile:');
    console.log(`   Username: ${profile.username}`);
    console.log(`   Trust Score: ${profile.trustScore.toString()}`);
    console.log(`   QTO Balance: ${ethers.formatEther(profile.qtoBalance)} QTO`);
    console.log(`   Total QTO Earned: ${ethers.formatEther(profile.totalQtoEarned)} QTO`);
    console.log(`   Is Active: ${profile.isActive}`);
    console.log(`   QoneQt Interactions: ${profile.qoneqtInteractions.toString()}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRegistration();
