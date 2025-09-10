import api from './api'; // Import our central api instance

// Fetch the current user's referral data (their code and referred users)
const getReferralData = async () => {
  const response = await api.get('/referrals');
  return response.data;
};

// Send a request to remove a specific referred user
const removeReferral = async (userId) => {
  const response = await api.delete(`/referrals/${userId}`);
  return response.data;
};

const referralService = {
  getReferralData,
  removeReferral,
};

export default referralService;