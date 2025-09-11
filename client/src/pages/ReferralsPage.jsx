import React, { useState, useEffect } from 'react';
import referralService from '../services/referralService';
import './ReferralsPage.css';

const formatLastSeen = (timestamp) => {
  if (!timestamp) return 'Never';
  const now = new Date();
  const lastSeen = new Date(timestamp);
  const diffSeconds = Math.round((now - lastSeen) / 1000);

  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  const diffMinutes = Math.round(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
};

const ReferralsPage = () => {
  const [referralData, setReferralData] = useState({ referralCode: '', referrals: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await referralService.getReferralData();
      setReferralData(data);
    } catch (error) {
      console.error('Failed to fetch referral data', error);
      setError('Failed to load referral data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!referralData.referralCode) {
      setError('No referral code available');
      return;
    }
    
    const link = `https://t.me/Zivurlbot?start=${referralData.referralCode}`;
    navigator.clipboard.writeText(link)
      .then(() => {
        setCopySuccess('Copied!');
        setTimeout(() => setCopySuccess(''), 2000);
      })
      .catch(() => {
        setError('Failed to copy link');
      });
  };

  const handleRemove = async (userId) => {
    if (window.confirm('Are you sure you want to remove this referral? This cannot be undone.')) {
      try {
        await referralService.removeReferral(userId);
        fetchData();
      } catch (error) {
        setError('Failed to remove referral');
      }
    }
  };

  const referralLink = referralData.referralCode 
    ? `https://t.me/Zivurlbot?start=${referralData.referralCode}`
    : 'Loading...';

  return (
    <div className="referrals-container">
      <div className="referrals-header">
        <h1>Invite Friends, Earn ZP</h1>
        <p>Invite friends and earn 150 ZP for each successful referral!</p>
      </div>

      {error && <p className="error-message">{error}</p>}

      <div className="referral-link-box">
        <span className="referral-link">{referralLink}</span>
        <button 
          onClick={handleCopyLink} 
          className="copy-button"
          disabled={!referralData.referralCode || loading}
        >
          {copySuccess || 'Copy Link'}
        </button>
      </div>

      <div className="referral-list-container">
        <h2>My Referrals ({referralData.referrals.length} / 50)</h2>
        {loading ? (
          <p>Loading...</p>
        ) : referralData.referrals.length === 0 ? (
          <p>No referrals yet. Share your link to earn rewards!</p>
        ) : (
          referralData.referrals.map(ref => (
            <div key={ref.id} className="referral-card">
              <div className="referral-info">
                <p><strong>{ref.username}</strong></p>
                <p>Streak: 🔥{ref.daily_streak_count} | Last Seen: {formatLastSeen(ref.last_seen)}</p>
              </div>
              <div className="referral-actions">
                <button disabled>Ping</button>
                <button onClick={() => handleRemove(ref.id)} className="remove-btn">Remove</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReferralsPage;