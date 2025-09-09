import api from './api';

const getSummary = () => api.get('/summary');
const getTasks = () => api.get('/tasks');
const createTask = (taskData) => api.post('/tasks', taskData);
const updateTask = (id, taskData) => api.put(`/tasks/${id}`, taskData);
const getSettings = () => api.get('/settings');
const updateSetting = (settingData) => api.put('/settings', settingData);

const adminService = {
  getSummary,
  getTasks,
  createTask,
  updateTask,
  getSettings,
  updateSetting,
};

export default adminService;