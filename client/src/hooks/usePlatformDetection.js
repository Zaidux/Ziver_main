import { useState, useEffect } from 'react';

export const usePlatformDetection = () => {
  const [platform, setPlatform] = useState('web');
  const [isLoading, setIsLoading] = useState(true);
  const [telegramUsername, setTelegramUsername] = useState(null);

  useEffect(() => {
    const detectPlatform = () => {
      let detectedPlatform = 'web';
      let detectedUsername = null;

      // Enhanced Telegram detection
      const isTelegramWebApp = () => {
        // Check for Telegram Web App
        if (window.Telegram?.WebApp) {
          // Extract username from Telegram Web App
          const tgUser = window.Telegram.WebApp.initDataUnsafe?.user;
          if (tgUser?.username) {
            detectedUsername = tgUser.username;
          }
          return true;
        }

        // Check URL parameters (Telegram often adds tgWebAppStartParam)
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('tgWebAppStartParam') || urlParams.has('startapp')) {
          return true;
        }

        // Check for Telegram-specific JavaScript
        if (window.TelegramWebviewProxy) {
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

        // Check for Telegram inline mode
        if (window.location.hash.includes('tgWebAppData')) {
          return true;
        }

        return false;
      };

      // Enhanced mobile app detection
      const isMobileApp = () => {
        // React Native WebView
        if (window.ReactNativeWebView) {
          return true;
        }

        // Cordova/PhoneGap
        if (window.cordova || window.PhoneGap) {
          return true;
        }

        // Capacitor
        if (window.Capacitor) {
          return true;
        }

        return false;
      };

      // Enhanced mobile browser detection
      const isMobileBrowser = () => {
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        
        // Additional check for touch devices
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        return isMobile && hasTouch;
      };

      // Detection priority
      if (isTelegramWebApp()) {
        detectedPlatform = 'telegram';
        console.log('📱 Telegram Web App detected', detectedUsername ? `(@${detectedUsername})` : '');
      }
      else if (isMobileApp()) {
        detectedPlatform = 'mobile-app';
        console.log('📱 Mobile app detected');
      }
      else if (isMobileBrowser()) {
        detectedPlatform = 'mobile-web';
        console.log('📱 Mobile web detected');
      }
      else {
        detectedPlatform = 'web';
        console.log('💻 Web platform detected');
      }

      setPlatform(detectedPlatform);
      setTelegramUsername(detectedUsername);
      setIsLoading(false);
    };

    // Add a small delay to ensure all environment variables are loaded
    setTimeout(detectPlatform, 100);
  }, []);

  return {
    platform,
    isTelegram: platform === 'telegram',
    isMobileApp: platform === 'mobile-app',
    isMobileWeb: platform === 'mobile-web',
    isWeb: platform === 'web',
    telegramUsername,
    isLoading
  };
};