const { ethers } = require('ethers');
const MPCService = require('./MPCService');

class TxService {
  constructor() {
    this.providers = {
      ethereum: new ethers.JsonRpcProvider(process.env.ETH_RPC_URL),
      bsc: new ethers.JsonRpcProvider(process.env.BSC_RPC_URL)
    };
  }

  // Simulate transaction before signing
  async simulateTransaction(transactionData) {
    try {
      const { chain, from, to, value, data } = transactionData;
      
      const provider = this.providers[chain];
      if (!provider) {
        throw new Error(`Unsupported chain: ${chain}`);
      }

      const simulationResult = {
        success: true,
        preview: {},
        warnings: [],
        estimatedGas: '0',
        estimatedCost: '0'
      };

      // Basic simulation checks
      if (value && parseFloat(value) > 10000) { // Large amount warning
        simulationResult.warnings.push('Large transaction amount detected');
      }

      if (to && this.isSuspiciousAddress(to)) {
        simulationResult.warnings.push('Recipient address has been flagged as suspicious');
      }

      // Estimate gas
      try {
        const gasEstimate = await provider.estimateGas({
          from,
          to,
          value: ethers.parseEther(value || '0'),
          data
        });
        simulationResult.estimatedGas = gasEstimate.toString();
        
        // Estimate cost
        const gasPrice = await provider.getGasPrice();
        const cost = gasEstimate * gasPrice;
        simulationResult.estimatedCost = ethers.formatEther(cost);
      } catch (gasError) {
        simulationResult.success = false;
        simulationResult.warnings.push('Transaction simulation failed: ' + gasError.message);
      }

      // Generate preview
      simulationResult.preview = {
        from,
        to,
        value: value || '0',
        chain,
        description: this.generateTransactionDescription(transactionData)
      };

      return simulationResult;
    } catch (error) {
      console.error('Transaction simulation error:', error);
      throw new Error('Transaction simulation failed');
    }
  }

  // Sign and broadcast transaction using MPC
  async signAndBroadcast(transactionData, hotShard, securityShard) {
    try {
      // First simulate
      const simulation = await this.simulateTransaction(transactionData);
      if (!simulation.success) {
        throw new Error('Transaction simulation failed: ' + simulation.warnings.join(', '));
      }

      // Combine shards and sign
      const signature = MPCService.combineAndSign(
        hotShard, 
        securityShard, 
        transactionData
      );

      // Broadcast transaction
      const provider = this.providers[transactionData.chain];
      const txResponse = await provider.broadcastTransaction({
        ...transactionData,
        signature: signature.signature
      });

      return {
        success: true,
        txHash: txResponse.hash,
        simulation: simulation,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Transaction signing/broadcast error:', error);
      throw new Error('Failed to execute transaction: ' + error.message);
    }
  }

  isSuspiciousAddress(address) {
    // Basic suspicious address check
    // In production, integrate with threat intelligence feeds
    const suspiciousPatterns = [
      /^0x0000000000000000000000000000000000000000$/,
      /^0xdead000000000000000000000000000000000000$/
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(address));
  }

  generateTransactionDescription(txData) {
    if (txData.data && txData.data !== '0x') {
      return 'Contract interaction';
    } else if (parseFloat(txData.value) > 0) {
      return `Send ${txData.value} ${txData.token || 'ETH'}`;
    } else {
      return 'Transaction';
    }
  }
}

module.exports = TxService;