// telegramUtils.js
export const isTelegramWebApp = () => {
  return window.Telegram?.WebApp || navigator.userAgent.includes('Telegram');
};

export const generateTelegramDeepLink = (referralCode) => {
  return `https://t.me/Zivurlbot?start=${referralCode}`;
};
