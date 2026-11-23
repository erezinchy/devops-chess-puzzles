import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './Profile.css';

function Profile() {
  const [user, setUser] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) return;
    const userId = JSON.parse(atob(token.split('.')[1])).id;
    api
      .get(`/api/users/profile/${userId}`)
      .then(({ data }) => setUser(data))
      .catch(() => {});
  }, [token]);

  if (!token) {
    return (
      <div className="profile-login-prompt">
        <h2>Profile</h2>
        <p>Sign in to track your progress</p>
        <Link to="/login">
          <button>Sign In</button>
        </Link>
      </div>
    );
  }

  if (!user) return <div className="profile-loading">Loading...</div>;

  return (
    <div className="profile">
      <h2>{user.username}</h2>

      <div className="profile-stats">
        <div className="profile-stat">
          <span className="profile-stat-value">{user.rating}</span>
          <span className="profile-stat-label">Rating</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-value">{user.puzzles_solved}</span>
          <span className="profile-stat-label">Solved</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-value">{user.current_streak}</span>
          <span className="profile-stat-label">Streak</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-value">{user.best_streak}</span>
          <span className="profile-stat-label">Best</span>
        </div>
      </div>

      <button
        className="btn-logout"
        onClick={() => {
          localStorage.removeItem('token');
          window.location.reload();
        }}
      >
        Sign Out
      </button>
    </div>
  );
}

export default Profile;
