"use client"

import { useState, useEffect } from "react"
import "./MiningDisplay.css"

const MiningDisplay = ({ user, appSettings, miningStatus, onClaim, loading, error, currentState = 1 }) => {
  const [timeLeft, setTimeLeft] = useState(0)
  const [isClaimable, setIsClaimable] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentZP, setCurrentZP] = useState(user?.zp_balance || 0)

  const miningCycleHours = Number.parseFloat(appSettings?.MINING_CYCLE_HOURS || "4")
  const MINING_CYCLE_MS = miningCycleHours * 60 * 60 * 1000
  const miningReward = Number.parseInt(appSettings?.MINING_REWARD || "50", 10)

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`
    }
    return `${minutes}m ${seconds}s`
  }

  // Get state data based on currentState prop (1-3)
  const getStateData = () => {
    switch (currentState) {
      case 1: // Idle - Ready to start
        return {
          title: "Ready to Mine",
          subtitle: "Start earning ZP rewards",
          zpValue: user?.zp_balance || 0,
          isMining: false,
          progress: 0,
          buttonText: "Start Mining",
          buttonEnabled: true,
        }
      case 2: // Mining in progress
        return {
          title: "Mining in Progress",
          subtitle: "Earning rewards...",
          zpValue: currentZP,
          isMining: true,
          progress: progress,
          buttonText: formatTime(timeLeft),
          buttonEnabled: false,
        }
      case 3: // Ready to claim
        return {
          title: "Reward Ready!",
          subtitle: "Claim your earnings",
          zpValue: (user?.zp_balance || 0) + miningReward,
          isMining: false,
          progress: 1,
          buttonText: "Claim Reward",
          buttonEnabled: true,
        }
      default:
        return getStateData(1)
    }
  }

  const stateData = getStateData()

  useEffect(() => {
    setCurrentZP(user?.zp_balance || 0)
  }, [user?.zp_balance])

  useEffect(() => {
    if (miningStatus) {
      setIsClaimable(miningStatus.canClaim)
      setTimeLeft(miningStatus.timeRemaining)
      setProgress(miningStatus.progress || 0)

      if (miningStatus.progress > 0 && miningStatus.progress < 1) {
        const earnedZP = Math.floor(miningReward * miningStatus.progress)
        setCurrentZP((user?.zp_balance || 0) + earnedZP)
      }
      return
    }

    if (!user?.mining_session_start_time) {
      setIsClaimable(true)
      setTimeLeft(0)
      setProgress(0)
      setCurrentZP(user?.zp_balance || 0)
      return
    }

    const interval = setInterval(() => {
      const startTime = new Date(user.mining_session_start_time).getTime()
      const now = new Date().getTime()
      const timePassed = now - startTime
      const remaining = MINING_CYCLE_MS - timePassed
      const currentProgress = timePassed / MINING_CYCLE_MS

      const earnedZP = Math.floor(miningReward * currentProgress)
      setCurrentZP((user?.zp_balance || 0) + earnedZP)

      if (remaining <= 0) {
        setTimeLeft(0)
        setIsClaimable(true)
        setProgress(1)
        setCurrentZP((user?.zp_balance || 0) + miningReward)
        clearInterval(interval)
      } else {
        setTimeLeft(remaining)
        setIsClaimable(false)
        setProgress(currentProgress)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [user, MINING_CYCLE_MS, miningStatus, miningReward])

  const calculateCircleProgress = () => {
    return progress * 283 // 2πr where r=45
  }

  return (
    <div className="mining-display">
      <div className="mining-header">
        <h2 className="header-title">{stateData.title}</h2>
        <p className="header-subtitle">{stateData.subtitle}</p>
      </div>

      <div className="mining-circle-container">
        <div className="mining-circle">
          {/* Progress ring */}
          <svg className="progress-ring" width="160" height="160">
            <circle
              className="progress-ring-bg"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="4"
              fill="transparent"
              r="70"
              cx="80"
              cy="80"
            />
            <circle
              className="progress-ring-circle"
              stroke="url(#gradient)"
              strokeWidth="4"
              fill="transparent"
              r="70"
              cx="80"
              cy="80"
              strokeDasharray="440"
              strokeDashoffset={440 - progress * 440}
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00FF80" />
                <stop offset="100%" stopColor="#00CC66" />
              </linearGradient>
            </defs>
          </svg>

          {/* Circle content */}
          <div className="circle-content">
            <div className="zp-label">ZP Balance</div>
            <div className="zp-value">{stateData.zpValue}</div>
            {stateData.isMining && (
              <div className="mining-progress">
                <span className="progress-indicator">+{Math.floor(miningReward * progress)}</span>
                <span className="progress-percentage">{Math.floor(progress * 100)}%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        className={`mining-action-button ${!stateData.buttonEnabled ? "disabled" : ""} ${currentState === 3 ? "claim" : ""}`}
        onClick={onClaim}
        disabled={!stateData.buttonEnabled || loading}
      >
        {loading ? (
          <span className="button-loading">
            <span className="spinner"></span>
            Processing...
          </span>
        ) : (
          stateData.buttonText
        )}
      </button>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}
    </div>
  )
}

export default MiningDisplay
