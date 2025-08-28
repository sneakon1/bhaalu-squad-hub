import { useState, useEffect } from 'react';
import { X, ArrowLeft, Plus, Target, Square, Lock, Mail, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogOverlay, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import LiveMatchCard from './LiveMatchCard';
import LiveStreamPlayer from './LiveStreamPlayer';

interface LiveGame {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  matchTime: string;
  status: 'live' | 'halftime' | 'fulltime';
  venue: string;
}

interface LiveGameViewProps {
  game: LiveGame | null;
  isOpen: boolean;
  onClose: () => void;
  onGameUpdate?: () => void;
}

interface GameData {
  teams: {
    teamA: { name: string; players: string[]; score: number };
    teamB: { name: string; players: string[]; score: number };
  };
  goals: Array<{
    team: 'teamA' | 'teamB';
    scorer: string;
    minute: number;
  }>;
}

const LiveGameView = ({ game, isOpen, onClose, onGameUpdate }: LiveGameViewProps) => {
  const { toast } = useToast();
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<'teamA' | 'teamB'>('teamA');
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [matchEnded, setMatchEnded] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isViewer, setIsViewer] = useState(false);
  const [streamingUser, setStreamingUser] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState({ email: '', password: '' });
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [playerRatings, setPlayerRatings] = useState<{[key: string]: number}>({});
  const [currentUserName, setCurrentUserName] = useState<string>('');

  useEffect(() => {
    if (game && isOpen) {
      fetchGameData();
      checkAdminStatus();
      fetchCurrentUserName();
    }
  }, [game, isOpen]);

  const fetchCurrentUserName = async () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const res = await fetch('http://localhost:5000/api/profile/me', {
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

  const checkAdminStatus = () => {
    const isAdminStored = localStorage.getItem('isAdmin') === 'true';
    setIsAdmin(isAdminStored);
  };

  useEffect(() => {
    // Reset selected player when team changes
    setSelectedPlayer('');
  }, [selectedTeam]);

  const fetchGameData = async () => {
    if (!game) return;
    try {
      const res = await fetch(`http://localhost:5000/games/${game.id}`);
      const data = await res.json();
      if (res.ok && data.teams) {
        setGameData(data);
        setIsStreaming(data.isStreaming || false);
        
        // Determine if current user is viewer (someone else is streaming)
        const userEmail = localStorage.getItem('userEmail');
        if (data.isStreaming && data.streamingUser && data.streamingUser !== userEmail) {
          setIsViewer(true);
          setStreamingUser(data.streamingUser);
        } else {
          setIsViewer(false);
          setStreamingUser(null);
        }
      }
    } catch (err) {
      console.error('Failed to fetch game data:', err);
    }
  };

  const handleAddGoal = async () => {
    if (!selectedPlayer || !gameData) {
      toast({
        title: 'Missing Information',
        description: 'Please select a player',
        variant: 'destructive'
      });
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/games/${game?.id}/goal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team: selectedTeam,
          scorer: selectedPlayer,
          minute: 0
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast({
          title: 'Goal Recorded!',
          description: `${selectedPlayer} scored for ${gameData.teams[selectedTeam].name}`
        });
        fetchGameData();
        onGameUpdate?.(); // Notify parent to refresh
        
        // Goal update will be handled by regular refresh
        
        setSelectedPlayer('');
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to record goal',
        variant: 'destructive'
      });
    }
  };

  const handleEndMatchClick = () => {
    if (isAdmin) {
      handleEndMatch();
    } else {
      setShowAdminLogin(true);
    }
  };

  const handleAdminLogin = async () => {
    if (adminCredentials.email === 'admin' && adminCredentials.password === 'admin123') {
      localStorage.setItem('isAdmin', 'true');
      setIsAdmin(true);
      setShowAdminLogin(false);
      handleEndMatch();
    } else {
      toast({
        title: 'Invalid Credentials',
        description: 'Please enter correct admin credentials',
        variant: 'destructive'
      });
    }
  };

  const handleEndMatch = async () => {
    try {
      const res = await fetch(`http://localhost:5000/games/${game?.id}/end-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();
      if (res.ok) {
        toast({
          title: 'Match Ended!',
          description: 'The match has been moved to past matches'
        });
        onGameUpdate?.(); // Notify parent to refresh
        setMatchEnded(true);
        
        // Show rating dialog after match ends
        setTimeout(() => {
          setShowRatingDialog(true);
        }, 1000);
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to end match',
        variant: 'destructive'
      });
    }
  };

  const handleRatePlayer = (playerName: string, rating: number) => {
    setPlayerRatings(prev => ({ ...prev, [playerName]: rating }));
  };

  const submitRatings = async () => {
    try {
      const userEmail = localStorage.getItem('userEmail');
      const res = await fetch(`http://localhost:5000/games/${game?.id}/rate-players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ratings: playerRatings, raterEmail: userEmail })
      });

      if (res.ok) {
        toast({
          title: 'Ratings Submitted!',
          description: 'Thank you for rating the players'
        });
        setShowRatingDialog(false);
        onClose();
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to submit ratings',
        variant: 'destructive'
      });
    }
  };

  const skipRatings = () => {
    setShowRatingDialog(false);
    onClose();
  };

  if (!game) return null;

  const handleClose = () => {
    onClose(); // Anyone can close the window
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl w-full max-h-[90vh] p-0 overflow-hidden">
        <div className="flex flex-col h-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="hover:bg-muted -ml-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <h2 className="text-lg font-semibold">
                {game.homeTeam} vs {game.awayTeam} - LIVE
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Live Stream Player */}
          <div className="relative flex-1 min-h-[400px]">
            <LiveStreamPlayer
              gameId={game.id}
              isStreaming={isStreaming}
              onStreamStart={() => setIsStreaming(true)}
              onStreamStop={() => setIsStreaming(false)}
              ws={ws}
              isViewer={isViewer}
            />
          </div>

          {/* Goal Tracking Section */}
          {gameData && (
            <div className="p-4 border-t">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Match Control</h2>
                <Button onClick={handleEndMatchClick} variant="destructive">
                  <Square className="w-4 h-4 mr-2" />
                  End Match
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    Current Score
                  </h3>
                  <div className="text-center text-2xl font-bold">
                    {gameData.teams.teamA.name} {gameData.teams.teamA.score} - {gameData.teams.teamB.score} {gameData.teams.teamB.name}
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center">
                    <Plus className="w-5 h-5 mr-2" />
                    Record Goal
                  </h3>
                  <div className="space-y-3">
                    <Select value={selectedTeam} onValueChange={(value: 'teamA' | 'teamB') => setSelectedTeam(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="teamA">{gameData.teams.teamA.name}</SelectItem>
                        <SelectItem value="teamB">{gameData.teams.teamB.name}</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select player" />
                      </SelectTrigger>
                      <SelectContent>
                        {gameData.teams[selectedTeam].players.map((player) => (
                          <SelectItem key={player} value={player}>{player}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button onClick={handleAddGoal} className="w-full btn-action">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Goal
                    </Button>
                  </div>
                </Card>
              </div>

              {gameData.goals.length > 0 && (
                <Card className="p-4 mt-4">
                  <h3 className="font-semibold mb-3">Goals</h3>
                  <div className="space-y-2">
                    {gameData.goals.map((goal, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                        <span>{goal.scorer} ({gameData.teams[goal.team].name})</span>
                        <span className="text-sm text-muted-foreground">{goal.minute}'</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Live Match Card */}
          <div className="p-4">
            <LiveMatchCard game={{
              ...game,
              homeScore: gameData?.teams.teamA.score || game.homeScore,
              awayScore: gameData?.teams.teamB.score || game.awayScore
            }} />
          </div>
        </div>
      </DialogContent>
      
      {/* Admin Login Dialog */}
      <Dialog open={showAdminLogin} onOpenChange={setShowAdminLogin}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Lock className="w-5 h-5" />
              <span>Admin Login Required</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email" className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>Email</span>
              </Label>
              <Input
                id="admin-email"
                type="email"
                value={adminCredentials.email}
                onChange={(e) => setAdminCredentials(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter admin email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="admin-password" className="flex items-center space-x-2">
                <Lock className="w-4 h-4" />
                <span>Password</span>
              </Label>
              <Input
                id="admin-password"
                type="password"
                value={adminCredentials.password}
                onChange={(e) => setAdminCredentials(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter admin password"
                onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
              />
            </div>
            
            <div className="flex space-x-2 pt-4">
              <Button onClick={handleAdminLogin} className="flex-1">
                Login & End Match
              </Button>
              <Button onClick={() => setShowAdminLogin(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Player Rating Dialog */}
      <Dialog open={showRatingDialog} onOpenChange={() => {}}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Star className="w-5 h-5" />
              <span>Rate Players Performance</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 pt-4">
            {gameData && (
              <div className="space-y-4">
                {/* Team A Players */}
                <div>
                  <h3 className="font-semibold mb-3">{gameData.teams.teamA.name}</h3>
                  <div className="space-y-3">
                    {gameData.teams.teamA.players.filter(player => player !== currentUserName).map((player) => (
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
                </div>
                
                {/* Team B Players */}
                <div>
                  <h3 className="font-semibold mb-3">{gameData.teams.teamB.name}</h3>
                  <div className="space-y-3">
                    {gameData.teams.teamB.players.filter(player => player !== currentUserName).map((player) => (
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
                </div>
              </div>
            )}
            
            <div className="flex space-x-2 pt-4">
              <Button onClick={submitRatings} className="flex-1">
                Submit Ratings
              </Button>
              <Button onClick={skipRatings} variant="outline">
                Skip
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default LiveGameView;