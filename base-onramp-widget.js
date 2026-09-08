/**
 * OMNI Network — Coinbase Onramp & Fiat Gateway Widget
 * Enables Apple Pay, Debit Card, and Bank Account purchases directly on Base
 */

(function() {
  'use strict';

  window.initCoinbaseOnramp = function(options = {}) {
    const defaultAddress = options.walletAddress || "0x0000000000000000000000000000000000000000";
    const chain = options.chain || "base";
    const asset = options.asset || "USDC";

    // Coinbase Pay onramp URL format
    const destinationWallets = JSON.stringify([{
      address: defaultAddress,
      blockchains: [chain],
      assets: [asset, "ETH"]
    }]);

    const onrampUrl = `https://pay.coinbase.com/buy/select-asset?destinationWallets=${encodeURIComponent(destinationWallets)}&defaultAsset=${asset}&defaultNetwork=${chain}`;

    return {
      open: function() {
        const width = 460;
        const height = 720;
        const left = (window.innerWidth - width) / 2;
        const top = (window.innerHeight - height) / 2;

        const popup = window.open(
          onrampUrl,
          "CoinbaseOnrampPopup",
          `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes,status=yes`
        );

        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
          // If popup blocked, open in new tab
          window.open(onrampUrl, "_blank");
        }
      },
      url: onrampUrl
    };
  };

  window.openFiatOnrampModal = function(userAddress) {
    const onramp = window.initCoinbaseOnramp({
      walletAddress: userAddress || (window.ethereum?.selectedAddress || ""),
      chain: "base",
      asset: "USDC"
    });
    onramp.open();
  };
})();
