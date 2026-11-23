const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const puzzleRoutes = require('./routes/puzzles');
const userRoutes = require('./routes/users');
const scoreRoutes = require('./routes/scores');
const healthRoutes = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use('/api/', limiter);

app.use('/api/health', healthRoutes);
app.use('/api/puzzles', puzzleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/scores', scoreRoutes);

app.listen(PORT, () => {
  console.log(`Chess Puzzle API running on port ${PORT}`);
});

module.exports = app;
