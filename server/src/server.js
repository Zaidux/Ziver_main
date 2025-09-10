// Load environment variables at the very top
require('dotenv').config();

// Import required packages
const express = require('express');
const cors = require('cors');
const db = require('./config/db');

// --- IMPORT OUR ROUTE FILES ---
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const miningRoutes = require('./routes/miningRoutes');
const adminRoutes = require('./routes/adminRoutes');

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

// --- NEW: DIAGNOSTIC MIDDLEWARE ---
// This will log every single request that hits your server to the console.
app.use((req, res, next) => {
  console.log(`[LOG] Incoming Request: ${req.method} ${req.originalUrl}`);
  next();
});


// --- HEALTH CHECK ROUTE ---
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Ziver API is running successfully.' 
  });
});


// --- USE ROUTES ---
// Tell Express to use our route files.
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/mining', miningRoutes);
app.use('/api/admin', adminRoutes);


// --- NEW: CATCH-ALL 404 HANDLER ---
// This will catch any request that doesn't match a route and send a clean 404 response.
app.use((req, res, next) => {
  res.status(404).json({ message: `API endpoint not found for ${req.method} ${req.originalUrl}` });
});


// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`🎉 Server is running on port ${PORT}`);
});
