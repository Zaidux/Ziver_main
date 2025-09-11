import api from './api';

const claimReward = async () => {
  const response = await api.post('/mining/claim');
  return response.data;
};

// NEW: Get mining status from server
const getMiningStatus = async () => {
  const response = await api.get('/mining/status');
  return response.data;
};

const miningService = {
  claimReward,
  getMiningStatus // Export the new function
};

export default miningService;