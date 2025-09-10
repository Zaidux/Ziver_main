// Import the 'Pool' class from the 'pg' library.
const { Pool } = require('pg');

// Load environment variables from our .env file.
require('dotenv').config();

// Create a new Pool instance.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// We now export two methods.
module.exports = {
  // The original shorthand for simple, single queries
  query: (text, params) => pool.query(text, params),
  
  // THE FIX: The new method for borrowing a client for transactions or multiple queries
  getClient: () => pool.connect(),
};