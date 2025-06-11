# 🛡️ RPC Interceptor with AI & Community Validation

A comprehensive blockchain RPC interceptor that validates transactions using AI (Ollama) and community-based trust scoring before forwarding to the target blockchain. Features a complete reward system for community participation and sophisticated approval mechanisms.

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Apps   │    │  RPC Interceptor │    │   Blockchain    │
│                 │◄──►│                 │◄──►│   (Anvil)       │
│ Web3 / DApps    │    │  AI + Community │    │   localhost:8545│
└─────────────────┘    │   Validation    │    └─────────────────┘
                       └─────────────────┘              │
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Ollama AI     │    │ Smart Contract  │
                       │  localhost:11434│    │ Community Rating│
                       └─────────────────┘    └─────────────────┘
```

## ✨ Features

### 🤖 AI-Powered Validation
- **Ollama Integration**: Uses local Llama 3.2 model for transaction analysis
- **Risk Assessment**: Categorizes transactions as LOW, MEDIUM, or HIGH risk
- **Context-Aware**: Analyzes transaction amount, recipient, contract interactions
- **Reasoning**: Provides detailed explanations for validation decisions

### 👥 Community Trust System
- **Smart Contract Based**: Deployed on Anvil blockchain (Foundry)
- **Trust Score Calculation**: Dynamic scoring based on user interactions
- **Interaction Tracking**: Likes, comments, posts, helpful responses
- **Reputation Management**: Community-driven validation and reporting
- **Trust Levels**: Automatic categorization (low, medium, high, very_high)

### 🛡️ Security Features
- **Multi-Layer Validation**: Both AI and community checks required
- **Auto-Approval**: Configurable for low-risk, high-trust users
- **Manual Review Queue**: Suspicious transactions flagged for review
- **Request Filtering**: Invalid requests blocked at the gateway
- **Batch Processing**: Handles multiple RPC calls efficiently

### 🔗 Integration Capabilities
- **MCP Protocol Ready**: Model Context Protocol server implementation
- **REST API**: Community interaction endpoints
- **Standard RPC**: Full JSON-RPC 2.0 compatibility
- **Express Server**: Production-ready HTTP server
- **TypeScript**: Full type safety and modern development

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Foundry (for smart contracts)
- Ollama with Llama 3.2 model

### Installation

```bash
# Clone and install dependencies
cd interceptoor
npm install

# Install Foundry dependencies
cd contracts
forge install

# Pull Ollama model
ollama pull llama3.2
```

### Starting the System

You'll need 4 terminals to run the complete system:

#### Terminal 1: Start Anvil Blockchain
```bash
# Start local Ethereum node with test accounts
anvil
```

#### Terminal 2: Deploy Smart Contracts
```bash
cd contracts

# Deploy the CommunityInteractionRating contract
PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" \
forge script script/Deploy.s.sol \
  --rpc-url http://localhost:8545 \
  --broadcast

# Or use the shorthand:
forge script script/Deploy.s.sol \
  --rpc-url http://localhost:8545 \
  --broadcast \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

#### Terminal 3: Start Ollama AI Service
```bash
# Start Ollama service (if not already running)
ollama serve

# In another terminal, ensure Llama 3.2 model is available:
ollama pull llama3.2
```

#### Terminal 4: Start RPC Interceptor
```bash
# Build and start the main application
npm run build
npm start

# Or with auto-approval enabled:
AUTO_APPROVE=true npm start

# Or with community validation disabled:
COMMUNITY_VALIDATION=false npm start
```

### 🚀 One-Command Startup (Alternative)

For convenience, you can also start everything with individual commands:

```bash
# Start all services (run each in separate terminals)
# Terminal 1:
anvil

# Terminal 2: 
cd contracts && forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Terminal 3:
ollama serve

# Terminal 4:
npm start
```

### 🔧 Environment Configuration

Before starting, you can customize the system behavior:

```bash
# Set environment variables (optional)
export PORT=3000
export TARGET_RPC_URL=http://localhost:8545
export OLLAMA_URL=http://localhost:11434
export OLLAMA_MODEL=llama3.2
export AI_VALIDATION=true
export COMMUNITY_VALIDATION=true
export AUTO_APPROVE=false
export CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3

# Then start the application
npm start
```

## 📊 Example Validation Flow

```
User Transaction Request
         │
         ▼
   Format Validation
         │
         ▼
   Extract User Address
         │
         ▼
    AI Validation ────► Risk: LOW/MEDIUM/HIGH
         │              Reasoning: "Small transaction, valid recipient"
         ▼
  Community Validation ► Trust: 750 (HIGH)
         │               Status: Active user
         ▼
   Combined Decision ───► APPROVE (Auto)
         │               
         ▼
    Forward to Blockchain
```

**Status**: ✅ **Fully Functional**
- AI Validation: Working with Ollama Llama 3.2
- Community System: Deployed on Anvil blockchain (0x5FbDB2315678afecb367f032d93F642f64180aa3)
- RPC Proxy: Forwarding to localhost:8545
- Security Features: Multi-layer validation active
- Integration: MCP-ready, REST API available

## 📡 API Endpoints & Usage

### Main RPC Endpoint
```bash
# Single RPC request
curl -X POST -H "Content-Type: application/json" \
  --data '{
    "jsonrpc": "2.0",
    "method": "eth_sendTransaction",
    "params": [{
      "from": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      "to": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      "value": "0x16345785D8A0000"
    }],
    "id": 1
  }' \
  http://localhost:3000/

# Batch RPC request
curl -X POST -H "Content-Type: application/json" \
  --data '[
    {"jsonrpc": "2.0", "method": "eth_blockNumber", "params": [], "id": 1},
    {"jsonrpc": "2.0", "method": "eth_gasPrice", "params": [], "id": 2}
  ]' \
  http://localhost:3000/
```

### Management Endpoints
```bash
# System health check
curl http://localhost:3000/health

# Server information  
curl http://localhost:3000/api/info

# View call history
curl http://localhost:3000/api/calls

# Get specific call details
curl http://localhost:3000/api/calls/{callId}

# Manually approve pending call
curl -X POST http://localhost:3000/api/approve/{callId}
```

### 🧪 Testing Commands

#### Quick System Test
```bash
# Test read-only call (should pass immediately)
curl -s -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  http://localhost:3000/ | jq .

# Test transaction validation (will be analyzed by AI and community)
curl -s -X POST -H "Content-Type: application/json" \
  --data '{
    "jsonrpc":"2.0",
    "method":"eth_sendTransaction",
    "params":[{
      "from":"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      "to":"0x70997970C51812dc3A010C7d01b50e0d17dc79C8", 
      "value":"0x16345785D8A0000"
    }],
    "id":2
  }' \
  http://localhost:3000/ | jq .
```

#### Community System Testing
```bash
# Check if contract is deployed correctly
cast call 0x5FbDB2315678afecb367f032d93F642f64180aa3 \
  "isUserRegistered(address)" \
  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
  --rpc-url http://localhost:8545

# Register a test user (optional)
cast send 0x5FbDB2315678afecb367f032d93F642f64180aa3 \
  "registerUser(string)" "TestUser1" \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --rpc-url http://localhost:8545
```

#### Performance Testing
```bash
# Test multiple concurrent requests
for i in {1..5}; do
  curl -s -X POST -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":'$i'}' \
    http://localhost:3000/ &
done
wait

# Check call history after testing
curl -s http://localhost:3000/api/calls | jq '.total'
```

#### Comprehensive System Validation
```bash
# All-in-one system test
echo "🎯 Testing RPC Interceptor System"
echo "=================================="

echo "1. Health Check:"
curl -s http://localhost:3000/health | jq '.status'

echo "2. Read-only call test:"
curl -s -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_gasPrice","params":[],"id":1}' \
  http://localhost:3000/ | jq -r '.result // .error.message'

echo "3. Transaction validation test:"
curl -s -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_sendTransaction","params":[{"from":"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266","to":"0x70997970C51812dc3A010C7d01b50e0d17dc79C8","value":"0x16345785D8A0000"}],"id":2}' \
  http://localhost:3000/ | jq -r '.error.data.reasoning // .result'

echo "4. Total calls processed:"
curl -s http://localhost:3000/api/calls | jq -r '.total'
```

## 🎯 Expected Results

When you run the tests, you should see:

### ✅ Read-Only Calls
- **Response**: Immediate success with result (e.g., `"0x7119574f"` for gas price)
- **Processing Time**: < 5ms
- **Validation**: Bypassed (read-only methods are safe)

### 🤖 Transaction Validation
- **AI Analysis**: Detailed reasoning about transaction risk
- **Community Check**: User registration and trust score validation
- **Decision**: Combined AI + community verdict
- **Typical Response**: Rejection due to unregistered user ("User account is inactive")

### 📊 System Health
- **Status**: All services should report "online"
- **Components**: AI (Ollama), RPC (Anvil), Contract (deployed)
- **Performance**: Sub-second response times for most operations