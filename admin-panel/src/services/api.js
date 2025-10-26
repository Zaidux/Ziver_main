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
    let lastError = null;
    
    // Try the request with potential backend switching
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const baseURL = backendService.getBaseURL();
        const url = `${baseURL}${endpoint}`;

        console.log(`API Request (attempt ${attempt + 1}): ${url}`);

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

        // If backend is down (5xx error), try to switch and retry
        if (response.status >= 500) {
          console.warn(`Backend error (${response.status}), attempting to switch backends...`);
          await backendService.autoSelectBackend();
          lastError = new Error(data.message || `Backend error: ${response.status}`);
          continue; // Retry with new backend
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
        lastError = error;
        
        // Network error or backend down - try to switch backends
        if (error.name === 'TypeError' || error.message.includes('Failed to fetch') || error.message.includes('Backend error')) {
          console.warn('Network/backend error, switching backends...');
          try {
            await backendService.autoSelectBackend();
            console.log(`Switched to backend: ${backendService.currentBackend?.name}`);
          } catch (switchError) {
            console.error('Failed to switch backends:', switchError);
            break; // No healthy backends available
          }
        } else {
          // Other errors (auth, validation, etc.) - don't retry
          break;
        }
      }
    }

    // If we get here, all attempts failed
    throw lastError || new Error('Request failed after multiple attempts');
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