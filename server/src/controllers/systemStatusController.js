const SystemStatus = require('../models/SystemStatus.js');

const getSystemStatus = async (req, res) => {
  try {
    console.log('🔍 Fetching system status from Supabase...');

    let status = await SystemStatus.findOne();
    if (!status) {
      console.log('📝 No system status found, creating default...');
      status = await SystemStatus.create({});
    }

    // Convert database fields to camelCase for frontend
    const formattedStatus = {
      lockdownMode: status.lockdown_mode,
      lockdownMessage: status.lockdown_message || 'System is undergoing maintenance. Please try again later.',
      componentStatuses: status.component_statuses || {},
      errorLogs: status.error_logs || [],
      lastUpdated: status.last_updated
    };

    console.log('✅ System status fetched from Supabase:', formattedStatus.lockdownMode);
    res.json(formattedStatus);
  } catch (error) {
    console.error('❌ Error in getSystemStatus:', error);
    res.status(500).json({ 
      message: 'Error fetching system status',
      error: error.message 
    });
  }
};

const toggleLockdown = async (req, res) => {
  try {
    let status = await SystemStatus.findOne();
    if (!status) {
      status = await SystemStatus.create({});
    }

    const newLockdownMode = !status.lockdown_mode;
    const lockdownMessage = newLockdownMode 
      ? 'System is undergoing maintenance. Please try again later.'
      : 'System is now back online.';

    const updatedStatus = await SystemStatus.findOneAndUpdate(
      { id: 1 },
      {
        lockdownMode: newLockdownMode,
        lockdownMessage: lockdownMessage,
        componentStatuses: status.component_statuses || {},
        errorLogs: status.error_logs || []
      }
    );

    console.log(`🔄 Lockdown mode ${newLockdownMode ? 'activated' : 'deactivated'}`);

    res.json({ 
      lockdownMode: updatedStatus.lockdown_mode,
      message: `Lockdown mode ${updatedStatus.lockdown_mode ? 'activated' : 'deactivated'}`
    });
  } catch (error) {
    console.error('❌ Error in toggleLockdown:', error);
    res.status(500).json({ 
      message: 'Error toggling lockdown mode',
      error: error.message 
    });
  }
};

const updateComponentStatus = async (req, res) => {
  try {
    const { component, status: newStatus, error } = req.body;

    let systemStatus = await SystemStatus.findOne();
    if (!systemStatus) {
      systemStatus = await SystemStatus.create({});
    }

    // Update component status
    const componentStatuses = systemStatus.component_statuses || {};
    if (componentStatuses[component] !== undefined) {
      componentStatuses[component] = newStatus;
    }

    // Add error log if provided
    let errorLogs = systemStatus.error_logs || [];
    if (error) {
      errorLogs.unshift({
        component,
        error: error.message || error,
        severity: 'medium',
        timestamp: new Date()
      });

      // Keep only last 50 error logs
      if (errorLogs.length > 50) {
        errorLogs = errorLogs.slice(0, 50);
      }
    }

    const updatedStatus = await SystemStatus.findOneAndUpdate(
      { id: 1 },
      {
        lockdownMode: systemStatus.lockdown_mode,
        lockdownMessage: systemStatus.lockdown_message,
        componentStatuses,
        errorLogs
      }
    );

    res.json({
      lockdownMode: updatedStatus.lockdown_mode,
      lockdownMessage: updatedStatus.lockdown_message,
      componentStatuses: updatedStatus.component_statuses,
      errorLogs: updatedStatus.error_logs,
      lastUpdated: updatedStatus.last_updated
    });
  } catch (error) {
    console.error('❌ Error in updateComponentStatus:', error);
    res.status(500).json({ message: 'Error updating component status' });
  }
};

module.exports = {
  getSystemStatus,
  toggleLockdown,
  updateComponentStatus
};