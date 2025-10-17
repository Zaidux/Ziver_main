"use client"

import { useState } from "react"
import { Users, Zap, Shield, Download } from "lucide-react"
import "./WalletSettings.css"

const WalletSettings = () => {
  const [activeTab, setActiveTab] = useState("security")
  const [showAuditLog, setShowAuditLog] = useState(false)
  const [guardians] = useState([
    { email: "guardian1@example.com", status: "active", joinedDate: "2024-01-15" },
    { email: "guardian2@example.com", status: "active", joinedDate: "2024-01-15" },
    { email: "guardian3@example.com", status: "pending", joinedDate: "2024-01-20" },
  ])

  const auditLog = [
    { action: "Shard access", status: "Success", timestamp: "2 hours ago" },
    { action: "Transaction signed", status: "Success", timestamp: "5 hours ago" },
    { action: "Biometric verified", status: "Success", timestamp: "1 day ago" },
    { action: "Guardian added", status: "Success", timestamp: "3 days ago" },
  ]

  return (
    <div className="wallet-settings">
      <h1>Wallet Settings</h1>

      <div className="settings-tabs">
        <button className={`tab ${activeTab === "security" ? "active" : ""}`} onClick={() => setActiveTab("security")}>
          <Shield size={18} />
          Security
        </button>
        <button className={`tab ${activeTab === "recovery" ? "active" : ""}`} onClick={() => setActiveTab("recovery")}>
          <Users size={18} />
          Recovery
        </button>
        <button className={`tab ${activeTab === "policies" ? "active" : ""}`} onClick={() => setActiveTab("policies")}>
          <Zap size={18} />
          Policies
        </button>
      </div>

      <div className="settings-content">
        {activeTab === "security" && (
          <div className="security-settings">
            <div className="setting-card">
              <h3>Biometric Authentication</h3>
              <p>Use Face ID or Fingerprint to approve transactions</p>
              <label className="toggle">
                <input type="checkbox" defaultChecked />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-card">
              <h3>Dark Mode</h3>
              <p>Enable dark theme for the wallet interface</p>
              <label className="toggle">
                <input type="checkbox" defaultChecked />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-card">
              <h3>Notifications</h3>
              <p>Receive alerts for transactions and security events</p>
              <label className="toggle">
                <input type="checkbox" defaultChecked />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-card">
              <h3>Security Audit Log</h3>
              <button className="view-log-btn" onClick={() => setShowAuditLog(!showAuditLog)}>
                {showAuditLog ? "Hide Log" : "View Log"}
              </button>
              {showAuditLog && (
                <div className="audit-log">
                  {auditLog.map((entry, i) => (
                    <div key={i} className="log-entry">
                      <div className="log-info">
                        <span className="log-action">{entry.action}</span>
                        <span className="log-time">{entry.timestamp}</span>
                      </div>
                      <span className={`log-status ${entry.status.toLowerCase()}`}>{entry.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="setting-card danger">
              <h3>Export Private Data</h3>
              <p>Download encrypted wallet data (redacted for security)</p>
              <button className="export-btn">
                <Download size={18} />
                Export Data
              </button>
            </div>
          </div>
        )}

        {activeTab === "recovery" && (
          <div className="recovery-settings">
            <div className="setting-card">
              <h3>Recovery Guardians</h3>
              <p>Manage trusted guardians for wallet recovery</p>
              <div className="guardians-list">
                {guardians.map((g, i) => (
                  <div key={i} className="guardian-entry">
                    <div className="guardian-info">
                      <span className="guardian-email">{g.email}</span>
                      <span className="guardian-date">Joined {g.joinedDate}</span>
                    </div>
                    <span className={`guardian-status ${g.status}`}>{g.status}</span>
                  </div>
                ))}
              </div>
              <button className="add-guardian-btn">+ Add Guardian</button>
            </div>

            <div className="setting-card">
              <h3>Initiate Recovery</h3>
              <p>Recover your wallet if your device is lost</p>
              <button className="recovery-btn">Start Recovery Process</button>
            </div>
          </div>
        )}

        {activeTab === "policies" && (
          <div className="policies-settings">
            <div className="setting-card">
              <h3>Daily Spending Limit</h3>
              <p>Set maximum daily transaction amount</p>
              <div className="policy-input">
                <input type="number" placeholder="1000" />
                <select>
                  <option>ZIV</option>
                  <option>TON</option>
                  <option>USDT</option>
                </select>
              </div>
            </div>

            <div className="setting-card">
              <h3>Whitelist Addresses</h3>
              <p>Only allow transactions to whitelisted addresses</p>
              <div className="whitelist-section">
                <input type="text" placeholder="Add address..." />
                <button>Add</button>
              </div>
              <div className="whitelist-list">
                <div className="whitelist-item">0x742d...8f2a</div>
              </div>
            </div>

            <div className="setting-card">
              <h3>Large Transaction Rules</h3>
              <p>Require guardian approval for large transactions</p>
              <div className="policy-input">
                <input type="number" placeholder="5000" />
                <label className="toggle">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                  <span>Require Guardian Approval</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default WalletSettings
