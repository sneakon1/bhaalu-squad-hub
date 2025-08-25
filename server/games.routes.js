const express = require('express');
const router = express.Router();
const Game = require('./game');

// Add new game
router.post('/', async (req, res) => {
  const { name, date, location, createdBy } = req.body;
  if (!name || !date || !location) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }
  try {
    const game = new Game({ name, date, location, createdBy });
    await game.save();
    res.status(201).json(game);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Get upcoming games
router.get('/upcoming', async (req, res) => {
  try {
    const now = new Date();
    const games = await Game.find({ date: { $gte: now } }).sort({ date: 1 });
    res.json(games);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
