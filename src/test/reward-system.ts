#!/usr/bin/env npx tsx
/**
 * Comprehensive Reward System Testing
 * Tests the complete reward and validation system integration
 */

import { blockchainService } from '../services/blockchainService';
import { validationPipelineService } from '../services/validationPipelineService';

const TEST_ADDRESSES = {
  alice: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Default anvil address 0
  bob: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',   // Default anvil address 1
  charlie: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' // Default anvil address 2
};

interface TestResult {
  name: string;
  passed: boolean;
  details?: any;
  error?: string;
}

class RewardSystemTester {
  private results: TestResult[] = [];

  private async runTest(name: string, testFn: () => Promise<any>): Promise<void> {
    console.log(`\n🧪 Running test: ${name}`);
    try {
      const result = await testFn();
      this.results.push({
        name,
        passed: true,
        details: result
      });
      console.log(`✅ ${name} - PASSED`);
      if (result && typeof result === 'object') {
        console.log(`   Details:`, JSON.stringify(result, null, 2));
      }
    } catch (error) {
      this.results.push({
        name,
        passed: false,
        error: error instanceof Error ? error.message : String(error)
      });
      console.log(`❌ ${name} - FAILED`);
      console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Comprehensive Reward System Tests');
    console.log('='.repeat(60));

    // Test 1: Register users
    await this.runTest('Register Alice', async () => {
      return await blockchainService.registerUser(TEST_ADDRESSES.alice, 'Alice_Validator');
    });

    await this.runTest('Register Bob', async () => {
      return await blockchainService.registerUser(TEST_ADDRESSES.bob, 'Bob_Participant');
    });

    await this.runTest('Register Charlie', async () => {
      return await blockchainService.registerUser(TEST_ADDRESSES.charlie, 'Charlie_Helper');
    });

    // Test 2: Check initial profiles
    await this.runTest('Get Alice Profile', async () => {
      return await blockchainService.getUserProfile(TEST_ADDRESSES.alice);
    });

    // Test 3: Record some interactions to build trust
    await this.runTest('Alice Posts Content', async () => {
      return await blockchainService.updateInteraction(TEST_ADDRESSES.alice, {
        type: 'post',
        value: 1
      });
    });

    await this.runTest('Alice Makes Comments', async () => {
      for (let i = 0; i < 3; i++) {
        await blockchainService.updateInteraction(TEST_ADDRESSES.alice, {
          type: 'comment',
          value: 1
        });
      }
      return 'Made 3 comments';
    });

    await this.runTest('Bob Likes Content', async () => {
      for (let i = 0; i < 5; i++) {
        await blockchainService.updateInteraction(TEST_ADDRESSES.bob, {
          type: 'like',
          value: 1
        });
      }
      return 'Made 5 likes';
    });

    // Test 4: Check updated profiles
    await this.runTest('Get Updated Alice Profile', async () => {
      return await blockchainService.getUserProfile(TEST_ADDRESSES.alice);
    });

    await this.runTest('Get Updated Bob Profile', async () => {
      return await blockchainService.getUserProfile(TEST_ADDRESSES.bob);
    });

    // Test 5: Test reward system
    await this.runTest('Record Successful Validation by Alice', async () => {
      return await blockchainService.recordValidation(
        TEST_ADDRESSES.alice,
        TEST_ADDRESSES.bob,
        true
      );
    });

    await this.runTest('Record Failed Validation by Bob', async () => {
      return await blockchainService.recordValidation(
        TEST_ADDRESSES.bob,
        TEST_ADDRESSES.charlie,
        false
      );
    });

    // Test 6: Award community rewards
    await this.runTest('Award Community Reward to Alice', async () => {
      return await blockchainService.awardCommunityReward(
        TEST_ADDRESSES.alice,
        50,
        'Excellent community contribution'
      );
    });

    // Test 7: Check reward information
    await this.runTest('Get Alice Reward Info', async () => {
      return await blockchainService.getRewardInfo(TEST_ADDRESSES.alice);
    });

    await this.runTest('Get Bob Reward Info', async () => {
      return await blockchainService.getRewardInfo(TEST_ADDRESSES.bob);
    });

    // Test 8: Check user tiers
    await this.runTest('Get Alice Tier', async () => {
      return await blockchainService.getUserTier(TEST_ADDRESSES.alice);
    });

    await this.runTest('Get Bob Tier', async () => {
      return await blockchainService.getUserTier(TEST_ADDRESSES.bob);
    });

    // Test 9: Test reward claiming
    await this.runTest('Alice Claims Rewards', async () => {
      return await blockchainService.claimRewards(TEST_ADDRESSES.alice);
    });

    // Test 10: Check total rewards distributed
    await this.runTest('Get Total Rewards Distributed', async () => {
      return await blockchainService.getTotalRewardsDistributed();
    });

    // Test 11: Test validation pipeline with reward integration
    await this.runTest('Validation Pipeline with Rewards', async () => {
      const mockRequest = {
        jsonrpc: '2.0',
        method: 'eth_sendTransaction',
        params: [{
          from: TEST_ADDRESSES.alice,
          to: TEST_ADDRESSES.bob,
          value: '0x1000000000000000' // 0.001 ETH
        }],
        id: 1
      };

      return await validationPipelineService.validateTransaction(mockRequest, 'test-123');
    });

    // Test 12: Test validation pipeline health
    await this.runTest('Validation Pipeline Health Check', async () => {
      return await validationPipelineService.checkHealth();
    });

    // Test 13: Advanced reward scenarios
    await this.runTest('Build Alice to High Trust User', async () => {
      // Add more interactions to increase Alice's trust score
      for (let i = 0; i < 10; i++) {
        await blockchainService.updateInteraction(TEST_ADDRESSES.alice, {
          type: 'helpful_response',
          value: 1
        });
      }
      
      // Record multiple successful validations
      for (let i = 0; i < 5; i++) {
        await blockchainService.recordValidation(
          TEST_ADDRESSES.alice,
          TEST_ADDRESSES.bob,
          true
        );
      }
      
      return await blockchainService.getUserProfile(TEST_ADDRESSES.alice);
    });

    // Test 14: Check high-trust user rewards
    await this.runTest('Get High-Trust Alice Final Reward Info', async () => {
      return await blockchainService.getRewardInfo(TEST_ADDRESSES.alice);
    });

    await this.runTest('Get Alice Final Tier', async () => {
      return await blockchainService.getUserTier(TEST_ADDRESSES.alice);
    });

    // Final summary
    this.printResults();
  }

  private printResults(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;

    console.log(`✅ Passed: ${passed}/${total}`);
    console.log(`❌ Failed: ${failed}/${total}`);
    console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log('\n🔍 FAILED TESTS:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`   ❌ ${r.name}: ${r.error}`);
        });
    }

    console.log('\n🎯 REWARD SYSTEM STATUS:', failed === 0 ? '✅ FULLY OPERATIONAL' : '⚠️  NEEDS ATTENTION');
  }
}

// Run the tests
async function main() {
  const tester = new RewardSystemTester();
  await tester.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}
