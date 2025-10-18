const asyncHandler = require('express-async-handler');
const Policy = require('../../../models/Policy');

const policyController = {
  // Create new spending policy
  createPolicy: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { type, params } = req.body;

    if (!type || !params) {
      return res.status(400).json({
        success: false,
        message: 'Policy type and parameters are required'
      });
    }

    // Validate policy type
    const validTypes = ['daily_limit', 'whitelist', 'multi_sig'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid policy type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // Validate parameters based on type
    const validationResult = this.validatePolicyParams(type, params);
    if (!validationResult.valid) {
      return res.status(400).json({
        success: false,
        message: validationResult.error
      });
    }

    // Check if policy type already exists
    const existingPolicy = await Policy.getPolicy(userId, type);
    if (existingPolicy) {
      return res.status(400).json({
        success: false,
        message: `A ${type.replace('_', ' ')} policy already exists`
      });
    }

    // Create policy
    const policy = await Policy.createPolicy(userId, { type, params });

    res.status(201).json({
      success: true,
      policy: {
        id: policy.id,
        type: policy.policy_type,
        params: policy.policy_params,
        isActive: policy.is_active,
        createdAt: policy.created_at
      },
      message: 'Spending policy created successfully'
    });
  }),

  // Get all user policies
  getPolicies: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    const policies = await Policy.getUserPolicies(userId);

    res.json({
      success: true,
      policies: policies.map(policy => ({
        id: policy.id,
        type: policy.policy_type,
        params: policy.policy_params,
        isActive: policy.is_active,
        createdAt: policy.created_at,
        updatedAt: policy.updated_at
      })),
      count: policies.length
    });
  }),

  // Delete policy
  deletePolicy: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    const policy = await Policy.deactivatePolicy(id);
    
    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Policy not found'
      });
    }

    res.json({
      success: true,
      message: 'Policy deleted successfully'
    });
  }),

  // Validate policy parameters
  validatePolicyParams(type, params) {
    switch (type) {
      case 'daily_limit':
        if (!params.limit || !params.token) {
          return { valid: false, error: 'Daily limit policy requires limit and token parameters' };
        }
        if (parseFloat(params.limit) <= 0) {
          return { valid: false, error: 'Daily limit must be greater than 0' };
        }
        return { valid: true };

      case 'whitelist':
        if (!params.addresses || !Array.isArray(params.addresses)) {
          return { valid: false, error: 'Whitelist policy requires addresses array' };
        }
        if (params.addresses.length === 0) {
          return { valid: false, error: 'Whitelist must contain at least one address' };
        }
        // Validate address format
        for (const address of params.addresses) {
          if (!this.isValidAddress(address)) {
            return { valid: false, error: `Invalid address in whitelist: ${address}` };
          }
        }
        return { valid: true };

      case 'multi_sig':
        if (!params.threshold || !params.guardians) {
          return { valid: false, error: 'Multi-sig policy requires threshold and guardians parameters' };
        }
        if (parseFloat(params.threshold) <= 0) {
          return { valid: false, error: 'Threshold must be greater than 0' };
        }
        if (!Array.isArray(params.guardians) || params.guardians.length === 0) {
          return { valid: false, error: 'Guardians list must contain at least one guardian' };
        }
        return { valid: true };

      default:
        return { valid: false, error: 'Unknown policy type' };
    }
  },

  isValidAddress(address) {
    // Basic Ethereum address validation
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
};

module.exports = policyController;