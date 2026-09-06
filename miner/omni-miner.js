#!/usr/bin/env node
/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║              OMNI NETWORK — CLI MINER v1.0.0             ║
 * ║  Proof-of-Work miner for the Omni Network (Chain 39821)  ║
 * ║  0.35% daily mining fee → OMNI Treasury                  ║
 * ╚═══════════════════════════════════════════════════════════╝
 */

const { ethers } = require("ethers");
const crypto = require("crypto");
const os = require("os");

// ─── Configuration ────────────────────────────────────────────────────────────
const RPC_URL = process.env.OMNI_RPC_URL || "https://omni-network-39821.web.app/rpc";
const PRIVATE_KEY = process.env.OMNI_MINER_KEY || "";
const MINER_CONTRACT = process.env.OMNI_MINER_CONTRACT || "0x70bDA08DBe07363968e9EE53d899dFE48560605B";

const OMNI_MINER_ABI = [
  "function submitSolution(uint256 nonce, bytes32 challenge) external",
  "function getCurrentChallenge() external view returns (bytes32)",
  "function getMiningStats() external view returns (uint256, uint256, uint256, uint256)",
  "function difficulty() external view returns (uint256)",
  "function totalBlocksMined() external view returns (uint256)",
  "function minerRewards(address) external view returns (uint256)",
  "function minerBlockCount(address) external view returns (uint256)",
  "function treasury() external view returns (address)",
  "function miningFeeRateBps() external view returns (uint256)"
];

// ─── Display ──────────────────────────────────────────────────────────────────
const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const MAGENTA = "\x1b[35m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";

function banner() {
  console.log(`
${CYAN}${BOLD}╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ◉  OMNI NETWORK MINER v1.0.0                           ║
║      Chain ID: 39821  |  Gasless EVM                      ║
║      Mining Fee: 0.35% → Treasury                         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝${RESET}
`);
}

function log(color, prefix, msg) {
  const ts = new Date().toLocaleTimeString();
  console.log(`${DIM}[${ts}]${RESET} ${color}${BOLD}${prefix}${RESET} ${msg}`);
}

// ─── Mining Engine ────────────────────────────────────────────────────────────
class OmniMiner {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.contract = null;
    this.hashRate = 0;
    this.totalHashes = 0;
    this.blocksFound = 0;
    this.totalRewards = BigInt(0);
    this.running = false;
    this.startTime = null;
  }

  async connect() {
    log(CYAN, "▸ CONNECT", `RPC: ${RPC_URL}`);
    this.provider = new ethers.JsonRpcProvider(RPC_URL);

    const network = await this.provider.getNetwork();
    log(GREEN, "  ✔ CHAIN", `Connected — Chain ID: ${network.chainId}`);

    if (!PRIVATE_KEY) {
      log(RED, "  ✘ ERROR", "Set OMNI_MINER_KEY environment variable with your private key");
      process.exit(1);
    }

    this.wallet = new ethers.Wallet(PRIVATE_KEY, this.provider);
    log(GREEN, "  ✔ WALLET", `${this.wallet.address}`);

    const balance = await this.provider.getBalance(this.wallet.address);
    log(GREEN, "  ✔ BALANCE", `${ethers.formatEther(balance)} OMNI`);

    if (!MINER_CONTRACT) {
      log(RED, "  ✘ ERROR", "Set OMNI_MINER_CONTRACT environment variable with the OmniMiner contract address");
      process.exit(1);
    }

    this.contract = new ethers.Contract(MINER_CONTRACT, OMNI_MINER_ABI, this.wallet);

    // Verify contract
    const treasury = await this.contract.treasury();
    const feeRate = await this.contract.miningFeeRateBps();
    log(GREEN, "  ✔ MINER", `Contract: ${MINER_CONTRACT}`);
    log(GREEN, "  ✔ TREASURY", `${treasury}`);
    log(GREEN, "  ✔ FEE RATE", `${Number(feeRate) / 100}%`);
  }

  async mine() {
    this.running = true;
    this.startTime = Date.now();
    let hashCount = 0;
    let lastReport = Date.now();

    log(MAGENTA, "⛏ MINING", `Starting Proof-of-Work on ${os.cpus().length} core(s)...`);
    log(DIM, "  INFO", "Press Ctrl+C to stop mining\n");

    while (this.running) {
      try {
        // Get current challenge and difficulty
        const challenge = await this.contract.getCurrentChallenge();
        const difficulty = await this.contract.difficulty();

        // Mine: find nonce where hash < difficulty
        let nonce = BigInt("0x" + crypto.randomBytes(8).toString("hex"));
        let found = false;

        for (let i = 0; i < 10000; i++) {
          nonce += 1n;
          hashCount++;
          this.totalHashes++;

          const packed = ethers.solidityPacked(
            ["bytes32", "address", "uint256"],
            [challenge, this.wallet.address, nonce]
          );
          const hash = ethers.keccak256(packed);
          const hashValue = BigInt(hash);

          if (hashValue < difficulty) {
            found = true;
            log(GREEN, "⛏ FOUND!", `Nonce: ${nonce} | Hash: ${hash.slice(0, 18)}...`);

            try {
              const tx = await this.contract.submitSolution(nonce, challenge);
              const receipt = await tx.wait();
              this.blocksFound++;

              // Check rewards
              const rewards = await this.contract.minerRewards(this.wallet.address);
              this.totalRewards = rewards;

              log(GREEN, "  ✔ MINED", `Block submitted! TX: ${receipt.hash.slice(0, 18)}...`);
              log(YELLOW, "  ✔ REWARD", `Total earned: ${ethers.formatEther(rewards)} OMNI`);
              log(DIM, "  ✔ BLOCKS", `${this.blocksFound} blocks mined this session`);
              console.log("");
            } catch (txErr) {
              if (txErr.message.includes("already submitted")) {
                log(YELLOW, "  ⚠ STALE", "Solution already submitted, getting new challenge...");
              } else {
                log(RED, "  ✘ TX ERR", txErr.message.slice(0, 80));
              }
            }
            break;
          }
        }

        // Report hashrate every 5 seconds
        const now = Date.now();
        if (now - lastReport > 5000) {
          this.hashRate = Math.round(hashCount / ((now - lastReport) / 1000));
          hashCount = 0;
          lastReport = now;
          const elapsed = Math.round((now - this.startTime) / 1000);
          log(CYAN, "⚡ RATE", `${this.hashRate.toLocaleString()} H/s | Total: ${this.totalHashes.toLocaleString()} | Uptime: ${elapsed}s`);
        }

      } catch (err) {
        log(RED, "  ✘ ERROR", err.message.slice(0, 100));
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }

  stop() {
    this.running = false;
    console.log("");
    log(RED, "⛏ STOPPED", "Mining halted by user");
    log(CYAN, "  STATS", `Blocks: ${this.blocksFound} | Hashes: ${this.totalHashes.toLocaleString()} | Earned: ${ethers.formatEther(this.totalRewards)} OMNI`);
    process.exit(0);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  banner();

  const miner = new OmniMiner();

  process.on("SIGINT", () => miner.stop());
  process.on("SIGTERM", () => miner.stop());

  await miner.connect();
  console.log("");
  await miner.mine();
}

main().catch(err => {
  console.error(`${RED}Fatal error: ${err.message}${RESET}`);
  process.exit(1);
});
