"use client"

import { useState, useEffect } from "react"
import { useNavigate, Link, useLocation } from "react-router-dom"
import { Zap, Gift, Shield, Eye, EyeOff, Sparkles } from "lucide-react"
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
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [urlReferralCode, setUrlReferralCode] = useState(null)
  const [referrerInfo, setReferrerInfo] = useState(null)
  const [checkingReferral, setCheckingReferral] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [smartReferrer, setSmartReferrer] = useState(null)
  const [checkingSmartReferral, setCheckingSmartReferral] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()
  const { login, loginWithGoogle } = useAuth()

  const { username, email, password, confirmPassword } = formData

  // Calculate effectiveReferralCode here so it can be used in dependencies
  const effectiveReferralCode = referralCode || urlReferralCode

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

  // Get smart referral when no referral code exists
useEffect(() => {
  const getSmartReferral = async () => {
    // Only proceed if no referral code exists and we're not already checking
    if (!effectiveReferralCode && !checkingSmartReferral && !smartReferrer) {
      setCheckingSmartReferral(true);
      try {
        console.log('Fetching smart referral suggestion...');
        const suggestion = await referralService.getSmartReferrerSuggestion();
        if (suggestion && suggestion.success) {
          console.log('Smart referrer found:', suggestion.referrer.username);
          setSmartReferrer(suggestion.referrer);
        } else {
          console.log('No smart referrer suggestion available');
        }
      } catch (error) {
        console.log("Error getting smart referrer suggestion:", error.message);
      } finally {
        setCheckingSmartReferral(false);
      }
    }
  };

  getSmartReferral();
}, [effectiveReferralCode]); // Remove checkingSmartReferral from dependencies to prevent loops

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

  // Determine which referral info to display
  const displayReferralInfo = effectiveReferralCode ? {
    type: 'manual',
    info: referrerInfo,
    code: effectiveReferralCode,
    checking: checkingReferral
  } : smartReferrer ? {
    type: 'smart',
    info: smartReferrer,
    code: smartReferrer.referral_code,
    checking: false
  } : null

  const handleChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }))
  }

  const loadGoogleScript = () => {
    return new Promise((resolve, reject) => {
      if (window.google) {
        resolve()
        return
      }

      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load Google script'))

      document.head.appendChild(script)
    })
  }

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    setError("");

    try {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

      if (!clientId) {
        throw new Error('Google Client ID is not configured. Please check your environment variables.');
      }

      console.log('Initializing Google Auth with Client ID:', clientId);

      await loadGoogleScript();

      await new Promise(resolve => setTimeout(resolve, 100));

      if (!window.google) {
        throw new Error('Google script failed to load');
      }

      if (!window.google.accounts) {
        throw new Error('Google accounts API not available');
      }

      const googleAuth = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile openid',
        callback: async (response) => {
          if (response.access_token) {
            try {
              console.log('Google auth successful, sending to backend...');

              const finalReferralCode = effectiveReferralCode || (smartReferrer ? smartReferrer.referral_code : null);
              const result = await authService.googleAuth(response.access_token, finalReferralCode);

              if (result.token && result.user) {
                await loginWithGoogle(result);
              }
            } catch (err) {
              console.error("Google auth backend error:", err);
              setError("Google authentication failed. Please try again.");
            } finally {
              setGoogleLoading(false);
            }
          } else {
            console.error("Google auth callback error:", response);
            setError("Google authentication was cancelled or failed.");
            setGoogleLoading(false);
          }
        },
      });

      googleAuth.requestAccessToken();
    } catch (error) {
      console.error("Google signup initialization error:", error);
      setError(`Google sign-in failed: ${error.message}`);
      setGoogleLoading(false);
    }
  };

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
      const finalReferralCode = effectiveReferralCode || (smartReferrer ? smartReferrer.referral_code : null);
      const response = await authService.register(username, email, password, finalReferralCode)

      sessionStorage.removeItem("referralCode")
      localStorage.removeItem("ziver_referral_code")

      if (finalReferralCode) {
        try {
          await referralService.clearPendingReferral(finalReferralCode)
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
          <div className="logo">
            <Zap size={32} className="logo-icon" />
            ZIVER
          </div>
          <h1>Join the Revolution</h1>
          <p>Start earning ZP tokens today</p>
        </div>

        {displayReferralInfo && (
          <div className={`referral-banner ${displayReferralInfo.type} ${displayReferralInfo.info ? "valid" : displayReferralInfo.checking ? "checking" : "invalid"}`}>
            <Gift size={20} className="referral-icon" />
            {displayReferralInfo.checking ? (
              <span>Checking referral code...</span>
            ) : displayReferralInfo.info ? (
              <div className="referral-info">
                <span>
                  {displayReferralInfo.type === 'smart' ? (
                    <>System matched you with: <strong>@{displayReferralInfo.info.username}</strong></>
                  ) : (
                    <>Referred by: <strong>@{displayReferralInfo.info.username}</strong></>
                  )}
                </span>
                <span className="bonus-badge">+100 ZP Bonus</span>
                {displayReferralInfo.type === 'smart' && (
                  <span className="smart-badge">
                    <Sparkles size={12} />
                    Smart Match
                  </span>
                )}
              </div>
            ) : (
              <span>Referral code: {displayReferralInfo.code}</span>
            )}
          </div>
        )}

        {checkingSmartReferral && !displayReferralInfo && (
          <div className="referral-banner checking">
            <div className="button-loading">
              <div className="spinner"></div>
              Finding best community match...
            </div>
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
          <button 
            className={`social-btn google ${googleLoading ? 'loading' : ''}`} 
            onClick={handleGoogleSignup} 
            type="button" 
            disabled={loading || googleLoading}
          >
            {googleLoading ? (
              <div className="button-loading">
                <div className="spinner"></div>
                Connecting...
              </div>
            ) : (
              <>
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
              </>
            )}
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
              disabled={loading || googleLoading}
            />
            {referrerInfo && (
              <div className="referral-note">
                <Sparkles size={14} />
                Welcome! You were referred by @{referrerInfo.username}
              </div>
            )}
            {smartReferrer && !referrerInfo && (
              <div className="referral-note smart">
                <Sparkles size={14} />
                Welcome! The system matched you with @{smartReferrer.username} from our community
              </div>
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
              disabled={loading || googleLoading}
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
                disabled={loading || googleLoading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
                disabled={loading || googleLoading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
                disabled={loading || googleLoading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex="-1"
                disabled={loading || googleLoading}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="register-button" disabled={loading || checkingReferral || googleLoading}>
            {loading ? (
              <div className="button-loading">
                <div className="spinner"></div>
                Creating Account...
              </div>
            ) : checkingReferral ? (
              "Checking Referral..."
            ) : referrerInfo ? (
              `Join & Get 100 ZP from @${referrerInfo.username}`
            ) : smartReferrer ? (
              `Join with ${smartReferrer.username}'s Community`
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
            <Shield size={16} />
            Your data is securely encrypted
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage