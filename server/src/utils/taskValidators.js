const db = require('../config/db');

class TaskValidators {
  // Validate mining streak
  static async validateMiningStreak(userId, operator, expectedValue) {
    const query = 'SELECT daily_streak_count FROM users WHERE id = $1';
    const { rows } = await db.query(query, [userId]);
    
    if (rows.length === 0) {
      throw new Error('User not found');
    }

    const actualValue = rows[0].daily_streak_count || 0;
    const isValid = this.compareValues(actualValue, operator, expectedValue);

    return { isValid, actualValue };
  }

  // Validate referral count
  static async validateReferralCount(userId, operator, expectedValue) {
    const query = 'SELECT referral_count FROM users WHERE id = $1';
    const { rows } = await db.query(query, [userId]);
    
    const actualValue = rows[0].referral_count || 0;
    const isValid = this.compareValues(actualValue, operator, expectedValue);

    return { isValid, actualValue };
  }

  // Validate ZP balance
  static async validateZpBalance(userId, operator, expectedValue) {
    const query = 'SELECT zp_balance FROM users WHERE id = $1';
    const { rows } = await db.query(query, [userId]);
    
    const actualValue = rows[0].zp_balance || 0;
    const isValid = this.compareValues(actualValue, operator, expectedValue);

    return { isValid, actualValue };
  }

  // Validate tasks completed count
  static async validateTasksCompleted(userId, operator, expectedValue) {
    const query = 'SELECT COUNT(*) as completed_count FROM user_completed_tasks WHERE user_id = $1';
    const { rows } = await db.query(query, [userId]);
    
    const actualValue = parseInt(rows[0].completed_count) || 0;
    const isValid = this.compareValues(actualValue, operator, expectedValue);

    return { isValid, actualValue };
  }

  // Validate social capital score
  static async validateSocialCapital(userId, operator, expectedValue) {
    const query = 'SELECT social_capital_score FROM users WHERE id = $1';
    const { rows } = await db.query(query, [userId]);
    
    const actualValue = rows[0].social_capital_score || 0;
    const isValid = this.compareValues(actualValue, operator, expectedValue);

    return { isValid, actualValue };
  }

  // Validate mining session duration (in minutes)
  static async validateMiningDuration(userId, operator, expectedValue) {
    const query = `
      SELECT EXTRACT(EPOCH FROM (NOW() - mining_session_start_time)) / 60 as duration_minutes 
      FROM users WHERE id = $1 AND mining_session_start_time IS NOT NULL
    `;
    const { rows } = await db.query(query, [userId]);
    
    const actualValue = rows.length > 0 ? Math.floor(rows[0].duration_minutes) : 0;
    const isValid = this.compareValues(actualValue, operator, expectedValue);

    return { isValid, actualValue };
  }

  // Generic value comparison function
  static compareValues(actual, operator, expected) {
    switch (operator) {
      case '>': return actual > expected;
      case '>=': return actual >= expected;
      case '<': return actual < expected;
      case '<=': return actual <= expected;
      case '==': return actual == expected;
      case '===': return actual === expected;
      case '!=': return actual != expected;
      default: return false;
    }
  }

  // Get user statistics for progress display
  static async getUserStatistics(userId) {
    const userQuery = 'SELECT daily_streak_count, referral_count, zp_balance, social_capital_score FROM users WHERE id = $1';
    const tasksQuery = 'SELECT COUNT(*) as completed_count FROM user_completed_tasks WHERE user_id = $1';
    const miningQuery = `
      SELECT EXTRACT(EPOCH FROM (NOW() - mining_session_start_time)) / 60 as duration_minutes 
      FROM users WHERE id = $1 AND mining_session_start_time IS NOT NULL
    `;

    const [userResult, tasksResult, miningResult] = await Promise.all([
      db.query(userQuery, [userId]),
      db.query(tasksQuery, [userId]),
      db.query(miningQuery, [userId])
    ]);

    return {
      mining_streak: userResult.rows[0]?.daily_streak_count || 0,
      referral_count: userResult.rows[0]?.referral_count || 0,
      zp_balance: userResult.rows[0]?.zp_balance || 0,
      social_capital_score: userResult.rows[0]?.social_capital_score || 0,
      tasks_completed: parseInt(tasksResult.rows[0]?.completed_count) || 0,
      mining_duration: miningResult.rows.length > 0 ? Math.floor(miningResult.rows[0].duration_minutes) : 0
    };
  }
}

module.exports = TaskValidators;
