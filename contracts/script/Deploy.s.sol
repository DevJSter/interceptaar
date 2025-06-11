// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/CommunityInteractionRating.sol";

contract DeployCommunityRating is Script {
    function run() external {
        // Use the default anvil private key
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        
        vm.startBroadcast(deployerPrivateKey);
        
        CommunityInteractionRating rating = new CommunityInteractionRating();
        
        console.log("CommunityInteractionRating deployed to:", address(rating));
        
        vm.stopBroadcast();
    }
}
