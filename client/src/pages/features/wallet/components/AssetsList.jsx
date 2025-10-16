const AssetsList = ({ assets }) => {
  return (
    <div className="assets-list">
      {assets.map((asset) => (
        <div key={asset.id} className="asset-item">
          <div className="asset-left">
            <div className="asset-icon" style={{ backgroundColor: asset.color }}>
              {asset.icon}
            </div>
            <div className="asset-info">
              <h3 className="asset-name">{asset.name}</h3>
              <p className="asset-price">${asset.price.toFixed(2)}</p>
            </div>
          </div>
          <div className="asset-right">
            <p className="asset-balance">{asset.balance.toLocaleString()}</p>
            <p className={`asset-change ${asset.change < 0 ? "negative" : "positive"}`}>
              {asset.change > 0 ? "+" : ""}
              {asset.change.toFixed(2)}%
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default AssetsList
