"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Shield, Mail, Lock, AlertCircle, Sun, Moon } from "lucide-react"
import { useTheme } from "../context/ThemeContext"
import api from "../services/api" // Import the api service that uses backendService

const AdminLoginPage = () => {
  const [formData, setFormData] = useState({ email: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Use the api service instead of hardcoded axios call
      const response = await api.post("/api/auth/login", {
        email: formData.email,
        password: formData.password,
      })

      const { user, token, appSettings } = response

      if (user && user.role === "ADMIN") {
        localStorage.setItem("admin_user", JSON.stringify(user))
        localStorage.setItem("admin_token", token)
        localStorage.setItem("admin_settings", JSON.stringify(appSettings))
        
        // Set authorization header for future requests
        // The api service will handle this automatically via interceptors
        console.log("✅ Login successful, user role:", user.role)
        navigate("/")
      } else {
        setError("Access Denied: Administrator privileges required.")
        localStorage.removeItem("admin_user")
        localStorage.removeItem("admin_token")
      }
    } catch (err) {
      console.error("Login error details:", err)
      setError(err.response?.data?.message || err.message || "Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <button className="login-theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
        {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="login-container">
        <div className="login-header">
          <div className="login-icon">
            <Shield size={40} />
          </div>
          <h1 className="login-title">Ziver Admin Panel</h1>
          <p className="login-subtitle">Sign in to access the dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-alert">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <Mail className="input-icon" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@example.com"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" />
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (
              <>
                <div className="spinner"></div>
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AdminLoginPage