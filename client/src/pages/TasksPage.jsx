import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import taskService from '../services/taskService';
import './TasksPage.css';

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completingTask, setCompletingTask] = useState(null);
  const { updateUser, user } = useAuth();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const fetchedTasks = await taskService.getTasks();
      setTasks(fetchedTasks);
    } catch (err) {
      if (err.response?.status !== 401) {
        setError('Failed to load tasks. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (task) => {
    if (task.is_completed) return;
    
    setCompletingTask(task.id);
    
    try {
      // Handle link tasks differently
      if (task.link_url) {
        await handleLinkTask(task);
      } else {
        // Handle in-app tasks
        await completeInAppTask(task.id);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to complete task.');
    } finally {
      setCompletingTask(null);
    }
  };

  const handleLinkTask = async (task) => {
    // Open the link in a new tab
    const newWindow = window.open(task.link_url, '_blank', 'noopener,noreferrer');
    
    if (newWindow) {
      // If verification is required, wait for user to return
      if (task.verification_required) {
        const confirmed = window.confirm(
          `Please visit the link to complete the task. After visiting, return here and click OK to verify completion.`
        );
        
        if (confirmed) {
          await completeInAppTask(task.id);
        }
      } else {
        // No verification required, complete immediately
        await completeInAppTask(task.id);
      }
    } else {
      alert('Please allow popups to complete this task.');
    }
  };

  const completeInAppTask = async (taskId) => {
    const response = await taskService.completeTask(taskId);
    updateUser(response.user);
    setTasks(currentTasks => 
      currentTasks.map(task => 
        task.id === taskId ? { ...task, is_completed: true } : task
      )
    );
  };

  const getTaskButtonText = (task) => {
    if (task.is_completed) return 'Completed ✓';
    if (completingTask === task.id) return 'Completing...';
    
    if (task.link_url) {
      return task.verification_required ? 'Visit Link & Verify' : 'Visit Link';
    }
    
    return 'Complete Task';
  };

  const getTaskIcon = (task) => {
    if (task.link_url) return '🔗';
    return '📱';
  };

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Loading tasks...</p>
    </div>
  );

  if (error) return (
    <div className="error-container">
      <p>{error}</p>
      <button onClick={fetchTasks}>Try Again</button>
    </div>
  );

  return (
    <div className="tasks-container">
      <div className="tasks-header">
        <div className="header-content">
          <h1>Available Tasks</h1>
          <p>Complete tasks to earn ZP and SEB points</p>
        </div>
        
        <button className="create-task-btn" disabled title="Coming soon">
          Create Your Own Task (Coming Soon)
        </button>
      </div>

      <div className="tasks-stats">
        <div className="stat-card">
          <span className="stat-value">{tasks.filter(t => t.is_completed).length}</span>
          <span className="stat-label">Completed</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{tasks.filter(t => !t.is_completed).length}</span>
          <span className="stat-label">Available</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{user?.zp_balance || 0}</span>
          <span className="stat-label">Your ZP</span>
        </div>
      </div>

      <div className="task-list">
        {tasks.length === 0 ? (
          <div className="no-tasks">
            <p>No active tasks available at the moment.</p>
            <p>Check back later for new tasks!</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className={`task-card ${task.is_completed ? 'completed' : ''}`}>
              <div className="task-icon">{getTaskIcon(task)}</div>
              
              <div className="task-content">
                <div className="task-header">
                  <h3>{task.title}</h3>
                  {task.link_url && (
                    <span className="task-type-badge">External Link</span>
                  )}
                </div>
                
                <p className="task-description">{task.description}</p>
                
                {task.link_url && (
                  <div className="task-link-preview">
                    <small>Visit: {task.link_url.replace(/^https?:\/\//, '').split('/')[0]}</small>
                  </div>
                )}
                
                <div className="task-rewards">
                  <span className="reward zp-reward">+{task.zp_reward} ZP</span>
                  <span className="reward seb-reward">+{task.seb_reward} SEB</span>
                </div>
              </div>

              <div className="task-actions">
                <button
                  className={`complete-btn ${task.is_completed ? 'completed' : ''}`}
                  onClick={() => handleCompleteTask(task)}
                  disabled={task.is_completed || completingTask === task.id}
                >
                  {getTaskButtonText(task)}
                </button>
                
                {task.is_completed && (
                  <span className="completed-badge">Completed</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* In-App Task Instructions */}
      <div className="task-instructions">
        <h3>How to complete tasks:</h3>
        <ul>
          <li>📱 <strong>In-App Tasks:</strong> Click "Complete Task" to instantly earn rewards</li>
          <li>🔗 <strong>Link Tasks:</strong> You'll be redirected to complete the action</li>
          <li>✅ <strong>Verification:</strong> Some link tasks require you to return and confirm</li>
        </ul>
      </div>
    </div>
  );
};

export default TasksPage;