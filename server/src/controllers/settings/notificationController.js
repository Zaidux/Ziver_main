const asyncHandler = require('express-async-handler');
const db = require('../../config/db');

const notificationController = {
  // Update notification preferences
  updateNotifications: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { email, push, marketing, security } = req.body;

    const updates = [
      { key: 'notifications_email', value: email.toString() },
      { key: 'notifications_push', value: push.toString() },
      { key: 'notifications_marketing', value: marketing.toString() },
      { key: 'notifications_security', value: security.toString() }
    ];

    // Use transaction for multiple updates
    const client = await db.getClient(); // FIXED: Use getClient() instead of connect()
    
    try {
      await client.query('BEGIN');

      for (const update of updates) {
        const query = `
          INSERT INTO user_preferences (user_id, preference_key, preference_value) 
          VALUES ($1, $2, $3)
          ON CONFLICT (user_id, preference_key) 
          DO UPDATE SET preference_value = $3, updated_at = NOW()
        `;
        await client.query(query, [userId, update.key, update.value]);
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Notification preferences updated successfully'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }),

  // Get notification settings
  getNotificationSettings: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    const query = `
      SELECT preference_key, preference_value 
      FROM user_preferences 
      WHERE user_id = $1 AND preference_key LIKE 'notifications_%'
    `;
    
    const { rows } = await db.query(query, [userId]);

    // Convert to object with defaults
    const settings = rows.reduce((acc, row) => {
      const key = row.preference_key.replace('notifications_', '');
      acc[key] = row.preference_value === 'true';
      return acc;
    }, { 
      email: true, 
      push: true, 
      marketing: false, 
      security: true 
    });

    res.json({
      success: true,
      settings
    });
  })
};

module.exports = notificationController;