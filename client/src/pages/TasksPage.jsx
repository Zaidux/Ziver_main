"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import taskService from "../services/taskService"
import LoadingScreen from "../components/LoadingScreen"
import {
  CheckCircle2,
  Circle,
  ExternalLink,
  Copy,
  RefreshCw,
  Zap,
  Target,
  TrendingUp,
  Flame,
  AlertCircle,
  HelpCircle,
  ChevronDown,
} from "lucide-react"
import "./TasksPage.css"

const TasksPage = () => {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [completingTask, setCompletingTask] = useState(null)
  const [userStats, setUserStats] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [copySuccess, setCopySuccess] = useState("")
  const { updateUser, user } = useAuth()

  useEffect(() => {
    fetchTasks()
    fetchUserStats()
  }, [])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const fetchedTasks = await taskService.getTasks()
      setTasks(fetchedTasks)
    } catch (err) {
      if (err.response?.status !== 401) {
        setError("Failed to load tasks. Please try again later.")
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const fetchUserStats = async () => {
    try {
      const stats = await taskService.getUserStats()
      setUserStats(stats)
    } catch (error) {
      console.error("Error fetching user stats:", error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchTasks(), fetchUserStats()])
  }

  const handleCompleteTask = async (task) => {
    if (task.is_completed) return
    setCompletingTask(task.id)
    try {
      if (task.link_url) {
        await handleLinkTask(task)
      } else {
        await completeInAppTask(task)
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to complete task."
      showNotification(errorMessage, "error")
      if (errorMessage.includes("requirements not met")) {
        fetchTasks()
      }
    } finally {
      setCompletingTask(null)
    }
  }

  const handleLinkTask = async (task) => {
    try {
      const userAction = window.confirm(
        `📱 Task Instructions:\n\n1. Click OK to open the link\n2. Complete the required action\n3. Return to this app\n4. Click "Verify Completion" to claim your reward\n\nReady to continue?`,
      )
      if (!userAction) return

      const popupWidth = 500
      const popupHeight = 600
      const left = (window.screen.width - popupWidth) / 2
      const top = (window.screen.height - popupHeight) / 2

      const popup = window.open(
        task.link_url,
        "taskPopup",
        `width=${popupWidth},height=${popupHeight},left=${left},top=${top},resizable=yes,scrollbars=yes`,
      )

      if (popup) {
        popup.focus()
        const checkPopup = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkPopup)
            setTimeout(async () => {
              const verified = window.confirm(
                `Have you completed the task?\n\nClick OK to verify and claim your ${task.zp_reward} ZP reward!`,
              )
              if (verified) {
                await completeInAppTask(task)
              } else {
                showNotification("Task not completed. You can try again anytime.", "info")
              }
            }, 500)
          }
        }, 1000)

        setTimeout(() => {
          if (!popup || popup.closed || typeof popup.closed === "undefined") {
            clearInterval(checkPopup)
            const useSameTab = window.confirm(
              `Popups are blocked. Open in this tab instead?\n\nDon't worry - you can return and verify later.`,
            )
            if (useSameTab) {
              window.location.href = task.link_url
            }
          }
        }, 1000)
      } else {
        const useSameTab = window.confirm(
          `🔗 Open Link\n\nWe'll open the link in this tab. After completing the task:\n\n1. Return to this app\n2. Go back to Tasks\n3. Tap the task again to verify\n\nContinue?`,
        )
        if (useSameTab) {
          window.location.href = task.link_url
        }
      }
    } catch (error) {
      console.error("Error handling link task:", error)
      showNotification("Error opening task link. Please try again.", "error")
    }
  }

  const completeInAppTask = async (task) => {
    const response = await taskService.completeTask(task.id)
    updateUser(response.user)
    setTasks((currentTasks) =>
      currentTasks.map((t) => (t.id === task.id ? { ...t, is_completed: true, progress: null } : t)),
    )
    showNotification(`Task completed! +${task.zp_reward} ZP`, "success")
    fetchUserStats()
  }

  const showNotification = (message, type = "info") => {
    const notification = document.createElement("div")
    notification.className = `notification ${type}`
    notification.textContent = message
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: ${type === "success" ? "#00ff80" : type === "error" ? "#ff4444" : "#2196F3"};
      color: ${type === "success" ? "#000" : "#fff"};
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 1000;
      animation: slideIn 0.3s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      font-weight: 500;
      max-width: 300px;
      word-wrap: break-word;
    `
    document.body.appendChild(notification)
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = "slideOut 0.3s ease"
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove()
          }
        }, 300)
      }
    }, 3000)
  }

  const getTaskButtonText = (task) => {
    if (task.is_completed) return "Completed"
    if (completingTask === task.id) return "Completing..."
    if (task.link_url) {
      return "Open Task"
    }
    if (task.progress && !task.progress.canComplete) {
      return `${task.progress.percentage}% Complete`
    }
    return "Complete Task"
  }

  const getProgressBar = (task) => {
    if (!task.progress || task.is_completed || task.link_url) return null
    const percentage = task.progress.percentage || 0
    return (
      <div className="progress-container">
        <div className="progress-header">
          <span className="progress-label">Progress</span>
          <span className="progress-percentage">{percentage}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${percentage}%` }}></div>
        </div>
      </div>
    )
  }

  const getRequirementsList = (task) => {
    if (!task.progress || task.is_completed || task.link_url) return null
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
            <div key={index} className={`requirement-item ${rule.isValid ? "valid" : "invalid"}`}>
              <div className="requirement-icon">{rule.isValid ? <CheckCircle2 size={16} /> : <Circle size={16} />}</div>
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
    )
  }

  const getRequirementHint = (ruleType, expected, actual) => {
    const hints = {
      mining_streak: `You need ${expected - actual} more days`,
      referral_count: `You need ${expected - actual} more referrals`,
      zp_balance: `You need ${expected - actual} more ZP`,
      tasks_completed: `You need ${expected - actual} more tasks`,
      social_capital_score: `You need ${expected - actual} more SEB points`,
      mining_session_duration: `You need ${expected - actual} more minutes`,
    }
    return hints[ruleType] || "Keep going!"
  }

  const getTaskStatus = (task) => {
    if (task.is_completed) return "completed"
    if (task.link_url) return "link"
    if (task.progress && !task.progress.canComplete) return "in-progress"
    return "ready"
  }

  if (loading) {
    return <LoadingScreen message="Loading your tasks..." />
  }

  if (refreshing) {
    return (
      <div className="tasks-container">
        <div className="tasks-header">
          <div className="header-content">
            <h1>Available Tasks</h1>
            <p>Complete tasks to earn rewards</p>
          </div>
        </div>
        <LoadingScreen type="inline-overlay" message="Refreshing tasks..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="tasks-container">
        <div className="error-state">
          <AlertCircle size={48} className="error-icon" />
          <h3>Unable to Load Tasks</h3>
          <p>{error}</p>
          <button className="retry-button" onClick={fetchTasks}>
            <RefreshCw size={18} />
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="tasks-container">
      {/* Header */}
      <div className="tasks-header">
        <div className="header-content">
          <h1>Tasks</h1>
          <p>Complete tasks to earn ZP and SEB points</p>
        </div>
        <button
          className={`refresh-button ${refreshing ? "refreshing" : ""}`}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw size={20} />
        </button>
      </div>

      {/* Copy Success Notification */}
      {copySuccess && (
        <div className="copy-success-notification">
          <CheckCircle2 size={16} />
          {copySuccess}
        </div>
      )}

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="stat-item">
          <CheckCircle2 size={18} className="stat-icon" />
          <div className="stat-info">
            <span className="stat-value">{tasks.filter((t) => t.is_completed).length}</span>
            <span className="stat-label">Done</span>
          </div>
        </div>
        <div className="stat-item">
          <Target size={18} className="stat-icon" />
          <div className="stat-info">
            <span className="stat-value">{tasks.filter((t) => !t.is_completed).length}</span>
            <span className="stat-label">Todo</span>
          </div>
        </div>
        <div className="stat-item">
          <Zap size={18} className="stat-icon" />
          <div className="stat-info">
            <span className="stat-value">{user?.zp_balance || 0}</span>
            <span className="stat-label">ZP</span>
          </div>
        </div>
        <div className="stat-item highlight">
          <Flame size={18} className="stat-icon" />
          <div className="stat-info">
            <span className="stat-value">{userStats?.mining_streak || 0}</span>
            <span className="stat-label">Streak</span>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="task-list">
        {tasks.length === 0 ? (
          <div className="empty-state">
            <Target size={64} className="empty-icon" />
            <h3>No Tasks Available</h3>
            <p>Check back later for new tasks!</p>
          </div>
        ) : (
          tasks.map((task) => {
            const status = getTaskStatus(task)
            return (
              <div key={task.id} className={`task-card ${status}`} data-task-type={task.link_url ? "link" : "in-app"}>
                <div className="task-main">
                  <div className="task-icon">
                    {task.is_completed ? (
                      <CheckCircle2 size={24} />
                    ) : task.link_url ? (
                      <ExternalLink size={24} />
                    ) : (
                      <Target size={24} />
                    )}
                  </div>
                  <div className="task-content">
                    <div className="task-header">
                      <h3 className="task-title">{task.title}</h3>
                      <div className="task-meta">
                        <span className="task-type">{task.link_url ? "External" : "In-App"}</span>
                        {status === "completed" && <span className="task-status completed">Completed</span>}
                      </div>
                    </div>
                    <p className="task-description">{task.description}</p>

                    {getProgressBar(task)}
                    {getRequirementsList(task)}

                    {task.link_url && (
                      <div className="link-preview">
                        <ExternalLink size={14} />
                        <span className="link-domain">{new URL(task.link_url).hostname}</span>
                        <button
                          className="copy-link-btn"
                          onClick={() => {
                            navigator.clipboard
                              .writeText(task.link_url)
                              .then(() => {
                                setCopySuccess("Link copied to clipboard!")
                                setTimeout(() => setCopySuccess(""), 3000)
                              })
                              .catch(() => {
                                showNotification("Failed to copy link", "error")
                              })
                          }}
                        >
                          <Copy size={14} />
                          Copy
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="task-footer">
                  <div className="task-rewards">
                    <span className="reward zp">
                      <Zap size={14} />+{task.zp_reward}
                    </span>
                    <span className="reward seb">
                      <TrendingUp size={14} />+{task.seb_reward}
                    </span>
                  </div>
                  <button
                    className={`action-button ${status}`}
                    onClick={() => handleCompleteTask(task)}
                    disabled={
                      task.is_completed || completingTask === task.id || (task.progress && !task.progress.canComplete)
                    }
                  >
                    {completingTask === task.id ? (
                      <div className="button-loading">
                        <div className="button-spinner"></div>
                        Completing...
                      </div>
                    ) : (
                      <>
                        {task.is_completed && <CheckCircle2 size={16} />}
                        {task.link_url && !task.is_completed && <ExternalLink size={16} />}
                        {getTaskButtonText(task)}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Quick Help */}
      <div className="quick-help">
        <details className="help-accordion">
          <summary className="help-summary">
            <HelpCircle size={18} />
            <span>How to complete tasks</span>
            <ChevronDown size={18} className="chevron" />
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
  )
}

export default TasksPage
