// Import the 'Pool' class from the 'pg' library.
// A connection pool is much more efficient than creating a new client for every request.
const { Pool } = require('pg');

// Load environment variables from our .env file.
require('dotenv').config();

// Create a new Pool instance.
// The Pool will use the DATABASE_URL from our .env file to connect to Supabase.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// We export an object with a 'query' method.
// This allows us to import this file anywhere in our backend and use it to run database queries.
module.exports = {
  query: (text, params) => pool.query(text, params),
};

