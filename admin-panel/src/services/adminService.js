import api from './api';

// System Status Methods
export const getSystemStatus = async () => {
  const response = await api.get('/system/status');
  return response.data;
};

export const toggleLockdown = async () => {
  const response = await api.post('/system/lockdown/toggle');
  return response.data;
};

export const updateComponentStatus = async (component, status, error = null) => {
  const response = await api.post('/system/component/status', {
    component,
    status,
    error
  });
  return response.data;
};

// Existing Admin Methods
const getSummary = () => api.get('/admin/summary');
const getTasks = () => api.get('/admin/tasks');
const createTask = (taskData) => api.post('/admin/tasks', taskData);
const updateTask = (id, taskData) => api.put(`/admin/tasks/${id}`, taskData);
const getSettings = () => api.get('/admin/settings');
const updateSetting = (settingData) => api.put('/admin/settings', settingData);
const searchUsers = (searchTerm) => api.get(`/admin/users/search?searchTerm=${searchTerm}`);

// Validation rules management
const getTaskValidationRules = (taskId) => api.get(`/admin/tasks/${taskId}/validation-rules`);
const createValidationRule = (taskId, ruleData) => api.post(`/admin/tasks/${taskId}/validation-rules`, ruleData);
const updateValidationRule = (ruleId, ruleData) => api.put(`/admin/validation-rules/${ruleId}`, ruleData);
const deleteValidationRule = (ruleId) => api.delete(`/admin/validation-rules/${ruleId}`);

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
  deleteValidationRule
};

export default adminService;