import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, UserCheck, Server, AlertTriangle,
  Activity, Shield, TrendingUp, Clock
} from 'lucide-react';
import adminService from '../services/adminService';

const Dashboard = () => {
  const [summary, setSummary] = useState({ 
    totalUsers: 0, 
    onlineUsers: 0,
    totalTasks: 0,
    activeTasks: 0,
    systemHealth: 'healthy'
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

        const systemHealth = getSystemHealth(systemStatusResponse);

        setSummary({
          ...summaryResponse.data,
          systemHealth,
          totalTasks: summaryResponse.data.totalTasks || 0,
          activeTasks: summaryResponse.data.activeTasks || 0
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

  const getSystemHealth = (systemStatus) => {
    if (!systemStatus) return 'unknown';
    const statuses = Object.values(systemStatus.componentStatuses || {});
    if (statuses.includes('down')) return 'critical';
    if (statuses.includes('degraded')) return 'warning';
    return 'healthy';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-green-400" />
          Admin Dashboard
        </h1>
        <p className="text-gray-400">Welcome back! Here's what's happening with your system.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Total Users</h3>
            <p className="text-2xl font-bold text-white">{summary.totalUsers.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
            <UserCheck className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Online Now</h3>
            <p className="text-2xl font-bold text-white">{summary.onlineUsers}</p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Active Tasks</h3>
            <p className="text-2xl font-bold text-white">
              {summary.activeTasks}/{summary.totalTasks}
            </p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
            <Activity className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">System Health</h3>
            <p className="text-xl">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                summary.systemHealth === 'healthy' 
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : summary.systemHealth === 'warning'
                  ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {summary.systemHealth === 'healthy' ? 'Operational' : 
                 summary.systemHealth === 'warning' ? 'Degraded' : 'Critical'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-green-400" />
          <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            onClick={() => navigate('/system-status')}
            className="flex items-center gap-2 p-4 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200 text-white text-left"
          >
            <Server className="w-5 h-5" />
            <div>
              <h4 className="font-semibold">System Status</h4>
              <p className="text-sm text-blue-200">Monitor system health</p>
            </div>
          </button>

          <button 
            onClick={() => navigate('/users')}
            className="flex items-center gap-2 p-4 bg-gray-600 hover:bg-gray-500 rounded-lg transition-all duration-200 text-white text-left"
          >
            <Users className="w-5 h-5" />
            <div>
              <h4 className="font-semibold">Manage Users</h4>
              <p className="text-sm text-gray-200">User management</p>
            </div>
          </button>

          <button 
            onClick={() => navigate('/tasks')}
            className="flex items-center gap-2 p-4 bg-gray-600 hover:bg-gray-500 rounded-lg transition-all duration-200 text-white text-left"
          >
            <AlertTriangle className="w-5 h-5" />
            <div>
              <h4 className="font-semibold">Manage Tasks</h4>
              <p className="text-sm text-gray-200">Task management</p>
            </div>
          </button>

          <button 
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 p-4 bg-gray-600 hover:bg-gray-500 rounded-lg transition-all duration-200 text-white text-left"
          >
            <Shield className="w-5 h-5" />
            <div>
              <h4 className="font-semibold">Settings</h4>
              <p className="text-sm text-gray-200">System configuration</p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-green-400" />
          <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-white">New user registered</span>
            </div>
            <span className="text-gray-400 text-sm">2 minutes ago</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-white">Task completed by user</span>
            </div>
            <span className="text-gray-400 text-sm">15 minutes ago</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-white">System backup completed</span>
            </div>
            <span className="text-gray-400 text-sm">1 hour ago</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          {error}
        </div>
      )}
    </div>
  );
};

export default Dashboard;