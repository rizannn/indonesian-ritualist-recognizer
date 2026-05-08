// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/RitualistRecognizer.sol";

contract DeployRitualistRecognizer is Script {
    function run() external returns (RitualistRecognizer recognizer) {
        vm.startBroadcast();
        recognizer = new RitualistRecognizer();
        vm.stopBroadcast();
    }
}
