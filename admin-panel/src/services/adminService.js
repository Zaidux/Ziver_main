import api from './api';

// Helper function to get admin token
const getAdminToken = () => {
  return localStorage.getItem('admin_token') || localStorage.getItem('adminToken');
};

// System Status Methods
export const getSystemStatus = async () => {
  const response = await api.get('/api/system/status'); // ADDED /api prefix
  return response.data;
};

export const toggleLockdown = async () => {
  const adminToken = getAdminToken();
  const response = await api.post('/api/system/lockdown/toggle', {}, { // ADDED /api prefix
    headers: {
      'Admin-Token': adminToken
    }
  });
  return response.data;
};

export const updateComponentStatus = async (component, status, error = null) => {
  const adminToken = getAdminToken();
  const response = await api.post('/api/system/component/status', { // ADDED /api prefix
    component,
    status,
    error
  }, {
    headers: {
      'Admin-Token': adminToken
    }
  });
  return response.data;
};

// Telegram Announcements
const sendAnnouncement = async (announcementData) => {
  try {
    const response = await api.post('/api/announcements/send', announcementData); // ADDED /api prefix
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to send announcement');
  }
};

const sendUserMessage = async (messageData) => {
  try {
    const response = await api.post('/api/announcements/send-user', messageData); // ADDED /api prefix
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to send user message');
  }
};

const getAnnouncementHistory = async (params = {}) => {
  try {
    const response = await api.get('/api/announcements/history', { params }); // ADDED /api prefix
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to get announcement history');
  }
};

const getTelegramStats = async () => {
  try {
    const response = await api.get('/api/announcements/stats'); // ADDED /api prefix
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to get Telegram stats');
  }
};

// Existing Admin Methods - ADD /api prefix to all
const getSummary = () => api.get('/api/admin/summary'); // ADDED /api prefix
const getTasks = () => api.get('/api/admin/tasks'); // ADDED /api prefix
const createTask = (taskData) => api.post('/api/admin/tasks', taskData); // ADDED /api prefix
const updateTask = (id, taskData) => api.put(`/api/admin/tasks/${id}`, taskData); // ADDED /api prefix
const getSettings = () => api.get('/api/admin/settings'); // ADDED /api prefix
const updateSetting = (settingData) => api.put('/api/admin/settings', settingData); // ADDED /api prefix
const searchUsers = (searchTerm) => api.get(`/api/admin/users/search?searchTerm=${searchTerm}`); // ADDED /api prefix

// Validation rules management - ADD /api prefix to all
const getTaskValidationRules = (taskId) => api.get(`/api/admin/tasks/${taskId}/validation-rules`); // ADDED /api prefix
const createValidationRule = (taskId, ruleData) => api.post(`/api/admin/tasks/${taskId}/validation-rules`, ruleData); // ADDED /api prefix
const updateValidationRule = (ruleId, ruleData) => api.put(`/api/admin/validation-rules/${ruleId}`, ruleData); // ADDED /api prefix
const deleteValidationRule = (ruleId) => api.delete(`/api/admin/validation-rules/${ruleId}`); // ADDED /api prefix

const adminService = {
  // System Status Methods
  getSystemStatus,
  toggleLockdown,
  updateComponentStatus,

  // Existing Admin Methods
  getSummary,
  getTasks,
  createTask,
  updateTask,
  getSettings,
  updateSetting,
  searchUsers,
  getTaskValidationRules,
  createValidationRule,
  updateValidationRule,
  deleteValidationRule,
  sendAnnouncement,
  sendUserMessage,
  getAnnouncementHistory,
  getTelegramStats
};

export default adminService;