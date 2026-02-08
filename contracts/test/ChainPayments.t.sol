// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/ChainPayments.sol";
import "../src/mocks/MockUSDC.sol";

contract ChainPaymentsTest is Test {
    ChainPayments public cp;
    MockUSDC public usdc;

    address owner = address(1);
    address merchant = address(2);
    address merchantWallet = address(3);
    address payer = address(4);

    bytes32 paymentId = keccak256("pi_001");
    uint256 paymentAmount = 50_000_000; // $50 USDC (6 decimals)

    function setUp() public {
        vm.startPrank(owner);
        cp = new ChainPayments(owner);
        usdc = new MockUSDC();
        cp.setUSDC(address(usdc));
        cp.registerMerchant(merchant, merchantWallet);
        vm.stopPrank();

        // Fund payer with USDC
        usdc.mint(payer, 1_000_000_000); // $1000
    }

    // ──────────────────────────────────────────────
    // Payment Creation
    // ──────────────────────────────────────────────

    function testCreatePayment() public {
        vm.prank(owner);
        cp.createPayment(paymentId, paymentAmount, merchant);

        (uint256 amount, , address m, ChainPayments.PaymentStatus status, ) = cp.getPayment(paymentId);
        assertEq(amount, paymentAmount);
        assertEq(m, merchant);
        assertEq(uint8(status), uint8(ChainPayments.PaymentStatus.AwaitingPayment));
    }

    function testCannotCreateDuplicatePayment() public {
        vm.startPrank(owner);
        cp.createPayment(paymentId, paymentAmount, merchant);
        vm.expectRevert("ChainPayments: id exists");
        cp.createPayment(paymentId, paymentAmount, merchant);
        vm.stopPrank();
    }

    function testCannotCreatePaymentForUnregisteredMerchant() public {
        vm.prank(owner);
        vm.expectRevert("ChainPayments: merchant not registered");
        cp.createPayment(paymentId, paymentAmount, address(99));
    }

    function testOnlyOwnerCanCreatePayment() public {
        vm.prank(payer);
        vm.expectRevert("ChainPayments: not owner");
        cp.createPayment(paymentId, paymentAmount, merchant);
    }

    // ──────────────────────────────────────────────
    // Payment Execution
    // ──────────────────────────────────────────────

    function testPaySuccessful() public {
        vm.prank(owner);
        cp.createPayment(paymentId, paymentAmount, merchant);

        vm.startPrank(payer);
        usdc.approve(address(cp), paymentAmount);
        cp.pay(paymentId);
        vm.stopPrank();

        (, address payerAddr, , ChainPayments.PaymentStatus status, ) = cp.getPayment(paymentId);
        assertEq(payerAddr, payer);
        assertEq(uint8(status), uint8(ChainPayments.PaymentStatus.Succeeded));

        // Merchant wallet received net amount (amount - 0.1% fee)
        uint256 fee = (paymentAmount * 10) / 10000; // 0.1%
        uint256 netAmount = paymentAmount - fee;
        assertEq(usdc.balanceOf(merchantWallet), netAmount);
    }

    function testPayEmitsEvent() public {
        vm.prank(owner);
        cp.createPayment(paymentId, paymentAmount, merchant);

        vm.startPrank(payer);
        usdc.approve(address(cp), paymentAmount);

        vm.expectEmit(true, true, true, true);
        emit ChainPayments.PaymentSucceeded(paymentId, payer, merchant, paymentAmount);

        cp.pay(paymentId);
        vm.stopPrank();
    }

    function testCannotPayTwice() public {
        vm.prank(owner);
        cp.createPayment(paymentId, paymentAmount, merchant);

        vm.startPrank(payer);
        usdc.approve(address(cp), paymentAmount * 2);
        cp.pay(paymentId);

        vm.expectRevert("ChainPayments: not awaiting payment");
        cp.pay(paymentId);
        vm.stopPrank();
    }

    function testCannotPayExpiredPayment() public {
        vm.prank(owner);
        cp.createPayment(paymentId, paymentAmount, merchant);

        // Fast forward past expiry
        vm.warp(block.timestamp + 31 minutes);

        vm.startPrank(payer);
        usdc.approve(address(cp), paymentAmount);
        vm.expectRevert("ChainPayments: payment expired");
        cp.pay(paymentId);
        vm.stopPrank();
    }

    function testCannotPayWithInsufficientBalance() public {
        vm.prank(owner);
        cp.createPayment(paymentId, paymentAmount, merchant);

        address brokePayer = address(10);
        usdc.mint(brokePayer, 100); // only $0.0001

        vm.startPrank(brokePayer);
        usdc.approve(address(cp), paymentAmount);
        vm.expectRevert("MockUSDC: insufficient balance");
        cp.pay(paymentId);
        vm.stopPrank();
    }

    // ──────────────────────────────────────────────
    // Payment Expiry
    // ──────────────────────────────────────────────

    function testExpirePayment() public {
        vm.prank(owner);
        cp.createPayment(paymentId, paymentAmount, merchant);

        vm.warp(block.timestamp + 31 minutes);

        vm.prank(owner);
        cp.expirePayment(paymentId);

        (, , , ChainPayments.PaymentStatus status, ) = cp.getPayment(paymentId);
        assertEq(uint8(status), uint8(ChainPayments.PaymentStatus.Expired));
    }

    function testCannotExpireBeforeExpiry() public {
        vm.prank(owner);
        cp.createPayment(paymentId, paymentAmount, merchant);

        vm.prank(owner);
        vm.expectRevert("ChainPayments: not expired yet");
        cp.expirePayment(paymentId);
    }

    // ──────────────────────────────────────────────
    // Direct Refunds
    // ──────────────────────────────────────────────

    function testDirectRefundFull() public {
        // Pay first
        vm.prank(owner);
        cp.createPayment(paymentId, paymentAmount, merchant);
        vm.startPrank(payer);
        usdc.approve(address(cp), paymentAmount);
        cp.pay(paymentId);
        vm.stopPrank();

        // Merchant refunds from their own wallet
        usdc.mint(merchant, paymentAmount);
        vm.startPrank(merchant);
        usdc.approve(address(cp), paymentAmount);
        cp.directRefund(paymentId, paymentAmount);
        vm.stopPrank();

        (, , , ChainPayments.PaymentStatus status, uint256 refundedAmount) = cp.getPayment(paymentId);
        assertEq(uint8(status), uint8(ChainPayments.PaymentStatus.Refunded));
        assertEq(refundedAmount, paymentAmount);
        assertEq(usdc.balanceOf(payer), 1_000_000_000); // original balance restored
    }

    function testDirectRefundPartial() public {
        vm.prank(owner);
        cp.createPayment(paymentId, paymentAmount, merchant);
        vm.startPrank(payer);
        usdc.approve(address(cp), paymentAmount);
        cp.pay(paymentId);
        vm.stopPrank();

        uint256 partialAmount = paymentAmount / 2;
        usdc.mint(merchant, partialAmount);
        vm.startPrank(merchant);
        usdc.approve(address(cp), partialAmount);
        cp.directRefund(paymentId, partialAmount);
        vm.stopPrank();

        (, , , ChainPayments.PaymentStatus status, uint256 refundedAmount) = cp.getPayment(paymentId);
        assertEq(uint8(status), uint8(ChainPayments.PaymentStatus.PartialRefund));
        assertEq(refundedAmount, partialAmount);
    }

    function testCannotRefundMoreThanPayment() public {
        vm.prank(owner);
        cp.createPayment(paymentId, paymentAmount, merchant);
        vm.startPrank(payer);
        usdc.approve(address(cp), paymentAmount);
        cp.pay(paymentId);
        vm.stopPrank();

        usdc.mint(merchant, paymentAmount * 2);
        vm.startPrank(merchant);
        usdc.approve(address(cp), paymentAmount * 2);
        vm.expectRevert("ChainPayments: invalid refund amount");
        cp.directRefund(paymentId, paymentAmount + 1);
        vm.stopPrank();
    }

    function testNonMerchantCannotRefund() public {
        vm.prank(owner);
        cp.createPayment(paymentId, paymentAmount, merchant);
        vm.startPrank(payer);
        usdc.approve(address(cp), paymentAmount);
        cp.pay(paymentId);
        vm.stopPrank();

        vm.prank(payer);
        vm.expectRevert("ChainPayments: not registered merchant");
        cp.directRefund(paymentId, paymentAmount);
    }

    // ──────────────────────────────────────────────
    // Escrow Holds
    // ──────────────────────────────────────────────

    function testCreateAndCaptureHold() public {
        bytes32 holdId = keccak256("hold_001");

        vm.prank(owner);
        cp.createPayment(paymentId, paymentAmount, merchant);

        // Payer creates a hold
        vm.startPrank(payer);
        usdc.approve(address(cp), paymentAmount);
        cp.createHold(holdId, paymentId, paymentAmount, 7 days);
        vm.stopPrank();

        // Check hold state
        (uint256 amount, uint256 captured, uint256 released, ChainPayments.HoldStatus status, uint256 expiresAt) =
            cp.getHold(holdId);
        assertEq(amount, paymentAmount);
        assertEq(captured, 0);
        assertEq(released, 0);
        assertEq(uint8(status), uint8(ChainPayments.HoldStatus.Active));
        assertGt(expiresAt, block.timestamp);

        // Merchant captures full amount
        vm.prank(merchant);
        cp.captureHold(holdId, paymentAmount);

        (, captured, , status, ) = cp.getHold(holdId);
        assertEq(captured, paymentAmount);
        assertEq(uint8(status), uint8(ChainPayments.HoldStatus.Captured));
        assertEq(usdc.balanceOf(merchantWallet), paymentAmount);
    }

    function testPartialCaptureAndRelease() public {
        bytes32 holdId = keccak256("hold_002");

        vm.prank(owner);
        cp.createPayment(paymentId, paymentAmount, merchant);

        vm.startPrank(payer);
        usdc.approve(address(cp), paymentAmount);
        cp.createHold(holdId, paymentId, paymentAmount, 7 days);
        vm.stopPrank();

        uint256 captureAmount = paymentAmount / 2;
        uint256 releaseAmount = paymentAmount - captureAmount;

        // Capture half
        vm.prank(merchant);
        cp.captureHold(holdId, captureAmount);

        // Release the rest
        vm.prank(merchant);
        cp.releaseHold(holdId, releaseAmount);

        (, uint256 captured, uint256 released, ChainPayments.HoldStatus status, ) = cp.getHold(holdId);
        assertEq(captured, captureAmount);
        assertEq(released, releaseAmount);
        // When capture + release = total, status depends on which finished it
        assertTrue(uint8(status) == uint8(ChainPayments.HoldStatus.Released));
    }

    function testHoldAutoExpire() public {
        bytes32 holdId = keccak256("hold_003");

        vm.prank(owner);
        cp.createPayment(paymentId, paymentAmount, merchant);

        vm.startPrank(payer);
        usdc.approve(address(cp), paymentAmount);
        cp.createHold(holdId, paymentId, paymentAmount, 1 days);
        vm.stopPrank();

        uint256 payerBalanceBefore = usdc.balanceOf(payer);

        // Fast forward past expiry
        vm.warp(block.timestamp + 2 days);

        // Anyone can expire it
        cp.expireHold(holdId);

        (, , , ChainPayments.HoldStatus status, ) = cp.getHold(holdId);
        assertEq(uint8(status), uint8(ChainPayments.HoldStatus.Expired));
        assertEq(usdc.balanceOf(payer), payerBalanceBefore + paymentAmount);
    }

    // ──────────────────────────────────────────────
    // Admin
    // ──────────────────────────────────────────────

    function testSetFee() public {
        vm.prank(owner);
        cp.setFeeBps(100); // 1%
        assertEq(cp.feeBps(), 100);
    }

    function testCannotSetFeeTooHigh() public {
        vm.prank(owner);
        vm.expectRevert("ChainPayments: fee too high");
        cp.setFeeBps(501); // > 5%
    }

    function testWithdrawFees() public {
        // Execute a payment to generate fees
        vm.prank(owner);
        cp.createPayment(paymentId, paymentAmount, merchant);
        vm.startPrank(payer);
        usdc.approve(address(cp), paymentAmount);
        cp.pay(paymentId);
        vm.stopPrank();

        uint256 expectedFee = (paymentAmount * 10) / 10000;
        assertEq(cp.totalFees(), expectedFee);

        address feeRecipient = address(99);
        vm.prank(owner);
        cp.withdrawFees(feeRecipient);

        assertEq(usdc.balanceOf(feeRecipient), expectedFee);
    }

    // ──────────────────────────────────────────────
    // Volume Tracking
    // ──────────────────────────────────────────────

    function testVolumeTracking() public {
        vm.prank(owner);
        cp.createPayment(paymentId, paymentAmount, merchant);
        vm.startPrank(payer);
        usdc.approve(address(cp), paymentAmount);
        cp.pay(paymentId);
        vm.stopPrank();

        assertEq(cp.totalVolume(), paymentAmount);
        assertEq(cp.paymentCount(), 1);
    }
}
