import axios from 'axios';

const api = axios.create({
  baseURL: 'https://ziver-api.onrender.com/api', // Note: No '/auth' here
});

// This is an interceptor. It's a piece of code that runs
// BEFORE every single API request is sent.
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
      // If a user with a token is found, add it to the request headers
      config.headers['Authorization'] = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
