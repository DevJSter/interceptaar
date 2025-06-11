#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TEST_USER = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

async function testQTOSystem() {
    console.log('🧪 Testing QTO Reward System');
    console.log('================================\n');

    try {
        // 1. Test user registration
        console.log('1️⃣  Testing user registration...');
        const registerResponse = await axios.post(`${BASE_URL}/api/qto/register-user`, {
            address: TEST_USER,
            username: 'testuser123'
        });
        console.log('✅ User registration:', registerResponse.data);

        // 2. Test reward estimation
        console.log('\n2️⃣  Testing reward estimation...');
        const estimateResponse = await axios.post(`${BASE_URL}/api/qto/estimate-reward`, {
            interactionType: 'LIKE',
            aiSignificance: 750,
            userAddress: TEST_USER
        });
        console.log('✅ Reward estimation:', estimateResponse.data);

        // 3. Test processing a QoneQt interaction
        console.log('\n3️⃣  Testing QoneQt interaction processing...');
        const interactionResponse = await axios.post(`${BASE_URL}/api/qto/process-interaction`, {
            userAddress: TEST_USER,
            interactionType: 'LIKE',
            contentData: {
                postId: 'post_123',
                authorId: 'author_456',
                content: 'This is an amazing post about blockchain technology and its future applications!',
                engagement: {
                    previousLikes: 15,
                    previousComments: 3
                }
            }
        });
        console.log('✅ Interaction processing:', interactionResponse.data);

        // 4. Test batch processing
        console.log('\n4️⃣  Testing batch interaction processing...');
        const batchResponse = await axios.post(`${BASE_URL}/api/qto/batch-process`, {
            interactions: [
                {
                    userAddress: TEST_USER,
                    interactionType: 'COMMENT',
                    contentData: {
                        postId: 'post_124',
                        content: 'Great insights! Thanks for sharing.'
                    }
                },
                {
                    userAddress: TEST_USER,
                    interactionType: 'SHARE',
                    contentData: {
                        postId: 'post_125',
                        content: 'Must read article about DeFi protocols'
                    }
                }
            ]
        });
        console.log('✅ Batch processing:', batchResponse.data);

        // 5. Check user balance
        console.log('\n5️⃣  Checking QTO balance...');
        const balanceResponse = await axios.get(`${BASE_URL}/api/qto/balance/${TEST_USER}`);
        console.log('✅ QTO Balance:', balanceResponse.data);

        // 6. Check user statistics
        console.log('\n6️⃣  Checking user statistics...');
        const statsResponse = await axios.get(`${BASE_URL}/api/qto/user/${TEST_USER}/stats`);
        console.log('✅ User Statistics:', statsResponse.data);

        // 7. Check global statistics
        console.log('\n7️⃣  Checking global statistics...');
        const globalStatsResponse = await axios.get(`${BASE_URL}/api/qto/global-stats`);
        console.log('✅ Global Statistics:', globalStatsResponse.data);

        console.log('\n🎉 All QTO tests completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        
        if (error.response?.status === 404) {
            console.log('\n💡 Note: This might be because the QTO routes are not yet integrated into the main server.');
            console.log('   The backend services are ready, but need to be connected to the Express app.');
        }
    }
}

// Helper function to wait
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the test
testQTOSystem().catch(console.error);
