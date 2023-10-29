// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "./Token.sol";
import "node_modules/@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "node_modules/@openzeppelin/contracts/access/AccessControl.sol";
import "node_modules/@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract Bridge is ReentrancyGuard, AccessControl {
  using ECDSA for bytes32;

  /**
   * @notice Constant for validator role
   */
  bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");

  /**
   * @notice Event for swap initialization
   */
  event SwapInitilaized(
        address indexed receiver,
        address indexed token,
        uint256 indexed chainTo,
        uint256 amount,
        uint256 nonce,
        uint256 chainFrom
    );

  /**
   * @notice Event for redeem initialization
   */
  event RedeemInitilaized(
        address indexed receiver,
        address indexed token,
        uint256 amount,
        uint256 indexed nonce
    );

  /**
   * @notice Event for chain status update
   */
  event ChainByIdUpdated(uint256 indexed chainId, bool status);

  /**
   * @notice Event for token inclusion
   */
  event TokenIncluded(
        address indexed thisChainToken,
        address indexed token,
        uint256 indexed chainId
    );

  /**
   * @notice Event for token exclusion
   */
  event TokenExcluded(
        address indexed thisChainToken,
        uint256 indexed chainId
    );

  /**
   * @notice Mapping to track used nonces per address
   */
  mapping(address => mapping(uint256 => bool)) private usersNonces;

  /**
   * @notice Mapping to track supported tokens per chain
   */
  mapping(address => mapping(uint256 => address)) private supportedTokens;

  /**
   * @notice Mapping to track chain support status
   */
  mapping(uint256 => bool) private supportedChains;

  /**
   * @notice ID of the current chain
   */
  uint256 private thisChainId;

  /**
   * @notice Constructor and role management
   */
  constructor(address validator, uint256 chainId) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(VALIDATOR_ROLE, validator);
        thisChainId = chainId;
        supportedChains[chainId] = true;
    }

  /**
   * @notice Swap tokens to another chain
   */
  function swap(
        address receiver,
        address thisChainToken,
        uint256 amount,
        uint256 chainTo,
        uint256 nonce
    ) external nonReentrant checkNonce(nonce) {
        require(
            supportedChains[thisChainId] == true &&
                supportedChains[chainTo] == true,
            "Bridge: One of the blockchains isn't supported"
        );
        require(
            supportedTokens[thisChainToken][chainTo] != address(0),
            "Bridge: This token is not supported"
        );

        Token(thisChainToken).burn(msg.sender, amount);
        usersNonces[msg.sender][nonce] = true;

        emit SwapInitilaized(
            receiver,
            supportedTokens[thisChainToken][chainTo],
            chainTo,
            amount,
            nonce,
            thisChainId
        );
    }

  /**
   * @notice Collect tokens from another chain
   */
  function redeem(
        address receiver,
        address token,
        uint256 amount,
        uint256 nonce,
        uint256 chainTo,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external nonReentrant checkNonce(nonce) {
        require(
            receiver == msg.sender,
            "Only the receiver can collect the tokens"
        );
        require(
            chainTo == thisChainId,
            "This transaction is for another chain"
        );

        bytes32 signedDataHash = keccak256(
            abi.encode(receiver, token, chainTo, amount, nonce)
        );

        address signer = signedDataHash.toEthSignedMessageHash().recover(
            v,
            r,
            s
        );
        require(hasRole(VALIDATOR_ROLE, signer), "Bridge: invalid sig");

        Token(token).mint(receiver, amount);
        usersNonces[receiver][nonce] = true;

        emit RedeemInitilaized(receiver, token, amount, nonce);
    }

  /**
   * @notice Update chain support status
   */
  function updateChainById(uint256 chainId, bool status) external adminControl {
    supportedChains[chainId] = status;
    emit ChainByIdUpdated(chainId, status);
  }

  /**
   * @notice Add supported token
   */
  function includeToken(
        address thisChainToken,
        address token,
        uint256 chainId
    ) external adminControl {
        supportedTokens[thisChainToken][chainId] = token;
        emit TokenIncluded(thisChainToken, token, chainId);
  }

  /**
   * @notice Remove supported token
   */
  function excludeToken(address thisChainToken, uint256 chainId) external adminControl {
    delete supportedTokens[thisChainToken][chainId];
    emit TokenExcluded(thisChainToken, chainId);
  }

  /**
   * @notice Check if token is supported
   */
  function isTokenSupported(address thisChainToken, uint256 chainId) external view returns (bool) {
    return supportedTokens[thisChainToken][chainId] != address(0);
  }

  /**
   * @notice Check if chain is supported
   */
  function isChainSupported(uint256 chainId) external view returns (bool) {
    return supportedChains[chainId];
  }

  /**
   * @notice Get nonce usage status
   */
  function nonceStatus(address user, uint256 nonce) external view returns (bool) {
    return usersNonces[user][nonce];
  }

  /**
   * @notice Modifier to check admin
   */
  modifier adminControl() {
    require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Bridge: Only admin can use this function");
      _;
  }

  /**
   * @notice Modifier to check nonce
   */
  modifier checkNonce(uint256 nonce) {
    require(usersNonces[msg.sender][nonce] == false, "Bridge: This nonce was already used");
      _;
  }

} 