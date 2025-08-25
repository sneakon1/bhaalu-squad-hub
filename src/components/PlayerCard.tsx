import { useState } from 'react';
import { Star, MapPin, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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

interface PlayerCardProps {
  player: Player;
  canRate?: boolean;
  onRate?: (playerId: string, rating: number) => void;
}

const PlayerCard = ({ player, canRate = false, onRate }: PlayerCardProps) => {
  const [userRating, setUserRating] = useState<number>(0);
  const [hoveredStar, setHoveredStar] = useState<number>(0);

  const handleStarClick = (rating: number) => {
    if (!canRate) return;
    setUserRating(rating);
    onRate?.(player.id, rating);
  };

  const renderStars = (rating: number, interactive = false) => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      const isFilled = starValue <= (interactive ? (hoveredStar || userRating) : rating);
      
      return (
        <Star
          key={index}
          className={`w-4 h-4 transition-colors ${
            isFilled 
              ? 'fill-yellow-400 text-yellow-400' 
              : 'text-muted-foreground'
          } ${
            interactive 
              ? 'cursor-pointer hover:text-yellow-400' 
              : ''
          }`}
          onClick={() => interactive && handleStarClick(starValue)}
          onMouseEnter={() => interactive && setHoveredStar(starValue)}
          onMouseLeave={() => interactive && setHoveredStar(0)}
        />
      );
    });
  };

  const getPositionColor = (position: string) => {
    switch (position.toLowerCase()) {
      case 'striker':
      case 'forward':
        return 'bg-red-100 text-red-800';
      case 'midfielder':
      case 'midfield':
        return 'bg-blue-100 text-blue-800';
      case 'defender':
      case 'defense':
        return 'bg-green-100 text-green-800';
      case 'goalkeeper':
      case 'goalie':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="card-player relative overflow-hidden">
      {/* Online indicator */}
      {player.isOnline && (
        <div className="absolute top-3 right-3 w-3 h-3 bg-green-400 rounded-full border-2 border-card animate-pulse"></div>
      )}

      {/* Rating overlay on avatar */}
      <div className="relative mb-4 flex justify-center">
        <div className="relative">
          <Avatar className="w-20 h-20 border-4 border-primary/20">
            <AvatarImage src={player.avatar} alt={player.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
              {player.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          
          {/* Rating badge */}
          <div className="absolute -bottom-1 -right-1 bg-card border-2 border-primary rounded-full px-2 py-1 min-w-[3rem] text-center">
            <div className="text-xs font-bold text-primary">
              {player.rating.toFixed(1)}
            </div>
            <div className="flex justify-center">
              {renderStars(player.rating)}
            </div>
          </div>
        </div>
      </div>

      {/* Player Info */}
      <div className="text-center space-y-3">
        <div>
          <h3 className="font-poppins font-semibold text-lg text-foreground">
            {player.name}
          </h3>
          <div className="flex justify-center mt-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPositionColor(player.position)}`}>
              <MapPin className="w-3 h-3 mr-1" />
              {player.position}
            </span>
          </div>
        </div>

        {/* Favorite Player */}
        <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
          <Award className="w-4 h-4" />
          <span>Favorite: {player.favoritePlayer}</span>
        </div>

        {/* Rating Info */}
        <div className="text-xs text-muted-foreground">
          Based on {player.totalRatings} rating{player.totalRatings !== 1 ? 's' : ''}
        </div>

        {/* Interactive Rating (if can rate) */}
        {canRate && (
          <div className="border-t border-border pt-3">
            <p className="text-sm text-muted-foreground mb-2">Rate this player:</p>
            <div className="flex justify-center space-x-1">
              {renderStars(userRating, true)}
            </div>
            {userRating > 0 && (
              <div className="text-xs text-green-600 mt-2">
                Rating submitted!
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default PlayerCard;