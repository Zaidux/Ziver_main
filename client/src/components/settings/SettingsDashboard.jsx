import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sun, 
  Shield, 
  Bell, 
  User,
  ChevronRight,
  Settings,
  Lock,
  Palette
} from 'lucide-react';
import './SettingsDashboard.css';

const SettingsDashboard = () => {
  const navigate = useNavigate();

  const settingsSections = [
    {
      id: 'appearance',
      title: 'Appearance',
      description: 'Customize themes, language, and display preferences',
      icon: Sun,
      path: '/profile/settings/appearance',
      color: '#8B5CF6'
    },
    {
      id: 'security',
      title: 'Security',
      description: 'Manage password, 2FA, and security settings',
      icon: Shield,
      path: '/profile/settings/security',
      color: '#10B981'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Configure email, push, and in-app notifications',
      icon: Bell,
      path: '/profile/settings/notifications',
      color: '#3B82F6'
    },
    {
      id: 'account',
      title: 'Account',
      description: 'Update email, profile info, and account preferences',
      icon: User,
      path: '/profile/settings/account',
      color: '#F59E0B'
    }
  ];

  const handleSectionClick = (path) => {
    navigate(path);
  };

  return (
    <div className="settings-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <Settings size={32} className="header-icon" />
          <div>
            <h1>Settings</h1>
            <p>Manage your account preferences and security settings</p>
          </div>
        </div>
      </div>

      <div className="settings-grid">
        {settingsSections.map((section) => {
          const IconComponent = section.icon;
          return (
            <div
              key={section.id}
              className="settings-card"
              onClick={() => handleSectionClick(section.path)}
            >
              <div className="card-header">
                <div 
                  className="icon-container"
                  style={{ backgroundColor: `${section.color}20` }}
                >
                  <IconComponent size={24} style={{ color: section.color }} />
                </div>
                <ChevronRight size={20} className="chevron" />
              </div>
              
              <div className="card-content">
                <h3>{section.title}</h3>
                <p>{section.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <button className="action-btn">
            <Lock size={18} />
            Privacy Policy
          </button>
          <button className="action-btn">
            <Shield size={18} />
            Terms of Service
          </button>
          <button className="action-btn">
            <Palette size={18} />
            Feedback
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsDashboard;
