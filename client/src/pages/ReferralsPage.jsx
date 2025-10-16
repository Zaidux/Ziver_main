"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import api from "../services/api"
import LoadingScreen from "../components/LoadingScreen"
import {
  Users,
  Copy,
  Share2,
  CheckCircle2,
  AlertCircle,
  Send,
  MessageCircle,
  Twitter,
  LinkIcon,
  Zap,
  TrendingUp,
  Flame,
  UserPlus,
  Gift,
  Info,
} from "lucide-react"
import "./ReferralsPage.css"

const ReferralsPage = () => {
  const { user, referralData, refreshReferralData } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [copySuccess, setCopySuccess] = useState("")
  const [activeTab, setActiveTab] = useState("referrals")

  // Telegram connection states
  const [telegramConnected, setTelegramConnected] = useState(false)
  const [connectionCode, setConnectionCode] = useState("")
  const [verifyingCode, setVerifyingCode] = useState(false)
  const [telegramLoading, setTelegramLoading] = useState(false)

  useEffect(() => {
    fetchData()
    checkTelegramStatus()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError("")
      await refreshReferralData()
    } catch (error) {
      console.error("Failed to fetch referral data", error)
      setError("Failed to load referral data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const checkTelegramStatus = async () => {
    try {
      setTelegramLoading(true)
      const response = await api.get("/telegram/connection-status")
      setTelegramConnected(response.data.hasTelegram)
    } catch (error) {
      console.error("Error checking Telegram status:", error)
    } finally {
      setTelegramLoading(false)
    }
  }

  const verifyConnectionCode = async () => {
    if (!connectionCode.trim()) {
      setError("Please enter the connection code")
      return
    }
    setVerifyingCode(true)
    try {
      const response = await api.post("/telegram/verify-connection", {
        connectionCode: connectionCode.trim(),
      })
      setCopySuccess("Telegram connected successfully!")
      setConnectionCode("")
      await checkTelegramStatus()
    } catch (error) {
      console.error("Error verifying connection code:", error)
      setError(error.response?.data?.message || "Failed to verify connection code")
    } finally {
      setVerifyingCode(false)
    }
  }

  const disconnectTelegram = async () => {
    try {
      await api.post("/telegram/disconnect")
      setTelegramConnected(false)
      setCopySuccess("Telegram disconnected successfully")
    } catch (error) {
      console.error("Error disconnecting Telegram:", error)
      setError("Failed to disconnect Telegram")
    }
  }

  const handleCopyLink = () => {
    if (!referralData?.referralCode) {
      setError("No referral code available")
      return
    }
    const link = `https://t.me/Zivurlbot?start=${referralData.referralCode}`
    navigator.clipboard
      .writeText(link)
      .then(() => {
        setCopySuccess("Referral link copied to clipboard!")
        setTimeout(() => setCopySuccess(""), 3000)
      })
      .catch(() => {
        setError("Failed to copy link")
      })
  }

  const handleShare = async (platform) => {
    if (!referralData?.referralCode) {
      setError("No referral code available")
      return
    }
    const link = `https://t.me/Zivurlbot?start=${referralData.referralCode}`
    const message = `Join me on Ziver and earn ZP tokens! Use my referral code: ${referralData.referralCode}`

    switch (platform) {
      case "telegram":
        window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(message)}`)
        break
      case "whatsapp":
        window.open(`https://wa.me/?text=${encodeURIComponent(message + " " + link)}`)
        break
      case "twitter":
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message + " " + link)}`)
        break
      default:
        navigator.clipboard.writeText(link)
        setCopySuccess("Referral link copied!")
        setTimeout(() => setCopySuccess(""), 2000)
    }
  }

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return "Never active"
    const now = new Date()
    const lastSeen = new Date(timestamp)
    const diffDays = Math.floor((now - lastSeen) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return `${Math.floor(diffDays / 30)} months ago`
  }

  if (loading) {
    return <LoadingScreen message="Loading your referrals..." />
  }

  return (
    <div className="referrals-container">
      {/* Header Section */}
      <div className="referrals-header">
        <div className="header-content">
          <h1>Invite Friends</h1>
          <p>Earn 150 ZP for each friend who joins and mines</p>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <Users size={20} className="stat-icon" />
            <div className="stat-info">
              <span className="stat-number">{referralData?.referralCount || 0}</span>
              <span className="stat-label">Referrals</span>
            </div>
          </div>
          <div className="stat-card earnings">
            <Zap size={20} className="stat-icon" />
            <div className="stat-info">
              <span className="stat-number">+{referralData?.totalEarnings || 0}</span>
              <span className="stat-label">ZP Earned</span>
            </div>
          </div>
        </div>
      </div>

      {/* Copy Success Notification */}
      {copySuccess && (
        <div className="copy-success-notification">
          <CheckCircle2 size={16} />
          {copySuccess}
        </div>
      )}

      {error && (
        <div className="error-message">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Telegram Connection Section */}
      <div className="referral-card telegram-card">
        <div className="card-header">
          <Send size={20} />
          <h3>Connect Telegram</h3>
          <div className="premium-badge">BOT</div>
        </div>
        {telegramLoading ? (
          <LoadingScreen type="inline" message="Checking Telegram connection..." />
        ) : telegramConnected ? (
          <div className="telegram-connected">
            <div className="connection-status">
              <CheckCircle2 size={20} className="status-icon" />
              <div className="status-info">
                <span className="status-indicator">Connected</span>
                <p>
                  Your Telegram account is linked! You'll receive notifications for new referrals and mining
                  completions.
                </p>
              </div>
            </div>
            <button onClick={disconnectTelegram} className="btn btn-secondary disconnect-btn">
              Disconnect Telegram
            </button>
          </div>
        ) : (
          <div className="telegram-connection">
            <div className="connection-steps">
              <p>Connect your Telegram to get notifications and share referrals easily!</p>
              <div className="connection-instructions">
                <h4>How to connect:</h4>
                <ol>
                  <li>
                    Go to <strong>@Zivurlbot</strong> on Telegram
                  </li>
                  <li>
                    Send the command: <code>/connect</code>
                  </li>
                  <li>Copy the 6-digit code from the bot</li>
                  <li>Enter it below to verify</li>
                </ol>
              </div>
              <div className="code-input-section">
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={connectionCode}
                  onChange={(e) => setConnectionCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="code-input"
                  maxLength={6}
                />
                <button
                  onClick={verifyConnectionCode}
                  disabled={verifyingCode || connectionCode.length !== 6}
                  className="btn btn-primary verify-btn"
                >
                  {verifyingCode ? (
                    <div className="button-loading">
                      <div className="button-spinner"></div>
                      Verifying...
                    </div>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      Verify Connection
                    </>
                  )}
                </button>
              </div>
              <p className="code-note">
                <Info size={14} />
                Code expires in 10 minutes
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Referral Link Card */}
      <div className="referral-card main-card">
        <div className="card-header">
          <LinkIcon size={20} />
          <h3>Your Referral Link</h3>
          <div className="premium-badge">PRO</div>
        </div>
        <div className="referral-link-container">
          <div className="referral-link-display">
            <span className="link-text">t.me/Zivurlbot?start={referralData?.referralCode || "Loading..."}</span>
            <button onClick={handleCopyLink} className="copy-button modern" disabled={!referralData?.referralCode}>
              {copySuccess.includes("Referral link") ? (
                <>
                  <CheckCircle2 size={16} />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={16} />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>
        <div className="share-buttons">
          <p>
            <Share2 size={16} />
            Share via:
          </p>
          <div className="share-options">
            <button onClick={() => handleShare("telegram")} className="share-btn telegram">
              <Send size={18} />
              Telegram
            </button>
            <button onClick={() => handleShare("whatsapp")} className="share-btn whatsapp">
              <MessageCircle size={18} />
              WhatsApp
            </button>
            <button onClick={() => handleShare("twitter")} className="share-btn twitter">
              <Twitter size={18} />
              Twitter
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button className={activeTab === "referrals" ? "tab active" : "tab"} onClick={() => setActiveTab("referrals")}>
          <Users size={18} />
          My Referrals ({referralData?.referrals?.length || 0})
        </button>
        <button className={activeTab === "how" ? "tab active" : "tab"} onClick={() => setActiveTab("how")}>
          <Info size={18} />
          How It Works
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "referrals" ? (
        <div className="referrals-list">
          {referralData?.referrals?.length === 0 ? (
            <div className="empty-state">
              <UserPlus size={64} className="empty-icon" />
              <h3>No referrals yet</h3>
              <p>Share your link to start earning ZP rewards!</p>
            </div>
          ) : (
            referralData?.referrals?.map((ref, index) => (
              <div key={ref.id} className="referral-item">
                <div className="referral-avatar">{ref.username?.charAt(0).toUpperCase() || "U"}</div>
                <div className="referral-info">
                  <h4>{ref.username}</h4>
                  <p>Joined {new Date(ref.created_at).toLocaleDateString()}</p>
                  <span className="last-seen">Last active: {formatLastSeen(ref.last_seen)}</span>
                </div>
                <div className="referral-stats">
                  <div className="zp-badge">
                    <Zap size={14} />
                    +150
                  </div>
                  <div className="streak">
                    <Flame size={14} />
                    {ref.daily_streak_count || 0}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="how-it-works">
          <div className="step">
            <div className="step-number">
              <Share2 size={20} />
            </div>
            <div className="step-content">
              <h4>Share Your Link</h4>
              <p>Copy your unique referral link and share it with friends</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">
              <UserPlus size={20} />
            </div>
            <div className="step-content">
              <h4>Friends Join</h4>
              <p>Your friends sign up using your referral link</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">
              <Gift size={20} />
            </div>
            <div className="step-content">
              <h4>Earn Rewards</h4>
              <p>Get 150 ZP for each friend who starts mining</p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="progress-section">
        <div className="progress-header">
          <span>
            <TrendingUp size={16} />
            Referral Progress
          </span>
          <span>{referralData?.referralCount || 0}/50</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${((referralData?.referralCount || 0) / 50) * 100}%` }}></div>
        </div>
        <p className="progress-note">Max 50 referrals allowed</p>
      </div>
    </div>
  )
}

export default ReferralsPage
