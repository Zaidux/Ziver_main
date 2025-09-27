import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import taskService from '../services/taskService';
import './TasksPage.css';

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completingTask, setCompletingTask] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const { updateUser, user } = useAuth();

  useEffect(() => {
    fetchTasks();
    fetchUserStats();
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

  const fetchUserStats = async () => {
    try {
      const stats = await taskService.getUserStats();
      setUserStats(stats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
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
        // Handle in-app tasks with validation
        await completeInAppTask(task);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to complete task.';
      alert(errorMessage);
      
      // Refresh tasks to update progress if validation failed
      if (errorMessage.includes('requirements not met')) {
        fetchTasks();
      }
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
          await completeInAppTask(task);
        }
      } else {
        // No verification required, complete immediately
        await completeInAppTask(task);
      }
    } else {
      alert('Please allow popups to complete this task.');
    }
  };

  const completeInAppTask = async (task) => {
    const response = await taskService.completeTask(task.id);
    updateUser(response.user);
    setTasks(currentTasks => 
      currentTasks.map(t => 
        t.id === task.id ? { ...t, is_completed: true, progress: null } : t
      )
    );
    // Refresh user stats after completion
    fetchUserStats();
  };

  const getTaskButtonText = (task) => {
    if (task.is_completed) return 'Completed ✓';
    if (completingTask === task.id) return 'Completing...';

    if (task.link_url) {
      return task.verification_required ? 'Visit Link & Verify' : 'Visit Link';
    }

    // For in-app tasks, show requirements status
    if (task.progress && !task.progress.canComplete) {
      return `Requirements (${task.progress.percentage}%)`;
    }

    return 'Complete Task';
  };

  const getTaskIcon = (task) => {
    if (task.link_url) return '🔗';
    return '📱';
  };

  const getProgressBar = (task) => {
    if (!task.progress || task.is_completed || task.link_url) return null;

    const percentage = task.progress.percentage || 0;
    
    return (
      <div className="progress-container">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <span className="progress-text">{percentage}% Complete</span>
      </div>
    );
  };

  const getRequirementsList = (task) => {
    if (!task.progress || task.is_completed || task.link_url) return null;

    return (
      <div className="requirements-list">
        <h4>Requirements:</h4>
        {task.progress.progress.map((rule, index) => (
          <div key={index} className={`requirement ${rule.isValid ? 'valid' : 'invalid'}`}>
            <span className="requirement-icon">{rule.isValid ? '✓' : '✗'}</span>
            <span className="requirement-text">{rule.message}</span>
          </div>
        ))}
      </div>
    );
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

      {/* Enhanced User Statistics */}
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
        <div className="stat-card">
          <span className="stat-value">{userStats?.mining_streak || 0}</span>
          <span className="stat-label">Day Streak</span>
        </div>
      </div>

      {/* User Progress Overview */}
      {userStats && (
        <div className="user-progress-overview">
          <h3>Your Progress</h3>
          <div className="progress-grid">
            <div className="progress-item">
              <span className="progress-label">Mining Streak</span>
              <span className="progress-value">{userStats.mining_streak} days</span>
            </div>
            <div className="progress-item">
              <span className="progress-label">Referrals</span>
              <span className="progress-value">{userStats.referral_count}</span>
            </div>
            <div className="progress-item">
              <span className="progress-label">Tasks Completed</span>
              <span className="progress-value">{userStats.tasks_completed}</span>
            </div>
            <div className="progress-item">
              <span className="progress-label">Social Capital</span>
              <span className="progress-value">{userStats.social_capital_score}</span>
            </div>
          </div>
        </div>
      )}

      <div className="task-list">
        {tasks.length === 0 ? (
          <div className="no-tasks">
            <p>No active tasks available at the moment.</p>
            <p>Check back later for new tasks!</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className={`task-card ${task.is_completed ? 'completed' : ''} ${task.progress && !task.progress.canComplete ? 'requirements-pending' : ''}`}>
              <div className="task-icon">{getTaskIcon(task)}</div>

              <div className="task-content">
                <div className="task-header">
                  <h3>{task.title}</h3>
                  <div className="task-badges">
                    {task.link_url && (
                      <span className="task-type-badge link-badge">External Link</span>
                    )}
                    {task.progress && !task.progress.canComplete && !task.is_completed && (
                      <span className="task-type-badge requirements-badge">Requirements Pending</span>
                    )}
                    {task.is_completed && (
                      <span className="task-type-badge completed-badge">Completed</span>
                    )}
                  </div>
                </div>

                <p className="task-description">{task.description}</p>

                {task.link_url && (
                  <div className="task-link-preview">
                    <small>Visit: {task.link_url.replace(/^https?:\/\//, '').split('/')[0]}</small>
                  </div>
                )}

                {/* Progress Bar for In-App Tasks */}
                {getProgressBar(task)}

                {/* Requirements List */}
                {getRequirementsList(task)}

                <div className="task-rewards">
                  <span className="reward zp-reward">+{task.zp_reward} ZP</span>
                  <span className="reward seb-reward">+{task.seb_reward} SEB</span>
                </div>
              </div>

              <div className="task-actions">
                <button
                  className={`complete-btn ${task.is_completed ? 'completed' : ''} ${task.progress && !task.progress.canComplete ? 'disabled' : ''}`}
                  onClick={() => handleCompleteTask(task)}
                  disabled={task.is_completed || completingTask === task.id || (task.progress && !task.progress.canComplete)}
                  title={task.progress && !task.progress.canComplete ? "Complete requirements first" : ""}
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

      {/* Task Instructions */}
      <div className="task-instructions">
        <h3>How to complete tasks:</h3>
        <ul>
          <li>📱 <strong>In-App Tasks:</strong> Meet the requirements shown above, then click "Complete Task"</li>
          <li>🔗 <strong>Link Tasks:</strong> You'll be redirected to complete the action</li>
          <li>✅ <strong>Verification:</strong> Some link tasks require you to return and confirm</li>
          <li>📊 <strong>Progress Tracking:</strong> Check your requirements above each task</li>
        </ul>
      </div>
    </div>
  );
};

export default TasksPage;