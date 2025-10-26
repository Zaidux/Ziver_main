import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AdminLoginPage from "./pages/AdminLoginPage";
import Dashboard from "./pages/Dashboard";
import TaskManagement from "./pages/TaskManagement";
import Settings from "./pages/Settings";
import UserManagement from "./pages/UserManagement";
import SystemStatus from "./pages/SystemStatus";
import FeedbackManagement from "./pages/FeedbackManagement";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { ThemeProvider } from "./context/ThemeContext";
import TelegramAnnouncement from "./pages/TelegramAnnouncement";
import backendService from "./services/backendService";
import "./App.css";

function App() {
  const [backendInitialized, setBackendInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState(null);

  useEffect(() => {
    const initializeBackend = async () => {
      try {
        await backendService.initialize();
        setBackendInitialized(true);
        
        // Start health checks
        backendService.startHealthChecks();
      } catch (error) {
        console.error('Failed to initialize backend service:', error);
        setInitializationError(error.message);
        
        // Try to use AWS as fallback
        try {
          backendService.selectBackend('aws');
          setBackendInitialized(true);
        } catch (fallbackError) {
          setInitializationError('All backends are unavailable');
        }
      }
    };

    initializeBackend();

    return () => {
      backendService.stopHealthChecks();
    };
  }, []);

  if (!backendInitialized) {
    return (
      <div className="app-initializing">
        <div className="initialization-message">
          {initializationError ? (
            <>
              <h2>Backend Connection Error</h2>
              <p>{initializationError}</p>
              <p>Please check your network connection and try again.</p>
              <button onClick={() => window.location.reload()}>
                Retry Connection
              </button>
            </>
          ) : (
            <>
              <h2>Initializing Admin Panel</h2>
              <p>Connecting to backend services...</p>
              <div className="loading-spinner"></div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<AdminLoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tasks" element={<TaskManagement />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/system-status" element={<SystemStatus />} />
              <Route path="/telegram-announcement" element={<TelegramAnnouncement />} />
              <Route path="/feedback" element={<FeedbackManagement />} />
            </Route>
          </Route>
          <Route path="*" element={<AdminLoginPage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;