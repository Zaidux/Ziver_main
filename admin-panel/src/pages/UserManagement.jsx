import React, { useState } from 'react';
import adminService from '../services/adminService';
// You can create a UserManagement.css file for styling

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setUsers([]);
    try {
      const response = await adminService.searchUsers(searchTerm);
      setUsers(response.data);
      if (response.data.length === 0) {
        setError('No users found.');
      }
    } catch (err) {
      setError('Failed to search for users.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>User Management</h2>
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by username or email"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>
      
      {error && <p className="error-message">{error}</p>}

      <div className="user-list">
        {users.map(user => (
          <div key={user.id} className="user-card">
            <h3>{user.username}</h3>
            <p>Email: {user.email}</p>
            <p>ZP Balance: {user.zp_balance}</p>
            <p>SEB Score: {user.social_capital_score}</p>
            <p>Role: {user.role}</p>
            {/* We can add a "Reward" button here later */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserManagement;