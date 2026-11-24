import { useState, useEffect, useRef } from 'react';
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
  const [showingSolution, setShowingSolution] = useState(false);
  const [difficulty, setDifficulty] = useState('intermediate');
  const boardRef = useRef(null);

  const mode = searchParams.get('mode') || 'random';
  const recentRef = useRef(getRecentPuzzles());

  useEffect(() => {
    loadPuzzle();
  }, [mode, difficulty]);

  function getRecentPuzzles() {
    try { return JSON.parse(localStorage.getItem('recentPuzzles') || '[]'); }
    catch { return []; }
  }

  function trackPuzzle(id) {
    const recent = recentRef.current;
    if (!recent.includes(id)) recent.push(id);
    if (recent.length > 25) recent.shift();
    recentRef.current = recent;
    try { localStorage.setItem('recentPuzzles', JSON.stringify(recent)); }
    catch {}
  }

  useEffect(() => {
    if (status !== 'playing') return;
    const interval = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [status]);

  async function loadPuzzle() {
    setLoading(true);
    setStatus('playing');
    setTimer(0);
    setShowingSolution(false);
    try {
      let endpoint;
      if (mode === 'daily') {
        endpoint = '/api/puzzles/daily';
      } else {
        const params = new URLSearchParams();
        if (difficulty !== 'all') params.set('difficulty', difficulty);
        params.set('min_rating', '1200');
        const recent = recentRef.current;
        if (recent.length > 0) params.set('exclude', recent.join(','));
        endpoint = `/api/puzzles/random?${params}`;
      }
      let res = await api.get(endpoint);
      if (res.status === 404 || !res.data?.id) {
        recentRef.current = [];
        try { localStorage.removeItem('recentPuzzles'); } catch {}
        const retryParams = new URLSearchParams();
        if (difficulty !== 'all') retryParams.set('difficulty', difficulty);
        retryParams.set('min_rating', '1200');
        res = await api.get(`/api/puzzles/random?${retryParams}`);
      }
      trackPuzzle(res.data.id);
      setPuzzle(res.data);
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

  function handleShowSolution() {
    setShowingSolution(true);
    setStatus('failed');
    if (boardRef.current) {
      boardRef.current.playSolution();
    }
  }

  function handleHint() {
    if (boardRef.current) {
      boardRef.current.showHint();
    }
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  if (loading) {
    return <div className="puzzle-loading">Loading puzzle...</div>;
  }

  const turnColor = puzzle.fen.includes(' b ') ? 'Black' : 'White';
  const isMultiMove = puzzle.moves && puzzle.moves.split(' ').length > 1;

  return (
    <div className="puzzle-page">
      <div className="puzzle-header">
        <div className="puzzle-info">
          <span className="puzzle-difficulty">{puzzle.difficulty}</span>
          <span className="puzzle-rating">Rating: {puzzle.rating}</span>
        </div>
        <div className="puzzle-timer">{formatTime(timer)}</div>
      </div>

      <div className="difficulty-selector">
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="all">All Levels</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      <div className="puzzle-instruction">
        <span className="turn-indicator">{turnColor} to move</span>
        {status === 'playing' && ' — find the best move!'}
        {status === 'solved' && ' — Solved! Great job!'}
        {status === 'failed' && !showingSolution && ' — Wrong move!'}
        {status === 'failed' && showingSolution && ' — Solution:'}
      </div>

      <div className="puzzle-actions">
        {status !== 'playing' && (
          <button onClick={loadPuzzle} className="btn-next">
            Next Puzzle
          </button>
        )}
        {status === 'playing' && (
          <button onClick={handleHint} className="btn-hint">
            Hint
          </button>
        )}
        {!showingSolution && (
          <button onClick={handleShowSolution} className="btn-solution">
            Show Solution
          </button>
        )}
      </div>

      {puzzle && (
        <ChessBoard
          ref={boardRef}
          fen={puzzle.fen}
          solutionMoves={puzzle.moves}
          onSolved={() => setStatus('solved')}
          onFailed={() => setStatus('failed')}
          solveOnFirstMove={isMultiMove}
        />
      )}
    </div>
  );
}

export default Puzzle;
