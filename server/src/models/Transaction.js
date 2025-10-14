const db = require('../config/db');

class Transaction {
  // Create new transaction
  static async create(transactionData) {
    const {
      userId,
      type,
      amount,
      currency = 'ZP',
      description,
      referenceId = null,
      referenceType = null,
      status = 'completed',
      metadata = {}
    } = transactionData;

    const query = `
      INSERT INTO transactions (
        user_id, type, amount, currency, description, 
        reference_id, reference_type, status, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await db.query(query, [
      userId,
      type,
      amount,
      currency,
      description,
      referenceId,
      referenceType,
      status,
      JSON.stringify(metadata)
    ]);

    return result.rows[0];
  }

  // Get user's transaction history
  static async findByUserId(userId, page = 1, limit = 20, filters = {}) {
    const offset = (page - 1) * limit;
    let whereConditions = ['user_id = $1'];
    let queryParams = [userId, limit, offset];
    let paramCount = 3;

    // Apply filters
    if (filters.type && filters.type !== 'all') {
      paramCount++;
      whereConditions.push(`type = $${paramCount}`);
      queryParams.push(filters.type);
    }

    if (filters.currency && filters.currency !== 'all') {
      paramCount++;
      whereConditions.push(`currency = $${paramCount}`);
      queryParams.push(filters.currency);
    }

    if (filters.startDate) {
      paramCount++;
      whereConditions.push(`created_at >= $${paramCount}`);
      queryParams.push(filters.startDate);
    }

    if (filters.endDate) {
      paramCount++;
      whereConditions.push(`created_at <= $${paramCount}`);
      queryParams.push(filters.endDate);
    }

    const whereClause = whereConditions.join(' AND ');

    const query = `
      SELECT 
        *,
        COUNT(*) OVER() as total_count
      FROM transactions 
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await db.query(query, queryParams);

    const totalCount = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;

    return {
      transactions: result.rows,
      totalCount: totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit)
    };
  }

  // Get transaction by ID
  static async findById(id) {
    const query = 'SELECT * FROM transactions WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  // Get user's balance summary
  static async getUserBalanceSummary(userId) {
    const query = `
      SELECT 
        currency,
        SUM(CASE WHEN type LIKE '%earn%' OR type LIKE '%deposit%' THEN amount ELSE 0 END) as total_earned,
        SUM(CASE WHEN type LIKE '%spend%' OR type LIKE '%withdraw%' THEN amount ELSE 0 END) as total_spent,
        SUM(CASE 
          WHEN type LIKE '%earn%' OR type LIKE '%deposit%' THEN amount 
          WHEN type LIKE '%spend%' OR type LIKE '%withdraw%' THEN -amount 
          ELSE 0 
        END) as current_balance
      FROM transactions 
      WHERE user_id = $1 
      GROUP BY currency
    `;

    const result = await db.query(query, [userId]);
    return result.rows;
  }

  // Get recent transactions for dashboard
  static async getRecentTransactions(userId, limit = 10) {
    const query = `
      SELECT * FROM transactions 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `;

    const result = await db.query(query, [userId, limit]);
    return result.rows;
  }

  // Get transaction statistics
  static async getStats(userId, period = 'month') {
    let interval;
    switch (period) {
      case 'day': interval = '1 DAY'; break;
      case 'week': interval = '1 WEEK'; break;
      case 'month': interval = '1 MONTH'; break;
      case 'year': interval = '1 YEAR'; break;
      default: interval = '1 MONTH';
    }

    const query = `
      SELECT 
        type,
        currency,
        COUNT(*) as transaction_count,
        SUM(amount) as total_amount,
        DATE(created_at) as date
      FROM transactions 
      WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '${interval}'
      GROUP BY type, currency, DATE(created_at)
      ORDER BY date DESC, total_amount DESC
    `;

    const result = await db.query(query, [userId]);
    return result.rows;
  }
}

module.exports = Transaction;