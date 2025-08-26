const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 5001 });

const gameRooms = new Map(); // gameId -> Set of WebSocket connections

wss.on('connection', (ws) => {
  console.log('New WebSocket connection');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'join_game':
          joinGame(ws, data.gameId);
          break;
        case 'leave_game':
          leaveGame(ws, data.gameId);
          break;
        case 'stream_update':
          broadcastToGame(data.gameId, data, ws);
          break;
        case 'goal_update':
          broadcastToGame(data.gameId, data);
          break;
      }
    } catch (err) {
      console.error('WebSocket message error:', err);
    }
  });

  ws.on('close', () => {
    // Remove from all game rooms
    gameRooms.forEach((connections, gameId) => {
      connections.delete(ws);
      if (connections.size === 0) {
        gameRooms.delete(gameId);
      }
    });
  });
});

function joinGame(ws, gameId) {
  if (!gameRooms.has(gameId)) {
    gameRooms.set(gameId, new Set());
  }
  gameRooms.get(gameId).add(ws);
  
  ws.send(JSON.stringify({
    type: 'joined_game',
    gameId,
    viewers: gameRooms.get(gameId).size
  }));
}

function leaveGame(ws, gameId) {
  if (gameRooms.has(gameId)) {
    gameRooms.get(gameId).delete(ws);
  }
}

function broadcastToGame(gameId, message, excludeWs = null) {
  if (gameRooms.has(gameId)) {
    gameRooms.get(gameId).forEach(ws => {
      if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }
}

console.log('WebSocket server running on port 5001');

module.exports = { wss, broadcastToGame };