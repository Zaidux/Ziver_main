import { Wallet, Settings, Bell } from "lucide-react"

const WalletHeader = () => {
  return (
    <div className="wallet-header">
      <div className="header-left">
        <Wallet size={24} className="wallet-icon" />
        <div>
          <h1>Ziver Wallet</h1>
          <p className="header-subtitle">Secure • Fast • Decentralized</p>
        </div>
      </div>
      <div className="header-actions">
        <button className="header-btn" aria-label="Notifications">
          <Bell size={20} />
        </button>
        <button className="header-btn" aria-label="Settings">
          <Settings size={20} />
        </button>
      </div>
    </div>
  )
}

export default WalletHeader
