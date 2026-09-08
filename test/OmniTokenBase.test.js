const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("OmniTokenBase Contract (Base L2)", function () {
  let OmniTokenBase, omni, owner, addr1, addr2, bridge;

  beforeEach(async function () {
    [owner, addr1, addr2, bridge] = await ethers.getSigners();
    OmniTokenBase = await ethers.getContractFactory("OmniTokenBase");
    omni = await OmniTokenBase.deploy(1_000_000_000); // 1 Billion OMNI
    await omni.waitForDeployment();
  });

  it("Should set correct name, symbol, and decimals", async function () {
    expect(await omni.name()).to.equal("OMNI Token");
    expect(await omni.symbol()).to.equal("OMNI");
    expect(await omni.decimals()).to.equal(18);
  });

  it("Should assign initial supply to the owner", async function () {
    const ownerBalance = await omni.balanceOf(owner.address);
    expect(await omni.totalSupply()).to.equal(ownerBalance);
    expect(ownerBalance).to.equal(ethers.parseEther("1000000000"));
  });

  it("Should transfer tokens between accounts", async function () {
    const amount = ethers.parseEther("500");
    await omni.transfer(addr1.address, amount);
    expect(await omni.balanceOf(addr1.address)).to.equal(amount);

    await omni.connect(addr1).transfer(addr2.address, ethers.parseEther("200"));
    expect(await omni.balanceOf(addr2.address)).to.equal(ethers.parseEther("200"));
    expect(await omni.balanceOf(addr1.address)).to.equal(ethers.parseEther("300"));
  });

  it("Should allow burning tokens", async function () {
    const burnAmount = ethers.parseEther("1000");
    await omni.burn(burnAmount);
    expect(await omni.totalSupply()).to.equal(ethers.parseEther("999999000"));
  });

  it("Should allow bridge to mint tokens", async function () {
    await omni.setBridge(bridge.address);
    expect(await omni.bridge()).to.equal(bridge.address);

    const mintAmount = ethers.parseEther("5000");
    await omni.connect(bridge).mint(addr1.address, mintAmount);
    expect(await omni.balanceOf(addr1.address)).to.equal(mintAmount);
  });

  it("Should reject non-bridge from minting", async function () {
    await expect(
      omni.connect(addr1).mint(addr1.address, ethers.parseEther("100"))
    ).to.be.revertedWith("OmniTokenBase: unauthorized");
  });

  it("Should compute valid EIP-712 DOMAIN_SEPARATOR", async function () {
    const domainSeparator = await omni.DOMAIN_SEPARATOR();
    expect(domainSeparator).to.match(/^0x[a-fA-F0-9]{64}$/);
  });
});
