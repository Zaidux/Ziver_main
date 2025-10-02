import React, { useState, useEffect } from 'react';
import { 
  Shield, Server, Database, Users, Key, AlertTriangle, 
  Play, Pause, Network, Cpu, Activity 
} from 'lucide-react';
import SystemNode from '../components/SystemNode';
import StatusIndicator from '../components/StatusIndicator';
import { getSystemStatus, toggleLockdown } from '../services/adminService';

const SystemStatus = () => {
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [lockdownLoading, setLockdownLoading] = useState(false);

  const components = [
    { 
      key: 'database', 
      name: 'Database', 
      icon: Database, 
      color: 'red',
      dependencies: []
    },
    { 
      key: 'authentication', 
      name: 'Authentication', 
      icon: Key, 
      color: 'blue',
      dependencies: ['database']
    },
    { 
      key: 'mining', 
      name: 'Mining System', 
      icon: Server, 
      color: 'green',
      dependencies: ['database', 'authentication']
    },
    { 
      key: 'tasks', 
      name: 'Task System', 
      icon: Database, 
      color: 'purple',
      dependencies: ['database', 'authentication']
    },
    { 
      key: 'referrals', 
      name: 'Referral System', 
      icon: Users, 
      color: 'orange',
      dependencies: ['database', 'authentication']
    },
    { 
      key: 'telegram', 
      name: 'Telegram Bot', 
      icon: Shield, 
      color: 'teal',
      dependencies: ['database']
    }
  ];

  const fetchStatus = async () => {
    try {
      setError(null);
      const status = await getSystemStatus();
      setSystemStatus(status);
    } catch (error) {
      console.error('Error fetching system status:', error);
      setError('Failed to load system status. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLockdown = async () => {
    try {
      setLockdownLoading(true);
      const result = await toggleLockdown();
      setSystemStatus(prev => ({ 
        ...prev, 
        lockdownMode: result.lockdownMode 
      }));
      alert(`✅ ${result.message}`);
    } catch (error) {
      console.error('Error toggling lockdown:', error);
      alert('❌ Error toggling lockdown mode. Please check console for details.');
    } finally {
      setLockdownLoading(false);
    }
  };

  const handleNodeClick = (component) => {
    setSelectedNode(component);
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-6">Loading system status...</div>;

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-semibold">Error</span>
          </div>
          <p className="text-red-300 mt-2">{error}</p>
          <button
            onClick={fetchStatus}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!systemStatus) {
    return (
      <div className="p-6">
        <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-4">
          <p className="text-yellow-300">No system status data available</p>
        </div>
      </div>
    );
  }

  const affectedComponents = selectedNode ? [] : [];

  return (
    <div className="p-6 space-y-6">
      {/* Header with System Overview */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Activity className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                System Status Dashboard
                <Network className="w-6 h-6 text-blue-400" />
              </h1>
              <p className="text-gray-400">Real-time monitoring with dependency tracking</p>
              <div className={`mt-2 px-3 py-1 rounded-full text-sm font-semibold ${
                systemStatus.lockdownMode 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                  : 'bg-green-500/20 text-green-400 border border-green-500/30'
              }`}>
                {systemStatus.lockdownMode ? '🔒 System in Lockdown' : '✅ System Operational'}
              </div>
            </div>
          </div>

          <button
            onClick={handleToggleLockdown}
            disabled={lockdownLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
              systemStatus.lockdownMode
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            } ${lockdownLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {lockdownLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : systemStatus.lockdownMode ? (
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
        
        {systemStatus.lockdownMode && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-300 text-sm">
              <strong>Lockdown Message:</strong> {systemStatus.lockdownMessage}
            </p>
          </div>
        )}
      </div>

      {/* Rest of your component remains the same */}
      {/* System Topology Grid */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Cpu className="w-5 h-5" />
          System Topology
        </h3>

        <div className="relative">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {components.map((component) => {
              const status = systemStatus.componentStatuses[component.key];
              const isAffected = affectedComponents.includes(component.key);

              return (
                <SystemNode
                  key={component.key}
                  component={component}
                  status={status}
                  dependencies={component.dependencies}
                  onNodeClick={handleNodeClick}
                  isAffected={isAffected && selectedNode?.key !== component.key}
                />
              );
            })}
          </div>
        </div>

        {selectedNode && (
          <div className="mt-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
            <h4 className="font-semibold text-white mb-2">
              Selected: {selectedNode.name}
            </h4>
            <p className="text-gray-300 text-sm">
              Status: <StatusIndicator status={systemStatus.componentStatuses[selectedNode.key]} showLabel />
            </p>
            {affectedComponents.length > 0 && (
              <p className="text-orange-300 text-sm mt-2">
                Affects: {affectedComponents.length} other component(s)
              </p>
            )}
          </div>
        )}
      </div>

      {/* Quick Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {components.map((component) => (
          <div key={component.key} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <StatusIndicator 
                  status={systemStatus.componentStatuses[component.key]} 
                  size="medium"
                  propagationLevel={
                    systemStatus.componentStatuses[component.key] === 'down' ? 2 : 0
                  }
                />
                <span className="text-white text-sm font-medium">{component.name}</span>
              </div>
            </div>
          </div>
        ))}
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