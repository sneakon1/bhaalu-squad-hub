import { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Clock, CheckCircle, XCircle, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import LiveGameView from './LiveGameView';
import heroImage from '@/assets/football-hero.jpg';
import footballSunset from '@/assets/football-sunset.jpg';
import footballAction from '@/assets/football-action.jpg';
import footballStadium from '@/assets/football-stadium.jpg';
import footballTraining from '@/assets/football-training.jpg';

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

const Dashboard = () => {
  const heroImages = [heroImage, footballSunset, footballAction, footballStadium, footballTraining];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedLiveGame, setSelectedLiveGame] = useState<LiveGame | null>(null);
  const [isLiveGameOpen, setIsLiveGameOpen] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [heroImages.length]);

  const [liveGames] = useState<LiveGame[]>([
    {
      id: 'live1',
      homeTeam: 'Bhaalu Squad',
      awayTeam: 'Thunder FC',
      homeScore: 2,
      awayScore: 1,
      matchTime: '67\'',
      status: 'live',
      venue: 'Central Stadium'
    },
    {
      id: 'live2',
      homeTeam: 'Eagles United',
      awayTeam: 'Lightning FC',
      homeScore: 0,
      awayScore: 0,
      matchTime: 'HT',
      status: 'halftime',
      venue: 'Sports Arena'
    }
  ]);

  const [games, setGames] = useState<Game[]>([
    {
      id: '1',
      title: 'Weekend Match vs Eagles',
      date: '2024-08-26',
      time: '10:00 AM',
      venue: 'Central Park Field',
      playersIn: 12,
      maxPlayers: 16,
      userStatus: null,
    },
    {
      id: '2',
      title: 'Practice Session',
      date: '2024-08-28',
      time: '6:00 PM',
      venue: 'Local Sports Complex',
      playersIn: 8,
      maxPlayers: 16,
      userStatus: 'in',
    },
    {
      id: '3',
      title: 'Championship Finals',
      date: '2024-09-01',
      time: '2:00 PM',
      venue: 'Stadium Arena',
      playersIn: 15,
      maxPlayers: 16,
      userStatus: 'out',
    },
  ]);

  const handlePollVote = (gameId: string, status: 'in' | 'out') => {
    setGames(prevGames =>
      prevGames.map(game => {
        if (game.id === gameId) {
          const wasIn = game.userStatus === 'in';
          const wasOut = game.userStatus === 'out';
          const isNowIn = status === 'in';
          
          let newPlayersIn = game.playersIn;
          
          if (wasIn && !isNowIn) {
            newPlayersIn -= 1;
          } else if (!wasIn && isNowIn) {
            newPlayersIn += 1;
          }
          
          return {
            ...game,
            userStatus: status,
            playersIn: Math.max(0, Math.min(newPlayersIn, game.maxPlayers)),
          };
        }
        return game;
      })
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleLiveGameClick = (game: LiveGame) => {
    setSelectedLiveGame(game);
    setIsLiveGameOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="relative h-64">
          {/* Background Images with Smooth Transitions */}
          {heroImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ${
                index === currentImageIndex ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ backgroundImage: `url(${image})` }}
            />
          ))}
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary-light/80"></div>
          
          {/* Content */}
          <div className="relative h-full flex items-center justify-center text-center">
            <div className="animate-fade-in">
              <h1 className="text-4xl md:text-5xl font-poppins font-bold text-primary-foreground mb-4">
                Welcome to Bhaalu Squad
              </h1>
              <p className="text-xl text-primary-foreground/90 max-w-2xl">
                Your football team's central hub for games, polls, and team coordination
              </p>
            </div>
          </div>
          
          {/* Slide Indicators */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {heroImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentImageIndex 
                    ? 'bg-primary-foreground w-6' 
                    : 'bg-primary-foreground/50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Live Games Section */}
      {liveGames.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-poppins font-bold text-foreground flex items-center space-x-2">
              <Radio className="w-6 h-6 text-red-500" />
              <span>Live Games</span>
            </h2>
            <div className="text-sm text-muted-foreground">
              {liveGames.length} live matches
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {liveGames.map((game) => (
              <Card 
                key={game.id} 
                className="card-field animate-slide-up p-6 cursor-pointer hover:scale-105 transition-transform duration-200" 
                onClick={() => handleLiveGameClick(game)}
              >
                <div className="space-y-4">
                  {/* Live Indicator */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-red-500 font-semibold text-sm">LIVE</span>
                    </div>
                    <div className="text-sm text-muted-foreground">{game.matchTime}</div>
                  </div>

                  {/* Teams and Score */}
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-4 mb-2">
                      <div className="text-right flex-1">
                        <div className="font-semibold text-foreground">{game.homeTeam}</div>
                        <div className="text-xs text-muted-foreground">Home</div>
                      </div>
                      
                      <div className="text-2xl font-bold text-primary px-4">
                        {game.homeScore} - {game.awayScore}
                      </div>
                      
                      <div className="text-left flex-1">
                        <div className="font-semibold text-foreground">{game.awayTeam}</div>
                        <div className="text-xs text-muted-foreground">Away</div>
                      </div>
                    </div>
                  </div>

                  {/* Match Info */}
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{game.venue}</span>
                    </div>
                    <div className="mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        game.status === 'live' 
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                          : game.status === 'halftime'
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
                      }`}>
                        {game.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Click to Watch */}
                  <div className="text-center text-sm text-primary font-medium">
                    Click to watch live →
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Games Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-poppins font-bold text-foreground">
            Upcoming Games
          </h2>
          <div className="text-sm text-muted-foreground">
            {games.length} scheduled games
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <Card key={game.id} className="card-field animate-slide-up p-6">
              <div className="space-y-4">
                {/* Game Header */}
                <div>
                  <h3 className="font-poppins font-semibold text-lg text-foreground mb-2">
                    {game.title}
                  </h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(game.date)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>{game.time}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>{game.venue}</span>
                    </div>
                  </div>
                </div>

                {/* Players Status */}
                <div className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">
                      {game.playersIn}/{game.maxPlayers} Players In
                    </span>
                  </div>
                  <div className="w-16 bg-border rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(game.playersIn / game.maxPlayers) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Poll Buttons */}
                <div className="flex space-x-3">
                  <Button
                    onClick={() => handlePollVote(game.id, 'in')}
                    className={`flex-1 poll-in ${
                      game.userStatus === 'in' 
                        ? 'ring-2 ring-accent ring-offset-2' 
                        : ''
                    }`}
                    size="sm"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    I'm In
                  </Button>
                  <Button
                    onClick={() => handlePollVote(game.id, 'out')}
                    className={`flex-1 poll-out ${
                      game.userStatus === 'out' 
                        ? 'ring-2 ring-destructive ring-offset-2' 
                        : ''
                    }`}
                    size="sm"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    I'm Out
                  </Button>
                </div>

                {/* Status Indicator */}
                {game.userStatus && (
                  <div className={`text-center text-sm font-medium ${
                    game.userStatus === 'in' 
                      ? 'text-accent' 
                      : 'text-destructive'
                  }`}>
                    You've marked yourself as {game.userStatus === 'in' ? 'IN' : 'OUT'}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-player text-center">
          <div className="text-2xl font-poppins font-bold text-primary">12</div>
          <div className="text-sm text-muted-foreground">Active Players</div>
        </Card>
        <Card className="card-player text-center">
          <div className="text-2xl font-poppins font-bold text-secondary">3</div>
          <div className="text-sm text-muted-foreground">Games This Month</div>
        </Card>
        <Card className="card-player text-center">
          <div className="text-2xl font-poppins font-bold text-accent">85%</div>
          <div className="text-sm text-muted-foreground">Attendance Rate</div>
        </Card>
        <Card className="card-player text-center">
          <div className="text-2xl font-poppins font-bold text-foreground">4.2</div>
          <div className="text-sm text-muted-foreground">Team Rating</div>
        </Card>
      </div>

      {/* Live Game Modal */}
      <LiveGameView
        game={selectedLiveGame}
        isOpen={isLiveGameOpen}
        onClose={() => setIsLiveGameOpen(false)}
      />
    </div>
  );
};

export default Dashboard;