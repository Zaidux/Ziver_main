const asyncHandler = require('express-async-handler');
const db = require('../config/db');
const { sendMessage, sendAnnouncement, getTelegramStats } = require('./telegramController');

// Use the fixed functions from telegramController
module.exports = {
  sendAnnouncement,
  getTelegramStats,
  
  // Keep your existing functions
  sendUserMessage: asyncHandler(async (req, res) => {
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

      const success = await sendMessage(telegramId, formattedMessage);

      if (!success) {
        throw new Error('Failed to send Telegram message');
      }

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
  }),

  getAnnouncementHistory: asyncHandler(async (req, res) => {
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
  })
};