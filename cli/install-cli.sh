#!/bash
#!/bin/bash
set -e

echo -e "\033[1;36m=========================================\033[0m"
echo -e "\033[1;36m      OMNI NETWORK CLI INSTALLER v1.0.0  \033[0m"
echo -e "\033[1;36m=========================================\033[0m"

# Verify Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "\033[1;31m✘ Node.js is not installed. Please install Node.js (v18+) to run the CLI tool.\033[0m"
    exit 1
fi

# Create directory
mkdir -p omni-cli
cd omni-cli

echo -e "\033[1;33m▸ Downloading CLI script...\033[0m"
curl -sSfL https://omni-network-39821.web.app/cli/omni-cli.js -o omni-cli.js
chmod +x omni-cli.js

echo -e "\033[1;33m▸ Initializing npm package...\033[0m"
npm init -y > /dev/null

echo -e "\033[1;33m▸ Installing ethers.js dependency...\033[0m"
npm install ethers@6.11.1 --no-audit --no-fund > /dev/null

echo -e "\033[1;32m✔ Installation complete!\033[0m"
echo -e "\033[1;36m=========================================\033[0m"
echo -e "To interact with OMNI Network, run:"
echo -e "  \033[1;33mnode omni-cli.js help\033[0m"
echo -e "  \033[1;33mnode omni-cli.js info\033[0m"
echo -e "\033[1;36m=========================================\033[0m"
