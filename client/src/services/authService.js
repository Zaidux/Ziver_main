import api from './api'; // <-- Import our new api instance

// Register user
const register = (username, email, password) => {
  // We just need the endpoint path now, not the full URL
  return api.post('/auth/register', {
    username,
    email,
    password,
  });
};

// Login user
const login = async (email, password) => {
  const response = await api.post('/auth/login', {
    email,
    password,
  });
  // Just return the data. The context will handle saving it.
  return response.data;
};

const authService = {
  register,
  login,
};

export default authService;