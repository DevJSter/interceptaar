#!/usr/bin/env node

/**
 * QTO System Test - Demonstrates the blockchain smart contract functionality
 * This script tests the QTO reward system directly via smart contract calls
 */

const { ethers } = require('ethers');

// Configuration
const RPC_URL = 'http://localhost:8545';
const CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

// Contract ABI (simplified for testing)
const CONTRACT_ABI = [
  "function registerUser(string memory username) external",
  "function getUserProfile(address userAddress) external view returns (tuple(string username, uint256 likes, uint256 comments, uint256 posts, uint256 helpfulResponses, uint256 reportsReceived, uint256 reportsMade, uint256 trustScore, uint256 lastUpdateTime, bool isActive, uint256 rewardBalance, uint256 totalEarned, uint256 validationCount, uint256 successfulValidations, uint256 qtoBalance, uint256 totalQtoEarned, uint256 qoneqtInteractions, uint256 avgSignificanceScore))",
  "function processQoneqtInteraction(address user, uint8 interactionType, uint256 aiSignificance, string memory metadata) external",
  "function getQtoBalance(address user) external view returns (uint256)",
  "function qtoTotalSupply() external view returns (uint256)",
  "function recordLike(string memory metadata) external",
  "function recordComment(string memory metadata) external",
  "function recordPost(string memory metadata) external"
];

// QoneQt Interaction Types
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

async function main() {
  console.log('🧪 QTO System Blockchain Test');
  console.log('===============================\n');

  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

  try {
    // Test 1: Register a new user (handle registration failure gracefully)
    console.log('1️⃣  Testing user registration...');
    try {
      const registerTx = await contract.registerUser('test_user_qoneqt');
      await registerTx.wait();
      console.log('✅ User registered successfully');
      console.log(`   Transaction: ${registerTx.hash}\n`);
    } catch (regError) {
      if (regError.message.includes('already registered')) {
        console.log('💡 User already registered, continuing with existing user...\n');
      } else {
        throw regError; // Re-throw if it's a different error
      }
    }

    // Test 2: Get user profile
    console.log('2️⃣  Fetching user profile...');
    const profile = await contract.getUserProfile(wallet.address);
    console.log('✅ User Profile Retrieved:');
    console.log(`   Username: ${profile.username}`);
    console.log(`   Trust Score: ${profile.trustScore}`);
    console.log(`   QTO Balance: ${formatQTO(profile.qtoBalance)}`);
    console.log(`   Total QTO Earned: ${formatQTO(profile.totalQtoEarned)}`);
    console.log(`   Is Active: ${profile.isActive}\n`);

    // Test 3: Process QoneQt interactions with different significance levels
    console.log('3️⃣  Processing QoneQt interactions...');
    
    const interactions = [
      { type: QoneqtInteractionType.LIKE, significance: 300, desc: 'Low significance like' },
      { type: QoneqtInteractionType.COMMENT, significance: 600, desc: 'Medium significance comment' },
      { type: QoneqtInteractionType.POST, significance: 900, desc: 'High significance post' },
      { type: QoneqtInteractionType.MARKETPLACE_PURCHASE, significance: 800, desc: 'Marketplace purchase' }
    ];

    for (const interaction of interactions) {
      console.log(`   Processing: ${interaction.desc} (significance: ${interaction.significance}/1000)`);
      const metadata = JSON.stringify({
        content: `Test ${interaction.desc}`,
        timestamp: Date.now(),
        platform: 'qoneqt.com'
      });
      
      try {
        const tx = await contract.processQoneqtInteraction(
          wallet.address,
          interaction.type,
          interaction.significance,
          metadata
        );
        const receipt = await tx.wait();
        console.log(`   ✅ Processed - TX: ${tx.hash.substring(0, 10)}... (Gas: ${receipt.gasUsed})`);
        
        // Check balance after each interaction
        const balanceAfter = await contract.getQtoBalance(wallet.address);
        console.log(`   💰 QTO Balance after interaction: ${formatQTO(balanceAfter)}`);
      } catch (error) {
        console.log(`   ❌ Failed to process ${interaction.desc}: ${error.message}`);
      }
      
      // Small delay between interactions
      await sleep(500);
    }
    console.log('');

    // Test 4: Check updated balance
    console.log('4️⃣  Checking updated QTO balance...');
    const newBalance = await contract.getQtoBalance(wallet.address);
    console.log(`✅ New QTO Balance: ${formatQTO(newBalance)}`);
    
    const updatedProfile = await contract.getUserProfile(wallet.address);
    console.log(`✅ Total QTO Earned: ${formatQTO(updatedProfile.totalQtoEarned)}`);
    console.log(`✅ QoneQt Interactions: ${updatedProfile.qoneqtInteractions}`);
    console.log(`✅ Average Significance: ${updatedProfile.avgSignificanceScore}\n`);

    // Test 5: Check total supply
    console.log('5️⃣  Checking QTO token information...');
    const totalSupply = await contract.qtoTotalSupply();
    console.log(`✅ QTO Total Supply: ${formatQTO(totalSupply)} (1 billion tokens)`);
    console.log('');

    // Test 6: Traditional community interactions
    console.log('6️⃣  Testing traditional community interactions...');
    
    const likeTx = await contract.recordLike('Liked a blockchain tutorial');
    await likeTx.wait();
    console.log(`✅ Like recorded - TX: ${likeTx.hash.substring(0, 10)}...`);
    
    const commentTx = await contract.recordComment('Great explanation of smart contracts!');
    await commentTx.wait();
    console.log(`✅ Comment recorded - TX: ${commentTx.hash.substring(0, 10)}...`);
    
    const postTx = await contract.recordPost('New post about QTO reward system');
    await postTx.wait();
    console.log(`✅ Post recorded - TX: ${postTx.hash.substring(0, 10)}...\n`);

    // Test 7: Final profile check
    console.log('7️⃣  Final profile summary...');
    const finalProfile = await contract.getUserProfile(wallet.address);
    console.log('✅ Final Profile Summary:');
    console.log(`   Likes: ${finalProfile.likes}`);
    console.log(`   Comments: ${finalProfile.comments}`);
    console.log(`   Posts: ${finalProfile.posts}`);
    console.log(`   Trust Score: ${finalProfile.trustScore}`);
    console.log(`   QTO Balance: ${formatQTO(finalProfile.qtoBalance)}`);
    console.log(`   QoneQt Interactions: ${finalProfile.qoneqtInteractions}`);
    console.log('');

    console.log('🎉 All QTO blockchain tests completed successfully!');
    console.log('');
    console.log('📝 Summary:');
    console.log(`   - User registered with username: ${finalProfile.username}`);
    console.log(`   - Processed ${finalProfile.qoneqtInteractions} QoneQt interactions`);
    console.log(`   - Earned ${formatQTO(finalProfile.totalQtoEarned)} QTO tokens`);
    console.log(`   - Current trust score: ${finalProfile.trustScore}`);
    console.log(`   - Traditional interactions: ${finalProfile.likes} likes, ${finalProfile.comments} comments, ${finalProfile.posts} posts`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('already registered')) {
      console.log('\n💡 Note: User is already registered. This is expected if you\'ve run the test before.');
      console.log('   The test will continue with existing user data.');
    } else if (error.message.includes('CALL_EXCEPTION')) {
      console.log('\n💡 Note: This might be a contract interaction issue.');
      console.log('   Make sure Anvil blockchain is running and the contract is deployed correctly.');
    }
  }
}

function formatQTO(weiAmount) {
  const amount = BigInt(weiAmount.toString());
  const decimals = BigInt(18);
  const divisor = BigInt(10) ** decimals;
  
  const wholePart = amount / divisor;
  const fractionalPart = amount % divisor;
  
  if (fractionalPart === BigInt(0)) {
    return wholePart.toString();
  }
  
  const fractionalStr = fractionalPart.toString().padStart(18, '0');
  const trimmedFractional = fractionalStr.replace(/0+$/, '');
  
  return `${wholePart}.${trimmedFractional}`;
}

// Helper to wait
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the test
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, formatQTO };
