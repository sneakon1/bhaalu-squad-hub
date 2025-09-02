import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';

interface GlobalSocketContextType {
  socket: Socket | null;
}

const GlobalSocketContext = createContext<GlobalSocketContextType>({ socket: null });

export const useGlobalSocket = () => useContext(GlobalSocketContext);

export const GlobalSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [ratingGameId, setRatingGameId] = useState<string | null>(null);

  useEffect(() => {
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) return;

    const newSocket = io('https://bhaalu-squad-hub.onrender.com');
    
    newSocket.on('connect', () => {
      console.log('Global socket connected');
      newSocket.emit('join-global', { userEmail });
    });

    newSocket.on('match-ended', (data) => {
      console.log('Match ended notification received:', data);
      
      // Don't show dialog if this user ended the match
      if (data.excludeUser === userEmail) {
        console.log('Skipping rating dialog for match ender');
        return;
      }
      
      setRatingGameId(data.gameId);
      setShowRatingDialog(true);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <GlobalSocketContext.Provider value={{ socket }}>
      {children}
      {showRatingDialog && ratingGameId && (
        <RatingDialog 
          gameId={ratingGameId}
          onClose={() => {
            setShowRatingDialog(false);
            setRatingGameId(null);
          }}
        />
      )}
    </GlobalSocketContext.Provider>
  );
};

// Rating Dialog Component
const RatingDialog = ({ gameId, onClose }: { gameId: string; onClose: () => void }) => {
  const [gameData, setGameData] = useState<any>(null);
  const [playerRatings, setPlayerRatings] = useState<{[key: string]: number}>({});
  const [currentUserName, setCurrentUserName] = useState<string>('');
  
  useEffect(() => {
    fetchGameData();
    fetchCurrentUserName();
  }, []);
  
  const fetchGameData = async () => {
    try {
      const res = await fetch(`https://bhaalu-squad-hub.onrender.com/games/${gameId}`);
      const data = await res.json();
      if (res.ok) {
        setGameData(data);
      }
    } catch (err) {
      console.error('Failed to fetch game data:', err);
    }
  };
  
  const fetchCurrentUserName = async () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const res = await fetch('https://bhaalu-squad-hub.onrender.com/api/profile/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentUserName(data.name);
        }
      } catch (err) {
        console.error('Failed to fetch user name:', err);
      }
    }
  };
  
  const handleRatePlayer = (playerName: string, rating: number) => {
    setPlayerRatings(prev => ({ ...prev, [playerName]: rating }));
  };
  
  const submitRatings = async () => {
    try {
      const userEmail = localStorage.getItem('userEmail');
      const res = await fetch(`https://bhaalu-squad-hub.onrender.com/games/${gameId}/rate-players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ratings: playerRatings, raterEmail: userEmail })
      });
      
      if (res.ok) {
        onClose();
      }
    } catch (err) {
      console.error('Failed to submit ratings:', err);
    }
  };
  
  if (!gameData) return null;
  
  const allPlayers = [
    ...(gameData.teams?.teamA?.players || []),
    ...(gameData.teams?.teamB?.players || [])
  ].filter(player => player !== currentUserName);
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card p-6 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
          <Star className="w-5 h-5" />
          <span>Rate Players Performance</span>
        </h2>
        
        <div className="space-y-4">
          {allPlayers.map((player: string) => (
            <div key={player} className="flex items-center justify-between p-3 border rounded">
              <span className="font-medium">{player}</span>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRatePlayer(player, star)}
                    className={`w-6 h-6 ${
                      star <= (playerRatings[player] || 0)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                  >
                    <Star className="w-full h-full" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex space-x-2 mt-6">
          <Button onClick={submitRatings} className="flex-1">
            Submit Ratings
          </Button>
          <Button onClick={onClose} variant="outline">
            Skip
          </Button>
        </div>
      </div>
    </div>
  );
};