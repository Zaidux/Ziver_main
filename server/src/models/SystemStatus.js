const db = require('../config/db');

// Initialize system status table if it doesn't exist
const initializeSystemStatus = async () => {
  try {
    // Create system_status table if it doesn't exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS system_status (
        id SERIAL PRIMARY KEY,
        lockdown_mode BOOLEAN DEFAULT false,
        lockdown_message TEXT DEFAULT 'System is undergoing maintenance. Please try again later.',
        component_statuses JSONB DEFAULT '{}',
        error_logs JSONB DEFAULT '[]',
        last_updated TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Insert default row if it doesn't exist
    const { rows } = await db.query(`
      INSERT INTO system_status (id, component_statuses) 
      VALUES (1, $1)
      ON CONFLICT (id) DO NOTHING
      RETURNING *
    `, [JSON.stringify({
      authentication: 'healthy',
      mining: 'healthy', 
      tasks: 'healthy',
      referrals: 'healthy',
      database: 'healthy',
      telegram: 'healthy'
    })]);

    console.log('✅ System status table initialized');
  } catch (error) {
    console.error('❌ Error initializing system status:', error);
  }
};

// Call initialization
initializeSystemStatus();

const SystemStatus = {
  // Find system status (always ID 1)
  findOne: async () => {
    try {
      const { rows } = await db.query(`
        SELECT * FROM system_status WHERE id = 1
      `);
      return rows[0] || null;
    } catch (error) {
      console.error('Error finding system status:', error);
      throw error;
    }
  },

  // Create system status
  create: async (data) => {
    try {
      const { rows } = await db.query(`
        INSERT INTO system_status (id, lockdown_mode, lockdown_message, component_statuses, error_logs)
        VALUES (1, $1, $2, $3, $4)
        RETURNING *
      `, [
        data.lockdownMode || false,
        data.lockdownMessage || 'System is undergoing maintenance. Please try again later.',
        JSON.stringify(data.componentStatuses || {}),
        JSON.stringify(data.errorLogs || [])
      ]);
      return rows[0];
    } catch (error) {
      console.error('Error creating system status:', error);
      throw error;
    }
  },

  // Update system status
  findOneAndUpdate: async (query, update) => {
    try {
      const { rows } = await db.query(`
        UPDATE system_status 
        SET lockdown_mode = $1,
            lockdown_message = $2,
            component_statuses = $3,
            error_logs = $4,
            last_updated = NOW(),
            updated_at = NOW()
        WHERE id = 1
        RETURNING *
      `, [
        update.lockdownMode,
        update.lockdownMessage,
        JSON.stringify(update.componentStatuses),
        JSON.stringify(update.errorLogs)
      ]);
      return rows[0];
    } catch (error) {
      console.error('Error updating system status:', error);
      throw error;
    }
  }
};

module.exports = SystemStatus;