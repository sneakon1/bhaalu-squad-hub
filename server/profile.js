const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  preferredPosition: { type: String },
  favPlayer: { type: String },
  availableThisWeek: { type: Boolean, default: false },
  aboutMe: { type: String },
  profilePicture: { type: String }, // store image URL or base64 string
  rating: { type: Number, default: 0 }, // average rating
  totalRatings: { type: Number, default: 0 }, // number of ratings received
  ratings: [{ // individual ratings
    raterEmail: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    createdAt: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model('Profile', profileSchema);
