const { ethers } = require('ethers');
const axios = require('axios');

class GasService {
  constructor() {
    this.providers = {
      ethereum: new ethers.JsonRpcProvider(process.env.ETH_RPC_URL),
      bsc: new ethers.JsonRpcProvider(process.env.BSC_RPC_URL)
    };

    // Token price cache
    this.priceCache = {};
    this.cacheTimeout = 300000; // 5 minutes
  }

  // Estimate gas fees for a transaction
  async estimateGasFees(transactionData, payWithToken = null) {
    try {
      const { chain, from, to, value, data } = transactionData;
      const provider = this.providers[chain];

      if (!provider) {
        throw new Error(`Unsupported chain: ${chain}`);
      }

      // Estimate gas units
      const gasEstimate = await provider.estimateGas({
        from,
        to,
        value: ethers.parseEther(value || '0'),
        data: data || '0x'
      });

      // Get current gas price
      const gasPrice = await provider.getGasPrice();
      
      // Calculate native token cost
      const nativeCost = gasEstimate * gasPrice;
      const nativeCostFormatted = ethers.formatEther(nativeCost);

      // Get token prices for conversion
      const tokenPrices = await this.getTokenPrices(chain);

      let alternatives = [];
      
      // If payWithToken is specified, calculate cost in that token
      if (payWithToken && payWithToken !== 'native') {
        const tokenCost = await this.calculateTokenCost(
          nativeCostFormatted, 
          payWithToken, 
          tokenPrices,
          chain
        );
        
        alternatives.push({
          token: payWithToken,
          cost: tokenCost,
          equivalent: `${nativeCostFormatted} ${this.getNativeSymbol(chain)}`
        });
      }

      // Always include native token option
      alternatives.push({
        token: 'native',
        cost: nativeCostFormatted,
        symbol: this.getNativeSymbol(chain)
      });

      // Include other popular token options
      const popularTokens = ['USDT', 'ZIV'];
      for (const token of popularTokens) {
        if (token !== payWithToken) {
          const tokenCost = await this.calculateTokenCost(
            nativeCostFormatted,
            token,
            tokenPrices,
            chain
          );
          
          alternatives.push({
            token,
            cost: tokenCost,
            equivalent: `${nativeCostFormatted} ${this.getNativeSymbol(chain)}`
          });
        }
      }

      return {
        success: true,
        estimates: {
          gasUnits: gasEstimate.toString(),
          gasPrice: ethers.formatUnits(gasPrice, 'gwei'),
          alternatives,
          nativeCost: nativeCostFormatted,
          nativeSymbol: this.getNativeSymbol(chain)
        },
        message: 'Gas estimation completed'
      };
    } catch (error) {
      console.error('Gas estimation error:', error);
      throw new Error('Failed to estimate gas fees: ' + error.message);
    }
  }

  // Calculate cost in specified token
  async calculateTokenCost(nativeCost, token, tokenPrices, chain) {
    const nativeSymbol = this.getNativeSymbol(chain);
    const nativePrice = tokenPrices[nativeSymbol] || 1;
    const tokenPrice = tokenPrices[token] || 1;

    if (nativePrice === 0) {
      throw new Error(`Unable to get price for ${nativeSymbol}`);
    }

    const costInUSD = parseFloat(nativeCost) * nativePrice;
    const costInToken = costInUSD / (tokenPrice || 1);

    return costInToken.toFixed(6);
  }

  // Get current token prices
  async getTokenPrices(chain) {
    const cacheKey = `${chain}_prices`;
    const now = Date.now();

    // Return cached prices if still valid
    if (this.priceCache[cacheKey] && 
        (now - this.priceCache[cacheKey].timestamp) < this.cacheTimeout) {
      return this.priceCache[cacheKey].prices;
    }

    try {
      // In production, use real price feeds like CoinGecko, Uniswap, etc.
      const prices = {
        // Mock prices - replace with real API calls
        ETH: 2500,
        BNB: 300,
        TON: 2.5,
        ZIV: 0.1,
        USDT: 1.0
      };

      // Cache the prices
      this.priceCache[cacheKey] = {
        prices,
        timestamp: now
      };

      return prices;
    } catch (error) {
      console.error('Price fetch error:', error);
      
      // Return fallback prices if API fails
      return {
        ETH: 2500,
        BNB: 300,
        TON: 2.5,
        ZIV: 0.1,
        USDT: 1.0
      };
    }
  }

  getNativeSymbol(chain) {
    const symbols = {
      ethereum: 'ETH',
      bsc: 'BNB',
      ton: 'TON'
    };
    return symbols[chain] || 'ETH';
  }

  // Get current gas price for a chain
  async getCurrentGasPrice(chain) {
    try {
      const provider = this.providers[chain];
      if (!provider) {
        throw new Error(`Unsupported chain: ${chain}`);
      }

      const gasPrice = await provider.getGasPrice();
      
      return {
        standard: ethers.formatUnits(gasPrice, 'gwei'),
        fast: ethers.formatUnits(gasPrice * 110n / 100n, 'gwei'), // 10% faster
        instant: ethers.formatUnits(gasPrice * 120n / 100n, 'gwei') // 20% faster
      };
    } catch (error) {
      console.error('Gas price fetch error:', error);
      throw new Error('Failed to fetch gas prices');
    }
  }

  // Clear price cache (useful for testing)
  clearCache() {
    this.priceCache = {};
  }
}

module.exports = GasService;