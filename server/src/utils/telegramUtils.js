const axios = require('axios');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

class TelegramUtils {
  // Check if a user is a member of a Telegram channel/group
  static async checkChannelMembership(telegramUserId, channelUsername) {
    try {
      if (!TELEGRAM_BOT_TOKEN) {
        console.warn('Telegram Bot Token not configured');
        return { isMember: true, error: 'Telegram bot not configured' }; // Fallback to true for development
      }

      // Remove @ symbol if present
      const cleanChannel = channelUsername.replace('@', '');
      
      // Use getChatMember to check membership
      const response = await axios.get(`${TELEGRAM_API_URL}/getChatMember`, {
        params: {
          chat_id: `@${cleanChannel}`,
          user_id: telegramUserId
        }
      });

      const status = response.data.result.status;
      const isMember = ['creator', 'administrator', 'member', 'restricted'].includes(status);
      
      console.log(`Telegram membership check: User ${telegramUserId} in @${cleanChannel} - Status: ${status}, IsMember: ${isMember}`);
      
      return { isMember, status };
      
    } catch (error) {
      console.error('Error checking Telegram channel membership:', error.response?.data || error.message);
      
      // Handle different error cases
      if (error.response?.data?.error_code === 400) {
        return { isMember: false, error: 'Bot is not in the channel or channel does not exist' };
      }
      if (error.response?.data?.error_code === 403) {
        return { isMember: false, error: 'Bot cannot access channel information' };
      }
      
      return { isMember: false, error: error.response?.data?.description || error.message };
    }
  }

  // Extract channel username from Telegram URL
  static extractChannelFromUrl(url) {
    try {
      const urlObj = new URL(url);
      
      // Handle different Telegram URL formats
      if (urlObj.hostname === 't.me' || urlObj.hostname === 'telegram.me') {
        const path = urlObj.pathname.replace('/', '');
        
        // Handle t.me/username and t.me/joinchat/xxx formats
        if (path.startsWith('joinchat/')) {
          return null; // Private channels with invite links
        }
        
        return path;
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting channel from URL:', error);
      return null;
    }
  }

  // Send message to user via Telegram bot
  static async sendMessage(chatId, text, replyMarkup = null) {
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
      return true;
    } catch (error) {
      console.error('Error sending Telegram message:', error);
      return false;
    }
  }

  // Verify if a user has completed a link task
  static async verifyLinkTask(userId, taskUrl, taskType = 'telegram_channel') {
    try {
      // Get user's Telegram ID if connected
      const db = require('../config/db');
      const telegramResult = await db.query(
        'SELECT telegram_id FROM telegram_user_map WHERE user_id = $1',
        [userId]
      );

      if (telegramResult.rows.length === 0) {
        return { 
          verified: false, 
          error: 'Telegram account not connected. Please connect your Telegram account first.' 
        };
      }

      const telegramUserId = telegramResult.rows[0].telegram_id;

      switch (taskType) {
        case 'telegram_channel':
          const channelUsername = this.extractChannelFromUrl(taskUrl);
          if (!channelUsername) {
            return { 
              verified: false, 
              error: 'Invalid Telegram channel URL' 
            };
          }
          
          return await this.checkChannelMembership(telegramUserId, channelUsername);
          
        case 'website_visit':
          // For website visits, we rely on the client-side verification
          return { verified: true, method: 'client_verification' };
          
        default:
          return { 
            verified: false, 
            error: 'Unsupported link task type' 
          };
      }
    } catch (error) {
      console.error('Error verifying link task:', error);
      return { 
        verified: false, 
        error: 'Verification failed: ' + error.message 
      };
    }
  }

// Verify if a user is member of a Telegram group/channel
const verifyGroupMembership = async (telegramId, groupUsername) => {
  try {
    // This requires your bot to be admin in the target group/channel
    // and the 'getChatMember' method to be available
    
    const response = await axios.get(`${TELEGRAM_API_URL}/getChatMember`, {
      params: {
        chat_id: `@${groupUsername}`,
        user_id: telegramId
      }
    });

    const status = response.data.result.status;
    // Valid statuses: 'creator', 'administrator', 'member'
    const isMember = ['creator', 'administrator', 'member'].includes(status);
    
    return {
      verified: isMember,
      status: status,
      error: isMember ? null : 'User is not a member of the group'
    };

  } catch (error) {
    console.error('Telegram API error:', error.response?.data || error.message);
    
    // If we can't verify, return trust-based result
    return {
      verified: true, // Trust the user for now
      status: 'unknown',
      error: 'Verification unavailable, using trust system'
    };
  }
};

  // Create a Telegram deep link for task completion verification
  static createTaskVerificationDeepLink(taskId, userId) {
    const baseUrl = process.env.FRONTEND_URL || 'https://ziver-main.onrender.com';
    return `${baseUrl}/tasks/verify?taskId=${taskId}&userId=${userId}`;
  }
}

module.exports = TelegramUtils;