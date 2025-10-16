"use client"

import React from "react"
import { Construction, Mail, Clock, Phone, Copy, Check } from "lucide-react"
import "./LockdownPage.css"

const LockdownPage = () => {
  const [copied, setCopied] = React.useState(false)

  const handleContactSupport = () => {
    // Create a proper mailto link that works on all devices
    const email = "ziverofficial567@gmail.com"
    const subject = "System Lockdown Support Request - Ziver App"
    const body =
      "Hello Ziver Support Team,\n\nI am contacting you regarding the system lockdown. Please assist me with the following:\n\n[Please describe your issue here]\n\nThank you.\n\nBest regards,\nZiver User"

    // Create a temporary link element to trigger the email client
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

    // Try to open the email client
    const emailWindow = window.open(mailtoLink, "_blank")

    // Fallback: If popup is blocked, show instructions
    if (!emailWindow || emailWindow.closed || typeof emailWindow.closed === "undefined") {
      alert(`Please email us at: ${email}\n\nWe'll get back to you as soon as possible!`)
    }
  }

  const handleCopyEmail = () => {
    navigator.clipboard
      .writeText("ziverofficial567@gmail.com")
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => {
        alert("Failed to copy email address")
      })
  }

  return (
    <div className="lockdown-container">
      <div className="lockdown-content">
        <div className="lockdown-icon">
          <Construction size={64} />
        </div>
        <h1 className="lockdown-title">System Under Maintenance</h1>
        <p className="lockdown-message">
          We're currently performing essential maintenance to improve your experience. Please check back shortly.
        </p>

        <div className="lockdown-details">
          <div className="detail-item">
            <Clock size={18} />
            <span>Estimated completion: 30-60 minutes</span>
          </div>
          <div className="detail-item">
            <Phone size={18} />
            <span>Contact support if this persists</span>
          </div>
        </div>

        <button className="support-button" onClick={handleContactSupport}>
          <Mail size={18} />
          <span>Contact Support</span>
        </button>

        <div className="support-email">
          <span>Email: </span>
          <button className="email-address" onClick={handleCopyEmail} title="Click to copy email">
            {copied ? (
              <>
                <Check size={14} />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>ziverofficial567@gmail.com</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default LockdownPage
