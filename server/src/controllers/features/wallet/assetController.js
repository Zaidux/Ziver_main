const asyncHandler = require('express-async-handler');
const AssetService = require('../../../services/wallet/AssetService');

const assetService = new AssetService();

const assetController = {
  // Get portfolio balances
  getBalances: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    // In production, get actual wallet addresses from database
    // For now, use mock addresses based on user ID
    const walletAddresses = {
      ethereum: `0x${Buffer.from(userId.replace(/-/g, '')).toString('hex').slice(0, 40)}`,
      bsc: `0x${Buffer.from(userId.replace(/-/g, '')).toString('hex').slice(0, 40)}`,
      ton: `EQ${Buffer.from(userId.replace(/-/g, '')).toString('hex').slice(0, 48)}`
    };

    const balances = await assetService.getBalances(walletAddresses);
    
    // Calculate total portfolio value
    let totalValue = 0;
    const portfolio = {};

    for (const [chain, chainBalances] of Object.entries(balances)) {
      portfolio[chain] = chainBalances;
      
      // Simple valuation (in production, use real price feeds)
      if (chainBalances.native && chainBalances.native !== '0') {
        totalValue += parseFloat(chainBalances.native) * this.getTokenPrice(chain);
      }
      
      for (const [token, balance] of Object.entries(chainBalances.tokens || {})) {
        if (balance !== '0') {
          totalValue += parseFloat(balance) * this.getTokenPrice(token);
        }
      }
    }

    res.json({
      success: true,
      balances: portfolio,
      totalValue: totalValue.toFixed(2),
      walletAddresses,
      lastUpdated: new Date().toISOString()
    });
  }),

  // Get transaction history
  getTransactionHistory: asyncHandler(async (req, res) => {
    const { chain, limit } = req.query;
    const userId = req.user.id;

    // Get wallet address for user
    const walletAddress = `0x${Buffer.from(userId.replace(/-/g, '')).toString('hex').slice(0, 40)}`;
    
    const transactions = await assetService.getTransactionHistory(
      walletAddress, 
      chain || 'ethereum', 
      parseInt(limit) || 50
    );

    res.json({
      success: true,
      transactions,
      count: transactions.length
    });
  }),

  // Token price helper (simplified)
  getTokenPrice(symbol) {
    const prices = {
      ethereum: 2500, // ETH price
      bsc: 300, // BNB price  
      ton: 2.5, // TON price
      ZIV: 0.1, // ZIV price
      USDT: 1.0
    };
    
    return prices[symbol] || 1;
  }
};

module.exports = assetController;
