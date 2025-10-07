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

  // Create validation rule using existing client (for transactions) - MOVED OUTSIDE
  static async createValidationRuleWithClient(client, taskId, ruleData) {
    const { rule_type, operator, value, priority = 10, is_active = true, additional_params = null } = ruleData;

    // Validate rule data
    if (!rule_type || !operator || value === undefined) {
      throw new Error('Missing required rule fields: rule_type, operator, value');
    }

    const query = `
      INSERT INTO task_validation_rules 
      (task_id, rule_type, operator, value, priority, is_active, additional_params)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const { rows } = await client.query(query, [
      taskId, 
      rule_type, 
      operator, 
      value.toString(), // Ensure value is string
      priority, 
      is_active, 
      additional_params ? JSON.stringify(additional_params) : null
    ]);

    return rows[0];
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

   // Initialize the task_validation_rules table
  static async initializeTable() {
    try {
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS task_validation_rules (
          id SERIAL PRIMARY KEY,
          task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
          rule_type VARCHAR(50) NOT NULL,
          operator VARCHAR(10) NOT NULL,
          value VARCHAR(255) NOT NULL,
          priority INTEGER DEFAULT 10,
          is_active BOOLEAN DEFAULT true,
          additional_params JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_task_validation_rules_task_id ON task_validation_rules(task_id);
        CREATE INDEX IF NOT EXISTS idx_task_validation_rules_active ON task_validation_rules(is_active);
      `;

      await db.query(createTableQuery);
      console.log('Task validation rules table initialized');
    } catch (error) {
      console.error('Error initializing task validation rules table:', error);
      throw error;
    }
  }

  // Seed default validation rules for existing tasks
  static async seedDefaultRules() {
    try {
      // Get all active tasks that don't have validation rules
      const tasksWithoutRules = await db.query(`
        SELECT t.id, t.task_type, t.title 
        FROM tasks t 
        LEFT JOIN task_validation_rules vr ON t.id = vr.task_id 
        WHERE vr.id IS NULL AND t.is_active = true
      `);

      console.log(`Found ${tasksWithoutRules.rows.length} tasks without validation rules`);

      for (const task of tasksWithoutRules.rows) {
        // Add default rules based on task type
        let defaultRules = [];

        if (task.task_type === 'in_app') {
          // Default rule: user must have at least 1 mining streak
          defaultRules.push({
            rule_type: 'mining_streak',
            operator: '>=',
            value: '1',
            priority: 10,
            is_active: true
          });
        } else if (task.task_type === 'link') {
          // Default rule: user must have Telegram connected
          defaultRules.push({
            rule_type: 'referral_count',
            operator: '>=',
            value: '0', // No minimum requirement, just checking the capability
            priority: 10,
            is_active: true
          });
        }

        // Create the default rules
        for (const rule of defaultRules) {
          await this.createValidationRule(task.id, rule);
        }

        console.log(`Added ${defaultRules.length} default rules for task: ${task.title}`);
      }
    } catch (error) {
      console.error('Error seeding default validation rules:', error);
    }
  }
}

  // Create validation rules for a task (standalone version)
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