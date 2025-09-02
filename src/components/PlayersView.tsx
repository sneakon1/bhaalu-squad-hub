import React, { useState } from 'react';
import { Search, Filter, Users, Trophy, LogIn, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PlayerCard from './PlayerCard';

interface Player {
  id: string;
  name: string;
  email: string;
  position: string;
  favoritePlayer: string;
  avatar?: string;
  rating: number;
  totalRatings: number;
  isOnline: boolean;
}

interface PlayersViewProps {
  onTabChange?: (tab: string) => void;
}

const PlayersView = ({ onTabChange }: PlayersViewProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('all');
  const [sortBy, setSortBy] = useState('rating');

  const [players, setPlayers] = useState<Player[]>([]);
  const userEmail = localStorage.getItem('userEmail');

  React.useEffect(() => {
    const fetchPlayersWithRatings = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.log('No auth token found');
        return;
      }
      
      try {
        const res = await fetch('https://bhaalu-squad-hub.onrender.com/api/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!res.ok) {
          console.error('Profile fetch failed:', res.status, res.statusText);
          return;
        }
        
        const data = await res.json();
        
        if (Array.isArray(data)) {
          const playersWithRatings = await Promise.all(
            data.map(async (p: any) => {
              try {
                const ratingRes = await fetch(`https://bhaalu-squad-hub.onrender.com/games/player-ratings/${encodeURIComponent(p.name)}`);
                const ratingData = await ratingRes.json();
                console.log(`Ratings for ${p.name}:`, ratingData);
                
                return {
                  id: p._id,
                  name: p.name,
                  email: p.email,
                  position: p.preferredPosition || '',
                  favoritePlayer: p.favPlayer || '',
                  avatar: p.profilePicture || '',
                  rating: ratingData.averageRating || 0,
                  totalRatings: ratingData.totalRatings || 0,
                  isOnline: p.availableThisWeek || false,
                };
              } catch (err) {
                return {
                  id: p._id,
                  name: p.name,
                  email: p.email,
                  position: p.preferredPosition || '',
                  favoritePlayer: p.favPlayer || '',
                  avatar: p.profilePicture || '',
                  rating: 0,
                  totalRatings: 0,
                  isOnline: p.availableThisWeek || false,
                };
              }
            })
          );
          setPlayers(playersWithRatings);
        }
      } catch (err) {
        console.error('Failed to fetch players:', err);
      }
    };
    
    fetchPlayersWithRatings();
  }, []);

  // Rating function removed - only match ratings are displayed

  const filteredPlayers = players
    .filter(player => {
      const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           player.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           player.favoritePlayer.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPosition = positionFilter === 'all' || 
                             player.position.toLowerCase() === positionFilter.toLowerCase();
      return matchesSearch && matchesPosition;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
        default:
          return b.rating - a.rating;
        case 'position':
          return a.position.localeCompare(b.position);
        case 'name':
          return a.name.localeCompare(b.name);
      }
    });

  const positions = ['All', 'Striker', 'Midfielder', 'Defender', 'Goalkeeper'];
  const onlinePlayers = players.filter(p => p.isOnline).length;

  // Show login prompt if user is not logged in
  if (!userEmail) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-primary to-primary-light rounded-xl">
              <Users className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-poppins font-bold text-foreground">
                Squad Players
              </h1>
              <p className="text-muted-foreground">
                View and rate your teammates
              </p>
            </div>
          </div>
        </div>
        
        <div className="text-center py-12">
          <LogIn className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Please log in to view players
          </h3>
          <p className="text-muted-foreground mb-6">
            You need to be logged in to see squad members and rate players
          </p>
          <Button 
            onClick={() => onTabChange?.('auth')}
            className="btn-action"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Log In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-primary to-primary-light rounded-xl">
            <Trophy className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-poppins font-bold text-foreground">
              Player Leaderboard
            </h1>
            <p className="text-muted-foreground">
              {players.length} total players • Ranked by performance
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-card rounded-xl p-6 border border-border space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Position Filter */}
          <Select value={positionFilter} onValueChange={setPositionFilter}>
            <SelectTrigger className="w-full md:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Position" />
            </SelectTrigger>
            <SelectContent>
              {positions.map((position) => (
                <SelectItem key={position} value={position.toLowerCase()}>
                  {position}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort By */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-48">
              <Trophy className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
              <SelectItem value="position">Position</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-muted-foreground">
          Showing {filteredPlayers.length} of {players.length} players
        </div>
      </div>

      {/* Leaderboard */}
      <div className="space-y-4">
        {filteredPlayers.map((player, index) => (
          <div key={player.id} className="animate-slide-up">
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center space-x-4">
                {/* Rank */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                  index === 0 ? 'bg-yellow-500 text-white' :
                  index === 1 ? 'bg-gray-400 text-white' :
                  index === 2 ? 'bg-amber-600 text-white' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {index + 1}
                </div>
                
                {/* Player Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-semibold text-lg">{player.name}</h3>
                    <span className="text-sm text-muted-foreground">{player.position}</span>
                    {player.isOnline && (
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{player.favoritePlayer}</p>
                </div>
                
                {/* Rating */}
                <div className="text-center">
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= Math.floor(player.rating)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-sm font-semibold">{player.rating.toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground">({player.totalRatings} match ratings)</div>
                </div>
                
                {/* Match Ratings Only - No Rating Button */}
              </div>
            </Card>
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredPlayers.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No players found
          </h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filter criteria
          </p>
          <Button 
            onClick={() => {
              setSearchTerm('');
              setPositionFilter('all');
            }}
            className="btn-field mt-4"
          >
            Reset Filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default PlayersView;