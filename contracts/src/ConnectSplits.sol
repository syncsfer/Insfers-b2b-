// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces/IERC20.sol";

/// @title ConnectSplits
/// @notice Marketplace payment splits for connected accounts.
///         A platform registers connected accounts (merchants/sellers) and can
///         split incoming USDC payments across multiple recipients.
contract ConnectSplits {
    // ──────────────────────────────────────────────
    // Types
    // ──────────────────────────────────────────────

    struct ConnectedAccount {
        address owner;
        address settlementWallet;
        bool active;
    }

    struct SplitRule {
        address recipient;  // recipient address (must be a connected account or platform)
        uint256 bps;        // basis points share (e.g. 5000 = 50%)
        uint256 flat;       // flat USDC amount added on top of bps share
    }

    struct SplitRecord {
        bytes32 paymentId;
        address payer;
        uint256 totalAmount;
        uint256 platformFee;
        uint256 splitCount;
        uint256 executedAt;
    }

    // ──────────────────────────────────────────────
    // Events
    // ──────────────────────────────────────────────

    event AccountConnected(address indexed account, address indexed settlementWallet);
    event AccountDeactivated(address indexed account);

    event PaymentSplit(
        bytes32 indexed paymentId,
        address indexed recipient,
        uint256 amount
    );
    event SplitExecuted(
        bytes32 indexed paymentId,
        address indexed payer,
        uint256 totalAmount,
        uint256 platformFee,
        uint256 recipientCount
    );

    event PlatformFeeUpdated(uint256 oldFeeBps, uint256 newFeeBps);

    // ──────────────────────────────────────────────
    // State
    // ──────────────────────────────────────────────

    address public owner;
    IERC20 public usdc;

    uint256 public platformFeeBps; // platform fee in basis points (100 = 1%)
    uint256 public constant MAX_PLATFORM_FEE_BPS = 1000; // 10% max
    uint256 public constant BPS_DENOMINATOR = 10000;

    mapping(address => ConnectedAccount) public connectedAccounts;
    mapping(bytes32 => SplitRecord) public splitRecords;

    uint256 public totalSplitVolume;
    uint256 public totalPlatformFees;

    bool private _locked;

    // ──────────────────────────────────────────────
    // Modifiers
    // ──────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "ConnectSplits: not owner");
        _;
    }

    modifier nonReentrant() {
        require(!_locked, "ConnectSplits: reentrant call");
        _locked = true;
        _;
        _locked = false;
    }

    // ──────────────────────────────────────────────
    // Constructor
    // ──────────────────────────────────────────────

    /// @param _owner Platform owner address
    /// @param _usdc USDC token contract address
    /// @param _platformFeeBps Platform fee in basis points
    constructor(address _owner, address _usdc, uint256 _platformFeeBps) {
        require(_owner != address(0), "ConnectSplits: zero owner");
        require(_usdc != address(0), "ConnectSplits: zero usdc");
        require(_platformFeeBps <= MAX_PLATFORM_FEE_BPS, "ConnectSplits: fee too high");
        owner = _owner;
        usdc = IERC20(_usdc);
        platformFeeBps = _platformFeeBps;
    }

    // ──────────────────────────────────────────────
    // Admin
    // ──────────────────────────────────────────────

    /// @notice Register a connected account with a settlement wallet
    /// @param account The account address (merchant/seller)
    /// @param settlementWallet Where funds will be sent
    function connectAccount(address account, address settlementWallet) external onlyOwner {
        require(account != address(0) && settlementWallet != address(0), "ConnectSplits: zero address");
        connectedAccounts[account] = ConnectedAccount({
            owner: account,
            settlementWallet: settlementWallet,
            active: true
        });
        emit AccountConnected(account, settlementWallet);
    }

    /// @notice Deactivate a connected account
    function deactivateAccount(address account) external onlyOwner {
        require(connectedAccounts[account].active, "ConnectSplits: not active");
        connectedAccounts[account].active = false;
        emit AccountDeactivated(account);
    }

    /// @notice Update the platform fee
    function setPlatformFeeBps(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= MAX_PLATFORM_FEE_BPS, "ConnectSplits: fee too high");
        uint256 oldFee = platformFeeBps;
        platformFeeBps = _feeBps;
        emit PlatformFeeUpdated(oldFee, _feeBps);
    }

    // ──────────────────────────────────────────────
    // Split Payments
    // ──────────────────────────────────────────────

    /// @notice Split a USDC payment across multiple recipients.
    ///         The caller must have approved this contract for the total amount.
    ///         Platform fee is deducted first, then the remainder is split
    ///         according to the provided rules.
    /// @param paymentId Unique identifier for this split payment
    /// @param totalAmount Total USDC amount to be split
    /// @param rules Array of split rules (recipient, bps, flat)
    function splitPayment(bytes32 paymentId, uint256 totalAmount, SplitRule[] calldata rules)
        external
        nonReentrant
    {
        require(splitRecords[paymentId].executedAt == 0, "ConnectSplits: payment exists");
        require(totalAmount > 0, "ConnectSplits: zero amount");
        require(rules.length > 0, "ConnectSplits: no rules");

        // Calculate and deduct platform fee
        uint256 platformFee = (totalAmount * platformFeeBps) / BPS_DENOMINATOR;
        uint256 distributable = totalAmount - platformFee;

        // Validate that bps + flat amounts sum to exactly the distributable amount
        uint256 totalBps = 0;
        uint256 totalFlat = 0;
        for (uint256 i = 0; i < rules.length; i++) {
            require(rules[i].recipient != address(0), "ConnectSplits: zero recipient");
            require(
                connectedAccounts[rules[i].recipient].active,
                "ConnectSplits: recipient not connected"
            );
            totalBps += rules[i].bps;
            totalFlat += rules[i].flat;
        }

        // Calculate the total that would be distributed
        uint256 bpsDistributed = (distributable * totalBps) / BPS_DENOMINATOR;
        uint256 totalDistributed = bpsDistributed + totalFlat;
        require(totalDistributed == distributable, "ConnectSplits: splits != 100%");

        // Pull total amount from sender
        require(
            usdc.transferFrom(msg.sender, address(this), totalAmount),
            "ConnectSplits: transfer failed"
        );

        // Send platform fee to owner
        if (platformFee > 0) {
            require(usdc.transfer(owner, platformFee), "ConnectSplits: fee transfer failed");
        }

        // Distribute to each recipient
        for (uint256 i = 0; i < rules.length; i++) {
            uint256 bpsAmount = (distributable * rules[i].bps) / BPS_DENOMINATOR;
            uint256 recipientAmount = bpsAmount + rules[i].flat;

            if (recipientAmount > 0) {
                address settlement = connectedAccounts[rules[i].recipient].settlementWallet;
                require(
                    usdc.transfer(settlement, recipientAmount),
                    "ConnectSplits: split transfer failed"
                );

                emit PaymentSplit(paymentId, rules[i].recipient, recipientAmount);
            }
        }

        // Record the split
        splitRecords[paymentId] = SplitRecord({
            paymentId: paymentId,
            payer: msg.sender,
            totalAmount: totalAmount,
            platformFee: platformFee,
            splitCount: rules.length,
            executedAt: block.timestamp
        });

        totalSplitVolume += totalAmount;
        totalPlatformFees += platformFee;

        emit SplitExecuted(paymentId, msg.sender, totalAmount, platformFee, rules.length);
    }

    // ──────────────────────────────────────────────
    // Views
    // ──────────────────────────────────────────────

    function getSplitRecord(bytes32 paymentId)
        external
        view
        returns (address payer, uint256 totalAmount, uint256 platformFee, uint256 splitCount, uint256 executedAt)
    {
        SplitRecord storage r = splitRecords[paymentId];
        return (r.payer, r.totalAmount, r.platformFee, r.splitCount, r.executedAt);
    }

    function isConnected(address account) external view returns (bool) {
        return connectedAccounts[account].active;
    }
}
