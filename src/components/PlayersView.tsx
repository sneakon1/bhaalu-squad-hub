import { useState } from 'react';
import { Search, Filter, Users, Trophy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PlayerCard from './PlayerCard';

interface Player {
  id: string;
  name: string;
  position: string;
  favoritePlayer: string;
  avatar?: string;
  rating: number;
  totalRatings: number;
  isOnline: boolean;
}

const PlayersView = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  const [players] = useState<Player[]>([
    {
      id: '1',
      name: 'Arjun Sharma',
      position: 'Striker',
      favoritePlayer: 'Cristiano Ronaldo',
      rating: 4.3,
      totalRatings: 12,
      isOnline: true,
    },
    {
      id: '2',
      name: 'Vikram Singh',
      position: 'Midfielder',
      favoritePlayer: 'Kevin De Bruyne',
      rating: 4.1,
      totalRatings: 8,
      isOnline: false,
    },
    {
      id: '3',
      name: 'Rahul Patel',
      position: 'Defender',
      favoritePlayer: 'Virgil van Dijk',
      rating: 3.9,
      totalRatings: 15,
      isOnline: true,
    },
    {
      id: '4',
      name: 'Amit Gupta',
      position: 'Goalkeeper',
      favoritePlayer: 'Manuel Neuer',
      rating: 4.5,
      totalRatings: 9,
      isOnline: true,
    },
    {
      id: '5',
      name: 'Sanjay Kumar',
      position: 'Midfielder',
      favoritePlayer: 'Luka Modrić',
      rating: 4.0,
      totalRatings: 11,
      isOnline: false,
    },
    {
      id: '6',
      name: 'Deepak Yadav',
      position: 'Striker',
      favoritePlayer: 'Lionel Messi',
      rating: 4.2,
      totalRatings: 7,
      isOnline: true,
    },
    {
      id: '7',
      name: 'Manish Verma',
      position: 'Defender',
      favoritePlayer: 'Sergio Ramos',
      rating: 3.8,
      totalRatings: 13,
      isOnline: false,
    },
    {
      id: '8',
      name: 'Raj Malhotra',
      position: 'Midfielder',
      favoritePlayer: 'Paul Pogba',
      rating: 3.7,
      totalRatings: 6,
      isOnline: true,
    },
  ]);

  const handleRatePlayer = (playerId: string, rating: number) => {
    console.log(`Rating player ${playerId} with ${rating} stars`);
    // In a real app, this would update the player's rating
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
              canRate={true}
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