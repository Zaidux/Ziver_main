// useTelegramReferral.js
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export const useTelegramReferral = () => {
  const [searchParams] = useSearchParams();
  const [referralCode, setReferralCode] = useState(null);
  const [isTelegram, setIsTelegram] = useState(false);

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) setReferralCode(ref);
    
    setIsTelegram(navigator.userAgent.includes('Telegram'));
  }, [searchParams]);

  return { referralCode, isTelegram };
};
