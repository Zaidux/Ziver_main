import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, RefreshCw } from 'lucide-react';
import adminService from '../services/adminService';

const Settings = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await adminService.getSettings();
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (index, value) => {
    const newSettings = [...settings];
    newSettings[index].setting_value = value;
    setSettings(newSettings);
  };

  const handleSave = async (setting) => {
    try {
      setSaving(setting.id);
      await adminService.updateSetting({
        setting_key: setting.setting_key,
        setting_value: setting.setting_value,
      });
      alert(`✅ '${setting.description}' saved successfully!`);
    } catch (error) {
      console.error('Error saving setting:', error);
      alert('❌ Error saving setting. Please try again.');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3 mb-2">
          <SettingsIcon className="w-8 h-8 text-blue-400" />
          App Settings
        </h1>
        <p className="text-gray-400">Configure system-wide settings and parameters</p>
      </div>

      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="space-y-6">
          {settings.map((setting, index) => (
            <div key={setting.id} className="p-6 bg-gray-700/50 rounded-lg">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {setting.description}
                  </label>
                  <input
                    type="text"
                    value={setting.setting_value}
                    onChange={(e) => handleSettingChange(index, e.target.value)}
                    className="w-full px-4 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    Key: <code className="bg-gray-600 px-2 py-1 rounded">{setting.setting_key}</code>
                  </p>
                </div>
                <button
                  onClick={() => handleSave(setting)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200"
                  disabled={saving === setting.id}
                >
                  {saving === setting.id ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Settings;