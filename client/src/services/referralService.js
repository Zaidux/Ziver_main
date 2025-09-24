import api from './api';

// Get referrer info by referral code - FIXED ENDPOINT
const getReferrerInfo = async (referralCode) => {
  try {
    // Changed from /referrals/referrer/ to /auth/referrer-info/
    const response = await api.get(`/auth/referrer-info/${referralCode}`);
    return response.data;
  } catch (error) {
    console.error('Error getting referrer info:', error);
    
    // Return a friendly error response
    if (error.response?.status === 404) {
      return {
        success: false,
        message: 'Invalid referral code',
        isValid: false
      };
    }
    
    throw error;
  }
};

// Apply referral to user
const applyReferral = async (referralCode, userId) => {
  const response = await api.post('/referrals/apply', {
    referralCode,
    userId
  });
  return response.data;
};

// Fetch the current user's referral data
const getReferralData = async () => {
  const response = await api.get('/referrals');
  return response.data;
};

// Remove a specific referred user
const removeReferral = async (userId) => {
  const response = await api.delete(`/referrals/${userId}`);
  return response.data;
};

// Get referral leaderboard
const getLeaderboard = async () => {
  const response = await api.get('/referrals/leaderboard');
  return response.data;
};

// Generate referral link
const generateReferralLink = (referralCode) => {
  const botUsername = 'Zivurlbot';
  return `https://t.me/${botUsername}?start=${referralCode}`;
};

// Generate web referral link
const generateWebReferralLink = (referralCode) => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/register?ref=${referralCode}`;
};

// Share referral via different platforms
const shareReferral = async (platform, referralCode) => {
  const telegramLink = generateReferralLink(referralCode);
  const webLink = generateWebReferralLink(referralCode);
  
  const message = `Join me on Ziver and start earning ZP tokens! Use my referral link to get 100 ZP bonus!`;
  const fullMessage = `${message}\n\nTelegram: ${telegramLink}\nWeb: ${webLink}`;

  switch (platform) {
    case 'telegram':
      window.open(`https://t.me/share/url?url=${encodeURIComponent(webLink)}&text=${encodeURIComponent(message)}`, '_blank');
      break;
    case 'whatsapp':
      window.open(`https://wa.me/?text=${encodeURIComponent(fullMessage)}`, '_blank');
      break;
    case 'twitter':
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(fullMessage)}`, '_blank');
      break;
    case 'copy':
      await navigator.clipboard.writeText(webLink);
      return 'Link copied to clipboard!';
    default:
      return webLink;
  }
};

// Create pending referral (for tracking)
const createPendingReferral = async (referralData) => {
  const response = await api.post('/auth/pending-referral', referralData);
  return response.data;
};

const referralService = {
  getReferrerInfo,
  applyReferral,
  getReferralData,
  removeReferral,
  getLeaderboard,
  generateReferralLink,
  generateWebReferralLink,
  shareReferral,
  createPendingReferral
};

export default referralService;