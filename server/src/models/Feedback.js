const db = require('../config/db');

class Feedback {
  // Create new feedback
  static async create(feedbackData) {
    const {
      userId,
      title,
      message,
      type = 'suggestion',
      priority = 'medium',
      attachments = []
    } = feedbackData;

    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');

      // Insert feedback
      const feedbackQuery = `
        INSERT INTO feedback (
          user_id, title, message, type, priority, attachments
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const feedbackResult = await client.query(feedbackQuery, [
        userId,
        title,
        message,
        type,
        priority,
        JSON.stringify(attachments)
      ]);

      await client.query('COMMIT');
      return feedbackResult.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // In the findAll method, update the return statement:
static async findAll(page = 1, limit = 20, filters = {}) {
  const offset = (page - 1) * limit;
  let whereConditions = ['1=1'];
  let queryParams = [limit, offset];
  let paramCount = 2;

  // Apply filters (your existing code...)

  const whereClause = whereConditions.join(' AND ');

  const query = `
    SELECT 
      f.*,
      u.username,
      u.email,
      u.avatar_url,
      COUNT(*) OVER() as total_count
    FROM feedback f
    LEFT JOIN users u ON f.user_id = u.id
    WHERE ${whereClause}
    ORDER BY f.created_at DESC
    LIMIT $1 OFFSET $2
  `;

  const result = await db.query(query, queryParams);

  // ✅ FIX: Handle case when no rows are returned
  const totalCount = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;

  return {
    feedback: result.rows,
    totalCount: totalCount,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit)
  };
}

  // Get feedback by ID
  static async findById(id) {
    const query = `
      SELECT 
        f.*,
        u.username,
        u.email,
        u.avatar_url
      FROM feedback f
      LEFT JOIN users u ON f.user_id = u.id
      WHERE f.id = $1
    `;

    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  // Update feedback status
  static async updateStatus(id, status, adminNotes = null) {
    const query = `
      UPDATE feedback 
      SET status = $1, admin_notes = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;

    const result = await db.query(query, [status, adminNotes, id]);
    return result.rows[0];
  }

  // Reward user for feedback
  static async rewardUser(feedbackId, rewardData) {
    const { zpReward = 0, sebReward = 0, adminNotes } = rewardData;

    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');

      // Get feedback to find user
      const feedbackResult = await client.query(
        'SELECT user_id FROM feedback WHERE id = $1',
        [feedbackId]
      );

      if (feedbackResult.rows.length === 0) {
        throw new Error('Feedback not found');
      }

      const userId = feedbackResult.rows[0].user_id;

      // Update user balances
      if (zpReward > 0) {
        await client.query(
          'UPDATE users SET zp_balance = zp_balance + $1 WHERE id = $2',
          [zpReward, userId]
        );
      }

      if (sebReward > 0) {
        await client.query(
          'UPDATE users SET social_capital_score = social_capital_score + $1 WHERE id = $2',
          [sebReward, userId]
        );
      }

      // Update feedback with reward and mark as rewarded
      const updateQuery = `
        UPDATE feedback 
        SET 
          status = 'rewarded',
          zp_reward = $1,
          seb_reward = $2,
          admin_notes = $3,
          rewarded_at = NOW(),
          updated_at = NOW()
        WHERE id = $4
        RETURNING *
      `;

      const result = await client.query(updateQuery, [
        zpReward,
        sebReward,
        adminNotes,
        feedbackId
      ]);

      await client.query('COMMIT');
      return result.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get user's feedback history
  static async findByUserId(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        *,
        COUNT(*) OVER() as total_count
      FROM feedback 
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await db.query(query, [userId, limit, offset]);
    
    return {
      feedback: result.rows,
      totalCount: result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0,
      currentPage: page,
      totalPages: Math.ceil((result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0) / limit)
    };
  }

  // Get feedback statistics
  static async getStats() {
    const query = `
      SELECT 
        status,
        type,
        priority,
        COUNT(*) as count
      FROM feedback 
      GROUP BY status, type, priority
    `;

    const result = await db.query(query);
    return result.rows;
  }
}

module.exports = Feedback;