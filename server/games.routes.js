const express = require('express');
const router = express.Router();
const Game = require('./game');

// Add new game
router.post('/', async (req, res) => {
  const { name, date, location, createdBy, maxPlayers, description } = req.body;
  if (!name || !date || !location) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }
  try {
    const game = new Game({ name, date, location, createdBy, maxPlayers, description });
    await game.save();
    res.status(201).json(game);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Get upcoming games
router.get('/upcoming', async (req, res) => {
  try {
    const games = await Game.find({ status: 'upcoming' }).sort({ date: 1 });
    res.json(games);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Get live games
router.get('/live', async (req, res) => {
  try {
    const games = await Game.find({ status: 'live' }).sort({ date: -1 });
    res.json(games);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Get completed games
router.get('/completed', async (req, res) => {
  try {
    const games = await Game.find({ status: 'completed' }).sort({ date: -1 });
    res.json(games);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Get single game
router.get('/:id', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ message: 'Game not found.' });
    }
    res.json(game);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Player vote endpoint
router.post('/:id/vote', async (req, res) => {
  const { status, email } = req.body;
  if (!status || !email || !['in', 'out'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status or email.' });
  }
  
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ message: 'Game not found.' });
    }
    
    // Remove existing vote from this player
    game.players = game.players.filter(p => p.email !== email);
    
    // Add new vote
    game.players.push({ email, status });
    
    await game.save();
    
    const playersIn = game.players.filter(p => p.status === 'in').length;
    res.json({ message: 'Vote recorded', playersIn });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Get players in for a game
router.get('/:id/players-in', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ message: 'Game not found.' });
    }
    
    const playersInEmails = game.players
      .filter(p => p.status === 'in')
      .map(p => p.email);
    
    res.json({ playersIn: playersInEmails });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Save teams and go live
router.post('/:id/go-live-with-teams', async (req, res) => {
  const { teamA, teamB } = req.body;
  
  try {
    const game = await Game.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'live',
        teams: { 
          teamA: { ...teamA, score: 0 }, 
          teamB: { ...teamB, score: 0 } 
        }
      },
      { new: true }
    );
    
    if (!game) {
      return res.status(404).json({ message: 'Game not found.' });
    }
    
    res.json({ message: 'Game is now live with teams!', game });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Record a goal
router.post('/:id/goal', async (req, res) => {
  const { team, scorer, minute } = req.body;
  
  if (!team || !scorer || !['teamA', 'teamB'].includes(team)) {
    return res.status(400).json({ message: 'Invalid team or scorer.' });
  }
  
  try {
    const game = await Game.findById(req.params.id);
    if (!game || game.status !== 'live') {
      return res.status(404).json({ message: 'Live game not found.' });
    }
    
    // Add goal to goals array
    game.goals.push({ team, scorer, minute: minute || 0 });
    
    // Update team score
    if (team === 'teamA') {
      game.teams.teamA.score += 1;
    } else {
      game.teams.teamB.score += 1;
    }
    
    await game.save();
    
    res.json({ 
      message: 'Goal recorded!', 
      teamAScore: game.teams.teamA.score,
      teamBScore: game.teams.teamB.score 
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// End match
router.post('/:id/end-match', async (req, res) => {
  try {
    const game = await Game.findByIdAndUpdate(
      req.params.id,
      { status: 'completed', isStreaming: false },
      { new: true }
    );
    
    if (!game) {
      return res.status(404).json({ message: 'Game not found.' });
    }
    
    res.json({ message: 'Match ended successfully!', game });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Toggle streaming status
router.post('/:id/toggle-stream', async (req, res) => {
  const { isStreaming, userEmail } = req.body;
  
  try {
    const updateData = { isStreaming };
    if (isStreaming) {
      updateData.streamingUser = userEmail;
    } else {
      updateData.streamingUser = null;
    }
    
    const game = await Game.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!game) {
      return res.status(404).json({ message: 'Game not found.' });
    }
    
    res.json({ message: 'Stream status updated!', isStreaming: game.isStreaming });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
