"use client"

import { useState, useRef, useEffect } from "react"
import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useTheme } from "../context/ThemeContext"
import Navbar from "./Navbar"
import {
  User,
  Settings,
  MessageCircle,
  LogOut,
  ChevronUp,
  ChevronDown,
  Sun,
  Moon,
  Monitor,
  Zap,
  History,
  ChevronDown as ChevronDownIcon,
} from "lucide-react"
import "./Layout.css"

const Layout = () => {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [navbarCollapsed, setNavbarCollapsed] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleProfileClick = () => {
    setShowProfileDropdown(!showProfileDropdown)
  }

  const handleMenuAction = (action) => {
    setShowProfileDropdown(false)
    console.log("Menu action:", action)

    switch (action) {
      case "profile":
        navigate("/profile")
        break
      case "settings":
        navigate("/settings")
        break
      case "feedback":
        navigate("/feedback")
        break
      case "history":
        navigate("/history")
        break
      case "logout":
        logout()
        break
      default:
        break
    }
  }

  const handleThemeToggle = () => {
    const themes = ["light", "dark", "auto"]
    const currentIndex = themes.indexOf(theme)
    const nextTheme = themes[(currentIndex + 1) % themes.length]
    toggleTheme(nextTheme)
  }

  const getThemeIcon = () => {
    switch (theme) {
      case "light":
        return Sun
      case "dark":
        return Moon
      case "auto":
        return Monitor
      default:
        return Moon
    }
  }

  const ThemeIcon = getThemeIcon()

  // Get user avatar or fallback to initial
  const getUserAvatar = () => {
    if (user?.avatar_url) {
      return <img src={user.avatar_url || "/placeholder.svg"} alt="Profile" className="avatar-image" />
    }
    return user?.username?.charAt(0).toUpperCase() || "U"
  }

  return (
    <div className={`app-container ${navbarCollapsed ? "navbar-collapsed" : ""}`}>
      <header className="global-header">
        <div className="header-content">
          <div className="header-left">
            <div className="header-logo">
              <Zap className="logo-icon" size={22} />
              <span className="logo-text">ZIVER</span>
            </div>
          </div>
          <div className="header-right">
            <div className="user-controls-container" ref={dropdownRef}>
              <button
                onClick={handleProfileClick}
                className="profile-dropdown-button"
                aria-label="Open profile menu"
              >
                <span className="profile-avatar">{getUserAvatar()}</span>
                <span className="profile-name">{user?.username || 'User'}</span>
                <ChevronDownIcon size={16} />
              </button>
              
              {showProfileDropdown && (
                <div className="profile-dropdown-menu">
                  <div className="dropdown-user-info">
                    <div className="user-avatar-large">{getUserAvatar()}</div>
                    <div className="user-details">
                      <div className="user-name">{user?.username || 'User'}</div>
                      <div className="user-email">{user?.email || 'user@example.com'}</div>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item" onClick={() => handleMenuAction("profile")}>
                    <User size={18} />
                    <span>Profile</span>
                  </button>
                  <button className="dropdown-item" onClick={() => handleMenuAction("history")}>
                    <History size={18} />
                    <span>History</span>
                  </button>
                  <button className="dropdown-item" onClick={() => handleMenuAction("settings")}>
                    <Settings size={18} />
                    <span>Settings</span>
                  </button>
                  <button className="dropdown-item feedback" onClick={() => handleMenuAction("feedback")}>
                    <MessageCircle size={18} />
                    <span>Feedback</span>
                  </button>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item logout" onClick={() => handleMenuAction("logout")}>
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
              
              <button
                onClick={handleThemeToggle}
                className="theme-toggle-button"
                title={`Current theme: ${theme}`}
                aria-label={`Switch theme (current: ${theme})`}
              >
                <ThemeIcon size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>
      <div className="main-content">
        <Outlet />
      </div>
      <div className={`navbar-container ${navbarCollapsed ? "collapsed" : ""}`}>
        <button
          className="navbar-toggle"
          onClick={() => setNavbarCollapsed(!navbarCollapsed)}
          title={navbarCollapsed ? "Show navigation" : "Hide navigation"}
          aria-label={navbarCollapsed ? "Show navigation" : "Hide navigation"}
        >
          {navbarCollapsed ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        <Navbar />
      </div>
    </div>
  )
}

export default Layout