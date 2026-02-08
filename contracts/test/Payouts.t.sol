// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/Payouts.sol";
import "../src/mocks/MockUSDC.sol";

contract PayoutsTest is Test {
    Payouts public payoutsContract;
    MockUSDC public usdc;

    address owner = address(1);
    address merchantA = address(2);
    address merchantB = address(3);
    address merchantC = address(4);
    address nobody = address(5);

    function setUp() public {
        usdc = new MockUSDC();

        vm.prank(owner);
        payoutsContract = new Payouts(owner, address(usdc));

        // Fund the Payouts contract with USDC (simulating platform treasury)
        usdc.mint(address(payoutsContract), 10_000_000_000); // $10,000
    }

    // ──────────────────────────────────────────────
    // Create Payout
    // ──────────────────────────────────────────────

    function testCreatePayout() public {
        vm.prank(owner);
        uint256 payoutId = payoutsContract.createPayout(merchantA, 50_000_000);

        (address recipient, uint256 amount, Payouts.PayoutStatus status, uint256 createdAt, uint256 completedAt) =
            payoutsContract.getPayout(payoutId);

        assertEq(recipient, merchantA);
        assertEq(amount, 50_000_000);
        assertEq(uint8(status), uint8(Payouts.PayoutStatus.Pending));
        assertGt(createdAt, 0);
        assertEq(completedAt, 0);
    }

    function testCreatePayoutEmitsEvent() public {
        vm.expectEmit(true, true, false, true);
        emit Payouts.PayoutCreated(1, merchantA, 50_000_000);

        vm.prank(owner);
        payoutsContract.createPayout(merchantA, 50_000_000);
    }

    function testCannotCreatePayoutWithZeroRecipient() public {
        vm.prank(owner);
        vm.expectRevert("Payouts: zero recipient");
        payoutsContract.createPayout(address(0), 50_000_000);
    }

    function testCannotCreatePayoutWithZeroAmount() public {
        vm.prank(owner);
        vm.expectRevert("Payouts: zero amount");
        payoutsContract.createPayout(merchantA, 0);
    }

    function testMultiplePayoutsIncrementCount() public {
        vm.startPrank(owner);
        uint256 id1 = payoutsContract.createPayout(merchantA, 10_000_000);
        uint256 id2 = payoutsContract.createPayout(merchantB, 20_000_000);
        uint256 id3 = payoutsContract.createPayout(merchantC, 30_000_000);
        vm.stopPrank();

        assertEq(id1, 1);
        assertEq(id2, 2);
        assertEq(id3, 3);
        assertEq(payoutsContract.payoutCount(), 3);
    }

    // ──────────────────────────────────────────────
    // Execute Batch
    // ──────────────────────────────────────────────

    function testExecuteBatchSingle() public {
        vm.prank(owner);
        uint256 payoutId = payoutsContract.createPayout(merchantA, 50_000_000);

        uint256[] memory ids = new uint256[](1);
        ids[0] = payoutId;

        vm.prank(owner);
        payoutsContract.executeBatch(ids);

        (, , Payouts.PayoutStatus status, , uint256 completedAt) = payoutsContract.getPayout(payoutId);
        assertEq(uint8(status), uint8(Payouts.PayoutStatus.Completed));
        assertGt(completedAt, 0);
        assertEq(usdc.balanceOf(merchantA), 50_000_000);
    }

    function testExecuteBatchMultiple() public {
        vm.startPrank(owner);
        uint256 id1 = payoutsContract.createPayout(merchantA, 10_000_000);
        uint256 id2 = payoutsContract.createPayout(merchantB, 20_000_000);
        uint256 id3 = payoutsContract.createPayout(merchantC, 30_000_000);
        vm.stopPrank();

        uint256[] memory ids = new uint256[](3);
        ids[0] = id1;
        ids[1] = id2;
        ids[2] = id3;

        vm.prank(owner);
        payoutsContract.executeBatch(ids);

        // Verify all completed
        for (uint256 i = 0; i < ids.length; i++) {
            (, , Payouts.PayoutStatus status, ,) = payoutsContract.getPayout(ids[i]);
            assertEq(uint8(status), uint8(Payouts.PayoutStatus.Completed));
        }

        assertEq(usdc.balanceOf(merchantA), 10_000_000);
        assertEq(usdc.balanceOf(merchantB), 20_000_000);
        assertEq(usdc.balanceOf(merchantC), 30_000_000);

        assertEq(payoutsContract.totalDisbursed(), 60_000_000);
        assertEq(payoutsContract.totalPayoutsCompleted(), 3);
    }

    function testExecuteBatchEmitsEvents() public {
        vm.startPrank(owner);
        uint256 id1 = payoutsContract.createPayout(merchantA, 10_000_000);
        uint256 id2 = payoutsContract.createPayout(merchantB, 20_000_000);
        vm.stopPrank();

        uint256[] memory ids = new uint256[](2);
        ids[0] = id1;
        ids[1] = id2;

        // Expect PayoutCompleted events
        vm.expectEmit(true, true, false, true);
        emit Payouts.PayoutCompleted(id1, merchantA, 10_000_000);

        vm.expectEmit(true, true, false, true);
        emit Payouts.PayoutCompleted(id2, merchantB, 20_000_000);

        // Expect BatchExecuted event
        vm.expectEmit(false, false, false, true);
        emit Payouts.BatchExecuted(ids, 30_000_000, 2, 0);

        vm.prank(owner);
        payoutsContract.executeBatch(ids);
    }

    function testCannotExecuteEmptyBatch() public {
        uint256[] memory ids = new uint256[](0);

        vm.prank(owner);
        vm.expectRevert("Payouts: empty batch");
        payoutsContract.executeBatch(ids);
    }

    function testCannotExecuteNonexistentPayout() public {
        uint256[] memory ids = new uint256[](1);
        ids[0] = 999;

        vm.prank(owner);
        vm.expectRevert("Payouts: payout not found");
        payoutsContract.executeBatch(ids);
    }

    function testCannotExecuteAlreadyCompletedPayout() public {
        vm.prank(owner);
        uint256 payoutId = payoutsContract.createPayout(merchantA, 50_000_000);

        uint256[] memory ids = new uint256[](1);
        ids[0] = payoutId;

        vm.prank(owner);
        payoutsContract.executeBatch(ids);

        // Try to execute again
        vm.prank(owner);
        vm.expectRevert("Payouts: not pending");
        payoutsContract.executeBatch(ids);
    }

    // ──────────────────────────────────────────────
    // Access Control
    // ──────────────────────────────────────────────

    function testOnlyOwnerCanCreatePayout() public {
        vm.prank(nobody);
        vm.expectRevert("Payouts: not owner");
        payoutsContract.createPayout(merchantA, 50_000_000);
    }

    function testOnlyOwnerCanExecuteBatch() public {
        vm.prank(owner);
        uint256 payoutId = payoutsContract.createPayout(merchantA, 50_000_000);

        uint256[] memory ids = new uint256[](1);
        ids[0] = payoutId;

        vm.prank(nobody);
        vm.expectRevert("Payouts: not owner");
        payoutsContract.executeBatch(ids);
    }

    // ──────────────────────────────────────────────
    // Status Tracking
    // ──────────────────────────────────────────────

    function testPayoutStatusTransitions() public {
        vm.prank(owner);
        uint256 payoutId = payoutsContract.createPayout(merchantA, 50_000_000);

        // Initially Pending
        (, , Payouts.PayoutStatus status, ,) = payoutsContract.getPayout(payoutId);
        assertEq(uint8(status), uint8(Payouts.PayoutStatus.Pending));

        // After execution, Completed
        uint256[] memory ids = new uint256[](1);
        ids[0] = payoutId;

        vm.prank(owner);
        payoutsContract.executeBatch(ids);

        (, , status, ,) = payoutsContract.getPayout(payoutId);
        assertEq(uint8(status), uint8(Payouts.PayoutStatus.Completed));
    }

    function testTotalDisbursedTracking() public {
        vm.startPrank(owner);
        uint256 id1 = payoutsContract.createPayout(merchantA, 10_000_000);
        uint256 id2 = payoutsContract.createPayout(merchantB, 20_000_000);
        vm.stopPrank();

        // Execute first batch
        uint256[] memory batch1 = new uint256[](1);
        batch1[0] = id1;
        vm.prank(owner);
        payoutsContract.executeBatch(batch1);
        assertEq(payoutsContract.totalDisbursed(), 10_000_000);

        // Execute second batch
        uint256[] memory batch2 = new uint256[](1);
        batch2[0] = id2;
        vm.prank(owner);
        payoutsContract.executeBatch(batch2);
        assertEq(payoutsContract.totalDisbursed(), 30_000_000);
    }
}
