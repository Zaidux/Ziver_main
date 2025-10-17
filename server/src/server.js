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
const feedbackRoutes = require('./routes/feedbackRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const backgroundCheckerRoutes = require('./routes/backgroundCheckerRoutes');
const announcementRoutes = require('./routes/announcementRoutes');

const TaskValidation = require('./models/TaskValidation');

// Import database check utility
const { checkDatabaseTables, checkTelegramBotConfig } = require('./utils/databaseCheck');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Add this after your middleware but before routes
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist - FIX THE PATH
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory:', uploadsDir);
}

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// More comprehensive feedback debug middleware
app.use('/api/feedback', (req, res, next) => {
  if (req.method === 'POST') {
    console.log('🎯 FEEDBACK SUBMISSION STARTED ==========');
    console.log('📨 Request details:', {
      method: req.method,
      path: req.path,
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length'],
      authorization: req.headers.authorization ? 'Present' : 'Missing'
    });

    // Store the original response methods
    const originalSend = res.send;
    const originalJson = res.json;
    const originalEnd = res.end;

    let responseSent = false;

    // Override response methods to catch all response types
    res.send = function(data) {
      if (!responseSent) {
        console.log('📤 Response sent via res.send():', {
          statusCode: res.statusCode,
          dataLength: data ? (typeof data === 'string' ? data.length : 'object') : 0,
          dataPreview: data ? (typeof data === 'string' ? data.substring(0, 100) : 'object') : 'empty'
        });
        responseSent = true;
      }
      originalSend.apply(this, arguments);
    };

    res.json = function(data) {
      if (!responseSent) {
        console.log('📤 Response sent via res.json():', {
          statusCode: res.statusCode,
          data: data ? JSON.stringify(data).substring(0, 200) : 'empty'
        });
        responseSent = true;
      }
      originalJson.apply(this, arguments);
    };

    res.end = function(data) {
      if (!responseSent) {
        console.log('📤 Response sent via res.end():', {
          statusCode: res.statusCode,
          dataLength: data ? data.length : 0
        });
        responseSent = true;
      }
      originalEnd.apply(this, arguments);
    };

    // Log when the request completes
    res.on('finish', () => {
      console.log('✅ FEEDBACK REQUEST COMPLETED ==========\n');
    });
  }
  next();
});

// Your existing feedback debug middleware
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
app.use('/api/feedback', feedbackRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/background-checker', backgroundCheckerRoutes);
app.use('/api/announcements', announcementRoutes);

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

const initializeFeedbackSystem = async () => {
  try {
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
      const columnsCheck = await db.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'feedback'
      `);

      const existingColumns = columnsCheck.rows.map(row => row.column_name);
      const requiredColumns = ['attachments', 'zp_reward', 'seb_reward', 'admin_notes', 'rewarded_at'];

      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

      if (missingColumns.length > 0) {
        console.log('🔧 Adding missing columns to feedback table:', missingColumns);

        for (const column of missingColumns) {
          try {
            if (column === 'attachments') {
              await db.query(`ALTER TABLE feedback ADD COLUMN attachments JSONB DEFAULT '[]'`);
            } else if (column === 'zp_reward' || column === 'seb_reward') {
              await db.query(`ALTER TABLE feedback ADD COLUMN ${column} INTEGER DEFAULT 0`);
            } else if (column === 'admin_notes') {
              await db.query(`ALTER TABLE feedback ADD COLUMN admin_notes TEXT`);
            } else if (column === 'rewarded_at') {
              await db.query(`ALTER TABLE feedback ADD COLUMN rewarded_at TIMESTAMP`);
            }
            console.log(`✅ Added column: ${column}`);
          } catch (alterError) {
            console.log(`ℹ️ Column ${column} might already exist:`, alterError.message);
          }
        }
      }

      console.log('✅ Feedback table schema is up to date');
    }
  } catch (error) {
    console.error('❌ Failed to initialize feedback system:', error);
  }
};

// Set Telegram Webhook on Startup
const initializeApp = async () => {
  console.log('🔧 Starting application initialization...');

  const dbConnected = await checkDbConnection();

  if (!dbConnected) {
    console.error('❌ Cannot start server without database connection');
    process.exit(1);
  }

  // Database and configuration check - ADDED THIS
  console.log('🔍 Starting system checks...');
  await checkDatabaseTables();
  checkTelegramBotConfig();
  console.log('✅ System checks completed');

  await initializeTaskValidation();
  await initializeSettingsSystem();
  await initializeFeedbackSystem();

  // Import and start background mining checker AFTER database is connected
  const backgroundMiningChecker = require('./services/backgroundMiningChecker');
  backgroundMiningChecker.start();
  console.log('🚀 Background mining checker started');

  if (process.env.TELEGRAM_BOT_TOKEN) {
    console.log('🤖 Setting up Telegram webhook...');
    await setWebhook();
  } else {
    console.log('⚠️  TELEGRAM_BOT_TOKEN not set, skipping webhook setup');
  }

  app.listen(PORT, () => {
    console.log(`🎉 Server is running on port ${PORT}`);
    console.log(`🔗 Available routes:`);
    console.log(`   POST /api/feedback - Submit feedback`);
    console.log(`   GET  /api/background-checker/status - Check background checker status`);
    console.log(`   POST /api/announcements/send - Send Telegram announcements`);
  });
};

// Optional: Add graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT. Shutting down gracefully...');
  const backgroundMiningChecker = require('./services/backgroundMiningChecker');
  backgroundMiningChecker.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM. Shutting down gracefully...');
  const backgroundMiningChecker = require('./services/backgroundMiningChecker');
  backgroundMiningChecker.stop();
  process.exit(0);
});

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