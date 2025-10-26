// Enhanced BackendStatus with individual API monitoring
"use client"

import React, { useState, useEffect } from 'react';
import { Server, CheckCircle, XCircle, AlertTriangle, RefreshCw, Database, Key, Users, Shield, ClipboardList, Cpu } from 'lucide-react';
import backendService from '../services/backendService';
import './BackendStatus.css';

const BackendStatus = () => {
  const [backends, setBackends] = useState([]);
  const [currentBackend, setCurrentBackend] = useState(null);
  const [apiServices, setApiServices] = useState({});
  const [loading, setLoading] = useState(false);

  const apiEndpoints = [
    { key: 'auth', name: 'Authentication API', endpoint: '/api/auth/test', icon: Key },
    { key: 'user', name: 'User API', endpoint: '/api/user/heartbeat', icon: Users },
    { key: 'mining', name: 'Mining API', endpoint: '/api/mining/status', icon: Cpu },
    { key: 'tasks', name: 'Tasks API', endpoint: '/api/tasks', icon: ClipboardList },
    { key: 'referrals', name: 'Referrals API', endpoint: '/api/referrals', icon: Shield },
    { key: 'admin', name: 'Admin API', endpoint: '/api/admin/summary', icon: Database },
    { key: 'system', name: 'System API', endpoint: '/api/system/ping', icon: Server },
    { key: 'telegram', name: 'Telegram API', endpoint: '/api/telegram/health', icon: Shield }
  ];

  const checkBackendHealth = async () => {
    setLoading(true);
    try {
      const backendStatus = await backendService.checkAllBackends();
      setBackends(backendStatus);
      setCurrentBackend(backendService.currentBackend);

      // Check all individual API endpoints for current backend
      if (backendService.currentBackend) {
        const baseUrl = backendService.currentBackend.url;
        const apiStatuses = {};
        
        for (const api of apiEndpoints) {
          apiStatuses[api.key] = await checkEndpoint(`${baseUrl}${api.endpoint}`);
        }
        
        setApiServices(apiStatuses);
      }
    } catch (error) {
      console.error('Error checking backend health:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkEndpoint = async (url) => {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        return 'operational';
      } else if (response.status === 401 || response.status === 403) {
        // Auth required endpoints are still "operational" if they respond
        return 'operational';
      } else {
        return 'degraded';
      }
    } catch (error) {
      return 'down';
    }
  };

  const handleBackendSelect = async (backendKey) => {
    try {
      const selected = backendService.selectBackend(backendKey);
      setCurrentBackend(selected);
      
      // Verify the selected backend is healthy
      const health = await backendService.checkBackendHealth(selected);
      if (health.status !== 'healthy') {
        throw new Error('Selected backend is not healthy');
      }
      
      alert(`Switched to ${selected.name}`);
      await checkBackendHealth(); // Refresh status
    } catch (error) {
      alert(`Failed to switch backend: ${error.message}`);
      await checkBackendHealth();
    }
  };

  const handleAutoSelect = async () => {
    try {
      const selected = await backendService.autoSelectBackend();
      setCurrentBackend(selected);
      alert(`Auto-selected: ${selected.name}`);
      await checkBackendHealth(); // Refresh status
    } catch (error) {
      alert('No healthy backends available');
    }
  };

  useEffect(() => {
    checkBackendHealth();
    
    // Listen for health updates from backend service
    const handleHealthUpdate = (event) => {
      setBackends(event.detail.backends);
      setCurrentBackend(backendService.currentBackend);
    };

    window.addEventListener('backendHealthUpdate', handleHealthUpdate);
    
    // Start health checks
    backendService.startHealthChecks();

    return () => {
      window.removeEventListener('backendHealthUpdate', handleHealthUpdate);
      backendService.stopHealthChecks();
    };
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case "healthy":
      case "operational": 
        return <CheckCircle size={16} className="text-success" />;
      case "degraded": 
        return <AlertTriangle size={16} className="text-warning" />;
      case "down": 
      case "unhealthy":
      case "offline":
        return <XCircle size={16} className="text-danger" />;
      case "checking": 
        return <RefreshCw size={16} className="spinner" />;
      default: 
        return <AlertTriangle size={16} className="text-muted" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "healthy":
      case "operational": 
        return "#10B981";
      case "degraded": 
        return "#F59E0B";
      case "down": 
      case "unhealthy":
      case "offline":
        return "#EF4444";
      case "checking": 
        return "#6B7280";
      default: 
        return "#6B7280";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "healthy":
      case "operational": 
        return "Operational";
      case "degraded": 
        return "Degraded";
      case "down": 
      case "unhealthy":
      case "offline":
        return "Down";
      case "checking": 
        return "Checking...";
      default: 
        return "Unknown";
    }
  };

  return (
    <div className="space-y-6">
      {/* Multi-Backend Connection Status */}
      <div className="card">
        <div className="card-header">
          <Server size={20} />
          <h2 className="card-title">Backend Connections</h2>
          <div className="card-header-actions">
            <button onClick={checkBackendHealth} disabled={loading} className="btn btn-sm btn-secondary">
              <RefreshCw size={14} className={loading ? "spinner" : ""} />
              Refresh
            </button>
            <button onClick={handleAutoSelect} className="btn btn-sm btn-primary">
              Auto-Select
            </button>
          </div>
        </div>

        <div className="backend-status-content">
          <div className="current-backend-info">
            <strong>Current Backend: </strong>
            {currentBackend ? (
              <span className={`backend-name ${currentBackend.type}`}>
                {currentBackend.name} ({currentBackend.url})
              </span>
            ) : (
              <span className="backend-error">No backend selected</span>
            )}
          </div>

          {backends.map((backend) => (
            <div key={backend.url} className="backend-component">
              <div className="backend-component-info">
                <div className="backend-component-details">
                  <h4 className="backend-component-name">{backend.name}</h4>
                  <p className="backend-component-description">{backend.type} • Priority: {backend.priority}</p>
                  <span className="backend-component-endpoint">{backend.url}</span>
                  {backend.error && (
                    <div className="backend-error-message">Error: {backend.error}</div>
                  )}
                </div>
                <div className="backend-component-status">
                  {getStatusIcon(backend.status)}
                  <span className="status-text" style={{ color: getStatusColor(backend.status) }}>
                    {getStatusText(backend.status)}
                  </span>
                </div>
              </div>
              
              <div className="backend-component-controls">
                <button
                  onClick={() => handleBackendSelect(
                    Object.keys(backendService.backends).find(
                      key => backendService.backends[key].url === backend.url
                    )
                  )}
                  disabled={backend.status !== 'healthy' || backend.url === currentBackend?.url}
                  className="btn-select"
                >
                  {backend.url === currentBackend?.url ? 'Active' : 'Select'}
                </button>
              </div>

              <div className="backend-component-progress">
                <div className="backend-progress-bar" style={{
                  width: backend.status === "healthy" ? "100%" : 
                         backend.status === "degraded" ? "60%" : "0%",
                  background: getStatusColor(backend.status)
                }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Individual API Services for Current Backend */}
      {currentBackend && (
        <div className="card">
          <div className="card-header">
            <Database size={20} />
            <h2 className="card-title">API Services Status - {currentBackend.name}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {apiEndpoints.map((api) => {
              const Icon = api.icon;
              const status = apiServices[api.key] || 'checking';
              return (
                <div key={api.key} className="api-service-card">
                  <div className="api-service-header">
                    <div className="api-service-icon">
                      <Icon size={20} />
                    </div>
                    <div className="api-service-info">
                      <h4 className="api-service-name">{api.name}</h4>
                      <span className="api-endpoint">{api.endpoint}</span>
                    </div>
                    <div className="api-service-status">
                      {getStatusIcon(status)}
                    </div>
                  </div>
                  <div className="api-service-progress">
                    <div className="api-progress-bar" style={{
                      width: status === "operational" ? "100%" : status === "degraded" ? "60%" : "0%",
                      background: getStatusColor(status)
                    }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default BackendStatus;