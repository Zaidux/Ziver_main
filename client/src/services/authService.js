import api from './api';

// Register user with referral support
const register = async (username, email, password, referralCode = null) => {
  try {
    // First register the user
    const response = await api.post('/auth/register', {
      username,
      email,
      password,
      referralCode // Send the referral code to the backend
    });
    
    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Login user
const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Logout user
const logout = async () => {
  try {
    const response = await api.post('/auth/logout');
    return response.data;
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

// Get current user
const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    console.error('Get current user error:', error);
    throw error;
  }
};

const authService = {
  register,
  login,
  logout,
  getCurrentUser
};

export default authService;