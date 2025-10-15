"use client"

import { useState, useEffect } from "react"
import { Gem, Flame, Zap } from "lucide-react"
import "./MiningHub.css"
import MiningDisplay from "../components/MiningDisplay.jsx"
import miningService from "../services/miningService.js"

const MiningHub = () => {
  const [user, setUser] = useState(null)
  const [appSettings, setAppSettings] = useState({})
  const [miningStatus, setMiningStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentState, setCurrentState] = useState(1)

  // Fetch user data and mining config
  useEffect(() => {
    fetchMiningData()
  }, [])

  const fetchMiningData = async () => {
    try {
      setLoading(true)
      const [config, status] = await Promise.all([
        miningService.getMiningConfig(),
        miningService.getMiningStatus()
      ])
      
      setAppSettings(config)
      setMiningStatus(status)
      setUser(status.userData)
      
      // Determine current state based on mining status
      if (status.canClaim) {
        setCurrentState(3)
      } else if (status.progress > 0 && status.progress < 1) {
        setCurrentState(2)
      } else {
        setCurrentState(1)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Handle claim/mining start
  const handleClaim = async () => {
    setLoading(true)
    setError(null)
    
    try {
      let response
      
      if (currentState === 1) {
        // Start mining
        response = await miningService.startMining()
        setUser(response.userData)
        setCurrentState(2)
      } else if (currentState === 3) {
        // Claim reward
        response = await miningService.claimReward()
        setUser(response.userData)
        setCurrentState(1)
      }
      
      // Refresh mining status
      const status = await miningService.getMiningStatus()
      setMiningStatus(status)
      
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading && !user) {
    return (
      <div className="mining-hub-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading mining data...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="mining-hub-container">
      <div className="mining-content">
        {/* User Stats Section */}
        <div className="user-stats-section">
          <h2 className="section-title">Your Stats</h2>
          <div className="user-stats-grid">
            <div className="user-stat-card zp-card">
              <div className="stat-icon">
                <Gem size={24} />
              </div>
              <div className="stat-info">
                <div className="stat-label">ZP Balance</div>
                <div className="stat-value">{user?.zp_balance || 0}</div>
              </div>
            </div>
            
            <div className="user-stat-card seb-card">
              <div className="stat-icon">
                <Flame size={24} />
              </div>
              <div className="stat-info">
                <div className="stat-label">Streak</div>
                <div className="stat-value">{user?.daily_streak_count || 0} days</div>
              </div>
            </div>
            
            <div className="user-stat-card streak-card">
              <div className="stat-icon">
                <Zap size={24} />
              </div>
              <div className="stat-info">
                <div className="stat-label">Mining Power</div>
                <div className="stat-value">100%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Mining Display Component */}
        <div className="mining-section">
          <MiningDisplay 
            user={user}
            appSettings={appSettings}
            miningStatus={miningStatus}
            onClaim={handleClaim}
            loading={loading}
            error={error}
            currentState={currentState}
          />
        </div>

        {/* Admin Lockdown Indicator (if needed) */}
        {false && (
          <div className="mining-lockdown-indicator">
            <div className="lockdown-alert">
              <div className="lockdown-icon">🚫</div>
              <div className="lockdown-info">
                <strong>Mining Lockdown Active</strong>
                <span>Mining is temporarily disabled by administrators</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MiningHub