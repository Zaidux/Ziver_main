"use client"

import { useState } from "react"
import { BarChart3, Users, TrendingUp, Lock, Settings } from "lucide-react"
import "./AdminWallet.css"

const AdminWallet = () => {
  const [activeTab, setActiveTab] = useState("overview")

  const adminStats = [
    { label: "Total Users", value: "12,543", change: "+2.5%", icon: Users },
    { label: "Total Volume", value: "$2.4M", change: "+12.3%", icon: TrendingUp },
    { label: "Active Wallets", value: "8,234", change: "+5.1%", icon: Lock },
    { label: "Transactions", value: "45,678", change: "+18.2%", icon: BarChart3 },
  ]

  const recentTransactions = [
    { id: 1, user: "user_123", amount: 1000, token: "ZIV", status: "completed", time: "2 min ago" },
    { id: 2, user: "user_456", amount: 50, token: "TON", status: "completed", time: "15 min ago" },
    { id: 3, user: "user_789", amount: 5000, token: "ZIV", status: "pending", time: "1 hour ago" },
  ]

  return (
    <div className="admin-wallet">
      <div className="admin-header">
        <h1>Admin Wallet Dashboard</h1>
        <p>Manage wallet ecosystem and monitor transactions</p>
      </div>

      <div className="admin-tabs">
        <button className={`tab ${activeTab === "overview" ? "active" : ""}`} onClick={() => setActiveTab("overview")}>
          <BarChart3 size={18} />
          Overview
        </button>
        <button className={`tab ${activeTab === "users" ? "active" : ""}`} onClick={() => setActiveTab("users")}>
          <Users size={18} />
          Users
        </button>
        <button className={`tab ${activeTab === "security" ? "active" : ""}`} onClick={() => setActiveTab("security")}>
          <Lock size={18} />
          Security
        </button>
        <button className={`tab ${activeTab === "settings" ? "active" : ""}`} onClick={() => setActiveTab("settings")}>
          <Settings size={18} />
          Settings
        </button>
      </div>

      <div className="admin-content">
        {activeTab === "overview" && (
          <>
            <div className="stats-grid">
              {adminStats.map((stat, i) => {
                const Icon = stat.icon
                return (
                  <div key={i} className="stat-card">
                    <div className="stat-icon">
                      <Icon size={24} />
                    </div>
                    <div className="stat-info">
                      <span className="stat-label">{stat.label}</span>
                      <span className="stat-value">{stat.value}</span>
                      <span className="stat-change positive">{stat.change}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="transactions-section">
              <h2>Recent Transactions</h2>
              <div className="transactions-table">
                <div className="table-header">
                  <span>User</span>
                  <span>Amount</span>
                  <span>Token</span>
                  <span>Status</span>
                  <span>Time</span>
                </div>
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="table-row">
                    <span className="user-id">{tx.user}</span>
                    <span className="amount">{tx.amount}</span>
                    <span className="token">{tx.token}</span>
                    <span className={`status ${tx.status}`}>{tx.status}</span>
                    <span className="time">{tx.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === "users" && (
          <div className="users-section">
            <h2>User Management</h2>
            <p>Manage user wallets and permissions</p>
            <div className="placeholder">User management interface coming soon</div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="security-section">
            <h2>Security Management</h2>
            <p>Monitor and manage wallet security</p>
            <div className="placeholder">Security management interface coming soon</div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="settings-section">
            <h2>Admin Settings</h2>
            <p>Configure wallet system parameters</p>
            <div className="placeholder">Settings interface coming soon</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminWallet
