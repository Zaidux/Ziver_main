import { Send, ArrowDownLeft, Scan, Shapes as Swap2, TrendingUp } from "lucide-react"

const ActionButtons = () => {
  return (
    <div className="action-buttons">
      <button className="action-btn send">
        <Send size={20} />
        <span>Send</span>
      </button>
      <button className="action-btn receive">
        <ArrowDownLeft size={20} />
        <span>Receive</span>
      </button>
      <button className="action-btn scan">
        <Scan size={20} />
        <span>Scan</span>
      </button>
      <button className="action-btn swap">
        <Swap2 size={20} />
        <span>Swap</span>
      </button>
      <button className="action-btn stake">
        <TrendingUp size={20} />
        <span>Stake</span>
      </button>
    </div>
  )
}

export default ActionButtons
