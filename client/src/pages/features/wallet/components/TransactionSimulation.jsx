"use client"

import { useState } from "react"
import { AlertTriangle, CheckCircle2, Smartphone, Cloud, ArrowRight } from "lucide-react"
import "./TransactionSimulation.css"

const TransactionSimulation = ({ onApprove, onCancel }) => {
  const [step, setStep] = useState("preview")
  const [biometricApproved, setBiometricApproved] = useState(false)

  const transaction = {
    type: "swap",
    from: { amount: 100, token: "ZIV" },
    to: { amount: 50, token: "TON" },
    warnings: ["Unlimited spend approval detected!"],
    fee: 0.5,
    feeToken: "ZIV",
  }

  return (
    <div className="transaction-simulation-modal">
      <div className="modal-overlay" onClick={onCancel}></div>
      <div className="modal-content">
        {step === "preview" && (
          <>
            <h2>Review Transaction</h2>
            <div className="transaction-preview">
              <div className="preview-item">
                <span className="label">Transaction Type</span>
                <span className="value">{transaction.type.toUpperCase()}</span>
              </div>
              <div className="preview-item">
                <span className="label">From</span>
                <span className="value">
                  {transaction.from.amount} {transaction.from.token}
                </span>
              </div>
              <div className="preview-item">
                <span className="label">To</span>
                <span className="value">
                  {transaction.to.amount} {transaction.to.token}
                </span>
              </div>
              <div className="preview-item">
                <span className="label">Estimated Fee</span>
                <span className="value">
                  {transaction.fee} {transaction.feeToken}
                </span>
              </div>
            </div>

            {transaction.warnings.length > 0 && (
              <div className="warnings-section">
                <div className="warning-header">
                  <AlertTriangle size={18} />
                  <span>Security Warnings</span>
                </div>
                {transaction.warnings.map((warning, i) => (
                  <div key={i} className="warning-item">
                    {warning}
                  </div>
                ))}
              </div>
            )}

            <div className="simulation-info">
              <p>This transaction will be simulated before signing to ensure safety.</p>
            </div>

            <div className="modal-actions">
              <button className="cancel-btn" onClick={onCancel}>
                Cancel
              </button>
              <button className="approve-btn" onClick={() => setStep("approval")}>
                Approve <ArrowRight size={18} />
              </button>
            </div>
          </>
        )}

        {step === "approval" && (
          <>
            <h2>Approve with MPC Shards</h2>
            <div className="approval-process">
              <div className="shard-approval">
                <div className="shard-icon">
                  <Smartphone size={32} />
                </div>
                <span>Device Shard</span>
                <span className="status approved">✓ Approved</span>
              </div>
              <div className="shard-connector"></div>
              <div className="shard-approval">
                <div className="shard-icon">
                  <Cloud size={32} />
                </div>
                <span>Server Shard</span>
                <span className="status pending">Pending...</span>
              </div>
            </div>

            <div className="biometric-section">
              <button
                className={`biometric-btn ${biometricApproved ? "approved" : ""}`}
                onClick={() => setBiometricApproved(!biometricApproved)}
              >
                {biometricApproved ? "✓ Biometric Verified" : "Verify with Biometric"}
              </button>
            </div>

            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setStep("preview")}>
                Back
              </button>
              <button
                className="approve-btn"
                disabled={!biometricApproved}
                onClick={() => {
                  onApprove?.()
                  setStep("confirmed")
                }}
              >
                Confirm <ArrowRight size={18} />
              </button>
            </div>
          </>
        )}

        {step === "confirmed" && (
          <>
            <div className="success-state">
              <CheckCircle2 size={48} />
              <h2>Transaction Confirmed</h2>
              <p className="tx-hash">Tx Hash: 0x742d...8f2a</p>
              <a href="#" className="explorer-link">
                View on Explorer
              </a>
            </div>
            <button className="close-btn" onClick={onCancel}>
              Close
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default TransactionSimulation
