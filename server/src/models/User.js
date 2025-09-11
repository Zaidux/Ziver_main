const db = require('../config/db');

const User = {
  findByEmail: async (email) => {
    const query = 'SELECT * FROM users WHERE email = $1';
    const { rows } = await db.query(query, [email]);
    return rows[0];
  },

  create: async ({ username, email, hashedPassword }) => {
    const query = `
      INSERT INTO users (username, email, password_hash, zp_balance, social_capital_score) 
      VALUES ($1, $2, $3, 0, 0) 
      RETURNING id, username, email, created_at
    `;
    const { rows } = await db.query(query, [username, email, hashedPassword]);
    return rows[0];
  },

  findById: async (id) => {
    // CRITICAL: Added mining_session_start_time and last_claim_time
    const query = `
      SELECT id, username, email, zp_balance, social_capital_score, 
             daily_streak_count, mining_session_start_time, last_claim_time, role 
      FROM users WHERE id = $1
    `;
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }
};

module.exports = User;