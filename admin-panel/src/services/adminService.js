import api from './api';

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