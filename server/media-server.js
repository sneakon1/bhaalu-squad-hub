const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  transports: ['polling', 'websocket'],
  allowEIO3: true
});

// Create recordings directory
const recordingsDir = path.join(__dirname, 'recordings');
if (!fs.existsSync(recordingsDir)) {
  fs.mkdirSync(recordingsDir);
}

const gameStreams = new Map(); // gameId -> { broadcaster: socketId, viewers: Set<socketId>, recording: WriteStream, recordingPath: string }
const captainRooms = new Map(); // gameId -> { captain1: socketId, captain2: socketId, messages: [], currentTurn: 'captain1' | 'captain2' }
const gameRooms = new Map(); // gameId -> Set<socketId> for match notifications

// Serve video files
app.use('/recordings', express.static(recordingsDir));

io.on('connection', (socket) => {
  console.log('Media server connection:', socket.id);

  socket.on('join-game', (data) => {
    const { gameId, role } = data;
    console.log('Join game:', { gameId, role, socketId: socket.id });
    socket.gameId = gameId;
    socket.role = role;
    
    if (!gameStreams.has(gameId)) {
      gameStreams.set(gameId, { broadcaster: null, viewers: new Set(), recording: null });
    }
    
    const stream = gameStreams.get(gameId);
    
    if (role === 'broadcaster') {
      stream.broadcaster = socket.id;
      socket.emit('ready-to-stream');
      
      // Set recording path
      const recordingPath = path.join(recordingsDir, `${gameId}-${Date.now()}.webm`);
      stream.recordingPath = recordingPath;
      console.log('Broadcaster setup, recording path:', recordingPath);
      
    } else {
      stream.viewers.add(socket.id);
      console.log('Viewer added, total viewers:', stream.viewers.size);
      if (stream.broadcaster) {
        console.log('Broadcaster exists, sending stream-available');
        socket.emit('stream-available');
      } else {
        console.log('No broadcaster yet');
      }
    }
  });

  socket.on('save-video', (data) => {
    console.log('Received save-video event', { gameId: socket.gameId, role: socket.role, dataSize: data.videoData?.length });
    const stream = gameStreams.get(socket.gameId);
    if (stream && socket.role === 'broadcaster') {
      // Save complete video file
      if (stream.recordingPath && data.videoData) {
        try {
          const buffer = Buffer.from(data.videoData);
          fs.writeFileSync(stream.recordingPath, buffer);
          console.log('Video saved successfully:', stream.recordingPath, 'Size:', buffer.length);
          
          // Notify viewers of update
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
      } else {
        console.log('Missing recordingPath or videoData');
      }
    } else {
      console.log('Stream not found or not broadcaster');
    }
  });

  // Send video file updates every 500ms for smooth viewing
  socket.on('request-video-updates', (gameId) => {
    console.log('Video updates requested for gameId:', gameId);
    const interval = setInterval(() => {
      const stream = gameStreams.get(gameId);
      if (stream && stream.recordingPath) {
        if (fs.existsSync(stream.recordingPath)) {
          socket.emit('video-update', {
            videoUrl: `/recordings/${path.basename(stream.recordingPath)}`
          });
        }
      } else {
        clearInterval(interval);
      }
    }, 500);
    
    socket.videoUpdateInterval = interval;
  });

  socket.on('stop-stream', () => {
    const stream = gameStreams.get(socket.gameId);
    if (stream && socket.role === 'broadcaster') {
      // Stop recording
      if (stream.recording) {
        stream.recording.end();
        stream.recording = null;
      }
      
      // Notify viewers
      stream.viewers.forEach(viewerId => {
        const viewerSocket = io.sockets.sockets.get(viewerId);
        if (viewerSocket) {
          viewerSocket.emit('stream-ended');
        }
      });
      
      stream.broadcaster = null;
    }
  });

  // Captain team selection events
  socket.on('join-captain-room', (data) => {
    const { gameId, userEmail } = data;
    console.log('Join captain room:', { gameId, userEmail, socketId: socket.id });
    socket.gameId = gameId;
    socket.userEmail = userEmail;
    
    if (!captainRooms.has(gameId)) {
      captainRooms.set(gameId, { captain1: null, captain2: null, messages: [], currentTurn: 'captain1' });
    }
    
    const room = captainRooms.get(gameId);
    console.log('Room state:', room);
    
    if (!room.captain1) {
      room.captain1 = socket.id;
      console.log('Assigned captain1 to:', socket.id);
      socket.emit('captain-assigned', { role: 'captain1' });
    } else if (!room.captain2) {
      room.captain2 = socket.id;
      console.log('Assigned captain2 to:', socket.id);
      socket.emit('captain-assigned', { role: 'captain2' });
      
      // Both captains now assigned, notify both
      [room.captain1, room.captain2].forEach(captainId => {
        const captainSocket = io.sockets.sockets.get(captainId);
        if (captainSocket) {
          captainSocket.emit('both-captains-ready');
        }
      });
    } else {
      console.log('Both captain slots filled');
    }
  });

  socket.on('request-captain', (data) => {
    const { gameId, userEmail } = data;
    console.log('Captain request:', { gameId, userEmail, socketId: socket.id });
    const room = captainRooms.get(gameId);
    
    if (room) {
      console.log('Room found:', room);
      if (!room.captain1) {
        room.captain1 = socket.id;
        console.log('Assigned captain1 via request to:', socket.id);
        socket.emit('captain-assigned', { role: 'captain1' });
      } else if (!room.captain2) {
        room.captain2 = socket.id;
        console.log('Assigned captain2 via request to:', socket.id);
        socket.emit('captain-assigned', { role: 'captain2' });
        
        // Both captains now assigned, notify both
        [room.captain1, room.captain2].forEach(captainId => {
          const captainSocket = io.sockets.sockets.get(captainId);
          if (captainSocket) {
            captainSocket.emit('both-captains-ready');
          }
        });
      } else {
        console.log('Both captain slots already filled');
      }
    } else {
      console.log('No room found for gameId:', gameId);
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
      
      // Check if this was the last player (emit completion if needed)
      // This will be handled on the client side
    }
  });

  socket.on('captain-message', (data) => {
    const { gameId, sender, message } = data;
    const room = captainRooms.get(gameId);
    
    if (room) {
      room.messages.push({ sender, message, timestamp: new Date() });
      
      [room.captain1, room.captain2].forEach(captainId => {
        const captainSocket = io.sockets.sockets.get(captainId);
        if (captainSocket && captainSocket.id !== socket.id) {
          captainSocket.emit('captain-message', { sender, message });
        }
      });
    }
  });

  // Global room for all users to receive match notifications
  socket.on('join-global-room', (data) => {
    const { userEmail } = data;
    socket.join('global-notifications');
    console.log(`User ${userEmail} joined global notifications room`);
  });

  socket.on('broadcast-match-end', (data) => {
    const { gameId } = data;
    console.log(`Broadcasting match end for game ${gameId} to all users`);
    
    // Broadcast to all users in global room
    io.to('global-notifications').emit('match-ended', { gameId });
    console.log(`Match end broadcasted globally for game ${gameId}`);
  });

  socket.on('disconnect', () => {
    if (socket.videoUpdateInterval) {
      clearInterval(socket.videoUpdateInterval);
    }
    
    // Handle captain disconnection
    captainRooms.forEach((room, gameId) => {
      if (room.captain1 === socket.id) {
        room.captain1 = null;
      } else if (room.captain2 === socket.id) {
        room.captain2 = null;
      }
      
      if (!room.captain1 && !room.captain2) {
        captainRooms.delete(gameId);
      }
    });
    
    // Handle game room disconnection
    gameRooms.forEach((room, gameId) => {
      room.delete(socket.id);
      if (room.size === 0) {
        gameRooms.delete(gameId);
      }
    });
    
    if (socket.gameId) {
      const stream = gameStreams.get(socket.gameId);
      if (stream) {
        if (stream.broadcaster === socket.id) {
          // Broadcaster disconnected
          if (stream.recording) {
            stream.recording.end();
            stream.recording = null;
          }
          stream.broadcaster = null;
          
          stream.viewers.forEach(viewerId => {
            const viewerSocket = io.sockets.sockets.get(viewerId);
            if (viewerSocket) {
              viewerSocket.emit('stream-ended');
            }
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

server.listen(5005, () => {
  console.log('Media server running on port 5005');
});

module.exports = { app, server, io };