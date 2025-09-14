import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export const useTelegramReferral = () => {
  const [searchParams] = useSearchParams();
  const [referralCode, setReferralCode] = useState(null);
  const [isTelegram, setIsTelegram] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const detectReferralAndTelegram = () => {
      try {
        // Check for referral code in multiple possible parameters
        const ref = searchParams.get('ref') || 
                   searchParams.get('start') || 
                   searchParams.get('referral') ||
                   sessionStorage.getItem('referralCode');
        
        if (ref) {
          setReferralCode(ref);
          console.log('Referral code detected:', ref);
          // Store in session storage for persistence
          sessionStorage.setItem('referralCode', ref);
        }

        // Enhanced Telegram detection
        const userAgent = navigator.userAgent.toLowerCase();
        const isTgWebView = userAgent.includes('telegram') || 
                           window.Telegram?.WebApp ||
                           document.referrer.includes('t.me') ||
                           window.location.href.includes('tgWebAppPlatform');
        
        setIsTelegram(isTgWebView);
        
        // Additional Telegram-specific features if detected
        if (isTgWebView && window.Telegram?.WebApp) {
          // Expand the Telegram Web App to full height
          window.Telegram.WebApp.expand();
          // Enable closing confirmation
          window.Telegram.WebApp.enableClosingConfirmation();
        }

      } catch (error) {
        console.error('Error detecting Telegram/referral:', error);
      } finally {
        setIsLoading(false);
      }
    };

    detectReferralAndTelegram();
  }, [searchParams]);

  return { 
    referralCode, 
    isTelegram,
    hasReferral: !!referralCode,
    isLoading
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