import { useState, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';

function ChessBoard({ fen, solutionMoves, onSolved, onFailed }) {
  const [game, setGame] = useState(new Chess(fen));
  const [moveIndex, setMoveIndex] = useState(0);
  const [boardOrientation, setBoardOrientation] = useState(
    fen.includes(' b ') ? 'white' : 'black'
  );
  const [highlightSquares, setHighlightSquares] = useState({});

  const moves = solutionMoves ? solutionMoves.split(' ') : [];

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
    } else {
      makeComputerMove(newGame, nextIndex);
    }

    return true;
  }

  return (
    <div style={{ width: '100%', maxWidth: '480px', margin: '0 auto' }}>
      <Chessboard
        position={game.fen()}
        onPieceDrop={onDrop}
        boardOrientation={boardOrientation}
        customSquareStyles={highlightSquares}
        boardWidth={Math.min(window.innerWidth - 32, 480)}
        customDarkSquareStyle={{ backgroundColor: 'var(--board-dark, #b58863)' }}
        customLightSquareStyle={{ backgroundColor: 'var(--board-light, #f0d9b5)' }}
      />
    </div>
  );
}

export default ChessBoard;
