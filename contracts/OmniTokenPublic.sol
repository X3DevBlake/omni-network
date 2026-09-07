// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title OmniTokenPublic
 * @notice Production-grade ERC-20 token contract designed for public L2 deployment (Base / Arbitrum One)
 *         and integration into Uniswap V3, Aerodrome, CoinGecko, and MetaMask Swaps.
 * @dev Implements:
 *      - EIP-2612 Permit: Gasless approvals for 1-click swaps in Uniswap & MetaMask Swaps.
 *      - Fixed Maximum Hard Cap: 1,000,000,000 OMNI (1 Billion tokens).
 *      - ERC20Burnable: Deflationary token burning capabilities.
 *      - Bridge Operator Role: Controlled cross-chain minting/burning via OmniBridge.
 */
contract OmniTokenPublic is ERC20, ERC20Burnable, ERC20Capped, ERC20Permit, Ownable {
    
    // Mapping of authorized cross-chain bridges / liquidity managers
    mapping(address => bool) public isBridge;

    event BridgeSet(address indexed bridgeAddress, bool status);
    event TokensBridgedIn(address indexed recipient, uint256 amount, uint32 sourceChainId);
    event TokensBridgedOut(address indexed sender, uint256 amount, uint32 destChainId);

    /**
     * @param initialOwner Address receiving contract ownership and initial liquidity allocation
     * @param initialSupply Tokens minted at launch for liquidity pool seeding (e.g. 10,000,000 OMNI)
     */
    constructor(address initialOwner, uint256 initialSupply)
        ERC20("OMNI Network Token", "OMNI")
        ERC20Capped(1_000_000_000 * 10 ** 18) // 1 Billion OMNI Cap
        ERC20Permit("OMNI Network Token")
        Ownable(initialOwner)
    {
        require(initialSupply <= 1_000_000_000 * 10 ** 18, "Initial supply exceeds cap");
        if (initialSupply > 0) {
            _mint(initialOwner, initialSupply);
        }
    }

    /**
     * @notice Set bridge contract authorization status
     */
    function setBridge(address bridgeAddress, bool status) external onlyOwner {
        require(bridgeAddress != address(0), "Invalid bridge address");
        isBridge[bridgeAddress] = status;
        emit BridgeSet(bridgeAddress, status);
    }

    /**
     * @notice Mint tokens arriving from cross-chain bridge transfer
     * @dev Only authorized bridge or contract owner can call this
     */
    function mintFromBridge(address to, uint256 amount, uint32 sourceChainId) external {
        require(isBridge[msg.sender] || msg.sender == owner(), "Caller not authorized bridge");
        _mint(to, amount);
        emit TokensBridgedIn(to, amount, sourceChainId);
    }

    /**
     * @notice Burn tokens to transfer to another chain
     */
    function bridgeOut(uint256 amount, uint32 destChainId) external {
        _burn(msg.sender, amount);
        emit TokensBridgedOut(msg.sender, amount, destChainId);
    }

    /**
     * @dev Required override for ERC20Capped and ERC20
     */
    function _update(address from, address to, uint256 value)
        internal
        virtual
        override(ERC20, ERC20Capped)
    {
        super._update(from, to, value);
    }
}
