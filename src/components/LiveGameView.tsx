import { useState, useEffect } from 'react';
import { X, ArrowLeft, Plus, Target, Square } from 'lucide-react';
import { Dialog, DialogContent, DialogOverlay } from '@/components/ui/dialog';
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

  useEffect(() => {
    if (game && isOpen) {
      fetchGameData();
      
      // Setup WebSocket connection
      const websocket = new WebSocket('ws://localhost:5001');
      websocket.onopen = () => {
        websocket.send(JSON.stringify({ type: 'join_game', gameId: game.id }));
        setWs(websocket);
      };
      
      websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'goal_update' || data.type === 'stream_update') {
          fetchGameData();
        }
      };
      
      return () => {
        if (websocket.readyState === WebSocket.OPEN) {
          websocket.send(JSON.stringify({ type: 'leave_game', gameId: game.id }));
          websocket.close();
        }
      };
    }
  }, [game, isOpen]);

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
        
        // Broadcast goal update via WebSocket
        if (ws) {
          ws.send(JSON.stringify({
            type: 'goal_update',
            gameId: game?.id,
            scorer: selectedPlayer,
            team: selectedTeam
          }));
        }
        
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
        
        // Allow closing after match ends
        setTimeout(() => {
          onClose();
        }, 2000);
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

  if (!game) return null;

  const handleClose = () => {
    if (matchEnded) {
      onClose();
    } else {
      toast({
        title: 'Match in Progress',
        description: 'Please end the match before closing',
        variant: 'destructive'
      });
    }
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
                <Button onClick={handleEndMatch} variant="destructive">
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
    </Dialog>
  );
};

export default LiveGameView;