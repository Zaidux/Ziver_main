import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import referralService from '../services/referralService';

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
        // Check for referral code in multiple possible parameters
        const ref = searchParams.get('ref') || 
                   searchParams.get('start') || 
                   searchParams.get('referral') ||
                   localStorage.getItem('ziver_referral_code') ||
                   sessionStorage.getItem('referralCode');

        if (ref) {
          setReferralCode(ref);
          console.log('Referral code detected:', ref);
          
          // Store in both storage for persistence
          localStorage.setItem('ziver_referral_code', ref);
          sessionStorage.setItem('referralCode', ref);
          
          // Fetch referrer information
          try {
            const referrerData = await referralService.getReferrerInfo(ref);
            if (referrerData.success && referrerData.referrer) {
              setReferrerInfo(referrerData.referrer);
              console.log('Referrer found:', referrerData.referrer.username);
            } else {
              console.log('No referrer found for code:', ref);
            }
          } catch (error) {
            console.log('Error fetching referrer info:', error.message);
          }
        }

        // Enhanced Telegram detection
        const userAgent = navigator.userAgent.toLowerCase();
        let isTgWebView = userAgent.includes('telegram') || 
                         window.Telegram?.WebApp ||
                         document.referrer.includes('t.me') ||
                         window.location.href.includes('tgWebAppPlatform');

        // Additional check for Telegram Web App
        if (window.Telegram?.WebApp) {
          isTgWebView = true;
          const tg = window.Telegram.WebApp;

          // Initialize Telegram Web App
          tg.expand();
          tg.enableClosingConfirmation();

          // Get Telegram user info
          if (tg.initDataUnsafe?.user) {
            setTelegramUser({
              id: tg.initDataUnsafe.user.id,
              username: tg.initDataUnsafe.user.username,
              firstName: tg.initDataUnsafe.user.first_name,
              lastName: tg.initDataUnsafe.user.last_name
            });
          }
        }

        setIsTelegram(isTgWebView);

        // If coming from Telegram, check for start parameter in URL
        if (isTgWebView) {
          const urlParams = new URLSearchParams(window.location.search);
          const startParam = urlParams.get('start');
          if (startParam && !ref) {
            setReferralCode(startParam);
            localStorage.setItem('ziver_referral_code', startParam);
            sessionStorage.setItem('referralCode', startParam);
            
            // Fetch referrer information for Telegram referral
            try {
              const referrerData = await referralService.getReferrerInfo(startParam);
              if (referrerData.success && referrerData.referrer) {
                setReferrerInfo(referrerData.referrer);
              }
            } catch (error) {
              console.log('No referrer found for Telegram referral:', startParam);
            }
          }
        }

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

  return { 
    referralCode, 
    referrerInfo,
    isTelegram,
    telegramUser,
    hasReferral: !!referralCode,
    isLoading,
    clearReferralCode
  };
};

// Additional utility function for Telegram sharing
export const shareToTelegram = (message, url) => {
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(message)}`;
  window.open(shareUrl, '_blank');
};

// Utility to generate Telegram deep link
export const generateTelegramDeepLink = (referralCode, startParam = 'start') => {
  return `https://t.me/Zivurlbot?${startParam}=${referralCode}`;
};

// Get current URL with referral code for sharing
export const getCurrentUrlWithReferral = (referralCode) => {
  const currentUrl = window.location.origin + window.location.pathname;
  return `${currentUrl}?ref=${referralCode}`;
};