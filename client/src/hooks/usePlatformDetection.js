import { useState, useEffect } from 'react';

export const usePlatformDetection = () => {
  const [platform, setPlatform] = useState('web');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const detectPlatform = () => {
      let detectedPlatform = 'web';

      // Enhanced Telegram detection
      const isTelegramWebApp = () => {
        // Check for Telegram Web App
        if (window.Telegram?.WebApp) {
          return true;
        }
        
        // Check URL parameters (Telegram often adds tgWebAppStartParam)
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

      // Check for Telegram Web App first
      if (isTelegramWebApp()) {
        detectedPlatform = 'telegram';
        console.log('📱 Telegram Web App detected');
      }
      // Check for other mobile app environments
      else if (window.ReactNativeWebView) {
        detectedPlatform = 'mobile-app';
        console.log('📱 Mobile app detected');
      }
      // Check user agent for mobile browsers
      else if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        detectedPlatform = 'mobile-web';
        console.log('📱 Mobile web detected');
      }
      // Default to web
      else {
        detectedPlatform = 'web';
        console.log('💻 Web platform detected');
      }

      setPlatform(detectedPlatform);
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
    isLoading
  };
};