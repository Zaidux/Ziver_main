import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Paperclip, Send, AlertCircle, CheckCircle } from 'lucide-react';
import './FeedbackPage.css';

const FeedbackPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'suggestion', // suggestion, bug, complaint, feature
    priority: 'medium' // low, medium, high
  });
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const feedbackTypes = [
    { value: 'suggestion', label: 'Suggestion', emoji: '💡' },
    { value: 'bug', label: 'Bug Report', emoji: '🐛' },
    { value: 'complaint', label: 'Complaint', emoji: '😠' },
    { value: 'feature', label: 'Feature Request', emoji: '🚀' }
  ];

  const priorityLevels = [
    { value: 'low', label: 'Low', color: '#10B981' },
    { value: 'medium', label: 'Medium', color: '#F59E0B' },
    { value: 'high', label: 'High', color: '#EF4444' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    clearMessages();
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!validTypes.includes(file.type)) {
        setError(`Invalid file type: ${file.name}. Only images are allowed.`);
        return false;
      }
      
      if (file.size > maxSize) {
        setError(`File too large: ${file.name}. Maximum size is 5MB.`);
        return false;
      }
      
      return true;
    });

    if (validFiles.length > 0) {
      setAttachments(prev => [...prev, ...validFiles]);
      setError('');
    }
    
    // Reset file input
    e.target.value = '';
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const clearMessages = () => {
    setMessage('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    // Validation
    if (!formData.title.trim()) {
      setError('Please enter a title for your feedback');
      setLoading(false);
      return;
    }

    if (!formData.message.trim()) {
      setError('Please provide details about your feedback');
      setLoading(false);
      return;
    }

    try {
      const submitData = new FormData();
      submitData.append('title', formData.title.trim());
      submitData.append('message', formData.message.trim());
      submitData.append('type', formData.type);
      submitData.append('priority', formData.priority);

      // Add attachments
      attachments.forEach(file => {
        submitData.append('attachments', file);
      });

      const response = await fetch('https://ziver-api.onrender.com/api/feedback', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`
        },
        body: submitData
      });

      const result = await response.json();

      if (result.success) {
        setMessage('Thank you for your feedback! We\'ll review it and get back to you soon.');
        setFormData({
          title: '',
          message: '',
          type: 'suggestion',
          priority: 'medium'
        });
        setAttachments([]);
      } else {
        setError(result.message || 'Failed to submit feedback. Please try again.');
      }
    } catch (err) {
      console.error('Feedback submission error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="feedback-page">
      {/* Header */}
      <div className="feedback-header">
        <button 
          className="back-button"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={20} />
          Back
        </button>
        <div className="header-content">
          <h1>Send Feedback</h1>
          <p>Help us improve Ziver by sharing your thoughts and experiences</p>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className="success-message">
          <CheckCircle size={16} />
          {message}
        </div>
      )}

      {error && (
        <div className="error-message">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Feedback Form */}
      <div className="feedback-container">
        <form onSubmit={handleSubmit} className="feedback-form">
          {/* Feedback Type */}
          <div className="form-section">
            <label className="section-label">What type of feedback is this?</label>
            <div className="type-options">
              {feedbackTypes.map(type => (
                <label key={type.value} className="type-option">
                  <input
                    type="radio"
                    name="type"
                    value={type.value}
                    checked={formData.type === type.value}
                    onChange={handleInputChange}
                  />
                  <span className="option-content">
                    <span className="option-emoji">{type.emoji}</span>
                    <span className="option-label">{type.label}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Priority Level */}
          <div className="form-section">
            <label className="section-label">Priority Level</label>
            <div className="priority-options">
              {priorityLevels.map(priority => (
                <label key={priority.value} className="priority-option">
                  <input
                    type="radio"
                    name="priority"
                    value={priority.value}
                    checked={formData.priority === priority.value}
                    onChange={handleInputChange}
                  />
                  <span 
                    className="priority-indicator"
                    style={{ '--priority-color': priority.color }}
                  ></span>
                  <span className="priority-label">{priority.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Brief summary of your feedback..."
              className="form-input"
              maxLength={100}
              required
            />
            <div className="character-count">
              {formData.title.length}/100
            </div>
          </div>

          {/* Message */}
          <div className="form-group">
            <label htmlFor="message" className="form-label">
              Details *
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="Please provide detailed information about your feedback. For bug reports, include steps to reproduce. For suggestions, explain the problem and your proposed solution."
              className="form-textarea"
              rows={6}
              maxLength={1000}
              required
            />
            <div className="character-count">
              {formData.message.length}/1000
            </div>
          </div>

          {/* Attachments */}
          <div className="form-section">
            <label className="section-label">Attachments (Optional)</label>
            <div className="attachments-section">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/jpeg,image/png,image/gif,image/webp"
                multiple
                className="file-input"
              />
              
              <button
                type="button"
                onClick={triggerFileInput}
                className="attach-button"
              >
                <Paperclip size={16} />
                Add Screenshots
              </button>

              {attachments.length > 0 && (
                <div className="attachments-list">
                  <p className="attachments-label">
                    {attachments.length} file(s) attached
                  </p>
                  <div className="attachments-grid">
                    {attachments.map((file, index) => (
                      <div key={index} className="attachment-item">
                        <div className="attachment-preview">
                          {file.type.startsWith('image/') && (
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Attachment ${index + 1}`}
                              className="attachment-image"
                            />
                          )}
                        </div>
                        <div className="attachment-info">
                          <span className="attachment-name">
                            {file.name}
                          </span>
                          <span className="attachment-size">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="remove-attachment"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submission Info */}
          <div className="submission-info">
            <div className="info-item">
              <strong>Rewards:</strong> Helpful feedback may be rewarded with ZP and SEB points!
            </div>
            <div className="info-item">
              <strong>Response:</strong> Our team reviews all feedback and may follow up with you.
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="submit-button"
            disabled={loading || !formData.title.trim() || !formData.message.trim()}
          >
            {loading ? (
              <div className="button-loading">
                <div className="spinner"></div>
                Submitting...
              </div>
            ) : (
              <>
                <Send size={16} />
                Submit Feedback
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FeedbackPage;