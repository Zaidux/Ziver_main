const SystemStatus = require('../models/SystemStatus.js');

const getSystemStatus = async (req, res) => {
  try {
    let status = await SystemStatus.findOne();
    if (!status) {
      status = await SystemStatus.create({});
    }
    res.json(status);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching system status' });
  }
};

const toggleLockdown = async (req, res) => {
  try {
    let status = await SystemStatus.findOne();
    if (!status) {
      status = await SystemStatus.create({});
    }
    
    status.lockdownMode = !status.lockdownMode;
    await status.save();
    
    res.json({ 
      lockdownMode: status.lockdownMode,
      message: `Lockdown mode ${status.lockdownMode ? 'activated' : 'deactivated'}`
    });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling lockdown mode' });
  }
};

const updateComponentStatus = async (req, res) => {
  try {
    const { component, status, error } = req.body;
    
    let systemStatus = await SystemStatus.findOne();
    if (!systemStatus) {
      systemStatus = await SystemStatus.create({});
    }
    
    if (systemStatus.componentStatuses[component]) {
      systemStatus.componentStatuses[component] = status;
    }
    
    if (error) {
      systemStatus.errorLogs.unshift({
        component,
        error: error.message || error,
        severity: 'medium'
      });
      
      // Keep only last 50 error logs
      if (systemStatus.errorLogs.length > 50) {
        systemStatus.errorLogs = systemStatus.errorLogs.slice(0, 50);
      }
    }
    
    systemStatus.lastUpdated = new Date();
    await systemStatus.save();
    
    res.json(systemStatus);
  } catch (error) {
    res.status(500).json({ message: 'Error updating component status' });
  }
};

module.exports = {
  getSystemStatus,
  toggleLockdown,
  updateComponentStatus
};