const express = require('express');
const router = express.Router();
const db = require('../models/db');

router.post('/submit', async (req, res) => {
  try {
    const { user_id, puzzle_id, solved, time_seconds } = req.body;

    if (!user_id || !puzzle_id || solved === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await db.query(
      `INSERT INTO attempts (user_id, puzzle_id, solved, time_seconds)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [user_id, puzzle_id, solved, time_seconds]
    );

    if (solved) {
      await db.query(
        `UPDATE users SET
          puzzles_solved = puzzles_solved + 1,
          current_streak = current_streak + 1,
          best_streak = GREATEST(best_streak, current_streak + 1)
        WHERE id = $1`,
        [user_id]
      );
    } else {
      await db.query(
        'UPDATE users SET current_streak = 0 WHERE id = $1',
        [user_id]
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit score' });
  }
});

router.get('/leaderboard', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, username, rating, puzzles_solved, best_streak
       FROM users
       ORDER BY rating DESC
       LIMIT 20`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

router.get('/history/:userId', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT a.*, p.fen, p.difficulty
       FROM attempts a
       JOIN puzzles p ON a.puzzle_id = p.id
       WHERE a.user_id = $1
       ORDER BY a.created_at DESC
       LIMIT 50`,
      [req.params.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

module.exports = router;
