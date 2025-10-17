"use client"

import React from "react"
import { X, Copy, CheckCircle2 } from "lucide-react"
import "./ConnectWalletModal.css"

const ConnectWalletModal = ({ dappName, onConnect, onCancel }) => {
  const [copied, setCopied] = React.useState(false)
  const walletAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f8f2a"

  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="connect-wallet-modal">
      <div className="modal-content">
        <button className="close-btn" onClick={onCancel}>
          <X size={24} />
        </button>

        <div className="modal-header">
          <h2>Connect Wallet</h2>
          <p className="dapp-name">{dappName}</p>
        </div>

        <div className="wallet-info">
          <div className="wallet-address-box">
            <span className="label">Wallet Address</span>
            <div className="address-display">
              <code>{walletAddress}</code>
              <button className={`copy-btn ${copied ? "copied" : ""}`} onClick={handleCopy}>
                {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>

          <div className="permissions-section">
            <h3>Permissions</h3>
            <div className="permission-item">
              <input type="checkbox" id="view-balance" defaultChecked />
              <label htmlFor="view-balance">View account balance</label>
            </div>
            <div className="permission-item">
              <input type="checkbox" id="send-tx" defaultChecked />
              <label htmlFor="send-tx">Send transactions</label>
            </div>
            <div className="permission-item">
              <input type="checkbox" id="sign-msg" defaultChecked />
              <label htmlFor="sign-msg">Sign messages</label>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="connect-btn" onClick={onConnect}>
            Connect
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConnectWalletModal
