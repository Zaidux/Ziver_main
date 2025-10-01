import React, { useState, useEffect } from 'react';
import { Shield, Server, Database, Users, Key, AlertTriangle, Play, Pause } from 'lucide-react';
import { getSystemStatus, toggleLockdown, updateComponentStatus } from '../services/adminService';

const SystemStatus = () => {
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const components = [
    { key: 'authentication', name: 'Authentication', icon: Key, color: 'blue' },
    { key: 'mining', name: 'Mining System', icon: Server, color: 'green' },
    { key: 'tasks', name: 'Task System', icon: Database, color: 'purple' },
    { key: 'referrals', name: 'Referral System', icon: Users, color: 'orange' },
    { key: 'database', name: 'Database', icon: Database, color: 'red' },
    { key: 'telegram', name: 'Telegram Bot', icon: Shield, color: 'teal' }
  ];

  const fetchStatus = async () => {
    try {
      const status = await getSystemStatus();
      setSystemStatus(status);
    } catch (error) {
      console.error('Error fetching system status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLockdown = async () => {
    try {
      const result = await toggleLockdown();
      setSystemStatus(prev => ({ ...prev, lockdownMode: result.lockdownMode }));
      alert(result.message);
    } catch (error) {
      alert('Error toggling lockdown mode');
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-6">Loading system status...</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Lockdown Control Card */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Shield className="w-6 h-6" />
              System Lockdown Control
            </h2>
            <p className="text-gray-400 mt-1">
              {systemStatus.lockdownMode 
                ? 'System is in lockdown mode - only admins can access the application'
                : 'System is running normally'
              }
            </p>
          </div>
          <button
            onClick={handleToggleLockdown}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
              systemStatus.lockdownMode
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {systemStatus.lockdownMode ? (
              <>
                <Play className="w-4 h-4" />
                Disable Lockdown
              </>
            ) : (
              <>
                <Pause className="w-4 h-4" />
                Enable Lockdown
              </>
            )}
          </button>
        </div>
      </div>

      {/* System Components Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {components.map((component) => {
          const Icon = component.icon;
          const status = systemStatus.componentStatuses[component.key];
          const statusColors = {
            healthy: 'bg-green-500',
            degraded: 'bg-yellow-500',
            down: 'bg-red-500'
          };

          return (
            <div key={component.key} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-${component.color}-500 bg-opacity-20`}>
                    <Icon className={`w-5 h-5 text-${component.color}-400`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{component.name}</h3>
                    <p className={`text-sm capitalize ${
                      status === 'healthy' ? 'text-green-400' :
                      status === 'degraded' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {status}
                    </p>
                  </div>
                </div>
                <div className={`w-3 h-3 rounded-full ${statusColors[status]}`}></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Error Logs */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Recent Error Logs
        </h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {systemStatus.errorLogs.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No recent errors</p>
          ) : (
            systemStatus.errorLogs.map((log, index) => (
              <div key={index} className="bg-gray-700 rounded p-3 border-l-4 border-red-500">
                <div className="flex justify-between items-start">
                  <span className="font-medium text-white capitalize">{log.component}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-300 text-sm mt-1">{log.error}</p>
                <span className={`text-xs px-2 py-1 rounded ${
                  log.severity === 'critical' ? 'bg-red-500' :
                  log.severity === 'high' ? 'bg-orange-500' :
                  log.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                } text-white`}>
                  {log.severity}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemStatus;