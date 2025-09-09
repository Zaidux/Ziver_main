import api from './api'; // Import our configured api instance

// Function to send a request to the claim endpoint
const claimReward = async () => {
  // We don't need to provide the full URL or the token.
  // The 'api' instance handles that for us automatically.
  const response = await api.post('/mining/claim');
  return response.data;
};

const miningService = {
  claimReward,
};

export default miningService;