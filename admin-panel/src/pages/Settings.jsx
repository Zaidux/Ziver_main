"use client"

import { useState, useEffect } from "react"
import { SettingsIcon, Save, RefreshCw } from "lucide-react"
import adminService from "../services/adminService"

const Settings = () => {
  const [settings, setSettings] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await adminService.getSettings()
      setSettings(response.data)
    } catch (error) {
      console.error("Error fetching settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSettingChange = (index, value) => {
    const newSettings = [...settings]
    newSettings[index].setting_value = value
    setSettings(newSettings)
  }

  const handleSave = async (setting) => {
    try {
      setSaving(setting.id)
      await adminService.updateSetting({
        setting_key: setting.setting_key,
        setting_value: setting.setting_value,
      })
      alert(`✅ '${setting.description}' saved successfully!`)
    } catch (error) {
      console.error("Error saving setting:", error)
      alert("❌ Error saving setting. Please try again.")
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-large"></div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <SettingsIcon size={32} />
            App Settings
          </h1>
          <p className="page-subtitle">Configure system-wide settings and parameters</p>
        </div>
      </div>

      <div className="card">
        <div className="settings-list">
          {settings.map((setting, index) => (
            <div key={setting.id} className="setting-item">
              <div className="setting-content">
                <label className="setting-label">{setting.description}</label>
                <input
                  type="text"
                  value={setting.setting_value}
                  onChange={(e) => handleSettingChange(index, e.target.value)}
                  className="setting-input"
                />
                <p className="setting-key">
                  Key: <code>{setting.setting_key}</code>
                </p>
              </div>
              <button onClick={() => handleSave(setting)} className="btn btn-primary" disabled={saving === setting.id}>
                {saving === setting.id ? (
                  <>
                    <RefreshCw size={16} className="spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Settings
