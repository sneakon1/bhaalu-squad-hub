import { useState, useEffect } from 'react';
import { Clock, Target, Activity, Users, MessageSquare } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface MatchEvent {
  id: string;
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution';
  time: string;
  player: string;
  team: 'home' | 'away';
  description: string;
}

interface MatchStats {
  possession: { home: number; away: number };
  shots: { home: number; away: number };
  shotsOnTarget: { home: number; away: number };
  corners: { home: number; away: number };
  fouls: { home: number; away: number };
}

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

interface LiveMatchCardProps {
  game: LiveGame;
}

const LiveMatchCard = ({ game }: LiveMatchCardProps) => {
  const [events, setEvents] = useState<MatchEvent[]>([
    {
      id: '1',
      type: 'goal',
      time: '23\'',
      player: 'Smith J.',
      team: 'home',
      description: 'Goal! Beautiful strike from outside the box'
    },
    {
      id: '2',
      type: 'yellow_card',
      time: '31\'',
      player: 'Johnson M.',
      team: 'away',
      description: 'Yellow card for unsporting behavior'
    }
  ]);

  const [stats, setStats] = useState<MatchStats>({
    possession: { home: 58, away: 42 },
    shots: { home: 7, away: 4 },
    shotsOnTarget: { home: 3, away: 2 },
    corners: { home: 4, away: 2 },
    fouls: { home: 8, away: 12 }
  });

  const [commentary, setCommentary] = useState([
    "45+2' - The referee adds 2 minutes of stoppage time",
    "44' - Great save by the goalkeeper to deny a certain goal",
    "41' - Corner kick for the home team after a deflected shot"
  ]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Update possession slightly
      setStats(prev => ({
        ...prev,
        possession: {
          home: Math.max(35, Math.min(65, prev.possession.home + (Math.random() - 0.5) * 4)),
          away: Math.max(35, Math.min(65, prev.possession.away + (Math.random() - 0.5) * 4))
        }
      }));

      // Occasionally add new commentary
      if (Math.random() < 0.3) {
        const newCommentary = [
          "The crowd is getting behind their team!",
          "Excellent passing move by the midfield",
          "The pace of the game is picking up",
          "Both teams fighting hard for possession",
          "Great defensive work to clear the danger"
        ];
        
        setCommentary(prev => [
          `${game.matchTime} - ${newCommentary[Math.floor(Math.random() * newCommentary.length)]}`,
          ...prev.slice(0, 4)
        ]);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [game.matchTime]);

  const getEventIcon = (type: MatchEvent['type']) => {
    switch (type) {
      case 'goal':
        return '⚽';
      case 'yellow_card':
        return '🟨';
      case 'red_card':
        return '🟥';
      case 'substitution':
        return '🔄';
      default:
        return '•';
    }
  };

  return (
    <Card className="p-6 space-y-6">
      {/* Match Header */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-6 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{game.homeTeam}</div>
            <div className="text-sm text-muted-foreground">Home</div>
          </div>
          
          <div className="text-center">
            <div className="text-4xl font-bold text-primary">
              {game.homeScore} - {game.awayScore}
            </div>
            <div className="text-sm text-muted-foreground flex items-center justify-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{game.matchTime}</span>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{game.awayTeam}</div>
            <div className="text-sm text-muted-foreground">Away</div>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          {game.venue} • {game.status.toUpperCase()}
        </div>
      </div>

      {/* Match Events */}
      <div>
        <h3 className="font-semibold text-foreground mb-3 flex items-center space-x-2">
          <Activity className="w-4 h-4" />
          <span>Match Events</span>
        </h3>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {events.map((event) => (
            <div key={event.id} className="flex items-start space-x-3 text-sm">
              <span className="text-muted-foreground font-mono">{event.time}</span>
              <span className="text-lg">{getEventIcon(event.type)}</span>
              <div>
                <div className="font-medium">{event.player}</div>
                <div className="text-muted-foreground text-xs">{event.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default LiveMatchCard;