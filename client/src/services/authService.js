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

// Login user
const login = async (email, password) => {
  const response = await axios.post(API_URL + 'login', {
    email,
    password,
  });

  // If the API call is successful and we get user data back...
  if (response.data) {
    // ...save the user object (which includes the token) to localStorage.
    localStorage.setItem('user', JSON.stringify(response.data));
  }

  return response.data;
};


const authService = {
  register,
  login, // <-- Add login here
};

export default authService;