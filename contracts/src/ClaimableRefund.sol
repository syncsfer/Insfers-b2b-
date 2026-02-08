// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "./interfaces/IERC20.sol";

/// @title ClaimableRefund
/// @notice Allows merchants to deposit refunds that customers claim to any wallet.
///         Solves the exchange-address problem: customers who paid from an exchange
///         can claim their refund to a personal wallet they control.
/// @dev Refunds are identified by a bytes32 ID generated off-chain (ref_xxx).
///      Customer claims by connecting any wallet and calling `claim()`.
contract ClaimableRefund {
    // ──────────────────────────────────────────────
    // Types
    // ──────────────────────────────────────────────

    enum RefundStatus {
        None,           // does not exist
        AwaitingClaim,  // deposited, waiting for customer
        Claimed,        // customer claimed successfully
        Expired,        // claim window passed
        Returned        // expired funds returned to merchant
    }

    struct Refund {
        bytes32 id;
        bytes32 paymentId;          // original payment reference
        uint256 amount;
        address merchant;           // who deposited the refund
        address claimedBy;          // wallet that claimed (0x0 until claimed)
        RefundStatus status;
        uint256 createdAt;
        uint256 expiresAt;
        uint256 claimedAt;
        string reason;
    }

    // ──────────────────────────────────────────────
    // Events
    // ──────────────────────────────────────────────

    event RefundDeposited(
        bytes32 indexed refundId,
        bytes32 indexed paymentId,
        address indexed merchant,
        uint256 amount,
        uint256 expiresAt
    );

    event RefundClaimed(
        bytes32 indexed refundId,
        address indexed claimedBy,
        uint256 amount
    );

    event RefundExpired(bytes32 indexed refundId);

    event RefundReturned(
        bytes32 indexed refundId,
        address indexed merchant,
        uint256 amount
    );

    event ExpiryExtended(bytes32 indexed refundId, uint256 newExpiresAt);

    // ──────────────────────────────────────────────
    // State
    // ──────────────────────────────────────────────

    address public owner;
    IERC20 public usdc;

    mapping(bytes32 => Refund) public refunds;

    /// @dev Maps a claim secret hash to a refund ID.
    ///      The claim link contains the secret; customer proves they have it
    ///      by providing the secret whose keccak256 matches.
    mapping(bytes32 => bytes32) public claimSecretToRefund;

    uint256 public constant DEFAULT_EXPIRY = 24 hours;
    uint256 public constant MIN_EXPIRY = 1 hours;
    uint256 public constant MAX_EXPIRY = 30 days;

    uint256 public totalDeposited;
    uint256 public totalClaimed;
    uint256 public totalReturned;
    uint256 public refundCount;

    bool private _locked;

    // ──────────────────────────────────────────────
    // Modifiers
    // ──────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "ClaimableRefund: not owner");
        _;
    }

    modifier nonReentrant() {
        require(!_locked, "ClaimableRefund: reentrant call");
        _locked = true;
        _;
        _locked = false;
    }

    // ──────────────────────────────────────────────
    // Constructor
    // ──────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
    }

    /// @notice Set the USDC token address
    function setUSDC(address _usdc) external onlyOwner {
        require(_usdc != address(0), "ClaimableRefund: zero address");
        usdc = IERC20(_usdc);
    }

    // ──────────────────────────────────────────────
    // Merchant: Deposit Refund
    // ──────────────────────────────────────────────

    /// @notice Merchant deposits USDC to create a claimable refund
    /// @param refundId Unique refund identifier (ref_xxx hashed to bytes32)
    /// @param paymentId Original payment ID reference
    /// @param amount Refund amount in USDC smallest unit
    /// @param claimSecretHash keccak256 of the claim secret embedded in the claim URL
    /// @param expiryDuration How long the customer has to claim (0 = default 24h)
    /// @param reason Refund reason string
    function depositRefund(
        bytes32 refundId,
        bytes32 paymentId,
        uint256 amount,
        bytes32 claimSecretHash,
        uint256 expiryDuration,
        string calldata reason
    ) external nonReentrant {
        require(refunds[refundId].status == RefundStatus.None, "ClaimableRefund: id exists");
        require(amount > 0, "ClaimableRefund: zero amount");
        require(claimSecretHash != bytes32(0), "ClaimableRefund: zero secret hash");

        if (expiryDuration == 0) expiryDuration = DEFAULT_EXPIRY;
        require(expiryDuration >= MIN_EXPIRY && expiryDuration <= MAX_EXPIRY, "ClaimableRefund: invalid expiry");

        // Transfer USDC from merchant to this contract
        require(usdc.transferFrom(msg.sender, address(this), amount), "ClaimableRefund: deposit failed");

        uint256 expiresAt = block.timestamp + expiryDuration;

        refunds[refundId] = Refund({
            id: refundId,
            paymentId: paymentId,
            amount: amount,
            merchant: msg.sender,
            claimedBy: address(0),
            status: RefundStatus.AwaitingClaim,
            createdAt: block.timestamp,
            expiresAt: expiresAt,
            claimedAt: 0,
            reason: reason
        });

        claimSecretToRefund[claimSecretHash] = refundId;

        totalDeposited += amount;
        refundCount++;

        emit RefundDeposited(refundId, paymentId, msg.sender, amount, expiresAt);
    }

    // ──────────────────────────────────────────────
    // Customer: Claim Refund
    // ──────────────────────────────────────────────

    /// @notice Customer claims refund by providing the secret from the claim link
    /// @param claimSecret The secret value from the claim URL
    /// @param destinationWallet Where to send the USDC (can be any wallet customer controls)
    function claim(bytes32 claimSecret, address destinationWallet) external nonReentrant {
        require(destinationWallet != address(0), "ClaimableRefund: zero destination");

        bytes32 secretHash = keccak256(abi.encodePacked(claimSecret));
        bytes32 refundId = claimSecretToRefund[secretHash];
        require(refundId != bytes32(0), "ClaimableRefund: invalid claim secret");

        Refund storage r = refunds[refundId];
        require(r.status == RefundStatus.AwaitingClaim, "ClaimableRefund: not claimable");
        require(block.timestamp <= r.expiresAt, "ClaimableRefund: expired");

        // Transfer USDC to the customer's chosen wallet
        require(usdc.transfer(destinationWallet, r.amount), "ClaimableRefund: claim transfer failed");

        r.status = RefundStatus.Claimed;
        r.claimedBy = destinationWallet;
        r.claimedAt = block.timestamp;

        totalClaimed += r.amount;

        emit RefundClaimed(refundId, destinationWallet, r.amount);
    }

    // ──────────────────────────────────────────────
    // Merchant: Manage Expired Refunds
    // ──────────────────────────────────────────────

    /// @notice Merchant extends the claim expiry for a refund
    function extendExpiry(bytes32 refundId, uint256 additionalDuration) external {
        Refund storage r = refunds[refundId];
        require(r.merchant == msg.sender, "ClaimableRefund: not your refund");
        require(
            r.status == RefundStatus.AwaitingClaim || r.status == RefundStatus.Expired,
            "ClaimableRefund: cannot extend"
        );
        require(additionalDuration >= MIN_EXPIRY && additionalDuration <= MAX_EXPIRY, "ClaimableRefund: invalid duration");

        r.expiresAt = block.timestamp + additionalDuration;
        if (r.status == RefundStatus.Expired) {
            r.status = RefundStatus.AwaitingClaim;
        }

        emit ExpiryExtended(refundId, r.expiresAt);
    }

    /// @notice Mark a refund as expired (anyone can call after expiry)
    function markExpired(bytes32 refundId) external {
        Refund storage r = refunds[refundId];
        require(r.status == RefundStatus.AwaitingClaim, "ClaimableRefund: not awaiting claim");
        require(block.timestamp > r.expiresAt, "ClaimableRefund: not expired yet");

        r.status = RefundStatus.Expired;
        emit RefundExpired(refundId);
    }

    /// @notice Merchant reclaims funds from an expired refund
    function reclaimExpired(bytes32 refundId) external nonReentrant {
        Refund storage r = refunds[refundId];
        require(r.merchant == msg.sender, "ClaimableRefund: not your refund");
        require(r.status == RefundStatus.Expired, "ClaimableRefund: not expired");

        require(usdc.transfer(r.merchant, r.amount), "ClaimableRefund: reclaim failed");

        r.status = RefundStatus.Returned;
        totalReturned += r.amount;

        emit RefundReturned(refundId, r.merchant, r.amount);
    }

    // ──────────────────────────────────────────────
    // Views
    // ──────────────────────────────────────────────

    function getRefund(bytes32 refundId)
        external
        view
        returns (
            uint256 amount,
            address merchant,
            address claimedBy,
            RefundStatus status,
            uint256 expiresAt,
            uint256 claimedAt
        )
    {
        Refund storage r = refunds[refundId];
        return (r.amount, r.merchant, r.claimedBy, r.status, r.expiresAt, r.claimedAt);
    }

    function isClaimable(bytes32 refundId) external view returns (bool) {
        Refund storage r = refunds[refundId];
        return r.status == RefundStatus.AwaitingClaim && block.timestamp <= r.expiresAt;
    }

    function timeRemaining(bytes32 refundId) external view returns (uint256) {
        Refund storage r = refunds[refundId];
        if (r.status != RefundStatus.AwaitingClaim || block.timestamp > r.expiresAt) return 0;
        return r.expiresAt - block.timestamp;
    }
}
