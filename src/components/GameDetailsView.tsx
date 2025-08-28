import { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Clock, Users, Shield, Shuffle, UserCheck, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import CaptainTeamSelection from './CaptainTeamSelection';

interface Game {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  playersIn: number;
  maxPlayers: number;
  userStatus: 'in' | 'out' | null;
}

interface Player {
  id: string;
  name: string;
  position: string;
  rating: number;
  isAvailable: boolean;
}

interface Team {
  name: string;
  players: Player[];
  color: string;
}

interface GameDetailsViewProps {
  game: Game | null;
  isOpen: boolean;
  onClose: () => void;
}

const GameDetailsView = ({ game, isOpen, onClose }: GameDetailsViewProps) => {
  const { toast } = useToast();
  const [playersIn, setPlayersIn] = useState<Player[]>([]);
  const [view, setView] = useState<'details' | 'team-selection'>('details');
  const [teams, setTeams] = useState<Team[]>([
    { name: 'Team Alpha', players: [], color: 'bg-blue-500' },
    { name: 'Team Beta', players: [], color: 'bg-red-500' },
  ]);

  const handleTeamsUpdate = (updatedTeams: Team[]) => {
    setTeams(updatedTeams);
  };

  useEffect(() => {
    if (game && isOpen) {
      // Fetch players who are "in" for this game
      fetchPlayersIn();
    }
  }, [game, isOpen]);

  const fetchPlayersIn = async () => {
    if (!game) return;
    
    try {
      // Get players who voted "in" for this game
      const gameRes = await fetch(`http://localhost:5000/games/${game.id}/players-in`);
      const gameData = await gameRes.json();
      
      if (!gameRes.ok || !gameData.playersIn || gameData.playersIn.length === 0) {
        setPlayersIn([]);
        return;
      }
      
      // Get profile data for players who are "in"
      const token = localStorage.getItem('authToken');
      const profileRes = await fetch('http://localhost:5000/api/profile', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const profileData = await profileRes.json();
      
      if (Array.isArray(profileData)) {
        // Filter profiles to only include players who voted "in"
        const playersWhoAreIn = profileData
          .filter((p: any) => gameData.playersIn.includes(p.email))
          .map((p: any) => ({
            id: p._id,
            name: p.name,
            position: p.preferredPosition || 'Midfielder',
            rating: p.rating || 3.0,
            isAvailable: true
          }));
        setPlayersIn(playersWhoAreIn);
      }
    } catch (err) {
      console.error('Failed to fetch players:', err);
      setPlayersIn([]);
    }
  };

  const handleRandomTeamGeneration = () => {
    const shuffledPlayers = [...playersIn].sort(() => Math.random() - 0.5);
    const midpoint = Math.ceil(shuffledPlayers.length / 2);
    
    const newTeams = [
      { ...teams[0], players: shuffledPlayers.slice(0, midpoint) },
      { ...teams[1], players: shuffledPlayers.slice(midpoint) },
    ];
    
    setTeams(newTeams);
  };

  const handleResetTeams = () => {
    setTeams([
      { name: 'Team Alpha', players: [], color: 'bg-blue-500' },
      { name: 'Team Beta', players: [], color: 'bg-red-500' },
    ]);
  };

  const getTeamStats = (team: Team) => {
    const avgRating = team.players.length > 0 
      ? team.players.reduce((sum, p) => sum + p.rating, 0) / team.players.length 
      : 0;
    return { avgRating };
  };

  const handleGoLive = async () => {
    if (!game || teams.every(team => team.players.length === 0)) {
      toast({
        title: 'No Teams Selected',
        description: 'Please select teams before going live',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Get player emails from the original playersIn data
      const getPlayerEmail = (playerId: string) => {
        const playerProfile = playersIn.find(p => p.id === playerId);
        return playerProfile ? playerProfile.name : playerId; // fallback to name if email not found
      };

      const teamData = {
        teamA: {
          name: teams[0].name,
          players: teams[0].players.map(p => getPlayerEmail(p.id))
        },
        teamB: {
          name: teams[1].name,
          players: teams[1].players.map(p => getPlayerEmail(p.id))
        }
      };

      const res = await fetch(`http://localhost:5000/games/${game.id}/go-live-with-teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamData)
      });

      const data = await res.json();
      if (res.ok) {
        toast({
          title: 'Game is Live!',
          description: 'The match has been moved to live games'
        });
        onClose();
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to go live',
        variant: 'destructive'
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (!game) return null;

  if (view === 'team-selection') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-semibold">Team Selection - {game.title}</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView('details')}
            >
              Back to Game Details
            </Button>
          </div>
          <div className="p-4">
            <CaptainTeamSelection 
              gameId={game.id}
              availablePlayers={playersIn} 
              onTeamsUpdate={handleTeamsUpdate}
              onGoLive={handleGoLive}
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-2xl font-poppins font-bold">
            {game.title}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-4 space-y-6">
          {/* Game Info */}
          <Card className="p-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-primary" />
                <span className="font-medium">{formatDate(game.date)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-primary" />
                <span className="font-medium">{game.time}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-primary" />
                <span className="font-medium">{game.venue}</span>
              </div>
            </div>
          </Card>

          {/* Players In Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-poppins font-semibold flex items-center space-x-2">
                <Users className="w-6 h-6 text-primary" />
                <span>Players In ({playersIn.length})</span>
              </h3>
              <Badge variant="secondary">
                {playersIn.length}/{game.maxPlayers} spots filled
              </Badge>
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {playersIn.map((player) => (
                <Card key={player.id} className="p-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {player.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{player.name}</div>
                      <div className="text-xs text-muted-foreground">{player.position}</div>
                    </div>
                    <div className="text-sm font-bold text-primary">
                      {player.rating.toFixed(1)}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {playersIn.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No players have joined this game yet
              </div>
            )}
          </div>

          {/* Captain Tools Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-poppins font-semibold flex items-center space-x-2">
              <Shield className="w-6 h-6 text-secondary" />
              <span>Captain Tools</span>
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Team Selection */}
              <Card className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <UserCheck className="w-5 h-5 text-primary" />
                    <h4 className="font-semibold">Team Selection</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Captain toss and pick teams alternately
                  </p>
                  <Button 
                    onClick={() => setView('team-selection')}
                    className="w-full btn-action"
                    disabled={playersIn.length < 2}
                  >
                    Start Team Selection
                  </Button>
                </div>
              </Card>

              {/* Random Teams */}
              <Card className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Shuffle className="w-5 h-5 text-primary" />
                    <h4 className="font-semibold">Random Teams</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Automatically split players into balanced teams
                  </p>
                  <Button 
                    onClick={handleRandomTeamGeneration}
                    className="w-full btn-field"
                    disabled={playersIn.length < 2}
                  >
                    Generate Random Teams
                  </Button>
                </div>
              </Card>
            </div>
          </div>

          {/* Generated Teams */}
          {teams.some(team => team.players.length > 0) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-poppins font-semibold">Generated Teams</h3>
                <div className="flex space-x-2">
                  <Button onClick={handleGoLive} className="btn-action">
                    <Radio className="w-4 h-4 mr-2" />
                    Go Live
                  </Button>
                  <Button onClick={handleResetTeams} variant="outline" size="sm">
                    Reset Teams
                  </Button>
                </div>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2">
                {teams.map((team, index) => {
                  const stats = getTeamStats(team);
                  return (
                    <Card key={index} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded-full ${team.color}`}></div>
                          <h4 className="font-semibold">{team.name}</h4>
                          <Badge variant="secondary">
                            {team.players.length} players
                          </Badge>
                        </div>

                        <div className="text-center p-2 bg-muted/30 rounded">
                          <div className="text-lg font-bold text-primary">
                            {stats.avgRating.toFixed(1)}
                          </div>
                          <div className="text-xs text-muted-foreground">Avg Rating</div>
                        </div>

                        <div className="space-y-2">
                          {team.players.map((player) => (
                            <div key={player.id} className="flex items-center space-x-2 text-sm">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs">
                                  {player.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <span className="flex-1">{player.name}</span>
                              <span className="text-primary font-semibold">
                                {player.rating.toFixed(1)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GameDetailsView;