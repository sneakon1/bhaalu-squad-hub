const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  location: { type: String, required: true },
  createdBy: { type: String }, // user email or id
  status: { type: String, enum: ['upcoming', 'live', 'completed'], default: 'upcoming' },
  maxPlayers: { type: Number, default: 16 },
  description: { type: String },
  isStreaming: { type: Boolean, default: false },
  streamingUser: { type: String }, // email of user who is streaming
  players: [{
    email: { type: String, required: true },
    status: { type: String, enum: ['in', 'out'], required: true },
    joinedAt: { type: Date, default: Date.now }
  }],
  teams: {
    teamA: {
      name: { type: String, default: 'Team Alpha' },
      players: [{ type: String }], // player emails
      score: { type: Number, default: 0 }
    },
    teamB: {
      name: { type: String, default: 'Team Beta' },
      players: [{ type: String }], // player emails
      score: { type: Number, default: 0 }
    }
  },
  goals: [{
    team: { type: String, enum: ['teamA', 'teamB'], required: true },
    scorer: { type: String, required: true }, // player name
    minute: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now }
  }],
  playerRatings: [{
    playerEmail: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    ratedBy: { type: String, required: true },
    ratedAt: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model('Game', gameSchema);
