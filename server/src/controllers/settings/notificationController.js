const asyncHandler = require('express-async-handler');
const db = require('../../config/db');

const notificationController = {
  // Update notification preferences with enhanced validation
  updateNotifications: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { 
      email, 
      push, 
      marketing, 
      security,
      mining_updates,
      referral_updates,
      weekly_digest,
      quiet_hours_enabled,
      quiet_hours_start,
      quiet_hours_end
    } = req.body;

    // Validate input types
    const updates = [];
    
    if (email !== undefined) {
      if (typeof email !== 'boolean') {
        res.status(400);
        throw new Error('Email notifications must be a boolean value');
      }
      updates.push({ key: 'notifications_email', value: email.toString() });
    }

    if (push !== undefined) {
      if (typeof push !== 'boolean') {
        res.status(400);
        throw new Error('Push notifications must be a boolean value');
      }
      updates.push({ key: 'notifications_push', value: push.toString() });
    }

    if (marketing !== undefined) {
      if (typeof marketing !== 'boolean') {
        res.status(400);
        throw new Error('Marketing notifications must be a boolean value');
      }
      updates.push({ key: 'notifications_marketing', value: marketing.toString() });
    }

    if (security !== undefined) {
      if (typeof security !== 'boolean') {
        res.status(400);
        throw new Error('Security notifications must be a boolean value');
      }
      updates.push({ key: 'notifications_security', value: security.toString() });
    }

    if (mining_updates !== undefined) {
      if (typeof mining_updates !== 'boolean') {
        res.status(400);
        throw new Error('Mining updates must be a boolean value');
      }
      updates.push({ key: 'notifications_mining_updates', value: mining_updates.toString() });
    }

    if (referral_updates !== undefined) {
      if (typeof referral_updates !== 'boolean') {
        res.status(400);
        throw new Error('Referral updates must be a boolean value');
      }
      updates.push({ key: 'notifications_referral_updates', value: referral_updates.toString() });
    }

    if (weekly_digest !== undefined) {
      if (typeof weekly_digest !== 'boolean') {
        res.status(400);
        throw new Error('Weekly digest must be a boolean value');
      }
      updates.push({ key: 'notifications_weekly_digest', value: weekly_digest.toString() });
    }

    if (quiet_hours_enabled !== undefined) {
      if (typeof quiet_hours_enabled !== 'boolean') {
        res.status(400);
        throw new Error('Quiet hours enabled must be a boolean value');
      }
      updates.push({ key: 'notifications_quiet_hours_enabled', value: quiet_hours_enabled.toString() });
    }

    // Validate quiet hours format if provided
    if (quiet_hours_start || quiet_hours_end) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      
      if (quiet_hours_start && !timeRegex.test(quiet_hours_start)) {
        res.status(400);
        throw new Error('Quiet hours start time must be in HH:MM format (24-hour)');
      }
      
      if (quiet_hours_end && !timeRegex.test(quiet_hours_end)) {
        res.status(400);
        throw new Error('Quiet hours end time must be in HH:MM format (24-hour)');
      }

      if (quiet_hours_start) {
        updates.push({ key: 'notifications_quiet_hours_start', value: quiet_hours_start });
      }
      
      if (quiet_hours_end) {
        updates.push({ key: 'notifications_quiet_hours_end', value: quiet_hours_end });
      }
    }

    if (updates.length === 0) {
      res.status(400);
      throw new Error('No valid notification settings provided for update');
    }

    // Use transaction for multiple updates
    const client = await db.getClient();

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

      // Update user's updated_at timestamp
      await client.query(
        'UPDATE users SET updated_at = NOW() WHERE id = $1',
        [userId]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Notification preferences updated successfully',
        updated_settings: updates.map(u => u.key.replace('notifications_', '')),
        updated_count: updates.length
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }),

  // Get notification settings with enhanced information
  getNotificationSettings: asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const query = `
      SELECT preference_key, preference_value, updated_at
      FROM user_preferences 
      WHERE user_id = $1 AND preference_key LIKE 'notifications_%'
    `;

    const { rows } = await db.query(query, [userId]);

    // Convert to object with intelligent defaults
    const settings = rows.reduce((acc, row) => {
      const key = row.preference_key.replace('notifications_', '');
      acc[key] = {
        value: row.preference_value === 'true',
        raw_value: row.preference_value,
        updated_at: row.updated_at
      };
      return acc;
    }, {});

    // Set defaults for missing values
    const defaultSettings = {
      email: { value: true, raw_value: 'true', updated_at: null },
      push: { value: true, raw_value: 'true', updated_at: null },
      marketing: { value: false, raw_value: 'false', updated_at: null },
      security: { value: true, raw_value: 'true', updated_at: null },
      mining_updates: { value: true, raw_value: 'true', updated_at: null },
      referral_updates: { value: true, raw_value: 'true', updated_at: null },
      weekly_digest: { value: false, raw_value: 'false', updated_at: null },
      quiet_hours_enabled: { value: false, raw_value: 'false', updated_at: null },
      quiet_hours_start: { value: '22:00', raw_value: '22:00', updated_at: null },
      quiet_hours_end: { value: '08:00', raw_value: '08:00', updated_at: null }
    };

    const finalSettings = { ...defaultSettings, ...settings };

    // Convert string values to proper types for quiet hours
    if (finalSettings.quiet_hours_start && typeof finalSettings.quiet_hours_start.value === 'string') {
      finalSettings.quiet_hours_start.value = finalSettings.quiet_hours_start.raw_value;
    }
    if (finalSettings.quiet_hours_end && typeof finalSettings.quiet_hours_end.value === 'string') {
      finalSettings.quiet_hours_end.value = finalSettings.quiet_hours_end.raw_value;
    }

    // Calculate notification statistics
    const enabledNotifications = Object.values(finalSettings).filter(
      setting => setting.value === true && typeof setting.value === 'boolean'
    ).length;

    const totalNotifications = Object.values(finalSettings).filter(
      setting => typeof setting.value === 'boolean'
    ).length;

    res.json({
      success: true,
      settings: finalSettings,
      statistics: {
        enabled_count: enabledNotifications,
        total_count: totalNotifications,
        enabled_percentage: Math.round((enabledNotifications / totalNotifications) * 100)
      },
      categories: {
        essential: ['email', 'push', 'security'],
        updates: ['mining_updates', 'referral_updates', 'weekly_digest'],
        promotional: ['marketing'],
        preferences: ['quiet_hours_enabled', 'quiet_hours_start', 'quiet_hours_end']
      }
    });
  }),

  // Bulk update notification categories
  updateNotificationCategories: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { category, enabled } = req.body;

    const validCategories = {
      essential: ['email', 'push', 'security'],
      updates: ['mining_updates', 'referral_updates', 'weekly_digest'],
      promotional: ['marketing']
    };

    if (!category || !validCategories[category]) {
      res.status(400);
      throw new Error(`Invalid category. Must be one of: ${Object.keys(validCategories).join(', ')}`);
    }

    if (typeof enabled !== 'boolean') {
      res.status(400);
      throw new Error('Enabled must be a boolean value');
    }

    const updates = validCategories[category].map(key => ({
      key: `notifications_${key}`,
      value: enabled.toString()
    }));

    // Use transaction for multiple updates
    const client = await db.getClient();

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

      // Update user's updated_at timestamp
      await client.query(
        'UPDATE users SET updated_at = NOW() WHERE id = $1',
        [userId]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: `${category} notifications ${enabled ? 'enabled' : 'disabled'} successfully`,
        category: category,
        enabled: enabled,
        affected_settings: validCategories[category],
        updated_count: updates.length
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }),

  // Reset all notification settings to defaults
  resetNotificationSettings: asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      // Delete all notification preferences
      await client.query(`
        DELETE FROM user_preferences 
        WHERE user_id = $1 AND preference_key LIKE 'notifications_%'
      `, [userId]);

      // Update user's updated_at timestamp
      await client.query(
        'UPDATE users SET updated_at = NOW() WHERE id = $1',
        [userId]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'All notification settings reset to defaults',
        reset_settings: [
          'email', 'push', 'marketing', 'security', 
          'mining_updates', 'referral_updates', 'weekly_digest',
          'quiet_hours_enabled', 'quiet_hours_start', 'quiet_hours_end'
        ],
        default_values: {
          email: true,
          push: true,
          marketing: false,
          security: true,
          mining_updates: true,
          referral_updates: true,
          weekly_digest: false,
          quiet_hours_enabled: false,
          quiet_hours_start: '22:00',
          quiet_hours_end: '08:00'
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  })
};

module.exports = notificationController;