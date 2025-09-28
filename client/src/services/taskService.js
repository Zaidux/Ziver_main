import api from './api';

// Fetch all available tasks for the current user with progress
const getTasks = async () => {
  try {
    const response = await api.get('/tasks');
    return response.data;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
};

// Send a request to mark a specific task as complete
const completeTask = async (taskId) => {
  try {
    const response = await api.post(`/tasks/${taskId}/complete`);
    return response.data;
  } catch (error) {
    console.error('Error completing task:', error);
    throw error;
  }
};

// Get user statistics for task progress
const getUserStats = async () => {
  try {
    const response = await api.get('/tasks/user-stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching user stats:', error);
    throw error;
  }
};

// Get detailed progress for a specific task
const getTaskProgress = async (taskId) => {
  try {
    const response = await api.get(`/tasks/${taskId}/progress`);
    return response.data;
  } catch (error) {
    console.error('Error fetching task progress:', error);
    throw error;
  }
};

// Refresh all task data
const refreshTasks = async () => {
  try {
    const [tasks, stats] = await Promise.all([
      getTasks(),
      getUserStats()
    ]);
    return { tasks, stats };
  } catch (error) {
    console.error('Error refreshing tasks:', error);
    throw error;
  }
};

const taskService = {
  getTasks,
  completeTask,
  getUserStats,
  getTaskProgress,
  refreshTasks
};

export default taskService;