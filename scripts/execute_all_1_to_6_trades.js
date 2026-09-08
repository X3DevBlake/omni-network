const { ethers } = require("ethers");
const fs = require("fs");

async function main() {
  console.log("===============================================================");
  console.log("🚀 OMNI NETWORK: COMPLETE 1-6 EXECUTION & MAINNET TRADE ENGINE");
  console.log("===============================================================\n");

  const rpcUrl = "https://omni-rpc-gateway-853859261845.us-central1.run.app";
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  const net = await provider.getNetwork();
  console.log(`[1. Network Connectivity]`);
  console.log(`- RPC Gateway: ${rpcUrl}`);
  console.log(`- Chain ID: ${net.chainId} (OMNI Network Canonical)`);
  console.log(`- Current Block: ${await provider.getBlockNumber()}\n`);

  // Key Wallets
  const genesisKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const deployerWalletInfo = JSON.parse(fs.readFileSync("deployer_wallet.json", "utf8"));
  const traderKey = deployerWalletInfo.privateKey;

  const genesisSigner = new ethers.Wallet(genesisKey, provider);
  const traderSigner = new ethers.Wallet(traderKey, provider);

  console.log(`Genesis Operator: ${genesisSigner.address} (Balance: ${ethers.formatEther(await provider.getBalance(genesisSigner.address))} OMNI)`);
  console.log(`Trader Wallet:    ${traderSigner.address} (Balance: ${ethers.formatEther(await provider.getBalance(traderSigner.address))} OMNI)\n`);

  // Contracts
  const addresses = JSON.parse(fs.readFileSync("deployed-addresses.json", "utf8"));
  const omniTokenAddr = addresses.omniToken;
  const routerAddr = addresses.swapRouter;
  const oracleAddr = addresses.omniPriceFeed;
  const usdcAddr = addresses.tokens.USDC.address;
  const wethAddr = addresses.tokens.WETH.address;
  const womniAddr = addresses.tokens.WOMNI.address;

  const erc20Abi = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)"
  ];

  const oracleAbi = [
    "function latestRoundData() view returns (uint80, int256, uint256, uint256, uint80)",
    "function decimals() view returns (uint8)",
    "function description() view returns (string)"
  ];

  const routerAbi = [
    "function getAmountOut(address tokenIn, address tokenOut, uint256 amountIn) view returns (uint256 amountOut, uint256 feeAmount)",
    "function swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut) returns (uint256 amountOut)",
    "function pools(address, address) view returns (uint256 reserveA, uint256 reserveB, bool exists)"
  ];

  const womniAbi = [
    "function deposit() payable",
    "function withdraw(uint256 wad)",
    "function balanceOf(address) view returns (uint256)",
    "function symbol() view returns (string)"
  ];

  // ==========================================
  // [2. REAL-LIFE VALUATION: ON-CHAIN ORACLE]
  // ==========================================
  console.log(`[2. Real-Life Valuation On-Chain]`);
  const oracle = new ethers.Contract(oracleAddr, oracleAbi, provider);
  const roundData = await oracle.latestRoundData();
  const oraclePrice = Number(roundData[1]) / 1e8;
  console.log(`- Oracle Contract: ${oracleAddr}`);
  console.log(`- Description:     ${await oracle.description()}`);
  console.log(`- Answer:          $${oraclePrice.toFixed(4)} USD`);
  console.log(`- Updated Timestamp: ${new Date(Number(roundData[3]) * 1000).toISOString()}`);
  console.log(`- Target Market Cap: $1,000,000,000 USD (at 1B Fixed Supply)\n`);

  // ==========================================
  // [3. ACTIVE LIQUIDITY POOLS & REAL SWAP]
  // ==========================================
  console.log(`[3. Real On-Chain Swap: OMNI -> USDC]`);
  const router = new ethers.Contract(routerAddr, routerAbi, genesisSigner);
  const omniToken = new ethers.Contract(omniTokenAddr, erc20Abi, genesisSigner);
  const usdcToken = new ethers.Contract(usdcAddr, erc20Abi, genesisSigner);

  const swapInAmt = ethers.parseEther("50.0"); // 50 OMNI
  const quote = await router.getAmountOut(omniTokenAddr, usdcAddr, swapInAmt);
  console.log(`- Quote for 50 OMNI: ${ethers.formatUnits(quote[0], 6)} USDC (Swap Fee: ${ethers.formatUnits(quote[1], 18)} OMNI)`);

  // Approve router
  console.log(`- Approving OmniSwapRouter...`);
  const appTx1 = await omniToken.approve(routerAddr, ethers.parseEther("1000.0"));
  await appTx1.wait();

  // Execute Swap
  console.log(`- Executing on-chain swap transaction...`);
  const swapTx1 = await router.swap(omniTokenAddr, usdcAddr, swapInAmt, 0);
  const rcpt1 = await swapTx1.wait();
  console.log(`✅ Swap 1 Confirmed! Tx Hash: ${rcpt1.hash}`);
  console.log(`   Block: ${rcpt1.blockNumber}, Gas Used: ${rcpt1.gasUsed.toString()}\n`);

  // ==========================================
  // [4. MULTI-TOKEN TRADING: USDC -> WETH]
  // ==========================================
  console.log(`[4. Multi-Token Trading: USDC -> WETH (ETH)]`);
  const usdcSwapIn = ethers.parseUnits("25.0", 6); // 25 USDC
  const quoteEth = await router.getAmountOut(usdcAddr, wethAddr, usdcSwapIn);
  console.log(`- Quote for 25 USDC: ${ethers.formatUnits(quoteEth[0], 18)} WETH (~$25 worth of ETH)`);

  const appTx2 = await usdcToken.approve(routerAddr, ethers.parseUnits("1000.0", 6));
  await appTx2.wait();

  const swapTx2 = await router.swap(usdcAddr, wethAddr, usdcSwapIn, 0);
  const rcpt2 = await swapTx2.wait();
  console.log(`✅ Swap 2 Confirmed! Tx Hash: ${rcpt2.hash}`);
  console.log(`   Block: ${rcpt2.blockNumber}, Gas Used: ${rcpt2.gasUsed.toString()}\n`);

  // ==========================================
  // [5. DEPOSIT & WITHDRAWAL: CANONICAL WOMNI]
  // ==========================================
  console.log(`[5. Deposit & Withdrawal: Canonical WOMNI Gas Wrapping]`);
  const womni = new ethers.Contract(womniAddr, womniAbi, genesisSigner);

  // Deposit: Wrap 10 OMNI
  console.log(`- Depositing 10 Native OMNI into WOMNI...`);
  const depTx = await womni.deposit({ value: ethers.parseEther("10.0") });
  const depRcpt = await depTx.wait();
  console.log(`✅ Deposit Confirmed! Tx Hash: ${depRcpt.hash}`);
  console.log(`   WOMNI Balance: ${ethers.formatEther(await womni.balanceOf(genesisSigner.address))} WOMNI`);

  // Withdraw: Unwrap 5 WOMNI
  console.log(`- Withdrawing 5 WOMNI back to Native OMNI...`);
  const wdrTx = await womni.withdraw(ethers.parseEther("5.0"));
  const wdrRcpt = await wdrTx.wait();
  console.log(`✅ Withdrawal Confirmed! Tx Hash: ${wdrRcpt.hash}`);
  console.log(`   WOMNI Balance: ${ethers.formatEther(await womni.balanceOf(genesisSigner.address))} WOMNI\n`);

  // ==========================================
  // [6. MEGA FAUCET DISPATCH & TRADER TRADE]
  // ==========================================
  console.log(`[6. Mega Faucet Dispatch & Independent User Trade]`);
  let nonce = await provider.getTransactionCount(genesisSigner.address, "pending");

  // Send 50 Native OMNI
  const fTx1 = await genesisSigner.sendTransaction({
    to: traderSigner.address,
    value: ethers.parseEther("50.0"),
    nonce: nonce++
  });
  await fTx1.wait();

  // Send 100 OMNI (ERC-20)
  const fTx2 = await omniToken.transfer(traderSigner.address, ethers.parseEther("100.0"), { nonce: nonce++ });
  await fTx2.wait();

  // Send 100 USDC
  const fTx3 = await usdcToken.transfer(traderSigner.address, ethers.parseUnits("100.0", 6), { nonce: nonce++ });
  await fTx3.wait();
  console.log(`✅ Faucet Dispatched to Trader: ${traderSigner.address}`);
  console.log(`   Trader Native OMNI: ${ethers.formatEther(await provider.getBalance(traderSigner.address))}`);
  console.log(`   Trader ERC-20 OMNI: ${ethers.formatEther(await omniToken.balanceOf(traderSigner.address))}`);
  console.log(`   Trader USDC:        ${ethers.formatUnits(await usdcToken.balanceOf(traderSigner.address), 6)}\n`);

  // Independent Trader executes on-chain swap
  console.log(`- Trader executing independent AMM trade (20 OMNI -> USDC)...`);
  const traderRouter = new ethers.Contract(routerAddr, routerAbi, traderSigner);
  const traderOmni = new ethers.Contract(omniTokenAddr, erc20Abi, traderSigner);

  const traderAppTx = await traderOmni.approve(routerAddr, ethers.parseEther("100.0"));
  await traderAppTx.wait();

  const traderSwapTx = await traderRouter.swap(omniTokenAddr, usdcAddr, ethers.parseEther("20.0"), 0);
  const traderRcpt = await traderSwapTx.wait();
  console.log(`🎉 INDEPENDENT USER TRADE CONFIRMED ON OMNI NETWORK!`);
  console.log(`   Tx Hash:  ${traderRcpt.hash}`);
  console.log(`   Block:    ${traderRcpt.blockNumber}`);
  const gasPriceUsed = traderRcpt.gasPrice || traderRcpt.effectiveGasPrice || 1000000000n;
  console.log(`   Gas Paid: ${ethers.formatEther(BigInt(traderRcpt.gasUsed) * BigInt(gasPriceUsed))} OMNI\n`);

  const results = {
    network: "OMNI Network (Chain 39821)",
    rpcGateway: rpcUrl,
    valuation: {
      priceUsd: `$${oraclePrice.toFixed(4)}`,
      marketCap: "$1,000,000,000 USD",
      oracle: oracleAddr
    },
    trades: [
      {
        action: "OMNI -> USDC AMM Swap",
        trader: genesisSigner.address,
        amountIn: "50.0 OMNI",
        amountOut: `${ethers.formatUnits(quote[0], 6)} USDC`,
        txHash: rcpt1.hash,
        block: rcpt1.blockNumber
      },
      {
        action: "USDC -> WETH Multi-Token Swap",
        trader: genesisSigner.address,
        amountIn: "25.0 USDC",
        amountOut: `${ethers.formatUnits(quoteEth[0], 18)} WETH`,
        txHash: rcpt2.hash,
        block: rcpt2.blockNumber
      },
      {
        action: "Wrap Native OMNI to WOMNI",
        trader: genesisSigner.address,
        amount: "10.0 OMNI",
        txHash: depRcpt.hash,
        block: depRcpt.blockNumber
      },
      {
        action: "Unwrap WOMNI to Native OMNI",
        trader: genesisSigner.address,
        amount: "5.0 WOMNI",
        txHash: wdrRcpt.hash,
        block: wdrRcpt.blockNumber
      },
      {
        action: "Independent Trader AMM Swap (OMNI -> USDC)",
        trader: traderSigner.address,
        amountIn: "20.0 OMNI",
        txHash: traderRcpt.hash,
        block: traderRcpt.blockNumber
      }
    ]
  };

  fs.writeFileSync("live_trade_execution_report.json", JSON.stringify(results, null, 2));
  console.log("Execution report saved to live_trade_execution_report.json!");
}

main().catch((err) => {
  console.error("Execution failed:", err);
  process.exit(1);
});
