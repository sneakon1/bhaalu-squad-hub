const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const mongoose = require('mongoose');
const gamesRoutes = require('./games.routes');
const profileRoutes = require('./profile.routes');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
const PORT = 5000;
const JWT_SECRET = 'your_jwt_secret'; // Change this in production

app.use(bodyParser.json());
app.use(cors());

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-global', (data) => {
    const { userEmail } = data;
    socket.join('global-room');
    console.log(`User ${userEmail} joined global room`);
  });
  
  socket.on('broadcast-match-end', (data) => {
    const { gameId, excludeUser } = data;
    console.log(`Broadcasting match end for game ${gameId}, excluding ${excludeUser}`);
    
    // Broadcast to all users in global room except the one who ended the match
    socket.to('global-room').emit('match-ended', { gameId, excludeUser });
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
const User = mongoose.model('User', userSchema);

// Signup endpoint
app.post('/api/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required.' });
  }
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Protected route example
// app.get('/api/profile', async (req, res) => {
//   const authHeader = req.headers.authorization;
//   if (!authHeader) return res.status(401).json({ message: 'No token provided.' });
//   const token = authHeader.split(' ')[1];
//   try {
//     const decoded = jwt.verify(token, JWT_SECRET);
//     const user = await User.findOne({ email: decoded.email });
//     if (!user) return res.status(404).json({ message: 'User not found.' });
//     res.json({ email: user.email });
//   } catch (err) {
//     res.status(401).json({ message: 'Invalid token.' });
//   }
// });

app.use('/games', gamesRoutes);
app.use('/api/profile', profileRoutes);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
