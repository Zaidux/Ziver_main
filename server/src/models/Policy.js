const db = require('../config/db');

class Policy {
  // Create a new spending policy
  static async createPolicy(userId, policyData) {
    const query = `
      INSERT INTO spending_policies 
      (user_id, policy_type, policy_params, is_active)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const result = await db.query(query, [
      userId,
      policyData.type,
      JSON.stringify(policyData.params),
      true
    ]);
    
    return result.rows[0];
  }

  // Get user's active policies
  static async getUserPolicies(userId) {
    const result = await db.query(
      `SELECT * FROM spending_policies 
       WHERE user_id = $1 AND is_active = true 
       ORDER BY created_at DESC`,
      [userId]
    );
    
    return result.rows.map(row => ({
      ...row,
      policy_params: typeof row.policy_params === 'string' 
        ? JSON.parse(row.policy_params) 
        : row.policy_params
    }));
  }

  // Get specific policy type
  static async getPolicy(userId, policyType) {
    const result = await db.query(
      `SELECT * FROM spending_policies 
       WHERE user_id = $1 AND policy_type = $2 AND is_active = true`,
      [userId, policyType]
    );
    
    if (result.rows[0]) {
      result.rows[0].policy_params = typeof result.rows[0].policy_params === 'string' 
        ? JSON.parse(result.rows[0].policy_params) 
        : result.rows[0].policy_params;
    }
    
    return result.rows[0];
  }

  // Deactivate policy
  static async deactivatePolicy(policyId) {
    const result = await db.query(
      `UPDATE spending_policies 
       SET is_active = false, updated_at = NOW() 
       WHERE id = $1`,
      [policyId]
    );
    return result.rowCount > 0;
  }

  // Check if transaction violates policies
  static async validateTransaction(userId, transactionData) {
    const policies = await this.getUserPolicies(userId);
    const violations = [];

    for (const policy of policies) {
      const isValid = await this.checkPolicy(policy, transactionData);
      if (!isValid) {
        violations.push({
          policyId: policy.id,
          policyType: policy.policy_type,
          message: this.getViolationMessage(policy, transactionData)
        });
      }
    }

    return {
      isValid: violations.length === 0,
      violations
    };
  }

  static async checkPolicy(policy, transaction) {
    const params = policy.policy_params;
    
    switch (policy.policy_type) {
      case 'daily_limit':
        return await this.checkDailyLimit(policy.user_id, params, transaction);
      case 'whitelist':
        return this.checkWhitelist(params, transaction);
      case 'multi_sig':
        return this.checkMultiSig(params, transaction);
      default:
        return true;
    }
  }

  static async checkDailyLimit(userId, params, transaction) {
    // Get today's spent amount for this token
    const result = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as total_spent 
       FROM wallet_transactions 
       WHERE user_id = $1 
         AND token = $2 
         AND type = 'send'
         AND status = 'completed'
         AND created_at >= CURRENT_DATE`,
      [userId, transaction.token]
    );

    const totalSpent = parseFloat(result.rows[0].total_spent);
    return (totalSpent + transaction.amount) <= params.limit;
  }

  static checkWhitelist(params, transaction) {
    return params.addresses.includes(transaction.toAddress.toLowerCase());
  }

  static checkMultiSig(params, transaction) {
    return transaction.amount <= params.threshold;
  }

  static getViolationMessage(policy, transaction) {
    const params = policy.policy_params;
    
    switch (policy.policy_type) {
      case 'daily_limit':
        return `Daily limit of ${params.limit} ${transaction.token} exceeded`;
      case 'whitelist':
        return 'Recipient address not in whitelist';
      case 'multi_sig':
        return `Transaction exceeds ${params.threshold} ${transaction.token} threshold requiring guardian approval`;
      default:
        return 'Policy violation';
    }
  }
}

// Initialize table
Policy.initTable = async () => {
  try {
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'spending_policies'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('🔐 Creating spending_policies table...');
      await db.query(`
        CREATE TABLE spending_policies (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          policy_type VARCHAR(50) NOT NULL,
          policy_params JSONB NOT NULL,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE INDEX idx_spending_policies_user_id ON spending_policies(user_id);
        CREATE INDEX idx_spending_policies_type ON spending_policies(policy_type);
        CREATE INDEX idx_spending_policies_active ON spending_policies(is_active);
      `);
      console.log('✅ Spending policies table created successfully');
    }
  } catch (error) {
    console.error('❌ Failed to create spending_policies table:', error);
    throw error;
  }
};

module.exports = Policy;