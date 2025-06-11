// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Test.sol";

contract CommunityInteractionRating {
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
        uint256 rewardBalance;          // NEW: User's reward balance
        uint256 totalEarned;           // NEW: Total rewards earned
        uint256 validationCount;       // NEW: Number of transactions validated
        uint256 successfulValidations; // NEW: Number of successful validations
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
        string tierName;
    }

    mapping(address => UserProfile) public userProfiles;
    mapping(address => InteractionRecord[]) public userInteractionHistory;
    mapping(address => mapping(address => bool)) public hasUserRatedUser;
    
    address[] public activeUsers;
    uint256 public totalInteractions;
    uint256 public totalRewardsDistributed;
    
    // NEW: Reward system
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

    // Interaction weights for trust score calculation
    uint256 constant LIKE_WEIGHT = 1;
    uint256 constant COMMENT_WEIGHT = 3;
    uint256 constant POST_WEIGHT = 5;
    uint256 constant HELPFUL_WEIGHT = 10;
    uint256 constant REPORT_PENALTY = 20;
    uint256 constant VALIDATION_WEIGHT = 2; // NEW: Weight for validation activities

    modifier onlyActiveUser() {
        require(userProfiles[msg.sender].isActive, "User not active");
        _;
    }

    constructor() {
        // Initialize reward tiers
        rewardTiers.push(RewardTier(0, 1, 2, "Bronze"));      // 0-99 trust score
        rewardTiers.push(RewardTier(100, 3, 5, "Silver"));    // 100-499 trust score
        rewardTiers.push(RewardTier(500, 5, 10, "Gold"));     // 500-999 trust score
        rewardTiers.push(RewardTier(1000, 10, 20, "Platinum")); // 1000+ trust score
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
            successfulValidations: 0
        });
        
        activeUsers.push(msg.sender);
        emit TrustScoreUpdated(msg.sender, 100, block.timestamp);
    }

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

    function getTopUsersNyTrustScore(uint256 limit) external view returns (address[] memory topUsers, uint256[] memory scores) {
        uint256 userCount = activeUsers.length;
        if (limit > userCount) {
            limit = userCount;
        }
        
        topUsers = new address[](limit);
        scores = new uint256[](limit);
        
        // Simple bubble sort for demonstration (would use more efficient sorting in production)
        address[] memory sortedUsers = new address[](userCount);
        uint256[] memory sortedScores = new uint256[](userCount);
        
        for (uint256 i = 0; i < userCount; i++) {
            sortedUsers[i] = activeUsers[i];
            sortedScores[i] = userProfiles[activeUsers[i]].trustScore;
        }
        
        // Sort by trust score (descending)
        for (uint256 i = 0; i < userCount - 1; i++) {
            for (uint256 j = 0; j < userCount - i - 1; j++) {
                if (sortedScores[j] < sortedScores[j + 1]) {
                    // Swap scores
                    uint256 tempScore = sortedScores[j];
                    sortedScores[j] = sortedScores[j + 1];
                    sortedScores[j + 1] = tempScore;
                    
                    // Swap addresses
                    address tempAddr = sortedUsers[j];
                    sortedUsers[j] = sortedUsers[j + 1];
                    sortedUsers[j + 1] = tempAddr;
                }
            }
        }
        
        for (uint256 i = 0; i < limit; i++) {
            topUsers[i] = sortedUsers[i];
            scores[i] = sortedScores[i];
        }
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

    // NEW: Reward and validation functions
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
        
        // In a real implementation, this would transfer tokens/ETH to the user
        // For this demo, we just emit an event
        emit RewardClaimed(msg.sender, amount);
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
    
    function _awardReward(address user, uint256 amount, string memory reason) internal {
        UserProfile storage profile = userProfiles[user];
        
        // Apply tier multiplier
        RewardTier memory tier = _getUserTier(user);
        uint256 finalAmount = (amount * tier.baseReward);
        
        pendingRewards[user] += finalAmount;
        profile.totalEarned += finalAmount;
        totalRewardsDistributed += finalAmount;
        
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
}
