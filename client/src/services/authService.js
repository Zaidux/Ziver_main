import axios from 'axios';

// The base URL of our deployed Render API
const API_URL = 'https://ziver-api.onrender.com/api/auth/';

// Register user
const register = (username, email, password) => {
  return axios.post(API_URL + 'register', {
    username,
    email,
    password,
  });
};

// We'll add the login function here later
// const login = (email, password) => { ... };

const authService = {
  register,
  // login,
};

export default authService;