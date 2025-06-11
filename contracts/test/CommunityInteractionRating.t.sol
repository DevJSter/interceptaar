// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/CommunityInteractionRating.sol";

contract CommunityInteractionRatingTest is Test {
    CommunityInteractionRating public rating;
    address public user1 = address(0x1);
    address public user2 = address(0x2);
    address public user3 = address(0x3);

    function setUp() public {
        rating = new CommunityInteractionRating();
    }

    function testUserRegistration() public {
        vm.prank(user1);
        rating.registerUser("user1");
        
        CommunityInteractionRating.UserProfile memory profile = rating.getUserProfile(user1);
        assertEq(profile.trustScore, 100);
        assertEq(profile.isActive, true);
        assertEq(profile.likes, 0);
    }

    function testRecordInteractions() public {
        // Register users
        vm.prank(user1);
        rating.registerUser("user1");
        
        vm.prank(user2);
        rating.registerUser("user2");

        // User1 records a like
        vm.prank(user1);
        rating.recordLike("post123");
        
        // User1 records a comment
        vm.prank(user1);
        rating.recordComment("Great post!");
        
        // User1 records a post
        vm.prank(user1);
        rating.recordPost("My first post");

        CommunityInteractionRating.UserProfile memory profile = rating.getUserProfile(user1);
        assertEq(profile.likes, 1);
        assertEq(profile.comments, 1);
        assertEq(profile.posts, 1);
        assertGt(profile.trustScore, 100); // Should be higher than initial
    }

    function testHelpfulResponse() public {
        // Register users
        vm.prank(user1);
        rating.registerUser("user1");
        
        vm.prank(user2);
        rating.registerUser("user2");

        // User1 marks user2's response as helpful
        vm.prank(user1);
        rating.recordHelpfulResponse(user2);

        CommunityInteractionRating.UserProfile memory profile = rating.getUserProfile(user2);
        assertEq(profile.helpfulResponses, 1);
        assertGt(profile.trustScore, 100);
    }
}
