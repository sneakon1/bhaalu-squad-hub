const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const gamesRoutes = require('./games.routes');
const profileRoutes = require('./profile.routes');
const { error } = require('console');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

app.use(bodyParser.json());
app.use(cors());

// Create recordings directory
const recordingsDir = path.join(__dirname, 'recordings');
if (!fs.existsSync(recordingsDir)) {
  fs.mkdirSync(recordingsDir);
}

// Serve video files
app.use('/recordings', express.static(recordingsDir));

// Media server data structures
const gameStreams = new Map();
const captainRooms = new Map();
const gameRooms = new Map();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Global room for match notifications
  socket.on('join-global', (data) => {
    const { userEmail } = data;
    socket.join('global-room');
    console.log(`User ${userEmail} joined global room`);
  });
  
  socket.on('broadcast-match-end', (data) => {
    const { gameId, excludeUser } = data;
    console.log(`Broadcasting match end for game ${gameId}, excluding ${excludeUser}`);
    socket.to('global-room').emit('match-ended', { gameId, excludeUser });
  });

  // Media streaming events
  socket.on('join-game', (data) => {
    const { gameId, role } = data;
    socket.gameId = gameId;
    socket.role = role;
    
    if (!gameStreams.has(gameId)) {
      gameStreams.set(gameId, { broadcaster: null, viewers: new Set(), recording: null });
    }
    
    const stream = gameStreams.get(gameId);
    
    if (role === 'broadcaster') {
      stream.broadcaster = socket.id;
      socket.emit('ready-to-stream');
      const recordingPath = path.join(recordingsDir, `${gameId}-${Date.now()}.webm`);
      stream.recordingPath = recordingPath;
    } else {
      stream.viewers.add(socket.id);
      if (stream.broadcaster) {
        socket.emit('stream-available');
      }
    }
  });

  socket.on('save-video', (data) => {
    const stream = gameStreams.get(socket.gameId);
    if (stream && socket.role === 'broadcaster' && data.videoData) {
      try {
        const buffer = Buffer.from(data.videoData);
        fs.writeFileSync(stream.recordingPath, buffer);
        stream.viewers.forEach(viewerId => {
          const viewerSocket = io.sockets.sockets.get(viewerId);
          if (viewerSocket) {
            viewerSocket.emit('video-update', {
              videoUrl: `/recordings/${path.basename(stream.recordingPath)}`
            });
          }
        });
      } catch (err) {
        console.error('Error saving video:', err);
      }
    }
  });

  socket.on('request-video-updates', (gameId) => {
    const stream = gameStreams.get(gameId);
    if (stream && stream.recordingPath && fs.existsSync(stream.recordingPath)) {
      socket.emit('video-update', {
        videoUrl: `/recordings/${path.basename(stream.recordingPath)}`
      });
    }
  });

  // Captain team selection events
  socket.on('join-captain-room', (data) => {
    const { gameId, userEmail } = data;
    socket.gameId = gameId;
    socket.userEmail = userEmail;
    
    if (!captainRooms.has(gameId)) {
      captainRooms.set(gameId, { captain1: null, captain2: null, messages: [], currentTurn: 'captain1' });
    }
    
    const room = captainRooms.get(gameId);
    
    if (!room.captain1) {
      room.captain1 = socket.id;
      socket.emit('captain-assigned', { role: 'captain1' });
    } else if (!room.captain2) {
      room.captain2 = socket.id;
      socket.emit('captain-assigned', { role: 'captain2' });
      
      [room.captain1, room.captain2].forEach(captainId => {
        const captainSocket = io.sockets.sockets.get(captainId);
        if (captainSocket) {
          captainSocket.emit('both-captains-ready');
        }
      });
    }
  });

  socket.on('request-captain', (data) => {
    const { gameId, userEmail } = data;
    const room = captainRooms.get(gameId);
    
    if (room) {
      if (!room.captain1) {
        room.captain1 = socket.id;
        socket.emit('captain-assigned', { role: 'captain1' });
      } else if (!room.captain2) {
        room.captain2 = socket.id;
        socket.emit('captain-assigned', { role: 'captain2' });
        
        [room.captain1, room.captain2].forEach(captainId => {
          const captainSocket = io.sockets.sockets.get(captainId);
          if (captainSocket) {
            captainSocket.emit('both-captains-ready');
          }
        });
      }
    }
  });

  socket.on('coin-toss', (data) => {
    const { gameId } = data;
    const room = captainRooms.get(gameId);
    
    if (room) {
      const winner = Math.random() < 0.5 ? 'captain1' : 'captain2';
      room.currentTurn = winner;
      
      [room.captain1, room.captain2].forEach(captainId => {
        const captainSocket = io.sockets.sockets.get(captainId);
        if (captainSocket) {
          captainSocket.emit('toss-result', { winner });
        }
      });
    }
  });

  socket.on('select-player', (data) => {
    const { gameId, playerId, team, captain } = data;
    const room = captainRooms.get(gameId);
    
    if (room && room.currentTurn === captain) {
      const nextTurn = captain === 'captain1' ? 'captain2' : 'captain1';
      room.currentTurn = nextTurn;
      
      [room.captain1, room.captain2].forEach(captainId => {
        const captainSocket = io.sockets.sockets.get(captainId);
        if (captainSocket) {
          captainSocket.emit('player-selected', { playerId, team, nextTurn });
        }
      });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Cleanup captain rooms
    captainRooms.forEach((room, gameId) => {
      if (room.captain1 === socket.id) room.captain1 = null;
      if (room.captain2 === socket.id) room.captain2 = null;
      if (!room.captain1 && !room.captain2) captainRooms.delete(gameId);
    });
    
    // Cleanup game streams
    if (socket.gameId) {
      const stream = gameStreams.get(socket.gameId);
      if (stream) {
        if (stream.broadcaster === socket.id) {
          stream.broadcaster = null;
          stream.viewers.forEach(viewerId => {
            const viewerSocket = io.sockets.sockets.get(viewerId);
            if (viewerSocket) viewerSocket.emit('stream-ended');
          });
        } else {
          stream.viewers.delete(socket.id);
        }
        if (!stream.broadcaster && stream.viewers.size === 0) {
          gameStreams.delete(socket.gameId);
        }
      }
    }
  });
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error:', err);
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
    res.status(500).json({ message: 'Server error.',error: err.message });
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

const port = process.env.PORT || 5000;
server.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
