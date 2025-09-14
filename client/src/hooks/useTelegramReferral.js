import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export const useTelegramReferral = () => {
  const [searchParams] = useSearchParams();
  const [referralCode, setReferralCode] = useState(null);
  const [isTelegram, setIsTelegram] = useState(false);

  useEffect(() => {
    // Check for referral code in URL parameters
    const ref = searchParams.get('ref') || searchParams.get('start');
    if (ref) {
      setReferralCode(ref);
      console.log('Referral code detected:', ref);
    }

    // Check if user is coming from Telegram
    const userAgent = navigator.userAgent.toLowerCase();
    setIsTelegram(userAgent.includes('telegram') || window.Telegram?.WebApp);
    
    // Store referral code in session storage for later use
    if (ref) {
      sessionStorage.setItem('referralCode', ref);
    }
  }, [searchParams]);

  return { 
    referralCode, 
    isTelegram,
    hasReferral: !!referralCode 
  };
};