import axios from 'axios';

const api = axios.create({
  baseURL: 'https://ziver-api.onrender.com/api/admin',
});

// Interceptor to automatically add the admin's auth token to every request
api.interceptors.request.use(
  (config) => {
    const adminUser = JSON.parse(localStorage.getItem('admin_user'));
    if (adminUser && adminUser.token) {
      config.headers['Authorization'] = `Bearer ${adminUser.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
