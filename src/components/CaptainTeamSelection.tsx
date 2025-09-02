import { useState, useEffect } from 'react';
import { Users, Crown, MessageCircle, Send, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { io, Socket } from 'socket.io-client';

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
  captain?: string;
}

interface Message {
  id: string;
  sender: string;
  message: string;
  timestamp: Date;
}

interface CaptainTeamSelectionProps {
  gameId: string;
  availablePlayers: Player[];
  onTeamsUpdate: (teams: Team[]) => void;
  onGoLive: () => void;
}

const CaptainTeamSelection = ({ gameId, availablePlayers, onTeamsUpdate, onGoLive }: CaptainTeamSelectionProps) => {
  const { toast } = useToast();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [userEmail] = useState(localStorage.getItem('userEmail') || '');
  const [isCaptain, setIsCaptain] = useState(false);
  const [captainRole, setCaptainRole] = useState<'captain1' | 'captain2' | null>(null);
  const [currentTurn, setCurrentTurn] = useState<'captain1' | 'captain2'>('captain1');
  const [teams, setTeams] = useState<Team[]>([
    { name: 'Team Alpha', players: [], color: 'bg-blue-500', captain: '' },
    { name: 'Team Beta', players: [], color: 'bg-red-500', captain: '' },
  ]);
  const [availablePool, setAvailablePool] = useState<Player[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectionPhase, setSelectionPhase] = useState<'waiting' | 'toss' | 'selecting' | 'completed'>('waiting');

  useEffect(() => {
    // Initialize available players only once
    if (availablePool.length === 0) {
      setAvailablePool(availablePlayers);
    }
    
    // Setup socket connection for captain communication
    const newSocket = io('http://localhost:5000');
    
    newSocket.on('connect', () => {
      setSocket(newSocket);
      newSocket.emit('join-captain-room', { gameId, userEmail });
    });

    newSocket.on('captain-assigned', (data) => {
      console.log('Captain assigned:', data);
      setCaptainRole(data.role);
      setIsCaptain(true);
      const updatedTeams = [...teams];
      if (data.role === 'captain1') {
        updatedTeams[0].captain = userEmail;
      } else {
        updatedTeams[1].captain = userEmail;
      }
      setTeams(updatedTeams);
      toast({
        title: 'Captain Role Assigned',
        description: `You are now ${data.role === 'captain1' ? 'Team Alpha' : 'Team Beta'} captain!`
      });
    });
    
    newSocket.on('both-captains-ready', () => {
      console.log('Both captains ready');
      setSelectionPhase('toss');
    });

    newSocket.on('toss-result', (data) => {
      setCurrentTurn(data.winner);
      setSelectionPhase('selecting');
      toast({
        title: 'Coin Toss Result',
        description: `${data.winner === 'captain1' ? 'Team Alpha' : 'Team Beta'} captain picks first!`
      });
    });

    newSocket.on('player-selected', (data) => {
      const { playerId, team, nextTurn } = data;
      console.log('Player selected event:', data);
      
      setAvailablePool(prev => {
        const player = prev.find(p => p.id === playerId);
        if (player) {
          const newPool = prev.filter(p => p.id !== playerId);
          
          // Update teams
          setTeams(teamsPrev => {
            const updated = [...teamsPrev];
            updated[team].players.push(player);
            return updated;
          });
          
          // Check if all players picked
          if (newPool.length === 0) {
            setSelectionPhase('completed');
          }
          
          return newPool;
        }
        return prev;
      });
      
      setCurrentTurn(nextTurn);
    });

    newSocket.on('captain-message', (data) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: data.sender,
        message: data.message,
        timestamp: new Date()
      }]);
    });

    newSocket.on('selection-completed', () => {
      setSelectionPhase('completed');
    });

    return () => {
      newSocket.disconnect();
    };
  }, [gameId, userEmail]);

  useEffect(() => {
    onTeamsUpdate(teams);
  }, [teams, onTeamsUpdate]);

  const handleBecomeCaptain = () => {
    console.log('Requesting captain role', { socket: !!socket, gameId, userEmail });
    if (socket && socket.connected) {
      console.log('Emitting request-captain event');
      socket.emit('request-captain', { gameId, userEmail });
    } else {
      console.error('Socket not connected or not ready');
      toast({
        title: 'Connection Error',
        description: 'Please wait for connection to establish',
        variant: 'destructive'
      });
    }
  };

  const handleCoinToss = () => {
    if (socket && captainRole === 'captain1') {
      socket.emit('coin-toss', { gameId });
      setSelectionPhase('toss');
    }
  };

  const handlePlayerSelect = (player: Player) => {
    console.log('Player select attempt:', { 
      socket: !!socket, 
      isCaptain, 
      currentTurn, 
      captainRole, 
      selectionPhase 
    });
    if (socket && isCaptain && currentTurn === captainRole && selectionPhase === 'selecting') {
      const teamIndex = captainRole === 'captain1' ? 0 : 1;
      console.log('Selecting player:', player.name, 'for team:', teamIndex);
      socket.emit('select-player', { 
        gameId, 
        playerId: player.id, 
        team: teamIndex,
        captain: captainRole 
      });
    }
  };

  const handleSendMessage = () => {
    if (socket && newMessage.trim() && isCaptain) {
      socket.emit('captain-message', {
        gameId,
        sender: userEmail,
        message: newMessage.trim()
      });
      setNewMessage('');
    }
  };

  const isMyTurn = currentTurn === captainRole;

  return (
    <div className="space-y-6">
      {/* Captain Status */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            <span className="font-semibold">Captain Status</span>
          </div>
          {!isCaptain ? (
            <Button onClick={handleBecomeCaptain} className="btn-action">
              Become Captain
            </Button>
          ) : (
            <Badge variant="default">
              {captainRole === 'captain1' ? 'Team Alpha Captain' : 'Team Beta Captain'}
            </Badge>
          )}
        </div>
      </Card>

      {/* Selection Phase */}
      {isCaptain && (
        <Card className="p-4">
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Team Selection</span>
            </h3>
            
            {selectionPhase === 'waiting' && (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">Waiting for both captains...</p>
              </div>
            )}

            {selectionPhase === 'toss' && (
              <div className="text-center py-4">
                {captainRole === 'captain1' ? (
                  <Button onClick={handleCoinToss} className="btn-action">
                    <Shuffle className="w-4 h-4 mr-2" />
                    Flip Coin
                  </Button>
                ) : (
                  <p className="text-muted-foreground">Waiting for Team Alpha captain to flip coin...</p>
                )}
              </div>
            )}

            {selectionPhase === 'selecting' && (
              <div className="space-y-2">
                <div className="text-center">
                  {isMyTurn ? (
                    <Badge variant="default">Your Turn to Pick</Badge>
                  ) : (
                    <Badge variant="secondary">Waiting for other captain</Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Available Players */}
        <div className="lg:col-span-2">
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Available Players ({availablePool.length})</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {availablePool.map((player) => (
                <div
                  key={player.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    isMyTurn && isCaptain && selectionPhase === 'selecting'
                      ? 'hover:bg-primary/10 border-primary/20'
                      : 'border-border'
                  }`}
                  onClick={() => handlePlayerSelect(player)}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>
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
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Captain Chat */}
        {isCaptain && (
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center space-x-2">
              <MessageCircle className="w-5 h-5" />
              <span>Captain Chat</span>
            </h3>
            
            <div className="space-y-4">
              <div className="h-48 overflow-y-auto space-y-2 border rounded p-2">
                {messages.map((msg) => (
                  <div key={msg.id} className="text-sm">
                    <span className="font-semibold text-primary">
                      {msg.sender === userEmail ? 'You' : 'Other Captain'}:
                    </span>
                    <span className="ml-2">{msg.message}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Message other captain..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button onClick={handleSendMessage} size="sm">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Teams Display */}
      <div className="grid gap-6 md:grid-cols-2">
        {teams.map((team, index) => (
          <Card key={index} className="p-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${team.color}`}></div>
                <h4 className="font-semibold">{team.name}</h4>
                <Badge variant="secondary">{team.players.length} players</Badge>
                {team.captain && (
                  <Crown className="w-4 h-4 text-yellow-500" />
                )}
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
        ))}
      </div>

      {/* Go Live Button */}
      {selectionPhase === 'completed' && (
        <div className="text-center">
          <Button onClick={onGoLive} className="btn-action">
            Go Live with Selected Teams
          </Button>
        </div>
      )}
    </div>
  );
};

export default CaptainTeamSelection;