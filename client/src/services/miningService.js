import api from './api';

const claimReward = async () => {
  try {
    const response = await api.post('/mining/claim');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to claim reward');
  }
};

const getMiningStatus = async () => {
  try {
    const response = await api.get('/mining/status');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to get mining status');
  }
};

const startMining = async () => {
  try {
    const response = await api.post('/mining/start');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to start mining');
  }
};

const getMiningConfig = async () => {
  try {
    const response = await api.get('/mining/config');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to get mining config');
  }
};

const updateMiningSettings = async (settings) => {
  try {
    const response = await api.put('/mining/settings', settings);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update settings');
  }
};

const miningService = {
  claimReward,
  getMiningStatus,
  startMining,
  getMiningConfig,
  updateMiningSettings
};

export default miningService;