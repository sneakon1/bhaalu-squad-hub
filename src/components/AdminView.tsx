import React, { useState } from 'react';
import { Plus, Calendar, MapPin, Clock, Save, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Game {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  description: string;
  maxPlayers: number;
}

const AdminView = () => {
  const [games, setGames] = useState<Game[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    venue: '',
    description: '',
    maxPlayers: 16
  });

  const [isAddingGame, setIsAddingGame] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.title,
          date: new Date(`${formData.date}T${formData.time}`),
          location: formData.venue,
          description: formData.description,
          maxPlayers: Number(formData.maxPlayers),
          createdBy: 'admin', // Replace with actual user info if needed
        })
      });
      const game = await res.json();
      if (!res.ok) throw new Error(game.message || 'Failed to add game');
      fetchGames();
      setFormData({
        title: '',
        date: '',
        time: '',
        venue: '',
        description: '',
        maxPlayers: 16
      });
      setIsAddingGame(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const fetchGames = async () => {
    try {
      const res = await fetch('http://localhost:5000/games/upcoming');
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch games');
      setGames(data.map((g: any) => ({
        id: g._id,
        title: g.name,
        date: g.date,
        time: new Date(g.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        venue: g.location,
        description: g.description || '',
        maxPlayers: g.maxPlayers || 16
      })));
    } catch (err) {
      setGames([]);
    }
  };

  // Fetch games on mount
  React.useEffect(() => {
    fetchGames();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-primary to-primary-light rounded-xl">
            <Settings className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-poppins font-bold text-foreground">
              Admin Panel
            </h1>
            <p className="text-muted-foreground">
              Manage games and squad activities
            </p>
          </div>
        </div>
      </div>

      {/* Add Game Button */}
      <div className="flex justify-center">
        <Button 
          onClick={() => setIsAddingGame(true)}
          className="btn-action"
          size="lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Game
        </Button>
      </div>

      {/* Add Game Form */}
      {isAddingGame && (
        <Card className="card-field p-6 max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center space-x-3 mb-4">
              <Plus className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-poppins font-semibold">Add New Game</h2>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Game Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Sunday League Match"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="venue">Venue</Label>
                <Input
                  id="venue"
                  name="venue"
                  value={formData.venue}
                  onChange={handleInputChange}
                  placeholder="e.g., Central Park Field A"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  name="time"
                  type="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxPlayers">Max Players</Label>
                <Input
                  id="maxPlayers"
                  name="maxPlayers"
                  type="number"
                  min="10"
                  max="22"
                  value={formData.maxPlayers}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Additional details about the game..."
                rows={3}
              />
            </div>
            
            <div className="flex space-x-3">
              <Button type="submit" className="btn-field">
                <Save className="w-4 h-4 mr-2" />
                Save Game
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsAddingGame(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Games List */}
      <div className="space-y-6">
        <h2 className="text-2xl font-poppins font-bold text-center">Scheduled Games</h2>
        
        <div className="grid gap-6">
          {games.map((game) => (
            <Card key={game.id} className="card-field p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-poppins font-semibold text-foreground">
                      {game.title}
                    </h3>
                    {game.description && (
                      <p className="text-muted-foreground mt-1">{game.description}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    <span className="font-medium">
                      {new Date(game.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-primary" />
                    <span className="font-medium">{game.time}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    <span className="font-medium">{game.venue}</span>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-border">
                  <span className="text-sm text-muted-foreground">
                    Max Players: {game.maxPlayers}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminView;