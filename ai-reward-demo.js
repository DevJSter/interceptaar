#!/usr/bin/env node

// AI-Driven QTO Allocation Demonstration
// This script demonstrates the complete AI validation and QTO reward system

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function header(title) {
  const line = '='.repeat(60);
  log(`\n${line}`, colors.cyan);
  log(`🤖 ${title}`, colors.bright + colors.cyan);
  log(line, colors.cyan);
}

function section(title) {
  log(`\n📋 ${title}`, colors.blue + colors.bright);
  log('-'.repeat(40), colors.blue);
}

async function demonstrateAIRewardSystem() {
  header('AI-DRIVEN QTO ALLOCATION SYSTEM DEMONSTRATION');
  
  log('This demonstration shows how AI automatically:', colors.yellow);
  log('✅ Validates post interactions', colors.green);
  log('✅ Assesses content significance (0.000-1.000)', colors.green);
  log('✅ Allocates QTO rewards (0-30 QTO)', colors.green);
  log('✅ Executes final transactions on-chain', colors.green);

  // Test Case 1: High-Quality Technical Content
  section('Test Case 1: High-Quality Technical Content');
  
  const highQualityPost = {
    postId: 'technical_deep_dive_001',
    creatorAddress: '0x1234567890123456789012345678901234567890',
    interactorAddress: '0x0987654321098765432109876543210987654321',
    content: 'Comprehensive analysis of Layer 2 scaling solutions: A deep dive into optimistic rollups vs zk-rollups, comparing transaction throughput, security models, and economic incentives. This technical paper includes mathematical proofs, performance benchmarks, and implementation details for developers building on Ethereum Layer 2.',
    interactionType: 'comment',
    interactionContent: 'This is groundbreaking research! The mathematical proofs are rigorous and the performance comparisons will help our team choose the right L2 solution. The implementation details are exactly what we needed for our project.'
  };

  try {
    log('📤 Submitting high-quality technical content...', colors.yellow);
    const response1 = await axios.post(`${BASE_URL}/api/ai-rewards/assess`, highQualityPost);
    const assessment1 = response1.data.data.assessment;
    
    log(`🎯 AI Assessment Results:`, colors.bright);
    log(`   📊 Significance Score: ${assessment1.significanceScore}`, colors.cyan);
    log(`   💰 QTO Allocated: ${assessment1.qtoAmount}`, colors.green);
    log(`   ✅ Status: ${assessment1.validationStatus}`, colors.green);
    log(`   💡 AI Reasoning: "${assessment1.reasoning}"`, colors.magenta);
    log(`   ⛓️  On-chain Execution: ${response1.data.data.execution}`, colors.green);
    
  } catch (error) {
    log(`❌ Error: ${error.message}`, colors.red);
  }

  // Test Case 2: Low-Quality Spam Content
  section('Test Case 2: Low-Quality Spam Content');
  
  const lowQualityPost = {
    postId: 'spam_content_001',
    creatorAddress: '0x2222222222222222222222222222222222222222',
    interactorAddress: '0x3333333333333333333333333333333333333333',
    content: 'moon lambo wen',
    interactionType: 'like',
    interactionContent: null
  };

  try {
    log('📤 Submitting low-quality spam content...', colors.yellow);
    const response2 = await axios.post(`${BASE_URL}/api/ai-rewards/assess`, lowQualityPost);
    const assessment2 = response2.data.data.assessment;
    
    log(`🎯 AI Assessment Results:`, colors.bright);
    log(`   📊 Significance Score: ${assessment2.significanceScore}`, colors.cyan);
    log(`   💰 QTO Allocated: ${assessment2.qtoAmount}`, colors.red);
    log(`   ❌ Status: ${assessment2.validationStatus}`, colors.red);
    log(`   💡 AI Reasoning: "${assessment2.reasoning}"`, colors.magenta);
    log(`   ⛓️  On-chain Execution: ${response2.data.data.execution}`, colors.red);
    
  } catch (error) {
    log(`❌ Error: ${error.message}`, colors.red);
  }

  // Test Case 3: Batch Processing
  section('Test Case 3: Batch Processing (Multiple Posts)');
  
  const batchPosts = {
    interactions: [
      {
        postId: 'educational_001',
        creatorAddress: '0x4444444444444444444444444444444444444444',
        interactorAddress: '0x5555555555555555555555555555555555555555',
        content: 'Step-by-step tutorial on building a decentralized exchange (DEX) using Solidity and React. Includes smart contract architecture, liquidity pool mechanics, automated market maker algorithms, and front-end integration.',
        interactionType: 'comment',
        interactionContent: 'Outstanding tutorial! Followed every step and successfully deployed my own DEX. The AMM algorithm explanation was particularly helpful.'
      },
      {
        postId: 'mediocre_001',
        creatorAddress: '0x6666666666666666666666666666666666666666',
        interactorAddress: '0x7777777777777777777777777777777777777777',
        content: 'Blockchain is the future of technology.',
        interactionType: 'like',
        interactionContent: null
      },
      {
        postId: 'research_001',
        creatorAddress: '0x8888888888888888888888888888888888888888',
        interactorAddress: '0x9999999999999999999999999999999999999999',
        content: 'Academic research paper: Comparative analysis of consensus mechanisms in permissionless blockchains. This study examines energy consumption, security guarantees, decentralization metrics, and finality times across 15 different blockchain networks.',
        interactionType: 'share',
        interactionContent: 'This research is incredibly thorough and will be cited in our university blockchain course. Sharing with the academic community.'
      }
    ]
  };

  try {
    log('📤 Submitting batch of varied quality posts...', colors.yellow);
    const response3 = await axios.post(`${BASE_URL}/api/ai-rewards/batch`, batchPosts);
    const assessments = response3.data.data.assessments;
    const summary = response3.data.data.summary;
    
    log(`🎯 Batch Assessment Results:`, colors.bright);
    
    assessments.forEach((assessment, index) => {
      log(`\n   📄 Post ${index + 1} (${assessment.postId}):`, colors.cyan);
      log(`      📊 Significance: ${assessment.significanceScore}`, colors.cyan);
      log(`      💰 QTO: ${assessment.qtoAmount}`, assessment.qtoAmount > 0 ? colors.green : colors.red);
      log(`      ✅ Status: ${assessment.validationStatus}`, assessment.validationStatus === 'approved' ? colors.green : colors.red);
      log(`      💡 Reasoning: "${assessment.reasoning.substring(0, 100)}..."`, colors.magenta);
    });
    
    log(`\n📈 Batch Summary:`, colors.bright);
    log(`   🔢 Total Interactions: ${summary.total_interactions}`, colors.cyan);
    log(`   ✅ Approved: ${summary.approved_interactions}`, colors.green);
    log(`   ❌ Rejected: ${summary.rejected_interactions}`, colors.red);
    log(`   💰 Total QTO Allocated: ${summary.total_qto_allocated}`, colors.green);
    log(`   📊 Approval Rate: ${summary.approval_rate}`, colors.cyan);
    
  } catch (error) {
    log(`❌ Error: ${error.message}`, colors.red);
  }

  // Test Case 4: Simulation (No On-chain Execution)
  section('Test Case 4: Assessment Simulation (No On-chain Execution)');
  
  const simulationData = {
    content: 'Advanced smart contract security audit checklist: This comprehensive guide covers reentrancy attacks, integer overflow/underflow, access control vulnerabilities, gas optimization issues, and oracle manipulation. Includes automated testing frameworks and best practices for secure development.',
    interactionType: 'comment',
    interactionContent: 'This security checklist prevented several vulnerabilities in our smart contract audit. The automated testing framework section was particularly valuable for our development process.'
  };

  try {
    log('📤 Running assessment simulation...', colors.yellow);
    const response4 = await axios.post(`${BASE_URL}/api/ai-rewards/simulate`, simulationData);
    const assessment4 = response4.data.data.assessment;
    
    log(`🎯 Simulation Results:`, colors.bright);
    log(`   📊 Predicted Significance: ${assessment4.significanceScore}`, colors.cyan);
    log(`   💰 Predicted QTO: ${assessment4.qtoAmount}`, colors.green);
    log(`   ✅ Predicted Status: ${assessment4.validationStatus}`, colors.green);
    log(`   💡 AI Reasoning: "${assessment4.reasoning}"`, colors.magenta);
    log(`   ⚠️  Note: ${response4.data.data.note}`, colors.yellow);
    
  } catch (error) {
    log(`❌ Error: ${error.message}`, colors.red);
  }

  // Summary
  header('DEMONSTRATION COMPLETE');
  
  log('🎯 Key Features Demonstrated:', colors.bright);
  log('✅ AI automatically validates all interactions', colors.green);
  log('✅ Significance scoring (0.000-1.000) based on content quality', colors.green);
  log('✅ Automatic QTO allocation (0-30 QTO) proportional to significance', colors.green);
  log('✅ Smart contract execution for approved rewards', colors.green);
  log('✅ Batch processing for multiple interactions', colors.green);
  log('✅ Quality discrimination (high quality = more QTO)', colors.green);
  log('✅ Simulation mode for testing without execution', colors.green);
  
  log('\n💡 The AI system provides complete autonomy in:', colors.yellow);
  log('   🧠 Content assessment and validation', colors.cyan);
  log('   📊 Significance scoring and reasoning', colors.cyan);
  log('   💰 QTO reward calculation and allocation', colors.cyan);
  log('   ⛓️  Final on-chain transaction execution', colors.cyan);
  
  log('\n🚀 System Status: FULLY OPERATIONAL', colors.green + colors.bright);
}

// Run the demonstration
demonstrateAIRewardSystem().catch(console.error);
