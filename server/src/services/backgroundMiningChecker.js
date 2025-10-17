const db = require('../config/db');
const { sendMiningNotification } = require('../controllers/telegramController');

class BackgroundMiningChecker {
  constructor() {
    this.isRunning = false;
    this.checkInterval = 5 * 60 * 1000; // Check every 5 minutes
    this.intervalId = null;
  }

  start() {
    if (this.isRunning) {
      console.log('Background mining checker is already running');
      return;
    }
    
    this.isRunning = true;
    console.log('🚀 Background mining checker started');
    
    // Run immediately on start
    this.checkAllUsersMiningStatus();
    
    // Set up interval for periodic checks
    this.intervalId = setInterval(() => {
      this.checkAllUsersMiningStatus();
    }, this.checkInterval);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('🛑 Background mining checker stopped');
  }

  async checkAllUsersMiningStatus() {
    try {
      console.log('⏰ Checking mining status for all users...');
      
      // Get app settings first
      const settingsResult = await db.query('SELECT * FROM app_settings');
      const appSettings = settingsResult.rows.reduce((acc, setting) => {
        acc[setting.setting_key] = setting.setting_value;
        return acc;
      }, {});

      const miningCycleHours = parseFloat(appSettings.MINING_CYCLE_HOURS || '4');
      const MINING_CYCLE_DURATION = miningCycleHours * 60 * 60 * 1000;
      const rewardAmount = parseInt(appSettings.MINING_REWARD || '50', 10);

      // Get all users with active mining sessions that haven't been claimed
      const result = await db.query(`
        SELECT 
          u.id, 
          u.mining_session_start_time, 
          u.last_notification_sent,
          tum.telegram_id,
          tn.mining_alerts
        FROM users u
        LEFT JOIN telegram_user_map tum ON u.id = tum.user_id
        LEFT JOIN telegram_notifications tn ON u.id = tn.user_id
        WHERE u.mining_session_start_time IS NOT NULL
        AND u.last_claim_time IS NULL
      `);
      
      console.log(`Found ${result.rows.length} users with active mining sessions`);
      
      let notificationsSent = 0;
      
      for (const user of result.rows) {
        const shouldSend = await this.checkUserMiningStatus(user, MINING_CYCLE_DURATION, rewardAmount);
        if (shouldSend) {
          notificationsSent++;
        }
      }
      
      if (notificationsSent > 0) {
        console.log(`✅ Sent ${notificationsSent} mining completion notifications`);
      }
      
    } catch (error) {
      console.error('❌ Error in background mining check:', error);
    }
  }

  async checkUserMiningStatus(user, MINING_CYCLE_DURATION, rewardAmount) {
    try {
      if (!user.mining_session_start_time) {
        return false;
      }

      const startTime = new Date(user.mining_session_start_time);
      const elapsed = new Date().getTime() - startTime.getTime();

      // Check if mining cycle is complete
      if (elapsed >= MINING_CYCLE_DURATION) {
        // Check if user has Telegram connected and mining alerts enabled
        const hasTelegram = user.telegram_id && user.mining_alerts;
        
        // Check if notification was already sent (cooldown: 1 hour)
        const lastNotificationSent = user.last_notification_sent;
        const shouldSendNotification = !lastNotificationSent || 
          (new Date() - new Date(lastNotificationSent)) > (60 * 60 * 1000);

        if (shouldSendNotification) {
          // Send Telegram notification if user has Telegram connected
          if (hasTelegram) {
            try {
              await sendMiningNotification(user.id, rewardAmount);
              console.log(`📨 Telegram notification sent to user: ${user.id}`);
            } catch (notificationError) {
              console.error(`❌ Error sending Telegram notification to user ${user.id}:`, notificationError);
            }
          }
          
          // Update notification timestamp in database
          await db.query(
            'UPDATE users SET last_notification_sent = NOW() WHERE id = $1',
            [user.id]
          );
          
          console.log(`✅ Mining completion detected for user: ${user.id}${hasTelegram ? ' (Telegram notified)' : ''}`);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error(`❌ Error checking mining status for user ${user.id}:`, error);
      return false;
    }
  }

  // Method to manually trigger a check (useful for testing)
  async manualCheck() {
    if (!this.isRunning) {
      console.log('⚠️ Background checker not running. Starting it first...');
      this.start();
    } else {
      console.log('🔄 Manually triggering mining status check...');
      await this.checkAllUsersMiningStatus();
    }
  }

  // Get current status of the background checker
  getStatus() {
    return {
      isRunning: this.isRunning,
      checkInterval: this.checkInterval,
      lastCheck: new Date().toISOString()
    };
  }
}

// Create singleton instance
const backgroundMiningChecker = new BackgroundMiningChecker();

module.exports = backgroundMiningChecker;
