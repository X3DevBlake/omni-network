const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("OmniTokenMainnet (Ethereum Mainnet Production Token)", function () {
  let omniToken;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    const OmniTokenFactory = await ethers.getContractFactory("OmniTokenMainnet");
    omniToken = await OmniTokenFactory.deploy(owner.address);
    await omniToken.waitForDeployment();
  });

  it("Should initialize with correct name, symbol, and 18 decimals", async function () {
    expect(await omniToken.name()).to.equal("OMNI Token");
    expect(await omniToken.symbol()).to.equal("OMNI");
    expect(await omniToken.decimals()).to.equal(18);
  });

  it("Should mint exactly 1,000,000,000 OMNI to the initial owner", async function () {
    const expectedSupply = ethers.parseEther("1000000000");
    expect(await omniToken.totalSupply()).to.equal(expectedSupply);
    expect(await omniToken.balanceOf(owner.address)).to.equal(expectedSupply);
  });

  it("Should support deflationary burning", async function () {
    const burnAmount = ethers.parseEther("1000000");
    await omniToken.burn(burnAmount);
    
    const expectedRemaining = ethers.parseEther("999000000");
    expect(await omniToken.totalSupply()).to.equal(expectedRemaining);
    expect(await omniToken.balanceOf(owner.address)).to.equal(expectedRemaining);
  });

  it("Should allow transfers between users", async function () {
    const sendAmount = ethers.parseEther("50000");
    await omniToken.transfer(user1.address, sendAmount);
    expect(await omniToken.balanceOf(user1.address)).to.equal(sendAmount);

    // Transfer from user1 to user2
    await omniToken.connect(user1).transfer(user2.address, ethers.parseEther("20000"));
    expect(await omniToken.balanceOf(user2.address)).to.equal(ethers.parseEther("20000"));
    expect(await omniToken.balanceOf(user1.address)).to.equal(ethers.parseEther("30000"));
  });

  it("Should verify EIP-2612 Permit DOMAIN_SEPARATOR", async function () {
    const domainSeparator = await omniToken.DOMAIN_SEPARATOR();
    expect(domainSeparator).to.be.properHex(64);
  });
});
