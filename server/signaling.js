const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 5003 });

const rooms = new Map(); // gameId -> { broadcaster: ws, viewers: Set<ws> }

wss.on('connection', (ws) => {
  console.log('New signaling connection');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'join-room':
          joinRoom(ws, data.gameId, data.role);
          break;
        case 'offer':
          handleOffer(ws, data);
          break;
        case 'answer':
          handleAnswer(ws, data);
          break;
        case 'ice-candidate':
          handleIceCandidate(ws, data);
          break;
        case 'leave-room':
          leaveRoom(ws, data.gameId);
          break;
      }
    } catch (err) {
      console.error('Signaling error:', err);
    }
  });

  ws.on('close', () => {
    // Remove from all rooms
    rooms.forEach((room, gameId) => {
      if (room.broadcaster === ws) {
        room.broadcaster = null;
        // Notify all viewers that stream ended
        room.viewers.forEach(viewer => {
          if (viewer.readyState === WebSocket.OPEN) {
            viewer.send(JSON.stringify({ type: 'stream-ended' }));
          }
        });
      } else {
        room.viewers.delete(ws);
      }
      
      if (!room.broadcaster && room.viewers.size === 0) {
        rooms.delete(gameId);
      }
    });
  });
});

function joinRoom(ws, gameId, role) {
  if (!rooms.has(gameId)) {
    rooms.set(gameId, { broadcaster: null, viewers: new Set() });
  }
  
  const room = rooms.get(gameId);
  
  if (role === 'broadcaster') {
    room.broadcaster = ws;
    ws.gameId = gameId;
    ws.role = 'broadcaster';
    
    // Notify existing viewers that stream started
    room.viewers.forEach(viewer => {
      if (viewer.readyState === WebSocket.OPEN) {
        viewer.send(JSON.stringify({ type: 'stream-started' }));
      }
    });
  } else {
    room.viewers.add(ws);
    ws.gameId = gameId;
    ws.role = 'viewer';
    
    // If broadcaster exists, initiate connection
    if (room.broadcaster && room.broadcaster.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'stream-available' }));
    }
  }
}

function handleOffer(ws, data) {
  const room = rooms.get(ws.gameId);
  if (room && ws.role === 'broadcaster') {
    // Send offer to all viewers
    room.viewers.forEach(viewer => {
      if (viewer.readyState === WebSocket.OPEN) {
        viewer.send(JSON.stringify({
          type: 'offer',
          offer: data.offer
        }));
      }
    });
  }
}

function handleAnswer(ws, data) {
  const room = rooms.get(ws.gameId);
  if (room && ws.role === 'viewer' && room.broadcaster) {
    room.broadcaster.send(JSON.stringify({
      type: 'answer',
      answer: data.answer,
      viewerId: data.viewerId
    }));
  }
}

function handleIceCandidate(ws, data) {
  const room = rooms.get(ws.gameId);
  if (!room) return;
  
  if (ws.role === 'broadcaster') {
    // Send to specific viewer
    room.viewers.forEach(viewer => {
      if (viewer.readyState === WebSocket.OPEN) {
        viewer.send(JSON.stringify({
          type: 'ice-candidate',
          candidate: data.candidate
        }));
      }
    });
  } else {
    // Send to broadcaster
    if (room.broadcaster && room.broadcaster.readyState === WebSocket.OPEN) {
      room.broadcaster.send(JSON.stringify({
        type: 'ice-candidate',
        candidate: data.candidate
      }));
    }
  }
}

function leaveRoom(ws, gameId) {
  const room = rooms.get(gameId);
  if (!room) return;
  
  if (room.broadcaster === ws) {
    room.broadcaster = null;
    room.viewers.forEach(viewer => {
      if (viewer.readyState === WebSocket.OPEN) {
        viewer.send(JSON.stringify({ type: 'stream-ended' }));
      }
    });
  } else {
    room.viewers.delete(ws);
  }
}

console.log('WebRTC signaling server running on port 5003');

module.exports = wss;