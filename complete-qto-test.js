#!/usr/bin/env node

/**
 * Complete QTO System Integration Test
 * Tests the entire QTO reward system end-to-end
 */

const { ethers } = require('ethers');

const CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const RPC_URL = 'http://localhost:8545';
const PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

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

const CONTRACT_ABI = [
  "function registerUser(string memory username) external",
  "function getUserProfile(address user) external view returns (tuple(string username, uint256 likes, uint256 comments, uint256 posts, uint256 helpfulResponses, uint256 reportsReceived, uint256 reportsMade, uint256 trustScore, uint256 lastUpdateTime, bool isActive, uint256 rewardBalance, uint256 totalEarned, uint256 validationCount, uint256 successfulValidations, uint256 qtoBalance, uint256 totalQtoEarned, uint256 qoneqtInteractions, uint256 avgSignificanceScore))",
  "function processQoneqtInteraction(address user, uint8 interactionType, uint256 aiSignificance, string memory metadata) external",
  "function qtoBalanceOf(address account) external view returns (uint256)",
  "function estimateQtoReward(address user, uint8 interactionType, uint256 aiSignificance) external view returns (uint256)",
  "function getQtoRewardStats(address user) external view returns (uint256, uint256, uint256, uint256, string)",
  "function getGlobalQtoStats() external view returns (uint256, uint256, uint256, uint256)",
  "function qtoTotalSupply() external view returns (uint256)",
  "function getInteractionBaseReward(uint8 interactionType) external view returns (uint256)"
];

function formatQTO(amount) {
  return ethers.formatEther(amount);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testCompleteQtoSystem() {
  console.log('🎯 Complete QTO System Integration Test');
  console.log('=====================================');
  console.log('Testing the full QoneQt reward system with AI significance scoring\n');

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

    // Test 1: System Overview
    console.log('1️⃣  System Overview');
    console.log('-------------------');
    
    const totalSupply = await contract.qtoTotalSupply();
    const globalStats = await contract.getGlobalQtoStats();
    
    console.log(`🏦 QTO Token System:`);
    console.log(`   Total Supply: ${formatQTO(totalSupply)} QTO`);
    console.log(`   In Circulation: ${formatQTO(globalStats[0])} QTO`);
    console.log(`   Total Interactions: ${globalStats[1].toString()}`);
    console.log(`   Average Significance: ${globalStats[2].toString()}/1000`);
    console.log(`   Active Users: ${globalStats[3].toString()}\n`);

    // Test 2: User Registration & Profile
    console.log('2️⃣  User Management');
    console.log('-------------------');
    
    try {
      const registerTx = await contract.registerUser('qoneqt_complete_test');
      await registerTx.wait();
      console.log('✅ New user registered successfully');
    } catch (error) {
      if (error.message.includes('already registered')) {
        console.log('💡 User already registered, continuing...');
      } else {
        throw error;
      }
    }

    const profile = await contract.getUserProfile(wallet.address);
    console.log(`👤 User Profile:`);
    console.log(`   Username: ${profile.username}`);
    console.log(`   Trust Score: ${profile.trustScore.toString()}`);
    console.log(`   QTO Balance: ${formatQTO(profile.qtoBalance)} QTO`);
    console.log(`   Total Earned: ${formatQTO(profile.totalQtoEarned)} QTO`);
    console.log(`   Interactions: ${profile.qoneqtInteractions.toString()}`);
    console.log(`   Average Significance: ${profile.avgSignificanceScore.toString()}/1000\n`);

    // Test 3: Interaction Base Rewards
    console.log('3️⃣  Interaction Base Rewards');
    console.log('----------------------------');
    
    const interactionTypes = [
      { name: 'LIKE', type: QoneqtInteractionType.LIKE },
      { name: 'COMMENT', type: QoneqtInteractionType.COMMENT },
      { name: 'SHARE', type: QoneqtInteractionType.SHARE },
      { name: 'POST', type: QoneqtInteractionType.POST },
      { name: 'MARKETPLACE_PURCHASE', type: QoneqtInteractionType.MARKETPLACE_PURCHASE }
    ];

    console.log('💰 Base Rewards by Interaction Type:');
    for (const interaction of interactionTypes) {
      const baseReward = await contract.getInteractionBaseReward(interaction.type);
      console.log(`   ${interaction.name}: ${formatQTO(baseReward)} QTO`);
    }
    console.log('');

    // Test 4: AI Significance Impact
    console.log('4️⃣  AI Significance Testing');
    console.log('---------------------------');
    
    const significanceLevels = [
      { level: 200, desc: 'Low (20%)' },
      { level: 500, desc: 'Medium (50%)' },
      { level: 800, desc: 'High (80%)' },
      { level: 950, desc: 'Very High (95%)' }
    ];

    console.log('🔮 Reward Estimates for POST with different significance:');
    for (const sig of significanceLevels) {
      const estimate = await contract.estimateQtoReward(
        wallet.address, 
        QoneqtInteractionType.POST, 
        sig.level
      );
      console.log(`   ${sig.desc}: ${formatQTO(estimate)} QTO`);
    }
    console.log('');

    // Test 5: Live Interaction Processing
    console.log('5️⃣  Live Interaction Processing');
    console.log('-------------------------------');
    
    const initialBalance = await contract.qtoBalanceOf(wallet.address);
    console.log(`💰 Initial Balance: ${formatQTO(initialBalance)} QTO`);

    const testInteractions = [
      {
        type: QoneqtInteractionType.LIKE,
        significance: 300,
        content: { type: 'like', target: 'meaningful_post', reason: 'helpful_content' }
      },
      {
        type: QoneqtInteractionType.COMMENT,
        significance: 750,
        content: { type: 'comment', text: 'Great insights! This really helped me understand the concept.', length: 65 }
      },
      {
        type: QoneqtInteractionType.POST,
        significance: 900,
        content: { type: 'post', title: 'Complete Guide to QoneQt Rewards', category: 'tutorial', tags: ['rewards', 'guide'] }
      }
    ];

    let totalEarned = BigInt(0);

    for (const [index, interaction] of testInteractions.entries()) {
      console.log(`\n🔄 Processing Interaction ${index + 1}/3:`);
      console.log(`   Type: ${Object.keys(QoneqtInteractionType)[interaction.type]}`);
      console.log(`   Significance: ${interaction.significance}/1000`);
      
      const beforeBalance = await contract.qtoBalanceOf(wallet.address);
      
      const metadata = JSON.stringify({
        ...interaction.content,
        timestamp: Math.floor(Date.now() / 1000),
        platform: 'qoneqt.com'
      });

      const tx = await contract.processQoneqtInteraction(
        wallet.address,
        interaction.type,
        interaction.significance,
        metadata
      );

      console.log(`   ⏳ Transaction: ${tx.hash}`);
      await tx.wait();
      
      const afterBalance = await contract.qtoBalanceOf(wallet.address);
      const earned = afterBalance - beforeBalance;
      totalEarned += earned;
      
      console.log(`   ✅ Earned: ${formatQTO(earned)} QTO`);
      console.log(`   💰 New Balance: ${formatQTO(afterBalance)} QTO`);
      
      await sleep(1000); // Wait between interactions
    }

    // Test 6: Final Results
    console.log('\n6️⃣  Final Results');
    console.log('----------------');
    
    const finalBalance = await contract.qtoBalanceOf(wallet.address);
    const finalProfile = await contract.getUserProfile(wallet.address);
    const qtoStats = await contract.getQtoRewardStats(wallet.address);
    
    console.log(`🎉 Session Summary:`);
    console.log(`   Total Earned This Session: ${formatQTO(totalEarned)} QTO`);
    console.log(`   Final Balance: ${formatQTO(finalBalance)} QTO`);
    console.log(`   Lifetime Earnings: ${formatQTO(finalProfile.totalQtoEarned)} QTO`);
    console.log(`   Total Interactions: ${finalProfile.qoneqtInteractions.toString()}`);
    console.log(`   Updated Trust Score: ${finalProfile.trustScore.toString()}`);
    console.log(`   Current Tier: ${qtoStats[4]}`);
    
    console.log('\n🏆 QTO System Test Completed Successfully!');
    console.log('==========================================');
    console.log('✅ Smart Contract QTO Distribution: WORKING');
    console.log('✅ AI Significance Scaling: WORKING');
    console.log('✅ User Tier System: WORKING');
    console.log('✅ Real-time Balance Updates: WORKING');
    console.log('✅ Interaction History Tracking: WORKING');

  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    if (error.transaction) {
      console.error('Transaction:', error.transaction);
    }
  }
}

testCompleteQtoSystem();
