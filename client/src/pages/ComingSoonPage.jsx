"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { Rocket, Lock, Unlock, Eye, EyeOff, CheckCircle2, ArrowLeft } from "lucide-react"
import "./ComingSoonPage.css"

const ComingSoonPage = ({ featureName = "this feature", children }) => {
  const { user } = useAuth()
  const isAdminOrTester = user?.role === "ADMIN" || user?.role === "TESTER"
  const [showRealContent, setShowRealContent] = useState(false)

  // Check if admin previously enabled bypass for this feature
  useEffect(() => {
    if (isAdminOrTester) {
      const savedState = localStorage.getItem(`admin-bypass-${featureName}`)
      if (savedState === "true") {
        setShowRealContent(true)
      }
    }
  }, [isAdminOrTester, featureName])

  const toggleBypass = () => {
    const newState = !showRealContent
    setShowRealContent(newState)
    localStorage.setItem(`admin-bypass-${featureName}`, newState.toString())
  }

  // If admin has enabled bypass AND there's children content, show the real page
  if (showRealContent && children) {
    return (
      <div className="admin-bypass-mode">
        <div className="admin-bypass-header">
          <div className="bypass-indicator">
            <Unlock size={18} />
            <span>ADMIN MODE: Viewing {featureName}</span>
          </div>
          <button className="bypass-toggle-btn" onClick={toggleBypass}>
            <EyeOff size={16} />
            <span>Hide Content</span>
          </button>
        </div>
        {children}
      </div>
    )
  }

  return (
    <div className={`coming-soon-container ${isAdminOrTester ? "admin-view" : ""}`}>
      <div className="coming-soon-content">
        <div className="coming-soon-icon">
          <Rocket size={64} />
        </div>
        <h1 className="coming-soon-title">Coming Soon</h1>
        <p className="coming-soon-message">{featureName} is under development and will be available shortly!</p>

        {isAdminOrTester ? (
          <div className="admin-notice">
            <p className="admin-message">
              <Lock size={16} />
              Hello {user.role}! You have special access to this page.
            </p>

            {/* Admin Bypass Button */}
            <div className="admin-bypass-controls">
              <button className="bypass-toggle-btn" onClick={toggleBypass}>
                {showRealContent ? (
                  <>
                    <EyeOff size={16} />
                    <span>Hide Real Content</span>
                  </>
                ) : (
                  <>
                    <Eye size={16} />
                    <span>Show Real Content</span>
                  </>
                )}
              </button>
              {children && (
                <p className="bypass-hint">
                  {showRealContent
                    ? "You are viewing the actual page content."
                    : "Click above to view the actual page content."}
                </p>
              )}
            </div>

            <div className="feature-preview">
              <h3>Feature Preview:</h3>
              <p>This will be the {featureName.toLowerCase()} section with advanced functionality.</p>
              <ul>
                <li>
                  <CheckCircle2 size={16} />
                  <span>Advanced user dashboard</span>
                </li>
                <li>
                  <CheckCircle2 size={16} />
                  <span>Real-time analytics</span>
                </li>
                <li>
                  <CheckCircle2 size={16} />
                  <span>Management tools</span>
                </li>
                <li>
                  <CheckCircle2 size={16} />
                  <span>Integration features</span>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="user-notice">
            <p className="user-message">We're working hard to bring you an amazing experience. Stay tuned!</p>
            <div className="countdown">
              <p>
                Launching in: <span className="countdown-timer">Q4 2025</span>
              </p>
            </div>
          </div>
        )}

        <button className="back-button" onClick={() => window.history.back()}>
          <ArrowLeft size={18} />
          <span>Go Back</span>
        </button>
      </div>
    </div>
  )
}

export default ComingSoonPage
