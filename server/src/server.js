// Load environment variables at the very top
require('dotenv').config();

// Import required packages
const express = require('express');
const cors = require('cors');
const db = require('./config/db'); // Import our database configuration

// --- App Initialization ---
const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
// Enable Cross-Origin Resource Sharing (CORS) so our React frontend can talk to the backend
app.use(cors());

// Enable the express.json() middleware to parse JSON-formatted request bodies
app.use(express.json());


// --- Test Database Connection ---
const checkDbConnection = async () => {
  try {
    const client = await db.query('SELECT NOW()');
    console.log('✅ Database connected successfully at:', client.rows[0].now);
  } catch (error) {
    console.error('❌ Error connecting to the database:', error);
  }
};

checkDbConnection();


// --- Routes ---
// A simple "health check" route to confirm the server is running
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Ziver API! 🚀',
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});


// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`🎉 Server is running on port ${PORT}`);
});

