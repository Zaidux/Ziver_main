const asyncHandler = require('express-async-handler');
const RecoveryRequest = require('../../../models/RecoveryRequest');
const Guardian = require('../../../models/Guardian');
const MPCService = require('../../../services/wallet/MPCService');
const WalletShard = require('../../../models/WalletShard');

const recoveryController = {
  // Initiate wallet recovery
  initiateRecovery: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { reason } = req.body;

    // Check if user has active guardians
    const guardians = await Guardian.getUserGuardians(userId);
    if (guardians.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 guardians are required for recovery'
      });
    }

    // Check for existing active recovery request
    const existingRequest = await RecoveryRequest.getActiveRequest(userId);
    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'Recovery request already in progress'
      });
    }

    // Create recovery request
    const guardianIds = guardians.map(g => g.id);
    const recoveryRequest = await RecoveryRequest.createRequest(userId, guardianIds);

    // TODO: Send notifications to guardians
    await this.notifyGuardians(guardians, recoveryRequest.id);

    res.json({
      success: true,
      recoveryRequest: {
        id: recoveryRequest.id,
        guardiansRequired: recoveryRequest.votes_required,
        guardiansTotal: guardianIds.length,
        status: recoveryRequest.status,
        createdAt: recoveryRequest.created_at
      },
      message: 'Recovery initiated. Guardians have been notified.'
    });
  }),

  // Vote on recovery request
  voteOnRecovery: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { requestId, approve } = req.body;

    if (typeof approve !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Approve parameter must be boolean'
      });
    }

    // Check if user is a guardian for this request
    const recoveryRequest = await RecoveryRequest.getById(requestId);
    if (!recoveryRequest) {
      return res.status(404).json({
        success: false,
        message: 'Recovery request not found'
      });
    }

    const guardians = await Guardian.getUserGuardians(recoveryRequest.user_id);
    const isGuardian = guardians.some(g => g.id === userId);
    
    if (!isGuardian) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to vote on this recovery request'
      });
    }

    // Add vote
    const voteResult = await RecoveryRequest.addVote(requestId, userId, approve);

    // If approved, regenerate wallet shards
    if (voteResult.status === 'approved') {
      await this.regenerateWalletShards(recoveryRequest.user_id);
      
      // TODO: Notify user that recovery is complete
    }

    res.json({
      success: true,
      vote: {
        requestId,
        approved: approve,
        votesReceived: voteResult.votesReceived,
        votesRequired: voteResult.votesRequired,
        status: voteResult.status
      },
      message: `Vote ${approve ? 'approved' : 'rejected'} successfully`
    });
  }),

  // Get recovery status
  getRecoveryStatus: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    const recoveryRequest = await RecoveryRequest.getActiveRequest(userId);
    
    if (!recoveryRequest) {
      return res.json({
        success: true,
        active: false,
        message: 'No active recovery request'
      });
    }

    const guardians = await Guardian.getUserGuardians(userId);
    
    res.json({
      success: true,
      active: true,
      recoveryRequest: {
        id: recoveryRequest.id,
        status: recoveryRequest.status,
        votesReceived: recoveryRequest.votes_received.length,
        votesRequired: recoveryRequest.votes_required,
        guardians: guardians.map(g => ({
          id: g.id,
          name: g.name,
          hasVoted: recoveryRequest.votes_received.some(v => v.guardianId === g.id)
        })),
        createdAt: recoveryRequest.created_at
      }
    });
  }),

  // Regenerate wallet shards after successful recovery
  async regenerateWalletShards(userId) {
    try {
      // Deactivate old shards
      await WalletShard.deactivateShard(userId, 'hot');
      await WalletShard.deactivateShard(userId, 'security');
      await WalletShard.deactivateShard(userId, 'recovery');

      // Generate new shards
      const { shards, publicKey } = MPCService.generateShards();
      
      // Store new shards
      await WalletShard.createShards(userId, shards, 'multi');

      // TODO: Distribute new recovery shard to guardians
      
      console.log(`Wallet shards regenerated for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Failed to regenerate wallet shards:', error);
      throw new Error('Failed to regenerate wallet');
    }
  },

  // Notify guardians about recovery request
  async notifyGuardians(guardians, requestId) {
    // TODO: Implement actual notification system
    // This could be email, push notifications, etc.
    
    console.log(`Notifying ${guardians.length} guardians about recovery request ${requestId}`);
    
    for (const guardian of guardians) {
      console.log(`Notified guardian: ${guardian.name} (${guardian.email})`);
    }
    
    return true;
  }
};

module.exports = recoveryController;