// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "../src/ClaimableRefund.sol";
import "../src/mocks/MockUSDC.sol";

contract ClaimableRefundTest is Test {
    ClaimableRefund public cr;
    MockUSDC public usdc;

    address merchant = address(2);
    address customer = address(4);
    address customerNewWallet = address(5);

    bytes32 refundId = keccak256("ref_001");
    bytes32 paymentId = keccak256("pi_001");
    uint256 refundAmount = 50_000_000; // $50 USDC

    // The secret is what goes in the claim URL
    bytes32 claimSecret = keccak256("secret_abc123");
    bytes32 claimSecretHash = keccak256(abi.encodePacked(claimSecret));

    function setUp() public {
        cr = new ClaimableRefund();
        usdc = new MockUSDC();
        cr.setUSDC(address(usdc));

        // Fund merchant
        usdc.mint(merchant, 1_000_000_000);
    }

    // ──────────────────────────────────────────────
    // Deposit Refund
    // ──────────────────────────────────────────────

    function testDepositRefund() public {
        vm.startPrank(merchant);
        usdc.approve(address(cr), refundAmount);
        cr.depositRefund(refundId, paymentId, refundAmount, claimSecretHash, 24 hours, "Customer requested");
        vm.stopPrank();

        (uint256 amount, address m, , ClaimableRefund.RefundStatus status, uint256 expiresAt, ) = cr.getRefund(refundId);
        assertEq(amount, refundAmount);
        assertEq(m, merchant);
        assertEq(uint8(status), uint8(ClaimableRefund.RefundStatus.AwaitingClaim));
        assertEq(expiresAt, block.timestamp + 24 hours);

        assertTrue(cr.isClaimable(refundId));
        assertEq(cr.timeRemaining(refundId), 24 hours);
        assertEq(cr.refundCount(), 1);
        assertEq(cr.totalDeposited(), refundAmount);
    }

    function testDepositWithDefaultExpiry() public {
        vm.startPrank(merchant);
        usdc.approve(address(cr), refundAmount);
        cr.depositRefund(refundId, paymentId, refundAmount, claimSecretHash, 0, "Customer requested");
        vm.stopPrank();

        (, , , , uint256 expiresAt, ) = cr.getRefund(refundId);
        assertEq(expiresAt, block.timestamp + 24 hours);
    }

    function testCannotDepositDuplicate() public {
        vm.startPrank(merchant);
        usdc.approve(address(cr), refundAmount * 2);
        cr.depositRefund(refundId, paymentId, refundAmount, claimSecretHash, 24 hours, "Customer requested");

        vm.expectRevert("ClaimableRefund: id exists");
        cr.depositRefund(refundId, paymentId, refundAmount, claimSecretHash, 24 hours, "Duplicate");
        vm.stopPrank();
    }

    function testCannotDepositZeroAmount() public {
        vm.startPrank(merchant);
        vm.expectRevert("ClaimableRefund: zero amount");
        cr.depositRefund(refundId, paymentId, 0, claimSecretHash, 24 hours, "Zero");
        vm.stopPrank();
    }

    function testCannotDepositInvalidExpiry() public {
        vm.startPrank(merchant);
        usdc.approve(address(cr), refundAmount);
        vm.expectRevert("ClaimableRefund: invalid expiry");
        cr.depositRefund(refundId, paymentId, refundAmount, claimSecretHash, 31 days, "Too long");
        vm.stopPrank();
    }

    // ──────────────────────────────────────────────
    // Claim Refund
    // ──────────────────────────────────────────────

    function _depositRefund() internal {
        vm.startPrank(merchant);
        usdc.approve(address(cr), refundAmount);
        cr.depositRefund(refundId, paymentId, refundAmount, claimSecretHash, 24 hours, "Customer requested");
        vm.stopPrank();
    }

    function testClaimToConnectedWallet() public {
        _depositRefund();

        vm.prank(customer);
        cr.claim(claimSecret, customer);

        (, , address claimedBy, ClaimableRefund.RefundStatus status, , uint256 claimedAt) = cr.getRefund(refundId);
        assertEq(claimedBy, customer);
        assertEq(uint8(status), uint8(ClaimableRefund.RefundStatus.Claimed));
        assertGt(claimedAt, 0);
        assertEq(usdc.balanceOf(customer), refundAmount);
        assertEq(cr.totalClaimed(), refundAmount);
    }

    function testClaimToDifferentWallet() public {
        _depositRefund();

        // Customer claims to a different wallet they control
        vm.prank(customer);
        cr.claim(claimSecret, customerNewWallet);

        (, , address claimedBy, , , ) = cr.getRefund(refundId);
        assertEq(claimedBy, customerNewWallet);
        assertEq(usdc.balanceOf(customerNewWallet), refundAmount);
    }

    function testClaimEmitsEvent() public {
        _depositRefund();

        vm.prank(customer);
        vm.expectEmit(true, true, true, true);
        emit ClaimableRefund.RefundClaimed(refundId, customer, refundAmount);
        cr.claim(claimSecret, customer);
    }

    function testCannotClaimWithWrongSecret() public {
        _depositRefund();

        bytes32 wrongSecret = keccak256("wrong_secret");
        vm.prank(customer);
        vm.expectRevert("ClaimableRefund: invalid claim secret");
        cr.claim(wrongSecret, customer);
    }

    function testCannotClaimTwice() public {
        _depositRefund();

        vm.prank(customer);
        cr.claim(claimSecret, customer);

        vm.prank(customer);
        vm.expectRevert("ClaimableRefund: not claimable");
        cr.claim(claimSecret, customer);
    }

    function testCannotClaimToZeroAddress() public {
        _depositRefund();

        vm.prank(customer);
        vm.expectRevert("ClaimableRefund: zero destination");
        cr.claim(claimSecret, address(0));
    }

    function testCannotClaimAfterExpiry() public {
        _depositRefund();

        // Fast forward past 24h expiry
        vm.warp(block.timestamp + 25 hours);

        vm.prank(customer);
        vm.expectRevert("ClaimableRefund: expired");
        cr.claim(claimSecret, customer);
    }

    // ──────────────────────────────────────────────
    // Expiry & Reclaim
    // ──────────────────────────────────────────────

    function testMarkExpired() public {
        _depositRefund();

        vm.warp(block.timestamp + 25 hours);
        cr.markExpired(refundId);

        (, , , ClaimableRefund.RefundStatus status, , ) = cr.getRefund(refundId);
        assertEq(uint8(status), uint8(ClaimableRefund.RefundStatus.Expired));
        assertFalse(cr.isClaimable(refundId));
        assertEq(cr.timeRemaining(refundId), 0);
    }

    function testCannotMarkExpiredEarly() public {
        _depositRefund();

        vm.expectRevert("ClaimableRefund: not expired yet");
        cr.markExpired(refundId);
    }

    function testReclaimExpiredFunds() public {
        _depositRefund();

        uint256 merchantBalanceBefore = usdc.balanceOf(merchant);

        vm.warp(block.timestamp + 25 hours);
        cr.markExpired(refundId);

        vm.prank(merchant);
        cr.reclaimExpired(refundId);

        (, , , ClaimableRefund.RefundStatus status, , ) = cr.getRefund(refundId);
        assertEq(uint8(status), uint8(ClaimableRefund.RefundStatus.Returned));
        assertEq(usdc.balanceOf(merchant), merchantBalanceBefore + refundAmount);
        assertEq(cr.totalReturned(), refundAmount);
    }

    function testNonMerchantCannotReclaim() public {
        _depositRefund();

        vm.warp(block.timestamp + 25 hours);
        cr.markExpired(refundId);

        vm.prank(customer);
        vm.expectRevert("ClaimableRefund: not your refund");
        cr.reclaimExpired(refundId);
    }

    // ──────────────────────────────────────────────
    // Extend Expiry
    // ──────────────────────────────────────────────

    function testExtendExpiry() public {
        _depositRefund();

        vm.prank(merchant);
        cr.extendExpiry(refundId, 72 hours);

        (, , , ClaimableRefund.RefundStatus status, uint256 expiresAt, ) = cr.getRefund(refundId);
        assertEq(uint8(status), uint8(ClaimableRefund.RefundStatus.AwaitingClaim));
        assertEq(expiresAt, block.timestamp + 72 hours);
    }

    function testExtendExpiredRefund() public {
        _depositRefund();

        vm.warp(block.timestamp + 25 hours);
        cr.markExpired(refundId);

        // Merchant extends - should reactivate the refund
        vm.prank(merchant);
        cr.extendExpiry(refundId, 24 hours);

        (, , , ClaimableRefund.RefundStatus status, , ) = cr.getRefund(refundId);
        assertEq(uint8(status), uint8(ClaimableRefund.RefundStatus.AwaitingClaim));
        assertTrue(cr.isClaimable(refundId));
    }

    function testCustomerCanClaimAfterExtension() public {
        _depositRefund();

        vm.warp(block.timestamp + 25 hours);
        cr.markExpired(refundId);

        vm.prank(merchant);
        cr.extendExpiry(refundId, 24 hours);

        // Customer can now claim
        vm.prank(customer);
        cr.claim(claimSecret, customer);

        assertEq(usdc.balanceOf(customer), refundAmount);
    }
}
