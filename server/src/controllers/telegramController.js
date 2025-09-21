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
        const firstName = message.from.first_name || '';
        const lastName = message.from.last_name || '';

        // Save to database
        await db.query(
          `INSERT INTO telegram_referrals (telegram_id, username, first_name, last_name, referral_code, created_at) 
           VALUES ($1, $2, $3, $4, $5, NOW()) 
           ON CONFLICT (telegram_id) 
           DO UPDATE SET referral_code = $5, updated_at = NOW()`,
          [telegramId, username, firstName, lastName, startParam]
        );

        console.log(`Telegram user ${username} came from referral: ${startParam}`);
        
        // Send welcome message with referral info
        // This would require your Telegram bot logic
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

// New function to connect Telegram user to app account
const connectTelegramUser = asyncHandler(async (req, res) => {
  const { telegramId, userId } = req.body;
  
  try {
    // Check if Telegram user has a referral code
    const referralResult = await db.query(
      'SELECT referral_code FROM telegram_referrals WHERE telegram_id = $1',
      [telegramId]
    );
    
    if (referralResult.rows.length > 0) {
      const referralCode = referralResult.rows[0].referral_code;
      
      // Apply the referral to the user
      await db.query(
        'UPDATE users SET telegram_id = $1 WHERE id = $2',
        [telegramId, userId]
      );
      
      // Return the referral code to be applied
      res.json({ referralCode });
    } else {
      res.json({ message: 'No referral code found' });
    }
  } catch (error) {
    console.error('Error connecting Telegram user:', error);
    res.status(500).json({ message: 'Error connecting Telegram account' });
  }
});

module.exports = {
  handleTelegramWebhook,
  getTelegramReferral,
  connectTelegramUser
};