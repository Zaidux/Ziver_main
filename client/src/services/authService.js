import api from './api'; // <-- Import our new api instance

// Register user - now accepts an optional referralCode
const register = (username, email, password, referralCode) => {
  return api.post('/auth/register', {
    username,
    email,
    password,
    referralCode, // Include the referral code in the request

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