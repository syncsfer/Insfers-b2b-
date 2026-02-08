// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/ChainPayments.sol";
import "../src/ClaimableRefund.sol";
import "../src/Subscriptions.sol";
import "../src/ConnectSplits.sol";
import "../src/Payouts.sol";

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

        // ── Deploy ChainPayments (no USDC required at construction) ──
        ChainPayments chainPayments = new ChainPayments(deployer);
        console.log("ChainPayments deployed to:", address(chainPayments));

        // ── Deploy ClaimableRefund (no USDC required at construction) ──
        ClaimableRefund claimableRefund = new ClaimableRefund();
        console.log("ClaimableRefund deployed to:", address(claimableRefund));

        // ── Read USDC address from environment ──
        address usdcAddr = address(0);
        try vm.envAddress("USDC_ADDRESS") returns (address _usdcAddr) {
            usdcAddr = _usdcAddr;
        } catch {}

        // Variables for conditionally-deployed contracts
        Subscriptions subscriptions;
        ConnectSplits connectSplits;
        Payouts payouts;

        if (usdcAddr != address(0)) {
            // Wire USDC into ChainPayments and ClaimableRefund
            chainPayments.setUSDC(usdcAddr);
            claimableRefund.setUSDC(usdcAddr);
            console.log("USDC configured:", usdcAddr);

            // ── Deploy Subscriptions (requires USDC at construction) ──
            subscriptions = new Subscriptions(deployer, usdcAddr);
            console.log("Subscriptions deployed to:", address(subscriptions));

            // ── Deploy ConnectSplits (requires USDC at construction) ──
            // Default platform fee: 250 bps = 2.5%
            uint256 defaultPlatformFeeBps = 250;
            connectSplits = new ConnectSplits(deployer, usdcAddr, defaultPlatformFeeBps);
            console.log("ConnectSplits deployed to:", address(connectSplits));

            // ── Deploy Payouts (requires USDC at construction) ──
            payouts = new Payouts(deployer, usdcAddr);
            console.log("Payouts deployed to:", address(payouts));
        } else {
            console.log("USDC_ADDRESS not set -- skipping USDC configuration");
            console.log("Subscriptions, ConnectSplits, and Payouts require USDC at construction -- skipped");
        }

        vm.stopBroadcast();

        console.log("");
        console.log("=== Deployment Summary ===");
        console.log("ChainPayments:   ", address(chainPayments));
        console.log("ClaimableRefund:  ", address(claimableRefund));
        if (usdcAddr != address(0)) {
            console.log("Subscriptions:   ", address(subscriptions));
            console.log("ConnectSplits:   ", address(connectSplits));
            console.log("Payouts:         ", address(payouts));
            console.log("USDC:            ", usdcAddr);
        }
        console.log("");
        console.log("Next steps:");
        if (usdcAddr == address(0)) {
            console.log("1. Set USDC_ADDRESS env var and redeploy for the full suite");
        }
        console.log("2. Register merchants: chainPayments.registerMerchant(merchant, wallet)");
        console.log("3. Update .env with deployed addresses");
    }
}
