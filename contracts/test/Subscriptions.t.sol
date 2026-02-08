// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/Subscriptions.sol";
import "../src/mocks/MockUSDC.sol";

contract SubscriptionsTest is Test {
    Subscriptions public subs;
    MockUSDC public usdc;

    address owner = address(1);
    address merchant = address(2);
    address customer = address(3);

    uint256 planAmount = 10_000_000; // $10 USDC
    uint256 planInterval = 30 days;

    function setUp() public {
        usdc = new MockUSDC();

        vm.prank(owner);
        subs = new Subscriptions(owner, address(usdc));

        // Fund customer with USDC
        usdc.mint(customer, 1_000_000_000); // $1000

        // Customer approves Subscriptions contract for recurring charges
        vm.prank(customer);
        usdc.approve(address(subs), type(uint256).max);
    }

    // ──────────────────────────────────────────────
    // Plan Creation
    // ──────────────────────────────────────────────

    function testCreatePlan() public {
        vm.prank(merchant);
        uint256 planId = subs.createPlan("Pro Monthly", planAmount, planInterval, 0, 3 days, 3);

        (address m, string memory name, uint256 amount, uint256 interval, bool active) = subs.getPlan(planId);
        assertEq(m, merchant);
        assertEq(name, "Pro Monthly");
        assertEq(amount, planAmount);
        assertEq(interval, planInterval);
        assertTrue(active);
    }

    function testCreatePlanEmitsEvent() public {
        vm.expectEmit(true, true, false, true);
        emit Subscriptions.PlanCreated(1, merchant, "Pro Monthly", planAmount, planInterval);

        vm.prank(merchant);
        subs.createPlan("Pro Monthly", planAmount, planInterval, 0, 3 days, 3);
    }

    function testCannotCreatePlanWithZeroAmount() public {
        vm.prank(merchant);
        vm.expectRevert("Subscriptions: zero amount");
        subs.createPlan("Bad Plan", 0, planInterval, 0, 3 days, 3);
    }

    function testCannotCreatePlanWithShortInterval() public {
        vm.prank(merchant);
        vm.expectRevert("Subscriptions: interval too short");
        subs.createPlan("Bad Plan", planAmount, 30 minutes, 0, 3 days, 3);
    }

    function testDeactivatePlan() public {
        vm.prank(merchant);
        uint256 planId = subs.createPlan("Pro Monthly", planAmount, planInterval, 0, 3 days, 3);

        vm.prank(merchant);
        subs.deactivatePlan(planId);

        (, , , , bool active) = subs.getPlan(planId);
        assertFalse(active);
    }

    function testCannotDeactivateOthersPlan() public {
        vm.prank(merchant);
        uint256 planId = subs.createPlan("Pro Monthly", planAmount, planInterval, 0, 3 days, 3);

        vm.prank(customer);
        vm.expectRevert("Subscriptions: not plan owner");
        subs.deactivatePlan(planId);
    }

    // ──────────────────────────────────────────────
    // Subscribe
    // ──────────────────────────────────────────────

    function testSubscribe() public {
        vm.prank(merchant);
        uint256 planId = subs.createPlan("Pro Monthly", planAmount, planInterval, 0, 3 days, 3);

        vm.prank(customer);
        uint256 subId = subs.subscribe(planId);

        (uint256 retPlanId, address retCustomer, Subscriptions.SubscriptionStatus status, uint256 nextBillingAt,) =
            subs.getSubscription(subId);
        assertEq(retPlanId, planId);
        assertEq(retCustomer, customer);
        assertEq(uint8(status), uint8(Subscriptions.SubscriptionStatus.Active));
        assertEq(nextBillingAt, block.timestamp); // no trial, due immediately
    }

    function testSubscribeWithTrial() public {
        vm.prank(merchant);
        uint256 planId = subs.createPlan("Pro Monthly", planAmount, planInterval, 14, 3 days, 3);

        uint256 subscribeTime = block.timestamp;
        vm.prank(customer);
        uint256 subId = subs.subscribe(planId);

        (, , , uint256 nextBillingAt,) = subs.getSubscription(subId);
        assertEq(nextBillingAt, subscribeTime + 14 days);
    }

    function testSubscribeEmitsEvent() public {
        vm.prank(merchant);
        uint256 planId = subs.createPlan("Pro Monthly", planAmount, planInterval, 0, 3 days, 3);

        vm.expectEmit(true, true, true, true);
        emit Subscriptions.SubscriptionCreated(1, planId, customer, 0);

        vm.prank(customer);
        subs.subscribe(planId);
    }

    function testCannotSubscribeToInactivePlan() public {
        vm.prank(merchant);
        uint256 planId = subs.createPlan("Pro Monthly", planAmount, planInterval, 0, 3 days, 3);

        vm.prank(merchant);
        subs.deactivatePlan(planId);

        vm.prank(customer);
        vm.expectRevert("Subscriptions: plan inactive");
        subs.subscribe(planId);
    }

    function testCannotSubscribeToNonexistentPlan() public {
        vm.prank(customer);
        vm.expectRevert("Subscriptions: plan not found");
        subs.subscribe(999);
    }

    // ──────────────────────────────────────────────
    // Charge Billing
    // ──────────────────────────────────────────────

    function testChargeBilling() public {
        vm.prank(merchant);
        uint256 planId = subs.createPlan("Pro Monthly", planAmount, planInterval, 0, 3 days, 3);

        vm.prank(customer);
        uint256 subId = subs.subscribe(planId);

        uint256 merchantBalBefore = usdc.balanceOf(merchant);

        // Charge billing
        subs.chargeBilling(subId);

        uint256 merchantBalAfter = usdc.balanceOf(merchant);
        assertEq(merchantBalAfter - merchantBalBefore, planAmount);

        (, , Subscriptions.SubscriptionStatus status, uint256 nextBillingAt,) = subs.getSubscription(subId);
        assertEq(uint8(status), uint8(Subscriptions.SubscriptionStatus.Active));
        assertEq(nextBillingAt, block.timestamp + planInterval);
    }

    function testChargeBillingEmitsEvent() public {
        vm.prank(merchant);
        uint256 planId = subs.createPlan("Pro Monthly", planAmount, planInterval, 0, 3 days, 3);

        vm.prank(customer);
        uint256 subId = subs.subscribe(planId);

        vm.expectEmit(true, true, false, true);
        emit Subscriptions.BillingCharged(subId, customer, planAmount, block.timestamp + planInterval);

        subs.chargeBilling(subId);
    }

    function testCannotChargeBillingBeforeDue() public {
        vm.prank(merchant);
        uint256 planId = subs.createPlan("Pro Monthly", planAmount, planInterval, 0, 3 days, 3);

        vm.prank(customer);
        uint256 subId = subs.subscribe(planId);

        // Charge first billing
        subs.chargeBilling(subId);

        // Try to charge again immediately
        vm.expectRevert("Subscriptions: not due yet");
        subs.chargeBilling(subId);
    }

    function testChargeBillingMultipleCycles() public {
        vm.prank(merchant);
        uint256 planId = subs.createPlan("Pro Monthly", planAmount, planInterval, 0, 3 days, 3);

        vm.prank(customer);
        uint256 subId = subs.subscribe(planId);

        // Cycle 1
        subs.chargeBilling(subId);
        assertEq(usdc.balanceOf(merchant), planAmount);

        // Advance to next cycle
        vm.warp(block.timestamp + planInterval);

        // Cycle 2
        subs.chargeBilling(subId);
        assertEq(usdc.balanceOf(merchant), planAmount * 2);
    }

    function testCannotChargeAfterTrialNotEnded() public {
        vm.prank(merchant);
        uint256 planId = subs.createPlan("Pro Monthly", planAmount, planInterval, 14, 3 days, 3);

        vm.prank(customer);
        uint256 subId = subs.subscribe(planId);

        // Try to charge during trial
        vm.expectRevert("Subscriptions: not due yet");
        subs.chargeBilling(subId);
    }

    function testChargeAfterTrialEnds() public {
        vm.prank(merchant);
        uint256 planId = subs.createPlan("Pro Monthly", planAmount, planInterval, 14, 3 days, 3);

        vm.prank(customer);
        uint256 subId = subs.subscribe(planId);

        // Advance past trial
        vm.warp(block.timestamp + 14 days);

        // Now charge should succeed
        subs.chargeBilling(subId);
        assertEq(usdc.balanceOf(merchant), planAmount);
    }

    // ──────────────────────────────────────────────
    // Dunning / Retry
    // ──────────────────────────────────────────────

    function testBillingFailedIncreasesRetryCount() public {
        vm.prank(merchant);
        uint256 planId = subs.createPlan("Pro Monthly", planAmount, planInterval, 0, 3 days, 3);

        vm.prank(customer);
        uint256 subId = subs.subscribe(planId);

        // Remove all customer USDC so charge fails
        // Revoke approval so transferFrom returns false
        vm.prank(customer);
        usdc.approve(address(subs), 0);

        // Charge billing - should fail but not revert
        subs.chargeBilling(subId);

        (, , Subscriptions.SubscriptionStatus status, , uint256 retryCount) = subs.getSubscription(subId);
        assertEq(retryCount, 1);
        // Not yet past_due (maxRetries = 3)
        assertEq(uint8(status), uint8(Subscriptions.SubscriptionStatus.Active));
    }

    function testDunningMovesPastDueAfterMaxRetries() public {
        vm.prank(merchant);
        uint256 planId = subs.createPlan("Pro Monthly", planAmount, planInterval, 0, 3 days, 3);

        vm.prank(customer);
        uint256 subId = subs.subscribe(planId);

        // Revoke approval so charge fails
        vm.prank(customer);
        usdc.approve(address(subs), 0);

        // 3 retries
        subs.chargeBilling(subId);
        subs.chargeBilling(subId);
        subs.chargeBilling(subId);

        (, , Subscriptions.SubscriptionStatus status, , uint256 retryCount) = subs.getSubscription(subId);
        assertEq(retryCount, 3);
        assertEq(uint8(status), uint8(Subscriptions.SubscriptionStatus.PastDue));
    }

    function testBillingFailedEmitsEvent() public {
        vm.prank(merchant);
        uint256 planId = subs.createPlan("Pro Monthly", planAmount, planInterval, 0, 3 days, 3);

        vm.prank(customer);
        uint256 subId = subs.subscribe(planId);

        vm.prank(customer);
        usdc.approve(address(subs), 0);

        vm.expectEmit(true, true, false, true);
        emit Subscriptions.BillingFailed(subId, customer, 1, 3);

        subs.chargeBilling(subId);
    }

    function testRecoveryFromPastDue() public {
        vm.prank(merchant);
        uint256 planId = subs.createPlan("Pro Monthly", planAmount, planInterval, 0, 3 days, 3);

        vm.prank(customer);
        uint256 subId = subs.subscribe(planId);

        // Fail 3 times to go past_due
        vm.prank(customer);
        usdc.approve(address(subs), 0);
        subs.chargeBilling(subId);
        subs.chargeBilling(subId);
        subs.chargeBilling(subId);

        // Customer re-approves
        vm.prank(customer);
        usdc.approve(address(subs), type(uint256).max);

        // Charge should now succeed and reset to Active
        subs.chargeBilling(subId);

        (, , Subscriptions.SubscriptionStatus status, , uint256 retryCount) = subs.getSubscription(subId);
        assertEq(uint8(status), uint8(Subscriptions.SubscriptionStatus.Active));
        assertEq(retryCount, 0);
    }

    // ──────────────────────────────────────────────
    // Cancel
    // ──────────────────────────────────────────────

    function testCancelSubscription() public {
        vm.prank(merchant);
        uint256 planId = subs.createPlan("Pro Monthly", planAmount, planInterval, 0, 3 days, 3);

        vm.prank(customer);
        uint256 subId = subs.subscribe(planId);

        vm.prank(customer);
        subs.cancel(subId);

        (, , Subscriptions.SubscriptionStatus status, ,) = subs.getSubscription(subId);
        assertEq(uint8(status), uint8(Subscriptions.SubscriptionStatus.Canceled));
        assertFalse(subs.authorizations(subId));
    }

    function testCancelEmitsEvent() public {
        vm.prank(merchant);
        uint256 planId = subs.createPlan("Pro Monthly", planAmount, planInterval, 0, 3 days, 3);

        vm.prank(customer);
        uint256 subId = subs.subscribe(planId);

        vm.expectEmit(true, true, false, false);
        emit Subscriptions.SubscriptionCanceled(subId, customer);

        vm.prank(customer);
        subs.cancel(subId);
    }

    function testCannotChargeAfterCancel() public {
        vm.prank(merchant);
        uint256 planId = subs.createPlan("Pro Monthly", planAmount, planInterval, 0, 3 days, 3);

        vm.prank(customer);
        uint256 subId = subs.subscribe(planId);

        vm.prank(customer);
        subs.cancel(subId);

        vm.expectRevert("Subscriptions: not chargeable");
        subs.chargeBilling(subId);
    }

    function testNonSubscriberCannotCancel() public {
        vm.prank(merchant);
        uint256 planId = subs.createPlan("Pro Monthly", planAmount, planInterval, 0, 3 days, 3);

        vm.prank(customer);
        uint256 subId = subs.subscribe(planId);

        vm.prank(merchant);
        vm.expectRevert("Subscriptions: not subscriber");
        subs.cancel(subId);
    }

    // ──────────────────────────────────────────────
    // Pause / Resume
    // ──────────────────────────────────────────────

    function testPauseSubscription() public {
        vm.prank(merchant);
        uint256 planId = subs.createPlan("Pro Monthly", planAmount, planInterval, 0, 3 days, 3);

        vm.prank(customer);
        uint256 subId = subs.subscribe(planId);

        vm.prank(customer);
        subs.pause(subId);

        (, , Subscriptions.SubscriptionStatus status, ,) = subs.getSubscription(subId);
        assertEq(uint8(status), uint8(Subscriptions.SubscriptionStatus.Paused));
    }

    function testPauseEmitsEvent() public {
        vm.prank(merchant);
        uint256 planId = subs.createPlan("Pro Monthly", planAmount, planInterval, 0, 3 days, 3);

        vm.prank(customer);
        uint256 subId = subs.subscribe(planId);

        vm.expectEmit(true, true, false, false);
        emit Subscriptions.SubscriptionPaused(subId, customer);

        vm.prank(customer);
        subs.pause(subId);
    }

    function testCannotChargeWhilePaused() public {
        vm.prank(merchant);
        uint256 planId = subs.createPlan("Pro Monthly", planAmount, planInterval, 0, 3 days, 3);

        vm.prank(customer);
        uint256 subId = subs.subscribe(planId);

        vm.prank(customer);
        subs.pause(subId);

        vm.expectRevert("Subscriptions: not chargeable");
        subs.chargeBilling(subId);
    }

    function testResumeSubscription() public {
        vm.prank(merchant);
        uint256 planId = subs.createPlan("Pro Monthly", planAmount, planInterval, 0, 3 days, 3);

        vm.prank(customer);
        uint256 subId = subs.subscribe(planId);

        vm.prank(customer);
        subs.pause(subId);

        vm.prank(customer);
        subs.resume(subId);

        (, , Subscriptions.SubscriptionStatus status, ,) = subs.getSubscription(subId);
        assertEq(uint8(status), uint8(Subscriptions.SubscriptionStatus.Active));
    }

    function testCanCancelFromPaused() public {
        vm.prank(merchant);
        uint256 planId = subs.createPlan("Pro Monthly", planAmount, planInterval, 0, 3 days, 3);

        vm.prank(customer);
        uint256 subId = subs.subscribe(planId);

        vm.prank(customer);
        subs.pause(subId);

        vm.prank(customer);
        subs.cancel(subId);

        (, , Subscriptions.SubscriptionStatus status, ,) = subs.getSubscription(subId);
        assertEq(uint8(status), uint8(Subscriptions.SubscriptionStatus.Canceled));
    }
}
