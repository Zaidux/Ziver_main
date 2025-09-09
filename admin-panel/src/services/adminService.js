import api from './api';

const getSummary = () => api.get('/summary');
const getTasks = () => api.get('/tasks');
const createTask = (taskData) => api.post('/tasks', taskData);
const updateTask = (id, taskData) => api.put(`/tasks/${id}`, taskData);
const getSettings = () => api.get('/settings');
const updateSetting = (settingData) => api.put('/settings', settingData);

// Function to search for users
const searchUsers = (searchTerm) => {
  return api.get(`/users/search?searchTerm=${searchTerm}`);
};

const adminService = {
  getSummary,
  getTasks,
  createTask,
  updateTask,
  getSettings,
  updateSetting,
  searchUsers, // <-- Add new function here
};

export default adminService;