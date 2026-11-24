import { useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';

const ChessBoard = forwardRef(function ChessBoard({ fen, solutionMoves, onSolved, onFailed, solveOnFirstMove }, ref) {
  const [game, setGame] = useState(new Chess(fen));
  const [moveIndex, setMoveIndex] = useState(0);
  const [boardOrientation] = useState(
    fen.includes(' b ') ? 'black' : 'white'
  );
  const [highlightSquares, setHighlightSquares] = useState({});
  const [locked, setLocked] = useState(false);

  const moves = solutionMoves ? solutionMoves.split(' ') : [];

  function playRemainingMoves(g, startIdx) {
    setLocked(true);
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
      const result = g.move({ from, to, promotion });
      if (result) {
        setHighlightSquares({
          [from]: { backgroundColor: 'rgba(255, 165, 0, 0.5)' },
          [to]: { backgroundColor: 'rgba(255, 165, 0, 0.5)' },
        });
        setGame(new Chess(g.fen()));
        i++;
        setTimeout(playNext, 800);
      }
    }
    playNext();
  }

  useImperativeHandle(ref, () => ({
    playSolution() {
      const g = new Chess(fen);
      playRemainingMoves(g, 0);
    },
    showHint() {
      if (moveIndex >= moves.length) return;
      const move = moves[moveIndex];
      const from = move.slice(0, 2);
      setHighlightSquares({
        [from]: { backgroundColor: 'rgba(0, 150, 255, 0.5)' },
      });
      setTimeout(() => setHighlightSquares({}), 1500);
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
          setGame(new Chess(currentGame.fen()));
          setMoveIndex(currentMoveIndex + 1);
        }
      }, 500);
    },
    [moves]
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
      setHighlightSquares({
        [sourceSquare]: { backgroundColor: 'rgba(255, 0, 0, 0.4)' },
        [targetSquare]: { backgroundColor: 'rgba(255, 0, 0, 0.4)' },
      });
      setTimeout(() => setHighlightSquares({}), 800);
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

    setHighlightSquares({
      [sourceSquare]: { backgroundColor: 'rgba(0, 255, 0, 0.4)' },
      [targetSquare]: { backgroundColor: 'rgba(0, 255, 0, 0.4)' },
    });
    setTimeout(() => setHighlightSquares({}), 400);

    if (nextIndex >= moves.length) {
      onSolved?.();
    } else if (solveOnFirstMove && moveIndex === 0) {
      onSolved?.();
    } else {
      makeComputerMove(newGame, nextIndex);
    }

    return true;
  }

  return (
    <div style={{ width: '100%', maxWidth: '560px', margin: '0 auto' }}>
      <Chessboard
        position={game.fen()}
        onPieceDrop={onDrop}
        boardOrientation={boardOrientation}
        customSquareStyles={highlightSquares}
        boardWidth={Math.min(window.innerWidth - 32, window.innerHeight - 300, 560)}
        customDarkSquareStyle={{ backgroundColor: 'var(--board-dark, #b58863)' }}
        customLightSquareStyle={{ backgroundColor: 'var(--board-light, #f0d9b5)' }}
      />
    </div>
  );
});

export default ChessBoard;
