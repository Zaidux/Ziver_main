"use client"

import { Eye, EyeOff, Copy } from "lucide-react"
import { useState } from "react"

const BalanceCard = ({ balance, showBalance, onToggleBalance }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText("UQBk...7dA5")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="balance-card">
      <div className="balance-header">
        <div className="balance-info">
          <p className="balance-label">Total Balance</p>
          <div className="balance-display">
            <h2 className="balance-amount">{showBalance ? `$${balance.toFixed(2)}` : "••••••"}</h2>
            <button className="toggle-visibility" onClick={onToggleBalance} aria-label="Toggle balance visibility">
              {showBalance ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </div>
        </div>
      </div>
      <div className="balance-footer">
        <p className="wallet-address">Your address: UQBk...7dA5</p>
        <button className="copy-btn" onClick={handleCopy}>
          <Copy size={14} />
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  )
}

export default BalanceCard
