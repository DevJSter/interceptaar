// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/CommunityInteractionRating.sol";

contract DeployCommunityRating is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        CommunityInteractionRating rating = new CommunityInteractionRating();
        
        console.log("CommunityInteractionRating deployed to:", address(rating));
        
        vm.stopBroadcast();
    }
}
