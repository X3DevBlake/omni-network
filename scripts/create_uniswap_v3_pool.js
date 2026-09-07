const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Factory & Position Manager Addresses for Uniswap V3
const UNISWAP_CONFIG = {
  base: {
    factory: "0x33128a8fC17869897dcE68Ed026d694621f6FDfD",
    positionManager: "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1",
    usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Native USDC on Base
    weth: "0x4200000000000000000000000000000000000006"
  },
  arbitrum: {
    factory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    positionManager: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
    usdc: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // Native USDC on Arbitrum
    weth: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"
  }
};

/**
 * Calculate sqrtPriceX96 from target price
 * Target price = amount of token1 per 1 token0
 */
function encodePriceSqrt(reserve1, reserve0) {
  const numerator = BigInt(reserve1);
  const denominator = BigInt(reserve0);
  const ratioX192 = (numerator * (1n << 192n)) / denominator;
  
  // Integer square root
  let x = ratioX192;
  let y = (x + 1n) / 2n;
  while (y < x) {
    x = y;
    y = (x + ratioX192 / x) / 2n;
  }
  return x;
}

async function main() {
  console.log("====================================================");
  console.log("🦄 Uniswap V3 Pool Deployment & Liquidity Seeder");
  console.log("====================================================");

  const networkName = hre.network.name;
  console.log("Target Network:", networkName);

  const config = UNISWAP_CONFIG[networkName] || UNISWAP_CONFIG["base"];
  console.log("Uniswap Position Manager:", config.positionManager);
  console.log("USDC Paired Token:        ", config.usdc);

  // Read deployment json if available
  const deploymentFile = path.join(__dirname, `deployment_${networkName}.json`);
  let omniAddress = "0x638A246F0Ec8883eF68280293FFE8Cfbabe61B44"; // default
  if (fs.existsSync(deploymentFile)) {
    const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf-8"));
    omniAddress = deployment.tokenAddress;
    console.log("Loaded deployed OMNI Token:", omniAddress);
  } else {
    console.log("Using default/provided OMNI address:", omniAddress);
  }

  // Sort tokens: token0 must be less than token1
  const isOmni0 = omniAddress.toLowerCase() < config.usdc.toLowerCase();
  const token0 = isOmni0 ? omniAddress : config.usdc;
  const token1 = isOmni0 ? config.usdc : omniAddress;

  console.log("\nPool Pair Ordering:");
  console.log("  Token0:", token0, isOmni0 ? "(OMNI)" : "(USDC)");
  console.log("  Token1:", token1, isOmni0 ? "(USDC)" : "(OMNI)");

  // Target valuation: 1 OMNI = 0.10 USDC (or configurable)
  // OMNI decimals = 18, USDC decimals = 6
  const targetUsdcPerOmni = 0.10; // $0.10 initial valuation
  console.log(`\nTarget Initial Valuation: 1 OMNI = $${targetUsdcPerOmni} USD`);

  let reserve0, reserve1;
  if (isOmni0) {
    // token0 = OMNI (18 decimals), token1 = USDC (6 decimals)
    // 1 OMNI (10^18) => targetUsdcPerOmni * 10^6 USDC
    reserve0 = 10n ** 18n;
    reserve1 = BigInt(Math.round(targetUsdcPerOmni * 1000000));
  } else {
    // token0 = USDC (6 decimals), token1 = OMNI (18 decimals)
    // 1 USDC (10^6) => (1 / targetUsdcPerOmni) * 10^18 OMNI
    reserve0 = 10n ** 6n;
    reserve1 = BigInt(Math.round((1 / targetUsdcPerOmni) * 1e18));
  }

  const sqrtPriceX96 = encodePriceSqrt(reserve1, reserve0);
  console.log("Calculated sqrtPriceX96:", sqrtPriceX96.toString());

  console.log("\nNext Steps on Public Network:");
  console.log("1. Call `createAndInitializePoolIfNecessary(token0, token1, 3000, sqrtPriceX96)`");
  console.log("   on NonfungiblePositionManager:", config.positionManager);
  console.log("2. Deposit initial seed collateral (e.g. $1,000 USDC + 10,000 OMNI)");
  console.log("3. Pool goes live immediately on Uniswap and DexScreener!");

  // Output pool parameters file
  const poolParams = {
    network: networkName,
    omniToken: omniAddress,
    collateralToken: config.usdc,
    token0: token0,
    token1: token1,
    feeTier: 3000, // 0.3%
    targetPriceUsd: targetUsdcPerOmni,
    sqrtPriceX96: sqrtPriceX96.toString(),
    positionManager: config.positionManager,
    factory: config.factory
  };

  const poolParamPath = path.join(__dirname, `uniswap_v3_pool_params_${networkName}.json`);
  fs.writeFileSync(poolParamPath, JSON.stringify(poolParams, null, 2));
  console.log("\n📁 Pool parameters saved to:", poolParamPath);
}

main().catch(console.error);
