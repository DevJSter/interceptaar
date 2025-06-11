// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Test.sol";

contract CommunityInteractionRating {
    struct UserProfile {
        uint256 likes;
        uint256 comments;
        uint256 posts;
        uint256 helpfulResponses;
        uint256 reportsReceived;
        uint256 reportsMade;
        uint256 trustScore;
        uint256 lastUpdateTime;
        bool isActive;
    }

    struct InteractionRecord {
        address user;
        string interactionType; // "like", "comment", "post", "helpful", "report"
        uint256 timestamp;
        uint256 value; // score value for this interaction
        string metadata; // additional data like post ID, comment text hash
    }

    mapping(address => UserProfile) public userProfiles;
    mapping(address => InteractionRecord[]) public userInteractionHistory;
    mapping(address => mapping(address => bool)) public hasUserRatedUser;
    
    address[] public activeUsers;
    uint256 public totalInteractions;
    
    // Events
    event InteractionRecorded(address indexed user, string interactionType, uint256 value, uint256 timestamp);
    event TrustScoreUpdated(address indexed user, uint256 newScore, uint256 timestamp);
    event UserReported(address indexed reporter, address indexed reported, string reason);

    // Interaction weights for trust score calculation
    uint256 constant LIKE_WEIGHT = 1;
    uint256 constant COMMENT_WEIGHT = 3;
    uint256 constant POST_WEIGHT = 5;
    uint256 constant HELPFUL_WEIGHT = 10;
    uint256 constant REPORT_PENALTY = 20;

    modifier onlyActiveUser() {
        require(userProfiles[msg.sender].isActive, "User not active");
        _;
    }

    constructor() {}

    function registerUser() external {
        require(!userProfiles[msg.sender].isActive, "User already registered");
        
        userProfiles[msg.sender] = UserProfile({
            likes: 0,
            comments: 0,
            posts: 0,
            helpfulResponses: 0,
            reportsReceived: 0,
            reportsMade: 0,
            trustScore: 100, // Starting trust score
            lastUpdateTime: block.timestamp,
            isActive: true
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

    function _updateTrustScore(address user) internal {
        UserProfile storage profile = userProfiles[user];
        
        // Calculate new trust score based on interactions
        uint256 positiveScore = (profile.likes * LIKE_WEIGHT) +
                               (profile.comments * COMMENT_WEIGHT) +
                               (profile.posts * POST_WEIGHT) +
                               (profile.helpfulResponses * HELPFUL_WEIGHT);
        
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
