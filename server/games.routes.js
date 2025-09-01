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

// Rate players endpoint
router.post('/:id/rate-players', async (req, res) => {
  const { ratings, raterEmail } = req.body;
  
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ message: 'Game not found.' });
    }
    
    // Initialize ratings array if it doesn't exist
    if (!game.playerRatings) {
      game.playerRatings = [];
    }
    
    // Add ratings for each player
    Object.entries(ratings).forEach(([playerEmail, rating]) => {
      console.log('Saving rating:', playerEmail, rating, 'by', raterEmail);
      game.playerRatings.push({
        playerEmail,
        rating: Number(rating),
        ratedBy: raterEmail,
        ratedAt: new Date()
      });
    });
    
    await game.save();
    
    res.json({ message: 'Ratings saved successfully!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Get player ratings by name
router.get('/player-ratings/:playerName', async (req, res) => {
  try {
    const playerName = decodeURIComponent(req.params.playerName);
    console.log('Getting ratings for player:', playerName);
    
    // First check if any games have ratings at all
    const allGamesWithRatings = await Game.find({ 'playerRatings.0': { $exists: true } });
    console.log('Total games with any ratings:', allGamesWithRatings.length);
    
    const games = await Game.find({ 'playerRatings.playerEmail': playerName });
    console.log('Found games with ratings for this player:', games.length);
    
    let totalRating = 0;
    let ratingCount = 0;
    
    games.forEach(game => {
      console.log('Game ratings:', game.playerRatings);
      game.playerRatings.forEach(rating => {
        console.log('Checking rating:', rating.playerEmail, 'vs', playerName);
        if (rating.playerEmail === playerName) {
          totalRating += rating.rating;
          ratingCount++;
          console.log('Added rating:', rating.rating, 'Total now:', totalRating, 'Count:', ratingCount);
        }
      });
    });
    
    const averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;
    console.log('Final average:', averageRating, 'from', ratingCount, 'ratings');
    
    res.json({ 
      averageRating: Math.round(averageRating * 10) / 10,
      totalRatings: ratingCount 
    });
  } catch (err) {
    console.error('Rating fetch error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Get player stats
router.get('/player-stats/:email', async (req, res) => {
  try {
    console.log('Looking for stats for email:', req.params.email);
    
    const games = await Game.find({
      $or: [
        { 'teams.teamA.players': req.params.email },
        { 'teams.teamB.players': req.params.email },
        { 'players.email': req.params.email }
      ],
      status: { $in: ['live', 'completed'] }
    });
    
    console.log('Found games:', games.length);
    
    let gamesPlayed = games.length;
    let goals = 0;
    let assists = 0;
    
    // Get user's name from profile to match goals
    const Profile = require('./profile');
    const userProfile = await Profile.findOne({ email: req.params.email });
    const userName = userProfile ? userProfile.name : null;
    
    games.forEach(game => {
      console.log('Game goals:', game.goals);
      game.goals.forEach(goal => {
        console.log('Goal scorer:', goal.scorer, 'Looking for email:', req.params.email, 'or name:', userName);
        if (goal.scorer === req.params.email || (userName && goal.scorer === userName)) {
          goals++;
        }
      });
    });
    
    console.log('Final stats:', { gamesPlayed, goals, assists });
    res.json({ gamesPlayed, goals, assists });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Notify match end
router.post('/:id/notify-match-end', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ message: 'Game not found.' });
    }
    
    // Mark game as needing ratings
    game.needsRating = true;
    game.ratingNotifiedAt = new Date();
    await game.save();
    
    res.json({ message: 'Match end notification sent' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Check if user needs to rate players
router.get('/check-rating-needed/:email', async (req, res) => {
  try {
    const game = await Game.findOne({
      needsRating: true,
      $or: [
        { 'teams.teamA.players': req.params.email },
        { 'teams.teamB.players': req.params.email },
        { 'players.email': req.params.email }
      ],
      ratingNotifiedAt: { $gte: new Date(Date.now() - 60000) } // Within last minute
    });
    
    if (game) {
      // Check if user already rated
      const hasRated = game.playerRatings.some(rating => rating.ratedBy === req.params.email);
      if (!hasRated) {
        return res.json({ needsRating: true, gameId: game._id });
      }
    }
    
    res.json({ needsRating: false });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
