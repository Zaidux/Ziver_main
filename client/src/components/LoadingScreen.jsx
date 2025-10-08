import "./LoadingScreen.css"

const LoadingScreen = ({ message = "Loading...", type = "fullscreen" }) => {
  // type can be "fullscreen" (initial load) or "inline-overlay" (page refresh)

  if (type === "inline-overlay") {
    return (
      <div className="loading-overlay">
        <div className="loading-content">
          <div className="ziver-logo-loader">
            <span className="logo-z">Z</span>
          </div>
          <p className="loading-message">{message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="loading-screen-fullscreen">
      <div className="loading-content">
        <div className="ziver-logo-loader large">
          <span className="logo-z">Z</span>
        </div>
        <p className="loading-message">{message}</p>
        <div className="loading-bar">
          <div className="loading-bar-fill"></div>
        </div>
      </div>
    </div>
  )
}

export default LoadingScreen
