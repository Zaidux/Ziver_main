import axios from 'axios';

const api = axios.create({
  baseURL: 'https://ziver-api.onrender.com/api',
});

// REQUEST interceptor - FIXED localStorage key
api.interceptors.request.use(
  (config) => {
    // FIX: Changed from 'user' to 'session'
    const session = localStorage.getItem('session');
    if (session) {
      try {
        const { user } = JSON.parse(session);
        if (user && user.token) {
          config.headers['Authorization'] = `Bearer ${user.token}`;
        }
      } catch (error) {
        console.error('Error parsing session:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// RESPONSE interceptor - FIXED localStorage key
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // FIX: Changed from 'user' to 'session'
      localStorage.removeItem('session');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;