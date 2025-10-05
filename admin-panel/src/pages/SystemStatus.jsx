"use client"

import { useState, useEffect } from "react"
import {
  Activity,
  Database,
  Key,
  Server,
  Users,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play,
  Pause,
} from "lucide-react"
import { getSystemStatus, toggleLockdown } from "../services/adminService"
import BackendStatus from "../components/BackendStatus"

const SystemStatus = () => {
  const [systemStatus, setSystemStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lockdownLoading, setLockdownLoading] = useState(false)

  const components = [
    { key: "database", name: "Database", icon: Database, color: "#EF4444" },
    { key: "authentication", name: "Authentication", icon: Key, color: "#3B82F6" },
    { key: "mining", name: "Mining System", icon: Server, color: "#10B981" },
    { key: "tasks", name: "Task System", icon: AlertTriangle, color: "#A855F7" },
    { key: "referrals", name: "Referral System", icon: Users, color: "#F59E0B" },
    { key: "telegram", name: "Telegram Bot", icon: Shield, color: "#14B8A6" },
  ]

  const fetchStatus = async () => {
    try {
      const status = await getSystemStatus()
      setSystemStatus(status)
    } catch (error) {
      console.error("Error fetching system status:", error)
      setSystemStatus({
        lockdownMode: false,
        componentStatuses: {
          database: "operational",
          authentication: "operational",
          mining: "operational",
          tasks: "operational",
          referrals: "operational",
          telegram: "operational",
        },
        errorLogs: [],
      })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleLockdown = async () => {
    try {
      setLockdownLoading(true)
      const result = await toggleLockdown()
      setSystemStatus((prev) => ({
        ...prev,
        lockdownMode: result.lockdownMode,
      }))
      alert(`✅ ${result.message}`)
    } catch (error) {
      console.error("Error toggling lockdown:", error)
      alert("❌ Error toggling lockdown mode. Please check console for details.")
    } finally {
      setLockdownLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 10000)
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status) => {
    switch (status) {
      case "operational":
        return <CheckCircle size={20} className="text-success" />
      case "degraded":
        return <AlertTriangle size={20} className="text-warning" />
      case "down":
        return <XCircle size={20} className="text-danger" />
      default:
        return <AlertTriangle size={20} className="text-muted" />
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
            <Activity size={32} />
            System Status
          </h1>
          <p className="page-subtitle">Real-time monitoring of all system components</p>
        </div>
      </div>

      {/* Backend Services Status - NEW SECTION */}
      <BackendStatus />

      {/* System Health Overview */}
      <div className="card system-health-card">
        <div className="system-health-content">
          <div>
            <h2 className="system-health-title">
              {systemStatus.lockdownMode ? "System in Lockdown Mode" : "All Systems Operational"}
            </h2>
            <p className="system-health-subtitle">
              {systemStatus.lockdownMode ? "🔒 Restricted access mode active" : "✅ All services running normally"}
            </p>
          </div>
          <div className="system-health-actions">
            <div className="system-health-icon">
              {systemStatus.lockdownMode ? (
                <XCircle size={32} className="text-danger" />
              ) : (
                <CheckCircle size={32} className="text-success" />
              )}
            </div>
            <button
              onClick={handleToggleLockdown}
              disabled={lockdownLoading}
              className={`btn ${systemStatus.lockdownMode ? "btn-success" : "btn-danger"}`}
            >
              {lockdownLoading ? (
                <div className="spinner"></div>
              ) : systemStatus.lockdownMode ? (
                <>
                  <Play size={16} />
                  Disable Lockdown
                </>
              ) : (
                <>
                  <Pause size={16} />
                  Enable Lockdown
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Component Status Grid */}
      <div className="components-grid">
        {components.map((component) => {
          const Icon = component.icon
          const status = systemStatus.componentStatuses[component.key]
          return (
            <div key={component.key} className="component-card">
              <div className="component-header">
                <div className="component-info">
                  <div className="component-icon" style={{ background: `${component.color}20` }}>
                    <Icon size={24} style={{ color: component.color }} />
                  </div>
                  <div>
                    <h3 className="component-name">{component.name}</h3>
                    <p className="component-status">{status}</p>
                  </div>
                </div>
                {getStatusIcon(status)}
              </div>
              <div className="component-progress">
                <div
                  className="component-progress-bar"
                  style={{
                    width: status === "operational" ? "100%" : status === "degraded" ? "60%" : "0%",
                    background: status === "operational" ? "#10B981" : status === "degraded" ? "#F59E0B" : "#EF4444",
                  }}
                ></div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Error Logs */}
      <div className="card">
        <div className="card-header">
          <AlertTriangle size={20} />
          <h2 className="card-title">Recent Error Logs</h2>
        </div>
        {systemStatus.errorLogs.length === 0 ? (
          <div className="empty-state">
            <CheckCircle size={48} className="text-success" />
            <p>No recent errors. System is running smoothly!</p>
          </div>
        ) : (
          <div className="error-logs">
            {systemStatus.errorLogs.map((log, index) => (
              <div key={index} className="error-log-item">
                <div className="error-log-header">
                  <span className="error-log-component">{log.component}</span>
                  <span className="error-log-time">{new Date(log.timestamp).toLocaleString()}</span>
                </div>
                <p className="error-log-message">{log.error}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SystemStatus