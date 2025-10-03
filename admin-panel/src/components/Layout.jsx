import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ClipboardList,
  Settings, 
  Users, 
  Network,
  LogOut,
  Shield
} from 'lucide-react';

const Layout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/users', icon: Users, label: 'Users' },
    { to: '/tasks', icon: ClipboardList, label: 'Tasks' },
    { to: '/system-status', icon: Network, label: 'System Status' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Enhanced Sidebar */}
      <nav className="w-64 bg-gray-800 border-r border-green-500/20 flex flex-col">
        <div className="p-6 border-b border-green-500/20 flex items-center gap-3">
          <Shield className="w-6 h-6 text-green-400" />
          <h1 className="text-xl font-bold text-white">Admin Panel</h1>
        </div>

        <div className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative ${
                    isActive
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30 shadow-lg shadow-green-500/10'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white hover:translate-x-1'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                    {isActive && (
                      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-green-400 rounded-r-full"></div>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Logout Button */}
        <div className="p-4 border-t border-green-500/20">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-red-600 hover:text-white transition-all duration-200 w-full text-left"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gray-900">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;