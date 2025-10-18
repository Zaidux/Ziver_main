const asyncHandler = require('express-async-handler');
const GasService = require('../../../services/wallet/GasService');

const gasService = new GasService();

const gasController = {
  // Estimate gas fees for transaction
  estimateFees: asyncHandler(async (req, res) => {
    const { transactionData, payWithToken } = req.body;

    if (!transactionData || !transactionData.chain) {
      return res.status(400).json({
        success: false,
        message: 'Transaction data with chain is required'
      });
    }

    const estimation = await gasService.estimateGasFees(transactionData, payWithToken);

    res.json(estimation);
  }),

  // Get current gas prices for a chain
  getGasPrices: asyncHandler(async (req, res) => {
    const { chain } = req.query;

    if (!chain) {
      return res.status(400).json({
        success: false,
        message: 'Chain parameter is required'
      });
    }

    const gasPrices = await gasService.getCurrentGasPrice(chain);

    res.json({
      success: true,
      chain,
      gasPrices,
      lastUpdated: new Date().toISOString()
    });
  }),

  // Get token prices for gas estimation
  getTokenPrices: asyncHandler(async (req, res) => {
    const { chain } = req.query;

    const tokenPrices = await gasService.getTokenPrices(chain || 'ethereum');

    res.json({
      success: true,
      prices: tokenPrices,
      lastUpdated: new Date().toISOString()
    });
  })
};

module.exports = gasController;