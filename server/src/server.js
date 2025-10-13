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
const systemStatusRoutes = require('./routes/systemStatusRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes'); // ADDED: Feedback routes

const TaskValidation = require('./models/TaskValidation');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Add this after your existing middleware but before routes
app.use((req, res, next) => {
  if (req.path === '/api/feedback' && req.method === 'POST') {
    console.log('📥 Feedback request received:', {
      method: req.method,
      path: req.path,
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length'],
      hasFiles: !!req.files,
      filesCount: req.files ? req.files.length : 0,
      bodyFields: Object.keys(req.body)
    });
  }
  next();
});

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
app.use('/api/system', systemStatusRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/feedback', feedbackRoutes); // ADDED: Mount feedback routes

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

// Initialize settings system (create tables if needed)
const initializeSettingsSystem = async () => {
  try {
    // Check if user_preferences table exists, create if not
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'user_preferences'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('📊 Creating user_preferences table...');
      await db.query(`
        CREATE TABLE user_preferences (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          preference_key VARCHAR(100) NOT NULL,
          preference_value TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(user_id, preference_key)
        );
        
        CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
        
        -- Add two_factor fields to users table if not exists
        DO $$ 
        BEGIN 
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name='users' AND column_name='two_factor_enabled') THEN
            ALTER TABLE users 
            ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE,
            ADD COLUMN two_factor_secret VARCHAR(100),
            ADD COLUMN last_password_change TIMESTAMP DEFAULT NOW();
          END IF;
        END $$;
      `);
      console.log('✅ Settings system tables created successfully');
    } else {
      console.log('✅ Settings system tables already exist');
    }
  } catch (error) {
    console.error('❌ Failed to initialize settings system:', error);
  }
};

// Add this to your initializeSettingsSystem function in server.js
const initializeFeedbackSystem = async () => {
  try {
    // Check if feedback table exists, create if not
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'feedback'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('📝 Creating feedback table...');
      await db.query(`
        CREATE TABLE feedback (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          type VARCHAR(50) DEFAULT 'suggestion',
          priority VARCHAR(20) DEFAULT 'medium',
          status VARCHAR(20) DEFAULT 'pending',
          attachments JSONB DEFAULT '[]',
          zp_reward INTEGER DEFAULT 0,
          seb_reward INTEGER DEFAULT 0,
          admin_notes TEXT,
          rewarded_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE INDEX idx_feedback_user_id ON feedback(user_id);
        CREATE INDEX idx_feedback_status ON feedback(status);
        CREATE INDEX idx_feedback_created_at ON feedback(created_at DESC);
      `);
      console.log('✅ Feedback table created successfully');
    } else {
      console.log('✅ Feedback table already exists');
    }
  } catch (error) {
    console.error('❌ Failed to initialize feedback system:', error);
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

  // Initialize settings system
  await initializeSettingsSystem();

  // ADDED: Initialize feedback system
  await initializeFeedbackSystem();

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
    console.log(`🔗 Available routes:`);
    console.log(`   GET  /api/auth/google/callback - Google OAuth callback`);
    console.log(`   POST /api/auth/google - Google OAuth direct`);
    console.log(`   POST /api/auth/register - User registration`);
    console.log(`   POST /api/auth/login - User login`);
    console.log(`   PUT  /api/settings/security/password - Change password`); // NEW
    console.log(`   POST /api/settings/security/two-factor - Toggle 2FA`); // NEW
    console.log(`   PUT  /api/settings/appearance/theme - Update theme`); // NEW
    console.log(`   PUT  /api/settings/notifications - Update notifications`); // NEW
  });
};

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