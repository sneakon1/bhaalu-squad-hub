import { useState } from 'react';
import { Shuffle, Phone, Users, Crown, ArrowRight, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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

const CaptainView = () => {
  const [availablePlayers] = useState<Player[]>([
    { id: '1', name: 'Arjun Sharma', position: 'Striker', rating: 4.3, isAvailable: true },
    { id: '2', name: 'Vikram Singh', position: 'Midfielder', rating: 4.1, isAvailable: true },
    { id: '3', name: 'Rahul Patel', position: 'Defender', rating: 3.9, isAvailable: true },
    { id: '4', name: 'Amit Gupta', position: 'Goalkeeper', rating: 4.5, isAvailable: true },
    { id: '5', name: 'Sanjay Kumar', position: 'Midfielder', rating: 4.0, isAvailable: true },
    { id: '6', name: 'Deepak Yadav', position: 'Striker', rating: 4.2, isAvailable: true },
    { id: '7', name: 'Manish Verma', position: 'Defender', rating: 3.8, isAvailable: true },
    { id: '8', name: 'Raj Malhotra', position: 'Midfielder', rating: 3.7, isAvailable: true },
    { id: '9', name: 'Suresh Reddy', position: 'Defender', rating: 4.1, isAvailable: true },
    { id: '10', name: 'Kiran Joshi', position: 'Striker', rating: 3.9, isAvailable: true },
  ]);

  const [teams, setTeams] = useState<Team[]>([
    { name: 'Team Alpha', players: [], color: 'bg-blue-500' },
    { name: 'Team Beta', players: [], color: 'bg-red-500' },
  ]);

  const [callingPlayer, setCallingPlayer] = useState<Player | null>(null);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);

  const handleRandomTeamGeneration = () => {
    const shuffledPlayers = [...availablePlayers].sort(() => Math.random() - 0.5);
    const midpoint = Math.ceil(shuffledPlayers.length / 2);
    
    const newTeams = [
      { ...teams[0], players: shuffledPlayers.slice(0, midpoint) },
      { ...teams[1], players: shuffledPlayers.slice(midpoint) },
    ];
    
    setTeams(newTeams);
  };

  const handleCallPlayer = () => {
    if (currentPlayerIndex < availablePlayers.length) {
      setCallingPlayer(availablePlayers[currentPlayerIndex]);
      setTimeout(() => {
        setCallingPlayer(null);
        setCurrentPlayerIndex(prev => prev + 1);
      }, 3000);
    }
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
    
    const positions = team.players.reduce((acc, p) => {
      acc[p.position] = (acc[p.position] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { avgRating, positions };
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-secondary to-secondary-light rounded-xl">
            <Crown className="w-8 h-8 text-secondary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-poppins font-bold text-foreground">
              Captain Tools
            </h1>
            <p className="text-muted-foreground">
              Manage your team and coordinate matches
            </p>
          </div>
        </div>
      </div>

      {/* Captain Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Player Calling */}
        <Card className="card-field p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Phone className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-poppins font-semibold">Captain Talk</h2>
            </div>
            
            <p className="text-muted-foreground text-sm">
              Call players one by one who marked "In" for the game
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Player {currentPlayerIndex + 1} of {availablePlayers.length}
                </span>
                <Button 
                  onClick={handleCallPlayer}
                  disabled={currentPlayerIndex >= availablePlayers.length || callingPlayer !== null}
                  className="btn-action"
                  size="sm"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call Next Player
                </Button>
              </div>

              {callingPlayer && (
                <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-4 animate-bounce-in">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-secondary text-secondary-foreground">
                        {callingPlayer.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">Calling {callingPlayer.name}</div>
                      <div className="text-sm text-muted-foreground">{callingPlayer.position}</div>
                    </div>
                    <div className="ml-auto">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-secondary rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-2 h-2 bg-secondary rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Button 
                onClick={() => setCurrentPlayerIndex(0)}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Call List
              </Button>
            </div>
          </div>
        </Card>

        {/* Team Generator */}
        <Card className="card-field p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Shuffle className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-poppins font-semibold">Random Teams</h2>
            </div>
            
            <p className="text-muted-foreground text-sm">
              Automatically split available players into balanced teams
            </p>

            <div className="space-y-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground mb-1">
                  {availablePlayers.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Available Players
                </div>
              </div>

              <Button 
                onClick={handleRandomTeamGeneration}
                className="btn-field w-full"
              >
                <Shuffle className="w-4 h-4 mr-2" />
                Generate Random Teams
              </Button>

              <Button 
                onClick={handleResetTeams}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Teams
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Generated Teams */}
      {teams.some(team => team.players.length > 0) && (
        <div className="space-y-6">
          <h2 className="text-2xl font-poppins font-bold text-center">Generated Teams</h2>
          
          <div className="grid gap-8 md:grid-cols-2">
            {teams.map((team, index) => {
              const stats = getTeamStats(team);
              return (
                <Card key={index} className="card-field p-6">
                  <div className="space-y-4">
                    {/* Team Header */}
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${team.color}`}></div>
                      <h3 className="text-xl font-poppins font-semibold">{team.name}</h3>
                      <Badge variant="secondary">
                        {team.players.length} players
                      </Badge>
                    </div>

                    {/* Team Stats */}
                    <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg">
                      <div className="text-center">
                        <div className="text-lg font-bold text-primary">
                          {stats.avgRating.toFixed(1)}
                        </div>
                        <div className="text-xs text-muted-foreground">Avg Rating</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-foreground">
                          {Object.keys(stats.positions).length}
                        </div>
                        <div className="text-xs text-muted-foreground">Positions</div>
                      </div>
                    </div>

                    {/* Players List */}
                    <div className="space-y-2">
                      {team.players.map((player, playerIndex) => (
                        <div key={player.id} className="flex items-center space-x-3 p-2 bg-card rounded-lg border">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs">
                              {player.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{player.name}</div>
                            <div className="text-xs text-muted-foreground">{player.position}</div>
                          </div>
                          <div className="text-sm font-semibold text-primary">
                            {player.rating.toFixed(1)}
                          </div>
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
  );
};

export default CaptainView;