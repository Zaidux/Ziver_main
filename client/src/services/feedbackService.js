import { api } from './api';

class FeedbackService {
  /**
   * Submit feedback to the server
   * @param {Object} feedbackData - The feedback data
   * @param {string} feedbackData.title - Feedback title
   * @param {string} feedbackData.message - Feedback message
   * @param {string} feedbackData.type - Feedback type (suggestion, bug, complaint, feature)
   * @param {string} feedbackData.priority - Priority level (low, medium, high)
   * @param {File[]} attachments - Array of attachment files
   * @param {string} token - User authentication token
   * @returns {Promise<Object>} Response from server
   */
  async submitFeedback(feedbackData, attachments = [], token) {
    try {
      console.log('🔄 Submitting feedback via feedbackService...', {
        title: feedbackData.title,
        type: feedbackData.type,
        priority: feedbackData.priority,
        attachmentCount: attachments.length,
        backendUrl: process.env.REACT_APP_API_URL || 'https://ziver-api.onrender.com'
      });

      const formData = new FormData();

      // Append basic feedback data
      formData.append('title', feedbackData.title.trim());
      formData.append('message', feedbackData.message.trim());
      formData.append('type', feedbackData.type);
      formData.append('priority', feedbackData.priority);

      // Append attachments if any
      attachments.forEach(file => {
        formData.append('attachments', file);
      });

      // Use full backend URL instead of relative path
      const backendUrl = process.env.REACT_APP_API_URL || 'https://ziver-api.onrender.com';
      const response = await fetch(`${backendUrl}/api/feedback`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Note: Don't set Content-Type for FormData, let browser set it with boundary
        },
        body: formData
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      // Handle empty responses
      const responseText = await response.text();
      console.log('📡 Raw response text:', responseText);

      let result;

      if (!responseText || responseText.trim() === '') {
        console.log('⚠️ Empty response received from server');
        if (response.ok) {
          // If it's a 200 with empty body, assume success
          result = { success: true, message: 'Feedback submitted successfully' };
        } else {
          throw new Error(`Server returned ${response.status} with empty body`);
        }
      } else {
        // Try to parse JSON
        try {
          result = JSON.parse(responseText);
          console.log('✅ Parsed result:', result);
        } catch (parseError) {
          console.error('❌ JSON parse error:', parseError);
          console.error('❌ Response text that failed to parse:', responseText);
          throw new Error(`Server returned invalid JSON: ${responseText.substring(0, 100)}`);
        }
      }

      return result;

    } catch (error) {
      console.error('❌ Feedback service error:', error);
      throw error;
    }
  }

  /**
   * Get user's feedback history
   * @param {string} token - User authentication token
   * @returns {Promise<Array>} Array of feedback items
   */
  async getFeedbackHistory(token) {
    try {
      const backendUrl = process.env.REACT_APP_API_URL || 'https://ziver-api.onrender.com';
      const response = await fetch(`${backendUrl}/api/feedback/user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch feedback history: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('❌ Error fetching feedback history:', error);
      throw error;
    }
  }

  /**
   * Get feedback by ID
   * @param {string} feedbackId - Feedback ID
   * @param {string} token - User authentication token
   * @returns {Promise<Object>} Feedback details
   */
  async getFeedbackById(feedbackId, token) {
    try {
      const backendUrl = process.env.REACT_APP_API_URL || 'https://ziver-api.onrender.com';
      const response = await fetch(`${backendUrl}/api/feedback/${feedbackId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch feedback: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('❌ Error fetching feedback:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const feedbackService = new FeedbackService();
export default FeedbackService;