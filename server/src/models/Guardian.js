const db = require('../config/db');

class Guardian {
  // Add guardian for user
  static async addGuardian(userId, guardianData) {
    const query = `
      INSERT INTO guardians 
      (user_id, email, phone, name, relationship, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const result = await db.query(query, [
      userId,
      guardianData.email,
      guardianData.phone,
      guardianData.name,
      guardianData.relationship,
      true
    ]);
    
    return result.rows[0];
  }

  // Get user's guardians
  static async getUserGuardians(userId) {
    const result = await db.query(
      `SELECT * FROM guardians 
       WHERE user_id = $1 AND is_active = true 
       ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  // Remove guardian
  static async removeGuardian(guardianId) {
    const result = await db.query(
      `UPDATE guardians 
       SET is_active = false, updated_at = NOW() 
       WHERE id = $1`,
      [guardianId]
    );
    return result.rowCount > 0;
  }

  // Get guardian by ID
  static async getById(guardianId) {
    const result = await db.query(
      'SELECT * FROM guardians WHERE id = $1',
      [guardianId]
    );
    return result.rows[0];
  }

  // Check if user can add more guardians (max 5)
  static async canAddGuardian(userId) {
    const result = await db.query(
      `SELECT COUNT(*) FROM guardians 
       WHERE user_id = $1 AND is_active = true`,
      [userId]
    );
    return parseInt(result.rows[0].count) < 5;
  }
}

// Initialize table
Guardian.initTable = async () => {
  try {
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'guardians'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('🔐 Creating guardians table...');
      await db.query(`
        CREATE TABLE guardians (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          email VARCHAR(255),
          phone VARCHAR(50),
          name VARCHAR(255) NOT NULL,
          relationship VARCHAR(100),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE INDEX idx_guardians_user_id ON guardians(user_id);
        CREATE INDEX idx_guardians_email ON guardians(email);
        CREATE INDEX idx_guardians_phone ON guardians(phone);
      `);
      console.log('✅ Guardians table created successfully');
    }
  } catch (error) {
    console.error('❌ Failed to create guardians table:', error);
    throw error;
  }
};

module.exports = Guardian;