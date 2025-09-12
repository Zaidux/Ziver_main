import api from './api';

const claimReward = async () => {
  const response = await api.post('/mining/claim');
  return response.data;
};

const getMiningStatus = async () => {
  const response = await api.get('/mining/status');
  return response.data;
};

// NEW: Start mining endpoint
const startMining = async () => {
  const response = await api.post('/mining/start');
  return response.data;
};

// NEW: Get mining configuration
const getMiningConfig = async () => {
  const response = await api.get('/mining/config');
  return response.data;
};

// NEW: Update mining settings
const updateMiningSettings = async (settings) => {
  const response = await api.put('/mining/settings', settings);
  return response.data;
};

const miningService = {
  claimReward,
  getMiningStatus,
  startMining, // Export the new function
  getMiningConfig,
  updateMiningSettings
};

export default miningService;