const asyncHandler = require('express-async-handler');
const db = require('../config/db');
const axios = require('axios');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = TELEGRAM_BOT_TOKEN ? `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}` : null;

// ==================== FIXED: MESSAGE SENDING ====================
const sendMessage = async (chatId, text, replyMarkup = null) => {
  try {
    if (!TELEGRAM_BOT_TOKEN) {
      console.warn('❌ Telegram Bot Token not configured - message not sent');
      return false;
    }

    const payload = {
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown'
    };

    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }

    const response = await axios.post(`${TELEGRAM_API_URL}/sendMessage`, payload, {
      timeout: 10000
    });
    
    console.log(`✅ Telegram message sent to ${chatId}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending Telegram message:', {
      chatId,
      error: error.response?.data || error.message
    });
    return false;
  }
};

// ==================== FIXED: ANNOUNCEMENT FUNCTIONS ====================
const sendAnnouncement = asyncHandler(async (req, res) => {
  const { message, announcementType, targetUsers } = req.body;
  const adminId = req.user.id;

  if (!message || !announcementType) {
    res.status(400);
    throw new Error('Message and announcement type are required');
  }

  // Validate announcement type
  const validTypes = ['general', 'security', 'update', 'promotion', 'maintenance'];
  if (!validTypes.includes(announcementType)) {
    res.status(400);
    throw new Error('Invalid announcement type');
  }

  try {
    // FIXED: Get all Telegram-connected users with proper query
    let query = `
      SELECT tum.telegram_id, u.username, u.id as user_id
      FROM telegram_user_map tum
      JOIN users u ON tum.user_id = u.id
      WHERE tum.telegram_id IS NOT NULL
    `;

    const queryParams = [];

    // Filter by target if specified
    if (targetUsers === 'active') {
      query += ' AND u.last_activity > NOW() - INTERVAL \'7 days\'';
    } else if (targetUsers === 'mining_enabled') {
      query += ` AND EXISTS (
        SELECT 1 FROM telegram_notifications tn 
        WHERE tn.user_id = u.id AND tn.mining_alerts = true
      )`;
    }

    const usersResult = await db.query(query, queryParams);
    const users = usersResult.rows;

    console.log(`📢 Announcement target: ${users.length} users`);

    if (users.length === 0) {
      return res.json({
        success: true,
        message: 'No Telegram users found to send announcement to',
        sentCount: 0,
        failedCount: 0
      });
    }

    let sentCount = 0;
    let failedCount = 0;
    const failedUsers = [];

    // Format announcement message with type indicator
    const formattedMessage = `📢 *${announcementType.toUpperCase()} ANNOUNCEMENT*\n\n${message}\n\n_— Ziver Team_`;

    // Send message to each user
    for (const user of users) {
      try {
        const success = await sendMessage(user.telegram_id, formattedMessage);
        if (success) {
          sentCount++;
          console.log(`✅ Announcement sent to user: ${user.username} (${user.telegram_id})`);
        } else {
          failedCount++;
          failedUsers.push({
            username: user.username,
            telegramId: user.telegram_id,
            error: 'Failed to send message'
          });
          console.error(`❌ Failed to send to ${user.username}`);
        }
      } catch (error) {
        failedCount++;
        failedUsers.push({
          username: user.username,
          telegramId: user.telegram_id,
          error: error.message
        });
        console.error(`❌ Failed to send to ${user.username}:`, error.message);
      }

      // Small delay to avoid hitting Telegram rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Log the announcement in database - FIXED table name
    try {
      await db.query(
        `INSERT INTO telegram_announcements 
         (admin_id, message, announcement_type, target_users, sent_count, failed_count, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [adminId, message, announcementType, targetUsers || 'all', sentCount, failedCount]
      );
    } catch (dbError) {
      console.error('❌ Error logging announcement:', dbError);
      // Continue even if logging fails
    }

    res.json({
      success: true,
      message: `Announcement sent to ${sentCount} users`,
      stats: {
        totalUsers: users.length,
        sentCount,
        failedCount,
        failedUsers: failedCount > 0 ? failedUsers : undefined
      }
    });

  } catch (error) {
    console.error('❌ Error sending announcement:', error);
    res.status(500);
    throw new Error('Failed to send announcement: ' + error.message);
  }
});

// ==================== FIXED: TELEGRAM STATS ====================
const getTelegramStats = asyncHandler(async (req, res) => {
  try {
    const statsResult = await db.query(`
      SELECT 
        COUNT(DISTINCT tum.user_id) as total_users,
        COUNT(CASE WHEN tn.system_updates = true THEN 1 END) as system_updates_enabled,
        COUNT(CASE WHEN tn.mining_alerts = true THEN 1 END) as mining_alerts_enabled,
        COUNT(CASE WHEN tn.referral_alerts = true THEN 1 END) as referral_alerts_enabled,
        COUNT(CASE WHEN u.last_activity > NOW() - INTERVAL '7 days' THEN 1 END) as active_users
      FROM telegram_user_map tum
      JOIN users u ON tum.user_id = u.id
      LEFT JOIN telegram_notifications tn ON tum.user_id = tn.user_id
    `);

    const recentAnnouncementsResult = await db.query(`
      SELECT COUNT(*) as recent_count
      FROM telegram_announcements 
      WHERE created_at > NOW() - INTERVAL '7 days'
    `);

    const stats = statsResult.rows[0];
    stats.recent_announcements = parseInt(recentAnnouncementsResult.rows[0]?.recent_count || 0);

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('❌ Error fetching Telegram stats:', error);
    res.status(500);
    throw new Error('Failed to fetch Telegram statistics');
  }
});

// ==================== FIXED: MINING NOTIFICATION ====================
const sendMiningNotification = async (userId, reward) => {
  try {
    if (!TELEGRAM_BOT_TOKEN) {
      console.warn('❌ Telegram Bot Token not configured - mining notification not sent');
      return false;
    }

    const result = await db.query(
      `SELECT tum.telegram_id, tn.mining_alerts 
       FROM telegram_user_map tum
       LEFT JOIN telegram_notifications tn ON tum.user_id = tn.user_id
       WHERE tum.user_id = $1 AND (tn.mining_alerts IS NULL OR tn.mining_alerts = true)`,
      [userId]
    );

    if (result.rows.length === 0) {
      console.log(`⏭️ No Telegram connection or mining alerts disabled for user: ${userId}`);
      return false;
    }

    const telegramId = result.rows[0].telegram_id;
    const message = `⛏️ *Mining Complete!*\n\nYour mining session is ready to claim!\n\n` +
                   `💎 Available reward: *${reward} ZP*\n` +
                   `🚀 Open the Ziver app to claim your reward!`;

    const success = await sendMessage(telegramId, message);

    if (success) {
      console.log(`✅ Mining ready-to-claim notification sent to Telegram user: ${telegramId}`);
      
      // Update notification timestamp
      await db.query(
        'UPDATE users SET last_notification_sent = NOW() WHERE id = $1',
        [userId]
      );
    }

    return success;

  } catch (error) {
    console.error('❌ Error sending mining notification:', error);
    return false;
  }
};

// ==================== FIXED: REFERRAL NOTIFICATION ====================
const sendReferralNotification = async (referrerId, newUserUsername) => {
  try {
    if (!TELEGRAM_BOT_TOKEN) {
      console.warn('❌ Telegram Bot Token not configured - referral notification not sent');
      return false;
    }

    const result = await db.query(
      `SELECT tum.telegram_id, tn.referral_alerts 
       FROM telegram_user_map tum
       LEFT JOIN telegram_notifications tn ON tum.user_id = tn.user_id
       WHERE tum.user_id = $1 AND (tn.referral_alerts IS NULL OR tn.referral_alerts = true)`,
      [referrerId]
    );

    if (result.rows.length === 0) {
      return false;
    }

    const telegramId = result.rows[0].telegram_id;
    const message = `🎉 *New Referral!*\n\n@${newUserUsername} just joined Ziver using your referral link!\n\n` +
                   `💎 You earned *150 ZP* referral bonus!\n` +
                   `👥 Keep sharing your link to earn more!`;

    const success = await sendMessage(telegramId, message);

    if (success) {
      console.log(`✅ Referral notification sent to Telegram user: ${telegramId}`);
    }

    return success;

  } catch (error) {
    console.error('❌ Error sending referral notification:', error);
    return false;
  }
};

// ==================== KEEP YOUR EXISTING FUNCTIONS BELOW ====================

// Get help message
const getHelpMessage = () => {
  return `🤖 *Ziver Bot Help*\n\n` +
         `Available commands:\n` +
         `/start - Start using the bot\n` +
         `/connect - Connect your Telegram to Ziver app\n` +
         `/referral - Get your referral code and link\n` +
         `/status - Check your connection status\n` +
         `/help - Show this help message\n\n` +
         `💡 *Benefits of connecting:*\n` +
         `• Get notified when friends join using your referral\n` +
         `• Receive mining completion alerts\n` +
         `• Stay updated with important announcements\n` +
         `• Easy referral sharing`;
};

// Handle callback queries from inline buttons
const handleCallbackQuery = async (callbackQuery) => {
  const { id, data, message, from } = callbackQuery;

  try {
    // Answer the callback query (removes loading state)
    await axios.post(`${TELEGRAM_API_URL}/answerCallbackQuery`, {
      callback_query_id: id
    });

    // Handle different callback data
    if (data === 'get_referral') {
      await handleReferralCommand(message.chat.id, from);
    } else if (data === 'copy_referral_code') {
      // Get user's referral code
      const userMap = await db.query(
        `SELECT u.referral_code FROM telegram_user_map tum
         JOIN users u ON tum.user_id = u.id
         WHERE tum.telegram_id = $1`,
        [from.id]
      );

      if (userMap.rows.length > 0) {
        const referralCode = userMap.rows[0].referral_code;
        await sendMessage(message.chat.id, `Your referral code: \`${referralCode}\`\n\nYou can copy this code and share it with friends.`);
      }
    }
  } catch (error) {
    console.error('Error handling callback query:', error);
  }
};

// Handle /status command
const handleStatusCommand = async (chatId, from) => {
  const telegramId = from.id;

  try {
    const connection = await db.query(
      `SELECT tum.*, u.username, u.zp_balance, tum.connected_at as connected_at
       FROM telegram_user_map tum 
       JOIN users u ON tum.user_id = u.id 
       WHERE tum.telegram_id = $1`,
      [telegramId]
    );

    if (connection.rows.length > 0) {
      const user = connection.rows[0];
      const statusMessage = `✅ *Account Connected*\n\n` +
                           `👤 Ziver Username: @${user.username}\n` +
                           `💎 ZP Balance: ${user.zp_balance}\n` +
                           `🔗 Connected: ${new Date(user.connected_at).toLocaleDateString()}\n\n` +
                           `You will receive notifications for:\n` +
                           `• New referral registrations\n` +
                           `• Mining session completions\n` +
                           `• Important system updates`;

      await sendMessage(chatId, statusMessage);
    } else {
      await sendMessage(chatId, `❌ *No Ziver Account Connected*\n\nUse /connect to link your Telegram account to Ziver and receive notifications.`);
    }
  } catch (error) {
    console.error('Error checking status:', error);
    await sendMessage(chatId, '❌ Error checking connection status.');
  }
};

// Handle /referral command
const handleReferralCommand = async (chatId, from) => {
  const telegramId = from.id;

  try {
    // Check if user has a Ziver account connected
    const userMap = await db.query(
      `SELECT u.* FROM telegram_user_map tum
       JOIN users u ON tum.user_id = u.id
       WHERE tum.telegram_id = $1`,
      [telegramId]
    );

    if (userMap.rows.length > 0) {
      const user = userMap.rows[0];
      const referralLink = `https://t.me/${process.env.TELEGRAM_BOT_USERNAME || 'ZiverOfficialBot'}?start=${user.referral_code}`;

      const message = `📣 *Your Referral Information*\n\n` +
                     `🎯 Your Code: *${user.referral_code}*\n` +
                     `👥 Total Referrals: *${user.referral_count || 0}*\n` +
                     `💎 Referral Earnings: *${user.referral_earnings || 0} ZP*\n\n` +
                     `Share this link with friends:\n\`${referralLink}\``;

      await sendMessage(chatId, message);

      // Create inline keyboard for easy sharing
      const keyboard = {
        inline_keyboard: [
          [
            {
              text: "📤 Share Referral Link",
              url: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Join me on Ziver and earn ZP tokens! Use my referral code for bonus rewards.')}`
            }
          ],
          [
            {
              text: "🎯 Copy Referral Code",
              callback_data: "copy_referral_code"
            }
          ]
        ]
      };

      await sendMessage(chatId, "Quick actions:", keyboard);
    } else {
      await sendMessage(chatId, "❌ You need to connect your Ziver account first.\n\nUse /connect to link your account and get your referral code.");
    }
  } catch (error) {
    console.error('Error handling referral command:', error);
    await sendMessage(chatId, '❌ Error fetching referral information.');
  }
};

// Handle /start command with referral parameter - UPDATED
const handleStartCommand = async (chatId, from, text) => {
  const telegramId = from.id;
  const username = from.username || `user_${telegramId}`;
  const firstName = from.first_name || '';

  // Extract referral code from /start command (e.g., /start REF123)
  const referralCode = text.split(' ')[1] || null;

  if (referralCode) {
    try {
      // Get referrer info from the referral code
      const referrerResult = await db.query(
        'SELECT id, username FROM users WHERE referral_code = $1',
        [referralCode]
      );

      let referrerUsername = 'Unknown User';
      let referrerId = null;

      if (referrerResult.rows.length > 0) {
        referrerUsername = referrerResult.rows[0].username;
        referrerId = referrerResult.rows[0].id;
      }

      // Create pending referral with safe referrer_id handling
      await db.query(
        `INSERT INTO pending_referrals 
         (referral_code, referrer_username, referrer_id, telegram_id, created_at) 
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (referral_code) 
         DO UPDATE SET 
           referrer_username = EXCLUDED.referrer_username,
           referrer_id = EXCLUDED.referrer_id,
           telegram_id = EXCLUDED.telegram_id,
           updated_at = NOW()`,
        [referralCode, referrerUsername, referrerId, telegramId]
      );

      console.log(`Telegram user ${username} came from referral: ${referralCode} (Referrer: ${referrerUsername})`);

      // Send welcome message with referrer info
      const welcomeMessage = `👋 Welcome to Ziver, ${firstName}!\n\n` +
                            `🎁 *You were referred by: ${referrerUsername}*\n` +
                            `💎 When you register, you'll receive *100 ZP bonus!*\n\n` +
                            `Click the link below to register and claim your bonus:\n` +
                            `${process.env.FRONTEND_URL || 'https://ziver-main.onrender.com'}/register?ref=${referralCode}\n\n` +
                            `The referrer's name will be shown during registration.`;

      await sendMessage(chatId, welcomeMessage);

    } catch (error) {
      console.error('Error handling referral:', error);
      await sendMessage(chatId, '👋 Welcome to Ziver! There was an issue processing your referral. Please try registering directly.');
    }
  } else {
    // Regular start without referral
    const welcomeMessage = `👋 Welcome to Ziver, ${firstName}!\n\n` +
                          `I'm the Ziver bot. I can help you:\n` +
                          `• Get your referral code to share with friends\n` +
                          `• Check your ZP balance\n` +
                          `• Link your Telegram account to your Ziver app\n\n` +
                          `Use /help to see all available commands.`;

    await sendMessage(chatId, welcomeMessage);
  }
};

// Handle /connect command to link Telegram account to app - UPDATED
const handleConnectCommand = async (chatId, from, text) => {
  const telegramId = from.id;
  const username = from.username || `user_${telegramId}`;

  try {
    // Check if the user is already connected
    const existingConnection = await db.query(
      `SELECT tum.*, u.username 
       FROM telegram_user_map tum 
       JOIN users u ON tum.user_id = u.id 
       WHERE tum.telegram_id = $1`,
      [telegramId]
    );

    if (existingConnection.rows.length > 0) {
      const user = existingConnection.rows[0];
      await sendMessage(chatId, `✅ Your Telegram account is already connected to Ziver account: @${user.username}\n\nUse /status to check your connection details.`);
      return;
    }

    // Generate a unique connection code (6-digit number)
    const connectionCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store the connection code in the session
    await db.query(
      `INSERT INTO telegram_sessions (chat_id, state, data, expires_at) 
       VALUES ($1, 'awaiting_connection', $2, $3)
       ON CONFLICT (chat_id) 
       DO UPDATE SET state = 'awaiting_connection', data = $2, expires_at = $3, updated_at = NOW()`,
      [chatId, JSON.stringify({ 
        connectionCode, 
        telegramId: from.id,
        telegramUsername: username,
        firstName: from.first_name,
        lastName: from.last_name
      }), expiresAt]
    );

    const connectMessage = `🔗 *Connect Your Telegram Account to Ziver*\n\n` +
                          `To connect your Telegram account:\n\n` +
                          `1. Go to your Ziver app → Referrals page\n` +
                          `2. Find the "Telegram Connection" section\n` +
                          `3. Click "Generate Connection Code"\n` +
                          `4. Enter this code: \n\n` +
                          `🎯 *${connectionCode}*\n\n` +
                          `📍 *This code expires in 10 minutes*\n` +
                          `📍 *One-time use only*`;

    await sendMessage(chatId, connectMessage);

  } catch (error) {
    console.error('Error in connect command:', error);
    await sendMessage(chatId, '❌ Error generating connection code. Please try again.');
  }
};

// Telegram webhook handler - MAIN ENTRY POINT
const handleTelegramWebhook = asyncHandler(async (req, res) => {
  try {
    const { message, callback_query } = req.body;

    // Handle callback queries (button presses)
    if (callback_query) {
      await handleCallbackQuery(callback_query);
      return res.status(200).send('OK');
    }

    // Handle regular messages
    if (message) {
      const chatId = message.chat.id;
      const text = message.text || '';
      const from = message.from;

      // Handle /start command with referral parameter
      if (text.startsWith('/start')) {
        await handleStartCommand(chatId, from, text);
      } 
      // Handle /connect command to link Telegram account to app
      else if (text.startsWith('/connect')) {
        await handleConnectCommand(chatId, from, text);
      }
      // Handle /help command
      else if (text.startsWith('/help')) {
        await sendMessage(chatId, getHelpMessage());
      }
      // Handle /referral command to get user's referral code
      else if (text.startsWith('/referral')) {
        await handleReferralCommand(chatId, from);
      }
      // Handle /status command to check connection status
      else if (text.startsWith('/status')) {
        await handleStatusCommand(chatId, from);
      }
      // Handle any other message
      else {
        await sendMessage(chatId, "I don't understand that command. Type /help to see available commands.");
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Telegram webhook error:', error);
    res.status(200).send('OK'); // Always respond OK to Telegram
  }
});

// Set webhook for your Telegram bot
const setWebhook = asyncHandler(async (req, res) => {
  try {
    const { webhookUrl } = req.body;
    const url = webhookUrl || process.env.TELEGRAM_WEBHOOK_URL || `${process.env.BASE_URL}/api/telegram/webhook`;

    const response = await axios.post(`${TELEGRAM_API_URL}/setWebhook`, {
      url: url,
      drop_pending_updates: true,
      allowed_updates: ['message', 'callback_query']
    });

    res.json({ 
      success: true, 
      message: 'Webhook set successfully',
      data: response.data,
      webhookUrl: url
    });
  } catch (error) {
    console.error('Error setting webhook:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to set webhook',
      error: error.response?.data || error.message 
    });
  }
});

// Generate connection code for the app
const generateConnectionCode = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;

    // Generate 6-digit code
    const connectionCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store in database with user ID
    await db.query(
      `INSERT INTO telegram_connection_codes (user_id, connection_code, expires_at) 
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) 
       DO UPDATE SET connection_code = $2, expires_at = $3, created_at = NOW()`,
      [userId, connectionCode, expiresAt]
    );

    res.json({
      success: true,
      connectionCode,
      expiresAt,
      message: 'Connection code generated. Use /connect in Telegram bot within 10 minutes.'
    });
  } catch (error) {
    console.error('Error generating connection code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate connection code'
    });
  }
});

// Verify connection code from the app - FIXED
const verifyConnectionCode = asyncHandler(async (req, res) => {
  const { connectionCode } = req.body;
  const userId = req.user.id;

  try {
    // Find session with this connection code
    const sessionResult = await db.query(
      `SELECT * FROM telegram_sessions 
       WHERE data->>'connectionCode' = $1 
       AND state = 'awaiting_connection'
       AND expires_at > NOW()`,
      [connectionCode]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Invalid or expired connection code' 
      });
    }

    const session = sessionResult.rows[0];
    const sessionData = session.data;
    const telegramId = sessionData.telegramId;
    const chatId = session.chat_id;

    // Check if Telegram ID is already connected to another account
    const existingConnection = await db.query(
      'SELECT * FROM telegram_user_map WHERE telegram_id = $1 AND user_id != $2',
      [telegramId, userId]
    );

    if (existingConnection.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'This Telegram account is already connected to another user'
      });
    }

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // Create or update the connection between Telegram and user
      await client.query(
        `INSERT INTO telegram_user_map (telegram_id, user_id) 
         VALUES ($1, $2)
         ON CONFLICT (telegram_id) 
         DO UPDATE SET user_id = $2`,
        [telegramId, userId]
      );

      // Initialize notification settings
      await client.query(
        `INSERT INTO telegram_notifications (user_id) 
         VALUES ($1)
         ON CONFLICT (user_id) DO NOTHING`,
        [userId]
      );

      // Update user's telegram connection status - FIXED: removed telegram_username
      await client.query(
        'UPDATE users SET telegram_connected = true WHERE id = $1',
        [userId]
      );

      // Clear the session
      await client.query(
        'UPDATE telegram_sessions SET state = $1, updated_at = NOW() WHERE chat_id = $2',
        ['connected', chatId]
      );

      await client.query('COMMIT');

      // Send confirmation message to Telegram
      const userResult = await db.query('SELECT username FROM users WHERE id = $1', [userId]);
      const username = userResult.rows[0]?.username || 'User';

      await sendMessage(chatId, 
        `✅ *Telegram Account Connected Successfully!*\n\n` +
        `Your Telegram account is now connected to Ziver account: *@${username}*\n\n` +
        `You will now receive notifications for:\n` +
        `• New referral registrations\n` +
        `• Mining session completions\n` +
        `• Important system updates\n\n` +
        `Use /status to check your connection details.`
      );

      res.json({ 
        success: true, 
        message: 'Telegram account connected successfully',
        telegramId: telegramId,
        telegramUsername: sessionData.telegramUsername
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error verifying connection code:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error connecting Telegram account' 
    });
  }
});

// Get connection status - FIXED
const getConnectionStatus = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT tum.telegram_id, tum.connected_at as connected_at,
              u.username, tn.referral_alerts, tn.mining_alerts, tn.system_updates
       FROM telegram_user_map tum
       LEFT JOIN users u ON tum.user_id = u.id
       LEFT JOIN telegram_notifications tn ON tum.user_id = tn.user_id
       WHERE tum.user_id = $1`,
      [userId]
    );

    if (result.rows.length > 0) {
      const connection = result.rows[0];
      res.json({
        hasTelegram: true,
        telegramId: connection.telegram_id,
        telegramUsername: connection.username,
        connectedAt: connection.connected_at,
        notifications: {
          referralAlerts: connection.referral_alerts,
          miningAlerts: connection.mining_alerts,
          systemUpdates: connection.system_updates
        }
      });
    } else {
      res.json({
        hasTelegram: false,
        telegramId: null,
        telegramUsername: null,
        connectedAt: null,
        notifications: null
      });
    }
  } catch (error) {
    console.error('Error getting connection status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get connection status'
    });
  }
});

// Disconnect Telegram - FIXED
const disconnectTelegram = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // Get telegram info before disconnecting
      const telegramInfo = await client.query(
        'SELECT telegram_id FROM telegram_user_map WHERE user_id = $1',
        [userId]
      );

      // Remove connection
      await client.query('DELETE FROM telegram_user_map WHERE user_id = $1', [userId]);

      // Update user's telegram status - FIXED: removed telegram_username
      await client.query(
        'UPDATE users SET telegram_connected = false WHERE id = $1',
        [userId]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Telegram account disconnected successfully'
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error disconnecting Telegram:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect Telegram account'
    });
  }
});

// Update notification settings
const updateNotificationSettings = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { referralAlerts, miningAlerts, systemUpdates } = req.body;

    await db.query(
      `INSERT INTO telegram_notifications (user_id, referral_alerts, mining_alerts, system_updates) 
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         referral_alerts = $2,
         mining_alerts = $3,
         system_updates = $4,
         updated_at = NOW()`,
      [userId, referralAlerts, miningAlerts, systemUpdates]
    );

    res.json({
      success: true,
      message: 'Notification settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification settings'
    });
  }
});

// Send notification when reward is claimed (optional)
const sendMiningClaimedNotification = async (userId, reward) => {
  try {
    const result = await db.query(
      `SELECT tum.telegram_id, tn.mining_alerts 
       FROM telegram_user_map tum
       JOIN telegram_notifications tn ON tum.user_id = tn.user_id
       WHERE tum.user_id = $1 AND tn.mining_alerts = true`,
      [userId]
    );

    if (result.rows.length === 0) {
      return;
    }

    const telegramId = result.rows[0].telegram_id;
    const message = `💰 *Reward Claimed!*\n\nYou successfully claimed your mining reward!\n\n` +
                   `💎 Claimed amount: *${reward} ZP*\n` +
                   `⛏️ Start a new mining session to earn more!`;

    await sendMessage(telegramId, message);

    console.log(`Mining claimed notification sent to Telegram user: ${telegramId}`);
  } catch (error) {
    console.error('Error sending mining claimed notification:', error);
  }
};

// Debug endpoint to manually set webhook
const setWebhookManual = asyncHandler(async (req, res) => {
  try {
    const { webhookUrl } = req.body;
    const url = webhookUrl || process.env.TELEGRAM_WEBHOOK_URL || `${process.env.BASE_URL}/api/telegram/webhook`;

    const response = await axios.post(`${TELEGRAM_API_URL}/setWebhook`, {
      url: url,
      drop_pending_updates: true
    });

    res.json({ 
      success: true, 
      message: 'Webhook set successfully',
      data: response.data,
      webhookUrl: url
    });
  } catch (error) {
    console.error('Error setting webhook:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to set webhook',
      error: error.response?.data || error.message 
    });
  }
});

// Get webhook info
const getWebhookInfo = asyncHandler(async (req, res) => {
  try {
    const response = await axios.get(`${TELEGRAM_API_URL}/getWebhookInfo`);
    res.json({ 
      success: true, 
      data: response.data 
    });
  } catch (error) {
    console.error('Error getting webhook info:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get webhook info',
      error: error.response?.data || error.message 
    });
  }
});

// Send test message
const sendTestMessage = asyncHandler(async (req, res) => {
  try {
    const { chatId, text } = req.body;

    const response = await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
      chat_id: chatId,
      text: text || 'Test message from Ziver bot',
      parse_mode: 'Markdown'
    });

    res.json({ 
      success: true, 
      message: 'Test message sent',
      data: response.data 
    });
  } catch (error) {
    console.error('Error sending test message:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send test message',
      error: error.response?.data || error.message 
    });
  }
});

// ==================== EXPORT ALL FUNCTIONS ====================
module.exports = {
  // Announcement functions
  sendAnnouncement,
  getTelegramStats,
  
  // Core message functions
  sendMessage,
  sendReferralNotification,
  sendMiningNotification,
  sendMiningClaimedNotification,
  
  // Bot management
  setWebhook,
  handleTelegramWebhook,
  setWebhookManual,
  getWebhookInfo,
  sendTestMessage,
  
  // User connection management
  generateConnectionCode,
  verifyConnectionCode,
  getConnectionStatus,
  disconnectTelegram,
  updateNotificationSettings
};