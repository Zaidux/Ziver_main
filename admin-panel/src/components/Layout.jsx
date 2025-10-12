"use client"

import { useState } from "react"
import { NavLink, Outlet, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  ClipboardList,
  Settings,
  Users,
  Network,
  LogOut,
  Shield,
  Menu,
  X,
  Sun,
  Moon,
  MessageCircle // ADDED: Import MessageCircle icon for feedback
} from "lucide-react"
import { useTheme } from "../context/ThemeContext"

const Layout = () => {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem("admin_token")
    localStorage.removeItem("admin_user")
    navigate("/login")
  }

  const navItems = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/users", icon: Users, label: "Users" },
    { to: "/tasks", icon: ClipboardList, label: "Tasks" },
    { to: "/feedback", icon: MessageCircle, label: "Feedback" }, // ADDED: Feedback Management
    { to: "/system-status", icon: Network, label: "System Status" },
    { to: "/settings", icon: Settings, label: "Settings" },
  ]

  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  return (
    <div className="layout-container">
      {/* Top Navigation Bar */}
      <header className="top-nav">
        <div className="top-nav-content">
          <div className="top-nav-left">
            <button
              className="mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="brand">
              <Shield className="brand-icon" />
              <h1 className="brand-title">Ziver Admin</h1>
            </div>
          </div>

          <div className="top-nav-right">
            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="logout-btn" onClick={handleLogout} aria-label="Logout">
              <LogOut size={20} />
              <span className="logout-text">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <nav className={`sidebar ${isMobileMenuOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-content">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={closeMobileMenu}
                className={({ isActive }) => `nav-item ${isActive ? "nav-item-active" : ""}`}
              >
                <Icon className="nav-icon" />
                <span className="nav-label">{item.label}</span>
              </NavLink>
            )
          })}
        </div>
      </nav>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && <div className="mobile-overlay" onClick={closeMobileMenu} />}

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout