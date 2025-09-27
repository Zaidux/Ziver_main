import api from './api';

// Fetch all available tasks for the current user with progress
const getTasks = async () => {
  const response = await api.get('/tasks');
  return response.data;
};

// Send a request to mark a specific task as complete
const completeTask = async (taskId) => {
  const response = await api.post(`/tasks/${taskId}/complete`);
  return response.data;
};

// Get user statistics for task progress
const getUserStats = async () => {
  const response = await api.get('/tasks/user-stats');
  return response.data;
};

// Get detailed progress for a specific task
const getTaskProgress = async (taskId) => {
  const response = await api.get(`/tasks/${taskId}/progress`);
  return response.data;
};

const taskService = {
  getTasks,
  completeTask,
  getUserStats,
  getTaskProgress
};

export default taskService;