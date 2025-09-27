const db = require('../config/db');
const taskValidators = require('../utils/taskValidators');

class TaskValidation {
  // Validate if a user can complete a task
  static async validateTaskCompletion(userId, taskId) {
    try {
      // Get task validation rules
      const validationRules = await this.getTaskValidationRules(taskId);
      
      if (!validationRules || validationRules.length === 0) {
        // If no specific rules, allow completion (backward compatibility)
        return { isValid: true, message: 'Task can be completed' };
      }

      // Validate each rule
      const validationResults = [];
      
      for (const rule of validationRules) {
        const result = await this.validateRule(userId, rule);
        validationResults.push(result);
      }

      // Check if all rules pass (AND logic)
      const allValid = validationResults.every(result => result.isValid);
      
      if (allValid) {
        return { 
          isValid: true, 
          message: 'All validation rules passed' 
        };
      } else {
        const failedRules = validationResults.filter(r => !r.isValid);
        return { 
          isValid: false, 
          message: 'Task requirements not met',
          failedRules: failedRules.map(r => r.message)
        };
      }

    } catch (error) {
      console.error('Task validation error:', error);
      return { 
        isValid: false, 
        message: 'Validation error: ' + error.message 
      };
    }
  }

  // Get validation rules for a task
  static async getTaskValidationRules(taskId) {
    const query = `
      SELECT vr.* 
      FROM task_validation_rules vr 
      WHERE vr.task_id = $1 AND vr.is_active = true
      ORDER BY vr.priority ASC
    `;
    
    const { rows } = await db.query(query, [taskId]);
    return rows;
  }

  // Validate a single rule
  static async validateRule(userId, rule) {
    const { rule_type, operator, value, additional_params } = rule;
    
    try {
      let isValid = false;
      let actualValue = null;
      let message = '';

      switch (rule_type) {
        case 'mining_streak':
          const streakResult = await taskValidators.validateMiningStreak(userId, operator, parseInt(value));
          isValid = streakResult.isValid;
          actualValue = streakResult.actualValue;
          message = `Mining streak: ${actualValue} ${operator} ${value}`;
          break;

        case 'referral_count':
          const referralResult = await taskValidators.validateReferralCount(userId, operator, parseInt(value));
          isValid = referralResult.isValid;
          actualValue = referralResult.actualValue;
          message = `Referral count: ${actualValue} ${operator} ${value}`;
          break;

        case 'zp_balance':
          const balanceResult = await taskValidators.validateZpBalance(userId, operator, parseInt(value));
          isValid = balanceResult.isValid;
          actualValue = balanceResult.actualValue;
          message = `ZP balance: ${actualValue} ${operator} ${value}`;
          break;

        case 'tasks_completed':
          const tasksResult = await taskValidators.validateTasksCompleted(userId, operator, parseInt(value));
          isValid = tasksResult.isValid;
          actualValue = tasksResult.actualValue;
          message = `Tasks completed: ${actualValue} ${operator} ${value}`;
          break;

        case 'social_capital_score':
          const scoreResult = await taskValidators.validateSocialCapital(userId, operator, parseInt(value));
          isValid = scoreResult.isValid;
          actualValue = scoreResult.actualValue;
          message = `Social capital: ${actualValue} ${operator} ${value}`;
          break;

        case 'mining_session_duration':
          const durationResult = await taskValidators.validateMiningDuration(userId, operator, parseInt(value));
          isValid = durationResult.isValid;
          actualValue = durationResult.actualValue;
          message = `Mining duration: ${actualValue} minutes ${operator} ${value} minutes`;
          break;

        default:
          isValid = false;
          message = `Unknown rule type: ${rule_type}`;
      }

      return {
        isValid,
        rule_type,
        operator,
        expectedValue: value,
        actualValue,
        message: isValid ? `✓ ${message}` : `✗ ${message}`
      };

    } catch (error) {
      console.error(`Error validating rule ${rule_type}:`, error);
      return {
        isValid: false,
        rule_type,
        message: `Validation error: ${error.message}`
      };
    }
  }

  // Create validation rules for a task
  static async createValidationRule(taskId, ruleData) {
    const { rule_type, operator, value, priority = 10, is_active = true, additional_params = null } = ruleData;
    
    const query = `
      INSERT INTO task_validation_rules 
      (task_id, rule_type, operator, value, priority, is_active, additional_params)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const { rows } = await db.query(query, [
      taskId, rule_type, operator, value, priority, is_active, 
      additional_params ? JSON.stringify(additional_params) : null
    ]);
    
    return rows[0];
  }

  // Get user's progress towards task completion
  static async getUserTaskProgress(userId, taskId) {
    const rules = await this.getTaskValidationRules(taskId);
    const progress = [];

    for (const rule of rules) {
      const result = await this.validateRule(userId, rule);
      progress.push(result);
    }

    const completedCount = progress.filter(p => p.isValid).length;
    const totalCount = progress.length;
    const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100;

    return {
      taskId,
      progress,
      completedCount,
      totalCount,
      percentage,
      canComplete: percentage === 100
    };
  }
}

module.exports = TaskValidation;