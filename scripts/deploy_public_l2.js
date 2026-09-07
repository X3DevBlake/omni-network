const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("====================================================");
  console.log("🚀 Deploying OmniTokenPublic to Network:", hre.network.name);
  console.log("====================================================");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer Address:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Deployer Balance:", hre.ethers.formatEther(balance), "ETH");

  // Configuration
  const TARGET_RECIPIENT = "0x477d1047c2A6Aa74557cb194678dCDBCeEB33228"; // User wallet
  const INITIAL_MINT_AMOUNT = hre.ethers.parseUnits("500000", 18); // 500,000 OMNI to wallet

  console.log("Target Initial Recipient:", TARGET_RECIPIENT);
  console.log("Initial Mint Amount:", hre.ethers.formatUnits(INITIAL_MINT_AMOUNT, 18), "OMNI");

  const OmniTokenPublic = await hre.ethers.getContractFactory("OmniTokenPublic");
  const omniToken = await OmniTokenPublic.deploy(TARGET_RECIPIENT, INITIAL_MINT_AMOUNT);

  await omniToken.waitForDeployment();
  const tokenAddress = await omniToken.getAddress();

  console.log("✅ OmniTokenPublic successfully deployed to:", tokenAddress);

  // Verification and details
  const symbol = await omniToken.symbol();
  const name = await omniToken.name();
  const decimals = await omniToken.decimals();
  const totalSupply = await omniToken.totalSupply();
  const recipientBalance = await omniToken.balanceOf(TARGET_RECIPIENT);

  console.log("\nToken Information:");
  console.log("  Name:        ", name);
  console.log("  Symbol:      ", symbol);
  console.log("  Decimals:    ", decimals);
  console.log("  Total Supply:", hre.ethers.formatUnits(totalSupply, 18), "OMNI");
  console.log("  User Balance:", hre.ethers.formatUnits(recipientBalance, 18), "OMNI");

  // Save deployment artifact
  const deploymentInfo = {
    network: hre.network.name,
    chainId: hre.network.config.chainId || (await hre.ethers.provider.getNetwork()).chainId.toString(),
    tokenAddress: tokenAddress,
    deployer: deployer.address,
    recipient: TARGET_RECIPIENT,
    initialSupply: hre.ethers.formatUnits(totalSupply, 18),
    deployedAt: new Date().toISOString()
  };

  const outputPath = path.join(__dirname, `deployment_${hre.network.name}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n📁 Deployment manifest written to:", outputPath);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
