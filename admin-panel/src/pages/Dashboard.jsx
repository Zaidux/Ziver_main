import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, UserCheck, Server, AlertTriangle,
  Activity, Shield
} from 'lucide-react';
import adminService from '../services/adminService';

const Dashboard = () => {
  const [summary, setSummary] = useState({ 
    totalUsers: 0, 
    onlineUsers: 0,
    systemStatus: null 
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Fetch both summary and system status
        const [summaryResponse, systemStatusResponse] = await Promise.all([
          adminService.getSummary(),
          adminService.getSystemStatus()
        ]);
        
        setSummary({
          ...summaryResponse.data,
          systemStatus: systemStatusResponse
        });
      } catch (err) {
        console.error('Dashboard error:', err);
        if (err.response?.status === 403) {
          setError('Access denied. Administrator privileges required.');
        } else if (err.response?.status === 401) {
          setError('Session expired. Please login again.');
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setError('Failed to fetch dashboard data. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/login');
  };

  const getSystemHealth = () => {
    if (!summary.systemStatus) return 'unknown';
    const statuses = Object.values(summary.systemStatus.componentStatuses);
    if (statuses.includes('down')) return 'critical';
    if (statuses.includes('degraded')) return 'warning';
    return 'healthy';
  };

  const systemHealth = getSystemHealth();

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <button 
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          Logout
        </button>
      </header>

      {loading && <p className="text-gray-400">Loading dashboard data...</p>}
      {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-lg">{error}</p>}

      {!loading && !error && (
        <>
          {/* System Health Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-6 rounded-lg border-2 ${
              systemHealth === 'critical' ? 'bg-red-900/20 border-red-500' :
              systemHealth === 'warning' ? 'bg-yellow-900/20 border-yellow-500' :
              'bg-green-900/20 border-green-500'
            }`}>
              <div className="flex items-center gap-3">
                <Activity className={`w-8 h-8 ${
                  systemHealth === 'critical' ? 'text-red-400' :
                  systemHealth === 'warning' ? 'text-yellow-400' :
                  'text-green-400'
                }`} />
                <div>
                  <h3 className="text-lg font-semibold text-white">System Health</h3>
                  <p className={`capitalize ${
                    systemHealth === 'critical' ? 'text-red-300' :
                    systemHealth === 'warning' ? 'text-yellow-300' :
                    'text-green-300'
                  }`}>
                    {systemHealth === 'critical' ? 'Critical Issues' :
                     systemHealth === 'warning' ? 'Degraded Performance' :
                     'All Systems Operational'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-400" />
                <div>
                  <h3 className="text-lg font-semibold text-white">Total Users</h3>
                  <p className="text-2xl font-bold text-white">{summary.totalUsers}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="flex items-center gap-3">
                <UserCheck className="w-8 h-8 text-green-400" />
                <div>
                  <h3 className="text-lg font-semibold text-white">Online Now</h3>
                  <p className="text-2xl font-bold text-white">{summary.onlineUsers}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button 
                onClick={() => navigate('/system-status')}
                className="p-4 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white text-left"
              >
                <Server className="w-6 h-6 mb-2" />
                <h4 className="font-semibold">System Status</h4>
                <p className="text-sm text-blue-200">Monitor system health</p>
              </button>
              
              <button 
                onClick={() => navigate('/users')}
                className="p-4 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-white text-left"
              >
                <Users className="w-6 h-6 mb-2" />
                <h4 className="font-semibold">User Management</h4>
                <p className="text-sm text-green-200">Manage users</p>
              </button>
              
              <button 
                onClick={() => navigate('/tasks')}
                className="p-4 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-white text-left"
              >
                <AlertTriangle className="w-6 h-6 mb-2" />
                <h4 className="font-semibold">Task Management</h4>
                <p className="text-sm text-purple-200">Manage tasks</p>
              </button>
              
              <button 
                onClick={() => navigate('/settings')}
                className="p-4 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors text-white text-left"
              >
                <Shield className="w-6 h-6 mb-2" />
                <h4 className="font-semibold">Settings</h4>
                <p className="text-sm text-orange-200">System configuration</p>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;