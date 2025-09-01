import { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Clock, CheckCircle, XCircle, Radio, Trophy, Target, Star } from 'lucide-react';
import { io } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import LiveGameView from './LiveGameView';
import PastMatchView from './PastMatchView';
import GameDetailsView from './GameDetailsView';
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
  const [selectedPastMatch, setSelectedPastMatch] = useState<PastMatch | null>(null);
  const [isPastMatchOpen, setIsPastMatchOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isGameDetailsOpen, setIsGameDetailsOpen] = useState(false);
  
  const userEmail = localStorage.getItem('userEmail');
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [heroImages.length]);

  const [pastMatches, setPastMatches] = useState<PastMatch[]>([]);

  const [liveGames, setLiveGames] = useState<LiveGame[]>([]);

  const [games, setGames] = useState<Game[]>([]);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [ratingGameId, setRatingGameId] = useState<string | null>(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const res = await fetch('http://localhost:5000/games/upcoming');
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch games');
        setGames(data
          .filter((g: any) => g.status !== 'live') // Exclude live games
          .map((g: any) => {
            const playersIn = g.players ? g.players.filter((p: any) => p.status === 'in').length : 0;
            const userVote = g.players ? g.players.find((p: any) => p.email === userEmail) : null;
            
            return {
              id: g._id,
              title: g.name,
              date: g.date,
              time: new Date(g.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              venue: g.location,
              playersIn,
              maxPlayers: g.maxPlayers || 16,
              userStatus: userVote ? userVote.status : null,
            };
          }));
      } catch (err) {
        setGames([]);
      }
    };

    const fetchLiveGames = async () => {
      try {
        const res = await fetch('http://localhost:5000/games/live');
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch live games');
        setLiveGames(data.map((g: any) => ({
          id: g._id,
          homeTeam: g.teams?.teamA?.name || 'Team A',
          awayTeam: g.teams?.teamB?.name || 'Team B',
          homeScore: g.teams?.teamA?.score || 0,
          awayScore: g.teams?.teamB?.score || 0,
          matchTime: '0\'',
          status: 'live' as const,
          venue: g.location
        })));
      } catch (err) {
        setLiveGames([]);
      }
    };

    const fetchPastMatches = async () => {
      try {
        const res = await fetch('http://localhost:5000/games/completed');
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch completed games');
        setPastMatches(data.map((g: any) => {
          const homeScore = g.teams?.teamA?.score || 0;
          const awayScore = g.teams?.teamB?.score || 0;
          let result: 'win' | 'loss' | 'draw' = 'draw';
          if (homeScore > awayScore) result = 'win';
          else if (homeScore < awayScore) result = 'loss';
          
          return {
            id: g._id,
            homeTeam: g.teams?.teamA?.name || 'Team A',
            awayTeam: g.teams?.teamB?.name || 'Team B',
            homeScore,
            awayScore,
            date: g.date,
            venue: g.location,
            result
          };
        }));
      } catch (err) {
        setPastMatches([]);
      }
    };

    fetchGames();
    fetchLiveGames();
    fetchPastMatches();
  }, [userEmail]);
  
  // Poll for match end notifications
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:5000/games/check-rating-needed/${userEmail}`);
        const data = await res.json();
        if (res.ok && data.needsRating) {
          setRatingGameId(data.gameId);
          setShowRatingDialog(true);
        }
      } catch (err) {
        // Ignore polling errors
      }
    }, 2000); // Check every 2 seconds
    
    return () => clearInterval(interval);
  }, [userEmail]);

  const handlePollVote = async (gameId: string, status: 'in' | 'out') => {
    if (!userEmail) return;
    
    try {
      const res = await fetch(`http://localhost:5000/games/${gameId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, email: userEmail })
      });
      
      const data = await res.json();
      if (res.ok) {
        // Update local state
        setGames(prevGames =>
          prevGames.map(game => 
            game.id === gameId 
              ? { ...game, userStatus: status, playersIn: data.playersIn }
              : game
          )
        );
      }
    } catch (err) {
      console.error('Failed to vote:', err);
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

  const handleLiveGameClick = (game: LiveGame) => {
    setSelectedLiveGame(game);
    setIsLiveGameOpen(true);
  };

  const handleLiveGameUpdate = () => {
    // Refresh live games and past matches data
    const fetchLiveGames = async () => {
      try {
        const res = await fetch('http://localhost:5000/games/live');
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch live games');
        setLiveGames(data.map((g: any) => ({
          id: g._id,
          homeTeam: g.teams?.teamA?.name || 'Team A',
          awayTeam: g.teams?.teamB?.name || 'Team B',
          homeScore: g.teams?.teamA?.score || 0,
          awayScore: g.teams?.teamB?.score || 0,
          matchTime: '0\'',
          status: 'live' as const,
          venue: g.location
        })));
      } catch (err) {
        setLiveGames([]);
      }
    };
    
    const fetchPastMatches = async () => {
      try {
        const res = await fetch('http://localhost:5000/games/completed');
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch completed games');
        setPastMatches(data.map((g: any) => {
          const homeScore = g.teams?.teamA?.score || 0;
          const awayScore = g.teams?.teamB?.score || 0;
          let result: 'win' | 'loss' | 'draw' = 'draw';
          if (homeScore > awayScore) result = 'win';
          else if (homeScore < awayScore) result = 'loss';
          
          return {
            id: g._id,
            homeTeam: g.teams?.teamA?.name || 'Team A',
            awayTeam: g.teams?.teamB?.name || 'Team B',
            homeScore,
            awayScore,
            date: g.date,
            venue: g.location,
            result
          };
        }));
      } catch (err) {
        setPastMatches([]);
      }
    };
    
    fetchLiveGames();
    fetchPastMatches();
  };

  const handlePastMatchClick = (match: PastMatch) => {
    setSelectedPastMatch(match);
    setIsPastMatchOpen(true);
  };

  const handleGameClick = (game: Game) => {
    setSelectedGame(game);
    setIsGameDetailsOpen(true);
  };

  // Refresh games when modal closes (to update live games)
  const handleGameDetailsClose = () => {
    setIsGameDetailsOpen(false);
    // Refresh both upcoming and live games
    window.location.reload();
  };

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
              <div className="mb-6">
                <img src="/src/assets/bhaalu_squadIcon.png" alt="Bhaalu Squad" className="w-24 h-24 mx-auto rounded-2xl mb-4" />
              </div>
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
            <Card 
              key={game.id} 
              className="card-field animate-slide-up p-6 cursor-pointer hover:scale-105 transition-transform duration-200"
              onClick={() => handleGameClick(game)}
            >
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
                <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
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
                  <div className="text-xs text-muted-foreground">
                    Click to see who's playing →
                  </div>
                </div>

                {/* Poll Buttons - Only show if logged in */}
                {userEmail ? (
                  <div className="flex space-x-3">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePollVote(game.id, 'in');
                      }}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePollVote(game.id, 'out');
                      }}
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
                ) : (
                  <div className="text-center py-2 text-muted-foreground text-sm">
                    Please log in to join games
                  </div>
                )}

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

                {/* Click to View Details */}
                <div className="text-center text-sm text-primary font-medium">
                  Click to view details →
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Past Matches Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-poppins font-bold text-foreground flex items-center space-x-2">
            <Trophy className="w-6 h-6 text-primary" />
            <span>Past Matches</span>
          </h2>
          <div className="text-sm text-muted-foreground">
            {pastMatches.length} recent matches
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pastMatches.map((match) => (
            <Card 
              key={match.id} 
              className="card-field animate-slide-up p-6 cursor-pointer hover:scale-105 transition-transform duration-200"
              onClick={() => handlePastMatchClick(match)}
            >
              <div className="space-y-4">
                {/* Result Badge */}
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getResultBadge(match.result)}`}>
                    {match.result.toUpperCase()}
                  </span>
                  <div className="text-sm text-muted-foreground">
                    {new Date(match.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>

                {/* Teams and Score */}
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-4 mb-2">
                    <div className="text-right flex-1">
                      <div className="font-semibold text-foreground">{match.homeTeam}</div>
                      <div className="text-xs text-muted-foreground">Home</div>
                    </div>
                    
                    <div className={`text-2xl font-bold px-4 ${getResultColor(match.result)}`}>
                      {match.homeScore} - {match.awayScore}
                    </div>
                    
                    <div className="text-left flex-1">
                      <div className="font-semibold text-foreground">{match.awayTeam}</div>
                      <div className="text-xs text-muted-foreground">Away</div>
                    </div>
                  </div>
                </div>

                {/* Match Info */}
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{match.venue}</span>
                  </div>
                </div>

                {/* Click to View */}
                <div className="text-center text-sm text-primary font-medium">
                  Click to view highlights →
                </div>
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
        onGameUpdate={handleLiveGameUpdate}
      />

      {/* Past Match Modal */}
      <PastMatchView
        match={selectedPastMatch}
        isOpen={isPastMatchOpen}
        onClose={() => setIsPastMatchOpen(false)}
      />

      {/* Game Details Modal */}
      <GameDetailsView
        game={selectedGame}
        isOpen={isGameDetailsOpen}
        onClose={handleGameDetailsClose}
      />
      
      {/* Global Rating Dialog */}
      {showRatingDialog && ratingGameId && (
        <RatingDialog 
          gameId={ratingGameId}
          onClose={() => {
            setShowRatingDialog(false);
            setRatingGameId(null);
          }}
        />
      )}
    </div>
  );
};

// Simple Rating Dialog Component
const RatingDialog = ({ gameId, onClose }: { gameId: string; onClose: () => void }) => {
  const [gameData, setGameData] = useState<any>(null);
  const [playerRatings, setPlayerRatings] = useState<{[key: string]: number}>({});
  const [currentUserName, setCurrentUserName] = useState<string>('');
  
  useEffect(() => {
    fetchGameData();
    fetchCurrentUserName();
  }, []);
  
  const fetchGameData = async () => {
    try {
      const res = await fetch(`http://localhost:5000/games/${gameId}`);
      const data = await res.json();
      if (res.ok) {
        setGameData(data);
      }
    } catch (err) {
      console.error('Failed to fetch game data:', err);
    }
  };
  
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
  
  const handleRatePlayer = (playerName: string, rating: number) => {
    setPlayerRatings(prev => ({ ...prev, [playerName]: rating }));
  };
  
  const submitRatings = async () => {
    try {
      const userEmail = localStorage.getItem('userEmail');
      const res = await fetch(`http://localhost:5000/games/${gameId}/rate-players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ratings: playerRatings, raterEmail: userEmail })
      });
      
      if (res.ok) {
        onClose();
      }
    } catch (err) {
      console.error('Failed to submit ratings:', err);
    }
  };
  
  if (!gameData) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card p-6 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
          <Star className="w-5 h-5" />
          <span>Rate Players Performance</span>
        </h2>
        
        <div className="space-y-4">
          {/* Team A Players */}
          {gameData.teams?.teamA?.players?.filter((player: string) => player !== currentUserName).map((player: string) => (
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
          
          {/* Team B Players */}
          {gameData.teams?.teamB?.players?.filter((player: string) => player !== currentUserName).map((player: string) => (
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
        
        <div className="flex space-x-2 mt-6">
          <Button onClick={submitRatings} className="flex-1">
            Submit Ratings
          </Button>
          <Button onClick={onClose} variant="outline">
            Skip
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;