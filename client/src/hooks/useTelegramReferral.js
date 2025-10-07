import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import referralService from '../services/referralService';

// Telegram initialization utility
const initializeTelegramWebApp = () => {
  if (window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp;
    
    // Expand the app to full height
    tg.expand();
    
    // Enable closing confirmation
    tg.enableClosingConfirmation();
    
    // Set theme params if available
    if (tg.themeParams) {
      document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#1a1a1a');
      document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#ffffff');
      document.documentElement.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color || '#00e676');
    }
    
    console.log('Telegram Web App initialized:', {
      platform: tg.platform,
      version: tg.version,
      user: tg.initDataUnsafe?.user
    });
    
    return tg;
  }
  return null;
};

// Get Telegram user info
const getTelegramUser = () => {
  if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
    return window.Telegram.WebApp.initDataUnsafe.user;
  }
  return null;
};

// Enhanced Telegram detection
const isTelegramWebApp = () => {
  // Multiple detection methods for Telegram
  if (window.Telegram?.WebApp) {
    return true;
  }
  
  // Check for Telegram-specific URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('tgWebAppStartParam') || urlParams.has('startapp')) {
    return true;
  }
  
  // Check user agent
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes('telegram')) {
    return true;
  }
  
  // Check referrer
  if (document.referrer.includes('t.me') || document.referrer.includes('telegram.org')) {
    return true;
  }
  
  return false;
};

export const useTelegramReferral = () => {
  const [searchParams] = useSearchParams();
  const [referralCode, setReferralCode] = useState(null);
  const [referrerInfo, setReferrerInfo] = useState(null);
  const [isTelegram, setIsTelegram] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [telegramUser, setTelegramUser] = useState(null);

  useEffect(() => {
    const detectReferralAndTelegram = async () => {
      try {
        setIsLoading(true);

        // Initialize Telegram Web App if detected
        const tg = initializeTelegramWebApp();
        const tgUser = getTelegramUser();
        
        if (tgUser) {
          setTelegramUser(tgUser);
          setIsTelegram(true);
          console.log('Telegram user detected:', tgUser);
        }

        // Check for referral code in URL parameters first
        const urlRef = searchParams.get('ref') || searchParams.get('start');

        // Then check storage
        const storageRef = localStorage.getItem('ziver_referral_code') || 
                          sessionStorage.getItem('referralCode');

        // Check Telegram start parameter
        let tgStartParam = null;
        if (tg?.initDataUnsafe?.start_param) {
          tgStartParam = tg.initDataUnsafe.start_param;
        }

        const effectiveRef = urlRef || storageRef || tgStartParam;

        if (effectiveRef) {
          setReferralCode(effectiveRef);
          console.log('Referral code detected:', effectiveRef, 'source:', {
            url: urlRef,
            storage: storageRef,
            telegram: tgStartParam
          });

          // Store in both storage for persistence
          localStorage.setItem('ziver_referral_code', effectiveRef);
          sessionStorage.setItem('referralCode', effectiveRef);

          // Fetch referrer information
          try {
            const referrerData = await referralService.getReferrerInfo(effectiveRef);
            if (referrerData.success && referrerData.referrer) {
              setReferrerInfo(referrerData.referrer);
              console.log('Referrer found:', referrerData.referrer.username);
            } else {
              console.log('No referrer found for code:', effectiveRef);
              setReferrerInfo(null);
            }
          } catch (error) {
            console.log('Error fetching referrer info:', error.message);
            setReferrerInfo(null);
          }
        }

        // Enhanced Telegram detection (fallback if not detected earlier)
        let isTgWebView = isTelegramWebApp();
        
        // Additional Telegram detection fallbacks
        if (!isTgWebView) {
          const userAgent = navigator.userAgent.toLowerCase();
          if (userAgent.includes('telegram') || document.referrer.includes('t.me')) {
            isTgWebView = true;
          }
        }

        // Update Telegram state if not already set
        if (isTgWebView && !isTelegram) {
          setIsTelegram(true);
        }

        console.log('Final Telegram detection:', {
          isTelegram: isTgWebView,
          hasTelegramUser: !!tgUser,
          referralCode: effectiveRef,
          hasReferrer: !!referrerInfo
        });

      } catch (error) {
        console.error('Error detecting Telegram/referral:', error);
      } finally {
        setIsLoading(false);
      }
    };

    detectReferralAndTelegram();
  }, [searchParams]);

  // Function to clear referral code (after successful registration)
  const clearReferralCode = () => {
    setReferralCode(null);
    setReferrerInfo(null);
    localStorage.removeItem('ziver_referral_code');
    sessionStorage.removeItem('referralCode');
  };

  // Function to manually set referral code
  const setManualReferralCode = (code) => {
    setReferralCode(code);
    localStorage.setItem('ziver_referral_code', code);
    sessionStorage.setItem('referralCode', code);
  };

  return { 
    referralCode, 
    referrerInfo,
    isTelegram,
    telegramUser,
    hasReferral: !!referralCode,
    isLoading,
    clearReferralCode,
    setManualReferralCode
  };
};

// Additional utility function for Telegram sharing
export const shareToTelegram = (message, url) => {
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(message)}`;
  window.open(shareUrl, '_blank');
};

// Utility to generate Telegram deep link
export const generateTelegramDeepLink = (referralCode, startParam = 'start') => {
  const botUsername = 'Zivurlbot'; // Replace with your actual bot username
  return `https://t.me/${botUsername}?${startParam}=${referralCode}`;
};

// Get current URL with referral code for sharing
export const getCurrentUrlWithReferral = (referralCode) => {
  const currentUrl = window.location.origin + window.location.pathname;
  return `${currentUrl}?ref=${referralCode}`;
};

// Check if user is in Telegram
export const isInTelegram = () => {
  return isTelegramWebApp();
};

// Export the Telegram detection utilities for use in other files
export { initializeTelegramWebApp, getTelegramUser, isTelegramWebApp };