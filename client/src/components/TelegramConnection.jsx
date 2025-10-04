import React, { useState, useEffect } from 'react';
import { Bot, Link, CheckCircle, XCircle, Bell, Users } from 'lucide-react';
import './TelegramConnection.css';
import telegramService from '../services/telegramService';

const TelegramConnection = () => {
  const [connectionCode, setConnectionCode] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [connectionData, setConnectionData] = useState(null);

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const response = await telegramService.getConnectionStatus();
      setIsConnected(response.data.connected);
      setConnectionData(response.data);
    } catch (error) {
      console.error('Error checking connection status:', error);
    }
  };

  const generateConnectionCode = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await telegramService.generateConnectionCode();
      setConnectionCode(response.data.connectionCode);
      setSuccess('Connection code generated! Use /connect in the bot and enter this code.');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to generate connection code');
    } finally {
      setLoading(false);
    }
  };

  const disconnectBot = async () => {
    try {
      setLoading(true);
      await telegramService.disconnectBot();
      setIsConnected(false);
      setConnectionCode('');
      setConnectionData(null);
      setSuccess('Successfully disconnected from Telegram bot');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to disconnect');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(connectionCode);
    setSuccess('Code copied to clipboard!');
  };

  return (
    <div className="telegram-connection">
      <div className="connection-header">
        <Bot className="connection-icon" />
        <h2>Telegram Bot Connection</h2>
      </div>

      <div className="connection-description">
        <p>Connect your Telegram account to receive automatic notifications when:</p>
        <ul>
          <li>📱 New users register through your referral link</li>
          <li>⛏️ Your mining session is ready to claim</li>
          <li>🎯 Important updates and announcements</li>
        </ul>
      </div>

      {error && (
        <div className="alert alert-error">
          <XCircle className="alert-icon" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <CheckCircle className="alert-icon" />
          <span>{success}</span>
        </div>
      )}

      {isConnected ? (
        <div className="connection-status connected">
          <div className="status-header">
            <CheckCircle className="status-icon" />
            <h3>Connected to Telegram Bot</h3>
          </div>
          
          {connectionData && (
            <div className="connection-info">
              <div className="info-item">
                <Bell className="info-icon" />
                <span>Notifications: {connectionData.notificationsEnabled ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="info-item">
                <Users className="info-icon" />
                <span>Referral Alerts: {connectionData.referralAlerts ? 'Active' : 'Inactive'}</span>
              </div>
              <div className="info-item">
                <span>Connected since: {new Date(connectionData.connectedAt).toLocaleDateString()}</span>
              </div>
            </div>
          )}

          <button 
            onClick={disconnectBot}
            disabled={loading}
            className="btn btn-danger"
          >
            {loading ? 'Disconnecting...' : 'Disconnect Bot'}
          </button>
        </div>
      ) : (
        <div className="connection-status disconnected">
          <div className="status-header">
            <XCircle className="status-icon" />
            <h3>Not Connected to Telegram Bot</h3>
          </div>

          {connectionCode ? (
            <div className="connection-code-section">
              <p>Use this code in the Telegram bot:</p>
              <div className="code-display">
                <code className="connection-code">{connectionCode}</code>
                <button onClick={copyToClipboard} className="btn btn-secondary">
                  <Link className="btn-icon" />
                  Copy
                </button>
              </div>
              <div className="connection-steps">
                <h4>How to connect:</h4>
                <ol>
                  <li>Open our Telegram bot: @YourBotName</li>
                  <li>Send the command: <code>/connect</code></li>
                  <li>Enter the code above when prompted</li>
                  <li>Wait for confirmation message</li>
                </ol>
              </div>
            </div>
          ) : (
            <button 
              onClick={generateConnectionCode}
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Generating Code...' : 'Generate Connection Code'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TelegramConnection;