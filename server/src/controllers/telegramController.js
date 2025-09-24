const asyncHandler = require('express-async-handler');
const db = require('../config/db');
const axios = require('axios');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

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
  
  // Validate that referrerId is a valid integer (not UUID)
  if (referrerId && !Number.isInteger(referrerId)) {
    console.log('Invalid referrer ID format, setting to null:', referrerId);
    referrerId = null;
  }
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

      // Create pending referral
      await db.query(
        `INSERT INTO pending_referrals 
         (referral_code, referrer_username, referrer_id, telegram_id, created_at) 
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (referral_code) 
         DO UPDATE SET updated_at = NOW()`,
        [referralCode, referrerUsername, referrerId, telegramId]
      );

      console.log(`Telegram user ${username} came from referral: ${referralCode} (Referrer: ${referrerUsername})`);

      // Send welcome message with referrer info
      const welcomeMessage = `👋 Welcome to Ziver, ${firstName}!\n\n` +
                            `🎁 *You were referred by: ${referrerUsername}*\n` +
                            `💎 When you register, you'll receive *100 ZP bonus!*\n\n` +
                            `Click the link below to register and claim your bonus:\n` +
                            `${process.env.FRONTEND_URL || 'https://ziver-main.onrender.com'}?ref=${referralCode}\n\n` +
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

// Handle /connect command to link Telegram account to app
const handleConnectCommand = async (chatId, from, text) => {
  const telegramId = from.id;

  // Check if the user is already connected
  const existingConnection = await db.query(
    'SELECT * FROM telegram_user_map WHERE telegram_id = $1',
    [telegramId]
  );

  if (existingConnection.rows.length > 0) {
    await sendMessage(chatId, "Your Telegram account is already connected to a Ziver account.");
    return;
  }

  // Generate a unique connection code (6-digit number)
  const connectionCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Store the connection code in the session
  await db.query(
    `INSERT INTO telegram_sessions (chat_id, state, data) 
     VALUES ($1, 'awaiting_connection', $2)
     ON CONFLICT (chat_id) 
     DO UPDATE SET state = 'awaiting_connection', data = $2, updated_at = NOW()`,
    [chatId, JSON.stringify({ connectionCode, telegramId: from.id })]
  );

  const connectMessage = `To connect your Telegram account to Ziver:\n\n` +
                        `1. Go to your Ziver app profile settings\n` +
                        `2. Find the "Connect Telegram" option\n` +
                        `3. Enter this code: **${connectionCode}**\n\n` +
                        `This code will expire in 10 minutes.`;

  await sendMessage(chatId, connectMessage);
};

// Handle /referral command
const handleReferralCommand = async (chatId, from) => {
  const telegramId = from.id;

  // Check if user has a Ziver account connected
  const userMap = await db.query(
    `SELECT u.* FROM telegram_user_map tum
     JOIN users u ON tum.user_id = u.id
     WHERE tum.telegram_id = $1`,
    [telegramId]
  );

  if (userMap.rows.length > 0) {
    const user = userMap.rows[0];
    const referralLink = `https://t.me/YourBotUsername?start=${user.referral_code}`;

    const message = `📣 Your Referral Code: **${user.referral_code}**\n\n` +
                   `Share this link with friends:\n${referralLink}\n\n` +
                   `You'll earn 50 ZP for each friend who joins using your code!`;

    await sendMessage(chatId, message);

    // Create inline keyboard for easy sharing
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: "📤 Share Referral Link",
            url: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Join me on Ziver and earn ZP tokens!')}`
          }
        ]
      ]
    };

    await sendMessage(chatId, "Share your referral link:", keyboard);
  } else {
    await sendMessage(chatId, "You need to connect your Ziver account first. Use /connect to get started.");
  }
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
    }
    // Add more callback handlers as needed

  } catch (error) {
    console.error('Error handling callback query:', error);
  }
};

// Helper function to send messages to Telegram
const sendMessage = async (chatId, text, replyMarkup = null) => {
  try {
    const payload = {
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown'
    };

    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }

    await axios.post(`${TELEGRAM_API_URL}/sendMessage`, payload);
  } catch (error) {
    console.error('Error sending Telegram message:', error);
  }
};

// Get help message
const getHelpMessage = () => {
  return `🤖 *Ziver Bot Help*\n\n` +
         `Available commands:\n` +
         `/start - Start using the bot\n` +
         `/connect - Connect your Telegram to Ziver app\n` +
         `/referral - Get your referral code and link\n` +
         `/help - Show this help message\n\n` +
         `To earn ZP tokens, share your referral link with friends!`;
};

// Get referral info for a Telegram user
const getTelegramReferral = asyncHandler(async (req, res) => {
  const { telegramId } = req.params;

  try {
    const result = await db.query(
      'SELECT referral_code, created_at FROM telegram_referrals WHERE telegram_id = $1',
      [telegramId]
    );

    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'No referral found for this user' });
    }
  } catch (error) {
    console.error('Error fetching Telegram referral:', error);
    res.status(500).json({ message: 'Error fetching referral data' });
  }
});

// Verify connection code from the app
const verifyConnectionCode = asyncHandler(async (req, res) => {
  const { connectionCode, userId } = req.body;

  try {
    // Find session with this connection code
    const sessionResult = await db.query(
      `SELECT * FROM telegram_sessions 
       WHERE data->>'connectionCode' = $1 AND state = 'awaiting_connection'`,
      [connectionCode]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Invalid or expired connection code' 
      });
    }

    const session = sessionResult.rows[0];
    const telegramId = JSON.parse(session.data).telegramId;
    const chatId = session.chat_id;

    // Create the connection between Telegram and user
    await db.query(
      'INSERT INTO telegram_user_map (telegram_id, user_id) VALUES ($1, $2)',
      [telegramId, userId]
    );

    // Clear the session
    await db.query(
      'UPDATE telegram_sessions SET state = "connected", updated_at = NOW() WHERE chat_id = $1',
      [chatId]
    );

    // Send confirmation message to Telegram
    await sendMessage(chatId, '✅ Your Telegram account has been successfully connected to your Ziver account!');

    // Check if this user came from a referral
    const referralResult = await db.query(
      'SELECT referral_code FROM telegram_referrals WHERE telegram_id = $1',
      [telegramId]
    );

    let referralApplied = false;
    if (referralResult.rows.length > 0) {
      const referralCode = referralResult.rows[0].referral_code;

      // Apply the referral bonus
      // You'll need to implement this function in your referral controller
      referralApplied = true;
    }

    res.json({ 
      success: true, 
      message: 'Telegram account connected successfully',
      referralApplied 
    });

  } catch (error) {
    console.error('Error verifying connection code:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error connecting Telegram account' 
    });
  }
});

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

module.exports = {
  setWebhook,
  handleTelegramWebhook,
  getTelegramReferral,
  verifyConnectionCode,
  setWebhookManual,
  getWebhookInfo,
  sendTestMessage
};