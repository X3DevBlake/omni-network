/**
 * OMNI Network — Universal Fiat On-Ramp & Coinbase Pay Gateway
 * Features:
 *  - Fixed modern Coinbase CDP Onramp URL parameters (addresses + assets)
 *  - Session Token support for Secure Initialization
 *  - Multi-rail instant fiat gateways (Coinbase Pay, Uniswap Apple Pay / MoonPay, Transak)
 */

(function() {
  'use strict';

  // Inject styles for the Fiat Onramp Modal
  const style = document.createElement('style');
  style.textContent = `
    .fiat-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(4, 2, 10, 0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      z-index: 100000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s ease;
    }
    .fiat-modal-overlay.active {
      opacity: 1;
      pointer-events: auto;
    }
    .fiat-modal-card {
      background: rgba(18, 12, 38, 0.95);
      border: 1px solid rgba(168, 85, 247, 0.35);
      border-radius: 24px;
      width: 100%;
      max-width: 480px;
      padding: 28px;
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.8), 0 0 40px rgba(168, 85, 247, 0.2);
      transform: scale(0.95);
      transition: transform 0.25s ease;
      color: #f8fafc;
      font-family: 'Outfit', sans-serif;
    }
    .fiat-modal-overlay.active .fiat-modal-card {
      transform: scale(1);
    }
    .fiat-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .fiat-modal-title {
      font-size: 20px;
      font-weight: 700;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .fiat-modal-close {
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: #94a3b8;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }
    .fiat-modal-close:hover {
      background: rgba(255, 255, 255, 0.2);
      color: #fff;
    }
    .fiat-gateway-option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 16px;
      margin-bottom: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      text-decoration: none;
      color: inherit;
    }
    .fiat-gateway-option:hover {
      background: rgba(168, 85, 247, 0.12);
      border-color: rgba(168, 85, 247, 0.4);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(168, 85, 247, 0.2);
    }
    .fiat-gateway-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .fiat-gateway-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
    }
    .fiat-gateway-name {
      font-size: 16px;
      font-weight: 700;
      color: #fff;
      margin-bottom: 2px;
    }
    .fiat-gateway-desc {
      font-size: 12px;
      color: #94a3b8;
    }
    .fiat-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 6px;
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .fiat-info-box {
      font-size: 11px;
      color: #94a3b8;
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 12px;
      margin-top: 16px;
      line-height: 1.5;
    }
  `;
  document.head.appendChild(style);

  // Helper to construct modern Coinbase Onramp URL
  window.getCoinbaseOnrampUrl = function(walletAddress, sessionToken) {
    const address = walletAddress || "0x0000000000000000000000000000000000000000";
    
    // If a session token is provided (for Secure Initialization ON)
    if (sessionToken && sessionToken.trim() !== "") {
      return `https://pay.coinbase.com/buy?sessionToken=${encodeURIComponent(sessionToken.trim())}`;
    }

    // Modern Coinbase CDP Onramp API schema (addresses + assets parameters)
    const addressesObj = {};
    addressesObj[address] = ["base"];

    const addressesParam = encodeURIComponent(JSON.stringify(addressesObj));
    const assetsParam = encodeURIComponent(JSON.stringify(["USDC", "ETH"]));

    return `https://pay.coinbase.com/buy/select-asset?addresses=${addressesParam}&assets=${assetsParam}&defaultAsset=USDC&defaultNetwork=base`;
  };

  // Helper for Uniswap Base Fiat Onramp (MoonPay / Apple Pay / Cards)
  window.getUniswapOnrampUrl = function() {
    return "https://app.uniswap.org/buy?chain=base&outputCurrency=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  };

  // Helper for Transak Base Onramp
  window.getTransakOnrampUrl = function(walletAddress) {
    const address = walletAddress || "";
    return `https://global.transak.com/?cryptoCurrencyCode=USDC&network=base&walletAddress=${address}&fiatCurrency=USD`;
  };

  // Create and inject the modal DOM
  function createModalDOM() {
    if (document.getElementById('fiatOnrampModalOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'fiatOnrampModalOverlay';
    overlay.className = 'fiat-modal-overlay';
    overlay.innerHTML = `
      <div class="fiat-modal-card">
        <div class="fiat-modal-header">
          <div class="fiat-modal-title">
            <span>💳</span>
            <span>Buy Crypto via Apple Pay & Cards</span>
          </div>
          <button class="fiat-modal-close" onclick="closeFiatOnrampModal()">✕</button>
        </div>

        <p style="font-size:13px; color:#94a3b8; margin-bottom:18px; line-height:1.4;">
          Purchase USDC or ETH directly on <strong>Base (Coinbase Layer 2)</strong> using Apple Pay, Google Pay, or debit card to trade $OMNI.
        </p>

        <!-- Option 1: Uniswap Official Onramp (Instant Apple Pay, Zero Config Needed) -->
        <a id="linkUniswapOnramp" class="fiat-gateway-option" href="#" target="_blank">
          <div class="fiat-gateway-left">
            <div class="fiat-gateway-icon" style="background: rgba(255, 0, 122, 0.15); border: 1px solid rgba(255, 0, 122, 0.3);">
              🦄
            </div>
            <div>
              <div class="fiat-gateway-name">Uniswap Fiat Gateway</div>
              <div class="fiat-gateway-desc">Instant Apple Pay, Cards & MoonPay on Base</div>
            </div>
          </div>
          <span class="fiat-badge">Fastest</span>
        </a>

        <!-- Option 2: Coinbase Pay (CDP Onramp with Modern Params) -->
        <a id="linkCoinbaseOnramp" class="fiat-gateway-option" href="#" target="_blank">
          <div class="fiat-gateway-left">
            <div class="fiat-gateway-icon" style="background: rgba(0, 82, 255, 0.15); border: 1px solid rgba(0, 82, 255, 0.3);">
              🔵
            </div>
            <div>
              <div class="fiat-gateway-name">Coinbase Pay (CDP)</div>
              <div class="fiat-gateway-desc">Coinbase Account, Apple Pay & ACH on Base</div>
            </div>
          </div>
          <span class="fiat-badge" style="background:rgba(0,82,255,0.15); color:#38bdf8; border-color:rgba(0,82,255,0.3);">Official</span>
        </a>

        <!-- Option 3: Transak Global Gateway -->
        <a id="linkTransakOnramp" class="fiat-gateway-option" href="#" target="_blank">
          <div class="fiat-gateway-left">
            <div class="fiat-gateway-icon" style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3);">
              ⚡
            </div>
            <div>
              <div class="fiat-gateway-name">Transak Direct Base</div>
              <div class="fiat-gateway-desc">Visa, Mastercard & 150+ countries</div>
            </div>
          </div>
          <span class="fiat-badge">Global</span>
        </a>

        <!-- Optional Session Token input for Coinbase Secure Init -->
        <div style="margin-top:14px; background:rgba(0,0,0,0.4); padding:12px; border-radius:12px; border:1px solid rgba(255,255,255,0.06);">
          <div style="font-size:12px; font-weight:600; color:#cbd5e1; margin-bottom:6px; display:flex; justify-content:space-between; align-items:center;">
            <span>Coinbase Session Token (Optional):</span>
            <a href="https://docs.cdp.coinbase.com/onramp/docs/api-onramp-initializing#getting-a-session-token" target="_blank" style="color:#a855f7; font-size:11px; text-decoration:underline;">Docs</a>
          </div>
          <input type="text" id="inputCdpSessionToken" placeholder="Paste sessionToken if Secure Init is ON" style="width:100%; background:rgba(15,11,30,0.8); border:1px solid rgba(255,255,255,0.15); border-radius:8px; padding:8px 12px; font-size:12px; color:#fff; font-family:'JetBrains Mono', monospace;" oninput="updateCoinbaseLinkWithToken()">
        </div>

        <div class="fiat-info-box">
          💡 <strong>Coinbase CDP Project Tip:</strong> If you see <em>"requires a sessionToken"</em> in Coinbase Pay, your project in <strong>portal.cdp.coinbase.com</strong> has <em>Secure Initialization</em> turned ON. You can either paste a session token above, use the <strong>Uniswap Fiat Gateway</strong> above (which needs no token and supports Apple Pay immediately), or toggle Secure Init to OFF in your CDP dashboard.
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        closeFiatOnrampModal();
      }
    });
  }

  window.updateCoinbaseLinkWithToken = function() {
    const userAddress = window.ethereum?.selectedAddress || "";
    const sessionToken = document.getElementById('inputCdpSessionToken')?.value || "";
    const cbLink = document.getElementById('linkCoinbaseOnramp');
    if (cbLink) {
      cbLink.href = window.getCoinbaseOnrampUrl(userAddress, sessionToken);
    }
  };

  window.openFiatOnrampModal = function(userAddress) {
    createModalDOM();
    const address = userAddress || (window.ethereum?.selectedAddress || "");

    const cbLink = document.getElementById('linkCoinbaseOnramp');
    const uniLink = document.getElementById('linkUniswapOnramp');
    const transakLink = document.getElementById('linkTransakOnramp');

    if (cbLink) cbLink.href = window.getCoinbaseOnrampUrl(address);
    if (uniLink) uniLink.href = window.getUniswapOnrampUrl();
    if (transakLink) transakLink.href = window.getTransakOnrampUrl(address);

    const overlay = document.getElementById('fiatOnrampModalOverlay');
    if (overlay) overlay.classList.add('active');
  };

  window.closeFiatOnrampModal = function() {
    const overlay = document.getElementById('fiatOnrampModalOverlay');
    if (overlay) overlay.classList.remove('active');
  };

  // Modern Coinbase Onramp launcher
  window.initCoinbaseOnramp = function(options = {}) {
    const address = options.walletAddress || (window.ethereum?.selectedAddress || "");
    const sessionToken = options.sessionToken || "";
    const onrampUrl = window.getCoinbaseOnrampUrl(address, sessionToken);

    return {
      open: function() {
        window.openFiatOnrampModal(address);
      },
      url: onrampUrl
    };
  };
})();
