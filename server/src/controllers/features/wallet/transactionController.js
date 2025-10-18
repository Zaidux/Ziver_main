const asyncHandler = require('express-async-handler');
const TxService = require('../../../services/wallet/TxService');
const Policy = require('../../../models/Policy');
const WalletShard = require('../../../models/WalletShard');

const txService = new TxService();

const transactionController = {
  // Simulate transaction
  simulateTransaction: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const transactionData = req.body;

    // Validate transaction data
    if (!transactionData.chain || !transactionData.to) {
      return res.status(400).json({
        success: false,
        message: 'Chain and recipient address are required'
      });
    }

    // Check against spending policies
    const policyCheck = await Policy.validateTransaction(userId, transactionData);
    if (!policyCheck.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Transaction violates spending policies',
        violations: policyCheck.violations
      });
    }

    // Simulate transaction
    const simulation = await txService.simulateTransaction({
      ...transactionData,
      from: `0x${Buffer.from(userId.replace(/-/g, '')).toString('hex').slice(0, 40)}` // Mock address
    });

    res.json({
      success: simulation.success,
      simulation,
      policyCheck: {
        passed: policyCheck.isValid,
        violations: policyCheck.violations
      }
    });
  }),

  // Send transaction
  sendTransaction: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { transactionData, hotShard, biometricToken } = req.body;

    // Validate biometric token (simplified)
    if (!biometricToken) {
      return res.status(401).json({
        success: false,
        message: 'Biometric authentication required'
      });
    }

    // Get server security shard
    const securityShardRecord = await WalletShard.getShard(userId, 'security');
    if (!securityShardRecord) {
      return res.status(400).json({
        success: false,
        message: 'Security shard not found'
      });
    }

    // Execute transaction with MPC
    const result = await txService.signAndBroadcast(
      transactionData,
      hotShard,
      securityShardRecord.encrypted_shard
    );

    res.json({
      success: result.success,
      transaction: {
        hash: result.txHash,
        status: 'pending',
        simulation: result.simulation,
        timestamp: result.timestamp
      },
      message: 'Transaction submitted successfully'
    });
  }),

  // Get transaction status
  getTransactionStatus: asyncHandler(async (req, res) => {
    const { txHash, chain } = req.query;
    
    if (!txHash || !chain) {
      return res.status(400).json({
        success: false,
        message: 'Transaction hash and chain are required'
      });
    }

    const provider = txService.providers[chain];
    if (!provider) {
      return res.status(400).json({
        success: false,
        message: `Unsupported chain: ${chain}`
      });
    }

    try {
      const receipt = await provider.getTransactionReceipt(txHash);
      
      let status = 'pending';
      if (receipt) {
        status = receipt.status === 1 ? 'confirmed' : 'failed';
      }

      res.json({
        success: true,
        transaction: {
          hash: txHash,
          status,
          blockNumber: receipt?.blockNumber,
          confirmations: receipt ? await this.getConfirmations(receipt.blockNumber, provider) : 0
        }
      });
    } catch (error) {
      console.error('Transaction status check error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check transaction status'
      });
    }
  }),

  async getConfirmations(blockNumber, provider) {
    const currentBlock = await provider.getBlockNumber();
    return currentBlock - blockNumber;
  }
};

module.exports = transactionController;