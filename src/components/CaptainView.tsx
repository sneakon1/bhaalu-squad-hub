import { useState, useEffect } from 'react';
import { Shuffle, Shield, Users, ArrowRight, RotateCcw, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import TeamSelectionView from './TeamSelectionView';

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
  const [view, setView] = useState<'tools' | 'team-selection'>('tools');
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const res = await fetch('https://bhaalu-squad-hub.onrender.com/api/profile', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          setAvailablePlayers(data.map((p: any) => ({
            id: p._id,
            name: p.name,
            position: p.preferredPosition || 'Midfielder',
            rating: p.rating || 3.0,
            isAvailable: p.availableThisWeek || false
          })).filter((p: Player) => p.isAvailable));
        }
      } catch (err) {
        console.error('Failed to fetch players:', err);
      }
    };
    fetchPlayers();
  }, []);

  const [teams, setTeams] = useState<Team[]>([
    { name: 'Team Alpha', players: [], color: 'bg-blue-500' },
    { name: 'Team Beta', players: [], color: 'bg-red-500' },
  ]);

  const [callingPlayer, setCallingPlayer] = useState<Player | null>(null);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);

  if (view === 'team-selection') {
    return <TeamSelectionView availablePlayers={availablePlayers} />;
  }

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
            <Shield className="w-8 h-8 text-secondary-foreground" />
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
        {/* Team Selection */}
        <Card className="card-field p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <UserCheck className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-poppins font-semibold">Team Selection</h2>
            </div>
            
            <p className="text-muted-foreground text-sm">
              Toss between captains and pick teams alternately
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
                onClick={() => setView('team-selection')}
                className="btn-action w-full"
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Start Team Selection
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