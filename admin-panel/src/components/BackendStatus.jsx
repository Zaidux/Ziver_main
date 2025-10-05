// Enhanced BackendStatus with individual API monitoring
"use client"

import { useState, useEffect } from "react"
import { Server, CheckCircle, XCircle, AlertTriangle, RefreshCw, Database, Key, Users, Shield, ClipboardList, Cpu } from "lucide-react"

const BackendStatus = () => {
  const [backendStatus, setBackendStatus] = useState({
    mainApi: 'checking',
    telegramBot: 'checking',
    database: 'checking',
    lastChecked: null
  })
  const [apiServices, setApiServices] = useState({})
  const [loading, setLoading] = useState(false)

  const apiEndpoints = [
    { key: 'auth', name: 'Authentication API', endpoint: '/api/auth/test', icon: Key },
    { key: 'user', name: 'User API', endpoint: '/api/user/heartbeat', icon: Users },
    { key: 'mining', name: 'Mining API', endpoint: '/api/mining/status', icon: Cpu },
    { key: 'tasks', name: 'Tasks API', endpoint: '/api/tasks', icon: ClipboardList },
    { key: 'referrals', name: 'Referrals API', endpoint: '/api/referrals', icon: Shield },
    { key: 'admin', name: 'Admin API', endpoint: '/api/admin/summary', icon: Database },
    { key: 'system', name: 'System API', endpoint: '/api/system/ping', icon: Server },
    { key: 'telegram', name: 'Telegram API', endpoint: '/api/telegram/health', icon: Shield }
  ]

  const checkBackendHealth = async () => {
    setLoading(true)
    try {
      const baseUrl = 'https://ziver-api.onrender.com'
      
      console.log('Checking backend health at:', baseUrl)

      // Check core services
      const [mainApiStatus, telegramBotStatus, databaseStatus] = await Promise.all([
        checkEndpoint(`${baseUrl}/api/system/ping`),
        checkEndpoint(`${baseUrl}/api/telegram/health`),
        checkEndpoint(`${baseUrl}/api/system/health`)
      ])

      // Check all individual API endpoints
      const apiStatuses = {}
      for (const api of apiEndpoints) {
        apiStatuses[api.key] = await checkEndpoint(`${baseUrl}${api.endpoint}`)
      }

      setBackendStatus({
        mainApi: mainApiStatus,
        telegramBot: telegramBotStatus,
        database: databaseStatus,
        lastChecked: new Date().toLocaleString()
      })

      setApiServices(apiStatuses)

    } catch (error) {
      console.error('Error checking backend health:', error)
      setBackendStatus({
        mainApi: 'down',
        telegramBot: 'down', 
        database: 'down',
        lastChecked: new Date().toLocaleString()
      })
    } finally {
      setLoading(false)
    }
  }

  const checkEndpoint = async (url) => {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (response.ok) {
        return 'operational'
      } else if (response.status === 401 || response.status === 403) {
        // Auth required endpoints are still "operational" if they respond
        return 'operational'
      } else {
        return 'degraded'
      }
    } catch (error) {
      return 'down'
    }
  }

  useEffect(() => {
    checkBackendHealth()
    const interval = setInterval(checkBackendHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status) => {
    switch (status) {
      case "operational": return <CheckCircle size={16} className="text-success" />
      case "degraded": return <AlertTriangle size={16} className="text-warning" />
      case "down": return <XCircle size={16} className="text-danger" />
      case "checking": return <RefreshCw size={16} className="spinner" />
      default: return <AlertTriangle size={16} className="text-muted" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "operational": return "#10B981"
      case "degraded": return "#F59E0B"
      case "down": return "#EF4444"
      case "checking": return "#6B7280"
      default: return "#6B7280"
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case "operational": return "Operational"
      case "degraded": return "Degraded"
      case "down": return "Down"
      case "checking": return "Checking..."
      default: return "Unknown"
    }
  }

  const backendComponents = [
    { key: "mainApi", name: "Main API", description: "REST API endpoints and business logic", endpoint: "/api/system/ping" },
    { key: "telegramBot", name: "Telegram Bot", description: "Telegram bot and webhook services", endpoint: "/api/telegram/health" },
    { key: "database", name: "Database", description: "PostgreSQL database connectivity", endpoint: "/api/system/health" }
  ]

  return (
    <div className="space-y-6">
      {/* Core Services */}
      <div className="card">
        <div className="card-header">
          <Server size={20} />
          <h2 className="card-title">Core Services Status</h2>
          <div className="card-header-actions">
            <button onClick={checkBackendHealth} disabled={loading} className="btn btn-sm btn-secondary">
              <RefreshCw size={14} className={loading ? "spinner" : ""} />
              Refresh
            </button>
          </div>
        </div>

        <div className="backend-status-content">
          {backendComponents.map((component) => (
            <div key={component.key} className="backend-component">
              <div className="backend-component-info">
                <div className="backend-component-details">
                  <h4 className="backend-component-name">{component.name}</h4>
                  <p className="backend-component-description">{component.description}</p>
                  <span className="backend-component-endpoint">Endpoint: {component.endpoint}</span>
                </div>
                <div className="backend-component-status">
                  {getStatusIcon(backendStatus[component.key])}
                  <span className="status-text" style={{ color: getStatusColor(backendStatus[component.key]) }}>
                    {getStatusText(backendStatus[component.key])}
                  </span>
                </div>
              </div>
              <div className="backend-component-progress">
                <div className="backend-progress-bar" style={{
                  width: backendStatus[component.key] === "operational" ? "100%" : 
                         backendStatus[component.key] === "degraded" ? "60%" : "0%",
                  background: getStatusColor(backendStatus[component.key])
                }}></div>
              </div>
            </div>
          ))}
        </div>

        {backendStatus.lastChecked && (
          <div className="backend-status-footer">
            <p className="last-checked">Last checked: {backendStatus.lastChecked}</p>
            <div className="status-summary">
              <span className="summary-item">
                <CheckCircle size={14} className="text-success" />
                Operational: {Object.values(backendStatus).filter(s => s === 'operational').length - 1}
              </span>
              <span className="summary-item">
                <AlertTriangle size={14} className="text-warning" />
                Issues: {Object.values(backendStatus).filter(s => s === 'degraded' || s === 'down').length - 1}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Individual API Services */}
      <div className="card">
        <div className="card-header">
          <Database size={20} />
          <h2 className="card-title">API Services Status</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {apiEndpoints.map((api) => {
            const Icon = api.icon
            const status = apiServices[api.key] || 'checking'
            return (
              <div key={api.key} className="api-service-card">
                <div className="api-service-header">
                  <div className="api-service-icon">
                    <Icon size={20} />
                  </div>
                  <div className="api-service-info">
                    <h4 className="api-service-name">{api.name}</h4>
                    <span className="api-endpoint">{api.endpoint}</span>
                  </div>
                  <div className="api-service-status">
                    {getStatusIcon(status)}
                  </div>
                </div>
                <div className="api-service-progress">
                  <div className="api-progress-bar" style={{
                    width: status === "operational" ? "100%" : status === "degraded" ? "60%" : "0%",
                    background: getStatusColor(status)
                  }}></div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default BackendStatus