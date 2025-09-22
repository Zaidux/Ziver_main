const axios = require('axios');
require('dotenv').config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.TELEGRAM_WEBHOOK_URL || `${process.env.BASE_URL}/api/telegram/webhook`;

async function setWebhook() {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN is not set in environment variables');
    return;
  }

  if (!WEBHOOK_URL) {
    console.error('❌ WEBHOOK_URL is not set in environment variables');
    return;
  }

  try {
    const response = await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`, {
      url: WEBHOOK_URL,
      drop_pending_updates: true
    });

    console.log('✅ Webhook set successfully:', response.data);
    console.log('📝 Webhook URL:', WEBHOOK_URL);
    
    // Get webhook info to verify
    const infoResponse = await axios.get(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`);
    console.log('📋 Webhook info:', infoResponse.data);
    
  } catch (error) {
    console.error('❌ Error setting webhook:', error.response?.data || error.message);
  }
}

// Run if this script is called directly
if (require.main === module) {
  setWebhook();
}

module.exports = setWebhook;