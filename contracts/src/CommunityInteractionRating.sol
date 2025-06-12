// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

contract CommunityInteractionRating {
    // QTO Token integration
    string public constant TOKEN_NAME = "QoneQt Token";
    string public constant TOKEN_SYMBOL = "QTO";
    uint8 public constant TOKEN_DECIMALS = 18;
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**TOKEN_DECIMALS; // 1 billion QTO
    
    mapping(address => uint256) public qtoBalances;
    mapping(address => mapping(address => uint256)) public qtoAllowances;
    uint256 public qtoTotalSupply = TOTAL_SUPPLY;
    
    // AI Significance System for qoneqt.com interactions
    struct SignificanceReward {
        uint256 baseAmount;      // Base reward amount in QTO (wei units)
        uint256 multiplier;      // Multiplier based on significance (0-1000, where 1000 = 1.0x)
        uint256 finalAmount;     // Final calculated reward
        string interactionType;  // Type of interaction on qoneqt.com
        string significance;     // AI-determined significance level
        uint256 timestamp;
    }
    
    mapping(address => SignificanceReward[]) public userSignificanceHistory;

    struct UserProfile {
        string username;
        uint256 likes;
        uint256 comments;
        uint256 posts;
        uint256 helpfulResponses;
        uint256 reportsReceived;
        uint256 reportsMade;
        uint256 trustScore;
        uint256 lastUpdateTime;
        bool isActive;
        uint256 rewardBalance;          // Legacy reward balance
        uint256 totalEarned;           // Total rewards earned
        uint256 validationCount;       // Number of transactions validated
        uint256 successfulValidations; // Number of successful validations
        uint256 qtoBalance;            // QTO token balance
        uint256 totalQtoEarned;        // Total QTO tokens earned
        uint256 qoneqtInteractions;    // Total interactions on qoneqt.com
        uint256 avgSignificanceScore;  // Average AI-determined significance
    }

    struct InteractionRecord {
        address user;
        string interactionType; // "like", "comment", "post", "helpful", "report", "validation"
        uint256 timestamp;
        uint256 value; // score value for this interaction
        string metadata; // additional data like post ID, comment text hash
    }

    struct RewardTier {
        uint256 minTrustScore;
        uint256 baseReward;
        uint256 validationReward;
        uint256 qtoMultiplier;         // QTO reward multiplier (1000 = 1.0x)
        string tierName;
    }

    // QoneQt.com specific interaction types
    enum QoneqtInteractionType {
        LIKE,
        COMMENT, 
        SHARE,
        POST,
        FOLLOW,
        STORY_VIEW,
        MESSAGE,
        GROUP_JOIN,
        EVENT_ATTEND,
        MARKETPLACE_PURCHASE
    }

    // Mapping for QoneQt interaction base rewards (in QTO wei)
    mapping(QoneqtInteractionType => uint256) public qoneqtBaseRewards;

    mapping(address => UserProfile) public userProfiles;
    mapping(address => InteractionRecord[]) public userInteractionHistory;
    mapping(address => mapping(address => bool)) public hasUserRatedUser;
    
    address[] public activeUsers;
    uint256 public totalInteractions;
    uint256 public totalRewardsDistributed;
    
    // Reward system
    RewardTier[] public rewardTiers;
    mapping(address => uint256) public pendingRewards;
    uint256 public constant VALIDATION_BASE_REWARD = 10; // Base reward for validation
    uint256 public constant SUCCESSFUL_VALIDATION_BONUS = 5; // Bonus for successful validation
    
    // Events
    event InteractionRecorded(address indexed user, string interactionType, uint256 value, uint256 timestamp);
    event TrustScoreUpdated(address indexed user, uint256 newScore, uint256 timestamp);
    event UserReported(address indexed reporter, address indexed reported, string reason);
    event RewardEarned(address indexed user, uint256 amount, string reason);
    event RewardClaimed(address indexed user, uint256 amount);
    event ValidationPerformed(address indexed validator, address indexed user, bool successful, uint256 reward);
    event QtoRewardEarned(address indexed user, uint256 amount, string interactionType, uint256 significance);
    event QtoTransfer(address indexed from, address indexed to, uint256 amount);
    event QoneqtInteractionProcessed(address indexed user, QoneqtInteractionType interactionType, uint256 significance, uint256 reward);

    // Interaction weights for trust score calculation
    uint256 constant LIKE_WEIGHT = 1;
    uint256 constant COMMENT_WEIGHT = 3;
    uint256 constant POST_WEIGHT = 5;
    uint256 constant HELPFUL_WEIGHT = 10;
    uint256 constant REPORT_PENALTY = 20;
    uint256 constant VALIDATION_WEIGHT = 2;

    modifier onlyActiveUser() {
        require(userProfiles[msg.sender].isActive, "User not active");
        _;
    }

    constructor() {
        // Give contract the initial QTO supply for distribution
        qtoBalances[address(this)] = TOTAL_SUPPLY;
        
        // Initialize reward tiers with QTO multipliers
        rewardTiers.push(RewardTier(0, 1, 2, 800, "Bronze"));      // 0-99 trust score, 0.8x multiplier
        rewardTiers.push(RewardTier(100, 3, 5, 1000, "Silver"));   // 100-499 trust score, 1.0x multiplier
        rewardTiers.push(RewardTier(500, 5, 10, 1200, "Gold"));    // 500-999 trust score, 1.2x multiplier
        rewardTiers.push(RewardTier(1000, 10, 20, 1500, "Platinum")); // 1000+ trust score, 1.5x multiplier
        
        // Initialize QoneQt interaction base rewards (in QTO wei - 18 decimals)
        qoneqtBaseRewards[QoneqtInteractionType.LIKE] = 1 * 10**15;  // 0.001 QTO
        qoneqtBaseRewards[QoneqtInteractionType.COMMENT] = 5 * 10**15; // 0.005 QTO
        qoneqtBaseRewards[QoneqtInteractionType.SHARE] = 3 * 10**15;   // 0.003 QTO
        qoneqtBaseRewards[QoneqtInteractionType.POST] = 10 * 10**15;   // 0.01 QTO
        qoneqtBaseRewards[QoneqtInteractionType.FOLLOW] = 2 * 10**15;  // 0.002 QTO
        qoneqtBaseRewards[QoneqtInteractionType.STORY_VIEW] = 1 * 10**14; // 0.0001 QTO
        qoneqtBaseRewards[QoneqtInteractionType.MESSAGE] = 2 * 10**15;    // 0.002 QTO
        qoneqtBaseRewards[QoneqtInteractionType.GROUP_JOIN] = 8 * 10**15; // 0.008 QTO
        qoneqtBaseRewards[QoneqtInteractionType.EVENT_ATTEND] = 15 * 10**15; // 0.015 QTO
        qoneqtBaseRewards[QoneqtInteractionType.MARKETPLACE_PURCHASE] = 25 * 10**15; // 0.025 QTO
    }

    function registerUser(string memory username) external {
        require(!userProfiles[msg.sender].isActive, "User already registered");
        
        userProfiles[msg.sender] = UserProfile({
            username: username,
            likes: 0,
            comments: 0,
            posts: 0,
            helpfulResponses: 0,
            reportsReceived: 0,
            reportsMade: 0,
            trustScore: 100, // Starting trust score
            lastUpdateTime: block.timestamp,
            isActive: true,
            rewardBalance: 0,
            totalEarned: 0,
            validationCount: 0,
            successfulValidations: 0,
            qtoBalance: 0,
            totalQtoEarned: 0,
            qoneqtInteractions: 0,
            avgSignificanceScore: 0
        });

        activeUsers.push(msg.sender);
        emit TrustScoreUpdated(msg.sender, 100, block.timestamp);
    }

    // QTO Token Functions
    function qtoBalanceOf(address account) external view returns (uint256) {
        return qtoBalances[account];
    }
    
    function qtoTransfer(address to, uint256 amount) external returns (bool) {
        require(qtoBalances[msg.sender] >= amount, "Insufficient QTO balance");
        require(to != address(0), "Cannot transfer to zero address");
        
        qtoBalances[msg.sender] -= amount;
        qtoBalances[to] += amount;
        
        emit QtoTransfer(msg.sender, to, amount);
        return true;
    }
    
    function qtoApprove(address spender, uint256 amount) external returns (bool) {
        qtoAllowances[msg.sender][spender] = amount;
        return true;
    }
    
    function qtoAllowance(address owner, address spender) external view returns (uint256) {
        return qtoAllowances[owner][spender];
    }
    
    // QoneQt.com Interaction Processing with AI Significance
    function processQoneqtInteraction(
        address user,
        QoneqtInteractionType interactionType,
        uint256 aiSignificance, // Value from 0-1000 (0.000 to 1.000)
        string memory /* metadata */
    ) external onlyActiveUser {
        require(userProfiles[user].isActive, "Target user not active");
        require(aiSignificance <= 1000, "Significance must be 0-1000");
        
        // Calculate base reward for this interaction type
        uint256 baseReward = qoneqtBaseRewards[interactionType];
        
        // Apply AI significance multiplier
        uint256 significanceMultiplier = aiSignificance; // 0-1000 where 1000 = 1.0x
        uint256 significanceReward = (baseReward * significanceMultiplier) / 1000;
        
        // Apply user tier multiplier
        RewardTier memory userTier = _getUserTier(user);
        uint256 tierMultipliedReward = (significanceReward * userTier.qtoMultiplier) / 1000;
        
        // Record the significance reward
        SignificanceReward memory reward = SignificanceReward({
            baseAmount: baseReward,
            multiplier: significanceMultiplier,
            finalAmount: tierMultipliedReward,
            interactionType: _getInteractionTypeName(interactionType),
            significance: _getSignificanceLevel(aiSignificance),
            timestamp: block.timestamp
        });
        
        userSignificanceHistory[user].push(reward);
        
        // Update user profile
        UserProfile storage profile = userProfiles[user];
        profile.qtoBalance += tierMultipliedReward;
        profile.totalQtoEarned += tierMultipliedReward;
        profile.qoneqtInteractions++;
        
        // Update average significance score
        uint256 totalSignificance = profile.avgSignificanceScore * (profile.qoneqtInteractions - 1);
        profile.avgSignificanceScore = (totalSignificance + aiSignificance) / profile.qoneqtInteractions;
        
        // Update trust score based on interaction
        _updateTrustScoreFromQoneqt(user, interactionType, aiSignificance);
        
        // Add to QTO total supply in circulation
        qtoBalances[user] += tierMultipliedReward;
        
        emit QtoRewardEarned(user, tierMultipliedReward, _getInteractionTypeName(interactionType), aiSignificance);
        emit QoneqtInteractionProcessed(user, interactionType, aiSignificance, tierMultipliedReward);
    }
    
    // Batch process multiple interactions (for efficiency)
    function batchProcessQoneqtInteractions(
        address[] memory users,
        QoneqtInteractionType[] memory interactionTypes,
        uint256[] memory aiSignificances,
        string[] memory metadatas
    ) external onlyActiveUser {
        require(users.length == interactionTypes.length, "Array length mismatch");
        require(users.length == aiSignificances.length, "Array length mismatch");
        require(users.length == metadatas.length, "Array length mismatch");
        
        for (uint256 i = 0; i < users.length; i++) {
            _processQoneqtInteractionInternal(users[i], interactionTypes[i], aiSignificances[i], metadatas[i]);
        }
    }

    // Internal function for processing QoneQt interactions
    function _processQoneqtInteractionInternal(
        address user,
        QoneqtInteractionType interactionType,
        uint256 aiSignificance,
        string memory /* metadata */
    ) internal {
        require(userProfiles[user].isActive, "Target user not active");
        require(aiSignificance <= 1000, "Significance must be 0-1000");
        
        // Calculate base reward for this interaction type
        uint256 baseReward = qoneqtBaseRewards[interactionType];
        
        // Apply AI significance multiplier
        uint256 significanceMultiplier = aiSignificance; // 0-1000 where 1000 = 1.0x
        uint256 significanceReward = (baseReward * significanceMultiplier) / 1000;
        
        // Apply user tier multiplier
        RewardTier memory userTier = _getUserTier(user);
        uint256 tierMultipliedReward = (significanceReward * userTier.qtoMultiplier) / 1000;
        
        // Record the significance reward
        SignificanceReward memory reward = SignificanceReward({
            baseAmount: baseReward,
            multiplier: significanceMultiplier,
            finalAmount: tierMultipliedReward,
            interactionType: _getInteractionTypeName(interactionType),
            significance: _getSignificanceLevel(aiSignificance),
            timestamp: block.timestamp
        });
        
        userSignificanceHistory[user].push(reward);
        
        // Update user profile
        UserProfile storage profile = userProfiles[user];
        profile.qtoBalance += tierMultipliedReward;
        profile.totalQtoEarned += tierMultipliedReward;
        profile.qoneqtInteractions++;
        
        // Update average significance score
        uint256 totalSignificance = profile.avgSignificanceScore * (profile.qoneqtInteractions - 1);
        profile.avgSignificanceScore = (totalSignificance + aiSignificance) / profile.qoneqtInteractions;
        
        // Update trust score based on interaction
        _updateTrustScoreFromQoneqt(user, interactionType, aiSignificance);
        
        // Add to QTO total supply in circulation
        qtoBalances[user] += tierMultipliedReward;
        
        emit QtoRewardEarned(user, tierMultipliedReward, _getInteractionTypeName(interactionType), aiSignificance);
        emit QoneqtInteractionProcessed(user, interactionType, aiSignificance, tierMultipliedReward);
    }

    // Get user's QoneQt interaction history
    function getUserSignificanceHistory(address user) external view returns (SignificanceReward[] memory) {
        return userSignificanceHistory[user];
    }
    
    // Get user's QTO reward statistics
    function getQtoRewardStats(address user) external view returns (
        uint256 qtoBalance,
        uint256 totalQtoEarned,
        uint256 qoneqtInteractions,
        uint256 avgSignificanceScore,
        string memory currentTier
    ) {
        UserProfile memory profile = userProfiles[user];
        RewardTier memory tier = _getUserTier(user);
        
        return (
            profile.qtoBalance,
            profile.totalQtoEarned,
            profile.qoneqtInteractions,
            profile.avgSignificanceScore,
            tier.tierName
        );
    }
    
    // Get interaction type base reward
    function getInteractionBaseReward(QoneqtInteractionType interactionType) external view returns (uint256) {
        return qoneqtBaseRewards[interactionType];
    }
    
    // Estimate reward for an interaction
    function estimateQtoReward(
        address user,
        QoneqtInteractionType interactionType,
        uint256 aiSignificance
    ) external view returns (uint256) {
        uint256 baseReward = qoneqtBaseRewards[interactionType];
        uint256 significanceReward = (baseReward * aiSignificance) / 1000;
        RewardTier memory userTier = _getUserTier(user);
        return (significanceReward * userTier.qtoMultiplier) / 1000;
    }

    // Legacy functions (kept for compatibility)
    function recordLike(string memory postId) external onlyActiveUser {
        _recordInteraction(msg.sender, "like", LIKE_WEIGHT, postId);
        userProfiles[msg.sender].likes++;
        _updateTrustScore(msg.sender);
    }

    function recordComment(string memory commentText) external onlyActiveUser {
        _recordInteraction(msg.sender, "comment", COMMENT_WEIGHT, commentText);
        userProfiles[msg.sender].comments++;
        _updateTrustScore(msg.sender);
    }

    function recordPost(string memory postTitle) external onlyActiveUser {
        _recordInteraction(msg.sender, "post", POST_WEIGHT, postTitle);
        userProfiles[msg.sender].posts++;
        _updateTrustScore(msg.sender);
    }

    function recordHelpfulResponse(address helper) external onlyActiveUser {
        require(helper != msg.sender, "Cannot mark own response as helpful");
        require(!hasUserRatedUser[msg.sender][helper], "Already rated this user");
        
        _recordInteraction(helper, "helpful", HELPFUL_WEIGHT, "Helpful response");
        userProfiles[helper].helpfulResponses++;
        hasUserRatedUser[msg.sender][helper] = true;
        _updateTrustScore(helper);
    }

    function reportUser(address reportedUser, string memory reason) external onlyActiveUser {
        require(reportedUser != msg.sender, "Cannot report yourself");
        require(userProfiles[reportedUser].isActive, "Reported user not active");
        
        _recordInteraction(reportedUser, "report", 0, reason);
        userProfiles[reportedUser].reportsReceived++;
        userProfiles[msg.sender].reportsMade++;
        
        _updateTrustScore(reportedUser);
        emit UserReported(msg.sender, reportedUser, reason);
    }

    function recordValidation(address validator, address user, bool successful) external onlyActiveUser {
        require(validator == msg.sender, "Can only record own validations");
        
        UserProfile storage validatorProfile = userProfiles[validator];
        validatorProfile.validationCount++;
        
        uint256 reward = VALIDATION_BASE_REWARD;
        
        if (successful) {
            validatorProfile.successfulValidations++;
            reward += SUCCESSFUL_VALIDATION_BONUS;
        }
        
        // Apply tier multiplier
        RewardTier memory tier = _getUserTier(validator);
        reward = (reward * tier.validationReward) / tier.baseReward;
        
        _recordInteraction(validator, "validation", VALIDATION_WEIGHT, successful ? "successful" : "failed");
        _awardReward(validator, reward, "Transaction validation");
        _updateTrustScore(validator);
        
        emit ValidationPerformed(validator, user, successful, reward);
    }
    
    function awardCommunityReward(address user, uint256 amount, string memory reason) external onlyActiveUser {
        require(userProfiles[user].isActive, "User not active");
        _awardReward(user, amount, reason);
    }
    
    function claimRewards() external onlyActiveUser {
        uint256 amount = pendingRewards[msg.sender];
        require(amount > 0, "No rewards to claim");
        
        pendingRewards[msg.sender] = 0;
        userProfiles[msg.sender].rewardBalance += amount;
        
        emit RewardClaimed(msg.sender, amount);
    }
    
    function withdrawRewards(uint256 amount) external onlyActiveUser {
        require(userProfiles[msg.sender].rewardBalance >= amount, "Insufficient reward balance");
        
        userProfiles[msg.sender].rewardBalance -= amount;
        
        emit RewardClaimed(msg.sender, amount);
    }
    
    function getUserProfile(address user) external view returns (UserProfile memory) {
        return userProfiles[user];
    }

    function getUserInteractionHistory(address user) external view returns (InteractionRecord[] memory) {
        return userInteractionHistory[user];
    }

    function getTrustScoreForValidation(address user) external view returns (uint256) {
        if (!userProfiles[user].isActive) {
            return 0;
        }
        return userProfiles[user].trustScore;
    }

    function getUserTier(address user) external view returns (RewardTier memory) {
        return _getUserTier(user);
    }
    
    function getRewardInfo(address user) external view returns (
        uint256 rewardBalance,
        uint256 totalEarned,
        uint256 pendingReward,
        uint256 validationCount,
        uint256 successfulValidations,
        string memory tierName
    ) {
        UserProfile memory profile = userProfiles[user];
        RewardTier memory tier = _getUserTier(user);
        
        return (
            profile.rewardBalance,
            profile.totalEarned,
            pendingRewards[user],
            profile.validationCount,
            profile.successfulValidations,
            tier.tierName
        );
    }
    
    function getTotalRewardsDistributed() external view returns (uint256) {
        return totalRewardsDistributed;
    }

    function getCommunityStats() external view returns (
        uint256 totalUsers,
        uint256 totalInteractionsCount,
        uint256 averageTrustScore
    ) {
        totalUsers = activeUsers.length;
        totalInteractionsCount = totalInteractions;
        
        if (totalUsers == 0) {
            averageTrustScore = 0;
        } else {
            uint256 totalTrust = 0;
            for (uint256 i = 0; i < activeUsers.length; i++) {
                totalTrust += userProfiles[activeUsers[i]].trustScore;
            }
            averageTrustScore = totalTrust / totalUsers;
        }
    }

    // QTO Token information functions
    function getQtoTokenInfo() external pure returns (
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint256 totalSupply
    ) {
        return (TOKEN_NAME, TOKEN_SYMBOL, TOKEN_DECIMALS, TOTAL_SUPPLY);
    }

    // Global QTO statistics
    function getGlobalQtoStats() external view returns (
        uint256 totalQtoInCirculation,
        uint256 totalQoneqtInteractions,
        uint256 averageSignificanceScore,
        uint256 totalUsersWithQto
    ) {
        uint256 totalInCirculation = 0;
        uint256 totalQoneqtInteractionsCount = 0;
        uint256 totalSignificance = 0;
        uint256 usersWithQto = 0;
        
        for (uint256 i = 0; i < activeUsers.length; i++) {
            UserProfile storage profile = userProfiles[activeUsers[i]];
            totalInCirculation += profile.qtoBalance;
            totalQoneqtInteractionsCount += profile.qoneqtInteractions;
            
            if (profile.qoneqtInteractions > 0) {
                totalSignificance += profile.avgSignificanceScore;
                usersWithQto++;
            }
        }
        
        uint256 avgSignificance = usersWithQto > 0 ? totalSignificance / usersWithQto : 0;
        
        return (totalInCirculation, totalQoneqtInteractionsCount, avgSignificance, usersWithQto);
    }

    // Helper functions for QoneQt interactions
    function _getInteractionTypeName(QoneqtInteractionType interactionType) internal pure returns (string memory) {
        if (interactionType == QoneqtInteractionType.LIKE) return "like";
        if (interactionType == QoneqtInteractionType.COMMENT) return "comment";
        if (interactionType == QoneqtInteractionType.SHARE) return "share";
        if (interactionType == QoneqtInteractionType.POST) return "post";
        if (interactionType == QoneqtInteractionType.FOLLOW) return "follow";
        if (interactionType == QoneqtInteractionType.STORY_VIEW) return "story_view";
        if (interactionType == QoneqtInteractionType.MESSAGE) return "message";
        if (interactionType == QoneqtInteractionType.GROUP_JOIN) return "group_join";
        if (interactionType == QoneqtInteractionType.EVENT_ATTEND) return "event_attend";
        if (interactionType == QoneqtInteractionType.MARKETPLACE_PURCHASE) return "marketplace_purchase";
        return "unknown";
    }
    
    function _getSignificanceLevel(uint256 aiSignificance) internal pure returns (string memory) {
        if (aiSignificance >= 800) return "Very High (0.800-1.000)";
        if (aiSignificance >= 600) return "High (0.600-0.799)";
        if (aiSignificance >= 400) return "Medium (0.400-0.599)";
        if (aiSignificance >= 200) return "Low (0.200-0.399)";
        return "Very Low (0.000-0.199)";
    }
    
    function _updateTrustScoreFromQoneqt(address user, QoneqtInteractionType interactionType, uint256 aiSignificance) internal {
        UserProfile storage profile = userProfiles[user];
        
        // Calculate trust score boost based on interaction type and AI significance
        uint256 trustBoost = 0;
        
        if (interactionType == QoneqtInteractionType.LIKE) {
            trustBoost = (aiSignificance * 1) / 1000; // Max 1 point for likes
        } else if (interactionType == QoneqtInteractionType.COMMENT) {
            trustBoost = (aiSignificance * 3) / 1000; // Max 3 points for comments
        } else if (interactionType == QoneqtInteractionType.SHARE) {
            trustBoost = (aiSignificance * 2) / 1000; // Max 2 points for shares
        } else if (interactionType == QoneqtInteractionType.POST) {
            trustBoost = (aiSignificance * 5) / 1000; // Max 5 points for posts
        } else if (interactionType == QoneqtInteractionType.FOLLOW) {
            trustBoost = (aiSignificance * 2) / 1000; // Max 2 points for follows
        } else if (interactionType == QoneqtInteractionType.STORY_VIEW) {
            trustBoost = (aiSignificance * 1) / 1000; // Max 1 point for story views
        } else if (interactionType == QoneqtInteractionType.MESSAGE) {
            trustBoost = (aiSignificance * 2) / 1000; // Max 2 points for messages
        } else if (interactionType == QoneqtInteractionType.GROUP_JOIN) {
            trustBoost = (aiSignificance * 4) / 1000; // Max 4 points for group joins
        } else if (interactionType == QoneqtInteractionType.EVENT_ATTEND) {
            trustBoost = (aiSignificance * 6) / 1000; // Max 6 points for event attendance
        } else if (interactionType == QoneqtInteractionType.MARKETPLACE_PURCHASE) {
            trustBoost = (aiSignificance * 8) / 1000; // Max 8 points for purchases
        }
        
        // Apply trust score boost (max 1000)
        if (profile.trustScore + trustBoost > 1000) {
            profile.trustScore = 1000;
        } else {
            profile.trustScore += trustBoost;
        }
        
        profile.lastUpdateTime = block.timestamp;
        emit TrustScoreUpdated(user, profile.trustScore, block.timestamp);
    }

    // Internal functions
    function _recordInteraction(address user, string memory interactionType, uint256 value, string memory metadata) internal {
        InteractionRecord memory record = InteractionRecord({
            user: user,
            interactionType: interactionType,
            timestamp: block.timestamp,
            value: value,
            metadata: metadata
        });
        
        userInteractionHistory[user].push(record);
        totalInteractions++;
        
        emit InteractionRecorded(user, interactionType, value, block.timestamp);
    }

    function _awardReward(address user, uint256 amount, string memory reason) internal {
        UserProfile storage profile = userProfiles[user];
        
        // Convert amount to QTO wei (18 decimals)
        uint256 qtoAmount = amount * 10**18;
        
        // Apply tier multiplier
        RewardTier memory tier = _getUserTier(user);
        uint256 finalAmount = (qtoAmount * tier.qtoMultiplier) / 1000; // qtoMultiplier is in basis points
        
        // Check if contract has enough QTO tokens
        require(qtoBalances[address(this)] >= finalAmount, "Contract insufficient QTO balance");
        
        // Transfer actual QTO tokens from contract to user
        qtoBalances[address(this)] -= finalAmount;
        qtoBalances[user] += finalAmount;
        
        // Update tracking
        profile.qtoBalance += finalAmount;
        profile.totalQtoEarned += finalAmount;
        profile.totalEarned += amount; // Keep legacy tracking
        totalRewardsDistributed += amount;
        
        emit QtoTransfer(address(this), user, finalAmount);
        emit RewardEarned(user, finalAmount, reason);
    }
    
    function _getUserTier(address user) internal view returns (RewardTier memory) {
        uint256 trustScore = userProfiles[user].trustScore;
        
        // Find the appropriate tier (highest tier that user qualifies for)
        RewardTier memory userTier = rewardTiers[0]; // Default to Bronze
        
        for (uint256 i = 0; i < rewardTiers.length; i++) {
            if (trustScore >= rewardTiers[i].minTrustScore) {
                userTier = rewardTiers[i];
            }
        }
        
        return userTier;
    }

    function _updateTrustScore(address user) internal {
        UserProfile storage profile = userProfiles[user];
        
        // Calculate new trust score based on interactions (including validations)
        uint256 positiveScore = (profile.likes * LIKE_WEIGHT) +
                               (profile.comments * COMMENT_WEIGHT) +
                               (profile.posts * POST_WEIGHT) +
                               (profile.helpfulResponses * HELPFUL_WEIGHT) +
                               (profile.validationCount * VALIDATION_WEIGHT);
        
        uint256 negativeScore = profile.reportsReceived * REPORT_PENALTY;
        
        // Calculate final score (minimum 0, maximum 1000)
        uint256 newScore;
        if (positiveScore > negativeScore) {
            newScore = 100 + (positiveScore - negativeScore);
            if (newScore > 1000) {
                newScore = 1000;
            }
        } else {
            newScore = 0;
        }
        
        profile.trustScore = newScore;
        profile.lastUpdateTime = block.timestamp;
        
        emit TrustScoreUpdated(user, newScore, block.timestamp);
    }
    
    // QTO Contract Management Functions
    function getContractQtoBalance() external view returns (uint256) {
        return qtoBalances[address(this)];
    }
    
    function fundContractQto(uint256 amount) external {
        require(qtoBalances[msg.sender] >= amount, "Insufficient QTO balance");
        
        qtoBalances[msg.sender] -= amount;
        qtoBalances[address(this)] += amount;
        
        emit QtoTransfer(msg.sender, address(this), amount);
    }
    
    function emergencyWithdrawQto(address to, uint256 amount) external {
        // In a real implementation, this would need proper access control
        require(qtoBalances[address(this)] >= amount, "Contract insufficient QTO balance");
        
        qtoBalances[address(this)] -= amount;
        qtoBalances[to] += amount;
        
        emit QtoTransfer(address(this), to, amount);
    }
    
    // QTO token utility functions
    function mintQtoToContract(uint256 amount) external {
        // In a real implementation, this would need proper access control
        qtoBalances[address(this)] += amount;
        qtoTotalSupply += amount;
        
        emit QtoTransfer(address(0), address(this), amount);
    }
}
