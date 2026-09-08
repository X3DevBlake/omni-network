// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";

/**
 * @title OmniTokenMainnet
 * @notice Canonical Production ERC-20 Token for OMNI on Ethereum Mainnet (Chain ID 1)
 * @dev Fully compliant with ERC-20, EIP-2612 (Permit for gasless approvals),
 *      deflationary burning, and safe 2-step ownership transfer.
 *      Total Supply: 1,000,000,000 OMNI (1 Billion fixed supply).
 */
contract OmniTokenMainnet is ERC20, ERC20Burnable, ERC20Permit, Ownable2Step {
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10 ** 18;

    event TokensClaimed(address indexed recipient, uint256 amount);

    constructor(address initialOwner) 
        ERC20("OMNI Token", "OMNI") 
        ERC20Permit("OMNI Token")
        Ownable(initialOwner) 
    {
        require(initialOwner != address(0), "Invalid initial owner");
        _mint(initialOwner, TOTAL_SUPPLY);
    }

    /**
     * @notice Allows contract to rescue inadvertently sent ERC-20 tokens
     */
    function rescueTokens(address tokenAddress, address to, uint256 amount) external onlyOwner {
        require(tokenAddress != address(this), "Cannot rescue native OMNI");
        require(to != address(0), "Invalid recipient");
        IERC20(tokenAddress).transfer(to, amount);
    }
}
