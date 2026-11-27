import { useState, useCallback, useImperativeHandle, forwardRef, useMemo, useEffect, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';

const ChessBoard = forwardRef(function ChessBoard({ fen, solutionMoves, onSolved, onFailed, onMoveChange }, ref) {
  const [game, setGame] = useState(new Chess(fen));
  const [moveIndex, setMoveIndex] = useState(0);
  const [boardOrientation] = useState(
    fen.includes(' b ') ? 'white' : 'black'
  );
  const [locked, setLocked] = useState(true);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [boardWidth, setBoardWidth] = useState(() =>
    Math.max(200, Math.min(window.innerWidth - 32, window.innerHeight - 360, 560))
  );
  const highlightTimerRef = useRef(null);
  const setupPlayed = useRef(false);
  const historyRef = useRef([]);
  const solvedIndexRef = useRef(null);

  useEffect(() => {
    function onResize() {
      setBoardWidth(Math.max(200, Math.min(window.innerWidth - 32, window.innerHeight - 360, 560)));
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  function highlightSquares(squares, duration) {
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    Object.entries(squares).forEach(([sq, color]) => {
      const el = document.querySelector(`[data-square="${sq}"]`);
      if (el) el.style.boxShadow = `inset 0 0 0 5px ${color}`;
    });
    if (duration) {
      highlightTimerRef.current = setTimeout(() => {
        Object.keys(squares).forEach(sq => {
          const el = document.querySelector(`[data-square="${sq}"]`);
          if (el) el.style.boxShadow = '';
        });
      }, duration);
    }
  }

  function clearHighlights() {
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    document.querySelectorAll('[data-square]').forEach(el => {
      el.style.boxShadow = '';
    });
  }

  const moves = useMemo(() => solutionMoves ? solutionMoves.split(' ') : [], [solutionMoves]);

  useEffect(() => {
    if (setupPlayed.current || moves.length === 0) return;
    setupPlayed.current = true;
    const timer = setTimeout(() => {
      const move = moves[0];
      const from = move.slice(0, 2);
      const to = move.slice(2, 4);
      const promotion = move.length > 4 ? move[4] : undefined;
      const g = new Chess(fen);
      const result = g.move({ from, to, promotion });
      if (result) {
        const newFen = g.fen();
        setGame(new Chess(newFen));
        setMoveIndex(1);
        setLocked(false);
        historyRef.current = [fen, newFen];
        onMoveChange?.({ moveIndex: 1, totalMoves: moves.length });
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [fen, moves]);

  function playRemainingMoves(g, startIdx) {
    setLocked(true);
    clearHighlights();
    let i = startIdx;
    function playNext() {
      if (i >= moves.length) {
        onSolved?.();
        return;
      }
      const move = moves[i];
      const from = move.slice(0, 2);
      const to = move.slice(2, 4);
      const promotion = move.length > 4 ? move[4] : undefined;
      clearHighlights();
      const result = g.move({ from, to, promotion });
      if (result) {
        setGame(new Chess(g.fen()));
        setTimeout(() => {
          highlightSquares({ [from]: 'rgba(255, 165, 0, 0.8)', [to]: 'rgba(255, 165, 0, 0.8)' }, 0);
          i++;
          setTimeout(playNext, 800);
        }, 50);
      }
    }
    playNext();
  }

  function replayToIndex(targetIdx) {
    const g = new Chess(fen);
    for (let i = 0; i < targetIdx; i++) {
      const m = moves[i];
      g.move({ from: m.slice(0, 2), to: m.slice(2, 4), promotion: m.length > 4 ? m[4] : undefined });
    }
    return g;
  }

  useImperativeHandle(ref, () => ({
    playSolution() {
      const g = new Chess(fen);
      const setup = moves[0];
      if (setup) {
        g.move({ from: setup.slice(0, 2), to: setup.slice(2, 4), promotion: setup.length > 4 ? setup[4] : undefined });
      }
      playRemainingMoves(g, 1);
    },
    showHint() {
      if (moveIndex >= moves.length) return;
      const move = moves[moveIndex];
      const from = move.slice(0, 2);
      highlightSquares({ [from]: 'rgba(0, 150, 255, 0.8)' }, 1500);
    },
    goBack() {
      if (moveIndex <= 1) return;
      clearHighlights();
      const newIdx = moveIndex - 1;
      const g = replayToIndex(newIdx);
      setGame(new Chess(g.fen()));
      setMoveIndex(newIdx);
      setLocked(true);
      onMoveChange?.({ moveIndex: newIdx, totalMoves: moves.length });
    },
    goForward() {
      const maxIdx = solvedIndexRef.current != null ? solvedIndexRef.current : moveIndex;
      if (moveIndex >= maxIdx || moveIndex >= moves.length) return;
      clearHighlights();
      const newIdx = moveIndex + 1;
      const g = replayToIndex(newIdx);
      setGame(new Chess(g.fen()));
      setMoveIndex(newIdx);
      const atEnd = newIdx >= (solvedIndexRef.current ?? moves.length);
      setLocked(atEnd);
      onMoveChange?.({ moveIndex: newIdx, totalMoves: moves.length });
    },
    getMoveInfo() {
      return { moveIndex, totalMoves: moves.length, canGoBack: moveIndex > 1, canGoForward: solvedIndexRef.current != null && moveIndex < solvedIndexRef.current };
    }
  }));

  const makeComputerMove = useCallback(
    (currentGame, currentMoveIndex) => {
      if (currentMoveIndex >= moves.length) return;

      setTimeout(() => {
        const move = moves[currentMoveIndex];
        const from = move.slice(0, 2);
        const to = move.slice(2, 4);
        const promotion = move.length > 4 ? move[4] : undefined;

        const result = currentGame.move({ from, to, promotion });
        if (result) {
          const newIdx = currentMoveIndex + 1;
          setGame(new Chess(currentGame.fen()));
          setMoveIndex(newIdx);
          onMoveChange?.({ moveIndex: newIdx, totalMoves: moves.length });
        }
      }, 500);
    },
    [moves, onMoveChange]
  );

  function onDrop(sourceSquare, targetSquare) {
    if (locked) return false;
    if (moveIndex >= moves.length) return false;

    const expectedMove = moves[moveIndex];
    const expected = {
      from: expectedMove.slice(0, 2),
      to: expectedMove.slice(2, 4),
    };

    if (sourceSquare !== expected.from || targetSquare !== expected.to) {
      highlightSquares({ [sourceSquare]: 'rgba(255, 0, 0, 0.7)', [targetSquare]: 'rgba(255, 0, 0, 0.7)' }, 800);
      onFailed?.();
      return false;
    }

    const promotion = expectedMove.length > 4 ? expectedMove[4] : undefined;
    const move = game.move({ from: sourceSquare, to: targetSquare, promotion });

    if (!move) return false;

    const newGame = new Chess(game.fen());
    setGame(newGame);

    const nextIndex = moveIndex + 1;
    setMoveIndex(nextIndex);
    solvedIndexRef.current = nextIndex;

    clearHighlights();
    highlightSquares({ [targetSquare]: 'rgba(255, 165, 0, 0.7)' }, 600);

    onMoveChange?.({ moveIndex: nextIndex, totalMoves: moves.length });

    if (nextIndex >= moves.length) {
      onSolved?.();
    } else {
      makeComputerMove(newGame, nextIndex);
    }

    return true;
  }

  function handleSquareSelect(square) {
    if (locked || moveIndex >= moves.length) return;
    if (!selectedSquare) {
      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
        highlightSquares({ [square]: 'rgba(0, 150, 255, 0.5)' }, 0);
      }
    } else {
      clearHighlights();
      if (square === selectedSquare) {
        setSelectedSquare(null);
        return;
      }
      const result = onDrop(selectedSquare, square);
      setSelectedSquare(null);
      if (!result) {
        const piece = game.get(square);
        if (piece && piece.color === game.turn()) {
          setSelectedSquare(square);
          highlightSquares({ [square]: 'rgba(0, 150, 255, 0.5)' }, 0);
        }
      }
    }
  }

  function onSquareClick(square) {
    handleSquareSelect(square);
  }

  function onPieceClick(_piece, square) {
    handleSquareSelect(square);
  }

  return (
    <div style={{ width: '100%', maxWidth: '560px', margin: '0 auto' }}>
      <Chessboard
        position={game.fen()}
        onPieceDrop={onDrop}
        onSquareClick={onSquareClick}
        onPieceClick={onPieceClick}
        boardOrientation={boardOrientation}
        customSquareStyles={{}}
        boardWidth={boardWidth}
        customDarkSquareStyle={{ backgroundColor: 'var(--board-dark, #b58863)' }}
        customLightSquareStyle={{ backgroundColor: 'var(--board-light, #f0d9b5)' }}
      />
    </div>
  );
});

export default ChessBoard;
