// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "./interfaces/IERC20.sol";

/// @title ChainPayments
/// @notice Core payment processor for on-chain USDC payments.
///         Handles payment intents, direct refunds, and escrow holds.
/// @dev Designed for Arc Testnet where USDC is the native gas token.
contract ChainPayments {
    // ──────────────────────────────────────────────
    // Types
    // ──────────────────────────────────────────────

    enum PaymentStatus {
        None,           // 0 - does not exist
        AwaitingPayment,// 1 - created, not yet paid
        Succeeded,      // 2 - confirmed on-chain
        Failed,         // 3 - rejected or reverted
        Expired,        // 4 - timed out
        Refunded,       // 5 - fully refunded
        PartialRefund   // 6 - partially refunded
    }

    enum HoldStatus {
        None,
        Active,
        Captured,
        Released,
        Expired
    }

    struct Payment {
        bytes32 id;
        uint256 amount;
        uint256 fee;
        uint256 refundedAmount;
        address payer;
        address merchant;
        PaymentStatus status;
        uint256 createdAt;
        uint256 paidAt;
    }

    struct Hold {
        bytes32 id;
        bytes32 paymentId;
        uint256 amount;
        uint256 capturedAmount;
        uint256 releasedAmount;
        address payer;
        address merchant;
        HoldStatus status;
        uint256 expiresAt;
        uint256 createdAt;
    }

    // ──────────────────────────────────────────────
    // Events
    // ──────────────────────────────────────────────

    event PaymentCreated(bytes32 indexed id, address indexed merchant, uint256 amount);
    event PaymentSucceeded(bytes32 indexed id, address indexed payer, address indexed merchant, uint256 amount);
    event PaymentFailed(bytes32 indexed id);
    event PaymentExpired(bytes32 indexed id);

    event DirectRefundIssued(bytes32 indexed paymentId, address indexed payer, uint256 amount);
    event PartialRefundIssued(bytes32 indexed paymentId, address indexed payer, uint256 amount);

    event HoldCreated(bytes32 indexed holdId, bytes32 indexed paymentId, uint256 amount, uint256 expiresAt);
    event HoldCaptured(bytes32 indexed holdId, uint256 amount);
    event HoldReleased(bytes32 indexed holdId, uint256 amount);
    event HoldExpired(bytes32 indexed holdId);

    event MerchantRegistered(address indexed merchant, address indexed settlementWallet);
    event FeeUpdated(uint256 oldFeeBps, uint256 newFeeBps);

    // ──────────────────────────────────────────────
    // State
    // ──────────────────────────────────────────────

    address public owner;
    IERC20 public usdc;
    uint256 public feeBps; // basis points (100 = 1%)

    mapping(bytes32 => Payment) public payments;
    mapping(bytes32 => Hold) public holds;
    mapping(address => address) public merchantSettlementWallets;
    mapping(address => bool) public registeredMerchants;

    uint256 public totalVolume;
    uint256 public totalFees;
    uint256 public paymentCount;

    uint256 public constant MAX_FEE_BPS = 500; // 5% max
    uint256 public constant MIN_PAYMENT = 1;   // 1 USDC cent
    uint256 public constant MAX_HOLD_DURATION = 30 days;
    uint256 public constant DEFAULT_HOLD_DURATION = 7 days;
    uint256 public constant PAYMENT_EXPIRY = 30 minutes;

    bool private _locked;

    // ──────────────────────────────────────────────
    // Modifiers
    // ──────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "ChainPayments: not owner");
        _;
    }

    modifier onlyMerchant() {
        require(registeredMerchants[msg.sender], "ChainPayments: not registered merchant");
        _;
    }

    modifier nonReentrant() {
        require(!_locked, "ChainPayments: reentrant call");
        _locked = true;
        _;
        _locked = false;
    }

    // ──────────────────────────────────────────────
    // Constructor
    // ──────────────────────────────────────────────

    /// @param _owner Platform owner address
    constructor(address _owner) {
        require(_owner != address(0), "ChainPayments: zero owner");
        owner = _owner;
        feeBps = 10; // 0.1% default fee
    }

    // ──────────────────────────────────────────────
    // Admin
    // ──────────────────────────────────────────────

    /// @notice Set the USDC token contract address
    function setUSDC(address _usdc) external onlyOwner {
        require(_usdc != address(0), "ChainPayments: zero address");
        usdc = IERC20(_usdc);
    }

    /// @notice Update the platform fee (basis points)
    function setFeeBps(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= MAX_FEE_BPS, "ChainPayments: fee too high");
        uint256 old = feeBps;
        feeBps = _feeBps;
        emit FeeUpdated(old, _feeBps);
    }

    /// @notice Register a merchant with their settlement wallet
    function registerMerchant(address merchant, address settlementWallet) external onlyOwner {
        require(merchant != address(0) && settlementWallet != address(0), "ChainPayments: zero address");
        registeredMerchants[merchant] = true;
        merchantSettlementWallets[merchant] = settlementWallet;
        emit MerchantRegistered(merchant, settlementWallet);
    }

    // ──────────────────────────────────────────────
    // Payments
    // ──────────────────────────────────────────────

    /// @notice Create a new payment intent
    /// @param id Unique payment identifier (generated off-chain)
    /// @param amount Payment amount in USDC smallest unit
    /// @param merchant Merchant address
    function createPayment(bytes32 id, uint256 amount, address merchant) external onlyOwner {
        require(payments[id].status == PaymentStatus.None, "ChainPayments: id exists");
        require(amount >= MIN_PAYMENT, "ChainPayments: amount too low");
        require(registeredMerchants[merchant], "ChainPayments: merchant not registered");

        uint256 fee = (amount * feeBps) / 10000;

        payments[id] = Payment({
            id: id,
            amount: amount,
            fee: fee,
            refundedAmount: 0,
            payer: address(0),
            merchant: merchant,
            status: PaymentStatus.AwaitingPayment,
            createdAt: block.timestamp,
            paidAt: 0
        });

        paymentCount++;
        emit PaymentCreated(id, merchant, amount);
    }

    /// @notice Customer pays a payment intent by transferring USDC
    /// @param id Payment intent ID
    function pay(bytes32 id) external nonReentrant {
        Payment storage p = payments[id];
        require(p.status == PaymentStatus.AwaitingPayment, "ChainPayments: not awaiting payment");
        require(block.timestamp <= p.createdAt + PAYMENT_EXPIRY, "ChainPayments: payment expired");

        uint256 totalRequired = p.amount;
        require(usdc.transferFrom(msg.sender, address(this), totalRequired), "ChainPayments: transfer failed");

        // Send net amount to merchant settlement wallet
        address settlement = merchantSettlementWallets[p.merchant];
        uint256 netAmount = p.amount - p.fee;
        require(usdc.transfer(settlement, netAmount), "ChainPayments: merchant transfer failed");

        // Fee stays in contract for owner to withdraw
        totalFees += p.fee;
        totalVolume += p.amount;

        p.payer = msg.sender;
        p.status = PaymentStatus.Succeeded;
        p.paidAt = block.timestamp;

        emit PaymentSucceeded(id, msg.sender, p.merchant, p.amount);
    }

    /// @notice Mark a payment as expired (callable by owner after expiry)
    function expirePayment(bytes32 id) external onlyOwner {
        Payment storage p = payments[id];
        require(p.status == PaymentStatus.AwaitingPayment, "ChainPayments: not awaiting");
        require(block.timestamp > p.createdAt + PAYMENT_EXPIRY, "ChainPayments: not expired yet");

        p.status = PaymentStatus.Expired;
        emit PaymentExpired(id);
    }

    // ──────────────────────────────────────────────
    // Direct Refunds
    // ──────────────────────────────────────────────

    /// @notice Merchant issues a direct refund to the payer's original address
    /// @param paymentId Original payment ID
    /// @param amount Refund amount (can be partial)
    function directRefund(bytes32 paymentId, uint256 amount) external nonReentrant onlyMerchant {
        Payment storage p = payments[paymentId];
        require(p.status == PaymentStatus.Succeeded || p.status == PaymentStatus.PartialRefund, "ChainPayments: not refundable");
        require(p.merchant == msg.sender, "ChainPayments: not your payment");
        require(amount > 0 && amount <= p.amount - p.refundedAmount, "ChainPayments: invalid refund amount");
        require(p.payer != address(0), "ChainPayments: no payer address");

        // Merchant must have approved USDC to this contract
        require(usdc.transferFrom(msg.sender, p.payer, amount), "ChainPayments: refund transfer failed");

        p.refundedAmount += amount;

        if (p.refundedAmount == p.amount) {
            p.status = PaymentStatus.Refunded;
            emit DirectRefundIssued(paymentId, p.payer, amount);
        } else {
            p.status = PaymentStatus.PartialRefund;
            emit PartialRefundIssued(paymentId, p.payer, amount);
        }
    }

    // ──────────────────────────────────────────────
    // Escrow Holds (V2)
    // ──────────────────────────────────────────────

    /// @notice Create an escrow hold on a payment
    function createHold(bytes32 holdId, bytes32 paymentId, uint256 amount, uint256 duration) external nonReentrant {
        require(holds[holdId].status == HoldStatus.None, "ChainPayments: hold exists");
        Payment storage p = payments[paymentId];
        require(p.status == PaymentStatus.AwaitingPayment, "ChainPayments: not awaiting");
        require(amount >= MIN_PAYMENT, "ChainPayments: amount too low");

        if (duration == 0) duration = DEFAULT_HOLD_DURATION;
        require(duration <= MAX_HOLD_DURATION, "ChainPayments: duration too long");

        require(usdc.transferFrom(msg.sender, address(this), amount), "ChainPayments: hold transfer failed");

        holds[holdId] = Hold({
            id: holdId,
            paymentId: paymentId,
            amount: amount,
            capturedAmount: 0,
            releasedAmount: 0,
            payer: msg.sender,
            merchant: p.merchant,
            status: HoldStatus.Active,
            expiresAt: block.timestamp + duration,
            createdAt: block.timestamp
        });

        p.payer = msg.sender;
        p.status = PaymentStatus.Succeeded;
        p.paidAt = block.timestamp;

        emit HoldCreated(holdId, paymentId, amount, block.timestamp + duration);
    }

    /// @notice Capture held funds (merchant pulls from escrow)
    function captureHold(bytes32 holdId, uint256 amount) external nonReentrant onlyMerchant {
        Hold storage h = holds[holdId];
        require(h.status == HoldStatus.Active, "ChainPayments: hold not active");
        require(h.merchant == msg.sender, "ChainPayments: not your hold");
        require(block.timestamp < h.expiresAt, "ChainPayments: hold expired");

        uint256 remaining = h.amount - h.capturedAmount - h.releasedAmount;
        require(amount > 0 && amount <= remaining, "ChainPayments: invalid capture amount");

        address settlement = merchantSettlementWallets[msg.sender];
        require(usdc.transfer(settlement, amount), "ChainPayments: capture transfer failed");

        h.capturedAmount += amount;
        totalVolume += amount;

        if (h.capturedAmount + h.releasedAmount == h.amount) {
            h.status = HoldStatus.Captured;
        }

        emit HoldCaptured(holdId, amount);
    }

    /// @notice Release held funds back to payer
    function releaseHold(bytes32 holdId, uint256 amount) external nonReentrant onlyMerchant {
        Hold storage h = holds[holdId];
        require(h.status == HoldStatus.Active, "ChainPayments: hold not active");
        require(h.merchant == msg.sender, "ChainPayments: not your hold");

        uint256 remaining = h.amount - h.capturedAmount - h.releasedAmount;
        require(amount > 0 && amount <= remaining, "ChainPayments: invalid release amount");

        require(usdc.transfer(h.payer, amount), "ChainPayments: release transfer failed");

        h.releasedAmount += amount;

        if (h.capturedAmount + h.releasedAmount == h.amount) {
            h.status = HoldStatus.Released;
        }

        emit HoldReleased(holdId, amount);
    }

    /// @notice Auto-release expired holds back to payer
    function expireHold(bytes32 holdId) external nonReentrant {
        Hold storage h = holds[holdId];
        require(h.status == HoldStatus.Active, "ChainPayments: hold not active");
        require(block.timestamp >= h.expiresAt, "ChainPayments: not expired yet");

        uint256 remaining = h.amount - h.capturedAmount - h.releasedAmount;
        if (remaining > 0) {
            require(usdc.transfer(h.payer, remaining), "ChainPayments: expire release failed");
            h.releasedAmount += remaining;
        }

        h.status = HoldStatus.Expired;
        emit HoldExpired(holdId);
    }

    // ──────────────────────────────────────────────
    // Views
    // ──────────────────────────────────────────────

    function getPayment(bytes32 id)
        external
        view
        returns (uint256 amount, address payer, address merchant, PaymentStatus status, uint256 refundedAmount)
    {
        Payment storage p = payments[id];
        return (p.amount, p.payer, p.merchant, p.status, p.refundedAmount);
    }

    function getHold(bytes32 id)
        external
        view
        returns (uint256 amount, uint256 captured, uint256 released, HoldStatus status, uint256 expiresAt)
    {
        Hold storage h = holds[id];
        return (h.amount, h.capturedAmount, h.releasedAmount, h.status, h.expiresAt);
    }

    // ──────────────────────────────────────────────
    // Owner: Withdraw fees
    // ──────────────────────────────────────────────

    function withdrawFees(address to) external onlyOwner nonReentrant {
        require(to != address(0), "ChainPayments: zero address");
        uint256 balance = usdc.balanceOf(address(this));
        require(balance > 0, "ChainPayments: no fees");
        require(usdc.transfer(to, balance), "ChainPayments: withdraw failed");
    }
}
