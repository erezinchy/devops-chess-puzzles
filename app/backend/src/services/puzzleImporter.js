const fs = require('fs');
const readline = require('readline');
const db = require('../models/db');

function getDifficulty(rating) {
  if (rating < 1200) return 'beginner';
  if (rating < 1600) return 'intermediate';
  if (rating < 2000) return 'advanced';
  return 'expert';
}

async function importPuzzles(csvPath, limit = 1000) {
  const fileStream = fs.createReadStream(csvPath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let count = 0;
  let skippedHeader = false;

  for await (const line of rl) {
    if (!skippedHeader) {
      skippedHeader = true;
      continue;
    }

    if (count >= limit) break;

    const [puzzleId, fen, moves, rating, , , themes] = line.split(',');
    const numRating = parseInt(rating, 10);

    if (!fen || !moves || isNaN(numRating)) continue;

    await db.query(
      `INSERT INTO puzzles (fen, moves, rating, difficulty, themes, source)
       VALUES ($1, $2, $3, $4, $5, 'lichess')
       ON CONFLICT DO NOTHING`,
      [fen, moves, numRating, getDifficulty(numRating), themes || '']
    );

    count++;
  }

  console.log(`Imported ${count} puzzles`);
}

if (require.main === module) {
  const csvPath = process.argv[2];
  const limit = parseInt(process.argv[3], 10) || 1000;

  if (!csvPath) {
    console.error('Usage: node puzzleImporter.js <csv-path> [limit]');
    process.exit(1);
  }

  importPuzzles(csvPath, limit)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { importPuzzles };
