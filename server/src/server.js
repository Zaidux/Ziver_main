require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const setWebhook = require('./setupTelegramWebhook');

// Import route files
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const miningRoutes = require('./routes/miningRoutes');
const adminRoutes = require('./routes/adminRoutes');
const tasksRoutes = require('./routes/tasksRoutes');
const referralsRoutes = require('./routes/referralsRoutes');
const telegramRoutes = require('./routes/telegramRoutes');
const systemStatusRoutes = require('./routes/systemStatusRoutes'); // NEW IMPORT
const TaskValidation = require('./models/TaskValidation');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test Database Connection
const checkDbConnection = async () => {
  try {
    const client = await db.query('SELECT NOW()');
    console.log('✅ Database connected successfully at:', client.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Error connecting to the database:', error);
    return false;
  }
};

// Initialize task validation system
const initializeTaskValidation = async () => {
  try {
    await TaskValidation.initializeTable();
    await TaskValidation.seedDefaultRules();
    console.log('✅ Task validation system initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize task validation system:', error);
  }
};

// Set Telegram Webhook on Startup
const initializeApp = async () => {
  console.log('🔧 Starting application initialization...');
  
  // First, check database connection
  const dbConnected = await checkDbConnection();
  
  if (!dbConnected) {
    console.error('❌ Cannot start server without database connection');
    process.exit(1);
  }

  // Initialize task validation system AFTER database is confirmed connected
  await initializeTaskValidation();

  // Set up Telegram webhook if bot token exists
  if (process.env.TELEGRAM_BOT_TOKEN) {
    console.log('🤖 Setting up Telegram webhook...');
    await setWebhook();
  } else {
    console.log('⚠️  TELEGRAM_BOT_TOKEN not set, skipping webhook setup');
  }

  // Start the server
  app.listen(PORT, () => {
    console.log(`🎉 Server is running on port ${PORT}`);
  });
};

// Diagnostic Middleware
app.use((req, res, next) => {
  console.log(`[LOG] Incoming Request: ${req.method} ${req.originalUrl}`);
  next();
});

// Health Check Route
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Ziver API is running successfully.' 
  });
});

// Bot Health Check
app.get('/api/telegram/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    hasBotToken: !!process.env.TELEGRAM_BOT_TOKEN,
    webhookUrl: process.env.TELEGRAM_WEBHOOK_URL || `${process.env.BASE_URL}/api/telegram/webhook`
  });
});

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/mining', miningRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/referrals', referralsRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/system', systemStatusRoutes); // NEW ROUTE

// Catch-all 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ message: `API endpoint not found for ${req.method} ${req.originalUrl}` });
});

// Global Error Handler
app.use((error, req, res, next) => {
  console.error('🚨 Global Error Handler:', error);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start the Server
initializeApp().catch(error => {
  console.error('💥 Failed to start server:', error);
  process.exit(1);
});