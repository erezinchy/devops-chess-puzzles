import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div className="home">
      <div className="hero">
        <h1>Chess Puzzle Trainer</h1>
        <p>Sharpen your tactics with daily puzzles</p>
      </div>

      <div className="cards">
        <Link to="/puzzle" className="card card-daily">
          <span className="card-icon">📅</span>
          <h3>Daily Puzzle</h3>
          <p>New puzzle every day</p>
        </Link>

        <Link to="/puzzle?mode=random" className="card card-random">
          <span className="card-icon">🎲</span>
          <h3>Random Puzzle</h3>
          <p>Practice at your level</p>
        </Link>

        <Link to="/leaderboard" className="card card-rank">
          <span className="card-icon">🏆</span>
          <h3>Leaderboard</h3>
          <p>See top solvers</p>
        </Link>
      </div>

      <div className="stats-preview">
        <div className="stat">
          <span className="stat-value">0</span>
          <span className="stat-label">Solved</span>
        </div>
        <div className="stat">
          <span className="stat-value">0</span>
          <span className="stat-label">Streak</span>
        </div>
        <div className="stat">
          <span className="stat-value">1200</span>
          <span className="stat-label">Rating</span>
        </div>
      </div>
    </div>
  );
}

export default Home;
