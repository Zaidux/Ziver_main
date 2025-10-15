import api from './api';

// Get referrer info by referral code - FIXED ENDPOINT
const getReferrerInfo = async (referralCode) => {
  try {
    // Use the correct endpoint that matches your server routes
    const response = await api.get(`/referrals/referrer-info/${referralCode}`);
    return response.data;
  } catch (error) {
    console.error('Error getting referrer info:', error);

    // Enhanced error handling
    if (error.response?.status === 404) {
      return {
        success: false,
        message: 'Invalid referral code',
        isValid: false
      };
    }

    return {
      success: false,
      message: 'Error checking referral code',
      isValid: false
    };
  }
};

// NEW: Get smart referrer suggestion (for when no referral is provided)
const getSmartReferrerSuggestion = async () => {
  try {
    const response = await api.get('/referrals/smart-suggestion');
    return response.data;
  } catch (error) {
    console.error('Error getting smart referrer suggestion:', error);
    return {
      success: false,
      message: 'Unable to find community match at this time'
    };
  }
};

// Apply referral to user
const applyReferral = async (referralCode, userId) => {
  try {
    const response = await api.post('/referrals/apply', {
      referralCode,
      userId
    });
    return response.data;
  } catch (error) {
    console.error('Error applying referral:', error);
    throw error;
  }
};

// Fetch the current user's referral data
const getReferralData = async () => {
  try {
    const response = await api.get('/referrals');
    return response.data;
  } catch (error) {
    console.error('Error fetching referral data:', error);
    throw error;
  }
};

// Remove a specific referred user
const removeReferral = async (userId) => {
  try {
    const response = await api.delete(`/referrals/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error removing referral:', error);
    throw error;
  }
};

// Get referral leaderboard
const getLeaderboard = async () => {
  try {
    const response = await api.get('/referrals/leaderboard');
    return response.data;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  }
};

// Clear pending referral
const clearPendingReferral = async (referralCode) => {
  try {
    const response = await api.delete(`/referrals/pending/${referralCode}`);
    return response.data;
  } catch (error) {
    console.error('Error clearing pending referral:', error);
    // Don't throw error for cleanup operations
    return { success: false };
  }
};

// Generate referral link for Telegram
const generateReferralLink = (referralCode) => {
  const botUsername = 'Zivurlbot'; // Replace with your actual bot username
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
      try {
        await navigator.clipboard.writeText(webLink);
        return 'Link copied to clipboard!';
      } catch (error) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = webLink;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return 'Link copied to clipboard!';
      }
    default:
      return webLink;
  }
};

// Create pending referral (for tracking)
const createPendingReferral = async (referralData) => {
  try {
    const response = await api.post('/auth/pending-referral', referralData);
    return response.data;
  } catch (error) {
    console.error('Error creating pending referral:', error);
    throw error;
  }
};

const referralService = {
  getReferrerInfo,
  getSmartReferrerSuggestion, // NEW: Added smart referral function
  applyReferral,
  getReferralData,
  removeReferral,
  getLeaderboard,
  generateReferralLink,
  generateWebReferralLink,
  shareReferral,
  createPendingReferral,
  clearPendingReferral
};

export default referralService;