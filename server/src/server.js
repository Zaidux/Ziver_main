// Load environment variables at the very top
require('dotenv').config();

// Import required packages
const express = require('express');
const cors = require('cors');
const db = require('./config/db');

// --- IMPORT OUR ROUTE FILES ---
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const miningRoutes = require('./routes/miningRoutes'); // <-- IMPORT THIS

// --- App Initialization ---
const app = express();
const PORT = process.env.PORT || 5000;


// --- Middleware ---
app.use(cors());
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


// --- USE ROUTES ---
// Tell Express to use our route files.
// Any request to '/api/auth' will be handled by authRoutes.
// Any request to '/api/user' will be handled by userRoutes.
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/mining', miningRoutes); // <-- ADD THIS LINE


// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`🎉 Server is running on port ${PORT}`);
});
