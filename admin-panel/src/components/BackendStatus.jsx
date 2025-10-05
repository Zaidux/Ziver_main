"use client"

import { useState, useEffect } from "react"
import { Server, CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react"

const BackendStatus = () => {
  const [backendStatus, setBackendStatus] = useState({
    mainApi: 'checking',
    telegramBot: 'checking',
    database: 'checking',
    lastChecked: null
  })
  const [loading, setLoading] = useState(false)

  const checkBackendHealth = async () => {
    setLoading(true)
    try {
      // Use the current window location to determine the backend URL
      const baseUrl = process.env.REACT_APP_API_URL || window.location.origin.replace(/:\d+$/, ':5000')
      
      console.log('Checking backend health at:', baseUrl)

      // Check main API - use the ping endpoint
      let mainApiStatus = 'down'
      try {
        const response = await fetch(`${baseUrl}/api/system/ping`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        if (response.ok) {
          const data = await response.json()
          mainApiStatus = data.status === 'ok' ? 'operational' : 'degraded'
          console.log('Main API status:', mainApiStatus, data)
        } else {
          mainApiStatus = 'degraded'
          console.log('Main API degraded, status:', response.status)
        }
      } catch (error) {
        mainApiStatus = 'down'
        console.error('Main API check failed:', error)
      }

      // Check Telegram bot health - use the health endpoint
      let telegramBotStatus = 'down'
      try {
        const response = await fetch(`${baseUrl}/api/telegram/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        if (response.ok) {
          const data = await response.json()
          telegramBotStatus = data.status === 'operational' ? 'operational' : 'degraded'
          console.log('Telegram Bot status:', telegramBotStatus, data)
        } else {
          telegramBotStatus = 'degraded'
          console.log('Telegram Bot degraded, status:', response.status)
        }
      } catch (error) {
        telegramBotStatus = 'down'
        console.error('Telegram Bot check failed:', error)
      }

      // Check database connectivity via health endpoint
      let databaseStatus = 'down'
      try {
        const response = await fetch(`${baseUrl}/api/system/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        if (response.ok) {
          const data = await response.json()
          databaseStatus = data.database === 'connected' ? 'operational' : 'degraded'
          console.log('Database status:', databaseStatus, data)
        } else {
          databaseStatus = 'degraded'
          console.log('Database degraded, status:', response.status)
        }
      } catch (error) {
        databaseStatus = 'down'
        console.error('Database check failed:', error)
      }

      setBackendStatus({
        mainApi: mainApiStatus,
        telegramBot: telegramBotStatus,
        database: databaseStatus,
        lastChecked: new Date().toLocaleString()
      })
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

  useEffect(() => {
    checkBackendHealth()
    // Check every 30 seconds
    const interval = setInterval(checkBackendHealth, 30000)
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
      case "checking":
        return <RefreshCw size={20} className="spinner" />
      default:
        return <AlertTriangle size={20} className="text-muted" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "operational":
        return "#10B981"
      case "degraded":
        return "#F59E0B"
      case "down":
        return "#EF4444"
      case "checking":
        return "#6B7280"
      default:
        return "#6B7280"
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case "operational":
        return "Operational"
      case "degraded":
        return "Degraded"
      case "down":
        return "Down"
      case "checking":
        return "Checking..."
      default:
        return "Unknown"
    }
  }

  const backendComponents = [
    {
      key: "mainApi",
      name: "Main API",
      description: "REST API endpoints and business logic",
      endpoint: "/api/system/ping"
    },
    {
      key: "telegramBot",
      name: "Telegram Bot",
      description: "Telegram bot and webhook services",
      endpoint: "/api/telegram/health"
    },
    {
      key: "database",
      name: "Database",
      description: "PostgreSQL database connectivity",
      endpoint: "/api/system/health"
    }
  ]

  return (
    <div className="card">
      <div className="card-header">
        <Server size={20} />
        <h2 className="card-title">Backend Services Status</h2>
        <div className="card-header-actions">
          <button 
            onClick={checkBackendHealth} 
            disabled={loading}
            className="btn btn-sm btn-secondary"
          >
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
                <span className="backend-component-endpoint">
                  Endpoint: {component.endpoint}
                </span>
              </div>
              <div className="backend-component-status">
                {getStatusIcon(backendStatus[component.key])}
                <span 
                  className="status-text"
                  style={{ color: getStatusColor(backendStatus[component.key]) }}
                >
                  {getStatusText(backendStatus[component.key])}
                </span>
              </div>
            </div>
            <div className="backend-component-progress">
              <div
                className="backend-progress-bar"
                style={{
                  width: backendStatus[component.key] === "operational" ? "100%" : 
                         backendStatus[component.key] === "degraded" ? "60%" : 
                         backendStatus[component.key] === "checking" ? "30%" : "0%",
                  background: getStatusColor(backendStatus[component.key])
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {backendStatus.lastChecked && (
        <div className="backend-status-footer">
          <p className="last-checked">
            Last checked: {backendStatus.lastChecked}
          </p>
          <div className="status-summary">
            <span className="summary-item">
              <CheckCircle size={14} className="text-success" />
              Operational: {Object.values(backendStatus).filter(status => status === 'operational').length}
            </span>
            <span className="summary-item">
              <AlertTriangle size={14} className="text-warning" />
              Issues: {Object.values(backendStatus).filter(status => status === 'degraded' || status === 'down').length}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default BackendStatus