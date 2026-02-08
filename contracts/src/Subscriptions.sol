// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces/IERC20.sol";

/// @title Subscriptions
/// @notice Recurring USDC payments with wallet-based authorization.
///         Merchants create plans, customers subscribe by authorizing on-chain,
///         and a merchant or bot calls chargeBilling() each cycle.
contract Subscriptions {
    // ──────────────────────────────────────────────
    // Types
    // ──────────────────────────────────────────────

    enum SubscriptionStatus {
        None,       // 0 - does not exist
        Active,     // 1 - currently active
        PastDue,    // 2 - charge failed, in dunning
        Paused,     // 3 - paused by customer
        Canceled    // 4 - permanently canceled
    }

    struct Plan {
        uint256 id;
        address merchant;
        string name;
        uint256 amount;         // USDC amount per interval (6 decimals)
        uint256 interval;       // billing interval in seconds
        uint256 trialDays;      // free trial length in days (0 = no trial)
        uint256 gracePeriod;    // seconds after due date before past_due
        uint256 maxRetries;     // max charge retries before past_due
        bool active;            // merchant can deactivate plan
    }

    struct Subscription {
        uint256 id;
        uint256 planId;
        address customer;
        address merchant;
        SubscriptionStatus status;
        uint256 createdAt;
        uint256 trialEndsAt;
        uint256 nextBillingAt;
        uint256 retryCount;
        uint256 lastChargedAt;
    }

    // ──────────────────────────────────────────────
    // Events
    // ──────────────────────────────────────────────

    event PlanCreated(uint256 indexed planId, address indexed merchant, string name, uint256 amount, uint256 interval);
    event PlanDeactivated(uint256 indexed planId);

    event SubscriptionCreated(
        uint256 indexed subId, uint256 indexed planId, address indexed customer, uint256 trialEndsAt
    );
    event BillingCharged(uint256 indexed subId, address indexed customer, uint256 amount, uint256 nextBillingAt);
    event BillingFailed(uint256 indexed subId, address indexed customer, uint256 retryCount, uint256 maxRetries);
    event SubscriptionCanceled(uint256 indexed subId, address indexed customer);
    event SubscriptionPaused(uint256 indexed subId, address indexed customer);
    event SubscriptionResumed(uint256 indexed subId, address indexed customer, uint256 nextBillingAt);

    // ──────────────────────────────────────────────
    // State
    // ──────────────────────────────────────────────

    address public owner;
    IERC20 public usdc;

    uint256 public planCount;
    uint256 public subscriptionCount;

    mapping(uint256 => Plan) public plans;
    mapping(uint256 => Subscription) public subscriptions;

    /// @notice Tracks whether a customer has authorized the contract to charge them
    mapping(uint256 => bool) public authorizations; // subId => authorized

    bool private _locked;

    // ──────────────────────────────────────────────
    // Modifiers
    // ──────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "Subscriptions: not owner");
        _;
    }

    modifier nonReentrant() {
        require(!_locked, "Subscriptions: reentrant call");
        _locked = true;
        _;
        _locked = false;
    }

    // ──────────────────────────────────────────────
    // Constructor
    // ──────────────────────────────────────────────

    /// @param _owner Platform owner address
    /// @param _usdc USDC token contract address
    constructor(address _owner, address _usdc) {
        require(_owner != address(0), "Subscriptions: zero owner");
        require(_usdc != address(0), "Subscriptions: zero usdc");
        owner = _owner;
        usdc = IERC20(_usdc);
    }

    // ──────────────────────────────────────────────
    // Plan Management
    // ──────────────────────────────────────────────

    /// @notice Merchant creates a new subscription plan
    /// @param name Human-readable plan name
    /// @param amount USDC amount per billing cycle
    /// @param interval Billing interval in seconds
    /// @param trialDays Number of free trial days (0 for none)
    /// @param gracePeriod Seconds after due date before dunning escalation
    /// @param maxRetries Maximum charge retry attempts before past_due
    function createPlan(
        string calldata name,
        uint256 amount,
        uint256 interval,
        uint256 trialDays,
        uint256 gracePeriod,
        uint256 maxRetries
    ) external returns (uint256 planId) {
        require(amount > 0, "Subscriptions: zero amount");
        require(interval >= 1 hours, "Subscriptions: interval too short");
        require(maxRetries > 0, "Subscriptions: zero retries");

        planId = ++planCount;

        plans[planId] = Plan({
            id: planId,
            merchant: msg.sender,
            name: name,
            amount: amount,
            interval: interval,
            trialDays: trialDays,
            gracePeriod: gracePeriod,
            maxRetries: maxRetries,
            active: true
        });

        emit PlanCreated(planId, msg.sender, name, amount, interval);
    }

    /// @notice Merchant deactivates a plan (no new subscriptions)
    function deactivatePlan(uint256 planId) external {
        Plan storage p = plans[planId];
        require(p.merchant == msg.sender, "Subscriptions: not plan owner");
        require(p.active, "Subscriptions: already inactive");
        p.active = false;
        emit PlanDeactivated(planId);
    }

    // ──────────────────────────────────────────────
    // Subscription Lifecycle
    // ──────────────────────────────────────────────

    /// @notice Customer subscribes to a plan and authorizes recurring charges.
    ///         The customer must have approved this contract for USDC transfers.
    /// @param planId The plan to subscribe to
    function subscribe(uint256 planId) external returns (uint256 subId) {
        Plan storage p = plans[planId];
        require(p.id != 0, "Subscriptions: plan not found");
        require(p.active, "Subscriptions: plan inactive");

        subId = ++subscriptionCount;

        uint256 trialEndsAt = 0;
        uint256 nextBillingAt = block.timestamp;

        if (p.trialDays > 0) {
            trialEndsAt = block.timestamp + (p.trialDays * 1 days);
            nextBillingAt = trialEndsAt;
        }

        subscriptions[subId] = Subscription({
            id: subId,
            planId: planId,
            customer: msg.sender,
            merchant: p.merchant,
            status: SubscriptionStatus.Active,
            createdAt: block.timestamp,
            trialEndsAt: trialEndsAt,
            nextBillingAt: nextBillingAt,
            retryCount: 0,
            lastChargedAt: 0
        });

        // Customer authorizes this subscription on-chain
        authorizations[subId] = true;

        emit SubscriptionCreated(subId, planId, msg.sender, trialEndsAt);
    }

    /// @notice Process a recurring billing charge for a subscription.
    ///         Callable by the merchant or any authorized bot.
    /// @param subId Subscription ID to charge
    function chargeBilling(uint256 subId) external nonReentrant {
        Subscription storage s = subscriptions[subId];
        require(s.id != 0, "Subscriptions: sub not found");
        require(
            s.status == SubscriptionStatus.Active || s.status == SubscriptionStatus.PastDue,
            "Subscriptions: not chargeable"
        );
        require(authorizations[subId], "Subscriptions: not authorized");
        require(block.timestamp >= s.nextBillingAt, "Subscriptions: not due yet");

        Plan storage p = plans[s.planId];
        uint256 amount = p.amount;

        // Attempt to transfer USDC from customer to merchant.
        // Use try/catch because ERC20 implementations may revert
        // instead of returning false on failure.
        bool success;
        try usdc.transferFrom(s.customer, s.merchant, amount) returns (bool result) {
            success = result;
        } catch {
            success = false;
        }

        if (success) {
            s.lastChargedAt = block.timestamp;
            s.nextBillingAt = block.timestamp + p.interval;
            s.retryCount = 0;
            s.status = SubscriptionStatus.Active;

            emit BillingCharged(subId, s.customer, amount, s.nextBillingAt);
        } else {
            s.retryCount++;

            emit BillingFailed(subId, s.customer, s.retryCount, p.maxRetries);

            if (s.retryCount >= p.maxRetries) {
                s.status = SubscriptionStatus.PastDue;
            }
        }
    }

    /// @notice Customer cancels their subscription permanently
    /// @param subId Subscription ID to cancel
    function cancel(uint256 subId) external {
        Subscription storage s = subscriptions[subId];
        require(s.customer == msg.sender, "Subscriptions: not subscriber");
        require(
            s.status == SubscriptionStatus.Active || s.status == SubscriptionStatus.PastDue
                || s.status == SubscriptionStatus.Paused,
            "Subscriptions: already canceled"
        );

        s.status = SubscriptionStatus.Canceled;
        authorizations[subId] = false;

        emit SubscriptionCanceled(subId, msg.sender);
    }

    /// @notice Customer pauses their subscription (billing stops)
    /// @param subId Subscription ID to pause
    function pause(uint256 subId) external {
        Subscription storage s = subscriptions[subId];
        require(s.customer == msg.sender, "Subscriptions: not subscriber");
        require(s.status == SubscriptionStatus.Active, "Subscriptions: not active");

        s.status = SubscriptionStatus.Paused;

        emit SubscriptionPaused(subId, msg.sender);
    }

    /// @notice Customer resumes a paused subscription
    /// @param subId Subscription ID to resume
    function resume(uint256 subId) external {
        Subscription storage s = subscriptions[subId];
        require(s.customer == msg.sender, "Subscriptions: not subscriber");
        require(s.status == SubscriptionStatus.Paused, "Subscriptions: not paused");

        s.status = SubscriptionStatus.Active;
        s.nextBillingAt = block.timestamp;

        emit SubscriptionResumed(subId, msg.sender, s.nextBillingAt);
    }

    // ──────────────────────────────────────────────
    // Views
    // ──────────────────────────────────────────────

    function getPlan(uint256 planId)
        external
        view
        returns (address merchant, string memory name, uint256 amount, uint256 interval, bool active)
    {
        Plan storage p = plans[planId];
        return (p.merchant, p.name, p.amount, p.interval, p.active);
    }

    function getSubscription(uint256 subId)
        external
        view
        returns (
            uint256 planId,
            address customer,
            SubscriptionStatus status,
            uint256 nextBillingAt,
            uint256 retryCount
        )
    {
        Subscription storage s = subscriptions[subId];
        return (s.planId, s.customer, s.status, s.nextBillingAt, s.retryCount);
    }
}
