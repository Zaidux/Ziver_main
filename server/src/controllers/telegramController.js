const asyncHandler = require('express-async-handler');
const db = require('../config/db');

// Telegram webhook handler
const handleTelegramWebhook = asyncHandler(async (req, res) => {
  try {
    const { message, callback_query } = req.body;
    
    // Handle start command with referral parameter
    if (message && message.text && message.text.startsWith('/start')) {
      const startParam = message.text.split(' ')[1]; // Get the referral code
      
      if (startParam) {
        // Store referral code for this user
        const telegramId = message.from.id;
        const username = message.from.username || `user_${telegramId}`;
        
        // Save to database or session
        await db.query(
          'INSERT INTO telegram_referrals (telegram_id, username, referral_code, created_at) VALUES ($1, $2, $3, NOW()) ON CONFLICT (telegram_id) DO UPDATE SET referral_code = $3',
          [telegramId, username, startParam]
        );
        
        console.log(`Telegram user ${username} came from referral: ${startParam}`);
      }
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Telegram webhook error:', error);
    res.status(200).send('OK'); // Always respond OK to Telegram
  }
});

// Get referral info for a Telegram user
const getTelegramReferral = asyncHandler(async (req, res) => {
  const { telegramId } = req.params;
  
  const result = await db.query(
    'SELECT referral_code, created_at FROM telegram_referrals WHERE telegram_id = $1',
    [telegramId]
  );
  
  if (result.rows.length > 0) {
    res.json(result.rows[0]);
  } else {
    res.status(404).json({ message: 'No referral found for this user' });
  }
});

module.exports = {
  handleTelegramWebhook,
  getTelegramReferral
};