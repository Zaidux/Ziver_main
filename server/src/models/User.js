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
    const query = `
      SELECT id, username, email, zp_balance, social_capital_score, 
             daily_streak_count, mining_session_start_time, last_claim_time, role,
             avatar_url, bio, telegram_username, twitter_username, linkedin_url,
             profile_updated_at
      FROM users WHERE id = $1
    `;
    const { rows } = await db.query(query, [id]);
    return rows[0];
  },

  // NEW: Update user profile
  updateProfile: async (userId, profileData) => {
    const {
      avatar_url,
      bio,
      telegram_username,
      twitter_username,
      linkedin_url
    } = profileData;

    const query = `
      UPDATE users 
      SET avatar_url = $1, 
          bio = $2, 
          telegram_username = $3, 
          twitter_username = $4, 
          linkedin_url = $5,
          profile_updated_at = NOW()
      WHERE id = $6
      RETURNING id, username, email, avatar_url, bio, telegram_username, 
                twitter_username, linkedin_url, profile_updated_at
    `;
    
    const { rows } = await db.query(query, [
      avatar_url, bio, telegram_username, twitter_username, linkedin_url, userId
    ]);
    return rows[0];
  },

  // NEW: Find by Telegram username
  findByTelegramUsername: async (telegramUsername) => {
    const query = 'SELECT * FROM users WHERE telegram_username = $1';
    const { rows } = await db.query(query, [telegramUsername]);
    return rows[0];
  }
};

module.exports = User;