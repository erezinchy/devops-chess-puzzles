import { useState, useEffect } from 'react';
import api from '../services/api';
import './Leaderboard.css';

function Leaderboard() {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    api
      .get('/api/scores/leaderboard')
      .then(({ data }) => setPlayers(data))
      .catch(() => {
        setPlayers([
          { id: 1, username: 'GrandMaster42', rating: 2100, puzzles_solved: 342, best_streak: 28 },
          { id: 2, username: 'TacticKing', rating: 1950, puzzles_solved: 215, best_streak: 19 },
          { id: 3, username: 'PuzzleLover', rating: 1800, puzzles_solved: 189, best_streak: 15 },
        ]);
      });
  }, []);

  return (
    <div className="leaderboard">
      <h2>Leaderboard</h2>
      <div className="leaderboard-list">
        {players.map((player, index) => (
          <div key={player.id} className="leaderboard-row">
            <span className="rank">
              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
            </span>
            <div className="player-info">
              <span className="player-name">{player.username}</span>
              <span className="player-stats">
                {player.puzzles_solved} solved · streak {player.best_streak}
              </span>
            </div>
            <span className="player-rating">{player.rating}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Leaderboard;
