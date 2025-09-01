import { useState, useEffect } from 'react';
import { X, Play, BarChart3, Users, Target, ArrowLeft, Clock, MapPin } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PastMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  date: string;
  venue: string;
  result: 'win' | 'loss' | 'draw';
}

interface PastMatchViewProps {
  match: PastMatch | null;
  isOpen: boolean;
  onClose: () => void;
}

const PastMatchView = ({ match, isOpen, onClose }: PastMatchViewProps) => {
  const [activeTab, setActiveTab] = useState('highlights');
  const [gameData, setGameData] = useState<any>(null);

  useEffect(() => {
    if (match && isOpen) {
      fetchGameData();
    }
  }, [match, isOpen]);

  const fetchGameData = async () => {
    try {
      const res = await fetch(`http://localhost:5000/games/${match.id}`);
      const data = await res.json();
      if (res.ok) {
        setGameData(data);
      }
    } catch (err) {
      console.error('Failed to fetch game data:', err);
    }
  };

  if (!match) return null;

  const getResultColor = (result: string) => {
    switch (result) {
      case 'win':
        return 'text-accent';
      case 'loss':
        return 'text-destructive';
      case 'draw':
        return 'text-secondary';
      default:
        return 'text-muted-foreground';
    }
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'win':
        return 'bg-accent/10 text-accent border-accent/20';
      case 'loss':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'draw':
        return 'bg-secondary/10 text-secondary border-secondary/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  // Mock data for demonstration
  const highlights = [
    { time: '15\'', event: 'Goal', player: 'Arjun Sharma', team: 'home' },
    { time: '32\'', event: 'Yellow Card', player: 'Vikram Singh', team: 'home' },
    { time: '58\'', event: 'Goal', player: 'Opposition Player', team: 'away' },
    { time: '73\'', event: 'Goal', player: 'Deepak Yadav', team: 'home' },
  ];

  const stats = {
    possession: { home: 62, away: 38 },
    shots: { home: 12, away: 8 },
    shotsOnTarget: { home: 6, away: 3 },
    corners: { home: 7, away: 4 },
    fouls: { home: 11, away: 15 },
    yellowCards: { home: 2, away: 3 },
    redCards: { home: 0, away: 1 }
  };

  const players = {
    home: [
      { name: 'Amit Gupta', position: 'GK', rating: 8.5 },
      { name: 'Rahul Patel', position: 'DF', rating: 7.8 },
      { name: 'Manish Verma', position: 'DF', rating: 7.2 },
      { name: 'Vikram Singh', position: 'MF', rating: 8.0 },
      { name: 'Sanjay Kumar', position: 'MF', rating: 7.5 },
      { name: 'Arjun Sharma', position: 'FW', rating: 9.2 },
      { name: 'Deepak Yadav', position: 'FW', rating: 8.8 }
    ],
    away: [
      { name: 'Opposition GK', position: 'GK', rating: 6.5 },
      { name: 'Opposition DF1', position: 'DF', rating: 6.8 },
      { name: 'Opposition DF2', position: 'DF', rating: 6.2 },
      { name: 'Opposition MF1', position: 'MF', rating: 7.0 },
      { name: 'Opposition MF2', position: 'MF', rating: 6.5 },
      { name: 'Opposition FW1', position: 'FW', rating: 7.5 },
      { name: 'Opposition FW2', position: 'FW', rating: 6.8 }
    ]
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full max-h-[90vh] p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="hover:bg-muted -ml-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getResultBadge(match.result)}`}>
                {match.result.toUpperCase()}
              </span>
              <h2 className="text-lg font-semibold">
                {match.homeTeam} vs {match.awayTeam}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Match Summary */}
          <div className="p-6 border-b bg-muted/30">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-6 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{match.homeTeam}</div>
                  <div className="text-sm text-muted-foreground">Home</div>
                </div>
                
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getResultColor(match.result)}`}>
                    {match.homeScore} - {match.awayScore}
                  </div>
                  <div className="text-sm text-muted-foreground">Final Score</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{match.awayTeam}</div>
                  <div className="text-sm text-muted-foreground">Away</div>
                </div>
              </div>

              <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>{new Date(match.date).toLocaleDateString('en-US', { 
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>{match.venue}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content Tabs */}
          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2 mx-6 mt-4">
                <TabsTrigger value="highlights">Highlights</TabsTrigger>
                <TabsTrigger value="players">Players</TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto p-6 min-h-0">
                <TabsContent value="highlights" className="space-y-6 mt-0">
                  {/* Video Player Placeholder */}
                  <Card className="p-6">
                    <div className="aspect-video bg-black rounded-lg flex items-center justify-center mb-4">
                      <div className="text-center text-white/70">
                        <Play className="w-16 h-16 mx-auto mb-4" />
                        <div className="text-xl mb-2">Match Highlights</div>
                        <div className="text-sm opacity-70">Video highlights would be displayed here</div>
                      </div>
                    </div>
                    <Button className="w-full">
                      <Play className="w-4 h-4 mr-2" />
                      Watch Full Highlights
                    </Button>
                  </Card>

                  {/* Key Events */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Key Events</h3>
                    <div className="space-y-3">
                      {highlights.map((event, index) => (
                        <div key={index} className="flex items-center space-x-4 p-3 bg-muted/30 rounded-lg">
                          <div className="text-sm font-mono text-muted-foreground min-w-[3rem]">
                            {event.time}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{event.event}</div>
                            <div className="text-sm text-muted-foreground">{event.player}</div>
                          </div>
                          <div className={`text-xs px-2 py-1 rounded ${
                            event.team === 'home' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'
                          }`}>
                            {event.team === 'home' ? match.homeTeam : match.awayTeam}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </TabsContent>



                <TabsContent value="players" className="space-y-6 mt-0">
                  {gameData ? (
                    <div className="grid gap-6 md:grid-cols-2">
                      <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">{gameData.teams?.teamA?.name || 'Team A'}</h3>
                        <div className="space-y-3">
                          {gameData.teams?.teamA?.players?.map((playerName: string, index: number) => {
                            const goals = gameData.goals?.filter((goal: any) => goal.scorer === playerName).length || 0;
                            return (
                              <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                <div>
                                  <div className="font-medium">{playerName}</div>
                                  <div className="text-sm text-muted-foreground">{goals} goals</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </Card>

                      <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">{gameData.teams?.teamB?.name || 'Team B'}</h3>
                        <div className="space-y-3">
                          {gameData.teams?.teamB?.players?.map((playerName: string, index: number) => {
                            const goals = gameData.goals?.filter((goal: any) => goal.scorer === playerName).length || 0;
                            return (
                              <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                <div>
                                  <div className="font-medium">{playerName}</div>
                                  <div className="text-sm text-muted-foreground">{goals} goals</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </Card>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading player data...
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PastMatchView;