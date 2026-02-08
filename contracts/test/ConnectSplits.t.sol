// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/ConnectSplits.sol";
import "../src/mocks/MockUSDC.sol";

contract ConnectSplitsTest is Test {
    ConnectSplits public splits;
    MockUSDC public usdc;

    address owner = address(1);
    address payer = address(2);
    address sellerA = address(3);
    address sellerB = address(4);
    address walletA = address(5);
    address walletB = address(6);

    uint256 platformFeeBps = 250; // 2.5%

    bytes32 paymentId = keccak256("split_001");

    function setUp() public {
        usdc = new MockUSDC();

        vm.prank(owner);
        splits = new ConnectSplits(owner, address(usdc), platformFeeBps);

        // Register connected accounts
        vm.startPrank(owner);
        splits.connectAccount(sellerA, walletA);
        splits.connectAccount(sellerB, walletB);
        vm.stopPrank();

        // Fund payer
        usdc.mint(payer, 1_000_000_000); // $1000

        // Payer approves ConnectSplits
        vm.prank(payer);
        usdc.approve(address(splits), type(uint256).max);
    }

    // ──────────────────────────────────────────────
    // Account Registration
    // ──────────────────────────────────────────────

    function testConnectAccount() public {
        address newSeller = address(10);
        address newWallet = address(11);

        vm.prank(owner);
        splits.connectAccount(newSeller, newWallet);

        assertTrue(splits.isConnected(newSeller));
    }

    function testConnectAccountEmitsEvent() public {
        address newSeller = address(10);
        address newWallet = address(11);

        vm.expectEmit(true, true, false, false);
        emit ConnectSplits.AccountConnected(newSeller, newWallet);

        vm.prank(owner);
        splits.connectAccount(newSeller, newWallet);
    }

    function testOnlyOwnerCanConnectAccount() public {
        vm.prank(payer);
        vm.expectRevert("ConnectSplits: not owner");
        splits.connectAccount(address(10), address(11));
    }

    function testCannotConnectZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert("ConnectSplits: zero address");
        splits.connectAccount(address(0), address(11));
    }

    function testDeactivateAccount() public {
        vm.prank(owner);
        splits.deactivateAccount(sellerA);

        assertFalse(splits.isConnected(sellerA));
    }

    // ──────────────────────────────────────────────
    // Split Payment
    // ──────────────────────────────────────────────

    function testSplitPaymentTwoRecipients() public {
        uint256 totalAmount = 100_000_000; // $100 USDC

        // Platform fee = 2.5% = $2.50 = 2_500_000
        // Distributable = $97.50 = 97_500_000
        // SellerA gets 60% of distributable via bps = 6000 bps => 58_500_000
        // SellerB gets 40% of distributable via bps = 4000 bps => 39_000_000
        // Total distributed = 58_500_000 + 39_000_000 = 97_500_000 = distributable

        ConnectSplits.SplitRule[] memory rules = new ConnectSplits.SplitRule[](2);
        rules[0] = ConnectSplits.SplitRule({recipient: sellerA, bps: 6000, flat: 0});
        rules[1] = ConnectSplits.SplitRule({recipient: sellerB, bps: 4000, flat: 0});

        vm.prank(payer);
        splits.splitPayment(paymentId, totalAmount, rules);

        // Verify balances
        uint256 platformFee = (totalAmount * platformFeeBps) / 10000; // 2_500_000
        uint256 distributable = totalAmount - platformFee; // 97_500_000

        assertEq(usdc.balanceOf(owner), platformFee);
        assertEq(usdc.balanceOf(walletA), (distributable * 6000) / 10000);
        assertEq(usdc.balanceOf(walletB), (distributable * 4000) / 10000);

        // Verify record
        (address recPayer, uint256 recTotal, uint256 recFee, uint256 recCount, uint256 recTime) =
            splits.getSplitRecord(paymentId);
        assertEq(recPayer, payer);
        assertEq(recTotal, totalAmount);
        assertEq(recFee, platformFee);
        assertEq(recCount, 2);
        assertGt(recTime, 0);
    }

    function testSplitPaymentEmitsEvents() public {
        uint256 totalAmount = 100_000_000;
        uint256 platformFee = (totalAmount * platformFeeBps) / 10000;
        uint256 distributable = totalAmount - platformFee;

        ConnectSplits.SplitRule[] memory rules = new ConnectSplits.SplitRule[](2);
        rules[0] = ConnectSplits.SplitRule({recipient: sellerA, bps: 6000, flat: 0});
        rules[1] = ConnectSplits.SplitRule({recipient: sellerB, bps: 4000, flat: 0});

        // Expect PaymentSplit events for each recipient
        vm.expectEmit(true, true, false, true);
        emit ConnectSplits.PaymentSplit(paymentId, sellerA, (distributable * 6000) / 10000);

        vm.expectEmit(true, true, false, true);
        emit ConnectSplits.PaymentSplit(paymentId, sellerB, (distributable * 4000) / 10000);

        // Expect the SplitExecuted event
        vm.expectEmit(true, true, false, true);
        emit ConnectSplits.SplitExecuted(paymentId, payer, totalAmount, platformFee, 2);

        vm.prank(payer);
        splits.splitPayment(paymentId, totalAmount, rules);
    }

    function testSplitPaymentWithFlatAmounts() public {
        uint256 totalAmount = 100_000_000; // $100
        // Platform fee: 2.5% = 2_500_000
        // Distributable: 97_500_000
        // SellerA: 50% bps + $5 flat = 48_750_000 + 5_000_000 = 53_750_000
        // SellerB: 40% bps + 4_750_000 flat => 39_000_000 + 4_750_000 = 43_750_000
        // Total = 53_750_000 + 43_750_000 = 97_500_000

        ConnectSplits.SplitRule[] memory rules = new ConnectSplits.SplitRule[](2);
        rules[0] = ConnectSplits.SplitRule({recipient: sellerA, bps: 5000, flat: 5_000_000});
        rules[1] = ConnectSplits.SplitRule({recipient: sellerB, bps: 4000, flat: 4_750_000});

        vm.prank(payer);
        splits.splitPayment(paymentId, totalAmount, rules);

        uint256 distributable = totalAmount - (totalAmount * platformFeeBps) / 10000;
        uint256 aExpected = (distributable * 5000) / 10000 + 5_000_000;
        uint256 bExpected = (distributable * 4000) / 10000 + 4_750_000;

        assertEq(usdc.balanceOf(walletA), aExpected);
        assertEq(usdc.balanceOf(walletB), bExpected);
        assertEq(aExpected + bExpected, distributable);
    }

    // ──────────────────────────────────────────────
    // Validation: Splits Must Total 100%
    // ──────────────────────────────────────────────

    function testSplitsNotEqualTo100Reverts() public {
        uint256 totalAmount = 100_000_000;

        // Only 80% via bps, no flat => under-distribution
        ConnectSplits.SplitRule[] memory rules = new ConnectSplits.SplitRule[](2);
        rules[0] = ConnectSplits.SplitRule({recipient: sellerA, bps: 5000, flat: 0});
        rules[1] = ConnectSplits.SplitRule({recipient: sellerB, bps: 3000, flat: 0});

        vm.prank(payer);
        vm.expectRevert("ConnectSplits: splits != 100%");
        splits.splitPayment(paymentId, totalAmount, rules);
    }

    function testSplitsOverDistributionReverts() public {
        uint256 totalAmount = 100_000_000;

        // 110% via bps => over-distribution
        ConnectSplits.SplitRule[] memory rules = new ConnectSplits.SplitRule[](2);
        rules[0] = ConnectSplits.SplitRule({recipient: sellerA, bps: 6000, flat: 0});
        rules[1] = ConnectSplits.SplitRule({recipient: sellerB, bps: 5000, flat: 0});

        vm.prank(payer);
        vm.expectRevert("ConnectSplits: splits != 100%");
        splits.splitPayment(paymentId, totalAmount, rules);
    }

    // ──────────────────────────────────────────────
    // Platform Fee
    // ──────────────────────────────────────────────

    function testPlatformFeeDeducted() public {
        uint256 totalAmount = 200_000_000; // $200
        uint256 expectedFee = (totalAmount * platformFeeBps) / 10000; // 5_000_000

        ConnectSplits.SplitRule[] memory rules = new ConnectSplits.SplitRule[](2);
        rules[0] = ConnectSplits.SplitRule({recipient: sellerA, bps: 6000, flat: 0});
        rules[1] = ConnectSplits.SplitRule({recipient: sellerB, bps: 4000, flat: 0});

        vm.prank(payer);
        splits.splitPayment(paymentId, totalAmount, rules);

        assertEq(usdc.balanceOf(owner), expectedFee);
        assertEq(splits.totalPlatformFees(), expectedFee);
        assertEq(splits.totalSplitVolume(), totalAmount);
    }

    function testZeroPlatformFee() public {
        // Deploy with 0% fee
        MockUSDC usdc2 = new MockUSDC();
        vm.prank(owner);
        ConnectSplits zeroFeeSplits = new ConnectSplits(owner, address(usdc2), 0);

        vm.startPrank(owner);
        zeroFeeSplits.connectAccount(sellerA, walletA);
        zeroFeeSplits.connectAccount(sellerB, walletB);
        vm.stopPrank();

        usdc2.mint(payer, 100_000_000);
        vm.prank(payer);
        usdc2.approve(address(zeroFeeSplits), type(uint256).max);

        ConnectSplits.SplitRule[] memory rules = new ConnectSplits.SplitRule[](2);
        rules[0] = ConnectSplits.SplitRule({recipient: sellerA, bps: 7000, flat: 0});
        rules[1] = ConnectSplits.SplitRule({recipient: sellerB, bps: 3000, flat: 0});

        bytes32 pid = keccak256("zero_fee_001");
        vm.prank(payer);
        zeroFeeSplits.splitPayment(pid, 100_000_000, rules);

        // Full amount goes to recipients, nothing to owner
        assertEq(usdc2.balanceOf(walletA), 70_000_000);
        assertEq(usdc2.balanceOf(walletB), 30_000_000);
    }

    function testUpdatePlatformFee() public {
        vm.prank(owner);
        splits.setPlatformFeeBps(500); // 5%
        assertEq(splits.platformFeeBps(), 500);
    }

    function testCannotSetFeeTooHigh() public {
        vm.prank(owner);
        vm.expectRevert("ConnectSplits: fee too high");
        splits.setPlatformFeeBps(1001); // > 10%
    }

    // ──────────────────────────────────────────────
    // Edge Cases
    // ──────────────────────────────────────────────

    function testCannotSplitWithZeroAmount() public {
        ConnectSplits.SplitRule[] memory rules = new ConnectSplits.SplitRule[](1);
        rules[0] = ConnectSplits.SplitRule({recipient: sellerA, bps: 10000, flat: 0});

        vm.prank(payer);
        vm.expectRevert("ConnectSplits: zero amount");
        splits.splitPayment(paymentId, 0, rules);
    }

    function testCannotSplitWithNoRules() public {
        ConnectSplits.SplitRule[] memory rules = new ConnectSplits.SplitRule[](0);

        vm.prank(payer);
        vm.expectRevert("ConnectSplits: no rules");
        splits.splitPayment(paymentId, 100_000_000, rules);
    }

    function testCannotSplitToUnconnectedRecipient() public {
        address unconnected = address(99);

        ConnectSplits.SplitRule[] memory rules = new ConnectSplits.SplitRule[](1);
        rules[0] = ConnectSplits.SplitRule({recipient: unconnected, bps: 10000, flat: 0});

        vm.prank(payer);
        vm.expectRevert("ConnectSplits: recipient not connected");
        splits.splitPayment(paymentId, 100_000_000, rules);
    }

    function testCannotDuplicatePaymentId() public {
        uint256 totalAmount = 100_000_000;

        ConnectSplits.SplitRule[] memory rules = new ConnectSplits.SplitRule[](2);
        rules[0] = ConnectSplits.SplitRule({recipient: sellerA, bps: 6000, flat: 0});
        rules[1] = ConnectSplits.SplitRule({recipient: sellerB, bps: 4000, flat: 0});

        vm.prank(payer);
        splits.splitPayment(paymentId, totalAmount, rules);

        vm.prank(payer);
        vm.expectRevert("ConnectSplits: payment exists");
        splits.splitPayment(paymentId, totalAmount, rules);
    }
}
