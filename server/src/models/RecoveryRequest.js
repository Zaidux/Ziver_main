const db = require('../config/db');

class RecoveryRequest {
  // Create recovery request
  static async createRequest(userId, guardianIds) {
    const query = `
      INSERT INTO recovery_requests 
      (user_id, guardian_ids, votes_required, votes_received, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const votesRequired = Math.ceil(guardianIds.length * 0.6); // 60% threshold
    
    const result = await db.query(query, [
      userId,
      JSON.stringify(guardianIds),
      votesRequired,
      JSON.stringify([]), // Empty votes array
      'pending'
    ]);
    
    return result.rows[0];
  }

  // Get active recovery request for user
  static async getActiveRequest(userId) {
    const result = await db.query(
      `SELECT * FROM recovery_requests 
       WHERE user_id = $1 AND status = 'pending' 
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    
    if (result.rows[0]) {
      const row = result.rows[0];
      row.guardian_ids = typeof row.guardian_ids === 'string' 
        ? JSON.parse(row.guardian_ids) 
        : row.guardian_ids;
      row.votes_received = typeof row.votes_received === 'string' 
        ? JSON.parse(row.votes_received) 
        : row.votes_received;
    }
    
    return result.rows[0];
  }

  // Add guardian vote
  static async addVote(requestId, guardianId, approve) {
    const request = await this.getById(requestId);
    if (!request) throw new Error('Recovery request not found');

    const votes = request.votes_received || [];
    
    // Check if guardian already voted
    if (votes.some(vote => vote.guardianId === guardianId)) {
      throw new Error('Guardian already voted');
    }

    votes.push({
      guardianId,
      approve,
      votedAt: new Date()
    });

    const approveCount = votes.filter(vote => vote.approve).length;
    const newStatus = approveCount >= request.votes_required ? 'approved' : 'pending';

    const result = await db.query(
      `UPDATE recovery_requests 
       SET votes_received = $1, status = $2, updated_at = NOW() 
       WHERE id = $3`,
      [JSON.stringify(votes), newStatus, requestId]
    );

    return {
      requestId,
      votesReceived: votes.length,
      votesRequired: request.votes_required,
      status: newStatus
    };
  }

  // Get request by ID
  static async getById(requestId) {
    const result = await db.query(
      'SELECT * FROM recovery_requests WHERE id = $1',
      [requestId]
    );
    
    if (result.rows[0]) {
      const row = result.rows[0];
      row.guardian_ids = typeof row.guardian_ids === 'string' 
        ? JSON.parse(row.guardian_ids) 
        : row.guardian_ids;
      row.votes_received = typeof row.votes_received === 'string' 
        ? JSON.parse(row.votes_received) 
        : row.votes_received;
    }
    
    return result.rows[0];
  }

  // Cancel recovery request
  static async cancelRequest(requestId) {
    const result = await db.query(
      `UPDATE recovery_requests 
       SET status = 'cancelled', updated_at = NOW() 
       WHERE id = $1`,
      [requestId]
    );
    return result.rowCount > 0;
  }
}

// Initialize table
RecoveryRequest.initTable = async () => {
  try {
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'recovery_requests'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('🔐 Creating recovery_requests table...');
      await db.query(`
        CREATE TABLE recovery_requests (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          guardian_ids JSONB NOT NULL,
          votes_required INTEGER NOT NULL,
          votes_received JSONB DEFAULT '[]',
          status VARCHAR(20) DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE INDEX idx_recovery_requests_user_id ON recovery_requests(user_id);
        CREATE INDEX idx_recovery_requests_status ON recovery_requests(status);
      `);
      console.log('✅ Recovery requests table created successfully');
    }
  } catch (error) {
    console.error('❌ Failed to create recovery_requests table:', error);
    throw error;
  }
};

module.exports = RecoveryRequest;