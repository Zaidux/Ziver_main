import React, { useState, useEffect } from 'react';
import adminService from '../services/adminService';
// import './Settings.css';

const Settings = () => {
  const [settings, setSettings] = useState([]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const response = await adminService.getSettings();
    setSettings(response.data);
  };

  const handleSettingChange = (index, value) => {
    const newSettings = [...settings];
    newSettings[index].setting_value = value;
    setSettings(newSettings);
  };

  const handleSave = async (setting) => {
    await adminService.updateSetting({
      setting_key: setting.setting_key,
      setting_value: setting.setting_value,
    });
    alert(`'${setting.setting_key}' saved!`);
  };

  return (
    <div>
      <h2>App Settings</h2>
      <div className="settings-list"> {/* Add styles for this class */}
        {settings.map((setting, index) => (
          <div key={setting.id} className="setting-item">
            <label>{setting.description}</label>
            <input
              value={setting.setting_value}
              onChange={(e) => handleSettingChange(index, e.target.value)}
            />
            <button onClick={() => handleSave(setting)}>Save</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Settings;