import { useState, useCallback } from 'react';
import api from '../services/api';

export const useSettings = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateSetting = useCallback(async (endpoint, data, successMessage = 'Settings updated successfully') => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.put(endpoint, data);
      
      if (response.data.success) {
        return { success: true, data: response.data };
      } else {
        throw new Error(response.data.message || 'Failed to update settings');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const getSetting = useCallback(async (endpoint) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(endpoint);
      
      if (response.data.success) {
        return { success: true, data: response.data };
      } else {
        throw new Error('Failed to fetch settings');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    loading,
    error,
    updateSetting,
    getSetting,
    clearError
  };
};