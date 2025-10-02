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
  const [refreshing, setRefreshing] = useState(false);
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
      setRefreshing(false);
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

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchTasks(), fetchUserStats()]);
  };

  const handleCompleteTask = async (task) => {
    if (task.is_completed) return;

    setCompletingTask(task.id);

    try {
      if (task.link_url) {
        await handleLinkTask(task);
      } else {
        await completeInAppTask(task);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to complete task.';

      // Show toast-like notification instead of alert
      showNotification(errorMessage, 'error');

      if (errorMessage.includes('requirements not met')) {
        fetchTasks(); // Refresh to update progress
      }
    } finally {
      setCompletingTask(null);
    }
  };

  const handleLinkTask = async (task) => {
    try {
      // Show instructions first
      const userAction = window.confirm(
        `📱 Task Instructions:\n\n1. Click OK to open the link\n2. Complete the required action\n3. Return to this app\n4. Click "Verify Completion" to claim your reward\n\nReady to continue?`
      );

      if (!userAction) return;

      // Create a custom popup with better UX
      const popupWidth = 500;
      const popupHeight = 600;
      const left = (window.screen.width - popupWidth) / 2;
      const top = (window.screen.height - popupHeight) / 2;

      const popup = window.open(
        task.link_url,
        'taskPopup',
        `width=${popupWidth},height=${popupHeight},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );

      if (popup) {
        // Focus on the popup
        popup.focus();
        
        // Check if popup is closed periodically
        const checkPopup = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkPopup);
            // When popup closes, ask for verification
            setTimeout(async () => {
              const verified = window.confirm(
                `Have you completed the task?\n\nClick OK to verify and claim your ${task.zp_reward} ZP reward!`
              );
              
              if (verified) {
                await completeInAppTask(task);
              } else {
                showNotification('Task not completed. You can try again anytime.', 'info');
              }
            }, 500);
          }
        }, 1000);

        // Fallback: if popup is blocked, use same tab
        setTimeout(() => {
          if (!popup || popup.closed || typeof popup.closed === 'undefined') {
            clearInterval(checkPopup);
            const useSameTab = window.confirm(
              `Popups are blocked. Open in this tab instead?\n\nDon't worry - you can return and verify later.`
            );
            
            if (useSameTab) {
              window.location.href = task.link_url;
            }
          }
        }, 1000);
      } else {
        // Popup blocked - use same tab with clear instructions
        const useSameTab = window.confirm(
          `🔗 Open Link\n\nWe'll open the link in this tab. After completing the task:\n\n1. Return to this app\n2. Go back to Tasks\n3. Tap the task again to verify\n\nContinue?`
        );
        
        if (useSameTab) {
          window.location.href = task.link_url;
        }
      }
    } catch (error) {
      console.error('Error handling link task:', error);
      showNotification('Error opening task link. Please try again.', 'error');
    }
  };

  const completeInAppTask = async (task) => {
    const response = await taskService.completeTask(task.id);
    updateUser(response.user);

    // Optimistic UI update
    setTasks(currentTasks => 
      currentTasks.map(t => 
        t.id === task.id ? { ...t, is_completed: true, progress: null } : t
      )
    );

    showNotification(`Task completed! +${task.zp_reward} ZP`, 'success');
    fetchUserStats();
  };

  const showNotification = (message, type = 'info') => {
    // Simple toast notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  };

  const getTaskButtonText = (task) => {
    if (task.is_completed) return 'Completed ✓';
    if (completingTask === task.id) return 'Completing...';

    if (task.link_url) {
      return 'Open Task 🔗'; // Clearer text
    }

    if (task.progress && !task.progress.canComplete) {
      return `${task.progress.percentage}% Complete`;
    }

    return 'Complete Task';
  };

  const getTaskIcon = (task) => {
    if (task.link_url) return '🔗';
    if (task.is_completed) return '✅';
    return '📱';
  };

  const getProgressBar = (task) => {
    if (!task.progress || task.is_completed || task.link_url) return null;

    const percentage = task.progress.percentage || 0;

    return (
      <div className="progress-container">
        <div className="progress-header">
          <span className="progress-label">Progress</span>
          <span className="progress-percentage">{percentage}%</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    );
  };

  const getRequirementsList = (task) => {
    if (!task.progress || task.is_completed || task.link_url) return null;

    return (
      <div className="requirements-list">
        <div className="requirements-header">
          <span className="requirements-title">Requirements</span>
          <span className="requirements-count">
            {task.progress.completedCount}/{task.progress.totalCount}
          </span>
        </div>
        <div className="requirements-grid">
          {task.progress.progress.map((rule, index) => (
            <div key={index} className={`requirement-item ${rule.isValid ? 'valid' : 'invalid'}`}>
              <div className="requirement-icon">
                {rule.isValid ? '✓' : '●'}
              </div>
              <div className="requirement-content">
                <span className="requirement-text">{rule.message}</span>
                {!rule.isValid && (
                  <span className="requirement-hint">
                    {getRequirementHint(rule.rule_type, rule.expectedValue, rule.actualValue)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const getRequirementHint = (ruleType, expected, actual) => {
    const hints = {
      mining_streak: `You need ${expected - actual} more days`,
      referral_count: `You need ${expected - actual} more referrals`,
      zp_balance: `You need ${expected - actual} more ZP`,
      tasks_completed: `You need ${expected - actual} more tasks`,
      social_capital_score: `You need ${expected - actual} more SEB points`,
      mining_session_duration: `You need ${expected - actual} more minutes`
    };
    return hints[ruleType] || 'Keep going!';
  };

  const getTaskStatus = (task) => {
    if (task.is_completed) return 'completed';
    if (task.link_url) return 'link';
    if (task.progress && !task.progress.canComplete) return 'in-progress';
    return 'ready';
  };

  // Enhanced loading state
  if (loading) {
    return (
      <div className="tasks-container">
        <div className="tasks-header">
          <div className="header-content">
            <h1>Available Tasks</h1>
            <p>Complete tasks to earn rewards</p>
          </div>
        </div>

        <div className="loading-skeleton">
          {[1, 2, 3].map(i => (
            <div key={i} className="task-skeleton">
              <div className="skeleton-icon"></div>
              <div className="skeleton-content">
                <div className="skeleton-title"></div>
                <div className="skeleton-description"></div>
                <div className="skeleton-progress"></div>
              </div>
              <div className="skeleton-action"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tasks-container">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Unable to Load Tasks</h3>
          <p>{error}</p>
          <button className="retry-button" onClick={fetchTasks}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tasks-container">
      {/* Header with pull-to-refresh */}
      <div className="tasks-header">
        <div className="header-content">
          <h1>Tasks</h1>
          <p>Complete tasks to earn ZP and SEB points</p>
        </div>

        <div className="header-actions">
          <button 
            className={`refresh-button ${refreshing ? 'refreshing' : ''}`}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? '⟳' : '↻'}
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="stat-item">
          <span className="stat-value">{tasks.filter(t => t.is_completed).length}</span>
          <span className="stat-label">Done</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{tasks.filter(t => !t.is_completed).length}</span>
          <span className="stat-label">Todo</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{user?.zp_balance || 0}</span>
          <span className="stat-label">ZP</span>
        </div>
        <div className="stat-item highlight">
          <span className="stat-value">{userStats?.mining_streak || 0}</span>
          <span className="stat-label">Streak</span>
        </div>
      </div>

      {/* Enhanced Task List */}
      <div className="task-list">
        {tasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No Tasks Available</h3>
            <p>Check back later for new tasks!</p>
          </div>
        ) : (
          tasks.map((task) => {
            const status = getTaskStatus(task);

            return (
              <div 
                key={task.id} 
                className={`task-card ${status}`}
                data-task-type={task.link_url ? 'link' : 'in-app'}
              >
                <div className="task-main">
                  <div className="task-icon">{getTaskIcon(task)}</div>

                  <div className="task-content">
                    <div className="task-header">
                      <h3 className="task-title">{task.title}</h3>
                      <div className="task-meta">
                        <span className="task-type">
                          {task.link_url ? 'External' : 'In-App'}
                        </span>
                        {status === 'completed' && (
                          <span className="task-status completed">Completed</span>
                        )}
                      </div>
                    </div>

                    <p className="task-description">{task.description}</p>

                    {/* Progress and Requirements */}
                    {getProgressBar(task)}
                    {getRequirementsList(task)}

                    {task.link_url && (
                      <div className="link-preview">
                        <span className="link-domain">
                          {new URL(task.link_url).hostname}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="task-footer">
                  <div className="task-rewards">
                    <span className="reward zp">+{task.zp_reward} ZP</span>
                    <span className="reward seb">+{task.seb_reward} SEB</span>
                  </div>

                  <button
                    className={`action-button ${status}`}
                    onClick={() => handleCompleteTask(task)}
                    disabled={
                      task.is_completed || 
                      completingTask === task.id || 
                      (task.progress && !task.progress.canComplete)
                    }
                  >
                    {getTaskButtonText(task)}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Help */}
      <div className="quick-help">
        <details className="help-accordion">
          <summary className="help-summary">
            <span>💡 How to complete tasks</span>
          </summary>
          <div className="help-content">
            <div className="help-item">
              <strong>In-App Tasks:</strong> Meet all requirements, then tap "Complete Task"
            </div>
            <div className="help-item">
              <strong>Link Tasks:</strong> Tap "Open Task" to open in browser
            </div>
            <div className="help-item">
              <strong>Progress:</strong> Track your completion status above each task
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

export default TasksPage;