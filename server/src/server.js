require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const setWebhook = require('./setupTelegramWebhook'); // ADD THIS LINE

// --- IMPORT OUR ROUTE FILES ---
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const miningRoutes = require('./routes/miningRoutes');
const adminRoutes = require('./routes/adminRoutes');
const tasksRoutes = require('./routes/tasksRoutes');
const referralsRoutes = require('./routes/referralsRoutes');
const telegramRoutes = require('./routes/telegramRoutes');

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

// --- Set Telegram Webhook on Startup ---
const initializeApp = async () => {
  // Check database connection
  await checkDbConnection();
  
  // Set Telegram webhook if token is available
  if (process.env.TELEGRAM_BOT_TOKEN) {
    console.log('🤖 Setting up Telegram webhook...');
    await setWebhook();
  } else {
    console.log('⚠️  TELEGRAM_BOT_TOKEN not set, skipping webhook setup');
  }

  // Start server
  app.listen(PORT, () => {
    console.log(`🎉 Server is running on port ${PORT}`);
  });
};

// --- DIAGNOSTIC MIDDLEWARE ---
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

// --- BOT HEALTH CHECK ---
app.get('/api/telegram/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    hasBotToken: !!process.env.TELEGRAM_BOT_TOKEN,
    webhookUrl: process.env.TELEGRAM_WEBHOOK_URL || `${process.env.BASE_URL}/api/telegram/webhook`
  });
});

// --- USE ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/mining', miningRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/referrals', referralsRoutes);
app.use('/api/telegram', telegramRoutes);

// --- CATCH-ALL 404 HANDLER ---
app.use((req, res, next) => {
  res.status(404).json({ message: `API endpoint not found for ${req.method} ${req.originalUrl}` });
});

// --- Start the Server ---
initializeApp();