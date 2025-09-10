import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import taskService from '../services/taskService';
import './TasksPage.css';

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { updateUser } = useAuth();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const fetchedTasks = await taskService.getTasks();
      setTasks(fetchedTasks);
    } catch (err) {
      // Now, this error will only show for non-401 issues.
      setError('Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  };
  
  // handleCompleteTask function remains the same...
  const handleCompleteTask = async (taskId) => {
    try {
      const response = await taskService.completeTask(taskId);
      updateUser(response.user);
      setTasks(currentTasks => 
        currentTasks.map(task => 
          task.id === taskId ? { ...task, is_completed: true } : task
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to complete task.');
    }
  };

  if (loading) return <p style={{ textAlign: 'center', padding: '2rem' }}>Loading tasks...</p>;
  if (error) return <p style={{ textAlign: 'center', padding: '2rem' }}>{error}</p>;

  return (
    <div className="tasks-container">
      <div className="tasks-header">
        <h1>Available Tasks</h1>
        <button className="create-task-btn" disabled>
          Create Your Own Task (Coming Soon)
        </button>
      </div>

      <div className="task-list">
        {/* --- NEW LOGIC HERE --- */}
        {tasks.length === 0 ? (
          <p style={{ textAlign: 'center' }}>No currently active tasks. Check back later!</p>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="task-card">
              <div className="task-info">
                <h3>{task.title}</h3>
                <p>{task.description}</p>
              </div>
              <div className="task-rewards">
                <p>+{task.zp_reward} ZP | +{task.seb_reward} SEB</p>
                <button
                  className="task-action-btn"
                  onClick={() => handleCompleteTask(task.id)}
                  disabled={task.is_completed}
                >
                  {task.is_completed ? 'Completed' : 'Complete Task'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TasksPage;