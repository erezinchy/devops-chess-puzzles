import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ChessBoard from '../components/ChessBoard';
import api from '../services/api';
import './Puzzle.css';

function Puzzle() {
  const [searchParams] = useSearchParams();
  const [puzzle, setPuzzle] = useState(null);
  const [status, setStatus] = useState('playing');
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(true);

  const mode = searchParams.get('mode') || 'daily';

  useEffect(() => {
    loadPuzzle();
  }, [mode]);

  useEffect(() => {
    if (status !== 'playing') return;
    const interval = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [status]);

  async function loadPuzzle() {
    setLoading(true);
    setStatus('playing');
    setTimer(0);
    try {
      const endpoint = mode === 'random' ? '/api/puzzles/random' : '/api/puzzles/daily';
      const { data } = await api.get(endpoint);
      setPuzzle(data);
    } catch {
      setPuzzle({
        id: 1,
        fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4',
        moves: 'h5f7',
        rating: 600,
        difficulty: 'beginner',
      });
    }
    setLoading(false);
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  if (loading) {
    return <div className="puzzle-loading">Loading puzzle...</div>;
  }

  return (
    <div className="puzzle-page">
      <div className="puzzle-header">
        <div className="puzzle-info">
          <span className="puzzle-difficulty">{puzzle.difficulty}</span>
          <span className="puzzle-rating">Rating: {puzzle.rating}</span>
        </div>
        <div className="puzzle-timer">{formatTime(timer)}</div>
      </div>

      <div className="puzzle-instruction">
        {status === 'playing' && 'Find the best move!'}
        {status === 'solved' && 'Solved! Great job!'}
        {status === 'failed' && 'Wrong move. Try again?'}
      </div>

      {puzzle && (
        <ChessBoard
          fen={puzzle.fen}
          solutionMoves={puzzle.moves}
          onSolved={() => setStatus('solved')}
          onFailed={() => setStatus('failed')}
        />
      )}

      <div className="puzzle-actions">
        {status !== 'playing' && (
          <button onClick={loadPuzzle} className="btn-next">
            Next Puzzle
          </button>
        )}
      </div>
    </div>
  );
}

export default Puzzle;
