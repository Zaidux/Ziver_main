import { Smartphone, Cloud, Key, Lock, AlertCircle } from "lucide-react"
import "./MPCSecurityStatus.css"

const MPCSecurityStatus = () => {
  const shards = [
    { id: "hot", name: "Hot Shard", icon: Smartphone, location: "Your Device", status: "active" },
    { id: "security", name: "Security Shard", icon: Cloud, location: "Ziver Servers", status: "active" },
    { id: "recovery", name: "Recovery Shard", icon: Key, location: "Cloud Guardian", status: "active" },
  ]

  return (
    <div className="mpc-security-status">
      <div className="security-header">
        <div className="security-badge">
          <Lock size={20} />
          <span>Secure</span>
        </div>
        <p className="security-message">No seed phrases needed – secured by MPC</p>
      </div>

      <div className="shards-grid">
        {shards.map((shard) => {
          const Icon = shard.icon
          return (
            <div key={shard.id} className={`shard-card ${shard.status}`}>
              <div className="shard-icon">
                <Icon size={24} />
              </div>
              <h3>{shard.name}</h3>
              <p className="shard-location">{shard.location}</p>
              <div className="shard-status">
                <span className="status-dot"></span>
                <span className="status-text">{shard.status}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="security-info">
        <AlertCircle size={18} />
        <p>Transactions require 2/3 shards without reconstructing the full key</p>
      </div>
    </div>
  )
}

export default MPCSecurityStatus
