"use client"

import { useState } from "react"
import { Rocket, Vote, Gift, Lock, CheckCircle2 } from "lucide-react"
import "./SAFELaunchHub.css"

const SAFELaunchHub = () => {
  const [activeTab, setActiveTab] = useState("discover")
  const [selectedProject, setSelectedProject] = useState(null)

  const projects = [
    {
      id: 1,
      name: "ZiverAI Protocol",
      description: "Next-gen AI infrastructure for Web3",
      fundingGoal: 500000,
      raised: 350000,
      milestones: [
        { name: "MVP Launch", date: "2024-Q2", status: "completed" },
        { name: "Beta Release", date: "2024-Q3", status: "in-progress" },
        { name: "Mainnet", date: "2024-Q4", status: "pending" },
      ],
      badge: "Ziver Certified",
    },
    {
      id: 2,
      name: "DeFi Bridge",
      description: "Cross-chain liquidity protocol",
      fundingGoal: 300000,
      raised: 180000,
      milestones: [
        { name: "Smart Contracts", date: "2024-Q2", status: "completed" },
        { name: "Testnet", date: "2024-Q3", status: "pending" },
      ],
      badge: null,
    },
  ]

  const userInvestments = [
    { projectId: 1, amount: 1000, tokenSymbol: "ZIV", votingPower: 100 },
    { projectId: 2, amount: 500, tokenSymbol: "TON", votingPower: 50 },
  ]

  return (
    <div className="safe-launch-hub">
      <div className="hub-header">
        <h1>SAFE Launch Protocol</h1>
        <p>Secure presale investments with milestone-based funding</p>
      </div>

      <div className="hub-tabs">
        <button className={`tab ${activeTab === "discover" ? "active" : ""}`} onClick={() => setActiveTab("discover")}>
          <Rocket size={18} />
          Discover Projects
        </button>
        <button
          className={`tab ${activeTab === "investments" ? "active" : ""}`}
          onClick={() => setActiveTab("investments")}
        >
          <Gift size={18} />
          My Investments
        </button>
        <button className={`tab ${activeTab === "voting" ? "active" : ""}`} onClick={() => setActiveTab("voting")}>
          <Vote size={18} />
          Voting
        </button>
      </div>

      <div className="hub-content">
        {activeTab === "discover" && (
          <div className="projects-grid">
            {projects.map((project) => (
              <div key={project.id} className="project-card">
                {project.badge && <div className="project-badge">{project.badge}</div>}
                <h3>{project.name}</h3>
                <p className="project-description">{project.description}</p>

                <div className="funding-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${(project.raised / project.fundingGoal) * 100}%` }}
                    ></div>
                  </div>
                  <div className="funding-info">
                    <span>
                      ${project.raised.toLocaleString()} / ${project.fundingGoal.toLocaleString()}
                    </span>
                    <span>{Math.round((project.raised / project.fundingGoal) * 100)}%</span>
                  </div>
                </div>

                <div className="milestones-preview">
                  <h4>Milestones</h4>
                  {project.milestones.map((m, i) => (
                    <div key={i} className={`milestone ${m.status}`}>
                      <span className="milestone-name">{m.name}</span>
                      <span className="milestone-status">{m.status}</span>
                    </div>
                  ))}
                </div>

                <button className="invest-btn" onClick={() => setSelectedProject(project)}>
                  Invest Now
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === "investments" && (
          <div className="investments-section">
            {userInvestments.map((inv, i) => {
              const project = projects.find((p) => p.id === inv.projectId)
              return (
                <div key={i} className="investment-card">
                  <div className="investment-header">
                    <h3>{project.name}</h3>
                    <span className="investment-amount">
                      {inv.amount} {inv.tokenSymbol}
                    </span>
                  </div>
                  <div className="investment-details">
                    <div className="detail">
                      <span className="label">Voting Power</span>
                      <span className="value">{inv.votingPower}</span>
                    </div>
                    <div className="detail">
                      <span className="label">Status</span>
                      <span className="value">Active</span>
                    </div>
                  </div>
                  <button className="trade-btn">Trade on Pre-Market</button>
                </div>
              )
            })}
          </div>
        )}

        {activeTab === "voting" && (
          <div className="voting-section">
            <div className="voting-card">
              <h3>ZiverAI Protocol - Milestone Vote</h3>
              <p className="voting-description">Vote on Beta Release milestone completion</p>

              <div className="voting-options">
                <div className="vote-option">
                  <button className="vote-btn yes">
                    <CheckCircle2 size={20} />
                    Yes
                  </button>
                  <div className="vote-progress">
                    <div className="vote-bar yes-bar" style={{ width: "65%" }}></div>
                  </div>
                  <span className="vote-count">65% (1,234 votes)</span>
                </div>

                <div className="vote-option">
                  <button className="vote-btn no">
                    <Lock size={20} />
                    No
                  </button>
                  <div className="vote-progress">
                    <div className="vote-bar no-bar" style={{ width: "35%" }}></div>
                  </div>
                  <span className="vote-count">35% (567 votes)</span>
                </div>
              </div>

              <div className="voting-info">
                <p>
                  Vote ends in: <strong>24 hours</strong>
                </p>
                <p>
                  Your voting power: <strong>100</strong>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedProject && (
        <div className="invest-modal-overlay" onClick={() => setSelectedProject(null)}>
          <div className="invest-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Invest in {selectedProject.name}</h2>
            <div className="invest-form">
              <div className="form-group">
                <label>Amount</label>
                <input type="number" placeholder="Enter amount" />
              </div>
              <div className="form-group">
                <label>Token</label>
                <select>
                  <option>ZIV</option>
                  <option>TON</option>
                  <option>USDT</option>
                </select>
              </div>
              <div className="escrow-notice">
                <Lock size={16} />
                <p>Funds locked in escrow until milestones met</p>
              </div>
              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setSelectedProject(null)}>
                  Cancel
                </button>
                <button className="invest-confirm-btn">Confirm Investment</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SAFELaunchHub
