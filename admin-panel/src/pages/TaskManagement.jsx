import React, { useState, useEffect } from 'react';
import adminService from '../services/adminService';
// You can create a TaskManagement.css for styling
// import './TaskManagement.css';

const TaskManagement = () => {
  const [tasks, setTasks] = useState([]);
  const [formData, setFormData] = useState({ title: '', description: '', zp_reward: 0, seb_reward: 0, link_url: '', is_active: true });
  const [isEditing, setIsEditing] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const response = await adminService.getTasks();
    setTasks(response.data);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isEditing) {
      await adminService.updateTask(isEditing, formData);
    } else {
      await adminService.createTask(formData);
    }
    resetForm();
    fetchTasks();
  };

  const handleEdit = (task) => {
    setIsEditing(task.id);
    setFormData({ ...task });
  };

  const resetForm = () => {
    setIsEditing(null);
    setFormData({ title: '', description: '', zp_reward: 0, seb_reward: 0, link_url: '', is_active: true });
  };

  return (
    <div>
      <h2>Task Management</h2>
      <form onSubmit={handleSubmit} className="task-form"> {/* Add styles for this class */}
        <h3>{isEditing ? 'Edit Task' : 'Create New Task'}</h3>
        <input name="title" value={formData.title} onChange={handleChange} placeholder="Task Title" required />
        <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description" />
        <input name="zp_reward" type="number" value={formData.zp_reward} onChange={handleChange} placeholder="ZP Reward" required />
        <input name="seb_reward" type="number" value={formData.seb_reward} onChange={handleChange} placeholder="SEB Reward" required />
        <input name="link_url" value={formData.link_url} onChange={handleChange} placeholder="Link URL (optional)" />
        <label><input name="is_active" type="checkbox" checked={formData.is_active} onChange={handleChange} /> Active</label>
        <button type="submit">{isEditing ? 'Update Task' : 'Create Task'}</button>
        {isEditing && <button type="button" onClick={resetForm}>Cancel Edit</button>}
      </form>

      <h3>Existing Tasks</h3>
      <div className="task-list"> {/* Add styles for this class */}
        {tasks.map(task => (
          <div key={task.id} className="task-item">
            <h4>{task.title} ({task.is_active ? 'Active' : 'Inactive'})</h4>
            <p>ZP: {task.zp_reward} | SEB: {task.seb_reward}</p>
            <button onClick={() => handleEdit(task)}>Edit</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskManagement;