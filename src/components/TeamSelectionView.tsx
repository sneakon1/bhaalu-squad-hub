import { useState } from 'react';
import { Crown, Users, Coins, RotateCcw, Trophy, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Player {
  id: string;
  name: string;
  position: string;
  rating: number;
  isAvailable: boolean;
}

interface Team {
  name: string;
  captain: string;
  players: Player[];
  color: string;
}

const TeamSelectionView = () => {
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
    { name: 'Team Alpha', captain: 'Captain A', players: [], color: 'bg-blue-500' },
    { name: 'Team Beta', captain: 'Captain B', players: [], color: 'bg-red-500' },
  ]);

  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [currentTurn, setCurrentTurn] = useState<number>(0); // 0 for Team Alpha, 1 for Team Beta
  const [gamePhase, setGamePhase] = useState<'toss' | 'selection' | 'completed'>('toss');
  const [tossWinner, setTossWinner] = useState<number | null>(null);
  const [tossCall, setTossCall] = useState<'heads' | 'tails' | null>(null);

  const handleToss = (call: 'heads' | 'tails') => {
    setTossCall(call);
    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    const winner = call === result ? 0 : 1;
    
    setTimeout(() => {
      setTossWinner(winner);
      setCurrentTurn(winner);
      setGamePhase('selection');
    }, 2000);
  };

  const handlePlayerSelect = (player: Player) => {
    if (selectedPlayers.includes(player.id)) return;

    const newSelectedPlayers = [...selectedPlayers, player.id];
    setSelectedPlayers(newSelectedPlayers);

    const updatedTeams = [...teams];
    updatedTeams[currentTurn].players.push(player);
    setTeams(updatedTeams);

    // Switch turns
    setCurrentTurn(currentTurn === 0 ? 1 : 0);

    // Check if selection is complete
    if (newSelectedPlayers.length === availablePlayers.length) {
      setGamePhase('completed');
    }
  };

  const resetSelection = () => {
    setTeams([
      { name: 'Team Alpha', captain: 'Captain A', players: [], color: 'bg-blue-500' },
      { name: 'Team Beta', captain: 'Captain B', players: [], color: 'bg-red-500' },
    ]);
    setSelectedPlayers([]);
    setCurrentTurn(0);
    setGamePhase('toss');
    setTossWinner(null);
    setTossCall(null);
  };

  const getTeamStats = (team: Team) => {
    const avgRating = team.players.length > 0 
      ? team.players.reduce((sum, p) => sum + p.rating, 0) / team.players.length 
      : 0;
    return { avgRating };
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
              Team Selection
            </h1>
            <p className="text-muted-foreground">
              Captain toss and team selection
            </p>
          </div>
        </div>
      </div>

      {/* Toss Phase */}
      {gamePhase === 'toss' && (
        <Card className="card-field p-6 max-w-md mx-auto text-center">
          <div className="space-y-6">
            <div className="flex items-center justify-center space-x-3">
              <Coins className="w-8 h-8 text-primary" />
              <h2 className="text-2xl font-poppins font-bold">Captain Toss</h2>
            </div>
            
            <p className="text-muted-foreground">
              Captain A, call heads or tails!
            </p>
            
            <div className="flex space-x-4 justify-center">
              <Button 
                onClick={() => handleToss('heads')}
                className="btn-action"
                disabled={tossCall !== null}
              >
                Heads
              </Button>
              <Button 
                onClick={() => handleToss('tails')}
                className="btn-field"
                disabled={tossCall !== null}
              >
                Tails
              </Button>
            </div>

            {tossCall && tossWinner === null && (
              <div className="animate-bounce-in">
                <Coins className="w-12 h-12 mx-auto text-primary animate-spin" />
                <p className="mt-2 text-muted-foreground">Tossing...</p>
              </div>
            )}

            {tossWinner !== null && (
              <div className="animate-bounce-in space-y-3">
                <div className="text-2xl font-bold text-primary">
                  🎉 {teams[tossWinner].name} Wins!
                </div>
                <p className="text-muted-foreground">
                  {teams[tossWinner].captain} gets the first pick
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Selection Phase */}
      {gamePhase === 'selection' && (
        <div className="space-y-6">
          {/* Current Turn Indicator */}
          <Card className="card-field p-4">
            <div className="flex items-center justify-center space-x-3">
              <div className={`w-4 h-4 rounded-full ${teams[currentTurn].color}`}></div>
              <span className="font-semibold text-lg">
                {teams[currentTurn].name}'s Turn
              </span>
              <Crown className="w-5 h-5 text-primary" />
            </div>
          </Card>

          {/* Available Players */}
          <div className="space-y-4">
            <h3 className="text-xl font-poppins font-semibold text-center">Available Players</h3>
            
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {availablePlayers.map((player) => {
                const isSelected = selectedPlayers.includes(player.id);
                return (
                  <Card 
                    key={player.id} 
                    className={`p-4 cursor-pointer transition-all ${
                      isSelected 
                        ? 'opacity-50 cursor-not-allowed bg-muted' 
                        : 'hover:bg-accent hover:scale-105'
                    }`}
                    onClick={() => !isSelected && handlePlayerSelect(player)}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-secondary text-secondary-foreground">
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
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Teams Display (for selection and completed phases) */}
      {(gamePhase === 'selection' || gamePhase === 'completed') && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-poppins font-bold">Teams</h2>
            <Button onClick={resetSelection} variant="outline" size="sm">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
          
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
                      {gamePhase === 'completed' && (
                        <Trophy className="w-5 h-5 text-primary" />
                      )}
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
                          {team.captain}
                        </div>
                        <div className="text-xs text-muted-foreground">Captain</div>
                      </div>
                    </div>

                    {/* Players List */}
                    <div className="space-y-2">
                      {team.players.map((player) => (
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

      {gamePhase === 'completed' && (
        <div className="text-center py-8">
          <div className="text-2xl font-bold text-primary mb-4">🎉 Teams Ready!</div>
          <p className="text-muted-foreground">Both teams have been selected. Good luck!</p>
        </div>
      )}
    </div>
  );
};

export default TeamSelectionView;