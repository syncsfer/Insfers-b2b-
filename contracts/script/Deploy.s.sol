// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/ChainPayments.sol";
import "../src/ClaimableRefund.sol";

/// @title DeployChainPayments
/// @notice Deployment script for Arc Testnet.
///         Usage: forge script script/Deploy.s.sol:DeployChainPayments \
///                --rpc-url $ARC_TESTNET_RPC_URL --private-key $PRIVATE_KEY --broadcast
contract DeployChainPayments is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deployer:", deployer);
        console.log("Deployer balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy ChainPayments with deployer as owner
        ChainPayments chainPayments = new ChainPayments(deployer);
        console.log("ChainPayments deployed to:", address(chainPayments));

        // Deploy ClaimableRefund
        ClaimableRefund claimableRefund = new ClaimableRefund();
        console.log("ClaimableRefund deployed to:", address(claimableRefund));

        // If USDC address is set in env, configure it
        try vm.envAddress("USDC_ADDRESS") returns (address usdcAddr) {
            if (usdcAddr != address(0)) {
                chainPayments.setUSDC(usdcAddr);
                claimableRefund.setUSDC(usdcAddr);
                console.log("USDC configured:", usdcAddr);
            }
        } catch {
            console.log("USDC_ADDRESS not set, skipping USDC configuration");
        }

        vm.stopBroadcast();

        console.log("");
        console.log("=== Deployment Summary ===");
        console.log("ChainPayments:   ", address(chainPayments));
        console.log("ClaimableRefund:  ", address(claimableRefund));
        console.log("");
        console.log("Next steps:");
        console.log("1. Set USDC address: chainPayments.setUSDC(usdcAddress)");
        console.log("2. Register merchants: chainPayments.registerMerchant(merchant, wallet)");
        console.log("3. Update .env with deployed addresses");
    }
}
