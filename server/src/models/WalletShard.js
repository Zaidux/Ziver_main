const db = require('../config/db');

class WalletShard {
  // Create wallet shards for a user
  static async createShards(userId, shards, chainType = 'multi') {
    const query = `
      INSERT INTO wallet_shards (user_id, shard_type, encrypted_shard, chain_type, is_active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const results = [];
    for (const [shardType, encryptedShard] of Object.entries(shards)) {
      const result = await db.query(query, [
        userId, 
        shardType, 
        encryptedShard, 
        chainType, 
        true
      ]);
      results.push(result.rows[0]);
    }
    
    return results;
  }

  // Get user's shards
  static async getUserShards(userId, shardType = null) {
    let query = `
      SELECT * FROM wallet_shards 
      WHERE user_id = $1 AND is_active = true
    `;
    const params = [userId];
    
    if (shardType) {
      query += ' AND shard_type = $2';
      params.push(shardType);
    }
    
    const result = await db.query(query, params);
    return result.rows;
  }

  // Get specific shard
  static async getShard(userId, shardType) {
    const result = await db.query(
      `SELECT * FROM wallet_shards 
       WHERE user_id = $1 AND shard_type = $2 AND is_active = true`,
      [userId, shardType]
    );
    return result.rows[0];
  }

  // Deactivate shard (for recovery/rotation)
  static async deactivateShard(userId, shardType) {
    const result = await db.query(
      `UPDATE wallet_shards 
       SET is_active = false, updated_at = NOW() 
       WHERE user_id = $1 AND shard_type = $2`,
      [userId, shardType]
    );
    return result.rowCount > 0;
  }

  // Check if user has wallet
  static async hasWallet(userId) {
    const result = await db.query(
      `SELECT COUNT(*) FROM wallet_shards 
       WHERE user_id = $1 AND is_active = true`,
      [userId]
    );
    return parseInt(result.rows[0].count) > 0;
  }
}

// Initialize table
WalletShard.initTable = async () => {
  try {
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'wallet_shards'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('🔐 Creating wallet_shards table...');
      await db.query(`
        CREATE TABLE wallet_shards (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          shard_type VARCHAR(20) NOT NULL CHECK (shard_type IN ('hot', 'security', 'recovery')),
          encrypted_shard TEXT NOT NULL,
          chain_type VARCHAR(50) DEFAULT 'multi',
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(user_id, shard_type)
        );
        
        CREATE INDEX idx_wallet_shards_user_id ON wallet_shards(user_id);
        CREATE INDEX idx_wallet_shards_type ON wallet_shards(shard_type);
        CREATE INDEX idx_wallet_shards_active ON wallet_shards(is_active);
      `);
      console.log('✅ Wallet shards table created successfully');
    }
  } catch (error) {
    console.error('❌ Failed to create wallet_shards table:', error);
    throw error;
  }
};

module.exports = WalletShard;