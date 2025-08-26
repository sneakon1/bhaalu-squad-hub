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
  }
});

// Create recordings directory
const recordingsDir = path.join(__dirname, 'recordings');
if (!fs.existsSync(recordingsDir)) {
  fs.mkdirSync(recordingsDir);
}

const gameStreams = new Map(); // gameId -> { broadcaster: socketId, viewers: Set<socketId>, recording: WriteStream, recordingPath: string }

// Serve video files
app.use('/recordings', express.static(recordingsDir));

io.on('connection', (socket) => {
  console.log('Media server connection:', socket.id);

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
      
      // Set recording path
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

  // Send video file updates every 5 seconds
  socket.on('request-video-updates', (gameId) => {
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
    }, 5000);
    
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

  socket.on('disconnect', () => {
    if (socket.videoUpdateInterval) {
      clearInterval(socket.videoUpdateInterval);
    }
    
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