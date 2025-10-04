import { useState, useEffect } from 'react';

export const usePlatformDetection = () => {
  const [platform, setPlatform] = useState('web');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const detectPlatform = () => {
      // Check for Telegram Web App
      if (window.Telegram?.WebApp) {
        setPlatform('telegram');
      }
      // Check for other mobile app environments
      else if (window.ReactNativeWebView) {
        setPlatform('mobile-app');
      }
      // Check user agent for mobile browsers
      else if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        setPlatform('mobile-web');
      }
      // Default to web
      else {
        setPlatform('web');
      }
      
      setIsLoading(false);
    };

    detectPlatform();
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