const express = require('express');
const router = express.Router();
const Profile = require('./profile');
const verifyToken = require('./middleware/verifyToken'); // JWT middleware

// GET all profiles (for PlayersView)
router.get('/', verifyToken, async (req, res) => {
  try {
    const profiles = await Profile.find({}, 
      'name preferredPosition favPlayer availableThisWeek profilePicture rating totalRatings email'
    );

    res.json(profiles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while fetching profiles.' });
  }
});

// GET current user's profile
router.get('/me', verifyToken, async (req, res) => {
  try {
    const profile = await Profile.findOne({ email: req.user.email });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found.' });
    }
    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while fetching profile.' });
  }
});

// Create profile
router.post('/', async (req, res) => {
  const { name, email, phone, preferredPosition, favPlayer, availableThisWeek, aboutMe, profilePicture } = req.body;
  if (!email || !name) return res.status(400).json({ message: 'Email and name required.' });
  try {
    const existing = await Profile.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Profile already exists.' });
    const profile = new Profile({ name, email, phone, preferredPosition, favPlayer, availableThisWeek, aboutMe, profilePicture });
    await profile.save();
    res.status(201).json(profile);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Get profile by email
router.get('/:email', verifyToken, async (req, res) => {
  try {
    const profile = await Profile.findOne({ email: req.params.email });
    if (!profile) return res.status(404).json({ message: 'Profile not found.' });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Update profile by email
router.put('/:email', verifyToken, async (req, res) => {
  try {
    const updateFields = (({ name, phone, preferredPosition, favPlayer, availableThisWeek, aboutMe, profilePicture }) => ({ name, phone, preferredPosition, favPlayer, availableThisWeek, aboutMe, profilePicture }))(req.body);
    const updated = await Profile.findOneAndUpdate(
      { email: req.params.email },
      updateFields,
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Profile not found.' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Rate a player
router.post('/:email/rate', verifyToken, async (req, res) => {
  const { rating } = req.body;
  const raterEmail = req.user.email; // from JWT token
  const targetEmail = req.params.email;
  
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
  }
  
  if (raterEmail === targetEmail) {
    return res.status(400).json({ message: 'Cannot rate yourself.' });
  }
  
  try {
    const profile = await Profile.findOne({ email: targetEmail });
    if (!profile) return res.status(404).json({ message: 'Player not found.' });
    
    // Check if user already rated this player
    const existingRatingIndex = profile.ratings.findIndex(r => r.raterEmail === raterEmail);
    
    if (existingRatingIndex >= 0) {
      // Update existing rating
      profile.ratings[existingRatingIndex].rating = rating;
      profile.ratings[existingRatingIndex].createdAt = new Date();
    } else {
      // Add new rating
      profile.ratings.push({ raterEmail, rating });
      profile.totalRatings += 1;
    }
    
    // Recalculate average rating
    const totalScore = profile.ratings.reduce((sum, r) => sum + r.rating, 0);
    profile.rating = totalScore / profile.ratings.length;
    
    await profile.save();
    res.json({ message: 'Rating submitted successfully', rating: profile.rating, totalRatings: profile.totalRatings });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
