import { useState, useEffect, useRef, useCallback } from 'react';
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
  const [difficulty, setDifficulty] = useState('advanced');
  const [moveInfo, setMoveInfo] = useState(null);
  const boardRef = useRef(null);

  const mode = searchParams.get('mode') || 'random';
  const recentRef = useRef(getRecentPuzzles());

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
    catch (_e) { /* localStorage may be unavailable */ }
  }

  const loadPuzzle = useCallback(async function loadPuzzle() {
    setLoading(true);
    setStatus('playing');
    setTimer(0);
    setShowingSolution(false);
    setMoveInfo(null);
    try {
      let endpoint;
      if (mode === 'daily') {
        endpoint = '/api/puzzles/daily';
      } else {
        const params = new URLSearchParams();
        if (difficulty !== 'all') params.set('difficulty', difficulty);
        const recent = recentRef.current;
        if (recent.length > 0) params.set('exclude', recent.join(','));
        endpoint = `/api/puzzles/random?${params}`;
      }
      let res;
      try {
        res = await api.get(endpoint);
      } catch {
        recentRef.current = [];
        try { localStorage.removeItem('recentPuzzles'); } catch (_e) { /* ignore */ }
        res = await api.get('/api/puzzles/random');
      }
      if (!res.data?.id) {
        res = await api.get('/api/puzzles/random');
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
  }, [mode, difficulty]);

  useEffect(() => {
    loadPuzzle();
  }, [loadPuzzle]);

  useEffect(() => {
    if (status !== 'playing') return;
    const interval = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [status]);

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

  function handleMoveChange(info) {
    setMoveInfo(info);
  }

  function handleGoBack() {
    if (boardRef.current) boardRef.current.goBack();
  }

  function handleGoForward() {
    if (boardRef.current) boardRef.current.goForward();
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  if (loading) {
    return <div className="puzzle-loading">Loading puzzle...</div>;
  }

  const turnColor = puzzle.fen.includes(' b ') ? 'White' : 'Black';
  const turnStyle = { color: turnColor === 'White' ? '#ffffff' : '#aaa', fontStyle: turnColor === 'Black' ? 'italic' : 'normal' };
  const canGoBack = moveInfo && moveInfo.moveIndex > 1;
  const canGoForward = boardRef.current?.getMoveInfo?.()?.canGoForward;

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
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
          <option value="expert">Expert</option>
          <option value="master">Master</option>
        </select>
      </div>

      <div className="puzzle-instruction">
        <span className="turn-indicator" style={turnStyle}>{turnColor} to move</span>
        {status === 'playing' && ' — find the best move!'}
        {status === 'solved' && ' — Solved! Great job!'}
        {status === 'failed' && !showingSolution && ' — Wrong move!'}
        {status === 'failed' && showingSolution && ' — Solution:'}
      </div>

      <div className="puzzle-actions">
        <button onClick={loadPuzzle} className="btn-next">
          {status === 'playing' ? 'Skip' : 'Next Puzzle'}
        </button>
        {(status === 'playing' || (status === 'failed' && !showingSolution)) && (
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
          onMoveChange={handleMoveChange}
        />
      )}

      <div className="move-nav">
        <button onClick={handleGoBack} disabled={!canGoBack} className="btn-move-nav" title="Previous move">
          &#9664;
        </button>
        <span className="move-counter">
          {moveInfo ? `${Math.max(0, moveInfo.moveIndex - 1)} / ${moveInfo.totalMoves - 1}` : '—'}
        </span>
        <button onClick={handleGoForward} disabled={!canGoForward} className="btn-move-nav" title="Next move">
          &#9654;
        </button>
      </div>
    </div>
  );
}

export default Puzzle;
