import React, { useState, useEffect } from 'react';
import { 
  Shield, Server, Database, Users, Key, AlertTriangle, 
  Play, Pause, Network, Cpu, Activity 
} from 'lucide-react';
import SystemNode from '../components/SystemNode';
import StatusIndicator from '../components/StatusIndicator';
import { getSystemStatus, toggleLockdown, updateComponentStatus } from '../services/adminService';

const SystemStatus = () => {
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);

  // Enhanced component definitions with dependencies
  const components = [
    { 
      key: 'database', 
      name: 'Database', 
      icon: Database, 
      color: 'red',
      dependencies: [] // Root dependency
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

  // Calculate affected components based on dependencies
  const getAffectedComponents = (componentKey) => {
    if (!systemStatus) return [];
    
    const affected = new Set();
    const checkDependents = (key) => {
      components.forEach(comp => {
        if (comp.dependencies.includes(key)) {
          affected.add(comp.key);
          checkDependents(comp.key);
        }
      });
    };
    
    checkDependents(componentKey);
    return Array.from(affected);
  };

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

  const handleNodeClick = (component) => {
    setSelectedNode(component);
    const affected = getAffectedComponents(component.key);
    console.log(`${component.name} affects:`, affected);
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-6">Loading system status...</div>;

  const affectedComponents = selectedNode ? getAffectedComponents(selectedNode.key) : [];

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
            </div>
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

      {/* System Topology Grid */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Cpu className="w-5 h-5" />
          System Topology
        </h3>
        
        <div className="relative">
          {/* Connection Lines Container */}
          <div className="absolute inset-0 pointer-events-none">
            {/* This is where SVG connection lines would go */}
            {/* For now, we'll use CSS for simple visual connections */}
          </div>

          {/* Components Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 relative z-10">
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

        {/* Selected Node Info */}
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