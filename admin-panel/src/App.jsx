import React from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import AdminLoginPage from "./pages/AdminLoginPage"
import Dashboard from "./pages/Dashboard"
import TaskManagement from "./pages/TaskManagement"
import Settings from "./pages/Settings"
import UserManagement from "./pages/UserManagement"
import SystemStatus from "./pages/SystemStatus"
import FeedbackManagement from "./pages/FeedbackManagement" // FIXED: Corrected spelling
import Layout from "./components/Layout"
import ProtectedRoute from "./components/ProtectedRoute"
import { ThemeProvider } from "./context/ThemeContext"
import TelegramAnnouncements from "./pages/TelegramAnnouncements";

function App() {
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
              <Route path="/system-status" element={<SystemStatus />} />.        <Route path="/telegram-announcements" element={<TelegramAnnouncements />} />
              <Route path="/feedback" element={<FeedbackManagement />} />
            </Route>
          </Route>
          <Route path="*" element={<AdminLoginPage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App