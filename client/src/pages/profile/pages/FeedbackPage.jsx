import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { feedbackService } from '../../../services/feedbackService'; // Add this import
import { 
  ArrowLeft, 
  Paperclip, 
  Send, 
  AlertCircle, 
  CheckCircle, 
  Lightbulb,
  Bug,
  Frown,
  Rocket,
  Zap,
  AlertTriangle,
  Check
} from 'lucide-react';
import './FeedbackPage.css';

const FeedbackPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'suggestion',
    priority: 'medium'
  });
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const feedbackTypes = [
    { value: 'suggestion', label: 'Suggestion', emoji: '💡', icon: Lightbulb },
    { value: 'bug', label: 'Bug Report', emoji: '🐛', icon: Bug },
    { value: 'complaint', label: 'Complaint', emoji: '😠', icon: Frown },
    { value: 'feature', label: 'Feature Request', emoji: '🚀', icon: Rocket }
  ];

  const priorityLevels = [
    { value: 'low', label: 'Low', color: '#10B981', icon: Check },
    { value: 'medium', label: 'Medium', color: '#F59E0B', icon: AlertTriangle },
    { value: 'high', label: 'High', color: '#EF4444', icon: Zap }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Input changed: ${name} = ${value}`); // Debug
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    clearMessages();
  };

  // FIXED: Separate handler for radio buttons
  const handleRadioChange = (name, value) => {
    console.log(`Radio changed: ${name} = ${value}`); // Debug
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

    console.log('Submitting form data:', formData);

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
      // Use the feedback service instead of direct fetch
      const result = await feedbackService.submitFeedback(
        formData,
        attachments,
        user.token
      );

      // Handle the result
      if (result.success) {
        setMessage(result.message || 'Thank you for your feedback! We\'ll review it and get back to you soon.');
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
      console.error('❌ Feedback submission error:', err);
      setError(`Submission failed: ${err.message}. Please try again.`);
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
          type="button"
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
              {feedbackTypes.map(({ value, label, emoji, icon: Icon }) => (
                <label key={value} className="type-option">
                  <input
                    type="radio"
                    name="type"
                    value={value}
                    checked={formData.type === value}
                    onChange={(e) => handleRadioChange('type', e.target.value)}
                  />
                  <span className="option-content">
                    <span className="option-icon">
                      <Icon size={20} />
                    </span>
                    <span className="option-emoji">{emoji}</span>
                    <span className="option-label">{label}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Priority Level - FIXED: Using proper radio button handling */}
          <div className="form-section">
            <label className="section-label">Priority Level</label>
            <div className="priority-options">
              {priorityLevels.map(({ value, label, color, icon: Icon }) => (
                <label key={value} className="priority-option">
                  <input
                    type="radio"
                    name="priority"
                    value={value}
                    checked={formData.priority === value}
                    onChange={(e) => handleRadioChange('priority', e.target.value)}
                  />
                  <span className="priority-content">
                    <span 
                      className="priority-indicator"
                      style={{ backgroundColor: color }}
                    >
                      <Icon size={14} />
                    </span>
                    <span className="priority-label">{label}</span>
                  </span>
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