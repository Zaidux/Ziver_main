import React, { useState, useEffect } from 'react';
import adminService from '../services/adminService';
import './TaskManagement.css';

const TaskManagement = () => {
  const [tasks, setTasks] = useState([]);
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    zp_reward: 0, 
    seb_reward: 0, 
    link_url: '', 
    task_type: 'in_app',
    verification_required: false,
    is_active: true 
  });
  const [validationRules, setValidationRules] = useState([]);
  const [currentRule, setCurrentRule] = useState({
    rule_type: 'mining_streak',
    operator: '>=',
    value: '',
    priority: 10,
    is_active: true
  });
  const [isEditing, setIsEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // Available rule types for in-app tasks
  const ruleTypes = [
    { value: 'mining_streak', label: 'Mining Streak (days)' },
    { value: 'referral_count', label: 'Referral Count' },
    { value: 'zp_balance', label: 'ZP Balance' },
    { value: 'tasks_completed', label: 'Tasks Completed' },
    { value: 'social_capital_score', label: 'Social Capital Score' },
    { value: 'mining_session_duration', label: 'Mining Duration (minutes)' }
  ];

  const operators = [
    { value: '>=', label: 'Greater than or equal to (≥)' },
    { value: '>', label: 'Greater than (>)' },
    { value: '==', label: 'Equal to (=)' },
    { value: '<=', label: 'Less than or equal to (≤)' },
    { value: '<', label: 'Less than (<)' }
  ];

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await adminService.getTasks();
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleRuleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentRule(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTaskTypeChange = (e) => {
    const taskType = e.target.value;
    setFormData(prev => ({
      ...prev,
      task_type: taskType,
      ...(taskType === 'in_app' && { link_url: '', verification_required: false })
    }));
    
    // Reset validation rules when switching to link tasks
    if (taskType === 'link') {
      setValidationRules([]);
    }
  };

  const addValidationRule = () => {
    if (!currentRule.value) {
      alert('Please enter a value for the rule');
      return;
    }

    const newRule = {
      ...currentRule,
      id: Date.now() // Temporary ID for UI
    };

    setValidationRules(prev => [...prev, newRule]);
    setCurrentRule({
      rule_type: 'mining_streak',
      operator: '>=',
      value: '',
      priority: 10,
      is_active: true
    });
  };

  const removeValidationRule = (index) => {
    setValidationRules(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const taskData = {
        ...formData,
        validation_rules: formData.task_type === 'in_app' ? validationRules : []
      };

      if (isEditing) {
        await adminService.updateTask(isEditing, taskData);
      } else {
        await adminService.createTask(taskData);
      }
      
      resetForm();
      fetchTasks();
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Error saving task: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (task) => {
    setIsEditing(task.id);
    setFormData({ 
      title: task.title, 
      description: task.description, 
      zp_reward: task.zp_reward, 
      seb_reward: task.seb_reward, 
      link_url: task.link_url || '', 
      task_type: task.link_url ? 'link' : 'in_app',
      verification_required: task.verification_required || false,
      is_active: task.is_active 
    });
    
    // TODO: Load existing validation rules for this task
    setValidationRules([]);
  };

  const resetForm = () => {
    setIsEditing(null);
    setFormData({ 
      title: '', 
      description: '', 
      zp_reward: 0, 
      seb_reward: 0, 
      link_url: '', 
      task_type: 'in_app',
      verification_required: false,
      is_active: true 
    });
    setValidationRules([]);
    setActiveTab('basic');
  };

  const getRuleLabel = (ruleType) => {
    const rule = ruleTypes.find(r => r.value === ruleType);
    return rule ? rule.label : ruleType;
  };

  return (
    <div className="task-management">
      <h2>Task Management</h2>

      {/* Task Creation/Edit Form */}
      <form onSubmit={handleSubmit} className="task-form">
        <h3>{isEditing ? 'Edit Task' : 'Create New Task'}</h3>

        {/* Tab Navigation */}
        <div className="form-tabs">
          <button 
            type="button"
            className={`tab-button ${activeTab === 'basic' ? 'active' : ''}`}
            onClick={() => setActiveTab('basic')}
          >
            Basic Info
          </button>
          {formData.task_type === 'in_app' && (
            <button 
              type="button"
              className={`tab-button ${activeTab === 'validation' ? 'active' : ''}`}
              onClick={() => setActiveTab('validation')}
            >
              Validation Rules ({validationRules.length})
            </button>
          )}
        </div>

        {/* Basic Info Tab */}
        {activeTab === 'basic' && (
          <div className="tab-content">
            <div className="form-group">
              <label>Task Type *</label>
              <div className="task-type-selector">
                <label>
                  <input
                    type="radio"
                    name="task_type"
                    value="in_app"
                    checked={formData.task_type === 'in_app'}
                    onChange={handleTaskTypeChange}
                  />
                  In-App Task (Requires Validation)
                </label>
                <label>
                  <input
                    type="radio"
                    name="task_type"
                    value="link"
                    checked={formData.task_type === 'link'}
                    onChange={handleTaskTypeChange}
                  />
                  Link Task (External URL)
                </label>
              </div>
            </div>

            <div className="form-group">
              <input 
                name="title" 
                value={formData.title} 
                onChange={handleChange} 
                placeholder="Task Title *" 
                required 
              />
            </div>

            <div className="form-group">
              <textarea 
                name="description" 
                value={formData.description} 
                onChange={handleChange} 
                placeholder="Description *" 
                required 
              />
            </div>

            <div className="rewards-group">
              <div className="form-group">
                <label>ZP Reward</label>
                <input 
                  name="zp_reward" 
                  type="number" 
                  value={formData.zp_reward} 
                  onChange={handleChange} 
                  min="0" 
                  required 
                />
              </div>

              <div className="form-group">
                <label>SEB Reward</label>
                <input 
                  name="seb_reward" 
                  type="number" 
                  value={formData.seb_reward} 
                  onChange={handleChange} 
                  min="0" 
                  required 
                />
              </div>
            </div>

            {formData.task_type === 'link' && (
              <>
                <div className="form-group">
                  <input 
                    name="link_url" 
                    value={formData.link_url} 
                    onChange={handleChange} 
                    placeholder="Link URL *" 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input 
                      name="verification_required" 
                      type="checkbox" 
                      checked={formData.verification_required} 
                      onChange={handleChange} 
                    />
                    Require return verification (user must return to app)
                  </label>
                </div>
              </>
            )}

            <div className="form-group">
              <label className="checkbox-label">
                <input 
                  name="is_active" 
                  type="checkbox" 
                  checked={formData.is_active} 
                  onChange={handleChange} 
                />
                Active
              </label>
            </div>
          </div>
        )}

        {/* Validation Rules Tab */}
        {activeTab === 'validation' && formData.task_type === 'in_app' && (
          <div className="tab-content">
            <div className="validation-rules">
              <h4>Add Validation Rules</h4>
              
              <div className="rule-form">
                <div className="rule-fields">
                  <select name="rule_type" value={currentRule.rule_type} onChange={handleRuleChange}>
                    {ruleTypes.map(rule => (
                      <option key={rule.value} value={rule.value}>{rule.label}</option>
                    ))}
                  </select>
                  
                  <select name="operator" value={currentRule.operator} onChange={handleRuleChange}>
                    {operators.map(op => (
                      <option key={op.value} value={op.value}>{op.label}</option>
                    ))}
                  </select>
                  
                  <input 
                    name="value" 
                    type="number"
                    value={currentRule.value} 
                    onChange={handleRuleChange}
                    placeholder="Value"
                    min="0"
                  />
                  
                  <button type="button" onClick={addValidationRule} className="add-rule-btn">
                    Add Rule
                  </button>
                </div>
              </div>

              {validationRules.length > 0 ? (
                <div className="rules-list">
                  <h5>Current Rules:</h5>
                  {validationRules.map((rule, index) => (
                    <div key={index} className="rule-item">
                      <span className="rule-text">
                        {getRuleLabel(rule.rule_type)} {rule.operator} {rule.value}
                      </span>
                      <button 
                        type="button" 
                        onClick={() => removeValidationRule(index)}
                        className="remove-rule-btn"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-rules">No validation rules added. Users will be able to complete this task immediately.</p>
              )}
            </div>
          </div>
        )}

        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? 'Saving...' : (isEditing ? 'Update Task' : 'Create Task')}
          </button>
          {isEditing && (
            <button type="button" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Tasks List */}
      <div className="tasks-list">
        <h3>Existing Tasks ({tasks.length})</h3>
        {tasks.length === 0 ? (
          <p className="no-tasks">No tasks created yet.</p>
        ) : (
          tasks.map(task => (
            <div key={task.id} className={`task-item ${task.is_active ? 'active' : 'inactive'}`}>
              <div className="task-header">
                <h4>{task.title}</h4>
                <span className={`task-type ${task.link_url ? 'link' : 'in-app'}`}>
                  {task.link_url ? '🔗 Link Task' : '📱 In-App Task'}
                </span>
                <span className={`status ${task.is_active ? 'active' : 'inactive'}`}>
                  {task.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <p className="task-description">{task.description}</p>

              <div className="task-details">
                <span>Reward: {task.zp_reward} ZP + {task.seb_reward} SEB</span>
                {task.link_url && (
                  <span className="task-link">URL: {task.link_url}</span>
                )}
                <span>Completions: {task.completion_count || 0}</span>
              </div>

              <div className="task-actions">
                <button onClick={() => handleEdit(task)}>Edit</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TaskManagement;