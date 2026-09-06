#!/usr/bin/env node
/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║                 OMNI NETWORK — CLI v1.0.0                 ║
 * ║       Interact with the OMNI Blockchain (Chain 39821)     ║
 * ╚═══════════════════════════════════════════════════════════╝
 */

const { ethers } = require("ethers");

// Configuration
const RPC_URL = process.env.OMNI_RPC_URL || "https://omni-network-39821.web.app/rpc";
const MINER_CONTRACT = process.env.OMNI_MINER_CONTRACT || "0x70bDA08DBe07363968e9EE53d899dFE48560605B";
const PRIVATE_KEY = process.env.OMNI_PRIVATE_KEY || "";

const OMNI_MINER_ABI = [
  "function difficulty() external view returns (uint256)",
  "function totalBlocksMined() external view returns (uint256)"
];

// Formatting Colors
const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

function printUsage() {
  console.log(`
${CYAN}${BOLD}OMNI NETWORK CLI TOOL v1.0.0${RESET}
Interact with the OMNI Blockchain (Chain ID: 39821)

${BOLD}Usage:${RESET}
  omni-cli <command> [arguments]

${BOLD}Commands:${RESET}
  ${YELLOW}info${RESET}                  Display blockchain parameters, current block height, and mining difficulty
  ${YELLOW}balance <address>${RESET}     Query native OMNI balance of an account address
  ${YELLOW}block <number>${RESET}       Retrieve details of a specific block on-chain
  ${YELLOW}send <to> <amount>${RESET}   Transfer native OMNI tokens (requires OMNI_PRIVATE_KEY env var)
  ${YELLOW}help${RESET}                  Print this help documentation

${BOLD}Environment Variables:${RESET}
  OMNI_RPC_URL          Custom JSON-RPC endpoint (default: hosted gateway)
  OMNI_PRIVATE_KEY      Sender account private key (hex string) for signing transactions
`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] ? args[0].toLowerCase() : "help";

  if (command === "help" || command === "-h" || command === "--help") {
    printUsage();
    process.exit(0);
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);

  try {
    switch (command) {
      case "info": {
        console.log(`${CYAN}▸ Fetching OMNI Network statistics...${RESET}`);
        const [blockNumber, feeData] = await Promise.all([
          provider.getBlockNumber(),
          provider.getFeeData()
        ]);
        
        let difficulty = "N/A";
        let totalBlocks = "N/A";
        try {
          const contract = new ethers.Contract(MINER_CONTRACT, OMNI_MINER_ABI, provider);
          const [diff, total] = await Promise.all([
            contract.difficulty(),
            contract.totalBlocksMined()
          ]);
          difficulty = diff.toString();
          totalBlocks = total.toString();
        } catch(e) {
          // Miner contract may not be deployed on target custom network
        }

        console.log(`
${GREEN}${BOLD}✔ Connected to OMNI Network successfully!${RESET}
  RPC Endpoint:        ${RPC_URL}
  Current Block:       ${blockNumber}
  Block Gas Limit:     30,000,000
  PoW Difficulty:      ${difficulty}
  PoW Blocks Mined:    ${totalBlocks}
  Gas Fee Base:        ${ethers.formatUnits(feeData.gasPrice || 0n, "gwei")} Gwei (Gasless EVM)
`);
        break;
      }

      case "balance": {
        const address = args[1];
        if (!address) {
          console.log(`${RED}✘ Error: Account address argument is required.${RESET}`);
          console.log(`Usage: omni-cli balance <address>`);
          process.exit(1);
        }

        console.log(`${CYAN}▸ Querying balance for ${address}...${RESET}`);
        const balance = await provider.getBalance(address);
        console.log(`${GREEN}✔ Account Balance:${RESET} ${ethers.formatEther(balance)} OMNI`);
        break;
      }

      case "block": {
        const blockArg = args[1];
        if (!blockArg) {
          console.log(`${RED}✘ Error: Block number argument is required (or "latest").${RESET}`);
          process.exit(1);
        }

        const blockNum = blockArg === "latest" ? "latest" : parseInt(blockArg);
        console.log(`${CYAN}▸ Fetching Block ${blockArg}...${RESET}`);
        const block = await provider.getBlock(blockNum);
        
        if (!block) {
          console.log(`${RED}✘ Error: Block not found.${RESET}`);
          process.exit(1);
        }

        console.log(`
${GREEN}${BOLD}✔ Block Details:${RESET}
  Number:       ${block.number}
  Hash:         ${block.hash}
  Timestamp:    ${new Date(block.timestamp * 1000).toLocaleString()}
  Transactions: ${block.transactions.length}
  Gas Used:     ${block.gasUsed.toString()} / ${block.gasLimit.toString()}
  Parent Hash:  ${block.parentHash}
`);
        break;
      }

      case "send": {
        const to = args[1];
        const amount = args[2];

        if (!to || !amount) {
          console.log(`${RED}✘ Error: Destination address and amount in OMNI are required.${RESET}`);
          console.log(`Usage: omni-cli send <to_address> <amount_in_omni>`);
          process.exit(1);
        }

        if (!PRIVATE_KEY) {
          console.log(`${RED}✘ Error: Environment variable OMNI_PRIVATE_KEY is not defined.${RESET}`);
          console.log(`Please export OMNI_PRIVATE_KEY="your_private_key" before sending transactions.`);
          process.exit(1);
        }

        console.log(`${CYAN}▸ Initializing transaction signer wallet...${RESET}`);
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        console.log(`Sender Address: ${wallet.address}`);

        const txValue = ethers.parseEther(amount);
        const txData = {
          to: to,
          value: txValue
        };

        console.log(`${CYAN}▸ Broadcasting transfer transaction to network...${RESET}`);
        const tx = await wallet.sendTransaction(txData);
        console.log(`${YELLOW}▸ Transaction submitted. Hash: ${tx.hash}${RESET}`);
        
        console.log(`${CYAN}▸ Waiting for block confirmation...${RESET}`);
        const receipt = await tx.wait();
        console.log(`${GREEN}✔ Transaction successful in Block ${receipt.blockNumber}! Gas Used: ${receipt.gasUsed.toString()}${RESET}`);
        break;
      }

      default: {
        console.log(`${RED}✘ Unknown command: ${command}${RESET}`);
        printUsage();
        process.exit(1);
      }
    }
  } catch (err) {
    console.error(`${RED}✘ Execution failed:${RESET}`, err.message);
    process.exit(1);
  }
}

main();
