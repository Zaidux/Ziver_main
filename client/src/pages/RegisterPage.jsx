"use client"

import { useState, useEffect } from "react"
import { useNavigate, Link, useLocation } from "react-router-dom"
import authService from "../services/authService"
import referralService from "../services/referralService"
import { useTelegramReferral } from "../hooks/useTelegramReferral"
import { useAuth } from "../context/AuthContext"
import "./RegisterPage.css"

function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const { referralCode, isTelegram, telegramUser } = useTelegramReferral()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [urlReferralCode, setUrlReferralCode] = useState(null)
  const [referrerInfo, setReferrerInfo] = useState(null)
  const [checkingReferral, setCheckingReferral] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const { username, email, password, confirmPassword } = formData

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const ref = searchParams.get("ref")
    if (ref) {
      setUrlReferralCode(ref)
      sessionStorage.setItem("referralCode", ref)
      validateReferralCode(ref)
    }
  }, [location])

  useEffect(() => {
    if (referralCode && !urlReferralCode) {
      validateReferralCode(referralCode)
    }
  }, [referralCode, urlReferralCode])

  const validateReferralCode = async (code) => {
    if (!code) return
    setCheckingReferral(true)
    try {
      const response = await referralService.getReferrerInfo(code)
      if (response.success && response.referrer) {
        setReferrerInfo(response.referrer)
      } else {
        setReferrerInfo(null)
      }
    } catch (error) {
      console.error("Error validating referral code:", error)
      setReferrerInfo(null)
    } finally {
      setCheckingReferral(false)
    }
  }

  const effectiveReferralCode = referralCode || urlReferralCode

  const handleChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }))
  }

  const handleGoogleSignup = () => {
    // Redirect to backend Google OAuth endpoint
    window.location.href = `${process.env.REACT_APP_API_URL || 'https://ziver-api.onrender.com'}/api/auth/google`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setRegistrationSuccess(false)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }
    if (username.length < 3) {
      setError("Username must be at least 3 characters")
      return
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email address")
      return
    }

    setLoading(true)
    try {
      const response = await authService.register(username, email, password, effectiveReferralCode)

      sessionStorage.removeItem("referralCode")
      localStorage.removeItem("ziver_referral_code")

      if (effectiveReferralCode) {
        try {
          await referralService.clearPendingReferral(effectiveReferralCode)
        } catch (clearError) {
          console.log("Note: Could not clear pending referral:", clearError)
        }
      }

      setRegistrationSuccess(true)

      let successMessage = "Account created successfully!"
      if (response.referralApplied && response.referrer) {
        successMessage += ` You received 100 ZP bonus from ${response.referrer.username}!`
      }

      if (response.token && response.user) {
        login(response.token, response.user)
        setTimeout(() => {
          navigate("/mining", {
            state: {
              message: successMessage,
              showWelcome: true,
            },
          })
        }, 1000)
      } else {
        navigate("/login", {
          state: { message: successMessage },
        })
      }
    } catch (err) {
      console.error("Registration error details:", err)
      let errorMessage = "Registration failed. Please try again."
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      }
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <div className="logo">⚡ ZIVER</div>
          <h1>Join the Revolution</h1>
          <p>Start earning ZP tokens today</p>
        </div>

        {effectiveReferralCode && (
          <div className={`referral-banner ${referrerInfo ? "valid" : checkingReferral ? "checking" : "invalid"}`}>
            <span className="referral-icon">🎁</span>
            {checkingReferral ? (
              <span>Checking referral code...</span>
            ) : referrerInfo ? (
              <div className="referral-info">
                <span>
                  Referred by: <strong>@{referrerInfo.username}</strong>
                </span>
                <span className="bonus-badge">+100 ZP Bonus</span>
              </div>
            ) : (
              <span>Referral code: {effectiveReferralCode}</span>
            )}
          </div>
        )}

        {isTelegram && (
          <div className="telegram-badge">
            <span className="tg-icon">📱</span>
            Joining via Telegram
          </div>
        )}

        {registrationSuccess && <div className="success-message">✅ Account created successfully! Redirecting...</div>}

        <div className="social-signup">
          <button className="social-btn google" onClick={handleGoogleSignup} type="button" disabled={loading}>
            <svg className="social-icon" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>
        </div>

        <div className="divider">
          <span>or sign up with email</span>
        </div>

        <form className="register-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={username}
              onChange={handleChange}
              placeholder={referrerInfo ? `Friend of ${referrerInfo.username}` : "Choose a username"}
              required
              minLength="3"
              maxLength="20"
              className={`modern-input ${referrerInfo ? "referral-username" : ""}`}
              disabled={loading}
            />
            {referrerInfo && (
              <div className="referral-note">✨ Welcome! You were referred by @{referrerInfo.username}</div>
            )}
          </div>

          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
              className="modern-input"
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                required
                minLength="6"
                className="modern-input"
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
                disabled={loading}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="password-input-container">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
                minLength="6"
                className="modern-input"
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex="-1"
                disabled={loading}
              >
                {showConfirmPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button type="submit" className="register-button" disabled={loading || checkingReferral}>
            {loading ? (
              <div className="button-loading">
                <div className="spinner"></div>
                Creating Account...
              </div>
            ) : checkingReferral ? (
              "Checking Referral..."
            ) : referrerInfo ? (
              `Join & Get 100 ZP from @${referrerInfo.username}`
            ) : effectiveReferralCode ? (
              "Join with Referral Bonus"
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="register-footer">
          <p>
            Already have an account?{" "}
            <Link to="/login" className="login-link">
              Sign In
            </Link>
          </p>
          <div className="security-note">
            <span className="shield-icon">🛡️</span>
            Your data is securely encrypted
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage