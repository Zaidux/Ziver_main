"use client"

import { useState } from "react"
import { Users, Search, Mail, Shield, TrendingUp, AlertTriangle } from "lucide-react"
import adminService from "../services/adminService"

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSearch = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setUsers([])

    try {
      const response = await adminService.searchUsers(searchTerm)
      setUsers(response.data)
      if (response.data.length === 0) {
        setError("No users found.")
      }
    } catch (err) {
      setError("Failed to search for users.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Users size={32} />
            User Management
          </h1>
          <p className="page-subtitle">Search and manage user accounts</p>
        </div>
      </div>

      {/* Search Form */}
      <div className="card">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-wrapper">
            <Search className="search-icon" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by username or email..."
              className="search-input"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <div className="spinner"></div> : "Search"}
          </button>
        </form>
      </div>

      {error && (
        <div className="error-alert">
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* User List */}
      {users.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Search Results</h2>
            <span className="badge">{users.length} users found</span>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>ZP Balance</th>
                  <th>SEB Score</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="font-semibold">{user.username}</td>
                    <td>
                      <div className="flex-center-gap">
                        <Mail size={16} className="text-muted" />
                        {user.email}
                      </div>
                    </td>
                    <td className="text-success font-semibold">{user.zp_balance.toLocaleString()}</td>
                    <td>
                      <div className="flex-center-gap">
                        <TrendingUp size={16} className="text-success" />
                        {user.social_capital_score}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-primary">
                        <Shield size={12} />
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-sm">View Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement
