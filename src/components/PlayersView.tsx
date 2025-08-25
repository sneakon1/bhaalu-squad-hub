import React, { useState } from 'react';
import { Search, Filter, Users, Trophy, LogIn } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
  const [sortBy, setSortBy] = useState('name');

  const [players, setPlayers] = useState<Player[]>([]);
  const userEmail = localStorage.getItem('userEmail');

  React.useEffect(() => {
    const token = localStorage.getItem('authToken');
    fetch('http://localhost:5000/api/profile', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPlayers(data.map((p: any) => ({
            id: p._id,
            name: p.name,
            email: p.email,
            position: p.preferredPosition || '',
            favoritePlayer: p.favPlayer || '',
            avatar: p.profilePicture || '',
            rating: p.rating || 0,
            totalRatings: p.totalRatings || 0,
            isOnline: p.availableThisWeek || false,
          })));
        }
      });
  }, []);

  const handleRatePlayer = async (playerId: string, rating: number) => {
    const token = localStorage.getItem('authToken');
    const player = players.find(p => p.id === playerId);
    if (!player || !token) return;
    
    try {
      const res = await fetch(`http://localhost:5000/api/profile/${player.email}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating })
      });
      
      const data = await res.json();
      if (res.ok) {
        // Update local state with new rating
        setPlayers(prev => prev.map(p => 
          p.id === playerId 
            ? { ...p, rating: data.rating, totalRatings: data.totalRatings }
            : p
        ));
      }
    } catch (err) {
      console.error('Failed to rate player:', err);
    }
  };

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
          return b.rating - a.rating;
        case 'position':
          return a.position.localeCompare(b.position);
        case 'name':
        default:
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
            <Users className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-poppins font-bold text-foreground">
              Squad Players
            </h1>
            <p className="text-muted-foreground">
              {players.length} total players • {onlinePlayers} online
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

      {/* Players Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredPlayers.map((player) => (
          <div key={player.id} className="animate-slide-up">
            <PlayerCard 
              player={player} 
              canRate={player.email !== localStorage.getItem('userEmail')}
              onRate={handleRatePlayer}
            />
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