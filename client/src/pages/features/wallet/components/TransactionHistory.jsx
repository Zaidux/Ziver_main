import { ArrowUpRight, ArrowDownLeft } from "lucide-react"

const TransactionHistory = ({ transactions }) => {
  return (
    <div className="transaction-list">
      {transactions.map((tx) => (
        <div key={tx.id} className="transaction-item">
          <div className="tx-left">
            <div className={`tx-icon ${tx.type}`}>
              {tx.type === "sent" ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
            </div>
            <div className="tx-info">
              <p className="tx-type">
                {tx.type === "sent" ? "Sent" : "Received"} {tx.asset}
              </p>
              <p className="tx-address">{tx.address}</p>
            </div>
          </div>
          <div className="tx-right">
            <p className={`tx-amount ${tx.type}`}>
              {tx.type === "sent" ? "-" : "+"}
              {tx.amount}
            </p>
            <p className="tx-time">{tx.timestamp}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default TransactionHistory
