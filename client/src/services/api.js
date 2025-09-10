import axios from 'axios';

const api = axios.create({
  baseURL: 'https://ziver-api.onrender.com/api',
});

// This is the REQUEST interceptor. It runs BEFORE every request is sent.
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
      config.headers['Authorization'] = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- NEW: RESPONSE INTERCEPTOR ---
// This runs AFTER every response is received from the backend.
api.interceptors.response.use(
  // If the response was successful (status 2xx), just pass it through.
  (response) => response,
  
  // If the response was an error...
  (error) => {
    // Check if the error is a 401 Unauthorized error.
    if (error.response && error.response.status === 401) {
      // This means the user's token is invalid or expired.
      
      // 1. Remove the invalid user data from storage.
      localStorage.removeItem('user');
      
      // 2. Force a redirect to the login page. This will also refresh the app state.
      window.location.href = '/login';
    }
    
    // For all other errors, let the component's .catch() block handle them.
    return Promise.reject(error);
  }
);

export default api;