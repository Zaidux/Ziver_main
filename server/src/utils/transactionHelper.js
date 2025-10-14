const Transaction = require('../models/Transaction');

const transactionHelper = {
  // Record ZP earnings
  recordZPEarning: async (userId, amount, description, referenceId = null, referenceType = null, metadata = {}) => {
    try {
      await Transaction.create({
        userId,
        type: 'zp_earn',
        amount,
        currency: 'ZP',
        description,
        referenceId,
        referenceType,
        metadata
      });
      console.log(`✅ Recorded ZP earning: ${amount} ZP for user ${userId}`);
    } catch (error) {
      console.error('❌ Failed to record ZP earning:', error.message);
    }
  },

  // Record SEB earnings
  recordSEBEarning: async (userId, amount, description, referenceId = null, referenceType = null, metadata = {}) => {
    try {
      await Transaction.create({
        userId,
        type: 'seb_earn',
        amount,
        currency: 'SEB',
        description,
        referenceId,
        referenceType,
        metadata
      });
      console.log(`✅ Recorded SEB earning: ${amount} SEB for user ${userId}`);
    } catch (error) {
      console.error('❌ Failed to record SEB earning:', error.message);
    }
  },

  // Record mining rewards
  recordMiningReward: async (userId, zpAmount, sebAmount, duration, metadata = {}) => {
    try {
      if (zpAmount > 0) {
        await transactionHelper.recordZPEarning(
          userId, 
          zpAmount, 
          `Mining reward for ${duration} minutes`,
          null,
          'mining',
          { duration, ...metadata }
        );
      }
      
      if (sebAmount > 0) {
        await transactionHelper.recordSEBEarning(
          userId,
          sebAmount,
          `Social points from mining for ${duration} minutes`,
          null,
          'mining',
          { duration, ...metadata }
        );
      }
    } catch (error) {
      console.error('❌ Failed to record mining reward:', error.message);
    }
  },

  // Record task completion reward
  recordTaskReward: async (userId, zpAmount, sebAmount, taskTitle, taskId) => {
    try {
      if (zpAmount > 0) {
        await transactionHelper.recordZPEarning(
          userId,
          zpAmount,
          `Task completion: ${taskTitle}`,
          taskId,
          'task',
          { taskTitle }
        );
      }
      
      if (sebAmount > 0) {
        await transactionHelper.recordSEBEarning(
          userId,
          sebAmount,
          `Social points from task: ${taskTitle}`,
          taskId,
          'task',
          { taskTitle }
        );
      }
    } catch (error) {
      console.error('❌ Failed to record task reward:', error.message);
    }
  },

  // Record feedback reward
  recordFeedbackReward: async (userId, zpAmount, sebAmount, feedbackTitle, feedbackId) => {
    try {
      if (zpAmount > 0) {
        await transactionHelper.recordZPEarning(
          userId,
          zpAmount,
          `Feedback reward: ${feedbackTitle}`,
          feedbackId,
          'feedback',
          { feedbackTitle }
        );
      }
      
      if (sebAmount > 0) {
        await transactionHelper.recordSEBEarning(
          userId,
          sebAmount,
          `Social points from feedback: ${feedbackTitle}`,
          feedbackId,
          'feedback',
          { feedbackTitle }
        );
      }
    } catch (error) {
      console.error('❌ Failed to record feedback reward:', error.message);
    }
  }
};

module.exports = transactionHelper;