"use client"

import { useState, useEffect } from "react"
import adminService from "../services/adminService"
import { ClipboardList, Plus, Edit2, X } from "lucide-react"

const TaskManagement = () => {
  const [tasks, setTasks] = useState([])
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    zp_reward: 0,
    seb_reward: 0,
    link_url: "",
    task_type: "in_app",
    verification_required: false,
    is_active: true,
  })
  const [validationRules, setValidationRules] = useState([])
  const [currentRule, setCurrentRule] = useState({
    rule_type: "mining_streak",
    operator: ">=",
    value: "",
    priority: 10,
    is_active: true,
  })
  const [isEditing, setIsEditing] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")

  const ruleTypes = [
    { value: "mining_streak", label: "Mining Streak (days)" },
    { value: "referral_count", label: "Referral Count" },
    { value: "zp_balance", label: "ZP Balance" },
    { value: "tasks_completed", label: "Tasks Completed" },
    { value: "social_capital_score", label: "Social Capital Score" },
    { value: "mining_session_duration", label: "Mining Duration (minutes)" },
  ]

  const operators = [
    { value: ">=", label: "Greater than or equal to (≥)" },
    { value: ">", label: "Greater than (>)" },
    { value: "==", label: "Equal to (=)" },
    { value: "<=", label: "Less than or equal to (≤)" },
    { value: "<", label: "Less than (<)" },
  ]

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      const response = await adminService.getTasks()
      setTasks(response.data)
    } catch (error) {
      console.error("Error fetching tasks:", error)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleRuleChange = (e) => {
    const { name, value, type, checked } = e.target
    setCurrentRule((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleTaskTypeChange = (e) => {
    const taskType = e.target.value
    setFormData((prev) => ({
      ...prev,
      task_type: taskType,
      ...(taskType === "in_app" && { link_url: "", verification_required: false }),
    }))
    if (taskType === "link") {
      setValidationRules([])
    }
  }

  const addValidationRule = () => {
    if (!currentRule.value) {
      alert("Please enter a value for the rule")
      return
    }
    const newRule = {
      ...currentRule,
      id: Date.now(),
    }
    setValidationRules((prev) => [...prev, newRule])
    setCurrentRule({
      rule_type: "mining_streak",
      operator: ">=",
      value: "",
      priority: 10,
      is_active: true,
    })
  }

  const removeValidationRule = (index) => {
    setValidationRules((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const taskData = {
        ...formData,
        validation_rules:
          formData.task_type === "in_app"
            ? validationRules.map((rule) => ({
                rule_type: rule.rule_type,
                operator: rule.operator,
                value: rule.value.toString(),
                priority: Number.parseInt(rule.priority) || 10,
                is_active: rule.is_active !== false,
              }))
            : [],
      }

      if (isEditing) {
        await adminService.updateTask(isEditing, taskData)
      } else {
        await adminService.createTask(taskData)
      }
      resetForm()
      fetchTasks()
    } catch (error) {
      console.error("Error saving task:", error)
      alert("Error saving task: " + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = async (task) => {
  setIsEditing(task.id);
  setFormData({
    title: task.title,
    description: task.description,
    zp_reward: task.zp_reward,
    seb_reward: task.seb_reward,
    link_url: task.link_url || "",
    task_type: task.link_url ? "link" : "in_app",
    verification_required: task.verification_required || false,
    is_active: task.is_active,
  });

  // Load existing validation rules if available
  if (task.validation_rules && task.validation_rules.length > 0) {
    console.log(`Loading ${task.validation_rules.length} existing validation rules`);
    const formattedRules = task.validation_rules.map(rule => ({
      id: rule.id,
      rule_type: rule.rule_type,
      operator: rule.operator,
      value: rule.value,
      priority: rule.priority,
      is_active: rule.is_active
    }));
    setValidationRules(formattedRules);
  } else {
    setValidationRules([]);
  }
  
  setActiveTab("basic");
};

  const resetForm = () => {
    setIsEditing(null)
    setFormData({
      title: "",
      description: "",
      zp_reward: 0,
      seb_reward: 0,
      link_url: "",
      task_type: "in_app",
      verification_required: false,
      is_active: true,
    })
    setValidationRules([])
    setActiveTab("basic")
  }

  const getRuleLabel = (ruleType) => {
    const rule = ruleTypes.find((r) => r.value === ruleType)
    return rule ? rule.label : ruleType
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <ClipboardList size={32} />
            Task Management
          </h1>
          <p className="page-subtitle">Create and manage tasks for users</p>
        </div>
      </div>

      {/* Task Creation/Edit Form */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">{isEditing ? "Edit Task" : "Create New Task"}</h3>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Tab Navigation */}
          <div className="tabs">
            <button
              type="button"
              className={`tab ${activeTab === "basic" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("basic")}
            >
              Basic Info
            </button>
            {formData.task_type === "in_app" && (
              <button
                type="button"
                className={`tab ${activeTab === "validation" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("validation")}
              >
                Validation Rules ({validationRules.length})
              </button>
            )}
          </div>

          {/* Basic Info Tab */}
          {activeTab === "basic" && (
            <div className="tab-content">
              <div className="form-group">
                <label>Task Type *</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="task_type"
                      value="in_app"
                      checked={formData.task_type === "in_app"}
                      onChange={handleTaskTypeChange}
                    />
                    In-App Task (Requires Validation)
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="task_type"
                      value="link"
                      checked={formData.task_type === "link"}
                      onChange={handleTaskTypeChange}
                    />
                    Link Task (External URL)
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Task Title *</label>
                <input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter task title"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter task description"
                  rows="3"
                  required
                />
              </div>

              <div className="form-row">
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

              {formData.task_type === "link" && (
                <>
                  <div className="form-group">
                    <label>Link URL *</label>
                    <input
                      name="link_url"
                      value={formData.link_url}
                      onChange={handleChange}
                      placeholder="https://example.com"
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
                      Require return verification
                    </label>
                  </div>
                </>
              )}

              <div className="form-group">
                <label className="checkbox-label">
                  <input name="is_active" type="checkbox" checked={formData.is_active} onChange={handleChange} />
                  Active
                </label>
              </div>
            </div>
          )}

          {/* Validation Rules Tab */}
          {activeTab === "validation" && formData.task_type === "in_app" && (
            <div className="tab-content">
              <h4 className="section-title">Add Validation Rules</h4>
              <div className="rule-form">
                <select name="rule_type" value={currentRule.rule_type} onChange={handleRuleChange}>
                  {ruleTypes.map((rule) => (
                    <option key={rule.value} value={rule.value}>
                      {rule.label}
                    </option>
                  ))}
                </select>
                <select name="operator" value={currentRule.operator} onChange={handleRuleChange}>
                  {operators.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
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
                <button type="button" onClick={addValidationRule} className="btn btn-secondary">
                  <Plus size={16} />
                  Add Rule
                </button>
              </div>

              {validationRules.length > 0 ? (
                <div className="rules-list">
                  <h5>Current Rules:</h5>
                  {validationRules.map((rule, index) => (
                    <div key={index} className="rule-item">
                      <span>
                        {getRuleLabel(rule.rule_type)} {rule.operator} {rule.value}
                      </span>
                      <button type="button" onClick={() => removeValidationRule(index)} className="btn-icon btn-danger">
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-message">No validation rules added yet.</p>
              )}
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <div className="spinner"></div> : isEditing ? "Update Task" : "Create Task"}
            </button>
            {isEditing && (
              <button type="button" onClick={resetForm} className="btn btn-secondary">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Tasks List */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Existing Tasks</h3>
          <span className="badge">{tasks.length} tasks</span>
        </div>
        {tasks.length === 0 ? (
          <div className="empty-state">
            <ClipboardList size={48} />
            <p>No tasks created yet.</p>
          </div>
        ) : (
          <div className="tasks-grid">
            {tasks.map((task) => (
              <div key={task.id} className={`task-card ${task.is_active ? "" : "task-inactive"}`}>
                <div className="task-card-header">
                  <h4>{task.title}</h4>
                  <div className="task-badges">
                    <span className={`badge ${task.link_url ? "badge-info" : "badge-primary"}`}>
                      {task.link_url ? "🔗 Link" : "📱 In-App"}
                    </span>
                    <span className={`badge ${task.is_active ? "badge-success" : "badge-secondary"}`}>
                      {task.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                <p className="task-description">{task.description}</p>
                <div className="task-details">
                  <span>
                    💰 {task.zp_reward} ZP + {task.seb_reward} SEB
                  </span>
                  <span>✅ {task.completion_count || 0} completions</span>
                </div>
                <button onClick={() => handleEdit(task)} className="btn btn-sm btn-secondary">
                  <Edit2 size={14} />
                  Edit
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default TaskManagement
