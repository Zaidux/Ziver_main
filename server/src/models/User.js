const db = require('../config/db');

const User = {
  // Method to find a user by their email
  findByEmail: async (email) => {
    const query = 'SELECT * FROM users WHERE email = $1';
    const { rows } = await db.query(query, [email]);
    return rows[0];
  },

  // Method to create a new user
  create: async ({ username, email, hashedPassword }) => {
    const query = `
      INSERT INTO users (username, email, password_hash, zp_balance, social_capital_score) 
      VALUES ($1, $2, $3, 0, 0) 
      RETURNING id, username, email, created_at
    `;
    const { rows } = await db.query(query, [username, email, hashedPassword]);
    return rows[0];
  },

  // Method to find a user by their ID
  findById: async (id) => {
    // THE FIX IS HERE: We've added "role" to the list of columns being selected.
    const query = 'SELECT id, username, email, zp_balance, social_capital_score, created_at, role FROM users WHERE id = $1';
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }
};

module.exports = User;