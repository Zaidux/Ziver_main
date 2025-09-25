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
    task_type: 'in_app', // 'in_app' or 'link'
    verification_required: false,
    is_active: true 
  });
  const [isEditing, setIsEditing] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const handleTaskTypeChange = (e) => {
    const taskType = e.target.value;
    setFormData(prev => ({
      ...prev,
      task_type: taskType,
      // Reset link-specific fields when switching to in_app
      ...(taskType === 'in_app' && { link_url: '', verification_required: false })
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isEditing) {
        await adminService.updateTask(isEditing, formData);
      } else {
        await adminService.createTask(formData);
      }
      resetForm();
      fetchTasks();
    } catch (error) {
      console.error('Error saving task:', error);
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
  };

  const deleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        // You'll need to add deleteTask to your adminService
        // await adminService.deleteTask(taskId);
        fetchTasks();
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  return (
    <div className="task-management">
      <h2>Task Management</h2>
      
      {/* Task Creation/Edit Form */}
      <form onSubmit={handleSubmit} className="task-form">
        <h3>{isEditing ? 'Edit Task' : 'Create New Task'}</h3>
        
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
              In-App Task
            </label>
            <label>
              <input
                type="radio"
                name="task_type"
                value="link"
                checked={formData.task_type === 'link'}
                onChange={handleTaskTypeChange}
              />
              Link Task
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
                required={formData.task_type === 'link'}
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
                {/* <button onClick={() => deleteTask(task.id)} className="delete-btn">Delete</button> */}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TaskManagement;