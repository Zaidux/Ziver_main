import api from './api';

const telegramService = {
  // Generate a new connection code
  generateConnectionCode: async () => {
    const response = await api.post('/telegram/generate-connection-code');
    return response.data;
  },

  // Connect Telegram account with code
  connectTelegram: async (connectionCode) => {
    const response = await api.post('/telegram/connect', { connectionCode });
    return response.data;
  },

  // Disconnect Telegram account
  disconnectTelegram: async () => {
    const response = await api.post('/telegram/disconnect');
    return response.data;
  },

  // Get current connection status
  getConnectionStatus: async () => {
    const response = await api.get('/telegram/connection-status');
    return response.data;
  },

  // Send test notification
  sendTestNotification: async () => {
    const response = await api.post('/telegram/test-notification');
    return response.data;
  }
};

export default telegramService;