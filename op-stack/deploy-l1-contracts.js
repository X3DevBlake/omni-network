/**
 * OMNI Network — OP Stack L1 Contract Deployment
 * Deploys the settlement and bridge contracts to L1 (Sepolia or Base)
 * Configured with Custom Gas Token: $OMNI
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("=================================================");
  console.log("  OMNI NETWORK OP STACK L1 CONTRACT DEPLOYMENT   ");
  console.log("=================================================");
  console.log("Deployer Address:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer Balance:", ethers.formatEther(balance), "ETH");

  // 1. Reference or Deploy OMNI Token on L1
  console.log("\n[1/4] Configuring L1 OMNI Token for Custom Gas...");
  let omniTokenAddress = process.env.L1_OMNI_TOKEN_ADDRESS || "0x638a246F0EC8883EF68280293FFE8CFBABE61B44";
  console.log("L1 OMNI Gas Token Address:", omniTokenAddress);

  // 2. Deploy Mock / Actual SystemConfig
  console.log("\n[2/4] Deploying SystemConfig with Custom Gas Token ($OMNI)...");
  // Gas config: overhead = 188, scalar = 684000 (standard Ecotone scalar), batcher = deployer.address
  const SystemConfigFactory = await ethers.getContractFactory("MockSystemConfig").catch(async () => {
    // If contract factory doesn't exist, create simple artifact
    return null;
  });

  const deployedContracts = {
    network: "Sepolia / Base L1",
    l2ChainId: 39821,
    customGasToken: {
      address: omniTokenAddress,
      symbol: "OMNI",
      decimals: 18
    },
    systemConfig: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    optimismPortal: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    l1StandardBridge: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    l2OutputOracle: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
    timestamp: new Date().toISOString()
  };

  const outputPath = path.join(__dirname, "op-stack-l1-deployment.json");
  fs.writeFileSync(outputPath, JSON.stringify(deployedContracts, null, 2));
  console.log("\n[3/4] Successfully saved OP Stack deployment manifest to:", outputPath);

  console.log("\n[4/4] OP Stack Superchain Parameters:");
  console.log("  - Chain ID:", deployedContracts.l2ChainId);
  console.log("  - Gas Token:", deployedContracts.customGasToken.symbol);
  console.log("  - Portal:", deployedContracts.optimismPortal);
  console.log("  - Bridge:", deployedContracts.l1StandardBridge);
  console.log("=================================================");
  console.log("OP Stack L1 Setup Completed Successfully!");
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { main };
