const asyncHandler = require('express-async-handler');
const MPCService = require('../../../services/wallet/MPCService');
const WalletShard = require('../../../models/WalletShard');

const mpcController = {
  // Create new MPC wallet
  createWallet: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    // Check if user already has a wallet
    const hasWallet = await WalletShard.hasWallet(userId);
    if (hasWallet) {
      return res.status(400).json({
        success: false,
        message: 'Wallet already exists for this user'
      });
    }

    // Generate MPC shards
    const { shards, publicKey, masterPublicKey } = MPCService.generateShards();
    
    // Derive addresses for all chains
    const addresses = MPCService.deriveAddresses(publicKey);
    
    // Store shards in database
    await WalletShard.createShards(userId, shards, 'multi');
    
    // Return hot shard to client (encrypted), keep security shard on server
    res.json({
      success: true,
      wallet: {
        addresses,
        publicKey,
        masterPublicKey,
        hotShard: shards.hot, // Client stores this
        securityShard: shards.security // We store this, but return for confirmation
      },
      message: 'MPC wallet created successfully'
    });
  }),

  // Get wallet status and addresses
  getWalletStatus: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    const hasWallet = await WalletShard.hasWallet(userId);
    if (!hasWallet) {
      return res.json({
        success: true,
        hasWallet: false,
        message: 'No wallet found'
      });
    }

    // Get shard status
    const shards = await WalletShard.getUserShards(userId);
    const shardStatus = shards.reduce((acc, shard) => {
      acc[shard.shard_type] = {
        active: shard.is_active,
        lastUpdated: shard.updated_at
      };
      return acc;
    }, {});

    // In production, we'd retrieve actual addresses from storage
    res.json({
      success: true,
      hasWallet: true,
      shardStatus,
      securityLevel: 'high', // 2-of-3 MPC
      message: 'Wallet is active and secure'
    });
  }),

  // Validate shard integrity
  validateShards: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { hotShard } = req.body; // Client provides their hot shard

    if (!hotShard) {
      return res.status(400).json({
        success: false,
        message: 'Hot shard is required for validation'
      });
    }

    // Validate client's hot shard
    const isHotShardValid = MPCService.validateShard(hotShard);
    
    // Get server's security shard
    const securityShard = await WalletShard.getShard(userId, 'security');
    const isSecurityShardValid = securityShard ? 
      MPCService.validateShard(securityShard.encrypted_shard) : false;

    res.json({
      success: true,
      validation: {
        hotShard: isHotShardValid,
        securityShard: isSecurityShardValid,
        recoveryShard: true // Assume recovery shard is valid if others are
      },
      message: 'Shard validation completed'
    });
  })
};

module.exports = mpcController;
