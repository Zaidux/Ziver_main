const db = require('../config/db');

const Task = {
  // Get task by ID
  findById: async (id) => {
    const query = 'SELECT * FROM tasks WHERE id = $1';
    const { rows } = await db.query(query, [id]);
    return rows[0];
  },

  // Create a new task
  create: async (taskData) => {
    const { title, description, zp_reward, seb_reward, link_url, task_type, verification_required, is_active } = taskData;
    
    const query = `
      INSERT INTO tasks (title, description, zp_reward, seb_reward, link_url, task_type, verification_required, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const { rows } = await db.query(query, [
      title, description, zp_reward, seb_reward, link_url, 
      task_type || 'in_app', verification_required || false, is_active !== false
    ]);
    
    return rows[0];
  },

  // Update a task
  update: async (id, taskData) => {
    const { title, description, zp_reward, seb_reward, link_url, task_type, verification_required, is_active } = taskData;
    
    const query = `
      UPDATE tasks
      SET title = $1, description = $2, zp_reward = $3, seb_reward = $4, 
          link_url = $5, task_type = $6, verification_required = $7, is_active = $8,
          updated_at = NOW()
      WHERE id = $9
      RETURNING *
    `;
    
    const { rows } = await db.query(query, [
      title, description, zp_reward, seb_reward, link_url, 
      task_type, verification_required, is_active, id
    ]);
    
    return rows[0];
  },

  // Get all active tasks
  findAllActive: async () => {
    const query = 'SELECT * FROM tasks WHERE is_active = true ORDER BY created_at DESC';
    const { rows } = await db.query(query);
    return rows;
  },

  // Get tasks with completion counts
  findAllWithStats: async () => {
    const query = `
      SELECT t.*, COUNT(uct.user_id) as completion_count
      FROM tasks t
      LEFT JOIN user_completed_tasks uct ON t.id = uct.task_id
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `;
    
    const { rows } = await db.query(query);
    return rows;
  },

  // Check if user has completed a task
  isCompletedByUser: async (taskId, userId) => {
    const query = 'SELECT 1 FROM user_completed_tasks WHERE task_id = $1 AND user_id = $2';
    const { rows } = await db.query(query, [taskId, userId]);
    return rows.length > 0;
  }
};

module.exports = Task;