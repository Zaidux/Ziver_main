import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import telegramService from '../services/telegramService';
import './TelegramConnection.css';

const TelegramConnection = () => {
  const { user } = useAuth();
  const [connectionCode, setConnectionCode] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [telegramData, setTelegramData] = useState(null);

  // Check connection status on component mount
  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const status = await telegramService.getConnectionStatus();
      setIsConnected(status.hasTelegram);
      setTelegramData(status);
    } catch (error) {
      console.error('Error checking Telegram connection:', error);
    }
  };

  const generateConnectionCode = async () => {
    setGeneratingCode(true);
    try {
      const response = await telegramService.generateConnectionCode();
      setConnectionCode(response.connectionCode);
      
      // Show instructions
      alert(`📱 Telegram Connection Code: ${response.connectionCode}\n\n1. Open Telegram and find @ZiverOfficialBot\n2. Send /connect\n3. Enter this code when asked\n4. Your account will be linked automatically!`);
    } catch (error) {
      console.error('Error generating connection code:', error);
      alert('Error generating connection code. Please try again.');
    } finally {
      setGeneratingCode(false);
    }
  };

  const connectTelegram = async () => {
    if (!connectionCode.trim()) {
      alert('Please generate a connection code first.');
      return;
    }

    setLoading(true);
    try {
      const result = await telegramService.connectTelegram(connectionCode);
      
      if (result.success) {
        setIsConnected(true);
        setConnectionCode('');
        alert('✅ Telegram account connected successfully!\n\nYou will now receive notifications for:\n• New referral registrations\n• Mining session completions\n• Important updates');
        checkConnectionStatus();
      } else {
        alert('Connection failed: ' + result.message);
      }
    } catch (error) {
      console.error('Error connecting Telegram:', error);
      alert('Error connecting Telegram account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const disconnectTelegram = async () => {
    const confirmed = window.confirm('Are you sure you want to disconnect your Telegram account? You will stop receiving notifications.');
    
    if (confirmed) {
      try {
        await telegramService.disconnectTelegram();
        setIsConnected(false);
        setTelegramData(null);
        alert('Telegram account disconnected.');
      } catch (error) {
        console.error('Error disconnecting Telegram:', error);
        alert('Error disconnecting Telegram account.');
      }
    }
  };

  return (
    <div className="telegram-connection">
      <div className="telegram-header">
        <h3>🔗 Telegram Connection</h3>
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '✅ Connected' : '❌ Not Connected'}
        </div>
      </div>

      {isConnected ? (
        <div className="connected-state">
          <div className="telegram-info">
            <p><strong>Telegram ID:</strong> {telegramData?.telegramId}</p>
            <p><strong>Connected Since:</strong> {telegramData?.connectedAt ? new Date(telegramData.connectedAt).toLocaleDateString() : 'Recently'}</p>
          </div>
          
          <div className="notification-settings">
            <h4>🔔 Notifications Enabled:</h4>
            <ul>
              <li>✅ New referral registrations</li>
              <li>✅ Mining session completions</li>
              <li>✅ Daily rewards reminders</li>
              <li>✅ Important system updates</li>
            </ul>
          </div>

          <button 
            onClick={disconnectTelegram}
            className="disconnect-btn"
          >
            Disconnect Telegram
          </button>
        </div>
      ) : (
        <div className="disconnected-state">
          <div className="connection-instructions">
            <h4>Connect Your Telegram Account</h4>
            <p>Get instant notifications about:</p>
            <ul>
              <li>🎯 When someone registers with your referral code</li>
              <li>⛏️ When your mining session is ready to claim</li>
              <li>💰 Daily bonus reminders</li>
              <li>📢 Important updates from Ziver</li>
            </ul>

            <div className="connection-steps">
              <h5>How to connect:</h5>
              <ol>
                <li>Click "Generate Code" below</li>
                <li>Open Telegram and find <strong>@ZiverOfficialBot</strong></li>
                <li>Send the command: <code>/connect</code></li>
                <li>Enter the 6-digit code when asked</li>
                <li>Your accounts will be linked automatically!</li>
              </ol>
            </div>

            {!connectionCode ? (
              <button 
                onClick={generateConnectionCode}
                disabled={generatingCode}
                className="generate-code-btn"
              >
                {generatingCode ? 'Generating Code...' : 'Generate Connection Code'}
              </button>
            ) : (
              <div className="code-section">
                <div className="code-display">
                  <label>Your Connection Code:</label>
                  <div className="code-value">{connectionCode}</div>
                  <small>This code expires in 10 minutes</small>
                </div>
                
                <button 
                  onClick={connectTelegram}
                  disabled={loading}
                  className="connect-btn"
                >
                  {loading ? 'Connecting...' : 'Confirm Connection'}
                </button>
                
                <button 
                  onClick={() => setConnectionCode('')}
                  className="new-code-btn"
                >
                  Generate New Code
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TelegramConnection;