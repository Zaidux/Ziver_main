"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { Gem, Flame, Zap, Star } from "lucide-react"
import "./MiningHub.css"
import MiningDisplay from "../components/MiningDisplay.jsx"
import miningService from "../services/miningService.js"

const MiningHub = () => {
  const { user, appSettings, updateUser } = useAuth()
  const [miningStatus, setMiningStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [currentState, setCurrentState] = useState(1)

  // Load mining status on component mount and user change
  useEffect(() => {
    const loadMiningStatus = async () => {
      if (user) {
        try {
          setLoading(true)
          const [status, config] = await Promise.all([
            miningService.getMiningStatus(),
            miningService.getMiningConfig()
          ])
          
          setMiningStatus(status)
          updateUser(status.userData)

          // Determine current state based on mining status
          if (status.canClaim) {
            setCurrentState(3) // Ready to claim
          } else if (status.progress > 0) {
            setCurrentState(2) // Mining in progress
          } else {
            setCurrentState(1) // Ready to start
          }
        } catch (err) {
          console.error("Failed to load mining status:", err)
          setError("Failed to load mining data")
        } finally {
          setLoading(false)
        }
      }
    }

    loadMiningStatus()
  }, [user, updateUser])

  const handleClaim = async () => {
    setLoading(true)
    setError("")
    try {
      const result = await miningService.claimReward()
      updateUser(result.userData)
      const status = await miningService.getMiningStatus()
      setMiningStatus(status)
      setCurrentState(1) // Return to ready state after claim
    } catch (err) {
      setError(err.message || "An error occurred during claim.")
    } finally {
      setLoading(false)
    }
  }

  const handleStartMining = async () => {
    setLoading(true)
    setError("")
    try {
      const result = await miningService.startMining()

      if (result.userData) {
        updateUser(result.userData)
      } else {
        const status = await miningService.getMiningStatus()
        updateUser(status.userData)
      }

      setCurrentState(2)

      // Start polling for mining progress
      const pollInterval = setInterval(async () => {
        try {
          const status = await miningService.getMiningStatus()
          setMiningStatus(status)
          if (status.canClaim) {
            clearInterval(pollInterval)
            setCurrentState(3) // Ready to claim
          }
        } catch (error) {
          console.error("Polling error:", error)
          clearInterval(pollInterval)
        }
      }, 5000)

      // Cleanup interval on unmount
      return () => clearInterval(pollInterval)
    } catch (err) {
      const errorMessage = err.message || "Failed to start mining."
      setError(errorMessage)
      console.error("Start mining error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = () => {
    if (currentState === 1) {
      handleStartMining()
    } else if (currentState === 3) {
      handleClaim()
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
                <Gem size={20} />
              </div>
              <div className="stat-info">
                <div className="stat-label">ZP Balance</div>
                <div className="stat-value">{user?.zp_balance || 0}</div>
              </div>
            </div>

            <div className="user-stat-card seb-card">
              <div className="stat-icon">
                <Star size={20} />
              </div>
              <div className="stat-info">
                <div className="stat-label">SEB Score</div>
                <div className="stat-value">{user?.social_capital_score || 0}</div>
              </div>
            </div>

            <div className="user-stat-card streak-card">
              <div className="stat-icon">
                <Flame size={20} />
              </div>
              <div className="stat-info">
                <div className="stat-label">Daily Streak</div>
                <div className="stat-value">{user?.daily_streak_count || 0} days</div>
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
            onClaim={handleAction}
            loading={loading}
            error={error}
            currentState={currentState}
          />
        </div>
      </div>
    </div>
  )
}

export default MiningHub