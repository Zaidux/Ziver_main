"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Users,
  UserCheck,
  Server,
  AlertTriangle,
  Activity,
  Shield,
  TrendingUp,
  Clock,
  ArrowRight,
  ClipboardList,
} from "lucide-react"
import adminService from "../services/adminService"

const Dashboard = () => {
  const [summary, setSummary] = useState({
    totalUsers: 0,
    onlineUsers: 0,
    totalTasks: 0,
    activeTasks: 0,
    systemHealth: "healthy",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError("")

        const [summaryResponse, systemStatusResponse] = await Promise.all([
          adminService.getSummary(),
          adminService.getSystemStatus(),
        ])

        const systemHealth = getSystemHealth(systemStatusResponse)

        setSummary({
          ...summaryResponse.data,
          systemHealth,
          totalTasks: summaryResponse.data.totalTasks || 0,
          activeTasks: summaryResponse.data.activeTasks || 0,
        })
      } catch (err) {
        console.error("Dashboard error:", err)
        if (err.response?.status === 403) {
          setError("Access denied. Administrator privileges required.")
        } else if (err.response?.status === 401) {
          setError("Session expired. Please login again.")
          localStorage.removeItem("admin_token")
          localStorage.removeItem("admin_user")
          setTimeout(() => navigate("/login"), 2000)
        } else {
          setError("Failed to fetch dashboard data. Please try again.")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [navigate])

  const getSystemHealth = (systemStatus) => {
    if (!systemStatus) return "unknown"
    const statuses = Object.values(systemStatus.componentStatuses || {})
    if (statuses.includes("down")) return "critical"
    if (statuses.includes("degraded")) return "warning"
    return "healthy"
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
            <Shield size={32} />
            Dashboard
          </h1>
          <p className="page-subtitle">Welcome back! Here's your system overview.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card stat-card-blue">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3 className="stat-label">Total Users</h3>
            <p className="stat-value">{summary.totalUsers.toLocaleString()}</p>
          </div>
        </div>

        <div className="stat-card stat-card-green">
          <div className="stat-icon">
            <UserCheck size={24} />
          </div>
          <div className="stat-content">
            <h3 className="stat-label">Online Now</h3>
            <p className="stat-value">{summary.onlineUsers}</p>
          </div>
        </div>

        <div className="stat-card stat-card-purple">
          <div className="stat-icon">
            <ClipboardList size={24} />
          </div>
          <div className="stat-content">
            <h3 className="stat-label">Active Tasks</h3>
            <p className="stat-value">
              {summary.activeTasks}/{summary.totalTasks}
            </p>
          </div>
        </div>

        <div className="stat-card stat-card-status">
          <div className="stat-icon">
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <h3 className="stat-label">System Health</h3>
            <span className={`status-badge status-${summary.systemHealth}`}>
              {summary.systemHealth === "healthy"
                ? "Operational"
                : summary.systemHealth === "warning"
                  ? "Degraded"
                  : "Critical"}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <TrendingUp size={20} />
          <h2 className="card-title">Quick Actions</h2>
        </div>
        <div className="quick-actions-grid">
          <button onClick={() => navigate("/system-status")} className="action-card action-card-primary">
            <Server size={24} />
            <div>
              <h4>System Status</h4>
              <p>Monitor system health</p>
            </div>
            <ArrowRight size={20} className="action-arrow" />
          </button>

          <button onClick={() => navigate("/users")} className="action-card">
            <Users size={24} />
            <div>
              <h4>Manage Users</h4>
              <p>User management</p>
            </div>
            <ArrowRight size={20} className="action-arrow" />
          </button>

          <button onClick={() => navigate("/tasks")} className="action-card">
            <AlertTriangle size={24} />
            <div>
              <h4>Manage Tasks</h4>
              <p>Task management</p>
            </div>
            <ArrowRight size={20} className="action-arrow" />
          </button>

          <button onClick={() => navigate("/settings")} className="action-card">
            <Shield size={24} />
            <div>
              <h4>Settings</h4>
              <p>System configuration</p>
            </div>
            <ArrowRight size={20} className="action-arrow" />
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <Clock size={20} />
          <h2 className="card-title">Recent Activity</h2>
        </div>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-dot activity-dot-green"></div>
            <span>New user registered</span>
            <span className="activity-time">2 minutes ago</span>
          </div>
          <div className="activity-item">
            <div className="activity-dot activity-dot-blue"></div>
            <span>Task completed by user</span>
            <span className="activity-time">15 minutes ago</span>
          </div>
          <div className="activity-item">
            <div className="activity-dot activity-dot-green"></div>
            <span>System backup completed</span>
            <span className="activity-time">1 hour ago</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-alert">
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

export default Dashboard
