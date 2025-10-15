"use client"

import { useState, useEffect } from "react"
import { Clock, Zap, CheckCircle } from "lucide-react"
import "./MiningHub.css"
import MiningDisplay from"../components/MiningDisplay.jsx"

const MiningDisplay = ({ user, appSettings, miningStatus, onClaim, loading, error, currentState = 1 }) => {
  const [timeLeft, setTimeLeft] = useState(0)
  const [isClaimable, setIsClaimable] = useState(false)
  const [progress, setProgress] = useState(0)

  const miningCycleHours = Number.parseFloat(appSettings?.MINING_CYCLE_HOURS || "4")
  const MINING_CYCLE_MS = miningCycleHours * 60 * 60 * 1000
  const miningReward = Number.parseInt(appSettings?.MINING_REWARD || "50", 10)

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const getClockRotation = () => {
    return progress * 360
  }

  const getStateData = () => {
    switch (currentState) {
      case 1:
        return {
          title: "Ready to Mine",
          subtitle: "Start earning ZP rewards",
          isMining: false,
          progress: 0,
          buttonText: "Start Mining",
          buttonEnabled: true,
          icon: Clock,
          iconClass: "ready"
        }
      case 2:
        return {
          title: "Mining in Progress",
          subtitle: "Earning rewards...",
          isMining: true,
          progress: progress,
          buttonText: formatTime(timeLeft),
          buttonEnabled: false,
          icon: Zap,
          iconClass: "mining"
        }
      case 3:
        return {
          title: "Reward Ready!",
          subtitle: "Claim your earnings",
          isMining: false,
          progress: 1,
          buttonText: `Claim ${miningReward} ZP`,
          buttonEnabled: true,
          icon: CheckCircle,
          iconClass: "complete"
        }
      default:
        return getStateData(1)
    }
  }

  const stateData = getStateData()
  const StateIcon = stateData.icon

  useEffect(() => {
    if (miningStatus) {
      setIsClaimable(miningStatus.canClaim)
      setTimeLeft(miningStatus.timeRemaining)
      setProgress(miningStatus.progress || 0)
      return
    }

    if (!user?.mining_session_start_time) {
      setIsClaimable(false)
      setTimeLeft(0)
      setProgress(0)
      return
    }

    const interval = setInterval(() => {
      const startTime = new Date(user.mining_session_start_time).getTime()
      const now = new Date().getTime()
      const timePassed = now - startTime
      const remaining = MINING_CYCLE_MS - timePassed
      const currentProgress = timePassed / MINING_CYCLE_MS

      if (remaining <= 0) {
        setTimeLeft(0)
        setIsClaimable(true)
        setProgress(1)
        clearInterval(interval)
      } else {
        setTimeLeft(remaining)
        setIsClaimable(false)
        setProgress(currentProgress)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [user, MINING_CYCLE_MS, miningStatus])

  return (
    <div className="mining-display">
      <div className="mining-header">
        <h2 className="header-title">{stateData.title}</h2>
        <p className="header-subtitle">{stateData.subtitle}</p>
      </div>

      <div className="mining-clock-container">
        <div className={`mining-clock ${currentState === 3 ? "ringing" : ""}`}>
          {/* Progress Ring */}
          <div className="progress-ring-container">
            <svg className="progress-ring" width="200" height="200" viewBox="0 0 200 200">
              {/* Background circle */}
              <circle
                className="progress-ring-bg"
                cx="100"
                cy="100"
                r="90"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="8"
                fill="transparent"
              />
              
              {/* Progress circle */}
              <circle
                className={`progress-ring-fill ${stateData.iconClass}`}
                cx="100"
                cy="100"
                r="90"
                stroke="url(#progressGradient)"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray="565.48"
                strokeDashoffset={565.48 - (progress * 565.48)}
                strokeLinecap="round"
                transform="rotate(-90 100 100)"
              />
              
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00FF80" />
                  <stop offset="100%" stopColor="#00CC66" />
                </linearGradient>
              </defs>
            </svg>

            {/* Clock Center Content */}
            <div className="clock-center">
              <div className="clock-icon-wrapper">
                <StateIcon className={`clock-icon ${stateData.iconClass}`} size={36} />
              </div>
              
              {/* Time display for mining state */}
              {currentState === 2 && (
                <div className="time-display">
                  <span className="time-text">{formatTime(timeLeft)}</span>
                  <span className="time-label">remaining</span>
                </div>
              )}

              {/* Reward display for ready state */}
              {currentState === 3 && (
                <div className="reward-display">
                  <span className="reward-amount">+{miningReward}</span>
                  <span className="reward-label">ZP Ready</span>
                </div>
              )}
            </div>

            {/* Clock markers - simplified */}
            <div className="clock-markers">
              {[0, 90, 180, 270].map((degree, index) => (
                <div
                  key={index}
                  className="clock-marker"
                  style={{ transform: `rotate(${degree}deg)` }}
                />
              ))}
            </div>

            {/* Progress hand for mining state */}
            {currentState === 2 && (
              <div 
                className="progress-hand" 
                style={{ transform: `rotate(${getClockRotation()}deg)` }}
              >
                <div className="hand-line"></div>
                <div className="hand-tip"></div>
              </div>
            )}

            {/* Pulsing rings for complete state */}
            {currentState === 3 && (
              <>
                <div className="pulse-ring pulse-1"></div>
                <div className="pulse-ring pulse-2"></div>
                <div className="pulse-ring pulse-3"></div>
              </>
            )}
          </div>

          {/* Current Balance Display */}
          <div className="balance-display">
            <div className="balance-label">Current Balance</div>
            <div className="balance-amount">{user?.zp_balance || 0} ZP</div>
            {currentState === 2 && (
              <div className="mining-progress-text">
                <span className="progress-percent">{Math.floor(progress * 100)}%</span>
                <span className="progress-earning">+{Math.floor(miningReward * progress)} ZP</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="action-section">
        <button
          className={`mining-action-button ${stateData.iconClass} ${!stateData.buttonEnabled ? "disabled" : ""}`}
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
    </div>
  )
}

export default MiningDisplay