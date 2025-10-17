const asyncHandler = require('express-async-handler');
const db = require('../config/db');
const { sendMessage } = require('./telegramController');

// Send announcement to all Telegram users
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
    // Get all Telegram-connected users
    let query = `
      SELECT tum.telegram_id, u.username, u.id as user_id, tn.system_updates
      FROM telegram_user_map tum
      JOIN users u ON tum.user_id = u.id
      LEFT JOIN telegram_notifications tn ON tum.user_id = tn.user_id
      WHERE tum.telegram_id IS NOT NULL
    `;

    const queryParams = [];

    // Filter by target if specified
    if (targetUsers === 'active') {
      query += ' AND u.last_activity > NOW() - INTERVAL \'7 days\'';
    } else if (targetUsers === 'mining_enabled') {
      query += ' AND tn.mining_alerts = true';
    }

    const usersResult = await db.query(query, queryParams);
    const users = usersResult.rows;

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
        // Check if user has system updates enabled (if they have notification settings)
        if (user.system_updates !== false) {
          await sendMessage(user.telegram_id, formattedMessage);
          sentCount++;
          console.log(`✅ Announcement sent to user: ${user.username} (${user.telegram_id})`);
        } else {
          console.log(`⏭️  Skipped user (system updates disabled): ${user.username}`);
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

    // Log the announcement in database
    await db.query(
      `INSERT INTO telegram_announcements 
       (admin_id, message, announcement_type, target_users, sent_count, failed_count, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [adminId, message, announcementType, targetUsers || 'all', sentCount, failedCount]
    );

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
    console.error('Error sending announcement:', error);
    res.status(500);
    throw new Error('Failed to send announcement: ' + error.message);
  }
});

// Send message to specific user
const sendUserMessage = asyncHandler(async (req, res) => {
  const { telegramId, message } = req.body;
  const adminId = req.user.id;

  if (!telegramId || !message) {
    res.status(400);
    throw new Error('Telegram ID and message are required');
  }

  try {
    // Verify the user exists and get their info
    const userResult = await db.query(`
      SELECT u.username, tum.telegram_id 
      FROM telegram_user_map tum
      JOIN users u ON tum.user_id = u.id
      WHERE tum.telegram_id = $1
    `, [telegramId]);

    if (userResult.rows.length === 0) {
      res.status(404);
      throw new Error('Telegram user not found');
    }

    const user = userResult.rows[0];
    const formattedMessage = `💬 *Message from Ziver Support*\n\n${message}\n\n_— Ziver Team_`;

    await sendMessage(telegramId, formattedMessage);

    // Log the direct message
    await db.query(
      `INSERT INTO telegram_direct_messages 
       (admin_id, telegram_id, username, message, created_at) 
       VALUES ($1, $2, $3, $4, NOW())`,
      [adminId, telegramId, user.username, message]
    );

    res.json({
      success: true,
      message: `Message sent to ${user.username}`,
      recipient: user.username,
      telegramId: telegramId
    });

  } catch (error) {
    console.error('Error sending user message:', error);
    res.status(500);
    throw new Error('Failed to send message: ' + error.message);
  }
});

// Get announcement history
const getAnnouncementHistory = asyncHandler(async (req, res) => {
  const { limit = 50, offset = 0 } = req.query;

  try {
    const historyResult = await db.query(`
      SELECT 
        ta.*,
        u.username as admin_username
      FROM telegram_announcements ta
      LEFT JOIN users u ON ta.admin_id = u.id
      ORDER BY ta.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const countResult = await db.query(`
      SELECT COUNT(*) as total FROM telegram_announcements
    `);

    res.json({
      success: true,
      announcements: historyResult.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error('Error fetching announcement history:', error);
    res.status(500);
    throw new Error('Failed to fetch announcement history');
  }
});

// Get connected Telegram users statistics
const getTelegramStats = asyncHandler(async (req, res) => {
  try {
    const statsResult = await db.query(`
      SELECT 
        COUNT(*) as total_users,
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
    stats.recent_announcements = parseInt(recentAnnouncementsResult.rows[0].recent_count);

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error fetching Telegram stats:', error);
    res.status(500);
    throw new Error('Failed to fetch Telegram statistics');
  }
});

module.exports = {
  sendAnnouncement,
  sendUserMessage,
  getAnnouncementHistory,
  getTelegramStats
};