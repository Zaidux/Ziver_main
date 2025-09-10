import api from './api'; // Import our central api instance

// Fetch all available tasks for the current user
const getTasks = async () => {
  const response = await api.get('/tasks');
  return response.data;
};

// Send a request to mark a specific task as complete
const completeTask = async (taskId) => {
  const response = await api.post(`/tasks/${taskId}/complete`);
  return response.data; // This will return { message, user }
};

const taskService = {
  getTasks,
  completeTask,
};

export default taskService;