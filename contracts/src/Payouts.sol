// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces/IERC20.sol";

/// @title Payouts
/// @notice Batch payout processor for platform-to-merchant USDC disbursements.
///         The owner creates individual payout records and then executes them in
///         batches to save gas and simplify accounting.
contract Payouts {
    // ──────────────────────────────────────────────
    // Types
    // ──────────────────────────────────────────────

    enum PayoutStatus {
        None,       // 0 - does not exist
        Pending,    // 1 - created, awaiting execution
        Processing, // 2 - included in a batch, in progress
        Completed,  // 3 - successfully transferred
        Failed      // 4 - transfer failed
    }

    struct Payout {
        uint256 id;
        address recipient;
        uint256 amount;
        PayoutStatus status;
        uint256 createdAt;
        uint256 completedAt;
    }

    // ──────────────────────────────────────────────
    // Events
    // ──────────────────────────────────────────────

    event PayoutCreated(uint256 indexed payoutId, address indexed recipient, uint256 amount);
    event PayoutCompleted(uint256 indexed payoutId, address indexed recipient, uint256 amount);
    event PayoutFailed(uint256 indexed payoutId, address indexed recipient, uint256 amount);
    event BatchExecuted(uint256[] payoutIds, uint256 totalAmount, uint256 successCount, uint256 failCount);

    // ──────────────────────────────────────────────
    // State
    // ──────────────────────────────────────────────

    address public owner;
    IERC20 public usdc;

    uint256 public payoutCount;
    mapping(uint256 => Payout) public payouts;

    uint256 public totalDisbursed;
    uint256 public totalPayoutsCompleted;

    bool private _locked;

    // ──────────────────────────────────────────────
    // Modifiers
    // ──────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "Payouts: not owner");
        _;
    }

    modifier nonReentrant() {
        require(!_locked, "Payouts: reentrant call");
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
        require(_owner != address(0), "Payouts: zero owner");
        require(_usdc != address(0), "Payouts: zero usdc");
        owner = _owner;
        usdc = IERC20(_usdc);
    }

    // ──────────────────────────────────────────────
    // Payout Management
    // ──────────────────────────────────────────────

    /// @notice Create a single payout record (pending state)
    /// @param recipient Address to receive the payout
    /// @param amount USDC amount to disburse
    function createPayout(address recipient, uint256 amount) external onlyOwner returns (uint256 payoutId) {
        require(recipient != address(0), "Payouts: zero recipient");
        require(amount > 0, "Payouts: zero amount");

        payoutId = ++payoutCount;

        payouts[payoutId] = Payout({
            id: payoutId,
            recipient: recipient,
            amount: amount,
            status: PayoutStatus.Pending,
            createdAt: block.timestamp,
            completedAt: 0
        });

        emit PayoutCreated(payoutId, recipient, amount);
    }

    /// @notice Execute a batch of payouts in a single transaction.
    ///         The contract must hold enough USDC to cover all payouts.
    /// @param payoutIds Array of payout IDs to execute
    function executeBatch(uint256[] calldata payoutIds) external onlyOwner nonReentrant {
        require(payoutIds.length > 0, "Payouts: empty batch");

        uint256 totalAmount = 0;
        uint256 successCount = 0;
        uint256 failCount = 0;

        // Mark all as processing first
        for (uint256 i = 0; i < payoutIds.length; i++) {
            Payout storage p = payouts[payoutIds[i]];
            require(p.id != 0, "Payouts: payout not found");
            require(p.status == PayoutStatus.Pending, "Payouts: not pending");
            p.status = PayoutStatus.Processing;
        }

        // Execute transfers
        for (uint256 i = 0; i < payoutIds.length; i++) {
            Payout storage p = payouts[payoutIds[i]];

            bool success = usdc.transfer(p.recipient, p.amount);

            if (success) {
                p.status = PayoutStatus.Completed;
                p.completedAt = block.timestamp;
                totalAmount += p.amount;
                successCount++;
                totalDisbursed += p.amount;
                totalPayoutsCompleted++;

                emit PayoutCompleted(p.id, p.recipient, p.amount);
            } else {
                p.status = PayoutStatus.Failed;
                failCount++;

                emit PayoutFailed(p.id, p.recipient, p.amount);
            }
        }

        emit BatchExecuted(payoutIds, totalAmount, successCount, failCount);
    }

    // ──────────────────────────────────────────────
    // Views
    // ──────────────────────────────────────────────

    function getPayout(uint256 payoutId)
        external
        view
        returns (address recipient, uint256 amount, PayoutStatus status, uint256 createdAt, uint256 completedAt)
    {
        Payout storage p = payouts[payoutId];
        return (p.recipient, p.amount, p.status, p.createdAt, p.completedAt);
    }
}
