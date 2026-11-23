const express = require('express');
const router = express.Router();
const db = require('../models/db');

router.get('/random', async (req, res) => {
  try {
    const { difficulty } = req.query;
    let query = 'SELECT * FROM puzzles';
    const params = [];

    if (difficulty) {
      query += ' WHERE difficulty = $1';
      params.push(difficulty);
    }

    query += ' ORDER BY RANDOM() LIMIT 1';
    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No puzzles found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch puzzle' });
  }
});

router.get('/daily', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const result = await db.query(
      'SELECT * FROM puzzles WHERE daily_date = $1',
      [today]
    );

    if (result.rows.length === 0) {
      const fallback = await db.query(
        'SELECT * FROM puzzles ORDER BY RANDOM() LIMIT 1'
      );
      return res.json(fallback.rows[0]);
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch daily puzzle' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM puzzles WHERE id = $1', [
      req.params.id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Puzzle not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch puzzle' });
  }
});

module.exports = router;
