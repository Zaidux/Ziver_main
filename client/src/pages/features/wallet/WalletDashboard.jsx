"use client"

import { useState } from "react"
import { TrendingUp } from "lucide-react"
import WalletHeader from "./components/WalletHeader"
import BalanceCard from "./components/BalanceCard"
import ActionButtons from "./components/ActionButtons"
import AssetsList from "./components/AssetsList"
import TransactionHistory from "./components/TransactionHistory"
import "./WalletDashboard.css"

const WalletDashboard = () => {
  const [showBalance, setShowBalance] = useState(true)
  const [selectedAsset, setSelectedAsset] = useState("all")

  const mockBalance = 2847.5
  const mockAssets = [
    { id: "ziv", name: "ZIV", symbol: "ZIV", balance: 44999999, price: 0.0, change: 0, icon: "Z", color: "#00ff80" },
    { id: "ton", name: "TON", symbol: "TON", balance: 0.034, price: 2.17, change: -1.68, icon: "◆", color: "#0098ea" },
    { id: "usdt", name: "USDT", symbol: "USDT", balance: 0, price: 1.0, change: 0, icon: "₮", color: "#26a17b" },
    {
      id: "eth",
      name: "Ethereum",
      symbol: "ETH",
      balance: 0.000083,
      price: 3875.96,
      change: -2.33,
      icon: "Ξ",
      color: "#627eea",
    },
    {
      id: "bnb",
      name: "BNB",
      symbol: "BNB",
      balance: 0.001014,
      price: 1159.1,
      change: -0.2,
      icon: "⬡",
      color: "#f3ba2f",
    },
  ]

  const mockTransactions = [
    {
      id: 1,
      type: "sent",
      asset: "TON",
      amount: 0.5,
      address: "UQBk...7dA5",
      timestamp: "2 hours ago",
      status: "confirmed",
    },
    {
      id: 2,
      type: "received",
      asset: "ZIV",
      amount: 1000,
      address: "UQBk...7dA5",
      timestamp: "1 day ago",
      status: "confirmed",
    },
    {
      id: 3,
      type: "sent",
      asset: "ETH",
      amount: 0.01,
      address: "0x742d...8f2a",
      timestamp: "3 days ago",
      status: "confirmed",
    },
  ]

  return (
    <div className="wallet-dashboard">
      <WalletHeader />

      <div className="wallet-content">
        {/* Balance Section */}
        <BalanceCard
          balance={mockBalance}
          showBalance={showBalance}
          onToggleBalance={() => setShowBalance(!showBalance)}
        />

        {/* Action Buttons */}
        <ActionButtons />

        {/* Assets Section */}
        <div className="assets-section">
          <div className="section-header">
            <h2>Your Assets</h2>
            <button className="filter-btn">
              <TrendingUp size={16} />
            </button>
          </div>
          <AssetsList assets={mockAssets} />
        </div>

        {/* Transaction History */}
        <div className="transactions-section">
          <div className="section-header">
            <h2>Recent Transactions</h2>
            <button className="view-all-btn">View All</button>
          </div>
          <TransactionHistory transactions={mockTransactions} />
        </div>
      </div>
    </div>
  )
}

export default WalletDashboard
