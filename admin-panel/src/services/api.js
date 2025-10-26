import backendService from './backendService.js';

const createAPIClient = () => {
  const getHeaders = (customHeaders = {}) => {
    const token = localStorage.getItem('admin_token');
    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  };

  const request = async (endpoint, options = {}) => {
    try {
      const baseURL = backendService.getBaseURL();
      const url = `${baseURL}${endpoint}`;

      console.log(`API Request: ${url}`); // Debug log

      const response = await fetch(url, {
        ...options,
        headers: getHeaders(options.headers),
      });

      // Parse response data
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // If unauthorized, clear token and redirect to login
      if (response.status === 401) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/login';
        throw new Error('Authentication required');
      }

      // If not successful, throw error with response data
      if (!response.ok) {
        const error = new Error(data.message || `HTTP error! status: ${response.status}`);
        error.response = { status: response.status, data };
        throw error;
      }

      // Return the parsed data directly (not the response object)
      return data;

    } catch (error) {
      // Network error - try to switch backends
      if (error.name === 'TypeError' || error.message.includes('Failed to fetch')) {
        console.warn('Network error, switching backends...');
        await backendService.autoSelectBackend();

        const baseURL = backendService.getBaseURL();
        const url = `${baseURL}${endpoint}`;

        console.log(`Retrying after network error: ${url}`); // Debug log
        const retryResponse = await fetch(url, {
          ...options,
          headers: getHeaders(options.headers),
        });

        const retryData = await retryResponse.json();
        if (!retryResponse.ok) {
          throw new Error(retryData.message || `HTTP error! status: ${retryResponse.status}`);
        }
        return retryData;
      }
      
      // Re-throw other errors
      throw error;
    }
  };

  return {
    get: (endpoint) => request(endpoint),

    post: (endpoint, data) => 
      request(endpoint, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    put: (endpoint, data) => 
      request(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (endpoint) => 
      request(endpoint, {
        method: 'DELETE',
      }),

    upload: (endpoint, formData) =>
      request(endpoint, {
        method: 'POST',
        body: formData,
        headers: {}, // Let browser set Content-Type for FormData
      }),
  };
};

export const api = createAPIClient();
export default api;