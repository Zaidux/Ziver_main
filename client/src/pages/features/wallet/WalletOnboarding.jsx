"use client"

import { useState } from "react"
import { Lock, Smartphone, Cloud, Key, Fingerprint, Users, CheckCircle2, ArrowRight } from "lucide-react"
import "./WalletOnboarding.css"

const WalletOnboarding = ({ onComplete }) => {
  const [step, setStep] = useState(1)
  const [guardians, setGuardians] = useState([])
  const [socialScore] = useState(75)
  const [biometricEnabled, setBiometricEnabled] = useState(false)

  const handleAddGuardian = (email) => {
    if (email && !guardians.find((g) => g.email === email)) {
      setGuardians([...guardians, { email, status: "pending" }])
    }
  }

  const handleNext = () => {
    if (step < 4) setStep(step + 1)
    else onComplete?.()
  }

  return (
    <div className="wallet-onboarding">
      {/* Step 1: Welcome */}
      {step === 1 && (
        <div className="onboarding-step welcome-step">
          <div className="step-icon">🚀</div>
          <h1>Create Your Secure Wallet</h1>
          <p className="tagline">Institutional-grade security, everyday ease.</p>
          <div className="security-features">
            <div className="feature">
              <Lock size={24} />
              <span>MPC-Secured Keys</span>
            </div>
            <div className="feature">
              <Users size={24} />
              <span>Social Recovery</span>
            </div>
            <div className="feature">
              <Smartphone size={24} />
              <span>Biometric Auth</span>
            </div>
          </div>
          <button className="cta-button" onClick={handleNext}>
            Get Started <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* Step 2: Biometric Setup */}
      {step === 2 && (
        <div className="onboarding-step biometric-step">
          <div className="step-icon animated">
            <Fingerprint size={48} />
          </div>
          <h2>Enable Biometric Security</h2>
          <p>Secure your wallet with Face ID or Fingerprint</p>
          <button
            className={`biometric-button ${biometricEnabled ? "enabled" : ""}`}
            onClick={() => setBiometricEnabled(!biometricEnabled)}
          >
            {biometricEnabled ? "✓ Biometric Enabled" : "Enable Biometric"}
          </button>
          <p className="step-info">You can skip this and set it up later</p>
          <button className="next-button" onClick={handleNext}>
            Continue <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* Step 3: Guardian Nomination */}
      {step === 3 && (
        <div className="onboarding-step guardians-step">
          <h2>Add Recovery Guardians</h2>
          <div className="social-score-badge">
            <span>
              Your Social Capital Score: <strong>{socialScore}</strong>
            </span>
            <p>Higher score unlocks advanced recovery options</p>
          </div>
          <div className="guardians-form">
            <input
              type="email"
              placeholder="Add guardian email"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleAddGuardian(e.target.value)
                  e.target.value = ""
                }
              }}
            />
            <p className="form-hint">Add 3-5 trusted guardians (minimum 3 required)</p>
          </div>
          <div className="guardians-list">
            {guardians.map((g, i) => (
              <div key={i} className="guardian-item">
                <Users size={18} />
                <span>{g.email}</span>
                <span className="status">{g.status}</span>
              </div>
            ))}
          </div>
          {guardians.length >= 3 && (
            <button className="next-button" onClick={handleNext}>
              Continue <ArrowRight size={18} />
            </button>
          )}
        </div>
      )}

      {/* Step 4: Shard Distribution */}
      {step === 4 && (
        <div className="onboarding-step shards-step">
          <h2>Distributing Security Shards</h2>
          <div className="shards-visualization">
            <div className="shard shard-hot">
              <Smartphone size={32} />
              <span>Hot Shard</span>
              <p>Your Device</p>
            </div>
            <div className="shard shard-security">
              <Cloud size={32} />
              <span>Security Shard</span>
              <p>Ziver Servers</p>
            </div>
            <div className="shard shard-recovery">
              <Key size={32} />
              <span>Recovery Shard</span>
              <p>Cloud Guardian</p>
            </div>
          </div>
          <div className="progress-bar">
            <div className="progress-fill"></div>
          </div>
          <p className="distribution-status">Shards distributed successfully!</p>
          <div className="success-message">
            <CheckCircle2 size={24} />
            <span>Your wallet is ready to use</span>
          </div>
          <button className="cta-button" onClick={handleNext}>
            View Wallet <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* Step Indicator */}
      <div className="step-indicator">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className={`step-dot ${s === step ? "active" : ""} ${s < step ? "completed" : ""}`} />
        ))}
      </div>
    </div>
  )
}

export default WalletOnboarding
