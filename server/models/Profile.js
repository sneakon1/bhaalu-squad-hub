const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String, default: '' },
  position: { type: String, default: 'Midfielder' },
  favoritePlayer: { type: String, default: '' },
  bio: { type: String, default: '' },
  availableThisWeek: { type: Boolean, default: true },
  rating: { type: Number, default: 0 },
  gamesPlayed: { type: Number, default: 0 },
  goals: { type: Number, default: 0 },
  assists: { type: Number, default: 0 }
}, {
  timestamps: true
});

module.exports = mongoose.model('Profile', profileSchema);