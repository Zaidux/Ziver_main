import api from './api';

// All endpoints need the '/admin' prefix
const getSummary = () => api.get('/admin/summary');
const getTasks = () => api.get('/admin/tasks');
const createTask = (taskData) => api.post('/admin/tasks', taskData);
const updateTask = (id, taskData) => api.put(`/admin/tasks/${id}`, taskData);
const getSettings = () => api.get('/admin/settings');
const updateSetting = (settingData) => api.put('/admin/settings', settingData);

// Function to search for users - also needs admin prefix
const searchUsers = (searchTerm) => {
  return api.get(`/admin/users/search?searchTerm=${searchTerm}`);
};

const adminService = {
  getSummary,
  getTasks,
  createTask,
  updateTask,
  getSettings,
  updateSetting,
  searchUsers,
};

export default adminService;