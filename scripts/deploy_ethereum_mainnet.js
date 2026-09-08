/**
 * OMNI Token — Ethereum Mainnet (Chain ID 1) Deployment Script
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("==========================================================");
  console.log("   OMNI TOKEN — PRODUCTION MAINNET DEPLOYMENT ENGINE      ");
  console.log("==========================================================");
  console.log("Target Network:", network.name, `(Chain ID: ${network.chainId})`);
  console.log("Deployer Address:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer Balance:", ethers.formatEther(balance), "ETH");

  // Export artifact payload for Web3 1-click browser deployment
  const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", "OmniTokenMainnet.sol", "OmniTokenMainnet.json");
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
    const payload = {
      contractName: artifact.contractName,
      abi: artifact.abi,
      bytecode: artifact.bytecode,
      targetSupply: "1000000000",
      decimals: 18,
      symbol: "OMNI",
      name: "OMNI Token"
    };
    const payloadPath = path.join(__dirname, "..", "mainnet_contract_payload.json");
    fs.writeFileSync(payloadPath, JSON.stringify(payload, null, 2));
    console.log("Exported mainnet contract payload to mainnet_contract_payload.json!");
  }

  if (balance < ethers.parseEther("0.003")) {
    console.log("\n⚠️ Deployer balance is below the recommended minimum for Ethereum Mainnet gas.");
    console.log("To deploy via CLI, transfer at least ~0.005 ETH to:", deployer.address);
    console.log("Alternatively, use Option A (1-Click MetaMask Deployment) on the web portal!");
    return;
  }

  console.log("\n[1/3] Deploying OmniTokenMainnet to", network.name, "...");
  const OmniTokenFactory = await ethers.getContractFactory("OmniTokenMainnet");
  const omniToken = await OmniTokenFactory.deploy(deployer.address);
  await omniToken.waitForDeployment();
  const tokenAddress = await omniToken.getAddress();

  console.log("✅ OmniTokenMainnet deployed at:", tokenAddress);
  console.log("Etherscan Link: https://etherscan.io/token/" + tokenAddress);

  const deploymentData = {
    network: network.name,
    chainId: Number(network.chainId),
    address: tokenAddress,
    deployer: deployer.address,
    initialOwner: deployer.address,
    totalSupply: "1000000000",
    symbol: "OMNI",
    name: "OMNI Token",
    decimals: 18,
    deployedAt: new Date().toISOString()
  };

  const outPath = path.join(__dirname, "..", "deployment_ethereum_mainnet.json");
  fs.writeFileSync(outPath, JSON.stringify(deploymentData, null, 2));
  console.log("Deployment saved to deployment_ethereum_mainnet.json!");
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
