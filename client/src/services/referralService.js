import api from './api';

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
  return `https://t.me/Zivurlbot?start=${referralCode}`;
};

// Share referral via different platforms
const shareReferral = async (platform, referralCode) => {
  const link = generateReferralLink(referralCode);
  const message = `Join me on Ziver! Use my referral code: ${referralCode}\n${link}`;
  
  // Implement platform-specific sharing logic
  switch (platform) {
    case 'telegram':
      window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent('Join me on Ziver!')}`);
      break;
    case 'whatsapp':
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`);
      break;
    case 'twitter':
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`);
      break;
    default:
      return link;
  }
};

const referralService = {
  getReferralData,
  removeReferral,
  getLeaderboard,
  generateReferralLink,
  shareReferral
};

export default referralService;