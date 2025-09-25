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
        setIsLoading(true);

        // Check for referral code in URL parameters first
        const urlRef = searchParams.get('ref') || searchParams.get('start');
        
        // Then check storage
        const storageRef = localStorage.getItem('ziver_referral_code') || 
                          sessionStorage.getItem('referralCode');

        const effectiveRef = urlRef || storageRef;

        if (effectiveRef) {
          setReferralCode(effectiveRef);
          console.log('Referral code detected:', effectiveRef);

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

        // Enhanced Telegram detection
        let isTgWebView = false;
        let tgUser = null;

        // Check for Telegram Web App
        if (window.Telegram?.WebApp) {
          isTgWebView = true;
          const tg = window.Telegram.WebApp;

          // Initialize Telegram Web App
          tg.expand();
          tg.enableClosingConfirmation();

          // Get Telegram user info
          if (tg.initDataUnsafe?.user) {
            tgUser = {
              id: tg.initDataUnsafe.user.id,
              username: tg.initDataUnsafe.user.username,
              firstName: tg.initDataUnsafe.user.first_name,
              lastName: tg.initDataUnsafe.user.last_name
            };
            setTelegramUser(tgUser);
          }

          // Check for start parameter in Telegram
          const startParam = tg.initDataUnsafe?.start_param;
          if (startParam && !effectiveRef) {
            console.log('Telegram start parameter detected:', startParam);
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

        // Additional Telegram detection
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes('telegram') || document.referrer.includes('t.me')) {
          isTgWebView = true;
        }

        setIsTelegram(isTgWebView);

        console.log('Telegram detection:', {
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
  return window.Telegram?.WebApp || navigator.userAgent.toLowerCase().includes('telegram');
};